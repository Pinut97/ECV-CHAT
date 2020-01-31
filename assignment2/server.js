
var webSocketServer = require('websocket').server;
var http = require('http');

var ourPort = 9022;
var clients = [];

var server = http.createServer(function(request, response)
{

});

server.listen(ourPort, function()
{
	console.log("Server listening to port: " + ourPort);
});

wsServer = new webSocketServer({
	httpServer: server
});

wsServer.on('request', function(request)
{
	var connection = request.accept(null, request.origin);
	console.log("new user");

	connection.on('message', function(message)
	{

	});

	connection.on('close', function(connection)
	{

	});
});

/*
var http = require('http');
var url = require('url');

var server = http.createServer( function(request, response) {
	console.log("REQUEST: " + request.url );
	var url_info = url.parse( request.url, true ); //all the request info is here
	var pathname = url_info.pathname; //the address
	var params = url_info.query; //the parameters
	response.end("OK! User connected"); //send a response
});
server.listen(9022, function() {
	console.log("Server ready!" );
});
*/