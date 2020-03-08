var express = require("express");
var app = express();

var mongoose = require("mongoose");
mongoose.connect("mongodb://localhost/room_manager_app");

var bodyParser = require("body-parser");

//var http = require('http');
//var WebSocket = require('websocket').server;

//const server = http.createServer(app);
//const wss = new WebSocket.Server({ server });

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static("public"));

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
			console.log(allRooms);
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
			console.log(room);
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
/*
wss.on('connection', function(request){
	ws.on('message', function(message){
		console.log( "message received" );
	});

	ws.send( "Hi there!" );
});
*/

app.listen(3000, function(){
	console.log("Room manager server has started");
});

