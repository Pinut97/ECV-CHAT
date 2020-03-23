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
	var room_index;

	ws.on("message", function(msg){
		var message = JSON.parse(msg);

		//enter a room
		if( message.type === "room_name" )
		{
			room_name = message.room_name;

			if( !hasRoom(room_name) )	//entering a new room
			{

				room = {
					name: room_name,
					user_ids: [],	//id of the users contained in the room
					objects: [] //room objects
				};

				//get the objects of the room from the db
				room.objects = getRoomObjectsDB(room.name, ws);
				console.log("Room objects: " + room.objects);

				var message = {
					type: "initial_objects",
					data: room.objects
				};

				clients[index].send(JSON.stringify(message));

				room.user_ids.push( index );
				rooms.push( room );
			}
			else	//add user to existing room, also has to retrieve the info so far
			{
				addUserToExistingRoom( room_name, index );
				sendRoomInfo( room_name, index );
			}

			room_index = getRoomIndex(room_name);
			addUserToList( message, index );
		}
		else if( message.type === "new_object" )
		{
			var element = {
				room_name: room_name,
				data: message.data
			};

			replyToOthers( message, msg );

			rooms[room_index].push( element );
		}
		else if( message.type === 'update_selectedObject_info')
		{
			var object_index = getObjectIndex(room_index, message.data.id);
			rooms[room_index].objects[object_index].position = message.data.position;
			rooms[room_index].objects[object_index].rotation = message.data.rotation;
			rooms[room_index].objects[object_index].scale = message.data.scale;
			replyToOthers( message, msg );
		}
		else if( message.type === 'object_deleted' )
		{
			rooms[room_index].objects.splice(getObjectIndex(room_index, message.data), 1);
			replyToOthers( message, msg );
		}
		else if( message.type === 'update_room_info')
		{
			if( index === message.id )
			{
				clients[message.id].send( msg );
			}
		}
	});

	ws.on("close", function(){
		console.log("Client " + index + " left");
		
		var room = eliminateUser( index );

		if( room )
		{
			updateRoomInfoDB( room, rooms[room_index].objects );
			deleteRoom(room);
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
function updateRoomInfoDB( room_name, room_objects )
{
	Room.update({name: room_name}, {$set: {objects: room_objects}}, function(err, room){
		if(err){
			console.log(err);
		} else {
			console.log(room);
		}
	})
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

function getRoomObjectsDB( room_name, ws )
{

	var foundObjects;

	Room.findOne({name: room_name}, { _id : 0, objects: 1}, function(err, foundRoom){
		if(err){
			console.log(err);
			return null;
		} else {
			console.log("getRoomObjectsDB: " + foundRoom.objects);
			return foundRoom.objects;
		}
	});

	if(foundObjects)
	{
		return foundObjects;
	}
	else
	{
		return null;
	}

};

function isRoomEmpty( room_name )
{
	if( rooms[ returnRoomPositionByName(room_name) ].length === 0 )
		return true;
	return false;
};

function deleteRoom (room_name)
{
	for(var i = 0; i < rooms.length; i++)
	{
		if(rooms[i].name === room_name)
		{
			rooms.splice(i, 1);
		}
	}
};

function sendRoomInfo(room_name, index)
{
	for(var i = 0; i < rooms.length; i++)
	{
		if(rooms[i].name === room_name)
		{
			message = {
				type: "initial_objects",
				data: rooms[i].objects
			};

			clients[index].send(JSON.stringify(message));
		}
	}

	console.log("ERROR");
};

function getRoomIndex(room_name)
{
	for(var i = 0; i < rooms.length; i++)
	{
		if(rooms[i].name === room_name)
		{
			return i;
		}
	}
};

function getObjectIndex(room_index, objectId)
{
	for(var i = 0; i < rooms[room_index].objects; i++)
	{
		if(rooms[room_index].objects[i].id === objectId)
		{
			return i;
		}
	}
};

/*
function sendRoomInfo(room_name, index)
{
	var room_objects = [];

	Room.findOne({name: room_name}, {_id: 0, objects: 1}, function(err, foundRoom){
		if(err){
			console.log(err);
		} else {
			console.log("SendRoomInfo: " + room_objects);
			room_objects = foundRoom.objects;

		}
	});
};
*/