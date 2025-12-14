const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customer: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    location: { type: String, required: true }, // Added Location
    deliveryDate: { type: Date, required: true } // Added Delivery Date
  },
  items: [
    {
      id: String,
      name: String,
      price: Number,
      quantity: Number,
      image: String,
      color: String
    }
  ],
  total: { type: Number, required: true },
  status: { type: String, default: 'pending', enum: ['pending', 'in-progress', 'delivered', 'cancelled'] },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);



// const mongoose = require("mongoose");

// const orderSchema = new mongoose.Schema({
// 	customer: {
// 		name: { type: String, required: true },
// 		phone: { type: String, required: true },
// 	},
// 	items: [
// 		{
// 			id: String,
// 			name: String,
// 			price: Number,
// 			quantity: Number,
// 			image: String,
// 			color: String, // Added field to track specific variant sold
// 		},
// 	],
// 	total: { type: Number, required: true },
// 	status: {
// 		type: String,
// 		default: "pending",
// 		enum: ["pending", "in-progress", "delivered", "cancelled"],
// 	},
// 	date: { type: Date, default: Date.now },
// });

// module.exports = mongoose.model("Order", orderSchema);

