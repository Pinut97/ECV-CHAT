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

//ROUTES
app.get("/", function(req, res){
	res.render("landing");
});

app.use("/rooms", roomRoutes);

//SOCKETS
wss.on("connection", function(ws){
	ws.send(JSON.stringify("Message from Server"));

	var room_name;
	var addedRoomObjects = [];

	ws.on("message", function(msg){
		var msg = JSON.parse(msg);
		if(msg.type === "room_name")
		{
			room_name = msg.room_name;
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
		else if(msg.type === "new_object")
		{
			//console.log(msg.data);
			var element = {
				room_name: room_name,
				data: msg.data
			};

			addedRoomObjects.push(element);
			//console.log(addedRoomObjects);
		}
	});

	ws.on("close", function(connection){
		console.log("Client left");
		updateRoomInfoDB(room_name, addedRoomObjects);
	});
});

server.listen(9022, function(){
	console.log("Server Started!");
});

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