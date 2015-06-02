angular.module('settingsModule', ['backendHooks'])
.controller('settingsPaneCtrl', function($scope, todoService) {
    $scope.notImpl = todoService.notImplemented;
     
})
