/*global describe, it, before, beforeEach, after*/

'use strict';

var expect = require('expect.js');

var automaton = require('automaton').create();
var download = require('../autofile');
var md5check = require('./util/md5check');
var async = require('async');
var rimraf = require('rimraf');
var server = require('./util/server');

// http server settings
var httpServerPort = 8080;

// test files
var file1Url = 'http://localhost:' + httpServerPort + '/logo.png';
var file1Md5 = '30b20f64db5d79df9fbc6e1f6b745e30';
var file2Url = 'http://localhost:' + httpServerPort + '/pic.jpg';
var file2Md5 = 'fc36541ba12333ac53dc3b616b77fa33';

// ------------------------------------------------------------------------------------------

describe('download', function () {
    before(function (done) {
        server.listen(httpServerPort);

        done();
    });

    after(clearTmpDir);
    beforeEach(clearTmpDir);

    it('files option should work with a single file', function (done) {
        var destFile = __dirname + '/tmp/file1';

        var options = {
            files: {}
        };
        options.files[file1Url] = destFile;

        automaton.run(download, options, function (err) {
            if (err) {
                throw err;
            }

            // check if file is where and what expected
            md5check(destFile, function (err, downloadedFileMd5) {
                expect(downloadedFileMd5).to.be(file1Md5);

                done(err);
            });
        });
    });

    it('files option should work with multiple files', function (done) {
        var destFile1 = __dirname + '/tmp/file1';
        var destFile2 = __dirname + '/tmp/file2';

        var options = {
            files: {}
        };
        options.files[file1Url] = destFile1;
        options.files[file2Url] = destFile2;

        var checksums = {};
        checksums[file1Url] = file1Md5;
        checksums[file2Url] = file2Md5;

        automaton.run(download, options, function (err) {
            if (err) {
                throw err;
            }

            var tasks = {};
            for (var url in options.files) {
                tasks[url] = function (url, cb) {
                    // check if file is where and what expected
                    md5check(options.files[url], function (err, downloadedFileMd5) {
                        expect(downloadedFileMd5).to.be(checksums[url]);

                        cb(err);
                    });
                }.bind(null, url);
            }

            async.parallel(tasks, function (err) {
                done(err);
            });
        });
    });

    it.skip('concurrency option should not limit when 0', function (done) {

    });

    it.skip('concurrency option should throttle when download more than the limit', function (done) {

    });
});

// ------------------------------------------------------------------------------------

var clearTmpDir = function (done) {
    rimraf('./tmp/', function (err) {
        done(err);
    });
};