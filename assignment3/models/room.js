var mongoose = require("mongoose");

var elementSchema = require("./element");

var roomSchema = new mongoose.Schema({
	name: String,
	description: String,
	objects: [elementSchema]
});

module.exports = mongoose.model("Room", roomSchema);