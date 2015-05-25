'use strict';

angular.module("browseModule")
    // Directives
    .directive('browseBoard', function() {
        return {
            templateUrl: 'browse/browse-board.html',
            // the restrict tag means that only html elements that have the class "bulletin"
            // end up with the bltn.html template rendered below them.
            restrict: 'C',
        }
    })
    .directive('pinBulletin', function() {
        return {
            templateUrl: 'browse/pinned-bulletin.html', 
            restrict: 'C',
        }
    });
