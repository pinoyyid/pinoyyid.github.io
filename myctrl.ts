/// <reference path="./typings/main/ambient/angular/angular.d.ts"/>
/// <reference path="./typings/main/ambient/ngdrive/drive_interfaces.d.ts"/>

interface LockyFile extends ngDrive.IDriveFile {
 _restore: boolean;																															// binds to checkbox
 _lockyRevisionId: string;																											// revision ID of the top/locky revision
 _previous: string;																															// the modified date of the prior revision
 _lockyStatus: string;																													// the result of removing the locky revision, either OK or an error code
 _metaStatus: string;																														// the result of patching the metadata, either OK or an error code
}

/**
 * This class implements the Main (and only) controller in the delockyfier app.
 *
 */
class MainCtrl {
 sig = 'MainCtrl';
 showButton: boolean;																														// set to true when all of the revisions lists have been fetched
 files: Array<LockyFile> = [];																										// array of lockyfied files

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
		this.files = <Array<LockyFile>> ro.data;
		ro.promise.then((resp) => {																									// when all files have been fetched, go on to fetch the revision lists
			this.getRevisions(this.files, DS)
		})
	}

	/**
	 * does a revisions list for all files
	 * @method getRevisions
	 * @param  {Array<ngDrive.IDriveFile>} files [description]
	 * @param  {[type]}                    DS    [description]
	 * @return {[type]}                          [description]
	 */
	getRevisions(files: Array<ngDrive.IDriveFile>, DS) {
		var promises: Array<ng.IPromise<any>> = [];
		for (var file of files) {
			promises.push(this.getRevision(<LockyFile> file, DS));										// save the promise so we know when all revisions have been fetched
		}
		this.$q.all(promises).then(() => {
			console.log('all revisions fetched');
			this.showButton = true;																										// once all have been fetched, enable the Restore button
		});
	}

	/**
	 * Called for each file. If it's the locky revision, stores the ID for subsequent deletion.
	 * For a prior revision, tracks the most recent and stores its metadata to patch the file back to its original values
	 *
	 * @method getRevision
	 * @param  {LockyFile}             file [description]
	 * @param  {ngDrive.IDriveService} DS   [description]
	 * @return {[type]}                     [description]
	 */
	getRevision(file: LockyFile, DS: ngDrive.IDriveService) {
		var extensionRegex = /\.[0-9a-z]+$/i;
		file._previous = '00 No previous version';
		var ro = DS.revisions.list({ fileId: file.id, fields: 'items/id,items/modifiedDate,items/originalFilename,items/modifiedDate' }, false);
  	ro.promise.then(resp => {
			for (var revision of resp.data.items) {																		// foreach revision
				if (revision.originalFilename.indexOf('.locky') > -1) {
					file._lockyRevisionId = revision.id;
				} else {
					if (revision.modifiedDate > file._previous) {													// if this revision is later than any previous revision
						file._previous = revision.modifiedDate;															// store its details
      			file.originalFilename = revision.originalFilename;
						file.fileExtension = file.originalFilename.match(extensionRegex)[0].replace('.', '');
						file._restore = true;																								// default is to restore files with a valid looking prior revision
					}
    		}
			}
		});
		return ro.promise;
	}


	/**
	 * Called onclick of the Restore button
	 * @method restoreFiles
	 * @return {[type]}     [description]
	 */
	restoreFiles() {
		for (var file of this.files) {
			this.restoreFile(file, this.DriveService);
		}
	}


	/**
	 * Called for each file
	 * Deletes the locky revision and patches the file metadata with the prior values
	 * @method restoreFile
	 * @param  {LockyFile}             file [description]
	 * @param  {ngDrive.IDriveService} DS   [description]
	 * @return {[type]}                     [description]
	 */
	restoreFile(file: LockyFile, DS: ngDrive.IDriveService) {
		console.log(file.title);
		if (!file._restore) {
			return;
		}
		console.log('deleting rev ' + file._lockyRevisionId);
		DS.revisions.del({ fileId: file.id, revisionId: file._lockyRevisionId }).promise
   .then(resp=> {
			file._lockyStatus = resp.status < 300 ? 'OK' : resp.status + ' ' + resp.statusText;
			file._restore = false;
		})
		console.log('patching title, filetype ' + file.originalFilename + ' ' + file.fileExtension);
		DS.files.patch({ fileId: file.id, resource: { title: file.originalFilename, originalFilename: file.originalFilename, fileExtension: file.fileExtension } }).promise
   .then(resp=> {
			file._metaStatus = resp.status < 300 ? 'OK' : resp.status + ' ' + resp.statusText;
		})
	}
}
angular.module('MyApp').
 controller('MainCtrl', MainCtrl);
