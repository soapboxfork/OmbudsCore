'use strict';

var singleton = angular.module('browseModule');

// This factory provides access to common public record data
singleton.factory('pubRecordService', function($http, $interval) {
    // Initalize the boards we will use in the app.
    var service = {};
    service.boards = {};
    service.boardList = [];

    console.log("ran factory")

    service.initPromise = $http.get('/api/boards').then(function(result) {
        console.log("ran callback")
        
        angular.forEach(result.data, function(board){
            board.urlName = encodeURIComponent(board.name);
            service.boards[board.urlName] = board
            service.boardList.push(board)
        });

    });

    // Initialize the current Board
    service.activeBoard = {};

    // TODO mix favorite data into board data
    service.setActiveBoard = function(board) {

        // if active board is empty
        if (Object.keys(service.activeBoard).length > 0) {
            service.activeBoard.active = false;
        }

        var url = "/api/board/"+board.urlName;
        if (board.urlName === "") {
            url = "/api/nilboard"
        }
        var promise = $http.get(url).then(function(result){
            
            // Change the active board
            board.active = true;
            service.activeBoard = board;
            service.activeBoard.summary = board;

            // mix more of the board data into the existing model
            board.summary = result.data.summary;
            board.bltns = result.data.bltns;

        });
        return promise
    }

    service.getBoardByUrlName = function(urlName) {
        var board = service.boards[urlName];
        return board;
    }

    return service;
});

