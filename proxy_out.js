var  //Change those variables to your preference
    passphrase = 'Some Secret!',
    https_port = 7202,
    path_ssl_certificate_key = '/path/ssl_certificate/key.pem',
    path_ssl_certificate_cert = '/path/ssl_certificate/cert.pem';

var
    fs = require('fs'),
    url = require('url'),
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
        target_url_obj,
        target_host_obj,
        target_host_request;

    if (request.headers.passphrase !== passphrase) {
        response.writeHead(400, {'Content-Type': 'text/plain'});
        response.write('Bad Request');
        response.end();
        return;
    }

    if (!request.headers.target_url) {
        response.writeHead(400, {'Content-Type': 'text/plain'});
        response.write('"target_url" missing in request headers');
        response.end();
        return;
    }

    target_url_obj = url.parse(request.headers.target_url);

    if (target_url_obj.protocol === 'https:') {
        target_host_options.port = target_url_obj.port || '443';
        target_host_obj = https;
    } else if (target_url_obj.protocol === 'http:') {
        target_host_options.port = target_url_obj.port || '80';
        target_host_obj = http;
    } else {
        response.writeHead(400, {'Content-Type': 'text/plain'});
        response.write('Unknown protocol: ' + JSON.stringify(target_url_obj.protocol));
        response.end();
        return;
    }

    if (!target_url_obj.hostname) {
        response.writeHead(400, {'Content-Type': 'text/plain'});
        response.write('Unknown host');
        response.end();
        return;
    }

    target_host_options.hostname = target_url_obj.hostname;
    target_host_options.path = target_url_obj.path || '/';

    if (target_url_obj.auth) {
        target_host_options.path = target_url_obj.auth;
    }

    target_host_options.agent = false;  //Disable socket pooling
    target_host_options.method = request.method;
    target_host_options.headers = request.headers;
    delete target_host_options.headers.target_url;
    delete target_host_options.headers.passphrase;
    delete target_host_options.headers.host;


    target_host_request = target_host_obj.request(target_host_options, function (target_host_response) {
        target_host_response.resume();

        response.writeHead(target_host_response.statusCode, target_host_response.headers);
        target_host_response.pipe(response);
    });

    target_host_request.on('error', function (err) {
        response.writeHead(400, {'Content-Type': 'text/plain'});
        response.write('PROXY target_host_request error\n');
        response.write(JSON.stringify(err));
        response.end();
    });


    request.pipe(target_host_request);
}

https.createServer(https_options, proxy_out).listen(https_port);

app_log('[main] proxy_out ..started...');
