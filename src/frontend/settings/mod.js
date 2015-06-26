angular.module('settingsModule', [])
.controller('settingsPaneCtrl', function($scope, globalSettings, todoService) {
    $scope.notImpl = todoService.notImplemented;
    $scope.settings = globalSettings;
     
})
.factory('ombSettingsService', function($http, walletService) {
    var settings = {};
    console.log("ran ombSettingsService");

    function addFavoriteBoard(name) {
        $http.post('/settings/favorite/', {'type': 'board', 'val': name})
        .success(function(data){
            console.log("added favorite!")
        })
        .error(function(data){
            console.log('failed to add favorite');
        });
    }

    function delFavoriteBoard(name) {
        $http.post('/settings/favorite/', {'type': 'board', 'val': name, 'method':'delete'})
    }
    
    function getAddress() {
        return initPromise.then(function() {
            return settings.address;
        });
    }

    return {
        'getFavoriteBoards': function() { return settings.favorites.boards },
        'addFavoriteBoard': addFavoriteBoard,
        'delFavoriteBoard': delFavoriteBoard,
        'isFavoriteBoard': function(name) { 
            if(settings.favorites.boards.indexOf(name) >= 0) {
                return true
            } else { return false }
        },

        'getAddress': getAddress
    }
})
.factory('browseSetts', function(globalSettings) {
    // Uses safe default settings until, global settings returns
    var browseSetts = {
        renderMd: true
    };


    var initProm = globalSettings.initProm.then(function(settings) {
        browseSetts.renderMd = settings.renderMd;
    });

    return {
        'initProm': initProm,
        'settings': browseSetts
    };
})
.factory('walletSetts', function(globalSettings) {
    var settings = {
        address: "tw1nk1eT0es"
    }

    // TODO use a promise to fulfill the request
    var callback = function(){};
    function registerAuthorCb(cb) {
        callback = cb;
    }

    var initProm = globalSettings.initProm.then(function(globalSetts) {
        settings.address = globalSetts.address
        callback(settings.address)
    });
    
    return {
        'registerAuthorCb': registerAuthorCb,
        'initProm': initProm,
        'settings': settings
    };
})
.factory('appInitService', function(globalSettings, $http, uniqueId) {
    var initSetts = {
        initialized: false
    };

    var initProm = globalSettings.initProm
    .then(function(settings) {
        initSetts.initialized = settings.initialized;
    });

    function getStatus() {
        return initProm.then(function() {
            return initSetts.initialized;
        });
    }

    function initSystem(config) {
        // All we are doing here is setting up the wallet. For now.
        // config -> { passphrase: <str>, }
        
        var walletSetup = {
            method: "walletsetup",
            jsonrpc: "1.0",
            id: uniqueId(),
            params: [config.passphrase]
        };
        
        var prom = $http.post('/api/settings/initialize', walletSetup)
        .success(function(data, status) {
            debugger;
        })
        .error(function(data, status) {
            debugger;
        });
        return prom;
    }

    return {
        'getStatus': getStatus,
        'initSystem': initSystem,
        'settings': initSetts
    };
})
.factory('globalSettings', function($http) {
    var settings = {};

    var initProm = $http.get('/api/settings/').then(function(result) {
        settings = result.data;
        return settings;
    });

    return {
        'initProm': initProm,
        'settings': settings
    };
});
