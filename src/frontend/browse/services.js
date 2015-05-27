'use strict';

var singleton = angular.module('browseModule');

singleton.factory('browsePaneStateServie', function() {
    var currentLocation = "";
    var service = {
        currentLocation: ""
    }
    return service;
});

// This factory provides access to common public record data
singleton.factory('pubRecordService', function($http, $interval, $q) {
    
    // Initalize the pubrecord data we will use in the app.
    // Board fields
    var service = {};
    service.boards = {};
    service.boardList = [];

    // Author fields
    service.authors = {};
    service.authorList = [];

    // Bulletin fields
    service.bulletins = {};

    // Fill out the service from API calls with promises
    var boardPromise = $http.get('/api/boards').then(function(result) {
        angular.forEach(result.data, function(summary){
            var board = {
                'summary': summary,
                'bltns': [],
                'active': false
            }
            board.summary.urlName = encodeURIComponent(board.name);
            service.boards[board.summary.urlName] = board;
            service.boardList.push(board);
        });
    });

    var authorsPromise = $http.get('/api/authors').then(function(result) {
        angular.forEach(result.data, function(author) {
            var author = {
                'summary': author,
                'bltns': [],
                'active': false
            }
            service.authors[author.summary.addr]
            service.authorList.push(author)
        });
    });

    // This is a reliable promise to use for any controller that wants to browse
    // from boards or authors.
    service.initPromise = $q.all([boardsPromise, authorsPromise])

    // Gets additional data for a specific board. Places all retreived bulletins
    // in the service bltn object. Returns an $http promise on completion.
    service.retreiveBoard = function(board) {
        
        var url = "/api/board/"+board.summary.urlName;
        if (board.summary.urlName === "") {
            url = "/api/nilboard";
        }
        var promise = $http.get(url).then(function(result){
            // returns a list of ombjson.WholeBoard objects
            
            // Update the board summary, 
            board.summary = result.data.summary;
            
            angular.forEach(result.data.bltns, function(bltn) {
                service.bulletins[bltn.txid] = bltn;
                board.bltns.push(bltn);
            });

        });
        return promise;
    }

    service.retreiveAuthor = function(author) {
        var url = "/api/author/" + author.summary.addr;

        var promise = $http.get(url).then(function(result){
            // returns a list of ombjson.AuthorResp objects

            // Update the author's summary (note the fields name.)
            author.summary = result.data.author;
           
            angular.forEach(result.data.bltns, function(bltn) {
                service.bulletins[bltn.txid] = bltn;
                author.bltns.push(bltn);
            });

        });
        return promise;
    }


    service.getBoardByUrlName = function(urlName) {
        var board = service.boards[urlName];
        return board;
    }

    return service;
});

