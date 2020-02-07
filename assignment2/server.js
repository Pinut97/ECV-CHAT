
var http = require('http');

var WebSocketServer = require('websocket').server;

var clients = [];
var users = [];

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

    connection.on('message', function(message){
        if(message.type === 'utf8'){
            //parse the message
            var msg = JSON.parse(message.utf8Data);

            //act depending on type
            if(msg.type === 'init')
            {
                //send info of the new user to all users including the new one since id has to be assigned
                addNewUser( msg, index );
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

function addNewUser( msg, index )
{
    var newUser = {
        type: 'init',
        name: msg.user_name,
        id: index,
        position: msg.position,
        imageIndex: msg.imageIndex
    }

    users.push( newUser );

    for(var i = 0; i < clients.length - 1; i++)
    {
        clients[i].send( JSON.stringify(newUser) );
    }

    var msg = {
        type: 'id',
        data: index
    }

    clients[clients.length - 1].send(JSON.stringify( msg ));

};