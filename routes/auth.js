const express = require("express");
const router = express.Router();

// Admin Credentials from Environment
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// HELPER: Cookie Settings
// 'sameSite: none' and 'secure: true' are MANDATORY for cross-domain cookies (Vercel -> Render)
const getCookieOptions = () => {
	return {
		httpOnly: true,
		maxAge: 24 * 60 * 60 * 1000, // 1 day
		sameSite: "none",
		secure: true,
		path: "/",
	};
};

// Login
router.post("/login", (req, res) => {
	const { email, password } = req.body;

	if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
		// Set the session cookie
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

// Logout
router.post("/logout", (req, res) => {
	res.clearCookie("admin_session", getCookieOptions());
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

	// If no session, return 401
	res.status(401).json({ message: "Not authorized" });
});

// Disable Register
router.post("/register", (req, res) => {
	res.status(403).json({ message: "Registration is disabled." });
});

module.exports = router;
