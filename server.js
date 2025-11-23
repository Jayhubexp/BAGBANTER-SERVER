const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");

// Configuration
dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// CRITICAL: Trust the proxy (Render/Heroku)
// This allows 'secure: true' cookies to work behind the load balancer.
app.set("trust proxy", 1);

// Middleware
app.use(express.json());
app.use(cookieParser());

// CORS Configuration
const allowedOrigins = [
	"https://www.bagbantergh.com", // Production
	"https://bagbantergh.com", // Production (non-www)
	"http://localhost:5173", // Local Testing
];

app.use(
	cors({
		origin: (origin, callback) => {
			if (!origin) return callback(null, true);

			if (allowedOrigins.indexOf(origin) === -1) {
				const msg =
					"The CORS policy for this site does not allow access from the specified Origin.";
				return callback(new Error(msg), false);
			}
			return callback(null, true);
		},
		credentials: true, // REQUIRED: Allows cookies to be sent/received
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

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/stats", statsRoutes);

app.get("/", (req, res) => {
	res.send("BagBanter Backend Running");
});

app.listen(port, () => {
	console.log(`Server is ready on port ${port}`);
});
