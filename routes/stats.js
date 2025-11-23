const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Product = require("../models/Product");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// Protect all stats routes
router.use(protect);
router.use(adminOnly);

// GET /api/stats
router.get("/", async (req, res) => {
	try {
		// 1. Total Revenue (from Delivered Orders)
		const deliveredOrders = await Order.find({ status: "delivered" });
		const totalRevenue = deliveredOrders.reduce(
			(acc, order) => acc + order.total,
			0,
		);

		// 2. Total Products Sold
		const totalProductsSold = deliveredOrders.reduce((acc, order) => {
			const orderItemsCount = order.items.reduce(
				(itemAcc, item) => itemAcc + item.quantity,
				0,
			);
			return acc + orderItemsCount;
		}, 0);

		// 3. Weekly Revenue (Last 7 Days)
		const sevenDaysAgo = new Date();
		sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

		const weeklyOrders = await Order.find({
			status: "delivered",
			date: { $gte: sevenDaysAgo },
		});
		const weeklyRevenue = weeklyOrders.reduce(
			(acc, order) => acc + order.total,
			0,
		);

		// 4. Chart Data (Last 7 days)
		const chartData = [];
		for (let i = 6; i >= 0; i--) {
			const d = new Date();
			d.setDate(d.getDate() - i);
			d.setHours(0, 0, 0, 0);

			const nextD = new Date(d);
			nextD.setDate(d.getDate() + 1);

			const dayOrders = await Order.find({
				status: "delivered",
				date: { $gte: d, $lt: nextD },
			});

			const dayTotal = dayOrders.reduce((acc, o) => acc + o.total, 0);
			chartData.push({
				day: d.toLocaleDateString("en-US", { weekday: "short" }),
				amount: dayTotal,
			});
		}

		res.json({
			totalRevenue,
			totalProductsSold,
			weeklyRevenue,
			chartData,
		});
	} catch (error) {
		console.error("Stats Error:", error);
		res.status(500).json({ message: error.message });
	}
});

module.exports = router;
