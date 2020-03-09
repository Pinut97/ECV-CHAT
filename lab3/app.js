const express = require("express");
const enableWs = require("express-ws");

const app = express();
enableWs(app);

var mongoose = require("mongoose");
mongoose.connect("mongodb://localhost/room_manager_app");

var bodyParser = require("body-parser");

//var http = require('http');
/*
var WebSocketServer = require("ws").Server,
    express = require("express"),
    http = require("http"),
    app = express(),
    server = http.createServer(app);
*/

//const app = express();

//const server = http.createServer(app);
//const wss = new WebSocketServer({ server: server });

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

var clients = [];

app.ws("/rooms/:id", function(ws, req){
	ws.on("request", function(request){
		console.log("entra");
	});

	ws.on("message", function(msg){
		console.log("Receive message");
		ws.send(msg)
	});

	ws.on("close", function(){
		console.log("WebSocket was closed");
	});
});

app.listen(9022, function(){
	console.log("Server Started!");
});