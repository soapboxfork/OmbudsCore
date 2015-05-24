'use strict';

angular.module('exceptionOverride', []).factory('$exceptionHandler', function() {
    return function(exception, cause) {
        exception.message += ' (caused by "' + cause + '")';
//        throw exception;
    };
})


var ombWebApp = angular.module("ombWebApp", [
    'ombWebAppControllers',
    'ombWebAppFilters',
    'ombWebAppFactory',
    'exceptionOverride',
    'ngRoute',
    ])
    .config(["$routeProvider", function($routeProvider) {
      $routeProvider.when('/', {
        controller: 'welcome',
        templateUrl: 'welcome.html'
      })
      .when('/board/:board*', {
        controller: 'board',
        templateUrl: 'board.html'
      })
      .when('/nilboard', {
        controller: 'nilboard',
        templateUrl: 'board.html'
      })

    }])
    // Directives
    .directive('browseBoard', function() {
        return {
            templateUrl: 'browse-board.html',
            // the restrict tag means that only html elements that have the class "bulletin"
            // end up with the bltn.html template rendered below them.
            restrict: 'C',
        }
    })
    .directive('pinBulletin', function() {
        return {
            templateUrl: 'pinned-bulletin.html', 
            restrict: 'C',
        }
    })
