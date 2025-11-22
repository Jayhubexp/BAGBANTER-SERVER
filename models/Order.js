const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
	customer: {
		name: { type: String, required: true },
		phone: { type: String, required: true },
	},
	items: [
		{
			id: String,
			name: String,
			price: Number,
			quantity: Number,
			image: String,
		},
	],
	total: { type: Number, required: true },
	status: {
		type: String,
		default: "pending",
		enum: ["pending", "shipped", "delivered", "cancelled"],
	},
	date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Order", orderSchema);
