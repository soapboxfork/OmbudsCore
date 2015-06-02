'use strict';

var singleton = angular.module('backendHooks', ['ngWebSocket']);


singleton.factory('ahimsaRestService', function($http, $interval) {
  
  var serverInfo = { 'blkHeight': 0 };

  function updateService() { 
      $http.get('/api/status').then(function(result) {
          serverInfo = result.data;
      });
  }

  updateService();
  $interval(updateService, 15*1000, 0, true);

 
  
  // the endpoint must be from the same origin, otherwise this doesn't work!
  return {
    'getAllBoards': function() {
      return $http.get('/api/boards')
    },
    'getBoard': function(urlname) {
    // Use the encode function to prevent user submitted data from doing funky stuff with the url.
      return $http.get('/api/board/' + encodeURIComponent(urlname))
    },
    'getNilBoard': function() {
      return $http.get('/api/nilboard')
    },
    'getBulletin': function(txid) {
        return $http.get('/api/bulletin/'+txid)
    },
    'getBlockCount': function() {
        return serverInfo.blkCount;
    },
 }
});

singleton.factory('ombWebSocket', function($websocket, $q) {
    var msgStream = $websocket('ws://localhost:1055/ws/');
    var collection = [];

    var uniqueId = function() {
        var ctr = 0;
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
        }
        return function() {
            ctr += 1;
            return "frontend-" + ctr + "-" + s4();
        }
    }();

    // Handles the promise api for commands pushed into the websocket.
    var errorDiscrim = function(deferred) {
        var responded = false;
        var timeoutSecs = 5;
        setTimeout(timeoutSecs*1000, function() {
            console.log("msg time out fired");
            if (!responded) {
                msg = {
                    error: {
                        message: "The request timed out",
                    },
                };
                deferred.reject(msg);
            }
        });
        return function(msg) {
            console.log("callback saw a msg", msg);
            if (msg.error !== null) {
                deferred.reject(msg);
            } else {
                responded = true;
                deferred.resolve(msg);
            }
        };
    };

    // The response controller holds an id that maps to a list of callback
    // functions that will be evaluated when the cmd returns.
    function ResponseCtrl() {
        this.ids = {};
        this.register = function(id, callback) {
            if (this.ids.hasOwnProperty(id)) {
                this.ids[id].push(callback);
            } else {
                this.ids[id] = [callback];
            }
        };
    };
    var responseCtrl = new ResponseCtrl();


    msgStream.onMessage(function(event) {
        var msg = {};
        try {
            msg = JSON.parse(event.data);
        } catch (e) {
            return;
        }

        if (responseCtrl.ids.hasOwnProperty(msg.id)) {
            var callbacks = responseCtrl.ids[msg.id];
            angular.forEach(callbacks, function(callback) {
                callback(msg);
            });
            delete responseCtrl.ids[msg.id];
        }
    });

    function BtcMsg(method) {
        var id = uniqueId();
        var msg = { 
            id: id,
            jsonrpc: "1.0",
            method: method,
        };
        return msg;
    };

    function sendBulletin(draft) {
       var msg = BtcMsg("sendbulletin");
       msg.params = ["n37T77JKnFFZJN4udvyasZUwVhpidvq9gb", draft.board, draft.msg];

       var deferred = $q.defer();
       var callback = errorDiscrim(deferred);
       responseCtrl.register(msg.id, callback);
       msgStream.send(JSON.stringify(msg));

       return deferred.promise;
   }

    function composeBulletin(draft){ 
       var msg = BtcMsg("composebulletin");
       msg.params = ["n37T77JKnFFZJN4udvyasZUwVhpidvq9gb", draft.board, draft.msg];

       var deferred = $q.defer();
       var callback = errorDiscrim(deferred);
       responseCtrl.register(msg.id, callback);
       msgStream.send(JSON.stringify(msg));

       return deferred.promise;    
    }

    function unlockWallet(passphrase) {
        var msg = BtcMsg("walletpassphrase");
        msg.params = [passphrase, 5];

        var deferred = $q.defer();
        var callback = errorDiscrim(deferred);
        responseCtrl.register(msg.id, callback);
        msgStream.send(JSON.stringify(msg));

        return deferred.promise;
    }

    return {
        'sendBulletin': sendBulletin,
        'composeBulletin': composeBulletin,
        'unlockWallet': unlockWallet,
        'collection': collection 
    }
});

singleton.factory('ombSettingService', function($http) {
    var settings;

    $http.get('/settings/').then(function(result) {
        settings = result.data;
    });

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
    

    return {
        'getFavoriteBoards': function() { return settings.favorites.boards },
        'addFavoriteBoard': addFavoriteBoard,
        'delFavoriteBoard': delFavoriteBoard,
        'isFavoriteBoard': function(name) { 
            if(settings.favorites.boards.indexOf(name) >= 0) {
                return true
            } else { return false }
        }
    }
})
.factory('todoService', function(ModalService) {
    var service = {}; 
    
    service.notImplemented = function() {
        ModalService.showModal({
            templateUrl: "backendhooks/notImplemented.html",
            controller: "notImplModalCtrl",
        });
    }

    return service
})
.controller('notImplModalCtrl', function($scope, close) {
    $scope.closeModal = function() {
        close();
    }
});

