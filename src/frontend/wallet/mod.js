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
.factory('walletService', function() {
    var wallet = {
        balance: { 'pending': 323.501, 'confirmed': 21.03},
        unit: 'mBTC',
        address: 'n37T77JKnFFZJN4udvyasZUwVhpidvq9gb',
        unitPerSat: 1e-5
    };

    return wallet;
});
