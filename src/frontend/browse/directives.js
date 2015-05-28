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
    });
