var mongoose = require("mongoose");

var elementSchema = new mongoose.Schema({
	type: String,
	id: Number,
	position: [Number],
	rotation: [Number],
	scaling: [Number],
});

var roomSchema = new mongoose.Schema({
	name: String,
	description: String,
	objects: [elementSchema]
});

module.exports = mongoose.model("Room", roomSchema);