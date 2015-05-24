var ctrls = angular.module('ombWebAppControllers', ['btford.markdown']);

ctrls.controller('board', function($scope, $routeParams, pubRecordService, ombWebSocket, ombSettingService, ahimsaRestService) {
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
});

ctrls.controller('nilboard', function($scope, ahimsaRestService) {
    ahimsaRestService.getNilBoard().then(function(result) {
        $scope.board = result.data;
    });
})

ctrls.controller('welcome', function($scope) {

});

ctrls.controller('browseCtrl', function($scope, $location, $routeParams, pubRecordService) {

    $scope.boards = pubRecordService.boardList;
    $scope.activeBoard = pubRecordService.activeBoard;
    console.log("ran ctrl")

    var gex = /^\/board\/(.*)/

    var nameL = $location.path().match(gex)
    if (nameL != null  && nameL.length > 1) {
        var urlName = nameL[1];
        pubRecordService.setActiveBoard(urlName);
    }

    $scope.openBoard = function(urlName) {
        pubRecordService.setActiveBoard(urlName)
        if (urlName === "") {
            $location.path("/nilboard");
        } else {
            $location.path("/board/" + urlName);
        }
    }
})


