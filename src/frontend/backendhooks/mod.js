'use strict';

var singleton = angular.module('backendHooks', ['ngWebSocket']);

singleton.factory('ombWebSocket', function($websocket, $q, uniqueId) {
    var msgStream = $websocket('ws://localhost:1055/ws/');

    // Handles the promise api for commands pushed into the websocket.
    var errorDiscrim = function(deferred) {
        var responded = false;
        var timeoutSecs = 4;
        window.setTimeout(function() {
            if (!responded) {
                var msg = {
                    error: {
                        message: "The request timed out",
                    },
                };
                deferred.reject(msg);
            }
        }, timeoutSecs*1000);

        return function(msg) {
            if (msg.error !== null) {
                responded = true;
                deferred.reject(msg);
            } else {
                responded = true;
                deferred.resolve(msg);
            }
        };
    };

    // Creates a promise and sends the msg into the websocket.
    function deferAndHandle(msg) {
        var deferred = $q.defer();
        var callback = errorDiscrim(deferred);
        responseCtrl.register(msg.id, callback);
        msgStream.send(JSON.stringify(msg));
        return deferred.promise;
    }

    // The response controller holds an id that maps to a list of callback
    // functions that will be evaluated when the cmd returns.
    function ResponseCtrl() {
        this.ids = {};
        // each entry 
        this.notifHandlers = {};
        this.register = function(id, callback) {
            if (this.ids.hasOwnProperty(id)) {
                this.ids[id].push(callback);
            } else {
                this.ids[id] = [callback];
            }
        };

        this.registerNotifListener = function(method, func) {
            if (this.notifHandlers.hasOwnProperty(method)) {
                throw "Notification listener already registered for: " + method;
                return
            }
            this.notifHandlers[method] = func;
        }

        this.handleMessage = function(msg) {
            console.log("handling Msg", msg);
            
            // handle id response
            if (this.ids.hasOwnProperty(msg.id)) {
                var callbacks = this.ids[msg.id];
                angular.forEach(callbacks, function(callback) {
                    callback(msg);
                });
                delete this.ids[msg.id];
            }

            // handle notification
            if (msg.hasOwnProperty("method") && this.notifHandlers.hasOwnProperty(msg.method)) {
                var func = this.notifHandlers[msg.method];
                func(msg);
            }

        }
    };
    var responseCtrl = new ResponseCtrl();


    msgStream.onMessage(function(event) {
        var msg = {};
        try {
            msg = JSON.parse(event.data);
        } catch (e) {
            console.log(e);
            return;
        }
        responseCtrl.handleMessage(msg);
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

    function sendBulletin(draft, addr) {
       var msg = BtcMsg("sendbulletin");
       msg.params = [addr, draft.board, draft.msg];
       return deferAndHandle(msg);
   }

    function composeBulletin(draft, addr){ 
       var msg = BtcMsg("composebulletin");
       msg.params = [addr, draft.board, draft.msg];
       return deferAndHandle(msg);
    }

    function unlockWallet(passphrase) {
        var msg = BtcMsg("walletpassphrase");
        msg.params = [passphrase, 5];
        return deferAndHandle(msg);
    }

    function getAccountBalance(minConf) {
        var msg = BtcMsg("getbalance");
        msg.params = ["*", minConf];
        return deferAndHandle(msg);
    }

    function listTransactions() {
        var msg = BtcMsg("listtransactions");
        return deferAndHandle(msg);
    }

    function getInfo() {
        var msg = BtcMsg("getinfo");
        return deferAndHandle(msg);
    }

    return {
        'sendBulletin': sendBulletin,
        'composeBulletin': composeBulletin,
        'unlockWallet': unlockWallet,
        'listTransactions': listTransactions,
        'getAccountBalance': getAccountBalance,
        'getInfo': getInfo,
        'registerNotifListener': function(m, f) { responseCtrl.registerNotifListener(m, f); }
    }
})
.factory('blkHeightService', function(ombWebSocket) {
    var service = {
        height: 0
    }

    ombWebSocket.getInfo().then(function(resp) {
        service.height = resp.result.blocks;
    });
    
    ombWebSocket.registerNotifListener('blockconnected', function(resp) {
        service.height = resp.params[1];
    });

    return service;
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
.factory('uniqueId', function() {
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
})
.controller('notImplModalCtrl', function($scope, close) {
    $scope.closeModal = function() {
        close();
    }
});

