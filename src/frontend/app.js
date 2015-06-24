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
    .when('/setup', {
        controller: 'setupCtrl',
        templateUrl: 'setup.html'
    })
    .otherwise('/settings');
}])
.controller('setupCtrl', function($scope, $location, $interval, appInitService, todoService) {
    $scope.loading = true;
    $scope.language = "en";
    var waitSecs = 30;

    $scope.dialogCtr = 1;
    $scope.dialogLast = 4;
    $scope.waitSecs = waitSecs;
    $scope.notImpl = todoService.notImplemented;

    $scope.forward = function() {
        switch ($scope.dialogCtr) {
        case 1:
            switch ($scope.language) {
                case "gb-en":
                case "gr":
                case "tk":
                    // TODO add easter egg
                    $scope.notImpl();
                    break;
                default:
                    break;
            }
            // Start the countdown timer.
            if ($scope.waitSecs == waitSecs) {
                $interval(function() {
                    $scope.waitSecs -=1 
                }, 1000, 30)
            }
            break;
        case 2: 
            break;
        default:
            break;
        }
        $scope.dialogCtr += 1;
    }
    
    $scope.back = function() {
        $scope.dialogCtr -= 1;
    }

    $scope.finishSetup = function() {
        $location.path('/');
    }

    appInitService.getStatus().then(function (confd) {
        // If the system is not configured, prompt the initialization modal.
        if (!confd) {
            $scope.loading = false;
            var config = {
                passphrase: "malgene"
            }
            appInitService.initSystem(config)
            .then(function() {
                console.log("System succesfully initialized!");
            }, function(msg) {
                console.log("Initialize failed with: " + msg); 
            });
        }
        // The system is configured. Redirect to settings 
        //$location.path('/');
    });
})
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

