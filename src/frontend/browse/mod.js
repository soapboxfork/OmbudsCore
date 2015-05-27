angular.module('browseModule', ['ngWebSocket', 'ngRoute', 'btford.markdown'])
// TODO handle nested routing properly by reworking controllers
.config(['$routeProvider', function($routeProvider) {

    $routeProvider.when('/browse', {
        controller: 'boardCtrl',
        templateUrl: 'browse/pane.html'
    })
    .when('/b/board/:board*', {
        controller: 'boardCtrl',
        templateUrl: 'browse/pane.html'
    })
    .when('/b/nilboard', {
        controller: 'boardCtrl',
        templateUrl: 'browse/pane.html'
    })
    .when('/b/bltn/:txid*', {
        controller: 'boardCtrl',
        templateUrl: 'browse/pane.html'
    })
    .when('/b/authors', {
        controller: 'authorCtrl',
        templateUrl: 'browse/pane.html'
    })
    .when('/b/author/:addr*', {
        controller: 'authorCtrl',
        templateUrl: 'browse/pane.html'
    })
    .when('/b/a/bltn/:txid*', {
        controller: 'authorCtrl',
        templateUrl: 'browse/pane.html'
    })
}])

