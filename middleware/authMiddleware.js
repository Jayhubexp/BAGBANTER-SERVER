const protect = (req, res, next) => {
  // Safely extract cookie (handle undefined req.cookies)
  const session = (req.cookies && req.cookies.admin_session) ? req.cookies.admin_session : null;

  if (session === 'true') {
    req.user = {
      id: 'admin-id',
      role: 'admin',
      email: process.env.ADMIN_EMAIL || "admin@bagbanter.com"
    };
    next();
  } else {
    // Debug logging to help trace issues
    console.log(`[AuthMiddleware] BLOCKED: ${req.method} ${req.originalUrl}`);
    console.log(`   -> Reason: Session cookie is invalid or missing.`);
    // console.log(`   -> Incoming Cookies:`, req.cookies); 
    
    res.status(401).json({ message: "Not authorized, no session" });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: "Not authorized as admin" });
  }
};

module.exports = { protect, adminOnly };


// const protect = (req, res, next) => {
// 	// Safely get cookie
// 	const session = req.cookies ? req.cookies.admin_session : null;

// 	if (session === "true") {
// 		req.user = {
// 			id: "admin-id",
// 			role: "admin",
// 			email: process.env.ADMIN_EMAIL || "admin@bagbanter.com",
// 		};
// 		next();
// 	} else {
// 		// Log the failure to terminal
// 		console.log(`[AuthMiddleware] BLOCKED: ${req.method} ${req.originalUrl}`);
// 		console.log(`   -> Incoming Cookie Header:`, req.headers.cookie || "NONE");

// 		res.status(401).json({ message: "Not authorized, no session" });
// 	}
// };

// const adminOnly = (req, res, next) => {
// 	if (req.user && req.user.role === "admin") {
// 		next();
// 	} else {
// 		res.status(403).json({ message: "Not authorized as admin" });
// 	}
// };

// module.exports = { protect, adminOnly };
