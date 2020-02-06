
var http = require('http');

var WebSocketServer = require('websocket').server;

var clients = [];

var server = http.createServer(function(request, response){
    console.log("REQUEST: " + request.url);
    response.end("OK");
});

server.listen(9022, function(){
    console.log("server running at port: 9022");
});

wsServer = new WebSocketServer({
    httpServer: server
});

wsServer.on('request', function(request){
    var connection = request.accept(null, request.origin);
    console.log("new websocket user!");

    var index = clients.push(connection) - 1;
    userId = {
        type: 'id',
        data: index
    }
    connection.send(JSON.stringify(userId));

    connection.on('message', function(message){
        if(message.type === 'utf8'){
            //parse the message
            var msg = JSON.parse(message.utf8Data);

            //act depending on type
            if(msg.type === 'init')
            {
                console.log("message init received with id " + msg.id);
                for(var i = 0; i < clients.length; i++)
                {
                    if(i != msg.id)
                    {
                        clients[i].send( message.utf8Data );
                    }
                }
            }
            else if( msg.type === 'msg' )
            {
                console.log( "message type msg received on server!" );
                console.log("Clients length: " + clients.length);
                for( var i = 0; i < clients.length; i++ )
                {
                    if(i != msg.id)
                    {
                        clients[i].send( message.utf8Data );
                    }
                }
            }
        }
    });

    connection.on('close', function(connection){
        console.log("user is gone");
    });
});
