(function (window) {

    var DEFAULT_SCREEN_WIDTH = 500;
    var DEFAULT_SCREEN_HEIGHT = 300;
    var DEFAULT_GRID_SIZE = 20;
    var DEFAULT_SCREEN_MARGIN = 50;

    angular.module('Paint').factory('Paint_Manager', function (Paint_Manager_Grid) {

        function Paint_Manager(params) {
            this.scope = params.scope;
            var canvas = $(params.ele).find('canvas.paint-canvas')[0];

            this.canvas = canvas;
            canvas.width = this.screen_width();
            canvas.height = this.screen_height();

            this.stage = new createjs.Stage(canvas);
            console.log('new paint manager created');

            this.make_grid();
        }

        Paint_Manager.prototype = {

            make_grid: Paint_Manager_Grid,

            grid_size: function(){
                var pc = this.scope.paint_canvas;
                if (!pc || !pc.grid){
                    return DEFAULT_GRID_SIZE;
                }
                return Number(pc.grid);
            },

            margin: function(){
                var pc = this.scope.paint_canvas;

                if (!pc || !pc.margin) return DEFAULT_SCREEN_MARGIN;
                return Number(pc.margin);
            },

            screen_width: function(inner){
                var pc = this.scope.paint_canvas;

                if (inner){
                    var width = this.screen_width();
                   width -= (2* this.margin());
                    return width;
                }

                if (!pc || (!pc.width)) return DEFAULT_SCREEN_WIDTH;
                return Number(pc.width);
            },

            screen_height: function(inner){
                var pc = this.scope.paint_canvas;

                if (inner){
                    var height = this.screen_height();
                    height -= (2* this.margin());
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
})(window);