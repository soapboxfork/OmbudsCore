angular.module('browseModule', ['ngWebSocket', 'ngRoute', 'markdownModule', 'settingsModule'])
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

/************* A small markdown rendering service **************/
angular.module('markdownModule', ['ngSanitize'])
.factory('markdownService', function($sanitize) {
    var conv = new Showdown.converter({}); 
    return {
        'makeHtml': function(unsafeInp) {
            var safe = $sanitize(conv.makeHtml(unsafeInp)); 
            return safe;
        }
    }
});
