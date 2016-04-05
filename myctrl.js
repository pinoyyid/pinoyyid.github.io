var MainCtrl = (function () {
    function MainCtrl($scope, $q, DriveService) {
        this.$scope = $scope;
        this.$q = $q;
        this.DriveService = DriveService;
        this.sig = 'MainCtrl';
        this.largestChangeId = 0;
        this.currentStepImage = '';
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
        ro.promise.then(function (resp) { _this.getRevisions(_this.files, DS); });
    };
    MainCtrl.prototype.getRevisions = function (files, DS) {
        for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
            var file = files_1[_i];
            this.getRevision(file, DS);
        }
    };
    MainCtrl.prototype.getRevision = function (file, DS) {
        DS.revisions.list({ fileId: file.id, fields: 'items/id,items/originalFilename,items/modifiedDate' }, false)
            .promise.then(function (resp) {
            console.log(resp.data.items);
            for (var _i = 0, _a = resp.data.items; _i < _a.length; _i++) {
                var revision = _a[_i];
                if (revision.originalFilename.indexOf('.locky') > -1) {
                    file['lockyRevisionId'] = revision.id;
                    console.log('delete revision ' + revision.id);
                }
                else {
                    file.originalFilename = '+ ' + revision.originalFilename;
                }
            }
        });
    };
    MainCtrl.prototype.click = function () {
        console.log('click');
    };
    MainCtrl.$inject = ['$scope', '$q', 'DriveService'];
    return MainCtrl;
}());
angular.module('MyApp').
    controller('MainCtrl', MainCtrl);
