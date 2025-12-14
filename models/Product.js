const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
	name: { type: String, required: true },
	description: { type: String },
	price: { type: Number, required: true },
	originalPrice: { type: Number },
	images: { type: [String], required: true },
	category: { type: String, required: true },

	// CHANGED: Replaced simple 'color' and 'stockCount' with an array of variants
	variants: [
		{
			color: { type: String, required: true },
			stock: { type: Number, required: true, default: 0 },
		},
	],

	rating: { type: Number, default: 0 },
	reviews: { type: Number, default: 0 },
	sold: { type: String, default: "0" },
	isFeatured: { type: Boolean, default: false },
	createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Product", productSchema);

// const mongoose = require("mongoose");

// const productSchema = new mongoose.Schema({
// 	name: { type: String, required: true },
// 	description: { type: String },
// 	price: { type: Number, required: true },
// 	originalPrice: { type: Number },
// 	images: { type: [String], required: true },
// 	category: { type: String, required: true },
// 	color: { type: String }, // New Field
// 	rating: { type: Number, default: 0 },
// 	reviews: { type: Number, default: 0 },
// 	sold: { type: String, default: "0" },
// 	stockCount: { type: Number, default: 0 },
// 	isFeatured: { type: Boolean, default: false },
// 	createdAt: { type: Date, default: Date.now },
// });

// module.exports = mongoose.model("Product", productSchema);
