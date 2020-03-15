var express = require("express");
var router = express.Router();
var Room = require("../models/room");

//INDEX - show all rooms
router.get("/", function(req, res){
	Room.find({}, function(err, allRooms){
		if(err){
			console.log(err)
		} else {
			res.render("rooms/index", {rooms:allRooms});
		}
	});
});

//CREATE - add new room to DB
router.post("/", function(req, res){
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

//NEW - show form to create new room
router.get("/new", function(req, res){
	res.render("rooms/new");
});

//SHOW - enter one room
router.get("/:id", function(req, res){
	Room.findById(req.params.id, function(err, foundRoom){
		if(err){
			console.log(err)
		} else {
			res.render("rooms/show", {room: foundRoom});
		}
	});
});

module.exports = router;