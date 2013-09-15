var ss = require('node-static');
var path = require('path');

var file = new ss.Server(path.resolve(__dirname, 'public'));

require('http').createServer(function (request, response) {
    console.log('serving %s', request.url);
    request.addListener('end', function () {
        //
        // Serve files!
        //
        file.serve(request, response);
    }).resume();
}).listen(8080);