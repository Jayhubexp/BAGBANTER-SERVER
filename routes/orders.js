const express = require("express");
const router = express.Router();
const Order = require("../models/Order");

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

module.exports = router;
