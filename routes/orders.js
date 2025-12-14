const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// --- PUBLIC ROUTES ---

// Create New Order (Checkout)
router.post('/', async (req, res) => {
  try {
    const { customer, items, total, date } = req.body;
    
    // Validate required fields
    if (!customer.location || !customer.deliveryDate) {
        return res.status(400).json({ message: "Location and Delivery Date are required" });
    }

    const order = await Order.create({
      customer: {
        name: customer.name,
        phone: customer.phone,
        location: customer.location,
        deliveryDate: customer.deliveryDate
      },
      items,
      total,
      date: date || Date.now()
    });

    res.status(201).json(order);
  } catch (error) {
    console.error("Order Creation Error:", error);
    res.status(500).json({ message: error.message });
  }
});

// --- ADMIN ROUTES (Protected) ---

// Get All Orders
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ date: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Order Status & Manage Stock
router.put('/:id/status', protect, adminOnly, async (req, res) => {
  const { status } = req.body;
  
  if (!['pending', 'in-progress', 'delivered', 'cancelled'].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Stock Logic: Deduct stock only if status changes TO 'delivered'
    if (status === 'delivered' && order.status !== 'delivered') {
      for (const item of order.items) {
        const product = await Product.findById(item.id);
        if (product) {
          const variantIndex = product.variants.findIndex(v => v.color === item.color);
          
          if (variantIndex !== -1) {
            product.variants[variantIndex].stock = Math.max(0, product.variants[variantIndex].stock - item.quantity);
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

// Delete Order
router.delete('/:id', protect, adminOnly, async (req, res) => {
    try {
        await Order.findByIdAndDelete(req.params.id);
        res.json({ message: "Order removed" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;


// const express = require("express");
// const router = express.Router();
// const Order = require("../models/Order");
// const Product = require("../models/Product");
// const { protect, adminOnly } = require("../middleware/authMiddleware");

// // --- PUBLIC ROUTES ---

// // Create New Order (Checkout)
// router.post("/", async (req, res) => {
// 	try {
// 		const { customer, items, total, date } = req.body;

// 		const order = await Order.create({
// 			customer,
// 			items,
// 			total,
// 			date: date || Date.now(),
// 		});

// 		res.status(201).json(order);
// 	} catch (error) {
// 		res.status(500).json({ message: error.message });
// 	}
// });

// // --- ADMIN ROUTES (Protected) ---

// // Get All Orders (for Admin Dashboard)
// router.get("/", protect, adminOnly, async (req, res) => {
// 	try {
// 		const orders = await Order.find({}).sort({ date: -1 });
// 		res.json(orders);
// 	} catch (error) {
// 		res.status(500).json({ message: error.message });
// 	}
// });

// // Update Order Status & Manage Stock
// router.put("/:id/status", protect, adminOnly, async (req, res) => {
// 	const { status } = req.body;

// 	if (!["pending", "in-progress", "delivered", "cancelled"].includes(status)) {
// 		return res.status(400).json({ message: "Invalid status" });
// 	}

// 	try {
// 		const order = await Order.findById(req.params.id);
// 		if (!order) return res.status(404).json({ message: "Order not found" });

// 		// Stock Logic: Deduct stock only if status changes TO 'delivered'
// 		if (status === "delivered" && order.status !== "delivered") {
// 			for (const item of order.items) {
// 				const product = await Product.findById(item.id);
// 				if (product) {
// 					const variantIndex = product.variants.findIndex(
// 						(v) => v.color === item.color,
// 					);

// 					if (variantIndex !== -1) {
// 						product.variants[variantIndex].stock = Math.max(
// 							0,
// 							product.variants[variantIndex].stock - item.quantity,
// 						);
// 					}

// 					let currentSold = parseInt(product.sold) || 0;
// 					product.sold = (currentSold + item.quantity).toString();

// 					await product.save();
// 				}
// 			}
// 		}

// 		order.status = status;
// 		const updatedOrder = await order.save();
// 		res.json(updatedOrder);
// 	} catch (error) {
// 		console.error("Order Update Error:", error);
// 		res.status(500).json({ message: error.message });
// 	}
// });

// // Delete Order
// router.delete("/:id", protect, adminOnly, async (req, res) => {
// 	try {
// 		await Order.findByIdAndDelete(req.params.id);
// 		res.json({ message: "Order removed" });
// 	} catch (error) {
// 		res.status(500).json({ message: error.message });
// 	}
// });

// module.exports = router;
