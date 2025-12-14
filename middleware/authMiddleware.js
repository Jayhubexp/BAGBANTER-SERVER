
const protect = (req, res, next) => {
  // Safely extract cookie (handle undefined req.cookies)
  const session = (req.cookies && req.cookies.admin_session) ? req.cookies.admin_session : null;

+  // Enhanced debug logging
+  console.log(`[AuthMiddleware] Checking: ${req.method} ${req.originalUrl}`);
+  console.log(`[AuthMiddleware] Session cookie:`, session);
+  console.log(`[AuthMiddleware] All cookies:`, req.cookies);

  if (session === 'true') {
+    console.log(`[AuthMiddleware] ALLOWED: ${req.method} ${req.originalUrl}`);
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
-    // console.log(`   -> Incoming Cookies:`, req.cookies); 
    
    res.status(401).json({ message: "Not authorized, no session" });
  }
};


// const protect = (req, res, next) => {
//   // Safely extract cookie (handle undefined req.cookies)
//   const session = (req.cookies && req.cookies.admin_session) ? req.cookies.admin_session : null;

//   if (session === 'true') {
//     req.user = {
//       id: 'admin-id',
//       role: 'admin',
//       email: process.env.ADMIN_EMAIL || "admin@bagbanter.com"
//     };
//     next();
//   } else {
//     // Debug logging to help trace issues
//     console.log(`[AuthMiddleware] BLOCKED: ${req.method} ${req.originalUrl}`);
//     console.log(`   -> Reason: Session cookie is invalid or missing.`);
//     // console.log(`   -> Incoming Cookies:`, req.cookies); 
    
//     res.status(401).json({ message: "Not authorized, no session" });
//   }
// };

// const adminOnly = (req, res, next) => {
//   if (req.user && req.user.role === 'admin') {
//     next();
//   } else {
//     res.status(403).json({ message: "Not authorized as admin" });
//   }
// };

// module.exports = { protect, adminOnly };


