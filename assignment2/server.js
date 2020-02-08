
var http = require('http');

var WebSocketServer = require('websocket').server;

var clients = [];
var users = [];
var messages = [];
var userConnected = [];

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

    //client messages manager
    connection.on('message', function(message){
        if(message.type === 'utf8'){
            //parse the message
            var msg = JSON.parse(message.utf8Data);

            //act according to message type
            if(msg.type === 'init')
            {
                //send info of the new user to all users including the new one since id has to be assigned
                addNewUser( msg, index );
                for(var i = 0; i < messages.length; i++)
                {
                    connection.send(JSON.stringify(messages[i]));
                }
            }
            else if( msg.type === 'msg' )
            {
                messages.push(msg);

                for( var i = 0; i < clients.length; i++ )
                {
                    if(i != msg.id)
                    {
                        clients[i].send( message.utf8Data );
                    }
                }
            }
            else if( msg.type === 'update' )
            {
                for( var i = 0; i < clients.length; i++ )
                {
                    clients[i].send( message.utf8Data );
                }
            }
            else if( msg.type === 'posRequest')
            {
                for(var i = 0; i < users.length; i++)
                {
                    clients[i].send( message.utf8Data );
                }
            }
        }
    });

    connection.on('close', function(connection){
        console.log("user is gone");

        var auxiliar_user = findUserByIndex( index );

        var logout = {
            type: 'logout',
            id: index,
            name: auxiliar_user.name
        }

        for( var i = 0; i < clients.length; i++ )
        {
            console.log( "Index of user: " + users.indexOf( users[i] ) );
            if( users[i].id === index )
            {
                console.log( users.length );
                console.log("pre splice: " + users);
                console.log("pre splice clients: " + clients);
                users.splice( i, 1 );
                console.log("post splice: " + users);
                console.log("post splice: " + clients);
                break;
            }
        }

        console.log(users);

        for( var i = 0; i < clients.length; i++ )
        {
            clients[i].send( JSON.stringify( logout ));
        }
        clients.splice( clients.indexOf( connection ), 1 );
    });
});

function findUserByIndex( index )
{
    for( var i = 0; i < users.length; i++ )
    {
        if ( users[i].id === index )
        {
            return users[i];
        }
    }
};

//Add new user when init message is sent by a new client
function addNewUser( msg, index )
{
    var newUser = {
        type: 'init',
        name: msg.name,
        id: index,
        position: msg.position,
        imageIndex: msg.imageIndex
    };

    var idMsg = {
        type: 'id',
        data: index
    };

    var welcome = {
        type: 'msg',
        subtype: 'info',
        data: msg.name + " has connected!"
    };

    var posRequest = {
        type: 'posRequest'
    };

    users.push( newUser );
    userConnected.push(newUser);
    
    for(var i = 0; i < clients.length - 1; i++)
    {
        clients[i].send( JSON.stringify( newUser ));    //send the information of new user to all other users
        clients[i].send( JSON.stringify( welcome ));    //send message user has connected to all users
        clients[clients.length - 1].send( JSON.stringify( users[i] ));    //send the information of other users to the new user
    }

    clients[clients.length - 1].send(JSON.stringify( idMsg ));
};