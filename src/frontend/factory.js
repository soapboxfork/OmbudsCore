'use strict';

var singleton = angular.module('ombWebAppFactory', ['ngWebSocket']);

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
    service.activeBoard = null;

    // TODO mix favorite data into board data
    service.setActiveBoard = function(urlName) {
        // TODO learn how promises work and implement them.
        if (service.boardList.length == 0) {
            console.log("empty");
            return
        }

        if (service.activeBoard != null) {
            service.activeBoard.active = false;
        }

        var board = service.boards[urlName];
        board.active = true;
        service.activeBoard = board;
        service.activeBoard.summary = board;


        $http.get("/api/board/"+urlName).then(function(result){
            // mix more of the board data into the existing model
            board.summary = result.data.summary;
            board.bltns = result.data.bltns;
        });

        
    }

    return service
});

singleton.factory('ahimsaRestService', function($http, $interval) {
  
  var serverInfo = { 'blkHeight': 0 };

  function updateService() { 
      $http.get('/api/status').then(function(result) {
          serverInfo = result.data;
      });
  }

  updateService();
  $interval(updateService, 15*1000, 0, true);

 
  
  // the endpoint must be from the same origin, otherwise this doesn't work!
  return {
    'getAllBoards': function() {
      return $http.get('/api/boards')
    },
    'getBoard': function(urlname) {
    // Use the encode function to prevent user submitted data from doing funky stuff with the url.
      return $http.get('/api/board/' + encodeURIComponent(urlname))
    },
    'getNilBoard': function() {
      return $http.get('/api/nilboard')
    },
    'getBlockCount': function() {
        return serverInfo.blkCount;
    },
 }
});

singleton.factory('ombWebSocket', function($websocket) {
    var dataStream = $websocket('ws://localhost:1055/ws/');
    var collection = [];

    dataStream.onMessage(function(message) {
        //console.log(message);
        collection.push(message.data);
    });

    function sendBulletin() {
       console.log("trying to send bulletin");
       var msg = { jsonrpc : "1.0", 
                   id: "bitcoin-rpc", 
                   method: "sendbulletin",
                   params: ["asdf", "asdf", "asdf"]
       };
       dataStream.send(JSON.stringify(msg));
    }

    return {
        'sendBulletin': sendBulletin,
        'collection': collection 
    }
});

singleton.factory('ombSettingService', function($http) {
    var settings;

    $http.get('/settings/').then(function(result) {
        settings = result.data;
    });

    function addFavoriteBoard(name) {
        $http.post('/settings/favorite/', {'type': 'board', 'val': name})
        .success(function(data){
            console.log("added favorite!")
        })
        .error(function(data){
            console.log('failed to add favorite');
        });
    }

    function delFavoriteBoard(name) {
        $http.post('/settings/favorite/', {'type': 'board', 'val': name, 'method':'delete'})
    }
    

    return {
        'getFavoriteBoards': function() { return settings.favorites.boards },
        'addFavoriteBoard': addFavoriteBoard,
        'delFavoriteBoard': delFavoriteBoard,
        'isFavoriteBoard': function(name) { 
            if(settings.favorites.boards.indexOf(name) >= 0) {
                return true
            } else { return false }
        }
    }
});
