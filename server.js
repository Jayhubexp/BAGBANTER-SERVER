const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");

// Configuration
dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
	cors({
		origin: "https://www.bagbantergh.com/", // Frontend URL
		credentials: true, // Required for cookies
	}),
);

// Database Connection
const MONGO_URI = process.env.MONGO_URI;

mongoose
	.connect(MONGO_URI)
	.then(() => console.log("MongoDB Connected"))
	.catch((err) => console.error("MongoDB connection error:", err));

// Routes
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");
const statsRoutes = require("./routes/stats");

// Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes); // Handles GET(public), POST/PUT/DELETE(admin)
app.use("/api/orders", orderRoutes); // Handles POST(public), GET/PUT(admin)
app.use("/api/stats", statsRoutes); // Handles GET(admin)

// Base Route
app.get("/", (req, res) => {
	res.send("BagBanter Backend Running");
});

// Start Server
app.listen(port, () => {
	console.log(`Server is ready on http://localhost:${port}`);
});
