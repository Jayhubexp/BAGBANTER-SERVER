const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
	name: { type: String, required: true },
	description: { type: String },
	price: { type: Number, required: true },
	originalPrice: { type: Number },
	images: { type: [String], required: true },
	category: { type: String, required: true },
	rating: { type: Number, default: 0 },
	reviews: { type: Number, default: 0 },
	sold: { type: String, default: "0" },
	stockCount: { type: Number, default: 0 },
	isFeatured: { type: Boolean, default: false },
	createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Product", productSchema);
