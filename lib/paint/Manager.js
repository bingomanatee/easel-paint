(function (window) {

    var DEFAULT_SCREEN_WIDTH = 500;
    var DEFAULT_SCREEN_HEIGHT = 300;
    var DEFAULT_GRID_SIZE = 20;
    var DEFAULT_SCREEN_MARGIN = 50;

    angular.module('Paint').factory('Paint_Manager', function (Paint_Manager_Grid, Paint_Manager_Shape) {

        function Paint_Manager(params) {
            this.scope = params.scope;
            var canvas = $(params.ele).find('canvas.paint-canvas')[0];

            this.canvas = canvas;
            canvas.width = this.screen_width();
            canvas.height = this.screen_height();

            this.stage = new createjs.Stage(canvas);
            this.shapes = [];
            console.log('new paint manager created');

            this.make_grid();

            this.make_frame();

            this.make_draw_container();

            this.add_button_bindings();
        }

        Paint_Manager.prototype = {

            make_draw_container: function () {
                this.draw_container = new createjs.Container();
                this.frame.addChild(this.draw_container);
            },

            make_frame: function () {
                this.frame = new createjs.Container();
                this.frame.x = this.frame.y = this.margin();

                this.stage.addChild(this.frame);
            },

            add_button_bindings: function () {
                this.scope.add_rectangle = _.bind(this.add_rectangle, this);
            },

            add_rectangle: function () {
                var shape = this.add_shape('rectangle');
            },

            shapes_to_dc: function(){
                this.draw_container.removeAllChildren();

                _.each(this.shapes, function(shape){
                    this.addChild(shape.shape);
                }, this.draw_container);
            },

            add_shape: function (type) {
                var shape =  Paint_Manager_Shape(this, type);
                console.log('new shape ', shape);
                this.shapes.push(shape);
                this.shapes_to_dc();

                this.update();
                return shape;
            },

            update: function(){
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