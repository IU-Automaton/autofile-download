'use strict';

var crypto = require('crypto');
var fs     = require('fs');

module.exports = function (file, callback) {
    var md5 = crypto.createHash('md5');

    var s = fs.ReadStream(file);
    s.on('data', function (d) {
        md5.update(d);
    });

    s.on('end', function () {
        callback(null, md5.digest('hex'));
    });
};