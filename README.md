# Node_Proxy
The proxy is divided in to two separate apps, one for inbound and the other one for outbound traffic.

proxy_in.js : Forwards external requests to your server

proxy_out.js : Forwards requests from your server to external hosts


# How to install:
1) Just copy the following file(s) to a directory on a computer with Node installed.

2) Change the variables declared at the top of each file with your values.

3) From the command line start the proxy as:
    $ node proxy_in.js
    $ node proxy_out.js


# Useful when:
* Static IP address is required for GAE Google App Engine.
* You don't want to expose your servers.
* Written in javascript very easy to customize.
