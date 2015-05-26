angular.module('browseModule', ['ngWebSocket', 'ngRoute', 'btford.markdown'])
// TODO handle nested routing properly by reworking controllers
.config(['$routeProvider', function($routeProvider) {

    $routeProvider.when('/browse', {
        controller: 'browseCtrl',
        templateUrl: 'browse/pane.html'
    })
    .when('/b/board/:board*', {
        controller: 'browseCtrl',
        templateUrl: 'browse/pane.html'
    })
    .when('/b/nilboard', {
        controller: 'nilboardCtrl',
        templateUrl: 'browse/pane.html'
    })

}])

