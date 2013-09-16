(function (window) {

    var DEFAULT_SCREEN_WIDTH = 500;
    var DEFAULT_SCREEN_HEIGHT = 300;
    var DEFAULT_GRID_SIZE = 20;
    var DEFAULT_SCREEN_MARGIN = 50;

    var LEAP_GUIDE_COLOR = 'rgb(204,0,0)';
    var LEAP_GUIDE_COLOR2 = 'rgba(0,153,0,0.5)';

    var LEAP_MIN_THRESHOLD = 30;
    var LEAP_MAJOR_THRESHOLD = 60;
    var LEAP_EXT_THRESHOLD = 150;
    var LEAP_Y_THRESHOLD = 250;

    var INERTIA_RETICLE = 'rgb(204,0,0)';

    var Z_INNER_PERCENT = 0.125;

    var snap;

    angular.module('Paint').factory('Paint_Manager',
        function (Paint_Manager_Grid, Paint_Manager_Shape, Paint_Manager_Boxes, Color_Palette) {

            function Paint_Manager(params) {
                this.scope = params.scope;
                var canvas = $(params.ele).find('canvas.paint-canvas')[0];

                this.canvas = canvas;
                canvas.width = this.screen_width();
                canvas.height = this.screen_height();

                this.stage = new createjs.Stage(canvas);
                this.shapes = [];

                this.make_grid();
                var self = this;
                snap = function (n, f) {
                    if (f) return n[f] = snap(n[f]);

                    return n - (n % self.grid_size());
                };

                this.make_frame();

                this.make_draw_container();

                Paint_Manager_Boxes(this);

                this.add_button_bindings();

                this.add_form_bindings();

                this.palette = Color_Palette(this, this.margin() * 2, this.margin() * 2,
                    this.screen_width() - (4 * this.margin()),
                    this.screen_height() - (4 * this.margin())
                );

                this.init_leap();

                this.update();
            }

            Paint_Manager.prototype = {

                make_leap_guides: function () {
                    this.x_guide = this.add('shape');
                    this.x_guide.x = this.screen_width() / 2;
                    this.x_guide.graphics.ss(2).s(LEAP_GUIDE_COLOR).mt(0, 0).lt(0, this.screen_height()).es();

                    this.y_guide = this.add('shape');
                    this.y_guide.y = this.screen_height() / 2;
                    this.y_guide.graphics.ss(2).s(LEAP_GUIDE_COLOR).mt(0, 0).lt(this.screen_width(), 0).es();

                    this.x_guide_2 = this.add('shape');
                    this.x_guide_2.x = this.screen_width() / 2;
                    this.x_guide_2.graphics.ss(2).s(LEAP_GUIDE_COLOR2).mt(0, 0).lt(0, this.screen_height()).es();

                    this.y_guide_2 = this.add('shape');
                    this.y_guide_2.y = this.screen_height() / 2;
                    this.y_guide_2.graphics.ss(2).s(LEAP_GUIDE_COLOR2).mt(0, 0).lt(this.screen_width(), 0).es();

                    this.inertia_display = this.add('shape');
                    this.inertia_display.graphics.ss(1).s(LEAP_GUIDE_COLOR).dc(0, 0, 5);

                    this.inertia_display_2 = this.add('shape');
                    this.inertia_display_2.graphics.ss(1).s(LEAP_GUIDE_COLOR2).dc(0, 0, 5);
                    this.inertia = 0;
                    this.inertia_2 = 1;


                    this.z_bubble_axis = this.add('shape');
                    this.z_bubble_axis.x = this.screen_width() / 2;
                    this.z_bubble_axis.y = this.margin() / 2;
                    this.z_bubble_axis.graphics.s(LEAP_GUIDE_COLOR2).ss(2)
                        .mt((this.screen_width() / -2), 0)
                        .lt(this.screen_width() * -Z_INNER_PERCENT, 0).es()
                        .s(LEAP_GUIDE_COLOR).mt(this.screen_width() * Z_INNER_PERCENT, 0)
                        .lt(this.screen_width() / 2, 0).es();

                    this.z_bubble = this.add('shape');
                    this.z_bubble.graphics.f('rgb(0,0,0)').r(-10, -20, 10, 40).ef();
                },

                add: function (item) {
                    switch (item) {
                        case 'shape':
                            var shape = new createjs.Shape();
                            return this.add(shape);
                            break;

                        case 'container':
                            var container = new createjs.Container();
                            return this.add(container);
                            break;

                        default:
                            this.stage.addChild(item);
                            return item;
                    }
                },

                init_leap: function () {
                    if (window.Leap) {
                        this.ts = 0;
                        this.inertia = 0;

                        this.make_leap_guides();

                        window.Leap.loop({enableGestures: true}, _.bind(this._leaped, this));
                    }

                },

                _set_guides: function (point, which) {

                    var x_guide = which == 1 ? this.x_guide_2 : this.x_guide;
                    var y_guide = which == 1 ? this.y_guide_2 : this.y_guide;
                    var point_x = snap((point[0] * this.screen_width()));

                    var inertial_display = (which == 1) ? this.inertia_display_2 : this.inertia_display;
                    var inertia_key;
                    if (which == 0) {
                        inertia_key = 'inertia';
                    } else {
                        inertia_key = 'inertia_2';
                    }

                    if (point[3] > 30) {
                        this[inertia_key] -= 5;
                    } else {
                        ++this[inertia_key];
                    }

                    this[inertia_key] = Math.max(1, Math.min(1000, this[inertia_key]));

                    inertial_display.scaleX = inertial_display.scaleY = Math.sqrt(this[inertia_key] / 20);

                    if (this[inertia_key] > 50) {
                        inertial_display.visible = true;
                        this.update();
                        return;
                    } else {
                        inertial_display.visible = true;
                    }

                    var ox = x_guide.x;
                    var oy = y_guide.y;

                    if (!isNaN(point_x)) {
                        if (isNaN(x_guide.x)) {
                            x_guide.x = point_x
                        } else {
                            x_guide.x = 0.8 * x_guide.x + 0.2 * point_x;
                        }
                    }

                    snap(x_guide, 'x');

                    var y = 1 - point[1];

                    var point_y = snap(y * this.screen_height());

                    if (!isNaN(point_y)) {
                        if (isNaN(y_guide.y)) {
                            y_guide.y = point_y
                        } else {
                            y_guide.y = 0.8 * y_guide.y + 0.2 * point_y;
                        }
                    }

                    snap(y_guide, 'y');

                    inertial_display.x = x_guide.x;
                    inertial_display.y = y_guide.y;

                },

                update_leap_guides: function (points, from_leap) {

                    _.each(points, function (point, i) {
                        this._set_guides(point, i);
                    }, this);

                    if (this.active_shape) {
                        this.active_shape.set_x(Math.min(this.x_guide.x, this.x_guide_2.x) - this.margin());
                        this.active_shape.set_width(Math.abs(this.x_guide.x - this.x_guide_2.x));
                        this.active_shape.set_y(Math.min(this.y_guide.y, this.y_guide_2.y) - this.margin());
                        this.active_shape.set_height(Math.abs(this.y_guide.y - this.y_guide_2.y));
                        this.active_shape.draw();
                        this.show_boxes(null, true);
                    }
                    this.update();
                },

                _leaped: function (obj) {
                    var self = this;
                    this.ts = obj.timestamp;

                    if (obj.gestures && obj.gestures.length) {
                       // console.log(obj.gestures);
                        if (_.find(obj.gestures, function (g) {
                            return g.type = 'keyTap'
                        })) {
                            this.active_shape = null;
                            this.move_boxes(false);
                        }
                    }
                    if (obj.hands.length > 0) {
                        // only continue if you have two hands

                        // average all found points to a single point for each hand.

                        var points = _.map(obj.hands, function (hand) {
                            if ((!hand.fingers) || (!hand.fingers.length)) return false;

                            var avg_finger = _.reduce(hand.fingers, function (out, finger) {
                                var fsp = _.map(finger.stabilizedTipPosition, _.identity);
                                //    console.log('tv:', finger.tipVelocity);
                                fsp[3] = _.reduce(finger.tipVelocity, function (o, v) {
                                    return o + Math.abs(v)
                                }, 0) / 3;

                                return _.map(out, function (v, i) {
                                    return v + fsp[i];
                                })
                            }, [0, 0, 0, 0]);
                            return _.map(avg_finger, function (v) {
                                return v / hand.fingers.length;
                            })
                        });

                        if (true) {
                            points = _.map(points, function (point) {
                                var pd = obj.interactionBox.normalizePoint(point);
                                point[0] = pd[0];
                                point[1] = pd[1];
                                point[2] = pd[2];
                                return point;
                            });

                            self.update_leap_guides(points, true);
                        }
                    }
                },

                add_form_bindings: function () {
                    this.scope.set_current_color = _.bind(this.set_current_color, this);
                    this.scope.choose_color = _.bind(this.choose_color, this);
                },

                choose_color: function () {
                    this.palette.show();
                },

                set_current_color: function (c) {
                    this._current_color = c;
                    if (this.active_shape) {
                        this.active_shape.set_color(c);
                        this.update();
                    }

                },

                show_boxes: function (force_show, offset) {

                    if (force_show === false) {
                        _.each(this._boxes, function (box) {
                            box.visible = false
                        });
                        return this.update();
                    }

                    var target = this.active_shape;

                    if (target && target.type == 'polygon') {
                        target = false;
                    }

                    _.each(this._boxes, function (box) {
                        box.visible = !!target;
                        if (target) box.__move_around(target, offset);
                    }, this);

                    this.update();
                },

                make_draw_container: function () {
                    this.draw_container = new createjs.Container();
                    this.frame.addChild(this.draw_container);
                },

                activate: function (shape) {
                    this.active_shape = shape;
                    this.move_boxes();
                },

                make_frame: function () {
                    this.frame = new createjs.Container();
                    this.frame.x = this.frame.y = this.margin();

                    this.add(this.frame);
                },

                add_button_bindings: function () {
                    this.scope.add_rectangle = this._shape_button_fn('rectangle');
                    this.scope.add_oval = this._shape_button_fn('oval');
                    this.scope.add_triangle = this._shape_button_fn('triangle');
                    this.scope.rotate = _.bind(this.rotate, this);
                },

                rotate: function () {
                    if (this.active_shape) {
                        this.active_shape.set_rotation(this.active_shape.get_rotation() + 45);
                        this.active_shape.draw();
                        this.update();
                    }
                },

                _shape_button_fn: function (type) {
                    return _.bind(function () {
                        this.add_shape(type);
                    }, this);
                },

                shapes_to_dc: function () {
                    this.draw_container.removeAllChildren();

                    _.each(this.shapes, function (shape) {
                        this.addChild(shape.container);
                    }, this.draw_container);
                },

                add_shape: function (type) {
                    var shape = Paint_Manager_Shape(this, type);
                    shape.set_color(this.scope.current_color);
                    this.shapes.push(shape);
                    this.shapes_to_dc();

                    this.update();
                    return shape;
                },

                update: function () {
                    this.stage.update();
                },

                make_grid: Paint_Manager_Grid,

                grid_size: function () {
                    var pc = this.scope.paint_canvas;
                    if (!pc || !pc.grid) {
                        return DEFAULT_GRID_SIZE;
                    }
                    return Number(pc.grid);
                },

                margin: function () {
                    var pc = this.scope.paint_canvas;

                    if (!pc || !pc.margin) return DEFAULT_SCREEN_MARGIN;
                    return Number(pc.margin);
                },

                screen_width: function (inner) {
                    var pc = this.scope.paint_canvas;

                    if (inner) {
                        var width = this.screen_width();
                        width -= (2 * this.margin());
                        return width;
                    }

                    if (!pc || (!pc.width)) return DEFAULT_SCREEN_WIDTH;
                    return Number(pc.width);
                },

                screen_height: function (inner) {
                    var pc = this.scope.paint_canvas;

                    if (inner) {
                        var height = this.screen_height();
                        height -= (2 * this.margin());
                        return height;
                    }

                    if (!pc || (!pc.height)) return DEFAULT_SCREEN_HEIGHT;
                    return Number(pc.height);
                }

            };

            return function (scope, ele) {
                return new Paint_Manager({scope: scope, ele: ele});
            }

        })
})
    (window);