angular.module('settingsModule', ['backendHooks'])
.controller('settingsPaneCtrl', function($scope, settingsService, todoService) {
    $scope.notImpl = todoService.notImplemented;
    $scope.settings = settingsService;
     
})
.factory('settingsService', function() {
    // TODO save changes to the settings.
    var service = {
        renderMd: true
    };

    return service;
});
