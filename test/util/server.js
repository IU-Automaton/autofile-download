'use strict';

var http = require('http');
var fs   = require('fs');

module.exports = http.createServer(function (req, resp) {
    // console.log('requested', req.url);
    var location = __dirname + req.url;
    fs.stat(location, function (err, stats) {
        if (!err && stats.isFile()) {
            // console.log('serving', req.url);
            fs.createReadStream(__dirname + req.url).pipe(resp);
        } else {
            // console.log('not found', req.url);
            resp.writeHead(404);
            resp.end();
        }
    });
});