'use strict';

angular.module('walletModule', ['monospaced.qrcode', 'settingsModule'])
.controller('walletPaneCtrl', function($scope, walletService, txListService, todoService) {
    $scope.wallet = walletService;
    $scope.notImpl = todoService.notImplemented;

    $scope.transactions = txListService.transactions

    $scope.filterFunc = function() {
        if ($scope.filtOption === "all") {
            txListService.showEverything(); 
        } else if ($scope.filtOption === "confirmed") {
            txListService.onlyConfirmed(); 
        } else if ($scope.filtOption === "pending") {
            txListService.onlyPending();
        } else {
            consoloe.log("Never meant to get here...");
            debugger;
        }
    };

    $scope.filtOption = txListService.filtOption;
})
.factory('txListService', function(ombWebSocket) {
    var txBucket = [];
    
    var service = {
        transactions: [],
        filtOption: 'all',
        'showEverything': showEverything,
        'onlyConfirmed' : onlyConfirmed,
        'onlyPending'   : onlyPending
    }

    function showEverything() {
        service.transactions.length = 0;
        angular.forEach(txBucket, function(tx) {
            service.transactions.push(tx);
        });
    }

    function pushAll(lst) {
        service.transactions.length = 0;
        angular.forEach(lst, function(tx) {
            service.transactions.push(tx);
        });
    }

    function onlyConfirmed() {
        var res = txBucket.filter(function(tx) {
            if (tx.confirmations > 0) {
                return true;
            }
            return false;
        });
        service.transactions.length = 0;
        pushAll(res);
    }

    function onlyPending() {
        service.transactions.length = 0;
        var res = txBucket.filter(function(tx) {
            if (tx.confirmations > 0) {
                return false;
            }
            return true;
        });
        pushAll(res);
    }

    ombWebSocket.listTransactions()
    .then(function(resp) {
        // initialize the txBucket.
        txBucket = resp.result;

        // empty existing tx array...
        service.transactions.length = 0;
        angular.forEach(resp.result, function(tx) {
            tx.amount *= 1000;
            service.transactions.push(tx); 
        });
    });
    
    return service
})
.factory('walletService', function(ombWebSocket, walletSetts) {
    var wallet = {
        balance: { pending: 0.0, confirmed: 0.0},
        unit: 'mBTC',
        address: walletSetts.settings.address,
        satPerUnit: 1e5
    };

    // TODO this should be a promise
    walletSetts.registerAuthorCb(function(addr){
        wallet.address = addr;
    });

    function convBTCtoUnit(btc) {
        // TODO review this conversion.
        var valInUnits = (1e8 * btc) / wallet.satPerUnit;
        return valInUnits;
    }

    ombWebSocket.getAccountBalance(1).then(function(resp) {
    // Fill in the Confirmed Balance
        var bal = convBTCtoUnit(resp.result);
        wallet.balance.confirmed = bal;
        return ombWebSocket.getAccountBalance(0);
    }).then(function(resp) {
    // Fill in the Pending Balance
        var totalBal = convBTCtoUnit(resp.result);
        wallet.balance.pending = totalBal - wallet.balance.confirmed;
    }, /* Failure */ function(err) {
        console.log(err);
    });


     
    ombWebSocket.registerNotifListener("accountbalance", function(rawBalNotif) {
        // Transform the raw message into a readable format.
        var balNotif = {
            account: rawBalNotif.params[0],
            balance: rawBalNotif.params[1],
            confirmed: rawBalNotif.params[2]
        };
        var bal = convBTCtoUnit(balNotif.balance);
        if (balNotif.confirmed) {
            wallet.balance.confirmed = bal;
        } else {
            wallet.balance.pending = bal;
        }
    });

    return wallet;
});
