const express = require('express');
const router = express.Router();
const axios = require('axios');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// ─── Customer Routes (Protected) ─────────────────────────────────────────────

// POST /api/orders — Create a new order (requires login)
router.post('/', protect, async (req, res) => {
  try {
    const { deliveryInfo, items, total } = req.body;

    if (!deliveryInfo || !deliveryInfo.location || !deliveryInfo.deliveryDate || !deliveryInfo.email) {
      return res.status(400).json({ message: "All delivery details are required" });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Order must contain at least one item" });
    }

    // Create the order linked to the logged-in user
    const order = await Order.create({
      user: req.user._id,
      deliveryInfo,
      items,
      total,
      paymentStatus: 'pending',
    });

    // Initialize Paystack payment
    const paystackResponse = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email: deliveryInfo.email,
        amount: total * 100, // Convert to pesewas
        currency: "GHS",
        reference: `BB-${order._id}-${Date.now()}`,
        callback_url: `${process.env.FRONTEND_URL}/payment-verify`,
        metadata: {
          orderId: order._id.toString(),
          userId: req.user._id.toString(),
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    order.paystackReference = paystackResponse.data.data.reference;
    await order.save();

    res.status(201).json({
      order,
      paymentUrl: paystackResponse.data.data.authorization_url,
    });
  } catch (error) {
    console.error("Order/Paystack Error:", error.message);
    res.status(500).json({ message: "Could not initialize payment" });
  }
});

// GET /api/orders/verify/:reference — Verify payment after Paystack redirect
router.get('/verify/:reference', async (req, res) => {
  try {
    const { reference } = req.params;
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    );

    if (response.data.data.status === 'success') {
      const { orderId, userId } = response.data.data.metadata;

      // Mark order as paid
      const order = await Order.findByIdAndUpdate(
        orderId,
        { paymentStatus: 'paid' },
        { new: true }
      );

      // Link order to user's orders array
      if (userId) {
        await User.findByIdAndUpdate(userId, {
          $addToSet: { orders: orderId },
        });
      }

      return res.json({ message: "Order Confirmed", order });
    }

    res.status(400).json({ message: "Payment not verified" });
  } catch (error) {
    console.error("Payment verify error:", error.message);
    res.status(500).json({ message: error.message });
  }
});

// ─── Admin Routes (Protected + Admin Only) ────────────────────────────────────

// GET /api/orders — All orders
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('user', 'name email phone')
      .sort({ date: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/orders/:id/status — Update order status & deduct stock on delivery
router.put('/:id/status', protect, adminOnly, async (req, res) => {
  const { status } = req.body;

  if (!['pending', 'in-progress', 'delivered', 'cancelled'].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (status === 'delivered' && order.status !== 'delivered') {
      for (const item of order.items) {
        const product = await Product.findById(item.id);
        if (product) {
          const variantIndex = product.variants?.findIndex(v => v.color === item.color);
          if (variantIndex !== undefined && variantIndex !== -1) {
            product.variants[variantIndex].stock = Math.max(
              0,
              product.variants[variantIndex].stock - item.quantity
            );
          }
          let currentSold = parseInt(product.sold) || 0;
          product.sold = (currentSold + item.quantity).toString();
          await product.save();
        }
      }
    }

    order.status = status;
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    console.error("Order Update Error:", error);
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/orders/:id
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: "Order removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
