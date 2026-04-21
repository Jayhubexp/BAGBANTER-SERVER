const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  // Reference to the authenticated user who placed this order
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Delivery details collected at checkout (kept inline for convenience)
  deliveryInfo: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    location: { type: String, required: true },
    deliveryDate: { type: Date, required: true },
  },
  items: [
    {
      id: String,
      name: String,
      price: Number,
      quantity: Number,
      image: String,
      color: String,
    },
  ],
  total: { type: Number, required: true },
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'in-progress', 'delivered', 'cancelled'],
  },
  paymentStatus: {
    type: String,
    default: 'pending',
    enum: ['pending', 'paid', 'failed'],
  },
  paystackReference: { type: String },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Order', orderSchema);
