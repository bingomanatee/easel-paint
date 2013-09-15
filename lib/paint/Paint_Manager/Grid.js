(function (window) {

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
})(window);