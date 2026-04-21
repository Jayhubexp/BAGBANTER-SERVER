const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * protect — verifies the JWT Bearer token in the Authorization header.
 * Distinguishes JWT errors (401) from database/server errors (503).
 */
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  const token = authHeader.split(" ")[1];

  // Step 1: Verify the JWT signature & expiry (no DB needed)
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    // Covers: JsonWebTokenError, TokenExpiredError, NotBeforeError
    console.warn("JWT validation failed:", err.message);
    return res.status(401).json({ message: "Token invalid or expired" });
  }

  // Step 2: Look up the user in the database
  try {
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) {
      return res.status(401).json({ message: "User account not found" });
    }
    next();
  } catch (dbErr) {
    // Database error — don't invalidate the token, report a service error
    console.error("Auth DB error:", dbErr.message);
    return res.status(503).json({ message: "Authentication service unavailable. Please try again." });
  }
};

/**
 * adminOnly — must be used after `protect`.
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  res.status(403).json({ message: "Admins only" });
};

module.exports = { protect, adminOnly };
