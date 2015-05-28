'use strict'; 

angular.module('browseModule')
.controller('boardCtrl', function($scope, $location, $route, $routeParams, pubRecordService) {
    // captures /b/bltn /b/board /browse

    var lastRoute = $route.current;
    $scope.$on('$locationChangeSuccess', function(event, d) {
        var re = new RegExp(/^\/b\/|^\/browse/);
        if (re.test($location.path())) {
            $route.current = lastRoute;
        }
    });

    $scope.activeBoard = null;

    $scope.openBoard = function(board) {
        if (board.urlName === "") {
            $location.path("/b/nilboard");
        } else {
            $location.path("/b/board/" + board.summary.urlName);
        }
        if ($scope.activeBoard != null) {
            $scope.activeBoard.active = false;
        }
        board.active = true;
        pubRecordService.retreiveBoard(board)
        .then(function() {
            $scope.activeBoard = board;
        });
    }


    var browseP = pubRecordService.initPromise.then(function() {
        $scope.boards = pubRecordService.boardList;
    });

    // Decides where in the browsing hierarchy $location points which could be:
    // a link to all boards; a specific board; or a specific bltn in a board.
    var p = $location.path()
    
    // load relevant application data based on route.
    if (p.startsWith('/browse')) {

    } else if (p.startsWith('/b/board/') || p === "/b/nilboard") {
        var urlName = $routeParams['board'];
        if (p === "/b/nilboard") {
            urlName = "";
        }
        var boardP = browseP.then(function() {
            var board = pubRecordService.getBoardByUrlName(urlName);
            return pubRecordService.retreiveBoard(board);
        })
        .then(function() {
            var board = pubRecordService.getBoardByUrlName(urlName);
            board.active = true;
            $scope.activeBoard = board;
        });

    } else {
        //p.startsWith('/b/bltn')
        var txid = $routeParams['txid'];
        var boardUrl = ""
        var bltnP = pubRecordService.retreiveBulletin(txid)
        .then(function(result) {
            boardUrl = pubRecordService.getBulletin(txid).boardUrl;
            var board = pubRecordService.getBoardByUrlName(boardUrl);
            return pubRecordService.retreiveBoard(board);
        })
        .then(function() {
            var board = pubRecordService.getBoardByUrlName(boardUrl);
            var bltn = pubRecordService.getBulletin(txid);
            board.active = true;
            bltn.linked = true;
            bltn.detail = true;
            $scope.activeBoard = board;
        });
    }

    // Functions to bind into the current scope:
    $scope.moreDetail = function(bltn) {
        bltn.detail = !bltn.detail;
    }

    var base = "/static/images/"
    $scope.depthImg = function(bltn) {
        var curHeight = 444400;

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
.controller('authorCtrl', function($scope, $location, pubRecordService) {
    // captures /b/authors/ /b/author/<addr> /b/a/bltn/<txid>

});
/*

    console.log("ran ctrl");

    // NOTE this affects the global scope
    var lastRoute = $route.current;
    $scope.$on('$locationChangeSuccess', function(event, d) {
        var re = new RegExp(/^\/b\//);
        if (re.test($location.path())) {
            $route.current = lastRoute;
        }
    });


    var openBoard = function(board) {
        pubRecordService.setActiveBoard(board).then(function() {
            $scope.$broadcast('boardChanged', pubRecordService.activeBoard)
            if (board.urlName === "") {
                $location.path("/b/nilboard");
            } else {
                $location.path("/b/board/" + board.urlName);
            }
        });
    }
    $scope.openBoard = openBoard;


    pubRecordService.initPromise.then(function() {
        var boardGex = /^\/b\/board\/(.*)/;
        var path = $location.path();
        if (path === "/b/nilboard") {
            var board = pubRecordService.getBoardByUrlName("");
            openBoard(board);
        }
        var nameL = path.match(boardGex);
        if (nameL != null  && nameL.length > 1) {
            var urlName = nameL[1];
            var board = pubRecordService.getBoardByUrlName(urlName);
            openBoard(board);
        }

        $scope.boards = pubRecordService.boardList;
        $scope.activeBoard = pubRecordService.activeBoard;
/*********************** DIVIDER ******************************//*
.controller('boardCtrl', function($scope, $routeParams, pubRecordService, ombWebSocket, ombSettingService, ahimsaRestService) {
    $scope.board = pubRecordService.activeBoard;
    $scope.$on('boardChanged', function(e, board) { $scope.board = board; });

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

    $scope.moreDetail = function(bltn) {
        bltn.detail = !bltn.detail;
    }
});*/
