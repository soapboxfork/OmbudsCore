'use strict';

angular.module('sendModule', ['backendHooks', 'walletModule', 'browseModule', 'angularModalService'])
.controller('sendPaneCtrl', function(
    $scope, 
    ombWebSocket, 
    walletService, 
    draftService, 
    sendPaneState, 
    markdownService, 
    ModalService,
    todoService
){

    $scope.draftBltn = draftService;
    $scope.wallet = walletService;
    $scope.state = sendPaneState;

    $scope.inAuthor = true;
    $scope.testBltn = {};

    var txFee = 50000;

    function updateEst(estimate) {
        estimate.len = draftService.board.length + draftService.msg.length;
        estimate.rawval = (txFee + Math.ceil(estimate.len/20)*567) / walletService.unitPerSat;
        estimate.val = estimate.rawval;
    };

    $scope.updateEst = updateEst;

    updateEst(sendPaneState.estimate);

    $scope.toggleRender = function() {
        sendPaneState.renderTog = !sendPaneState.renderTog;
        if (sendPaneState.renderTog) {
            // Create a new bltn and load it into scope.            
            var now = new Date().getTime();
            var testBltn = {
                msg: draftService.msg,
                board: draftService.board,
                timestamp: now,
                author: walletService.address
            };
            sendPaneState.testBltn = testBltn;
        } 
    }

    $scope.notImpl = todoService.notImplemented;

    $scope.showSendModal = function() {
        ModalService.showModal({
            templateUrl: "send/passphraseModal.html",
            controller: "sendModalCtrl"
        });
    }

    $scope.showComposeModal = function() {
        ModalService.showModal({
            templateUrl: "send/passphraseModal.html",
            controller: "composeModalCtrl"
        });
    }

})
.controller('passphraseModalCtrl', function($scope, ModalService) {

    $scope.passphrase = "";
    $scope.actionEnabled = true;

    console.log("Hit the passphrase Ctrl");

    $scope.setModalMsg = function(color, msg) {
        $scope.status = color;
        $scope.modalHtml = "";
        $scope.modalMsg = msg;
    };

    $scope.setModalHtml = function(color, elem) {
        $scope.color = color;
        $scope.modalMsg = "";
        $scope.modalHtmlMsg = elem;
    }
})
.controller('sendModalCtrl', function($scope, $q, $controller, close, ombWebSocket, sendPaneState, draftService) {
    $controller('passphraseModalCtrl', {$scope: $scope});

    $scope.closeModal = function() {
        close(); 
    };

    $scope.action = "Send";

    $scope.setModalMsg("red",  "This command will create a new bulletin and submit it to the bitcoin network."+
        " Be careful! Anything you say will be publicly recorded in the TestNet block chain.");

    console.log("hit sendModalCtrl");

    $scope.actionHandle = function(passphrase) {
        if (passphrase === "") {
            $scope.setModalMsg("red", "Enter a passphrase!");
            return;
        }
        ombWebSocket.unlockWallet(passphrase)
        .then(/* success */ function(reply) {
            $scope.passphrase = "";
            $scope.actionEnabled = false;
            console.log("send unlocked wallet", reply);
            return ombWebSocket.sendBulletin(draftService);
        }).then(/* success */ function(reply) {
            var txidhref = "/#/b/bltn/" + reply.result;
            var anchor = "<a href='"+txidhref+"' >"+reply.result+"</a>";
            $scope.setModalHtml("green", anchor);
            console.log("send suceeded:", reply);
            sendPaneState.resetDraft();
            $scope.actionEnabled = true;
        }, /* failure */ function(reply) {
            console.log("send failed for reason:", reply);
            $scope.passphrase = "";
            $scope.setModalMsg("red", reply.error.message);
            $scope.actionEnabled = true;
        });
    };
})
.controller('composeModalCtrl', function($scope, $q, $controller, close, ombWebSocket, sendPaneState, draftService) {
    $controller('passphraseModalCtrl', {$scope: $scope});

    $scope.closeModal = function() {
        close(); 
    };


    $scope.action = "Compose";

    $scope.setModalMsg("blue", "This command will create a new bulletin, but it will not send it."+
        " To send the bulletin copy and paste the returned hex string into"+ 
    " a service that transmits raw bitcoin transactions.");


    $scope.actionHandle = function(passphrase) {
        if (passphrase === "") {
            $scope.setModalMsg("red", "Enter a passphrase!");
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
            $scope.setModalMsg("green", reply.result);
            sendPaneState.resetDraft();
            $scope.actionEnabled = true;

        }, /* failure */ function(reply) {
            $scope.passphrase = "";
            $scope.setModalMsg("red", reply.error.message);
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
.factory('sendPaneState', function(draftService) {
    // Holds the state of the pane across initializations
    //
    var state = {
        renderTog: false, // The toggle for the bltn renderer
        testBltn: {},
        estimate: { 'val': '0.000', 'len': 0 },
    };

    state.resetDraft = function() {
        state.renderTog = false
        draftService.msg = '';
        draftService.board = '';
        state.estimate.len = 0;
        state.estimate.val = '0.000';
    }

    return state;
});
