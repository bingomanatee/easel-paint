(function(){

    function PaintCtrl($scope, $filter, $compile, $modal, Paint, $window){
       $scope.foo = "Foo"
    }

    PaintCtrl.$inject = ['$scope', '$filter', '$compile', '$modal', 'Paint', '$window'];

    angular.module('PaintApp').controller('PaintCtrl', PaintCtrl);
})(window);
