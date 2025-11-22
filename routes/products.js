const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

// Get All Products (with category filter)
router.get("/", async (req, res) => {
	const category = req.query.category;
	try {
		let query = {};
		if (category && category !== "all") {
			query.category = category;
		}
		const products = await Product.find(query);
		res.json(products);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
});

// Get Featured Products (for Home page)
router.get("/featured", async (req, res) => {
	try {
		// Logic can be customized, e.g., fetching specific IDs or top rated
		const products = await Product.find({ isFeatured: true }).limit(5);
		// If no specific featured products, return random or top rated
		if (products.length === 0) {
			const fallback = await Product.find({}).limit(5);
			return res.json(fallback);
		}
		res.json(products);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
});

// Get Single Product
router.get("/:id", async (req, res) => {
	try {
		const product = await Product.findById(req.params.id);
		if (product) {
			res.json(product);
		} else {
			res.status(404).json({ message: "Product not found" });
		}
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
});

module.exports = router;
