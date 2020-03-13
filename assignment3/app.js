const express = require("express");
const app = express();
const WebSocket = require("ws");
const http = require('http');
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

var mongoose = require("mongoose");
mongoose.connect("mongodb://localhost/room_manager_app");

var bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static("public"));

var objects  = [];

var objectSchema = new mongoose.Schema({
	type: String,
	id: Number,
	position: [Number],
	rotation: [Number],
	scaling: [Number],
});

var roomSchema = new mongoose.Schema({
	name: String,
	description: String,
	objects: [objectSchema]
});

var Room = mongoose.model("Room", roomSchema);

app.get("/", function(req, res){
	res.render("landing");
});

app.get("/rooms", function(req, res){
	Room.find({}, function(err, allRooms){
		if(err){
			console.log(err)
		} else {
			res.render("rooms", {rooms:allRooms});
		}
	});
});

app.post("/rooms", function(req, res){
	Room.create({
		name: req.body.name,
		description: req.body.description
	},function(err, room){
		if(err){
			console.log(error);
		} else {
			console.log("room posted: " + room);
		}
	});

	res.redirect("/rooms");
});

app.get("/rooms/new", function(req, res){
	res.render("new.ejs");
});

app.get("/rooms/:id", function(req, res){
	Room.findById(req.params.id, function(err, foundRoom){
		if(err){
			console.log(err)
		} else {
			res.render("room", {room: foundRoom});
		}
	});
});

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

/*
	console.log("Objects to send to room: " + room_objects);
	Room.updateOne({name: room_name}, {$addFields: {objects: room_objects}}, function(err, room){
		if(err){
			console.log(err);
		} else {
			console.log(room);
		}
	});
*/
};