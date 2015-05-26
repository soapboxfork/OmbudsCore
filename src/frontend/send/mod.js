'use strict';

angular.module('sendModule', ['ombWebAppFactory', 'walletModule'])
.controller('sendPaneCtrl', function($scope, ombWebSocket, walletService) {
    var draftBltn = {
        board: '', 
        msg: ''
    };

    $scope.draftBltn = draftBltn;
    $scope.wallet = walletService;

    ombWebSocket.sendBulletin

    $scope.handleSendBltn = function() {
        
        // TODO make into a promise
        ombWebSocket.sendBulletin(draftBltn);
        draftBltn.msg = '';
        draftBltn.board = '';
    }
})
