const express = require("express");
const router = express.Router();

// Admin Credentials from Environment
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Login
router.post("/login", (req, res) => {
	const { email, password } = req.body;

	if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
		// Set a simple HTTP-only cookie to mark the session as active
		res.cookie("admin_session", "true", {
			httpOnly: true,
			maxAge: 24 * 60 * 60 * 1000, // 1 day
			sameSite: "lax", // or 'strict'
		});

		// Return the admin user object
		return res.json({
			id: "admin-id",
			name: "Admin",
			email: ADMIN_EMAIL,
			role: "admin",
		});
	}

	return res.status(401).json({ message: "Invalid email or password" });
});

// Logout
router.post("/logout", (req, res) => {
	res.clearCookie("admin_session");
	res.json({ message: "Logged out" });
});

// Get Current User (Session Check)
router.get("/me", (req, res) => {
	const session = req.cookies.admin_session;

	if (session === "true") {
		return res.json({
			id: "admin-id",
			name: "Admin",
			email: ADMIN_EMAIL,
			role: "admin",
		});
	}

	// If no session, return 401 or null (frontend handles null)
	res.status(401).json({ message: "Not authorized" });
});

// Remove Register route as requested
router.post("/register", (req, res) => {
	res.status(403).json({ message: "Registration is disabled." });
});

module.exports = router;
