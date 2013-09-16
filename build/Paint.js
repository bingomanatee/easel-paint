(function(){

    angular.module('Paint', []);

})(window);;(function (window) {

    var GRID_COLOR = 'rgba(0,0,0, 0.25)';

    angular.module('Paint').factory('Paint_Manager_Grid', function () {

        return function () {
            console.log('making grid');

            var width= this.screen_width(true);
            var height = this.screen_height(true);
            var grid_size = this.grid_size();

            console.log('width: ', width, 'heght:', height, 'grid_size:', grid_size);
            var grid_shape = new createjs.Shape();
            grid_shape.x = grid_shape.y = this.margin();
            var g = grid_shape.graphics.s(GRID_COLOR).ss(1);

            for (var x = 0; x <= width; x += grid_size){
                g.mt(x, 0).lt(x, height);
            }

            for (var y = 0; y <= height; y += grid_size){
                g.mt(0,y).lt(width, y);
            }

            g.es();

            this.stage.addChild(grid_shape);
            this.stage.update();

        }

    })
})(window);;(function (window) {
    var _DEBUG = false;
    var BOX_COLOR = 'rgba(0,0,0, 0.33)';

    function make_box_container(manager) {
        manager.box_container = new createjs.Container();
        manager.box_container.x = manager.box_container.y = manager.grid_size();
        manager.stage.addChild(manager.box_container);
    }

    function move_around(dim, shape, manager, HANDLE_SIZE) {
        return function (offset) {
            var target = manager.active_shape;
            if (!target) return;

            if (dim.h) {
                shape.x = target.get_right()
            } else {
                shape.x = target.get_left() - HANDLE_SIZE;
            }

            if (dim.v) {
                shape.y = target.get_bottom();
            } else {
                shape.y = target.get_top() - HANDLE_SIZE;
            }

            if (offset){
                shape.x += manager.grid_size();
                shape.y += manager.grid_size();
            }
        }
    }

    function make_move_boxes(manager) {

        manager.move_boxes = function () {

            var HANDLE_SIZE = manager.grid_size();
            var active_shape = manager.active_shape;

            if (!active_shape) {
                _.each(manager._boxes, function (box) {
                    box.visible = false;
                })
            } else {
              if (_DEBUG)  console.log('active shape x:', active_shape.get_x(), ',y:', active_shape.get_y(),
                    'width:', active_shape.get_width(), ',h:', active_shape.get_height());
                if (_DEBUG)    console.log('    left:', active_shape.get_left(), ', top:', active_shape.get_top(),
                    ',right:', active_shape.get_right(), ',bottom:', active_shape.get_bottom()
                );

                _.each(manager._box_hs, function (boxes, i) {
                    _.each(boxes, function (box) {
                        box.visible = true;
                        switch (i) {
                            case 0:
                                box.x = active_shape.get_left();
                                break;

                            case 1:
                                box.x = active_shape.get_right() + HANDLE_SIZE;
                                break;
                        }
                    });
                })

                _.each(manager._box_vs, function (boxes, i) {
                    _.each(boxes, function (box) {
                        box.visible = true;
                        switch (i) {
                            case 0:
                                box.y = active_shape.get_top();
                                break;

                            case 1:
                                box.y = active_shape.get_bottom() + HANDLE_SIZE;
                                break;
                        }
                    });
                })
            }

            manager.update();
        }
    }

    function make_boxes(manager) {

        function gd(value) {
            return value - (value % manager.grid_size());
        }

        var HANDLE_SIZE = manager.grid_size();

        manager._box_hs = [
            [],
            []
        ];
        manager._box_vs = [
            [],
            []
        ];

        manager._boxes = _.map(
            [
                {h: 0, v: 0},
                {h: 1, v: 0},
                {h: 0, v: 1},
                {h: 1, v: 1}
            ], function (dim) {
                var shape = new createjs.Shape();
                manager.box_container.addChild(shape);
                manager._box_hs[dim.h].push(shape);
                manager._box_vs[dim.v].push(shape);

                shape.graphics.f(BOX_COLOR).r(0, 0, HANDLE_SIZE, HANDLE_SIZE).es();
                shape.__move_around = move_around(dim, shape, manager, HANDLE_SIZE);

                shape.addEventListener('mousedown', function (event) {
                    if (!manager.active_shape) return;

                    event.addEventListener('mousemove', function (evt) {

                        _.each(manager._box_hs[dim.h], function (shape) {
                            shape.x = gd(evt.stageX);
                        });
                        _.each(manager._box_vs[dim.v], function (shape) {
                            shape.y = gd(evt.stageY);
                        });

                        if (manager.active_shape) {
                            var x = Math.min(manager._box_hs[1][0].x, manager._box_hs[0][0].x);
                            var y = Math.min(manager._box_vs[1][0].y, manager._box_vs[0][0].y);

                            var width = Math.max(manager.grid_size(), Math.max(manager._box_hs[1][0].x, manager._box_hs[0][0].x) - x - manager.grid_size());
                            var height = Math.max(manager.grid_size(), Math.max(manager._box_vs[1][0].y, manager._box_vs[0][0].y) - y - manager.grid_size());

                            manager.active_shape.set_width(width).set_height(height).set_x(x).set_y(y).draw();
                            manager.update();
                        }

                        manager.update();
                    });

                });

                return shape;

            }, manager);

        manager.show_boxes();
    }

    angular.module('Paint').factory('Paint_Manager_Boxes', function () {

        return function (manager) {

            make_box_container(manager);

            make_boxes(manager);

            make_move_boxes(manager);

        }

    })
})(window);;(function (window) {

    var snap;

    function Point_Manager_Shape(manager, type) {

        snap = function(n){
            return Math.floor(n - manager.grid_size());
        };

        this.type = type;
        this.manager = manager;
        this.container = new createjs.Container();
        this.shape = new createjs.Shape();
        this.container.addChild(this.shape);
        this.init_dims();
        this.make_draggable();
        this.draw();
    }

    Point_Manager_Shape.prototype = {

        init_dims: function () {
            this._rotation = 0;
            this._x = this._y = 0;
            this._width = this.manager.grid_size() * 4;
            this._height = this.manager.grid_size() * 4;
            this._color = 'rgb(0,0,0)';
        },

        make_draggable: function () {
            this.shape.addEventListener('mousedown', _.bind(this._on_mousedown, this));
        },

        _on_mousedown: function (event) {
            this.manager.activate(this);
            event.addEventListener('mousemove', _.bind(this._on_mousemove(event), this));

            event.addEventListener('mouseup', _.bind(this._on_mouseup, this));
        },

        _on_mouseup: function () {
        },

        _on_mousemove: function (event) {
            var self = this;
            var start_x = this.get_x();
            var start_y = this.get_y();

            return function (move_event) {

                var x = start_x + move_event.stageX - event.stageX;
                x = Math.max(0, Math.min(x, this.manager.screen_width(true) - this.get_width()));
                x -= x % this.manager.grid_size();
                var y = start_y + move_event.stageY - event.stageY;
                y = Math.max(0, Math.min(y, this.manager.screen_height(true) - this.get_height()));
                y -= y % this.manager.grid_size();

                this.set_x(x);
                this.set_y(y);
                this.draw();
                this.manager.move_boxes();

                this.manager.update();
            }
        },

        draw: function () {

            this.shape.graphics.c().f(this.get_color());
            var x2 = this.get_width() / 2;
            var y2 = this.get_height() / 2;
            this.shape.x = x2;
            this.shape.y = y2;

            this.shape.rotation = this.get_rotation();
            switch (this.type) {
                case 'rectangle':
                    this.shape.graphics.mt(-x2, -y2).lt(x2, -y2).lt(x2, y2).lt(-x2, y2).ef();
                    break;

                case 'oval':
                    var diameter = Math.min(this.get_width(), this.get_height());
                    var radius = diameter / 2;
                    this.shape.graphics.dc(0, 0, radius);

                    this.shape.scaleX = this.shape.scaleY = 1;

                    if (this.get_width() > this.get_height()) {
                        this.shape.scaleX = this.get_width() / this.get_height();
                    } else if (this.get_width() < this.get_height()) {
                        this.shape.scaleY = this.get_height() / this.get_width();
                    }
                    break;

                case 'triangle':
                    this.shape.graphics.mt(-x2, y2)
                        .lt(0, -y2)
                        .lt(x2, y2);
                    break;

                default:
                    throw new Error('bad type ' + this.type);
            }
        },

        /* ******************** PROPERTIES ****************** */

        set_rotation: function (r) {
            this._rotation = r % 360;
        },

        get_rotation: function () {
            return this._rotation;
        },

        get_color: function () {
            return this._color;
        },

        set_color: function (color) {
            //@TODO: validate
            this._color = color;
            this.draw();
            return this;
        },

        get_width: function () {
            return this._width;
        },

        get_height: function () {
            return this._height;
        },

        set_width: function (w) {
            this._width = w;
            return this;
        },

        set_height: function (h) {
            this._height = h;
            return this;
        },

        get_x: function () {
            return this._x;
        },

        get_center_h: function () {
            return (this.get_left() + this.get_right()) / 2;
        },

        get_center_v: function () {
            return (this.get_top() + this.get_bottom()) / 2;
        },

        get_y: function () {
            return this._y;
        },

        get_left: function () {
            return this.get_x();
        },

        get_top: function () {
            return this.get_y();
        },

        get_bottom: function () {
            return this.get_height() + this.get_y();
        },

        get_right: function () {
            return this.get_width() + this.get_x();
        },

        set_x: function (x) {
            this._x = this.container.x = x;
            return this;
        },

        set_y: function (y) {
            this._y = this.container.y = y;
            return this;
        }

    };

    angular.module('Paint').factory('Paint_Manager_Shape', function () {

        return function (manager, type) {
            return new Point_Manager_Shape(manager, type);
        }

    })
})(window);;(function () {

    var HUES = 18;
    var SWATCH_HEIGHT = 24;
    var SHADES = 8;
    var VALUES = 8;

    var _hsl_template = _.template('hsl(<%= Math.max(0, Math.min(360, Math.round(h))) %>, <%= Math.max(0, Math.min(100, Math.round(s))) %>%, <%= Math.max(0, Math.min(100, Math.round(v))) %>%)');
    /* ***************** Color Palette ******************* */

    function Color_Palette(manager, x, y, width, height) {
        this.manager = manager;
        this.width = width;
        this.height = height;
        this.x = x;
        this.y = y;

        this.init_cp_layer();
        this.manager.stage.addChild(this.palette);
        this.show(false);
    }

    Color_Palette.prototype = {

        ld: function (hue) {
            var self = this;

            return function (event) {
                self.lighten.removeAllChildren();
                self.darken.removeAllChildren();
                var w = self.width / VALUES;
                _.each(_.range(50, 100, 50 / VALUES), function (value, i) {
                    var x = w * i;
                    _.each([100, 50, 25, 10], function (sat, i) {
                        var swatch = self.make_swatch(hue, sat, value, x, SWATCH_HEIGHT * i, w, SWATCH_HEIGHT);
                        swatch.addEventListener('mousedown', self.color_choice(hue, 100, value));
                        self.lighten.addChild(swatch);
                    });


                    _.each([100, 50, 25, 10], function (sat, i) {
                        swatch = self.make_swatch(hue, sat, 100 - value, x, -SWATCH_HEIGHT * i, w, SWATCH_HEIGHT);
                        swatch.addEventListener('mousedown', self.color_choice(hue, 100, 100 - value));
                        self.darken.addChild(swatch);
                    });
                });
                self.update();
            }
        },

        color_choice: function (hue, sat, value) {

            return _.bind(function (event) {
                console.log('chosen hsv ', hue, sat, value);
                this.show(false);
                var color = this._color_string(hue, sat, value);
                this.manager.scope.current_color = color;
                this.manager.scope.$apply();
            }, this);

        },

        update: function () {
            this.manager.update();
        },

        init_cp_layer: function () {
            this.palette = new createjs.Container();
            this.palette.x = this.x;
            this.palette.y = this.y;

            this.lighten = new createjs.Container();
            this.darken = new createjs.Container();
            this.darken.y = this.height - SWATCH_HEIGHT;
            this.palette.addChild(this.darken, this.lighten);

            var back = new createjs.Shape();
            back.graphics.f('rgba(200,200,200, 0.25)').r(0, 0, this.width, this.height).ef().s('rgba(100,100,100,0.25)').ss(1).r(0, 0, this.width, this.height).es();

            this.palette.addChild(back);
            var hue_width = this.width / HUES;
            var y = (this.height ) / 2 - SWATCH_HEIGHT;

            _.each(_.range(0, 360, 360 / HUES), function (hue, i) {
                var x = i * hue_width;
                var swatch = this.make_swatch(hue, 100, 50, x, y, hue_width, SWATCH_HEIGHT);
                this.palette.addChild(swatch);

                swatch.addEventListener('mousedown', this.ld(hue));
            }, this);

            y += SWATCH_HEIGHT;
            var grey_width = this.width / (SHADES + 1);
            _.each(_.range(0, 101, 100 / SHADES), function (lightness, i) {
                var x = i * grey_width;
                var swatch = this.make_swatch(0, 0, lightness, x, y, grey_width, SWATCH_HEIGHT);
                swatch.addEventListener('mousedown', this.color_choice(0, 0, lightness));
                this.palette.addChild(swatch);
            }, this);


        },

        make_swatch: function (hue, sat, value, x, y, w, h) {

            var swatch = new createjs.Shape();
            swatch.x = x;
            swatch.y = y;
            swatch.graphics.f(this._color_string(hue, sat, value)).r(0, 0, w, h).ef();

            return swatch;
        },

        _color_string: function (h, s, v) {
            var data = {h: h, s: s, v: v};
            return _hsl_template(data);
        },

        show: function (hide) {
            this.palette.visible = hide === false ? false : true;
            this.manager.update();
        }


    };

    var app = angular.module('Paint');
    app.factory('Color_Palette', function () {

        return function (manager, x, y, width, height) {

            return new Color_Palette(manager,x, y, width, height);

        }


    })

})(window);;(function (window) {

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
    (window);;(function () {

    var paint = angular.module('Paint');

    paint.directive('paintEditor', function InjectingFunction(Paint_Manager) {
        //@TODO: inject template root.
        return {
            templateUrl: '/js/paint/directives/editor.html',
            compile: function CompilingFunction($templateElement, $templateAttributes) {

                return function LinkingFunction($scope, $linkElement, $linkAttributes) {
                    console.log('attrs: ', $linkAttributes);
                    var width = Number($linkAttributes.width || 400);
                    var height = Number($linkAttributes.height || 300);
                    var grid = Number($linkAttributes.grid || 30);
                    var margin = Number($linkAttributes.margin || 50);
                    $scope.paint_canvas = {width: width, height: height, grid: grid, margin: margin};

                    $scope.current_color="rgb(255, 0, 0)";

                    $scope.paint_manager = Paint_Manager($scope, $linkElement);

                };
            }
        };
    });

})(window);