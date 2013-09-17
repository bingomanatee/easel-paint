(function (window) {

    var OUTLINE = 'rgb(204,0,0)';
    var WHITE = 'rgb(255,255,255)';
    var POINT_SIZE = 10;

    angular.module('Paint').factory('Paint_Manager_Polygon', function () {

        function add_point_to_poly(shape, manager) {
            if (manager.active_shape && manager.active_shape.type == 'polygon') {
                manager.active_shape.add_point(shape);
                manager.active_shape.draw();
            }
        }

        function _pp_mouse_down(shape, manager) {
            return function (event) {
                switch (manager.poly_point_mode) {
                    case 'move':
                        var ox = shape.x;
                        var oy = shape.y;
                        event.addEventListener('mousemove', function (mm_event) {
                            var dx = mm_event.stageX - event.stageX;
                            var dy = mm_event.stageY - event.stageY;
                            shape.x = manager.snap(ox + dx);
                            shape.y = manager.snap(oy + dy);
                            manager.active_shape.draw();
                            manager.update();
                        });
                        break;

                    case 'delete':
                        manager.active_shape.delete_point(shape);
                        manager.ppp.removeChild(shape);
                        manager.active_shape.draw();
                        manager.update();
                        break;

                    case 'add':
                        // currently disallowing adding points on same place.
                        break;
                }
            }
        }

        function _pp_click(manager) {

            return function (event) {
                var shape = new createjs.Shape();
                if (manager.poly_point_mode == 'add') {
                    shape.x = manager.snap(event.stageX) - manager.margin() * 2;
                    shape.y = manager.snap(event.stageY) - manager.margin() * 2;
                    shape.graphics.f(WHITE).r(-POINT_SIZE / 2, -POINT_SIZE / 2, POINT_SIZE, POINT_SIZE)
                        .s(OUTLINE).ss(1).r(-POINT_SIZE / 2, -POINT_SIZE / 2, POINT_SIZE, POINT_SIZE);

                    shape.addEventListener('mousedown', _pp_mouse_down(shape, manager));

                    console.log('clicked on pp shape');
                    manager.ppp.addChild(shape);

                    add_point_to_poly(shape, manager);
                }
                manager.update();
            }
        }

        /**
         * this creates a fairly involved layer for managing poly point data.
         *
         * - the main poly_points container, added to the manager
         *   - a pp_shape, for catching cicks / adding points
         *   - a poly points points container (ppp) for holding point objects
         *     representing the path of the polygon
         */
        return function (manager) {

            manager.poly_points = manager.add('container', true);
            var pp_shape = new createjs.Shape(); // listens for clicks, to add points
            pp_shape.graphics.f('rgba(255,255,255,0.01)').r(0, 0, manager.screen_width(), manager.screen_height()).ef();
            manager.poly_points.addChild(pp_shape);

            manager.ppp = new createjs.Container();
            manager.ppp.x = manager.ppp.y = manager.margin();
            manager.poly_points.addChild(manager.ppp);

            manager.poly_points.visible = false;

            pp_shape.addEventListener('mousedown', _pp_click(manager));

            manager.scope.add_polygon = function () {
                console.log('adding polygon');

                manager.poly_points.visible = true;
                manager.active_button = 'polygon';
                manager.poly_point_mode = 'add';
                manager.active_shape = manager.add_shape('polygon');
                manager.update();
            }

            manager.scope.show_poly_buttons = function(){
                return manager.poly_points.visible;
            };

            manager.scope.close_poly = function(){
                manager.poly_points.visible = false;
                manager.ppp.removeAllChildren();
                if (manager.active_shape && manager.active_shape.type == 'polygon'){
                    manager.active_shape.reflect_points();
                }
                manager.update();
            }

            manager.scope.add_polygon_point = function () {
                manager.scope.poly_point_mode = manager.poly_point_mode = 'add';
            }

            manager.scope.delete_polygon_point = function () {
                manager.scope.poly_point_mode = manager.poly_point_mode = 'delete';
            }

            manager.scope.move_polygon_point = function () {
                manager.scope.poly_point_mode = manager.poly_point_mode = 'move';
            }

            manager.scope.draw_button_pp_class = function (which) {
                var classes = [ which + '_poly_point'];
                if (which == manager.poly_point_mode) classes.push('active');
                return classes.join(' ');
            }
        }

    })
})(window);