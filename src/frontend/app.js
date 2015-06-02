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
    'backendHooks',
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
    .when('/settings', {
        controller: 'settingsPaneCtrl',
        templateUrl: 'settings/pane.html'
    })
    .when('/wallet', {
        controller: 'walletPaneCtrl',
        templateUrl: 'wallet/pane.html'
    })
    .otherwise('/settings');
}])
.controller('paneCtrl', function($scope, locationService, todoService) {
    $scope.panes = locationService.getAllPanes();
    $scope.activePane = locationService.activePane;
    $scope.selectPane = function(pane) {
        locationService.selectPane(pane);
        $scope.activePane = pane;
    };
    $scope.notImpl = todoService.notImplemented;
    $scope.paneUrl = function(name){ return "/#/"+name; };

})
.factory('locationService', function($location) {
    // Documents the panes we have in the application
    var service = {
        panes : [
            {name: 'browse'},  
            {name: 'send'},  
            {name: 'wallet'},  
            {name: 'settings'},
            {name: 'twitter'},
        ]
    };

    service.getPane = function(name) {
        for (var i = 0; i < service.panes.length; i++) {
            var pane = service.panes[i];
            if (name === pane.name) {
                return pane;
            }
        }
        return null;
    }

    var gex = /^\/([a-z]+)/
    var m = $location.path().match(gex);
    if (m != null) {
        var curPane = service.getPane(m[1]);
        if (curPane != null) {
            service.activePane = curPane;
        } 
    } else {
        service.activePane = service.getPane('settings');
    }


    // NOTE! This must come first
    service.getAllPanes = function() {
        return service.panes
    }

    service.selectPane = function(pane) {
        for (var i = 0; i < service.panes.length; i++) {
            var cp = service.panes[i];
            if (pane.name === cp.name) {
                service.activePane = cp
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
.directive('authorIcon', function() {
    return {
        scope : {
            addr: '='
        },
        templateUrl: 'author-icon.html',
        restrict: 'E'
    }
});

