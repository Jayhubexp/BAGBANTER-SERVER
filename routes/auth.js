const express = require('express');
const router = express.Router(); // This line was likely missing or malformed

const cookieParser = require("cookie-parser");

const app = express();

app.use(express.json());
app.use(cookieParser()); // ✅ MUST be before protect middleware


// Admin Credentials
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@bagbanter.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

// HELPER: Dynamic Cookie Settings
const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    maxAge: 60 * 60 * 24, // ✅ seconds
    path: "/",
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction
  };
};


// Login Route
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    res.cookie('admin_session', 'true', getCookieOptions());
    return res.json({ 
      id: 'admin-id', 
      name: 'Admin', 
      email: ADMIN_EMAIL, 
      role: 'admin' 
    });
  }

  return res.status(401).json({ message: 'Invalid email or password' });
});

// Logout Route
router.post('/logout', (req, res) => {
  res.clearCookie('admin_session', getCookieOptions());
  res.json({ message: 'Logged out' });
});

// Get Current User (Session Check)
router.get('/me', (req, res) => {
  const session = req.cookies.admin_session;

  if (session === 'true') {
    return res.json({ 
      id: 'admin-id', 
      name: 'Admin', 
      email: ADMIN_EMAIL, 
      role: 'admin' 
    });
  }

  // Return null (200 OK) so frontend knows we are just "not logged in" without throwing errors
  res.status(200).json(null);
});

// Register Route (Disabled)
router.post('/register', (req, res) => {
    res.status(403).json({ message: "Registration is disabled." });
});

module.exports = router;