// angular.module('MyApp').
myApp.
controller('MainCtrl', ['$scope', 'DriveService', function($scope,DriveService) {
	DriveService.files.insert({title: 'file title', mimeType:'text/plain'})
  .promise.then(()=>{console.log('new file inserted')})
    $scope.driversList = [
      {
          Driver: {
              givenName: 'Sebastian',
              familyName: 'Vettel'
          },
          points: 322,
          nationality: "German",
          Constructors: [
              {name: "Red Bull"}
          ]
      },
      {
          Driver: {
          givenName: 'Fernando',
              familyName: 'Alonso'
          },
          points: 207,
          nationality: "Spanish",
          Constructors: [
              {name: "Ferrari"}
          ]
      }
    ];
}]);
