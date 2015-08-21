'use strict';

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
    'statusModule'
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
    .when('/status', {
        controller: 'statusPaneCtrl',
        templateUrl: 'status/pane.html'
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
    $scope.walletBtnEnabled = true;


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
            $scope.walletBtnEnabled = false;
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
                    $scope.walletBtnEnabled = true;
                });
            }, function(resp) {
                var txt = resp.data != "" ? resp.data : "Which is a strange error!";
                var msg = "Failed with: " + resp.status + " : " + txt;
                console.log(msg);
                $scope.setupMsg = msg;
                $scope.extrapw = "";
                $scope.config.passphrase = "";
                $scope.walletBtnEnabled = true;
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
    $scope.paneMgr = locationService;
    $scope.notImpl = todoService.notImplemented;
    $scope.paneUrl = function(name){ return "/#/"+name; };
})
.factory('locationService', function($location) {
    var settings = {name: 'settings'};
    var service = {
        // All of the panes we have in the application
        panes : [
            {name: 'browse'},  
            {name: 'send'},  
            {name: 'wallet'},  
            // So we can change the pointer.
            settings,
            {name: 'status'},
        ],
        // The default pane if no pane is set.
        activePane: settings
    };

    // Returns the pane associated with the given name.
    service.selectPane = function(paneName) {
        for (var i = 0; i < service.panes.length; i++) {
            var cp = service.panes[i];
            if (paneName === cp.name) {
                service.activePane = cp;
                console.log(paneName)
                return
            }
        }
    }

    // Set the pane based on the location we are currently looking at.
    var gex = /^\/([a-z]+)/
    var m = $location.path().match(gex);
    if (m != null) {
        // has no effect if the match is not in panes.
        var curPane = service.selectPane(m[1]);
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

