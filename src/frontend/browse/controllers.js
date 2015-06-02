'use strict'; 

angular.module('browseModule')
.controller('parentBrowseCtrl', function($scope) {
    $scope.favTog = false;
    $scope.isFavorite = function(val, i) {
        if ($scope.favTog) {
            if (val.favorite) {
                return true;
            } else {
                return false;
            }
        } 
        return true;
    };
    
})
.controller('boardCtrl', function($scope, $location, $route, $routeParams, $controller, pubRecordService, markdownService) {
    // captures /b/bltn /b/board /browse
    $scope.inBoard = true;
    $controller('parentBrowseCtrl', {$scope: $scope});


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
.controller('authorCtrl', function($scope, $location, $route, $routeParams, $controller, pubRecordService, markdownService) {
    // captures /b/authors/ /b/author/<addr> /b/a/bltn/<txid>
    $scope.inAuthor = true;
    $controller('parentBrowseCtrl', {$scope: $scope});



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
})
.controller('bltnCtrl', function($scope, markdownService, settingsService) {
// Functions to bind into the current scope:
    var bltn = $scope.bltn;

    $scope.moreDetail = function(bltn) {
        bltn.detail = !bltn.detail;
    }

    var base = "/static/images/"
    $scope.depthImg = function(bltn) {
        var curHeight = 446000;

        if (!angular.isDefined(bltn.blk)) {
            // The bltn is not mined
            return base + "0conf.png"       
        } else {
            // The bltn is in some block
            var diff = 9001;
            if (bltn.hasOwnProperty('blkHeight')) {
                diff = curHeight - bltn.blkHeight;
            }

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

    if (settingsService.renderMd) {
        bltn.renderMd = true;
        if (bltn.hasOwnProperty('msg') && bltn.msg !== "") {
            $scope.renderMd(bltn);
        }
    }
});
