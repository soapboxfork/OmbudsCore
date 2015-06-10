'use strict';

angular.module('walletModule', ['monospaced.qrcode'])
.controller('walletPaneCtrl', function($scope, walletService) {
    $scope.wallet = walletService;
})
.directive('walletWidget', function(){
    return {
        scope: {
            wallet: '=info' 
        },
        templateUrl: '/wallet/wallet-widget.html',
        restrict: 'E'
    }
})
.directive('coinAmnt', function() {
    return {
        scope : {
            amount: "=",
            unit: "="
        },
        templateUrl: 'wallet/coin-amnt.html',
        restrict: 'E'
    }
})
.factory('walletService', function(ombWebSocket) {
    var wallet = {
        balance: { pending: 0.0, confirmed: 0.0},
        unit: 'mBTC',
        address: 'n37T77JKnFFZJN4udvyasZUwVhpidvq9gb',
        unitPerSat: 1e5
    };

    function convBTCtoUnit(btc) {
        // unitPerSat / satoshis * btc 
        var valInUnits = wallet.unitPerSat / (1e8 * btc);
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

    ombWebSocket.registerNotifListener("blockconnected", function(json_obj) {
        console.log("blkconnected", json_obj);
    });

    return wallet;
});
