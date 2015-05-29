'use strict';

angular.module('sendModule', ['backendHooks', 'walletModule', 'browseModule'])
.controller('sendPaneCtrl', function($scope, ombWebSocket, walletService, draftService, paneState, markdownService) {

    $scope.draftBltn = draftService;
    $scope.wallet = walletService;
    $scope.state = paneState;
    
    // For the rendered Bltn
    addCommonFunctions($scope, markdownService);
    //$scope.depthImg = function(bltn) { return "" };
    $scope.inAuthor = true;
    $scope.testBltn = {};

    function prec(i) {
        return i.toFixed(3);
    }

    var txFee = 50000;

    function updateEst(estimate) {
        estimate.len = draftService.board.length + draftService.msg.length;
        estimate.rawval = (txFee + Math.ceil(estimate.len/20)*567)*walletService.unitPerSat;
        console.log(estimate.rawval);
        estimate.val = estimate.rawval.toFixed(4);
    };

    $scope.updateEst = updateEst;

    updateEst(paneState.estimate);

    $scope.toggleRender = function() {
        paneState.renderTog = !paneState.renderTog;
        if (paneState.renderTog) {
            // Create a new bltn and load it into scope.            
            var now = new Date().getTime();
            var testBltn = {
                msg: draftService.msg,
                board: draftService.board,
                timestamp: now,
                author: walletService.address
            };
            paneState.testBltn = testBltn;
            updateEstimate(paneState.estimate);
        } 
    }

    $scope.handleSendBltn = function() {
        
        // TODO make into a promise
        ombWebSocket.sendBulletin(draftService);
        draftService.msg = '';
        draftService.board = '';
    }
})
.factory('draftService', function() {
// Intended to save a copy of the current draft for future use
    var draftBltn = {
        board: '', 
        msg: ''
    };
    return draftBltn;
})
.factory('paneState', function() {
// Holds the state of the pane across initializations
//
    var state = {
        renderTog: false, // The toggle for the bltn renderer
        testBltn: {},
        estimate: { 'val': '0.000', 'len': 0 },
    }
    return state;
});
