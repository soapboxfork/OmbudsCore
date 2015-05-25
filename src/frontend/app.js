'use strict';

/*angular.module('exceptionOverride', []).factory('$exceptionHandler', function() {
    return function(exception, cause) {
        exception.message += ' (caused by "' + cause + '")';
//        throw exception;
    };
})*/

var ombWebApp = angular.module("ombWebApp", [
    'ombWebAppFilters',
    'ombWebAppFactory',
    'browseModule',
    'sendModule',
   // 'exceptionOverride',
    'ngRoute',
    'ngWebSocket',
    ])
.config(["$routeProvider", function($routeProvider) {
  $routeProvider.when('/send', {
    controller: 'sendPaneCtrl',
    templateUrl: 'send/pane.html'
  })
  $routeProvider.when('/settings', {
    controller: 'settingsPaneCtrl',
    templateUrl: 'settings/pane.html'
  })
  .otherwise({redirectTo: '/browse'})
}])
.controller('paneCtrl', function($scope, locationService) {
    $scope.panes = locationService.getAllPanes();
    $scope.activePane = locationService.activePane;
    $scope.selectPane = locationService.selectPane;
    $scope.paneUrl = function(name){ return "/#/"+name; };

})
.factory('locationService', function() {
    // Documents the panes we have in the application
    var service = {
        panes : [
            {name: 'browse', ready: true},  
            {name: 'send', ready: true},  
            {name: 'settings', ready: true},  
            {name: 'twitter', ready: false}
        ]
    };

    // NOTE! This must come first
    service.getAllPanes = function() {
        return service.panes
    }

    service.activePane = service.panes[0]
    service.selectPane = function(pane) {
        for (cp in service.panes) {
            if (pane.name === cp.name) {
                pane.active = true; 
            } else {
                pane.active = false;
            }
        }
    }

    return service;
})
.directive('paneBtn', function() {
    return {
        templateUrl: 'pane-btn.html',
        restrict: 'C'
    }
})
