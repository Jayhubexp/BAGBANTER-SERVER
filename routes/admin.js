const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Order = require("../models/Order");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// Cloudinary upload
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
  params: { folder: "bagbanter-products", allowed_formats: ["jpg","png","jpeg","webp"] }
});
const upload = multer({ storage });

// Protect all admin routes
router.use(protect, adminOnly);

// --- DASHBOARD STATS ---
router.get("/stats", async (req, res) => {
  try {
    const deliveredOrders = await Order.find({ status: "delivered" });
    const totalRevenue = deliveredOrders.reduce((acc,o)=>acc+o.total,0);
    const totalProductsSold = deliveredOrders.reduce((acc,o)=>{
      return acc + o.items.reduce((iAcc,i)=>iAcc+i.quantity,0);
    },0);

    const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate()-7);
    const weeklyOrders = await Order.find({ status: "delivered", date: { $gte: sevenDaysAgo } });
    const weeklyRevenue = weeklyOrders.reduce((acc,o)=>acc+o.total,0);

    const chartData = [];
    for (let i=6;i>=0;i--) {
      const d = new Date(); d.setDate(d.getDate()-i); d.setHours(0,0,0,0);
      const nextD = new Date(d); nextD.setDate(d.getDate()+1);
      const dayOrders = await Order.find({ status:"delivered", date:{ $gte:d, $lt:nextD } });
      chartData.push({ day: d.toLocaleDateString("en-US",{ weekday:"short" }), amount: dayOrders.reduce((acc,o)=>acc+o.total,0) });
    }

    res.json({ totalRevenue, totalProductsSold, weeklyRevenue, chartData });
  } catch (error) {
    console.error("Stats Error:", error);
    res.status(500).json({ message: error.message });
  }
});

// --- ORDERS ---
router.get("/orders", async (req,res)=>{
  try {
    const orders = await Order.find({}).sort({ date:-1 });
    res.json(orders);
  } catch(e){ res.status(500).json({ message:e.message }); }
});

router.put("/orders/:id/status", async (req,res)=>{
  const { status } = req.body;
  if(!["pending","in-progress","delivered"].includes(status)) return res.status(400).json({ message:"Invalid status" });

  try {
    const order = await Order.findById(req.params.id);
    if(!order) return res.status(404).json({ message:"Order not found" });

    if(status==="delivered" && order.status!=="delivered") {
      for(const item of order.items){
        const product = await Product.findById(item.id);
        if(product){
          product.stockCount = Math.max(0,product.stockCount-item.quantity);
          product.sold = (parseInt(product.sold)||0) + item.quantity;
          await product.save();
        }
      }
    }

    order.status = status;
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch(error){
    console.error("Order Update Error:",error);
    res.status(500).json({ message:error.message });
  }
});

// --- PRODUCTS (ADMIN) ---
router.get("/products", async (req,res)=>{
  try { const products = await Product.find({}); res.json(products); }
  catch(e){ res.status(500).json({ message:e.message }); }
});

router.post("/products", upload.array("images",10), async (req,res)=>{
  try {
    const images = req.files?.map(f=>f.path) || [];
    const product = await Product.create({
      name: req.body.name,
      price: req.body.price,
      originalPrice: req.body.originalPrice,
      category: req.body.category,
      description: req.body.description,
      stockCount: req.body.stockCount || 0,
      images: images
    });
    res.status(201).json(product);
  } catch(e){ res.status(400).json({ message:e.message }); }
});

router.put("/products/:id", upload.array("images",10), async (req,res)=>{
  try {
    const product = await Product.findById(req.params.id);
    if(!product) return res.status(404).json({ message:"Product not found" });

    product.name = req.body.name || product.name;
    product.price = req.body.price || product.price;
    product.originalPrice = req.body.originalPrice || product.originalPrice;
    product.category = req.body.category || product.category;
    product.description = req.body.description || product.description;
    product.stockCount = req.body.stockCount || product.stockCount;

    if(req.files && req.files.length>0) product.images = req.files.map(f=>f.path);
    const updated = await product.save();
    res.json(updated);
  } catch(e){ res.status(400).json({ message:e.message }); }
});

router.delete("/products/:id", async (req,res)=>{
  try { await Product.findByIdAndDelete(req.params.id); res.json({ message:"Product removed" }); }
  catch(e){ res.status(500).json({ message:e.message }); }
});

module.exports = router;
