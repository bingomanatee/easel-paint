(function(){

    angular.module('Paint', []);

})(window);;(function (window) {

    var GRID_COLOR = 'rgba(0,0,0, 0.25)';

    angular.module('Paint').factory('Paint_Manager_Grid', function () {

        return function (manager) {
            console.log('making grid');

            var width= manager.screen_width(true);
            var height = manager.screen_height(true);
            var grid_size = manager.grid_size();

            var grid_shape = new createjs.Shape();
            grid_shape.x = grid_shape.y = manager.margin();
            var g = grid_shape.graphics.s(GRID_COLOR).ss(1);

            for (var x = 0; x <= width; x += grid_size){
                g.mt(x, 0).lt(x, height);
            }

            for (var y = 0; y <= height; y += grid_size){
                g.mt(0,y).lt(width, y);
            }

            g.es();

            manager.stage.addChild(grid_shape);
            manager.stage.update();

        }

    })
})(window);;(function (window) {
    var _DEBUG = false;
    var BOX_COLOR = 'rgba(0,0,0, 0.33)';
    var BOX_SIZE = 15;

    function Drag_Box(manager, h, v) {
        this.manager = manager;
        this.h = h;
        this.v = v;
        this.shape = new createjs.Shape();

        var x = h ? 0 : -BOX_SIZE;
        var y = v ? 0 : -BOX_SIZE;

        this.shape.graphics.f(BOX_COLOR).r(x, y, BOX_SIZE, BOX_SIZE).ef();
        manager.box_container.addChild(this.shape);

        this.shape.addEventListener('mousedown', _.bind(this._on_mousedown, this));
    }

    Drag_Box.prototype = {
        update: function () {
            if (this.manager.active_shape) {
                this.shape.visible = true;
                if (this.v) { // bottom
                    this.shape.y = this.manager.active_shape.get_bottom();
                } else { //top
                    this.shape.y = this.manager.active_shape.get_top();
                }
                if (this.h) { // right
                    this.shape.x = this.manager.active_shape.get_right();
                } else { // left
                    this.shape.x = this.manager.active_shape.get_left();
                }
            } else {
                this.shape.visible = false;
            }
        },

        _on_mousedown: function (event) {
            var as = this.manager.active_shape;
            var self = this;
            if (!as) {
                return;
            }
            var left = as.get_left();
            var right = as.get_right();
            var top = as.get_top();
            var bottom = as.get_bottom();
            var width = as.get_width();
            var height = as.get_height();
            var min_size = this.manager.grid_size();
            event.addEventListener('mousemove', function (e2) {
                var dx = e2.stageX - event.stageX;
                var dy = e2.stageY - event.stageY;

                if (self.h) { // right
                    as.set_width(self.manager.snap(Math.max(min_size, width + dx)));
                } else { // left
                    var new_x = self.manager.snap(Math.max(0, Math.min(right - min_size, left + dx)));
                    as.set_left(new_x);
                    as.set_width(width - (new_x - left));
                }

                if (self.v) { // bottom
                    as.set_height(self.manager.snap(Math.max(min_size, height + dy)));
                } else { // top
                    var new_y = self.manager.snap(Math.max(0, Math.min(bottom - min_size, top + dy)));
                    as.set_top(new_y);
                    as.set_height(height - (new_y - top));
                }
                as.draw();
                self.manager.update(false);
            });
        }
    }

    function make_box_container(manager) {
        manager.box_container = manager.add('container', true);
    }

    function make_boxes(manager) {
        manager.boxes = [
            new Drag_Box(manager, 0, 0) ,
            new Drag_Box(manager, 0, 1),
            new Drag_Box(manager, 1, 0),
            new Drag_Box(manager, 1, 1)
        ];

    }

    angular.module('Paint').factory('Paint_Manager_Boxes', function () {

        return function (manager) {

            make_box_container(manager);

            make_boxes(manager);

        }

    })
})(window);;(function (window) {

    var OUTLINE = 'rgb(204,0,0)';
    var WHITE = 'rgb(255,255,255)';
    var POINT_SIZE = 10;

    angular.module('Paint').factory('Paint_Manager_Polygon', function () {

        function add_point_to_poly(shape, manager) {
            if (manager.active_shape && manager.active_shape.type == 'polygon') {
                manager.active_shape.add_point(shape);
                manager.active_shape.draw();
            }
        }

        function _pp_mouse_down(shape, manager) {
            return function (event) {
                switch (manager.poly_point_mode) {
                    case 'move':
                        var ox = shape.x;
                        var oy = shape.y;
                        event.addEventListener('mousemove', function (mm_event) {
                            var dx = mm_event.stageX - event.stageX;
                            var dy = mm_event.stageY - event.stageY;
                            shape.x = manager.snap(ox + dx);
                            shape.y = manager.snap(oy + dy);
                            manager.active_shape.draw();
                            manager.update();
                        });
                        break;

                    case 'delete':
                        manager.active_shape.delete_point(shape);
                        manager.ppp.removeChild(shape);
                        manager.active_shape.draw();
                        manager.update();
                        break;

                    case 'add':
                        // currently disallowing adding points on same place.
                        break;
                }
            }
        }

        function _pp_click(manager) {

            return function (event) {
                var shape = new createjs.Shape();
                if (manager.poly_point_mode == 'add') {
                    shape.x = manager.snap(event.stageX) - manager.margin() * 2;
                    shape.y = manager.snap(event.stageY) - manager.margin() * 2;
                    shape.graphics.f(WHITE).r(-POINT_SIZE / 2, -POINT_SIZE / 2, POINT_SIZE, POINT_SIZE)
                        .s(OUTLINE).ss(1).r(-POINT_SIZE / 2, -POINT_SIZE / 2, POINT_SIZE, POINT_SIZE);

                    shape.addEventListener('mousedown', _pp_mouse_down(shape, manager));

                    console.log('clicked on pp shape');
                    manager.ppp.addChild(shape);

                    add_point_to_poly(shape, manager);
                }
                manager.update();
            }
        }

        /**
         * this creates a fairly involved layer for managing poly point data.
         *
         * - the main poly_points container, added to the manager
         *   - a pp_shape, for catching cicks / adding points
         *   - a poly points points container (ppp) for holding point objects
         *     representing the path of the polygon
         */
        return function (manager) {

            manager.poly_points = manager.add('container', true);
            var pp_shape = new createjs.Shape(); // listens for clicks, to add points
            pp_shape.graphics.f('rgba(255,255,255,0.01)').r(0, 0, manager.screen_width(), manager.screen_height()).ef();
            manager.poly_points.addChild(pp_shape);

            manager.ppp = new createjs.Container();
            manager.ppp.x = manager.ppp.y = manager.margin();
            manager.poly_points.addChild(manager.ppp);

            manager.poly_points.visible = false;

            pp_shape.addEventListener('mousedown', _pp_click(manager));

            manager.scope.add_polygon = function () {
                console.log('adding polygon');

                manager.poly_points.visible = true;
                manager.active_button = 'polygon';
                manager.poly_point_mode = 'add';
                manager.active_shape = manager.add_shape('polygon');
                manager.update();
            }

            manager.scope.show_poly_buttons = function(){
                return manager.poly_points.visible;
            };

            manager.scope.close_poly = function(){
                manager.poly_points.visible = false;
                manager.ppp.removeAllChildren();
                if (manager.active_shape && manager.active_shape.type == 'polygon'){
                    manager.active_shape.reflect_points();
                }
                manager.update();
            }

            manager.scope.add_polygon_point = function () {
                manager.scope.poly_point_mode = manager.poly_point_mode = 'add';
            }

            manager.scope.delete_polygon_point = function () {
                manager.scope.poly_point_mode = manager.poly_point_mode = 'delete';
            }

            manager.scope.move_polygon_point = function () {
                manager.scope.poly_point_mode = manager.poly_point_mode = 'move';
            }

            manager.scope.draw_button_pp_class = function (which) {
                var classes = [ which + '_poly_point'];
                if (which == manager.poly_point_mode) classes.push('active');
                return classes.join(' ');
            }
        }

    })
})(window);;(function (window) {

    var GRID_COLOR = 'rgba(0,0,0, 0.25)';

    var LEAP_GUIDE_COLOR = 'rgb(204,0,0)';
    var LEAP_GUIDE_COLOR2 = 'rgba(0,153,0,0.5)';

    var LEAP_MIN_THRESHOLD = 30;
    var LEAP_MAJOR_THRESHOLD = 60;
    var LEAP_EXT_THRESHOLD = 150;
    var LEAP_Y_THRESHOLD = 250;

    var INERTIA_RETICLE = 'rgb(204,0,0)';

    var Z_INNER_PERCENT = 0.125;

    angular.module('Paint').factory('Paint_Manager_Leap', function () {

        function _x_guide(manager, color) {
            var x_guide = manager.add('shape');
            x_guide.x = manager.screen_width() / 2;
            x_guide.graphics.ss(2).s(color).mt(0, 0).lt(0, manager.screen_height()).es();
            return x_guide;
        }

        function _y_guide(manager, color) {
            var y_guide = manager.add('shape');
            y_guide.y = manager.screen_height() / 2;
            y_guide.graphics.ss(2).s(color).mt(0, 0).lt(manager.screen_width(), 0).es();
            return y_guide;
        }

        function _z_bubble(manager) {
            // currently not used
            manager.z_bubble_axis = manager.add('shape');
            manager.z_bubble_axis.x = manager.screen_width() / 2;
            manager.z_bubble_axis.y = manager.margin() / 2;
            manager.z_bubble_axis.graphics.s(LEAP_GUIDE_COLOR2).ss(2)
                .mt((manager.screen_width() / -2), 0)
                .lt(manager.screen_width() * -Z_INNER_PERCENT, 0).es()
                .s(LEAP_GUIDE_COLOR).mt(manager.screen_width() * Z_INNER_PERCENT, 0)
                .lt(manager.screen_width() / 2, 0).es();

            manager.z_bubble = manager.add('shape');
            manager.z_bubble.graphics.f('rgb(0,0,0)').r(-10, -20, 10, 40).ef();
        }

        function make_leap_guides(manager) {
            manager.ts = 0;
            manager.inertia = 0;

            manager.x_guide = _x_guide(manager, LEAP_GUIDE_COLOR);
            manager.y_guide = _y_guide(manager, LEAP_GUIDE_COLOR);
            manager.x_guide_2 = _x_guide(manager, LEAP_GUIDE_COLOR2);
            manager.y_guide_2 = _y_guide(manager, LEAP_GUIDE_COLOR2);

            manager.inertia_display = manager.add('shape');
            manager.inertia_display.graphics.ss(1).s(LEAP_GUIDE_COLOR).dc(0, 0, 5);

            manager.inertia_display_2 = manager.add('shape');
            manager.inertia_display_2.graphics.ss(1).s(LEAP_GUIDE_COLOR2).dc(0, 0, 5);
            manager.inertia = 0;
            manager.inertia_2 = 1;
        }

        function _smooth(old_value, new_value, manager) {
            if (!isNaN(new_value)) {
                if (isNaN(old_value)) {
                    return manager.snap(new_value);
                } else {
                    return  manager.snap(0.8 * old_value + 0.2 * new_value);
                }
            } else {
                return manager.snap(old_value);
            }
        }

        function _set_guides(manager, point, which) {

            var x_guide = which == 1 ? this.x_guide_2 : this.x_guide;
            var y_guide = which == 1 ? this.y_guide_2 : this.y_guide;
            var point_x = this.snap((point[0] * this.screen_width()));
            var y = 1 - point[1];
            var point_y = this.snap(y * this.screen_height());
            var inertial_display = (which == 1) ? this.inertia_display_2 : this.inertia_display;
            var inertia_key = which == 0 ? 'inertia' : 'inertia_2';

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

            inertial_display.x = x_guide.x = _smooth(x_guide.x, point_x, manager);
            inertial_display.y = y_guide.y = _smooth(y_guide.y, point_y, manager);
        }

        function update_leap_guides(points, manager) {

            _.each(points, function (point, i) {
               _set_guides(manager, point, i);
            });

            if (manager.active_shape) {
                manager.active_shape.set_x(Math.min(manager.x_guide.x, manager.x_guide_2.x) - manager.margin());
                manager.active_shape.set_width(Math.abs(manager.x_guide.x - manager.x_guide_2.x));
                manager.active_shape.set_y(Math.min(manager.y_guide.y, manager.y_guide_2.y) - manager.margin());
                manager.active_shape.set_height(Math.abs(manager.y_guide.y - manager.y_guide_2.y));
                manager.active_shape.draw();
                manager.show_boxes(true);
            }
            manager.update();
        }

        function on_leap(manager) {

            return function (obj) {
                manager.ts = obj.timestamp;

                if (obj.gestures && obj.gestures.length) {
                    // console.log(obj.gestures);
                    if (_.find(obj.gestures, function (g) {
                        return g.type = 'keyTap'
                    })) {
                        manager.active_shape = null;
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

                        points = _.map(points, function (point) {
                            var pd = obj.interactionBox.normalizePoint(point);
                            point[0] = pd[0];
                            point[1] = pd[1];
                            point[2] = pd[2];
                            return point;
                        });

                       update_leap_guides(points, manager);
                }
            };
        }

        return function (manager) {

            if (window.Leap) {

                make_leap_guides(manager);
                window.Leap.loop({enableGestures: true}, on_leap(manager));
            }

        }

    })
})(window);;(function (window) {

    var temp_id = 0;
    var type_indexes = {};


    function Point_Manager_Shape(manager, type, subs) {
        this._temp_id = ++temp_id;
        this.checked = false;
        this.type = type;
        this.manager = manager;
        this.container = new createjs.Container();
        this.shape = new createjs.Shape();

        this.container.addChild(this.shape);
        this.init_dims();
        if (subs) {
            switch (type) {
                case 'group':
                    this.set_shapes(subs);
                    break;

                case 'polygon':
                    this.points = subs;
                    break;
            }
        }
        this.make_draggable();
        this.draw();
    }

    Point_Manager_Shape.prototype = {

        /* ************** CLONING **************** */

        clone: function (not_root) {
            var clone;
            switch (this.type) {
                case 'group':

                    var shape_clones = _.map(this.shapes, function (shape) {
                        var c = shape.clone(true);
                        c.set_parent();
                        return c;
                    });

                    clone = not_root ? new Point_Manager_Shape(this.manager, this.type, shape_clones) : this.manager.add_shape(this.type, shape_clones);

                    break;

                case 'polygon':
                    var point_clones = _.map(this.points, function (point) {
                        return _.pick(point, 'x', 'y');
                    });

                    clone = not_root ? new Point_Manager_Shape(this.manager, this.type, point_clones) : this.manager.add_shape(this.type, point_clones);
                    break;

                default:
                    clone = not_root ? new Point_Manager_Shape(this.manager, this.type) : this.manager.add_shape(this.type);
            }
            if (this.type != 'group') clone.set_color(this.get_color());

            clone.set_x(this.get_x());
            clone.set_y(this.get_y());
            clone.set_width(this.get_width());
            clone.set_height(this.get_height());
            clone.set_rotation(this.get_rotation());

            clone.draw();

            return clone;
        },

        /* ************** GROUPING *************** */

        /**
         * Ungroup dumps the shapes into the root level of the manager, on top of all the other shapes.
         *
         * note - shapes are (poorly) scaled after being ungrouped.
         *
         */

        ungroup: function () {
            if (this.type == 'group') {
                if (this.manager.active_shape === this) {
                    this.manager.active_shape = null;
                }
                var x = this.get_x();
                var y = this.get_y();
                var sx = this.container.scaleX;
                var sy = this.container.scaleY;
                this.shapes.forEach(function (shape) {
                    shape.add_x(x);
                    shape.add_y(y);
                    shape.scale_width(sx);
                    shape.scale_height(sy);
                    shape.set_parent(null);
                    shape.draw();
                });

                this.manager.shapes = _.reject(this.manager.shapes, function (shape) {
                    return shape._temp_id == this._temp_id;
                }, this);
                this.manager.shapes = this.manager.shapes.concat(this.shapes);
                this.manager.shapes_to_dc();
                this.manager.update();
            }

        },

        crop_group: function () {
            var x = this.shapes[0].get_x();
            var y = this.shapes[0].get_y();

            _.each(this.shapes, function (shape) {
                x = Math.min(x, shape.get_x());
                y = Math.min(y, shape.get_y());
            });

            this.set_x(x);
            this.set_y(y);

            _.each(this.shapes, function (shape) {
                shape.add_x(-x);
                shape.add_y(-y);
            });

            this.set_width(this.group_right());
            this.set_height(this.group_bottom());
        },

        group_right: function () {
            var right = this.shapes[0].get_right();
            _.each(this.shapes, function (shape) {
                right = Math.max(right, shape.get_right());
            })
            return right;
        },

        group_bottom: function () {
            var bottom = this.shapes[0].get_bottom();
            _.each(this.shapes, function (shape) {
                bottom = Math.max(bottom, shape.get_bottom());
            })
            return bottom;
        },


        /* ************* IDENTITY ******************* */

        identity: function () {
            return this._id | this._temp_id;
        },

        get_name: function () {
            if (!this.name) {
                if (!type_indexes[this.type]) {
                    type_indexes[this.type] = 0;
                }
                this.set_name(this.type + ' ' + ++type_indexes[this.type]);
            }
            return this.name;
        },

        set_name: function (name) {
            this.name = name;
        },

        echo: function (msg) {
            console.log('ECHO:', msg || '', 'shape ', this.identity(), 'tl:', this.get_x(), this.get_y(), 'wh:', this.get_width(), this.get_height());
        },

        set_shapes: function (shapes) {
            this.shapes = shapes;
            _.each(shapes, function (shape) {
                shape.parent = this;
            }, this);
            return this;
        },

        init_dims: function () {
            this._rotation = 0;
            this._x = this._y = 0;
            this._width = this.manager.grid_size() * 4;
            this._height = this.manager.grid_size() * 4;
            this._color = 'rgb(0,0,0)';
            this.points = [];
            this.shapes = [];
        },

        /* *************** POINTS ****************** */

        point_width: function () {

            if (!this.points.length) return 0;
            var min_x = this.points[0].x;
            var max_x = min_x;

            _.each(this.points.slice(1), function (p) {
                min_x = Math.min(min_x, p.x);
                max_x = Math.max(max_x, p.x);
            });

            return max_x - min_x;
        },
        point_height: function () {

            if (!this.points.length) return 0;
            var min_y = this.points[0].y;
            var max_y = min_y;

            _.each(this.points.slice(1), function (p) {
                min_y = Math.min(min_y, p.y);
                max_y = Math.max(max_y, p.y);
            });

            return max_y - min_y;
        },

        reflect_points: function () {
            if (!this.points.length) return;
            var min_x = this.points[0].x;
            var max_x = min_x;
            var min_y = this.points[0].y;
            var max_y = min_y;

            _.each(this.points.slice(1), function (p) {
                min_x = Math.min(min_x, p.x);
                max_x = Math.max(max_x, p.x);
                min_y = Math.min(min_y, p.y);
                max_y = Math.max(max_y, p.y);
            })

            this.set_top(min_y + this.manager.margin());
            this.set_left(min_x + this.manager.margin());

            this.set_width(max_x - min_x);
            this.set_height(max_y - min_y);
            var dx = this.get_width() / 2 + min_x;
            var dy = this.get_height() / 2 + min_y;
            _.each(this.points, function (p) {
                p.x -= dx;
                p.y -= dy;
            });
            this.reflected_points = true;
            this.draw();
        },

        add_point: function (point_shape) {
            this.points.push(point_shape);
        },

        delete_point: function (point_shape) {
            this.points = _.reject(this.points, function (pp) {
                return pp === point_shape;
            });
        },

        /* **************** EVENTS ********************* */

        make_draggable: function () {
            this.shape.addEventListener('mousedown', _.bind(this._on_mousedown, this));
        },

        _on_mousedown: function (event) {
            this.manager.activate(this.parent ? this.parent : this);
            event.addEventListener('mousemove', _.bind(this._on_mousemove(event), this));

            event.addEventListener('mouseup', _.bind(this._on_mouseup, this));
        },

        _on_mouseup: function () {
        },

        _on_mousemove: function (event) {
            var start_x, start_y, self = this;

            if (this.parent) {
                start_x = this.parent.get_x();
                start_y = this.parent.get_y();
            } else {
                start_x = this.get_x();
                start_y = this.get_y();

            }

            return function (move_event) {

                var x = self.manager.snap(start_x + move_event.stageX - event.stageX);
                //  x = self.manager.snap(Math.max(0, Math.min(x, this.manager.screen_width(true) - this.get_width())));
                var y = self.manager.snap(start_y + move_event.stageY - event.stageY);
                // y = self.manager.snap(Math.max(0, Math.min(y, this.manager.screen_height(true) - this.get_height())));

                if (self.parent) {
                    self.parent.set_x(x);
                    self.parent.set_y(y);
                } else {
                    self.set_x(x);
                    self.set_y(y);
                    self.draw();
                }
                self.manager.update();
            }
        },

        /* ******************** DRAW ******************* */

        draw: function () {

            var x2 = this.get_width() / 2;
            var y2 = this.get_height() / 2;
            this.shape.x = x2;
            this.shape.y = y2;

            this.shape.rotation = this.get_rotation();
            switch (this.type) {
                case 'rectangle':
                    this.shape.graphics.c().f(this.get_color());
                    this.shape.graphics.mt(-x2, -y2).lt(x2, -y2).lt(x2, y2).lt(-x2, y2);
                    this.shape.graphics.ef();
                    break;

                case 'oval':
                    this.shape.graphics.c().f(this.get_color());
                    var diameter = Math.min(this.get_width(), this.get_height());
                    var radius = diameter / 2;
                    this.shape.graphics.dc(0, 0, radius);

                    this.shape.scaleX = this.shape.scaleY = 1;

                    if (this.get_width() > this.get_height()) {
                        this.shape.scaleX = this.get_width() / this.get_height();
                    } else if (this.get_width() < this.get_height()) {
                        this.shape.scaleY = this.get_height() / this.get_width();
                    }
                    this.shape.graphics.ef();
                    break;

                case 'triangle':
                    this.shape.graphics.c().f(this.get_color());
                    this.shape.graphics.mt(-x2, y2)
                        .lt(0, -y2)
                        .lt(x2, y2);
                    this.shape.graphics.ef();
                    break;

                case 'polygon':
                    this.shape.graphics.c().f(this.get_color());
                    _.each(this.points, function (p, i) {
                        if (i == 0) {
                            this.shape.graphics.mt(p.x, p.y);
                        } else {
                            this.shape.graphics.lt(p.x, p.y);
                        }
                    }, this);
                    if (this.reflected_points) {
                        this.shape.scaleX = this.get_width() / this.point_width();
                        this.shape.scaleY = this.get_height() / this.point_height();
                    }
                    this.shape.graphics.ef();
                    break;

                case 'group':
                    this.container.removeAllChildren();
                    if (this.get_rotation()) {
                        var r_container = new createjs.Container();
                        r_container.x = this.get_width() / 2;
                        r_container.y = this.get_height() / 2;
                        r_container.rotation = this.get_rotation();
                        var r2 = new createjs.Container();
                        r2.x = -r_container.x;
                        r2.y = -r_container.y;
                        r_container.addChild(r2);
                        this.container.addChild(r_container);

                        _.each(this.shapes, function (shape) {
                            r2.addChild(shape.container);
                            //@TODO: cascade redraw?
                        }, this);
                    } else {
                        _.each(this.shapes, function (shape) {
                            this.container.addChild(shape.container);
                            //@TODO: cascade redraw?
                        }, this);
                    }


                    this.container.scaleX = this.get_width() / this.group_right();
                    this.container.scaleY = this.get_height() / this.group_bottom();

                    break;

                default:
                    throw new Error('bad type ' + this.type);
            }
        },

        /* ******************** PROPERTIES ****************** */

        get_parent: function (id) {
            return this.parent ? (id ? this.parent.identity() : this.parent) : '';
        },

        set_parent: function (parent) {
            this.parent = parent;
        },

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
            _.each(this.shapes, function (shape) {
                shape.set_color(color)
            });
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

        scale_width: function (wx) {
            this.set_width(this.get_width() * wx);
        },


        scale_height: function (hx) {
            this.set_height(this.get_height() * hx);
        },

        set_height: function (h) {
            this._height = h;
            return this;
        },

        get_x: function () {
            return this._x;
        },

        add_x: function (x) {
            this.set_x(this.get_x() + x);
        },

        add_y: function (y) {
            this.set_y(this.get_y() + y);
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

        set_top: function (top) {
            this.set_y(top);
        },

        set_left: function (left) {
            this.set_x(left);
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

        return function (manager, type, subs) {
            return new Point_Manager_Shape(manager, type, subs);
        }

    })
})(window);;(function (window) {

    var GRID_COLOR = 'rgba(0,0,0, 0.25)';

    angular.module('Paint').factory('Paint_Manager_Move', function () {


        return function (manager) {
            function _shuffle(offset){
                manager.shapes.unshift(null);
                var active_index = _.indexOf(manager.shapes, manager.active_shape);
                var other_index = active_index + offset;
                var other = manager.shapes[other_index];
                manager.shapes[other_index] =  manager.active_shape;
                manager.shapes[active_index] = other;
                manager.shapes = _.compact(manager.shapes);
                manager.shapes_to_dc();
                manager.update();
            };

            manager.scope.move_up = function () {
                if (!manager.scope.show_move('up')) return;

                _shuffle(-1);
            };

            manager.scope.move_down = function () {

                if (!manager.scope.show_move('up')) return;

                _shuffle(1);
            };

            manager.scope.show_move = function (which) {
                if ((!manager.active_shape) || (manager.shapes.length < 2)) {
                    return false;
                }

             return true;
            };

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
                        swatch.addEventListener('mousedown', self.color_choice(hue, sat, value));
                        self.lighten.addChild(swatch);
                    });


                    _.each([100, 50, 25, 10], function (sat, i) {
                        swatch = self.make_swatch(hue, sat, 100 - value, x, -SWATCH_HEIGHT * i, w, SWATCH_HEIGHT);
                        swatch.addEventListener('mousedown', self.color_choice(hue, sat, 100 - value));
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

    function _is_checked(shape) {
        return shape.checked;
    }

    angular.module('Paint').factory('Paint_Manager',
        function (Paint_Manager_Grid, Paint_Manager_Shape, Paint_Manager_Polygon, Paint_Manager_Boxes, Paint_Manager_Leap, Color_Palette, Paint_Manager_Move) {

            function Paint_Manager(params) {
                this.scope = params.scope;
                this.scope.paint_manager = this;
                var canvas = $(params.ele).find('canvas.paint-canvas')[0];

                this.canvas = canvas;
                canvas.width = this.screen_width();
                canvas.height = this.screen_height();

                this.stage = new createjs.Stage(canvas);
                this.shapes = [];

                Paint_Manager_Grid(this);

                var self = this;

                this.make_frame();

                this.make_draw_container();

                Paint_Manager_Polygon(this);

                Paint_Manager_Boxes(this);

                Paint_Manager_Move(this);

                this.add_button_bindings();

                this.add_form_bindings();

                this.palette = Color_Palette(this, this.margin() * 2, this.margin() * 2,
                    this.screen_width() - (4 * this.margin()),
                    this.screen_height() - (4 * this.margin())
                );

                Paint_Manager_Leap(this);

                this.update();
            }

            Paint_Manager.prototype = {
                /* ********************** SCOPE BINDINGS *************** */
                export: function () {
                    var drawing = _.pluck(this, '_id');
                    drawing.shapes = _.map(this.shapes, function () {
                        return this.shapes.export()
                    }, this);

                    return drawing;
                },

                draw_button_class: function (class_name) {
                    var classes = [class_name];
                    if (this.active_button == class_name) classes.push('active');
                    return classes.join(' ');
                },

                add_button_bindings: function () {
                    this.scope.add_rectangle = this._shape_button_fn('rectangle');
                    this.scope.add_oval = this._shape_button_fn('oval');
                    this.scope.add_triangle = this._shape_button_fn('triangle');
                    this.scope.rotate = _.bind(this.rotate, this);
                    this.scope.clone = _.bind(this.clone, this);
                    this.scope.draw_button_class = _.bind(this.draw_button_class, this);
                    this.scope.remove_shape = _.bind(this.remove_shape, this);
                },

                remove_shape: function(){
                    if (!this.active_shape) return;

                    this.shapes = _.reject(this.shapes, function(shape){
                         return shape === this.active_shape;
                    }, this);
                    this.active_shape = null;
                    this.shapes_to_dc();
                },

                add_form_bindings: function () {
                    this.scope.set_current_color = _.bind(this.set_current_color, this);
                    this.scope.choose_color = _.bind(this.choose_color, this);
                    this.scope.group_checked = _.bind(this._group_checked, this);
                },

                _group_checked: function () {
                    var checked = _.filter(this.shapes, _is_checked);
                    this.shapes = _.reject(this.shapes, _is_checked);
                    this.active_shape = this.add_shape('group', checked);
                    this.active_shape.crop_group();
                    this.active_shape.draw();
                    this.shapes_to_dc();
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

                make_draw_container: function () {
                    this.draw_container = this.add('container');
                    this.frame.addChild(this.draw_container);
                },

                activate: function (shape) {
                    this.active_shape = shape;
                },

                /**
                 * probably deprectatable - redundant with draw_container.
                 */
                make_frame: function () {
                    this.frame = this.add('container', true);
                },

                rotate: function () {
                    if (this.active_shape) {
                        this.active_shape.set_rotation(this.active_shape.get_rotation() + 45);
                        this.active_shape.draw();
                        this.update();
                    }
                },

                clone: function(){
                    if (this.active_shape) {
                       this.active_shape.clone();
                    }
                    this.shapes_to_dc();
                },

                add_shape: function (type, subs) {
                    var shape = Paint_Manager_Shape(this, type, subs);
                    this.active_shape = shape;
                    this.shapes.push(shape);
                    if (type != 'group') {
                        shape.set_color(this.scope.current_color);
                        this.shapes_to_dc();
                    }
                    return shape;
                },

                update: function (no_boxes) {
                    if (!no_boxes) {
                        _.each(this.boxes, function (box) {
                            box.update();
                        });
                    }
                    this.stage.update();
                },

                /* **************** PROPERTIES ********************* */

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
                },

                /* ************* UTILITY ****************** */

                _shape_button_fn: function (type) {
                    return _.bind(function () {
                        this.add_shape(type);
                    }, this);
                },

                shapes_to_dc: function (no_update) {
                    this.draw_container.removeAllChildren();

                    _.each(this.shapes, function (shape) {
                        this.addChild(shape.container);
                    }, this.draw_container);
                    if (!no_update){
                        this.update();
                    }
                },

                snap: function (n, f) {
                    if (f) return n[f] = this.snap(n[f]);

                    return n - (n % this.grid_size());
                },

                add: function (item, indent) {
                    switch (item) {
                        case 'shape':
                            var shape = new createjs.Shape();
                            return this.add(shape);
                            break;

                        case 'container':
                            var container = new createjs.Container();
                            if (indent) {
                                container.x = container.y = this.margin();
                            }
                            return this.add(container);
                            break;

                        default:
                            this.stage.addChild(item);
                            return item;
                    }
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
                    $scope.show_drawing = true;

                    $scope.tab_class = function (which) {
                        if ((which == 'drawing') == $scope.show_drawing) {
                            return 'tab active';
                        } else {
                            return 'tab';
                        }
                    }
                    console.log('attrs: ', $linkAttributes);
                    var width = Number($linkAttributes.width || 400);
                    var height = Number($linkAttributes.height || 300);
                    var grid = Number($linkAttributes.grid || 30);
                    var margin = Number($linkAttributes.margin || 50);
                    $scope.paint_canvas = {width: width, height: height, grid: grid, margin: margin};

                    $scope.current_color = "rgb(255, 0, 0)";

                    $scope.paint_manager = Paint_Manager($scope, $linkElement);

                };
            }
        };
    });

})(window);