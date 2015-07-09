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
.service('appVersion', function() { 
    var appVersion = "0.1.1";
    return {v: appVersion};
})
.controller('setupCtrl', function($scope, $location, $interval, appInitService, todoService, settingUtils, appVersion) {
    $scope.language = "en";
    var waitSecs = 2;//20;

    $scope.version = appVersion.v;
    $scope.dialogCtr = 1;
    $scope.dialogLast = 4;
    $scope.waitSecs = waitSecs;
    $scope.notImpl = todoService.notImplemented;
    $scope.config = { passphrase: ""}


    $scope.forward = function() {
        switch ($scope.dialogCtr) {
        case 1:
        // Choose language
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
                }, 1000, waitSecs)
            }
            break;
        case 2: 
        // Accept Risks
            break;
        case 3:
        // Create Wallet
            // Copy the fields of the $scope's config object into a new one
            // With only the fields we intend to pass created.
            var config = { passphrase: $scope.config.passphrase };
            appInitService.initSystem(config)
            .then(function(resp) {
                console.log("System walked through init correctly");
                settingUtils.getAddress().then(function(address) {
                    $scope.pubAddress = address;
                    $scope.dialogCtr += 1;
                    console.log("System pulled address.");
                });
            }, function(resp) {
                var msg = "Failed with: " + resp.status + " : " + resp.data;
                console.log(msg);
                $scope.setupMsg = msg;
                $scope.extrapw = "";
                $scope.config.passphrase = "";
            });
            return;
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
        if (confd) {
            // The system is configured. Redirect to settings 
            $location.path('/');
        }
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
            {name: 'status'},
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

