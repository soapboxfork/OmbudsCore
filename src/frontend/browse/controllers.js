'use strict'; 

angular.module('browseModule')
.controller('boardCtrl', function($scope, $location, $route, $routeParams, pubRecordService, markdownService) {
    // captures /b/bltn /b/board /browse
    $scope.inBoard = true;
    addCommonFunctions($scope, markdownService);

    var lastRoute = $route.current;
    $scope.$on('$locationChangeSuccess', function(event, d) {
        var re = new RegExp(/^\/b\/b|^\/b\/nilboard|^\/browse/);
        if (re.test($location.path())) {
            $route.current = lastRoute;
        }
    });

    $scope.activeBoard = null;

    $scope.openBoard = function(board) {
        if (board.summary.urlName === "") {
            console.log('clicked a nil board');
            $location.path("/b/nilboard");
        } else {
            $location.path("/b/board/" + board.summary.name);
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
        angular.forEach(pubRecordService.boardList, function(b) {
            b.active = false;
        });
    });

    // Decides where in the browsing hierarchy $location points which could be:
    // a link to all boards; a specific board; or a specific bltn in a board.
    var p = $location.path();
    
    // load relevant application data based on route.
    if (p.startsWith('/browse')) {
        // TODO set empty pane active
        //
    } else if (p.startsWith('/b/board/') || p === "/b/nilboard") {
        var urlName = encodeURIComponent($routeParams['board']);
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

})
.controller('authorCtrl', function($scope, $location, $route, $routeParams, pubRecordService, markdownService) {
    // captures /b/authors/ /b/author/<addr> /b/a/bltn/<txid>
    $scope.inAuthor = true;
    addCommonFunctions($scope, markdownService);

    var lastRoute = $route.current;
    $scope.$on('$locationChangeSuccess', function(event, d) {
        var re = new RegExp(/^\/b\/author|^\/b\/a\/bltn/);
        if (re.test($location.path())) {
            $route.current = lastRoute;
        }
    });

    $scope.activeAuthor = null;

    $scope.openAuthor = function(author) {
        if (author.active == true) {
            return;
        }
        $location.path("/b/author/"+author.summary.addr);
        if ($scope.activeAuthor != null) {
            $scope.activeAuthor.active = false;
        }

        author.active = true;
        pubRecordService.initPromise.then(function() {
            return pubRecordService.retreiveAuthor(author)
        })
        .then(function() {
            $scope.activeAuthor = author;
        });

    };

    var browseP = pubRecordService.initPromise.then(function() {
        $scope.authors = pubRecordService.authorList;
        angular.forEach(pubRecordService.authorList, function(a) {
            a.active = false;
        });
    });

    var p = $location.path();

    if (p.startsWith('/b/author/')) {
        var addr = $routeParams['addr'];
        
        browseP.then(function() {
            var author = pubRecordService.getAuthor(addr);
            return pubRecordService.retreiveAuthor(author);
        })
        .then(function() {
            var author = pubRecordService.getAuthor(addr);
            author.active = true;
            $scope.activeAuthor = author;
        });
    }

    if (p.startsWith('/b/a/bltn/')) {
        var txid = $routeParams['txid'];
        var addr = ''
        var bltn = {};
        
        var bltnP = browseP.then(function() {
            return pubRecordService.retreiveBulletin(txid) 
        })
        .then(function() {
            bltn = pubRecordService.getBulletin(txid);
            return pubRecordService.retreiveAuthor(bltn);
        })
        .then(function() {
            var author = pubRecordService.getAuthor(bltn.author);
            author.active = true;
            bltn.linked = true;
            bltn.detail = true;
            $scope.activeAuthor = author;
        });
    }
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

function addCommonFunctions($scope, markdownService) {
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

    $scope.renderMd = function(bltn) {
        var html = markdownService.makeHtml(bltn.msg);
        bltn.markdown = html;
    }
}

