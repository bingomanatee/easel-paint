(function (window) {

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

                var x = start_x + move_event.stageX - event.stageX;
                x = self.manager.snap(Math.max(0, Math.min(x, this.manager.screen_width(true) - this.get_width())));
                var y = start_y + move_event.stageY - event.stageY;
                y = self.manager.snap(Math.max(0, Math.min(y, this.manager.screen_height(true) - this.get_height())));

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
                    if (this.get_rotation()){
                        var r_container = new createjs.Container();
                         r_container.x = this.get_width()/2;
                         r_container.y = this.get_height()/2;
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
                    }  else {
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
})(window);