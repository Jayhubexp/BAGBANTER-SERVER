const express = require("express");
const router = express.Router();

// Admin credentials
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@bagbanter.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

// Helper: cookie options
const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,               // must be true in prod
    sameSite: isProduction ? "none" : "lax", // cross-domain in prod
    maxAge: 24 * 60 * 60 * 1000,       // 1 day
    path: "/",
  };
};

// LOGIN
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    // Set cookie
    res.cookie("admin_session", "true", getCookieOptions());
    return res.json({
      id: "admin-id",
      name: "Admin",
      email: ADMIN_EMAIL,
      role: "admin"
    });
  }

  return res.status(401).json({ message: "Invalid email or password" });
});

// LOGOUT
router.post("/logout", (req, res) => {
  res.clearCookie("admin_session", getCookieOptions());
  res.json({ message: "Logged out" });
});

// CHECK AUTH
router.get("/me", (req, res) => {
  const session = req.cookies.admin_session;

  if (session === "true") {
    return res.json({
      id: "admin-id",
      name: "Admin",
      email: ADMIN_EMAIL,
      role: "admin"
    });
  }

  return res.status(401).json({ message: "Not authenticated" });
});

// Registration disabled
router.post("/register", (req, res) => {
  res.status(403).json({ message: "Registration is disabled." });
});

module.exports = router;
