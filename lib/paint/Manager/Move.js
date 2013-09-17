(function (window) {

    var GRID_COLOR = 'rgba(0,0,0, 0.25)';

    angular.module('Paint').factory('Paint_Manager_Move', function () {


        return function (manager) {
            function _shuffle(offset){
                manager.shapes.unshift(null);
                var active_index = _.indexOf(manager.shapes, manager.active_shape);
                var other_index = active_index + offset;
                var other = manager.shapes[other_index];
                manager.shapes[other_index] =  manager.active_shape;
                manager.shapes[active_index] = other;
                manager.shapes = _.compact(manager.shapes);
                manager.shapes_to_dc();
                manager.update();
            };

            manager.scope.move_up = function () {
                if (!manager.scope.show_move('up')) return;

                _shuffle(-1);
            };

            manager.scope.move_down = function () {

                if (!manager.scope.show_move('up')) return;

                _shuffle(1);
            };

            manager.scope.show_move = function (which) {
                if ((!manager.active_shape) || (manager.shapes.length < 2)) {
                    return false;
                }

             return true;
            };

        }

    })
})(window);