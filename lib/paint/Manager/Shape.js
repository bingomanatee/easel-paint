(function (window) {

    function Point_Manager_Shape(manager, type){
        this.type = type;
        this.manager = manager;
        this.shape = new createjs.Shape();
        this.init_dims();

        this.draw();
    }

    Point_Manager_Shape.prototype = {

        init_dims: function(){
            this._width = this.manager.grid_size() * 4;
            this._height = this.manager.grid_size() * 4;
            this._color = 'rgb(0,0,0)';
        },

        get_color: function(){
            return this._color;
        },

        draw: function(){
            switch(this.type){
                case 'rectangle':
                    this.shape.graphics.c().f(this.get_color()).r(0,0, this.get_width(), this.get_height()).ef();
                    break;

                default:
                    throw new Error('bad type ' + this.type);
            }
        },

        get_width: function(){
            return this._width;
        },

        get_height: function(){
            return this._height;
        }
    };

    angular.module('Paint').factory('Paint_Manager_Shape', function () {

        return function (manager, type) {
            return new Point_Manager_Shape(manager, type);
        }

    })
})(window);