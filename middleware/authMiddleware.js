const protect = (req, res, next) => {
  const session = req.cookies?.admin_session;

  if (session === "true") {
    req.user = {
      id: "admin-id",
      role: "admin",
      email: process.env.ADMIN_EMAIL || "admin@bagbanter.com",
    };
    return next();
  }

  res.status(401).json({ message: "Not authorized" });
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }

  res.status(403).json({ message: "Admins only" });
};

// ✅ IMPORTANT: named exports
module.exports = {
  protect,
  adminOnly,
};
