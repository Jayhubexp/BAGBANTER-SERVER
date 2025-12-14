const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");

// Load env
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Trust proxy (needed for secure cookies behind Render's load balancer)
app.set("trust proxy", 1);

// Middleware
app.use(express.json());
app.use(cookieParser());

// CORS configuration
const allowedOrigins = [
  "https://www.bagbantergh.com",
  "https://bagbantergh.com",
  "http://localhost:5173",
  /\.vercel\.app$/ // allow Vercel preview URLs
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow curl/mobile apps
    if (allowedOrigins.some(o => o instanceof RegExp ? o.test(origin) : o === origin)) {
      return callback(null, true);
    }
    console.log("[CORS] Blocked Origin:", origin);
    callback(new Error("Not allowed by CORS"), false);
  },
  credentials: true, // must allow cookies
}));

// Database connection
mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/bagbanter")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.error("MongoDB connection error:", err));

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
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
