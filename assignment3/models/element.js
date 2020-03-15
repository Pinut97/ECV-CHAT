var mongoose = require("mongoose");

var elementSchema = new mongoose.Schema({
	type: String,
	id: Number,
	position: [Number],
	rotation: [Number],
	scaling: [Number],
});

module.exports = mongoose.model("Element", elementSchema);