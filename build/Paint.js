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
        return function () {
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

    function Point_Manager_Shape(manager, type) {
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
})(window);;(function (window) {

    var DEFAULT_SCREEN_WIDTH = 500;
    var DEFAULT_SCREEN_HEIGHT = 300;
    var DEFAULT_GRID_SIZE = 20;
    var DEFAULT_SCREEN_MARGIN = 50;

    angular.module('Paint').factory('Paint_Manager',
        function (Paint_Manager_Grid, Paint_Manager_Shape, Paint_Manager_Boxes) {

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

                Paint_Manager_Boxes(this);

                this.add_button_bindings();

                this.add_form_bindings();
            }

            Paint_Manager.prototype = {
                add_form_bindings: function () {
                    this.scope.set_current_color = _.bind(this.set_current_color, this);
                },

                set_current_color: function(c){
                    this._current_color = c;
                    if (this.active_shape){
                        this.active_shape.set_color(c);
                        this.update();
                    }

                },

                show_boxes: function () {
                    var target = this.active_shape;

                    if (target && target.type == 'polygon') {
                        target = false;
                    }

                    _.each(this._boxes, function (box) {
                        box.visible = !!target;
                        if (target) box.__move_around();
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

                    this.stage.addChild(this.frame);
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
                    console.log('new shape ', shape);
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