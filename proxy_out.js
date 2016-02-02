var  //Change those variables to your preference
    passphrase = 'Some Secret!',
    https_port = 7202,
    path_ssl_certificate_key = '/path/ssl_certificate/key.pem',
    path_ssl_certificate_cert = '/path/ssl_certificate/cert.pem';

var
    fs = require('fs'),
    http = require('http'),
    https = require('https');

var https_options = {
    key: fs.readFileSync(path_ssl_certificate_key),
    cert: fs.readFileSync(path_ssl_certificate_cert)
};

function app_log(text_in) {
    'use strict';
    console.log('[' + (new Date()).toISOString() + ']');
    console.log(text_in);
}

function proxy_out(request, response) {
    'use strict';
    var
        target_host_options = {},
        target_host_obj,
        target_host_request,
        request_dict,
        body = '';

    if (request.headers.passphrase !== passphrase) {
        response.writeHead(400, {'Content-Type': 'text/plain'});
        response.write('Bad Request');
        response.end();
        return;
    }

    request.on('data', function (chunk) {
        body += chunk;
    });

    request.on('end', function () {
        request_dict = JSON.parse(body);
        target_host_options = request_dict.options;

        if (target_host_options.hasOwnProperty('pfx')) {
            target_host_options.pfx = new Buffer(target_host_options.pfx, 'base64');
        }

        if (target_host_options.protocol === 'https:') {
            target_host_obj = https;
        } else if (target_host_options.protocol === 'http:') {
            target_host_obj = http;
        } else {
            response.writeHead(400, {'Content-Type': 'text/plain'});
            response.write('Unknown protocol: ' + JSON.stringify(target_host_options.protocol));
            response.end();
            return;
        }

        try {
            target_host_request = target_host_obj.request(target_host_options, function (target_host_response) {
                target_host_response.resume();

                response.writeHead(target_host_response.statusCode, target_host_response.headers);
                target_host_response.pipe(response);
            });

            target_host_request.on('error', function (err) {
                response.writeHead(400, {'Content-Type': 'text/plain'});
                response.write('PROXY target_host_request error\n');
                response.write(JSON.stringify(err));
                response.write('target_host_options\n');
                response.write(JSON.stringify(target_host_options));
                response.end();
            });

            target_host_request.write(request_dict.payload);
            target_host_request.end();

        } catch (err) {
            response.writeHead(400, {'Content-Type': 'text/plain'});
            response.write(err.message);
            response.write('\n----------------------------\n');
            response.write(err.stack);
            response.end();
            return;
        }

    });
}

https.createServer(https_options, proxy_out).listen(https_port);

app_log('[main] proxy_out ..started...');
