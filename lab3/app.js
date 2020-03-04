var express = require("express");
var app = express();
var bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/", function(req, res){
	res.render("landing");
});

var rooms = [
	{name: "room1", description: "buah brother vaya pedazo de habitación jiji"},
	{name: "room2", description: "Segona avitasió juju"},
	{name: "room3", description: "Tercera habitació de la llista"}
	]

app.get("/rooms", function(req, res){
	res.render("rooms", {rooms:rooms});
});

app.post("/rooms", function(req, res){
	var name = req.body.name;
	var description = req.body.description;
	var newRoom = {name: name, description: description};
	rooms.push(newRoom);
	res.redirect("/rooms");
});

app.get("/rooms/new", function(req, res){
	res.render("new.ejs");
});

app.get("/room", function(req, res){
	res.render("room");
});

app.listen(3000, function(){
	console.log("Room manager server has started");
});

