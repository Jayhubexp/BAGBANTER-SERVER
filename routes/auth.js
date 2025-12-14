const express = require("express");
const router = express.Router();

// Admin Credentials
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@bagbanter.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

// Helper: Dynamic Cookie Options
const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    path: "/",
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction, // true in production (HTTPS), false in dev (http)
  };
};

// --- Login Route ---
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    res.cookie("admin_session", "true", getCookieOptions());
    return res.json({
      id: "admin-id",
      name: "Admin",
      email: ADMIN_EMAIL,
      role: "admin",
    });
  }

  return res.status(401).json({ message: "Invalid email or password" });
});

// --- Logout Route ---
router.post("/logout", (req, res) => {
  res.clearCookie("admin_session", getCookieOptions());
  res.json({ message: "Logged out" });
});

// --- Check Current User ---
router.get("/me", (req, res) => {
  const session = req.cookies?.admin_session;

  if (session === "true") {
    return res.json({
      id: "admin-id",
      name: "Admin",
      email: ADMIN_EMAIL,
      role: "admin",
    });
  }

  res.status(200).json(null); // Not logged in
});

// --- Register Disabled ---
router.post("/register", (req, res) => {
  res.status(403).json({ message: "Registration is disabled." });
});

module.exports = router;
