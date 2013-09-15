(function (window) {
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
})(window);