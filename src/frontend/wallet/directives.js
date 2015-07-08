'use strict';

angular.module('walletModule')
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
.directive('txRow', function() {
    return {
        scope : {
            tx: "=",
        },
        templateUrl: 'wallet/tx-row.html',
        restrict: 'C'
    }
})
.directive('walletQr', function() {
    return {
        scope : {
            address: "=",
        },
        templateUrl: 'wallet/wallet-qr.html',
        restrict: 'E'
    }
});
