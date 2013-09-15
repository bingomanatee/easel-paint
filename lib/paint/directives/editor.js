(function () {

    var app = angular.module('Paint');

    app.directive('paintEditor', function InjectingFunction() {
        //@TODO: inject template root.
        return {
            templateUrl: '/js/paint/directives/editor.html',
            compile: function CompilingFunction($templateElement, $templateAttributes) {

                return function LinkingFunction($scope, $linkElement, $linkAttributes){

                };
            }
        };
    });

})(window);