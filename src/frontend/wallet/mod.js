'use strict';

angular.module('walletModule', ['monospaced.qrcode'])
.controller('walletPaneCtrl', function($scope, walletService) {
    $scope.wallet = walletService;
})
.directive('walletWidget', function(walletService){
    return {
        scope: {
            wallet: '=info' 
        },
        templateUrl: '/wallet/wallet-widget.html',
        restrict: 'E'
    }
})
.factory('walletService', function() {
    var wallet = {
        balance: { 'pending': 323.501, 'confirmed': 21.03},
        address: "n37T77JKnFFZJN4udvyasZUwVhpidvq9gb"
    };

    return wallet;
});
