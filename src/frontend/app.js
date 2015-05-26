'use strict';

/*angular.module('exceptionOverride', []).factory('$exceptionHandler', function() {
return function(exception, cause) {
exception.message += ' (caused by "' + cause + '")';
//        throw exception;
};
})*/

var ombWebApp = angular.module("ombWebApp", [
    'ngAnimate',
    'ngRoute',
    'ngWebSocket',
    'ombWebAppFilters',
    'ombWebAppFactory',
    'browseModule',
    'sendModule',
    'settingsModule',
    'walletModule',
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
    $routeProvider.when('/wallet', {
        controller: 'walletPaneCtrl',
        templateUrl: 'wallet/pane.html'
    })
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
            {name: 'browse', active: true},  
            {name: 'send', active: false},  
            {name: 'wallet', active: false},  
            {name: 'settings', active: false},
            {name: 'twitter', active: false},
        ]
    };

    // NOTE! This must come first
    service.getAllPanes = function() {
        return service.panes
    }

    service.activePane = service.panes[0]
    service.selectPane = function(pane) {
        for (var i = 0; i < service.panes.length; i++) {
            var cp = service.panes[i];
            if (pane.name === cp.name) {
                cp.active = true; 
            } else {
                cp.active = false;
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
});
