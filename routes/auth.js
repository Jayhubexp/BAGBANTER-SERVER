const express = require("express");
const router = express.Router();

// Admin Credentials
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@bagbanter.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

// HELPER: Dynamic Cookie Settings
const getCookieOptions = () => {
	const isProduction = process.env.NODE_ENV === "production";

	const options = {
		httpOnly: true,
		maxAge: 24 * 60 * 60 * 1000, // 1 day
		path: "/",
		// Development: 'lax' is safer for localhost than 'none'
		// Production: 'none' is required for cross-site
		sameSite: isProduction ? "none" : "lax",
		secure: isProduction,
	};

	console.log(`[Auth] Cookie Settings:`, options);
	return options;
};

// Login
router.post("/login", (req, res) => {
	const { email, password } = req.body;

	if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
		console.log(`[Auth] Login success for: ${email}`);
		res.cookie("admin_session", "true", getCookieOptions());
		return res.json({
			id: "admin-id",
			name: "Admin",
			email: ADMIN_EMAIL,
			role: "admin",
		});
	}

	console.log(`[Auth] Login failed for: ${email}`);
	return res.status(401).json({ message: "Invalid email or password" });
});

// Logout
router.post("/logout", (req, res) => {
	res.clearCookie("admin_session", getCookieOptions());
	res.json({ message: "Logged out" });
});

// Get Current User
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

	res.status(200).json(null);
});

router.post("/register", (req, res) => {
	res.status(403).json({ message: "Registration is disabled." });
});

module.exports = router;
