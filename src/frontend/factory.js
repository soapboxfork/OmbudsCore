'use strict';

var singleton = angular.module('ombWebAppFactory', ['ngWebSocket']);


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

    function sendBulletin(draft) {
       console.log("trying to send bulletin");
       var msg = { jsonrpc : "1.0", 
                   id: "bitcoin-rpc", 
                   method: "sendbulletin",
                   params: ["myAddress", draft.board, draft.msg]
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
