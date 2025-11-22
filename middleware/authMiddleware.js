const protect = (req, res, next) => {
	const session = req.cookies.admin_session;

	if (session === "true") {
		req.user = {
			id: "admin-id",
			role: "admin",
			email: process.env.ADMIN_EMAIL,
		};
		next();
	} else {
		res.status(401).json({ message: "Not authorized, no session" });
	}
};

const adminOnly = (req, res, next) => {
	// Since we only have one hardcoded admin, if they passed 'protect', they are admin.
	if (req.user && req.user.role === "admin") {
		next();
	} else {
		res.status(403).json({ message: "Not authorized as admin" });
	}
};

module.exports = { protect, adminOnly };
