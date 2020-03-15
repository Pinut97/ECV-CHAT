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

mongoose.connect("mongodb://localhost/room_manager_app");
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

var objects  = [];
var users = [];

//ROUTES
app.get("/", function(req, res){
	res.render("landing");
});

app.use("/rooms", roomRoutes);

//SOCKETS
wss.on("connection", function(ws){

	ws.send(JSON.stringify("Message from Server"));

	var index = users.push(ws) - 1;

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
		if(message.type === "room_name")
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

					ws.send(JSON.stringify(message));
				}
			});
		}
		else if(message.type === "new_object")
		{
			var element = {
				room_name: room_name,
				data: message.data
			};

			replyToOthers( message, msg );

			addedRoomObjects.push(element);
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
		console.log("Client left");
		updateRoomInfoDB(room_name, addedRoomObjects);
	});
});

server.listen(9022, function(){
	console.log("Server Started!");
});

//reply the message from user to other users
function replyToOthers( message, msg )
{
	for( var i = 0; i < users.length; i++)
	{
		if( i !== message.id )
		{
			users[i].send( msg );
		}
	}
};

//Updates the elements of a room
function updateRoomInfoDB(room_name, addedRoomObjects)
{

	Room.findOne({name: room_name}, function(err, foundRoom){
		if(err){
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
					console.log(savedRoom);
				}
			});
		}
	});
};