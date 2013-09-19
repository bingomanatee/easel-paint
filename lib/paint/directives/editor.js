(function () {

    var paint = angular.module('Paint');

    paint.directive('paintEditor', function InjectingFunction(Paint_Manager) {
        //@TODO: inject template root.
        return {
            templateUrl: '/js/paint/directives/editor.html',
            compile: function CompilingFunction($templateElement, $templateAttributes) {

                return function LinkingFunction($scope, $linkElement, $linkAttributes) {
                    $scope.show_drawing = true;

                    $scope.tab_class = function (which) {
                        if ((which == 'drawing') == $scope.show_drawing) {
                            return 'tab active';
                        } else {
                            return 'tab';
                        }
                    }
                    console.log('attrs: ', $linkAttributes);
                    var width = Number($linkAttributes.width || 400);
                    var height = Number($linkAttributes.height || 300);
                    var grid = Number($linkAttributes.grid || 30);
                    var margin = Number($linkAttributes.margin || 50);
                    $scope.paint_canvas = {width: width, height: height, grid: grid, margin: margin};

                    $scope.current_color = "rgb(255, 0, 0)";

                    $scope.paint_manager = Paint_Manager($scope, $linkElement);

                };
            }
        };
    });

})(window);