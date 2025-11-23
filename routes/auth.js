// backend/routes/auth.js
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

// Admin Credentials from Environment
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Generate JWT
const generateToken = (id) => {
	return jwt.sign(
		{ id, email: ADMIN_EMAIL, role: "admin" },
		ADMIN_PASSWORD, // Secret
		{ expiresIn: "30d" }
	);
};

// Login
router.post("/login", (req, res) => {
	const { email, password } = req.body;

	if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
		const token = generateToken("admin-id");
		
		return res.json({
			id: "admin-id",
			name: "Shadrack",
			email: ADMIN_EMAIL,
			role: "admin",
			token: token, // Send token to frontend
		});
	}

	return res.status(401).json({ message: "Invalid email or password" });
});

// Logout (Frontend handles token removal, this is just for API consistency)
router.post("/logout", (req, res) => {
	res.json({ message: "Logged out" });
});

// Get Current User (Validate Token)
// We'll use the middleware here to verify the token sent from frontend
const { protect } = require("../middleware/authMiddleware");

router.get("/me", protect, (req, res) => {
    // If middleware passes, req.user is populated
	res.json(req.user);
});

// Disable Registration
router.post("/register", (req, res) => {
	res.status(403).json({ message: "Registration is disabled." });
});

module.exports = router;