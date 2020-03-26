var mongoose = require("mongoose");

var elementSchema = new mongoose.Schema({
	type: String,
	id: Number,
	position: [Number],
	rotation: [Number],
	scaling: [Number],
	origin: {x: Number, y: Number},
	final: {x: Number, y: Number}
});

module.exports = elementSchema;
//module.exports = mongoose.model("Element", elementSchema);