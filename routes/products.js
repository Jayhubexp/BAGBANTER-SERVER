const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Cloudinary config
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
const upload = multer({ storage });

// --- PUBLIC ROUTES ---

// Get all products (optional category filter)
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

// Get featured products
router.get("/featured", async (req, res) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 }).limit(5);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get product by ID
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- ADMIN ROUTES ---

// Protect all admin routes
router.use(protect, adminOnly);

// Create product
router.post("/", upload.array("images", 10), async (req, res) => {
  try {
    const images = req.files?.map(f => f.path) || [];
    const variants = req.body.variants ? JSON.parse(req.body.variants) : [];

    const product = await Product.create({
      name: req.body.name,
      price: req.body.price,
      originalPrice: req.body.originalPrice,
      category: req.body.category,
      description: req.body.description,
      variants: variants,
      images: images,
      stockCount: req.body.stockCount || 0,
    });

    res.status(201).json(product);
  } catch (error) {
    console.error("Create product error:", error);
    res.status(400).json({ message: error.message });
  }
});

// Update product
router.put("/:id", upload.array("images", 10), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    product.name = req.body.name || product.name;
    product.price = req.body.price || product.price;
    product.originalPrice = req.body.originalPrice || product.originalPrice;
    product.category = req.body.category || product.category;
    product.description = req.body.description || product.description;
    product.stockCount = req.body.stockCount || product.stockCount;

    if (req.body.variants) {
      try { product.variants = JSON.parse(req.body.variants); } catch (e) {}
    }

    if (req.files && req.files.length > 0) {
      product.images = req.files.map(f => f.path);
    }

    const updated = await product.save();
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete product
router.delete("/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
