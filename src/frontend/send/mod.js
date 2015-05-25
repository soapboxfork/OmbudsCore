'use strict';

angular.module('sendModule', ['ombWebAppFactory'])
.controller('sendPaneCtrl', function($scope, ombWebSocket) {
    var draftBltn = {
        board: '', 
        msg: ''
    };

    $scope.draftBltn = draftBltn;

    ombWebSocket.sendBulletin

    $scope.handleSendBltn = function() {
        
        // TODO make into a promise
        ombWebSocket.sendBulletin(draftBltn);
        draftBltn.msg = '';
        draftBltn.board = '';
    }
})
