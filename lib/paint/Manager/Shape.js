(function (window) {

    function Point_Manager_Shape(manager, type) {
        this.type = type;
        this.manager = manager;
        this.shape = new createjs.Shape();
        this.init_dims();
        this.make_draggable();
        this.draw();
    }

    Point_Manager_Shape.prototype = {

        init_dims: function () {
            this._x = this._y = 0;
            this._width = this.manager.grid_size() * 4;
            this._height = this.manager.grid_size() * 4;
            this._color = 'rgb(0,0,0)';
        },

        get_color: function () {
            return this._color;
        },

        make_draggable: function () {
            this.shape.addEventListener('mousedown', _.bind(this._on_mousedown, this));
        },

        _on_mousedown: function (event) {
            event.addEventListener('mousemove', _.bind(this._on_mousemove(event), this));

            event.addEventListener('mouseup', _.bind(this._on_mouseup, this));
        },

        _on_mouseup: function () {
            this.set_x(this.shape.x);
            this.set_y(this.shape.y);
        },

        _on_mousemove: function (event) {
            return function (move_event) {

                var x = this.get_x() + move_event.stageX - event.stageX;
                x = Math.max(0, Math.min(x, this.manager.screen_width(true) - this.get_width()));
                x -= x % this.manager.grid_size();
                var y = this.get_y() + move_event.stageY - event.stageY;
                y = Math.max(0, Math.min(y, this.manager.screen_height(true) - this.get_height()));
                y -= y % this.manager.grid_size();

             //   console.log('x: ', x, 'y', y);

                this.shape.x = x;
                this.shape.y = y;

                this.manager.update();
            }
        },

        draw: function () {
            switch (this.type) {
                case 'rectangle':
                    this.shape.graphics.c().f(this.get_color()).r(0, 0, this.get_width(), this.get_height()).ef();
                    break;

                default:
                    throw new Error('bad type ' + this.type);
            }
        },

        get_width: function () {
            return this._width;
        },

        get_height: function () {
            return this._height;
        },

        get_x: function () {
            return this._x;
        },

        get_y: function () {
            return this._y;
        },

        set_x: function (x) {
            return this._x = x;
        },

        set_y: function (y) {
            return this._y = y;
        }

    };

    angular.module('Paint').factory('Paint_Manager_Shape', function () {

        return function (manager, type) {
            return new Point_Manager_Shape(manager, type);
        }

    })
})(window);