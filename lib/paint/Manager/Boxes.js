(function (window) {
    var _DEBUG = false;
    var BOX_COLOR = 'rgba(0,0,0, 0.33)';
    var BOX_SIZE = 15;

    function Drag_Box(manager, h, v) {
        this.manager = manager;
        this.h = h;
        this.v = v;
        this.shape = new createjs.Shape();

        var x = h ? 0 : -BOX_SIZE;
        var y = v ? 0 : -BOX_SIZE;

        this.shape.graphics.f(BOX_COLOR).r(x, y, BOX_SIZE, BOX_SIZE).ef();
        manager.box_container.addChild(this.shape);

        this.shape.addEventListener('mousedown', _.bind(this._on_mousedown, this));
    }

    Drag_Box.prototype = {
        update: function () {
            if (this.manager.active_shape) {
                this.shape.visible = true;
                if (this.v) { // bottom
                    this.shape.y = this.manager.active_shape.get_bottom();
                } else { //top
                    this.shape.y = this.manager.active_shape.get_top();
                }
                if (this.h) { // right
                    this.shape.x = this.manager.active_shape.get_right();
                } else { // left
                    this.shape.x = this.manager.active_shape.get_left();
                }
            } else {
                this.shape.visible = false;
            }
        },

        _on_mousedown: function (event) {
            var as = this.manager.active_shape;
            var self = this;
            if (!as) {
                return;
            }
            var left = as.get_left();
            var right = as.get_right();
            var top = as.get_top();
            var bottom = as.get_bottom();
            var width = as.get_width();
            var height = as.get_height();
            var min_size = this.manager.grid_size();
            event.addEventListener('mousemove', function (e2) {
                var dx = e2.stageX - event.stageX;
                var dy = e2.stageY - event.stageY;

                if (self.h) { // right
                    as.set_width(self.manager.snap(Math.max(min_size, width + dx)));
                } else { // left
                    var new_x = self.manager.snap(Math.max(0, Math.min(right - min_size, left + dx)));
                    as.set_left(new_x);
                    as.set_width(width - (new_x - left));
                }

                if (self.v) { // bottom
                    as.set_height(self.manager.snap(Math.max(min_size, height + dy)));
                } else { // top
                    var new_y = self.manager.snap(Math.max(0, Math.min(bottom - min_size, top + dy)));
                    as.set_top(new_y);
                    as.set_height(height - (new_y - top));
                }
                as.draw();
                self.manager.update(false);
            });
        }
    }

    function make_box_container(manager) {
        manager.box_container = manager.add('container', true);
    }

    function make_boxes(manager) {
        manager.boxes = [
            new Drag_Box(manager, 0, 0) ,
            new Drag_Box(manager, 0, 1),
            new Drag_Box(manager, 1, 0),
            new Drag_Box(manager, 1, 1)
        ];

    }

    angular.module('Paint').factory('Paint_Manager_Boxes', function () {

        return function (manager) {

            make_box_container(manager);

            make_boxes(manager);

        }

    })
})(window);