var express 	= require("express"),
 	app 		= express(),
 	bodyParser 	= require("body-parser"),
 	mongoose 	= require("mongoose"),
 	WebSocket 	= require("ws"),
 	http 		= require('http'),
 	server 		= http.createServer(app),
 	wss 		= new WebSocket.Server({ server })

//requiring models
var Room 	= require("./models/room"),
	Element = require("./models/element")

//requiring routes
var roomRoutes = require("./routes/rooms")

mongoose.connect( "mongodb://localhost/room_manager_app", function( err )
{
	if( err ) { return console.error( 'failed' ) }
});
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

var rooms  = [];	//info about the rooms
var users = [];
var clients = [];	//connection itself

//ROUTES
app.get("/", function(req, res){
	res.render("landing");
});

app.use("/rooms", roomRoutes);

//SOCKETS
wss.on("connection", function(ws){

	ws.send(JSON.stringify("Message from Server"));

	var index = clients.push(ws) - 1;

	//give id to new user
	var initial_message = {
		type: 'init',
		data: index
	}
	ws.send(JSON.stringify(initial_message));

	var room_name;
	var addedRoomObjects = [];

	ws.on("message", function(msg){
		var message = JSON.parse(msg);

		if( message.type === "room_name" )
		{
			room_name = message.room_name;
			Room.find({name: room_name}, {_id: 0, objects: 1}, function(err, room_objects){
				if(err){
					console.log(err)
				} else {

					var message = {
						type: "initial_objects",
						data: room_objects
					};

					ws.send(JSON.stringify( message ));
				}

				if( !hasRoom(room_name) )
				{
					room = {
						name: room_name,
						user_ids: []	//id of the users contained in the room
					}
					room.user_ids.push( index );
					rooms.push( room );
				}
				else{
					addUserToExistingRoom( room_name, index );
				}
			});
			addUserToList( message, index );
		}
		else if( message.type === "new_object" )
		{
			var element = {
				room_name: room_name,
				data: message.data
			};

			replyToOthers( message, msg );

			addedRoomObjects.push( element );
		}
		else if( message.type === 'update_selectedObject_info')
		{
			replyToOthers( message, msg );
		}
		else if( message.type === 'object_deleted' )
		{
			replyToOthers( message, msg );
		}
	});

	ws.on("close", function(){
		console.log("Client " + index + " left");

		if( eliminateUser( index ) )
		{
			updateRoomInfoDB( room_name, addedRoomObjects );
		}

		//eliminate it from connetions list
		clients.splice( clients.indexOf( ws ), 1 );
	});
});

server.listen(9022, function(){
	console.log("Server Started!");
});

//reply the message from user to other users
function replyToOthers( message, msg )
{
	var position = returnRoomPositionByName( message.room_name );
	for( var i = 0; i < rooms[position].user_ids.length; i++)
	{
		if( rooms[position].user_ids[i] !== message.id )
		{
			clients[i].send( msg );
		}
	}
};

//search a room by its name and return its position in the list
function returnRoomPositionByName( name )
{
	for( var i = 0; i < rooms.length; i++)
	{
		if( rooms[i].name === name )
		{
			return i;
		}
	}
	return null;
};

//return true if room exists
function hasRoom( name )
{
	for( var i = 0; i < rooms.length; i++ )
	{
		if( rooms[i].name === name ){
			return true;
		}
	}
	return false;
};

//add the user id to the info in the room
function addUserToExistingRoom( room_name, user_id )
{
	var position = returnRoomPositionByName( room_name );
	rooms[position].user_ids.push( user_id );
};

//Updates the elements of a room
function updateRoomInfoDB( room_name, addedRoomObjects )
{
	console.log( "update info to db of: " + room_name );
	Room.findOne({name: room_name}, function( err, foundRoom ){
		if( err ){
			console.log(err);
		} else {
			for(var i = 0; i < addedRoomObjects.length; i++)
			{
				foundRoom.objects.push(addedRoomObjects[i].data);
			}
			foundRoom.save(function(err, savedRoom){
				if(err){
					console.log(err)
				} else {
					console.log( "Room: " + room_name + " saved" );
					//console.log(savedRoom);
				}
			});
		}
	});
};

function addUserToList( msg, index )
{
	var newUser = {
		id: index,
		room_name: msg.room_name
	}
	users.push( newUser );
};

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

//eliminate user from the list of the room
function eliminateUser( index )
{
	for( var i = 0; i < rooms.length; i++ )
	{
		if ( rooms[i].name === users[index].room_name )
		{
			for( var j = 0; j < rooms[i].user_ids.length; j++ )
			{
				if ( rooms[i].user_ids[j] === index )
				{
					rooms[i].user_ids.splice( j, 1 );
				}
			}
			if( rooms[i].user_ids.length === 0 )
			{	
				return rooms[i].name;	//return true if room is empty
			}
		}
	}
};