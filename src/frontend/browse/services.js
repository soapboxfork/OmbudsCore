'use strict';

var singleton = angular.module('browseModule');

// This factory provides access to common public record data
singleton.factory('pubRecordService', function($http, $interval) {
    // Initalize the boards we will use in the app.
    var service = {};
    service.boards = {};
    service.boardList = [];

    console.log("ran factory")

    $http.get('/api/boards').then(function(result) {
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
        // TODO learn how promises work and implement them.
        if (service.boardList.length == 0) {
            console.log("empty");
            return
        }

        // if active board is empty
        if (Object.keys(service.activeBoard).length > 0) {
            service.activeBoard.active = false;
        }

        // Change the active board
        board.active = true;
        service.activeBoard = board;
        service.activeBoard.summary = board;
        var url = "/api/board/"+board.urlName;
        if (board.urlName === "") {
            url = "/api/nilboard"
        }
        $http.get(url).then(function(result){
            // mix more of the board data into the existing model
            board.summary = result.data.summary;
            board.bltns = result.data.bltns;
        });
    }

    service.setActiveBoardByUrl = function(urlName) {
        var board = service.boards[urlName];
        service.setActiveBoard(board);
    }

    return service;
});

