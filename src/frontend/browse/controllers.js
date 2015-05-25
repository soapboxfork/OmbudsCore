'use strict'; 

angular.module('browseModule')
.controller('browsePaneCtrl', function($scope) {


})
.controller('boardCtrl', function($scope, $routeParams, pubRecordService, ombWebSocket, ombSettingService, ahimsaRestService) {
    $scope.board = pubRecordService.activeBoard;

    $scope.reply = ombWebSocket.sendBulletin;

    $scope.handleFavorite = function(board) {
        if (!board.favorite) {
            board.favorite = true
            ombSettingService.addFavoriteBoard(board.name);
        } else {
            board.favorite = false
            ombSettingService.delFavoriteBoard(board.name);
        }
    }

    $scope.switcheroo = true;

    $scope.id = function(front, bltn) {
        return front + bltn.txid;
    }

    var base = "/static/images/"
    $scope.depthImg = function(bltn) {
        var curHeight = ahimsaRestService.getBlockCount();

        if (!angular.isDefined(bltn.blk)) {
            // The bltn is not mined
            return base + "0conf.png"       
        } else {
            // The bltn is in some block
            var diff = curHeight - bltn.blkHeight;

            if (diff > 3) {
                // The bltn is somewhere in the chain
                return base + "totalconf.png"
            }
            // The bltn is less than 5 blocks deep
            return base + (diff + 1) + "conf.png"
        }
    }
})
.controller('nilboardCtrl', function($scope, ahimsaRestService) {
    ahimsaRestService.getNilBoard().then(function(result) {
        $scope.board = result.data;
    });
})
// TODO convert into no content blank pane.
.controller('welcomeCtrl', function($scope) {

})
.controller('browseCtrl', function($scope, $location, $routeParams, pubRecordService) {

    $scope.boards = pubRecordService.boardList;
    $scope.activeBoard = pubRecordService.activeBoard;
    console.log("ran ctrl")

    var gex = /^\/b\/board\/(.*)/

    var nameL = $location.path().match(gex)
    if (nameL != null  && nameL.length > 1) {
        var urlName = nameL[1];
        pubRecordService.setActiveBoard(urlName);
    }

    $scope.openBoard = function(urlName) {
        pubRecordService.setActiveBoard(urlName)
        if (urlName === "") {
            $location.path("/b/nilboard");
        } else {
            $location.path("/b/board/" + urlName);
        }
    }
});


