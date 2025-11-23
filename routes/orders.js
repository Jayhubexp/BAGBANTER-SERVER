const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Product = require("../models/Product");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// --- PUBLIC ROUTES ---

// Create New Order (Checkout)
router.post("/", async (req, res) => {
	try {
		const { customer, items, total, date } = req.body;

		const order = await Order.create({
			customer,
			items,
			total,
			date: date || Date.now(),
		});

		res.status(201).json(order);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
});

// --- ADMIN ROUTES (Protected) ---

// Get All Orders (for Admin Dashboard)
router.get("/", protect, adminOnly, async (req, res) => {
	try {
		const orders = await Order.find({}).sort({ date: -1 });
		res.json(orders);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
});

// Update Order Status & Manage Stock
router.put("/:id/status", protect, adminOnly, async (req, res) => {
	const { status } = req.body;

	if (!["pending", "in-progress", "delivered", "cancelled"].includes(status)) {
		return res.status(400).json({ message: "Invalid status" });
	}

	try {
		const order = await Order.findById(req.params.id);
		if (!order) return res.status(404).json({ message: "Order not found" });

		// Stock Logic: Deduct stock only if status changes TO 'delivered'
		if (status === "delivered" && order.status !== "delivered") {
			for (const item of order.items) {
				// item.id comes from the frontend cart item, which maps to MongoDB _id
				const product = await Product.findById(item.id);
				if (product) {
					product.stockCount = Math.max(0, product.stockCount - item.quantity);

					// Update 'sold' count logic
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

module.exports = router;
