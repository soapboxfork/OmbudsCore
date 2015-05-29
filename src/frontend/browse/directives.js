'use strict';

angular.module("browseModule")
// Directives
.directive('browseBoard', function() {
    return {
        templateUrl: 'browse/board-elem.html',
        // the restrict tag means that only html elements that have the class "bulletin"
        // end up with the bltn.html template rendered below them.
        restrict: 'C',
    }
})
.directive('browseAuthor', function() {
    return {
        templateUrl: 'browse/author-elem.html',
        restrict: 'C',
    };
})
.directive('pinBulletin', function() {
    return {
        templateUrl: 'browse/pinned-bulletin.html', 
        restrict: 'C',
    }
})
.controller('bltnCtrl', function($scope, markdownService) {
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
        console.log("Produced this html:", html);
        bltn.markdown = html;
    }
})
.directive('testBulletin', function() {
    var scope = {
        'bltn': '=bltn',
        'inAuthor': '=author'
    }

    return {
        scope: scope,
        templateUrl: 'browse/pinned-bulletin.html',
        restrict: 'C',
        controller: 'bltnCtrl'
    }
})
