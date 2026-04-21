const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const axios = require("axios");
const User = require("../models/User");
const Order = require("../models/Order");
const { protect } = require("../middleware/authMiddleware");

// All routes here require authentication
router.use(protect);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const generateOTP = () => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = new Date(Date.now() + 10 * 60 * 1000);
  return { otp, expiry };
};

const sendOTPviaSMS = async (phone, otp, purpose = "verification") => {
  const termiiApiKey = process.env.TERMII_API_KEY;
  const senderId = process.env.TERMII_SENDER_ID || "BagBanter";

  if (!termiiApiKey) {
    console.warn(`TERMII_API_KEY not set — OTP for ${purpose}:`, otp);
    return;
  }

  await axios.post("https://api.ng.termii.com/api/sms/send", {
    to: phone,
    from: senderId,
    sms: `Your BagBanter ${purpose} code is: ${otp}. Valid for 10 minutes. Never share this code.`,
    type: "plain",
    channel: "generic",
    api_key: termiiApiKey,
  });
};

// ─── GET /api/users/profile ───────────────────────────────────────────────────

router.get("/profile", async (req, res) => {
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

// ─── PUT /api/users/profile ───────────────────────────────────────────────────

router.put("/profile", async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();

    await user.save();

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      twoFactorEnabled: user.twoFactorEnabled,
    });
  } catch (error) {
    console.error("Profile update error:", error.message);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

// ─── PUT /api/users/change-password ──────────────────────────────────────────

router.put("/change-password", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Both current and new passwords are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error.message);
    res.status(500).json({ message: "Failed to change password" });
  }
});

// ─── PUT /api/users/toggle-2fa ────────────────────────────────────────────────
// Step 1: Request toggle — sends OTP to phone for confirmation

router.put("/toggle-2fa/request", async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.phone) {
      return res.status(400).json({ message: "Please add a phone number to your profile before enabling 2FA" });
    }

    const { otp, expiry } = generateOTP();
    user.twoFactorSecret = otp;
    user.twoFactorExpiry = expiry;
    await user.save();

    await sendOTPviaSMS(user.phone, otp, "2FA setup");

    res.json({
      message: `A verification code has been sent to your phone ending in ${user.phone.slice(-4)}`,
      currentStatus: user.twoFactorEnabled,
    });
  } catch (error) {
    console.error("2FA toggle request error:", error.message);
    res.status(500).json({ message: "Failed to send verification code" });
  }
});

// Step 2: Confirm OTP and apply toggle

router.put("/toggle-2fa/confirm", async (req, res) => {
  try {
    const { otp } = req.body;
    const user = await User.findById(req.user._id);

    if (!user.twoFactorSecret || user.twoFactorSecret !== otp) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    if (!user.twoFactorExpiry || new Date() > user.twoFactorExpiry) {
      return res.status(400).json({ message: "Verification code has expired. Please request a new one." });
    }

    user.twoFactorEnabled = !user.twoFactorEnabled;
    user.twoFactorSecret = null;
    user.twoFactorExpiry = null;
    await user.save();

    res.json({
      message: `Two-factor authentication has been ${user.twoFactorEnabled ? "enabled" : "disabled"}`,
      twoFactorEnabled: user.twoFactorEnabled,
    });
  } catch (error) {
    console.error("2FA toggle confirm error:", error.message);
    res.status(500).json({ message: "Failed to update 2FA settings" });
  }
});

// ─── GET /api/users/my-orders ─────────────────────────────────────────────────

router.get("/my-orders", async (req, res) => {
  try {
    // Only return paid orders — unpaid/abandoned checkouts are excluded
    const orders = await Order.find({
      user: req.user._id,
      paymentStatus: "paid",
    })
      .sort({ date: -1 })
      .select("deliveryInfo items total status paymentStatus paystackReference date");

    res.json(orders);
  } catch (error) {
    console.error("My orders error:", error.message);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

module.exports = router;
