// backend/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
	let token;

	// Check for token in Authorization header (Bearer token)
	if (
		req.headers.authorization &&
		req.headers.authorization.startsWith("Bearer")
	) {
		try {
			// Get token from header
			token = req.headers.authorization.split(" ")[1];

			// Verify token
			const decoded = jwt.verify(token, process.env.ADMIN_PASSWORD); // Using ADMIN_PASSWORD as secret for simplicity in this setup

			// Attach user to request
			req.user = {
				id: decoded.id,
				role: decoded.role,
				email: decoded.email,
			};

			next();
		} catch (error) {
			console.error("Token Verification Error:", error.message);
			res.status(401).json({ message: "Not authorized, invalid token" });
		}
	} else {
		res.status(401).json({ message: "Not authorized, no token provided" });
	}
};

const adminOnly = (req, res, next) => {
	if (req.user && req.user.role === "admin") {
		next();
	} else {
		res.status(403).json({ message: "Not authorized as admin" });
	}
};

module.exports = { protect, adminOnly };