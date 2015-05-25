angular.module('browseModule', ['ngWebSocket', 'ngRoute', 'btford.markdown'])
// TODO handle nested routing properly by reworking controllers
.config(["$routeProvider", function($routeProvider) {
    $routeProvider.when('/browse', {
        controller: 'browsePaneCtrl',
        templateUrl: 'browse/pane.html'
    })
    .when('/b/empty', {
        controller: 'welcomeCtrl',
        templateUrl: 'browse/welcome.html'
    })
    .when('/b/board/:board*', {
        controller: 'boardCtrl',
        templateUrl: 'browse/board.html'
    })
    .when('/b/nilboard', {
        controller: 'nilboardCtrl',
        templateUrl: 'browse/board.html'
    })

}])

