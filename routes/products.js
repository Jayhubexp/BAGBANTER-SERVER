const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

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

// Public Routes
router.get("/", async (req, res) => {
	const category = req.query.category;
	try {
		let query = {};
		if (category && category !== "all") query.category = category;
		const products = await Product.find(query).sort({ createdAt: -1 });
		res.json(products);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
});

router.get("/featured", async (req, res) => {
	try {
		const products = await Product.find({}).sort({ createdAt: -1 }).limit(5);
		res.json(products);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
});

router.get("/:id", async (req, res) => {
	try {
		const product = await Product.findById(req.params.id);
		if (product) res.json(product);
		else res.status(404).json({ message: "Product not found" });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
});

// Admin Routes (Create & Update)
router.post(
	"/",
	protect,
	adminOnly,
	upload.array("images", 10),
	async (req, res) => {
		try {
			let imageLinks = [];
			if (req.files && req.files.length > 0) {
				imageLinks = req.files.map((file) => file.path);
			} else if (req.body.images) {
				imageLinks = Array.isArray(req.body.images)
					? req.body.images
					: [req.body.images];
			}

			// Parse variants from JSON string if sent as form-data
			let variants = [];
			if (req.body.variants) {
				try {
					variants = JSON.parse(req.body.variants);
				} catch (e) {
					variants = [];
				}
			}

			const productData = {
				name: req.body.name,
				price: req.body.price,
				originalPrice: req.body.originalPrice,
				category: req.body.category,
				variants: variants, // Save variants array
				description: req.body.description,
				images: imageLinks,
			};

			const product = await Product.create(productData);
			res.status(201).json(product);
		} catch (error) {
			console.error("Create error:", error);
			res.status(400).json({ message: error.message });
		}
	},
);

router.put(
	"/:id",
	protect,
	adminOnly,
	upload.array("images", 10),
	async (req, res) => {
		try {
			const product = await Product.findById(req.params.id);
			if (!product)
				return res.status(404).json({ message: "Product not found" });

			product.name = req.body.name || product.name;
			product.price = req.body.price || product.price;
			product.originalPrice = req.body.originalPrice || product.originalPrice;
			product.category = req.body.category || product.category;
			product.description = req.body.description || product.description;

			// Update variants if provided
			if (req.body.variants) {
				try {
					product.variants = JSON.parse(req.body.variants);
				} catch (e) {
					// Keep old variants if parse fails or handle error
				}
			}

			if (req.files && req.files.length > 0) {
				const newLinks = req.files.map((file) => file.path);
				product.images = newLinks;
			}

			const updatedProduct = await product.save();
			res.json(updatedProduct);
		} catch (error) {
			res.status(400).json({ message: error.message });
		}
	},
);

router.delete("/:id", protect, adminOnly, async (req, res) => {
	try {
		await Product.findByIdAndDelete(req.params.id);
		res.json({ message: "Product removed" });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
});

module.exports = router;

// const express = require("express");
// const router = express.Router();
// const Product = require("../models/Product");
// const { protect, adminOnly } = require("../middleware/authMiddleware");

// const multer = require("multer");
// const cloudinary = require("cloudinary").v2;
// const { CloudinaryStorage } = require("multer-storage-cloudinary");

// cloudinary.config({
// 	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
// 	api_key: process.env.CLOUDINARY_API_KEY,
// 	api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// const storage = new CloudinaryStorage({
// 	cloudinary: cloudinary,
// 	params: {
// 		folder: "bagbanter-products",
// 		allowed_formats: ["jpg", "png", "jpeg", "webp"],
// 	},
// });

// const upload = multer({ storage: storage });

// // Public Routes
// router.get("/", async (req, res) => {
// 	const category = req.query.category;
// 	try {
// 		let query = {};
// 		if (category && category !== "all") query.category = category;
// 		const products = await Product.find(query).sort({ createdAt: -1 });
// 		res.json(products);
// 	} catch (error) {
// 		res.status(500).json({ message: error.message });
// 	}
// });

// router.get("/featured", async (req, res) => {
// 	try {
// 		const products = await Product.find({}).sort({ createdAt: -1 }).limit(5);
// 		res.json(products);
// 	} catch (error) {
// 		res.status(500).json({ message: error.message });
// 	}
// });

// router.get("/:id", async (req, res) => {
// 	try {
// 		const product = await Product.findById(req.params.id);
// 		if (product) res.json(product);
// 		else res.status(404).json({ message: "Product not found" });
// 	} catch (error) {
// 		res.status(500).json({ message: error.message });
// 	}
// });

// // Admin Routes
// router.post(
// 	"/",
// 	protect,
// 	adminOnly,
// 	upload.array("images", 10),
// 	async (req, res) => {
// 		try {
// 			let imageLinks = [];
// 			if (req.files && req.files.length > 0) {
// 				imageLinks = req.files.map((file) => file.path);
// 			} else if (req.body.images) {
// 				imageLinks = Array.isArray(req.body.images)
// 					? req.body.images
// 					: [req.body.images];
// 			}

// 			const productData = {
// 				name: req.body.name,
// 				price: req.body.price,
// 				originalPrice: req.body.originalPrice,
// 				category: req.body.category,
// 				color: req.body.color, // Added Color field
// 				description: req.body.description,
// 				stockCount: req.body.stockCount,
// 				images: imageLinks,
// 			};

// 			const product = await Product.create(productData);
// 			res.status(201).json(product);
// 		} catch (error) {
// 			res.status(400).json({ message: error.message });
// 		}
// 	},
// );

// router.put(
// 	"/:id",
// 	protect,
// 	adminOnly,
// 	upload.array("images", 10),
// 	async (req, res) => {
// 		try {
// 			const product = await Product.findById(req.params.id);
// 			if (!product)
// 				return res.status(404).json({ message: "Product not found" });

// 			product.name = req.body.name || product.name;
// 			product.price = req.body.price || product.price;
// 			product.originalPrice = req.body.originalPrice || product.originalPrice;
// 			product.category = req.body.category || product.category;
// 			product.color = req.body.color || product.color; // Added Color update logic
// 			product.description = req.body.description || product.description;
// 			product.stockCount = req.body.stockCount || product.stockCount;

// 			if (req.files && req.files.length > 0) {
// 				const newLinks = req.files.map((file) => file.path);
// 				product.images = newLinks;
// 			}

// 			const updatedProduct = await product.save();
// 			res.json(updatedProduct);
// 		} catch (error) {
// 			res.status(400).json({ message: error.message });
// 		}
// 	},
// );

// router.delete("/:id", protect, adminOnly, async (req, res) => {
// 	try {
// 		await Product.findByIdAndDelete(req.params.id);
// 		res.json({ message: "Product removed" });
// 	} catch (error) {
// 		res.status(500).json({ message: error.message });
// 	}
// });

// module.exports = router;
