const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");

// Configuration
dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// Trust Proxy (Required for secure cookies on Render)
app.set("trust proxy", 1);

// Middleware
app.use(express.json());
app.use(cookieParser());

// CORS Configuration
app.use(
	cors({
		origin: (origin, callback) => {
			// Allow mobile apps/curl (no origin)
			if (!origin) return callback(null, true);

			// Define allowed origins
			const allowedOrigins = [
				"https://www.bagbantergh.com",
				"https://bagbantergh.com",
				"http://localhost:5173",
				process.env.FRONTEND_URL // Allows you to add Vercel URL via Render Dashboard
			].filter(Boolean); // Removes undefined values

			// DEVELOPMENT: Allow ANY origin (localhost, IPs, etc.)
			if (process.env.NODE_ENV !== "production") {
				return callback(null, true);
			}

			// PRODUCTION: Strict Check
			if (allowedOrigins.indexOf(origin) === -1) {
				console.log("[CORS] Blocked Origin:", origin);
				const msg = "The CORS policy for this site does not allow access from the specified Origin.";
				return callback(new Error(msg), false);
			}
			return callback(null, true);
		},
		credentials: true, // REQUIRED: Allows cookies to be sent/received
	}),
);

// Database Connection
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/bagbanter";

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
	console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

// const express = require("express");
// const mongoose = require("mongoose");
// const dotenv = require("dotenv");
// const cors = require("cors");
// const cookieParser = require("cookie-parser");

// // Configuration
// dotenv.config();
// const app = express();
// const port = process.env.PORT || 3000;

// // Trust Proxy (Required for secure cookies on Render)
// app.set("trust proxy", 1);

// // Middleware
// app.use(express.json());
// app.use(cookieParser());

// app.use(
// 	cors({
// 		origin: (origin, callback) => {
// 			// Allow mobile apps/curl (no origin)
// 			if (!origin) return callback(null, true);

// 			// DEVELOPMENT: Just say YES to everything.
// 			// This fixes issues with localhost vs 127.0.0.1 vs LAN IP
// 			if (process.env.NODE_ENV !== "production") {
// 				return callback(null, true);
// 			}

// 			// PRODUCTION: Strict Allowed List
// 			const allowedOrigins = [
// 				"https://www.bagbantergh.com",
// 				"https://bagbantergh.com",
// 				"http://localhost:5173",
// 			];

// 			if (allowedOrigins.indexOf(origin) === -1) {
// 				console.log("[CORS] Blocked Origin:", origin);
// 				const msg =
// 					"The CORS policy for this site does not allow access from the specified Origin.";
// 				return callback(new Error(msg), false);
// 			}
// 			return callback(null, true);
// 		},
// 		credentials: true, // REQUIRED: Allows cookies to be sent/received
// 	}),
// );

// // Database Connection
// const MONGO_URI =
// 	process.env.MONGO_URI || "mongodb://localhost:27017/bagbanter";

// mongoose
// 	.connect(MONGO_URI)
// 	.then(() => console.log("MongoDB Connected"))
// 	.catch((err) => console.error("MongoDB connection error:", err));

// // Routes
// const authRoutes = require("./routes/auth");
// const productRoutes = require("./routes/products");
// const orderRoutes = require("./routes/orders");
// const statsRoutes = require("./routes/stats");

// app.use("/api/auth", authRoutes);
// app.use("/api/products", productRoutes);
// app.use("/api/orders", orderRoutes);
// app.use("/api/stats", statsRoutes);

// app.get("/", (req, res) => {
// 	res.send("BagBanter Backend Running");
// });

// app.listen(port, () => {
// 	console.log(`Server is ready on port ${port}`);
// 	console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
// });
