/// <reference path="./typings/main/ambient/angular/angular.d.ts"/>
/// <reference path="./typings/main/ambient/ngdrive/drive_interfaces.d.ts"/>

interface LockyFile extends ngDrive.IDriveFile {
		_restore:boolean;																														// binds to checkbox
		_lockyRevisionId: string;																										// revision ID of the top/locky revision
		_previous: string;																													// the modified date of the prior revision
		_lockyStatus: string;																												// the result of removing the locky revision, either OK or an error code
		_metaStatus: string;																												// the result of patching the metadata, either OK or an error code
}

class MainCtrl {
 sig = 'MainCtrl';

 // a current file (the last inserted) that most functions will operate on
 currentFile: ngDrive.IDriveFile;
 currentFolder: ngDrive.IDriveFile;
 currentRevision: ngDrive.IDriveRevision;

 showButton: boolean;

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
		// debugger;
		var ro = DS.files.list(params, true);
		this.files = ro.data;
		var revisionsDef = this.$q.defer();
		ro.promise.then((resp) => { this.getRevisions(this.files, DS, revisionsDef) })
	}

	getRevisions(files: Array<ngDrive.IDriveFile>, DS, revisionsDef) {
		var promises:Array<ng.IPromise<any>>=[];
		for (var file of files) {
			promises.push(this.getRevision(<LockyFile> file, DS, revisionsDef));
		}
		this.$q.all(promises).then(()=>{
			console.log('all revisions fetched');
			this.showButton = true;
		})
	}

	getRevision(file: LockyFile, DS: ngDrive.IDriveService, revisionsDef:ng.IDeferred<any>) {
		var extensionRegex = /\.[0-9a-z]+$/i;
		file._previous = '00 No previous version';
		var ro = DS.revisions.list({ fileId: file.id, fields: 'items/id,items/modifiedDate,items/originalFilename,items/modifiedDate' }, false);
   	ro.promise.then(resp => {
			console.log(resp);
			for (var revision of resp.data.items) {
				if (revision.originalFilename.indexOf('.locky') > -1) {
					file._lockyRevisionId = revision.id;
					console.log('delete revision '+revision.id)
				} else {
					if (revision.modifiedDate > file._previous) {												// if this revision is later than any previous revision
						file._previous = revision.modifiedDate;														// store its details
     				file.originalFilename = revision.originalFilename;
						file.fileExtension = file.originalFilename.match(extensionRegex)[0].replace('.','');
						file._restore = true;  
					}
    		}
			}
		});
		return ro.promise;
	}


	recoverFiles() {
		for (var file of this.files) {
			this.recoverFile(file, this.DriveService);
		}
	}


	recoverFile(file:LockyFile, DS:ngDrive.IDriveService) {
		console.log(file.title);
		if (!file._restore) {
			return;
		}
		console.log('delete rev '+file._lockyRevisionId);
		DS.revisions.del({fileId: file.id, revisionId: file._lockyRevisionId }).promise
		.then(resp=>{
			file._lockyStatus = resp.status < 300?'OK':resp.status+' '+resp.statusText;
			file._restore = false;
		})
		console.log('patch title, filetype '+file.originalFilename+' '+file.fileExtension);
		DS.files.patch({fileId:file.id, resource:{title:file.originalFilename, originalFilename:file.originalFilename, fileExtension:file.fileExtension}}).promise
		.then(resp=>{
			file._metaStatus = resp.status < 300?'OK':resp.status+' '+resp.statusText;
		})
	}
}
angular.module('MyApp').
 controller('MainCtrl', MainCtrl);
