'use strict';

angular.module('sendModule', ['backendHooks', 'walletModule'])
.controller('sendPaneCtrl', function($scope, ombWebSocket, walletService, draftService) {

    $scope.draftBltn = draftService;
    $scope.wallet = walletService;

    function prec(i) {
        return i.toFixed(3);
    }

    var txFee = 50000;
    var estimate = { 'val': '0.000', 'len': 0 };
    $scope.estimate = estimate;

    $scope.updateEst = function() {
        estimate.len = draftService.board.length + draftService.msg.length;
        estimate.rawval = (txFee + Math.ceil(estimate.len/20)*567)*walletService.unitPerSat;
        console.log(estimate.rawval);
        estimate.val = estimate.rawval.toFixed(4);
    };

    $scope.updateEst();


    $scope.handleSendBltn = function() {
        
        // TODO make into a promise
        ombWebSocket.sendBulletin(draftBltn);
        draftBltn.msg = '';
        draftBltn.board = '';
    }
})
.factory('draftService', function() {
// Intended to save a copy of the current draft for future use
    var draftBltn = {
        board: '', 
        msg: ''
    };
    return draftBltn;
});
