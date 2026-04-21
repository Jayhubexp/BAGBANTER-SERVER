const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Sign a JWT valid for 7 days */
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

/** Generate a 6-digit OTP and set expiry (10 minutes) */
const generateOTP = () => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min
  return { otp, expiry };
};

/** Send OTP via Termii SMS */
const sendOTPviaSMS = async (phone, otp) => {
  const termiiApiKey = process.env.TERMII_API_KEY;
  const senderId = process.env.TERMII_SENDER_ID || "BagBanter";

  if (!termiiApiKey) {
    console.warn("TERMII_API_KEY not set — skipping SMS, OTP:", otp);
    return; // In dev, just log it
  }

  await axios.post("https://api.ng.termii.com/api/sms/send", {
    to: phone,
    from: senderId,
    sms: `Your BagBanter verification code is: ${otp}. It expires in 10 minutes. Do not share this code.`,
    type: "plain",
    channel: "generic",
    api_key: termiiApiKey,
  });
};

// ─── Register ─────────────────────────────────────────────────────────────────

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: "An account with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone: phone || "",
      role: "customer",
      isVerified: true, // Auto-verified for now (no email verification flow)
    });

    const token = signToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Registration failed. Please try again.", detail: error.message });
  }
});

// ─── Login ────────────────────────────────────────────────────────────────────

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // ── Admin shortcut: check .env credentials ──────────────────────────────
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

    if (email.toLowerCase() === ADMIN_EMAIL?.toLowerCase()) {
      // Find or create an admin user in DB
      let admin = await User.findOne({ email: email.toLowerCase() });

      if (!admin) {
        // First-time: seed the admin user
        const hashed = await bcrypt.hash(ADMIN_PASSWORD, 12);
        admin = await User.create({
          name: "Admin",
          email: email.toLowerCase(),
          password: hashed,
          role: "admin",
          isVerified: true,
        });
      }

      // Verify using both DB password AND .env password (fallback)
      const matchesDB = await bcrypt.compare(password, admin.password);
      const matchesEnv = password === ADMIN_PASSWORD;

      if (!matchesDB && !matchesEnv) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // If admin password changed in .env but not in DB, re-sync
      if (!matchesDB && matchesEnv) {
        admin.password = await bcrypt.hash(ADMIN_PASSWORD, 12);
        await admin.save();
      }

      const token = signToken(admin._id);
      return res.json({
        token,
        user: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          twoFactorEnabled: false,
        },
      });
    }

    // ── Regular customer login ──────────────────────────────────────────────
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // ── 2FA check ──────────────────────────────────────────────────────────
    if (user.twoFactorEnabled) {
      if (!user.phone) {
        return res.status(400).json({ message: "2FA is enabled but no phone number is set. Please contact support." });
      }

      const { otp, expiry } = generateOTP();
      user.twoFactorSecret = otp;
      user.twoFactorExpiry = expiry;
      await user.save();

      await sendOTPviaSMS(user.phone, otp);

      return res.json({
        requires2FA: true,
        email: user.email,
        message: `A verification code has been sent to your phone ending in ${user.phone.slice(-4)}`,
      });
    }

    // ── No 2FA — return token immediately ──────────────────────────────────
    const token = signToken(user._id);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed. Please try again.", detail: error.message });
  }
});

// ─── Verify 2FA OTP ───────────────────────────────────────────────────────────

router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: "Invalid request" });
    }

    // Check OTP match and expiry
    if (!user.twoFactorSecret || user.twoFactorSecret !== otp) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    if (!user.twoFactorExpiry || new Date() > user.twoFactorExpiry) {
      return res.status(400).json({ message: "Verification code has expired. Please log in again." });
    }

    // Clear OTP fields
    user.twoFactorSecret = null;
    user.twoFactorExpiry = null;
    await user.save();

    const token = signToken(user._id);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    });
  } catch (error) {
    console.error("OTP verification error:", error.message);
    res.status(500).json({ message: "Verification failed. Please try again." });
  }
});

// ─── Get Current User (me) ────────────────────────────────────────────────────

router.get("/me", protect, async (req, res) => {
  res.json({
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    phone: req.user.phone,
    role: req.user.role,
    twoFactorEnabled: req.user.twoFactorEnabled,
    createdAt: req.user.createdAt,
  });
});

// ─── Logout (stateless — client deletes the token) ───────────────────────────

router.post("/logout", (req, res) => {
  res.json({ message: "Logged out successfully" });
});

module.exports = router;
