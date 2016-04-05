//
var myApp = angular.module('MyApp', ['ngm.ngDrive']);

angular.module('ngm.ngDrive')
    .provider('OauthService', ngDrive.Config)
    .config(function (OauthServiceProvider) {
        OauthServiceProvider.setScopes('https://www.googleapis.com/auth/drive.file');
				OauthServiceProvider.setClientID('292329129968-nrf447v3m1jqknroi1naii0kfs92bvf1.apps.googleusercontent.com');
        OauthServiceProvider.setTokenRefreshPolicy(ngDrive.TokenRefreshPolicy.ON_DEMAND);
    });
