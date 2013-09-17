(function (window) {

    var temp_id = 0;

    function Point_Manager_Shape(manager, type) {
        this._temp_id = ++temp_id;
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

        identity: function () {
            return this._id | this._temp_id;
        },

        echo: function (msg) {
            console.log('ECHO:', msg || '', 'shape ', this.identity(), 'tl:', this.get_x(), this.get_y(), 'wh:', this.get_width(), this.get_height());
        },

        init_dims: function () {
            this._rotation = 0;
            this._x = this._y = 0;
            this._width = this.manager.grid_size() * 4;
            this._height = this.manager.grid_size() * 4;
            this._color = 'rgb(0,0,0)';
            this.points = [];
        },

        point_width: function(){

            if (!this.points.length) return 0;
            var min_x = this.points[0].x;
            var max_x = min_x;

            _.each(this.points.slice(1), function (p) {
                min_x = Math.min(min_x, p.x);
                max_x = Math.max(max_x, p.x);
            });

            return max_x - min_x;
        },
        point_height: function(){

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
            var dx =  this.get_width()/2 + min_x  ;
            var dy =  this.get_height()/2 + min_y ;
            _.each(this.points, function (p) {
                p.x -= dx;
                p.y -= dy;
            });
            this.reflected_points = true;
            this.draw();
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
                    this.shape.graphics.mt(-x2, -y2).lt(x2, -y2).lt(x2, y2).lt(-x2, y2);
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

                case 'polygon':
                    _.each(this.points, function (p, i) {
                        if (i == 0) {
                            this.shape.graphics.mt(p.x, p.y);
                        } else {
                            this.shape.graphics.lt(p.x, p.y);
                        }
                    }, this);
                    if (this.reflected_points){
                        this.shape.scaleX =this.get_width()/ this.point_width();
                        this.shape.scaleY = this.get_height()/this.point_height();
                    }
                    break;

                default:
                    throw new Error('bad type ' + this.type);
            }
            this.shape.graphics.ef();
        },

        add_point: function (point_shape) {
            this.points.push(point_shape);
        },

        delete_point: function (point_shape) {
            this.points = _.reject(this.points, function (pp) {
                return pp === point_shape;
            });
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

        return function (manager, type) {
            return new Point_Manager_Shape(manager, type);
        }

    })
})(window);