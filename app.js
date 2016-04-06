//
var myApp = angular.module('MyApp', ['ngm.ngDrive']);

angular.module('ngm.ngDrive')
    .provider('OauthService', ngDrive.Config)
    .config(function (OauthServiceProvider) {
        OauthServiceProvider.setScopes('https://www.googleapis.com/auth/drive');
				OauthServiceProvider.setClientID(window.ngdrive_clientid);
        OauthServiceProvider.setTokenRefreshPolicy(ngDrive.TokenRefreshPolicy.ON_DEMAND);
    });
