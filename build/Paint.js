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

                console.log('x: ', x, 'y', y);

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
})(window);;(function (window) {

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

                    $scope.paint_manager = Paint_Manager($scope, $linkElement);

                };
            }
        };
    });

})(window);