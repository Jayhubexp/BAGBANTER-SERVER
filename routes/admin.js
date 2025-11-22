const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Order = require("../models/Order");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// Image Upload Dependencies
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Configure Cloudinary
cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
	cloudinary: cloudinary,
	params: {
		folder: "bagbanter-products",
		allowed_formats: ["jpg", "png", "jpeg", "webp"],
	},
});

const upload = multer({ storage: storage });

router.use(protect);
router.use(adminOnly);

// Get All Products
router.get("/products", async (req, res) => {
	try {
		const products = await Product.find({});
		res.json(products);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
});

// Create Product (Supports Multiple Images)
// 'images' is the key, allow up to 10 files
router.post("/products", upload.array("images", 10), async (req, res) => {
	try {
		// Map uploaded files to their Cloudinary URLs
		// If no files uploaded, check if body contains image URLs (optional fallback)
		let imageLinks = [];
		if (req.files && req.files.length > 0) {
			imageLinks = req.files.map((file) => file.path);
		} else if (req.body.images) {
			// Handle case where only strings are sent (less common for Create)
			imageLinks = Array.isArray(req.body.images)
				? req.body.images
				: [req.body.images];
		}

		const productData = {
			name: req.body.name,
			price: req.body.price,
			originalPrice: req.body.originalPrice,
			category: req.body.category,
			description: req.body.description,
			stockCount: req.body.stockCount,
			images: imageLinks,
		};

		const product = await Product.create(productData);
		res.status(201).json(product);
	} catch (error) {
		console.error("Create Error:", error);
		res.status(400).json({ message: error.message });
	}
});

// Update Product
router.put("/products/:id", upload.array("images", 10), async (req, res) => {
	try {
		const product = await Product.findById(req.params.id);
		if (!product) return res.status(404).json({ message: "Product not found" });

		product.name = req.body.name || product.name;
		product.price = req.body.price || product.price;
		product.originalPrice = req.body.originalPrice || product.originalPrice;
		product.category = req.body.category || product.category;
		product.description = req.body.description || product.description;
		product.stockCount = req.body.stockCount || product.stockCount;

		if (req.files && req.files.length > 0) {
			const newLinks = req.files.map((file) => file.path);
			product.images = newLinks;
		}

		const updatedProduct = await product.save();
		res.json(updatedProduct);
	} catch (error) {
		console.error("Update Error:", error);
		res.status(400).json({ message: error.message });
	}
});

router.delete("/products/:id", async (req, res) => {
	try {
		await Product.findByIdAndDelete(req.params.id);
		res.json({ message: "Product removed" });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
});

router.get("/orders", async (req, res) => {
	try {
		const orders = await Order.find({}).sort({ date: -1 });
		res.json(orders);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
});

module.exports = router;
