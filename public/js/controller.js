(function(){

    function PaintCtrl($scope, $filter, $compile, $window){
       $scope.foo = "Foo";

        $scope.$watch('current_color', function(color){
            console.log('current color set to ', color);
            if (color){
                $scope.set_current_color(color);
            }
        });
    }

    PaintCtrl.$inject = ['$scope', '$filter', '$compile', '$window'];

    angular.module('PaintApp').controller('PaintCtrl', PaintCtrl);

})(window);
