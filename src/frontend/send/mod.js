'use strict';

angular.module('sendModule', ['ombWebAppFactory', 'walletModule'])
.controller('sendPaneCtrl', function($scope, ombWebSocket, walletService) {
    var draftBltn = {
        board: '', 
        msg: ''
    };

    $scope.draftBltn = draftBltn;
    $scope.wallet = walletService;

    function prec(i) {
        return i.toFixed(3);
    }

    var txFee = 50000;
    var estimate = { 'val': prec(txFee*walletService.unitPerSat), 'len': 0 };
    $scope.estimate = estimate;

    $scope.updateEst = function() {
        estimate.len = draftBltn.board.length + draftBltn.msg.length;
        estimate.rawval = (txFee + Math.ceil(estimate.len/20)*567)*walletService.unitPerSat;
        console.log(estimate.rawval);
        estimate.val = estimate.rawval.toFixed(4);
    };


    $scope.handleSendBltn = function() {
        
        // TODO make into a promise
        ombWebSocket.sendBulletin(draftBltn);
        draftBltn.msg = '';
        draftBltn.board = '';
    }
})
