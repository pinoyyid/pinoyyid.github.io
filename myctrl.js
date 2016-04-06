var MainCtrl = (function () {
    function MainCtrl($scope, $q, DriveService) {
        this.$scope = $scope;
        this.$q = $q;
        this.DriveService = DriveService;
        this.sig = 'MainCtrl';
        this.files = [];
        $scope.vm = this;
        window['DS'] = this.DriveService;
        console.info("A reference to the DriveService has been placed at window.DS\nYou can use this to manually run commands, eg. DS.files.list({maxResults:1, fields:\"items\"})");
        this.getLockyFiles(this.DriveService);
    }
    MainCtrl.prototype.getLockyFiles = function (DS) {
        var _this = this;
        var params = {};
        params.q = "title contains '.locky'";
        var ro = DS.files.list(params, true);
        this.files = ro.data;
        var revisionsDef = this.$q.defer();
        ro.promise.then(function (resp) { _this.getRevisions(_this.files, DS, revisionsDef); });
    };
    MainCtrl.prototype.getRevisions = function (files, DS, revisionsDef) {
        var _this = this;
        var promises = [];
        for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
            var file = files_1[_i];
            promises.push(this.getRevision(file, DS, revisionsDef));
        }
        this.$q.all(promises).then(function () {
            console.log('all revisions fetched');
            _this.showButton = true;
        });
    };
    MainCtrl.prototype.getRevision = function (file, DS, revisionsDef) {
        var extensionRegex = /\.[0-9a-z]+$/i;
        file._previous = '00 No previous version';
        var ro = DS.revisions.list({ fileId: file.id, fields: 'items/id,items/modifiedDate,items/originalFilename,items/modifiedDate' }, false);
        ro.promise.then(function (resp) {
            console.log(resp);
            for (var _i = 0, _a = resp.data.items; _i < _a.length; _i++) {
                var revision = _a[_i];
                if (revision.originalFilename.indexOf('.locky') > -1) {
                    file._lockyRevisionId = revision.id;
                    console.log('delete revision ' + revision.id);
                }
                else {
                    if (revision.modifiedDate > file._previous) {
                        file._previous = revision.modifiedDate;
                        file.originalFilename = revision.originalFilename;
                        file.fileExtension = file.originalFilename.match(extensionRegex)[0].replace('.', '');
                        file._restore = true;
                    }
                }
            }
        });
        return ro.promise;
    };
    MainCtrl.prototype.recoverFiles = function () {
        for (var _i = 0, _a = this.files; _i < _a.length; _i++) {
            var file = _a[_i];
            this.recoverFile(file, this.DriveService);
        }
    };
    MainCtrl.prototype.recoverFile = function (file, DS) {
        console.log(file.title);
        if (!file._restore) {
            return;
        }
        console.log('delete rev ' + file._lockyRevisionId);
        DS.revisions.del({ fileId: file.id, revisionId: file._lockyRevisionId }).promise
            .then(function (resp) {
            file._lockyStatus = resp.status < 300 ? 'OK' : resp.status + ' ' + resp.statusText;
            file._restore = false;
        });
        console.log('patch title, filetype ' + file.originalFilename + ' ' + file.fileExtension);
        DS.files.patch({ fileId: file.id, resource: { title: file.originalFilename, originalFilename: file.originalFilename, fileExtension: file.fileExtension } }).promise
            .then(function (resp) {
            file._metaStatus = resp.status < 300 ? 'OK' : resp.status + ' ' + resp.statusText;
        });
    };
    MainCtrl.$inject = ['$scope', '$q', 'DriveService'];
    return MainCtrl;
}());
angular.module('MyApp').
    controller('MainCtrl', MainCtrl);
