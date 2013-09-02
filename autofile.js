'use strict';

var request = require('request');
var progress = require('request-progress');
var async = require('async');
var fs = require('fs');

// -----------------------------------------------------------------------------

module.exports = function (task) {
    task
    .id('download')
    .name('Download')
    .author('Indigo United')

    // TODO: add support for only specifying destination folder and name is auto

    .option('files', 'An object with the links (keys) and destination location (values).')
    .option('concurrency', 'The maximum concurrent downloads. 0 is unlimited.', 0)

    .setup(function (opts, ctx, next) {
        opts.totalFiles = Object.keys(opts.files).length;

        opts.concurrency = parseInt(opts.concurrency);

        next();
    })

    .do(function (opts, ctx, next) {
        var stats = {
            totalData:         0,
            accountedForTotal: {},
            receivedData:      0
        };

        var downloads = {};

        for (var url in opts.files) {
            downloads[url] = downloader(url, opts.files[url], stats, ctx);
        }

        parallel(downloads, opts.concurrency, function (err) {
            ctx.log.debugln('Completed all downloads');

            next(err);
        });
    }, {
        description: 'Download {{totalFiles}} files'
    });
};

// -----------------------------------------------------------------------------

function downloader(url, dest, stats, ctx) {
    return function (cb) {
        progress(request(url), {
            throttle: 1000,
            delay:    0
        })
        .on('progress', function (state) {
            stats.receivedData += state.received;

            if (!stats.accountedForTotal.hasOwnProperty(url)) {
                stats.totalData += state.total;
                stats.accountedForTotal[url] = true;
            }

            ctx.log.infoln(url, state.percent + '%');
        })
        .on('error', function (err) {
            // TODO: maybe give option to fail silently individual files?

            return cb(err);
        })
        .pipe(fs.createWriteStream(dest))
        .on('error', function (err) {
            // TODO: maybe give option to fail silently individual files?

            return cb(err);
        })
        .on('close', function (err) {
            ctx.log.successln('Completed download');

            return cb(err);
        });
    };
}

function parallel(tasks, limit, callback) {
    if (limit) {
        return async.parallelLimit(tasks, limit, callback);
    } 

    return async.parallel(tasks, callback);
}