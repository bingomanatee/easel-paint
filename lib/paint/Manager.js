(function (window) {

    var DEFAULT_SCREEN_WIDTH = 500;
    var DEFAULT_SCREEN_HEIGHT = 300;
    var DEFAULT_GRID_SIZE = 20;
    var DEFAULT_SCREEN_MARGIN = 50;

    angular.module('Paint').factory('Paint_Manager',
        function (Paint_Manager_Grid, Paint_Manager_Shape, Paint_Manager_Boxes, Color_Palette) {

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

                this.palette = Color_Palette(this, this.margin() * 2, this.margin() * 2,
                    this.screen_width() - (4 * this.margin()),
                    this.screen_height() - (4 * this.margin())
                );
                this.update();
            }

            Paint_Manager.prototype = {
                add_form_bindings: function () {
                    this.scope.set_current_color = _.bind(this.set_current_color, this);
                    this.scope.choose_color = _.bind(this.choose_color, this);
                },

                choose_color: function(){
                    this.palette.show();
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
    (window);