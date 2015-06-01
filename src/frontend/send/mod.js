'use strict';

angular.module('sendModule', ['backendHooks', 'walletModule', 'browseModule', 'angularModalService'])
.controller('sendPaneCtrl', function(
    $scope, 
    ombWebSocket, 
    walletService, 
    draftService, 
    paneState, 
    markdownService, 
    ModalService
){

    $scope.draftBltn = draftService;
    $scope.wallet = walletService;
    $scope.state = paneState;

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
        } 
    }

    $scope.handleSendBltn = function() {

        ombWebSocket.composeBulletin(draftService)
        .then(function(txid) {
            console.log("Sendbulletin succeeded", txid);
        }, function(failure) {
            console.log("Sendbulletin failed", failure);
        });
        draftService.msg = '';
        draftService.board = '';
    };

    $scope.showComposeModal = function() {
        ModalService.showModal({
            templateUrl: "send/composeModal.html",
            controller: "composeModalCtrl"
        });
    }

})
.controller('composeModalCtrl', function($scope, $q, close, draftService, ombWebSocket) {
    $scope.passphrase = "";
    $scope.actionEnabled = true;
    console.log("Hit the modal Ctrl");

    function setModalMsg(color, msg) {
        $scope.status = color;
        $scope.modalMsg = msg;
    };

    setModalMsg("blue", "This command will create a new bulletin, but it will not send it."+
                        " To send the bulletin copy and paste the returned hex string into a service that transmits raw bitcoin transactions.");

    $scope.closeModal = function() {
        close(); 
    };

    $scope.handleComposeBltn = function(passphrase) {
        if (passphrase === "") {
            setModalMsg("red", "Enter a passphrase!");
            return;
        }

        ombWebSocket.unlockWallet(passphrase)
        .then(/* success */ function(reply) {
            $scope.passphrase = "";
            $scope.actionEnabled = false;
            console.log("unlocked wallet", reply);
            return ombWebSocket.composeBulletin(draftService);
        })
        .then(/* success */ function(reply) {
            setModalMsg("green", reply.result);
            draftService.msg = '';
            draftService.board = '';
            $scope.actionEnabled = true;

        }, /* failure */ function(reply) {
            $scope.passphrase = "";
            setModalMsg("red", reply.error.message);
            $scope.actionEnabled = true;
        });
    };
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
