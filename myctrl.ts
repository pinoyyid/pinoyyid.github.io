/// <reference path="./typings/main/ambient/angular/angular.d.ts"/>
/// <reference path="./typings/main/ambient/ngdrive/drive_interfaces.d.ts"/>

class MainCtrl {
 sig = 'MainCtrl';

 // a current file (the last inserted) that most functions will operate on
 currentFile: ngDrive.IDriveFile;
 currentFolder: ngDrive.IDriveFile;
 currentRevision: ngDrive.IDriveRevision;
 largestChangeId = 0;
 currentStepImage = '';

 fileButton: any;           // model of input type=file button

	files = [];

 static $inject = ['$scope', '$q', 'DriveService'];

 constructor(private $scope, private $q: ng.IQService, private DriveService: ngDrive.IDriveService) {
  $scope.vm = this;

  window['DS'] = this.DriveService;
  console.info("A reference to the DriveService has been placed at window.DS\nYou can use this to manually run commands, eg. DS.files.list({maxResults:1, fields:\"items\"})");
		this.getLockyFiles(this.DriveService);
 }

	/**
	 * does a files.list q to fetch locky files
	 *NB: side effect updates this.files
	 *
	 * @method getLockyFiles
	 * @param  {ngDrive.IDriveService} DS [description]
	 * @return {[type]}                   [description]
	 */
	getLockyFiles(DS: ngDrive.IDriveService) {
		var params: ngDrive.IDriveFileListParameters = {};
		params.q = "title contains '.locky'";
		var ro = DS.files.list(params, true);
		this.files = ro.data;
		ro.promise.then((resp) => { this.getRevisions(this.files, DS) })
	}

	getRevisions(files: Array<ngDrive.IDriveFile>, DS) {
		for (var file of files) {
			this.getRevision(file, DS);
		}
	}
// TODO // angular.js:13424 TypeError: Cannot read property 'headers' of undefined
 /*
    at HttpService._doHttp (module.js:1282)
    at HttpService.dq (module.js:1278)
    at module.js:1266
    at n (angular.js:12241)
    at m.$eval (angular.js:17025)
    at m.$digest (angular.js:16841)
    at m.$apply (angular.js:17133)
    at angular.js:12231
		*/
	getRevision(file: ngDrive.IDriveFile, DS: ngDrive.IDriveService) {
		// TODO lose warning about nextPageToken
		DS.revisions.list({ fileId: file.id, fields: 'items/id,items/originalFilename,items/modifiedDate' }, false)
   .promise.then(resp => {
			console.log(resp.data.items);
			for (var revision of resp.data.items) {
				if (revision.originalFilename.indexOf('.locky') > -1) {
					file['lockyRevisionId'] = revision.id;
					console.log('delete revision '+revision.id)
				} else {
     			file.originalFilename = '+ ' + revision.originalFilename;
    		}
			}
		});
	}


	click() {
		console.log('click');
	}
}
angular.module('MyApp').
 controller('MainCtrl', MainCtrl);
