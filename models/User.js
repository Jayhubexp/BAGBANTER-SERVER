const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
	name: { type: String, required: true },
	email: { type: String, required: true, unique: true },
	password: { type: String, required: true },
	role: { type: String, default: "customer", enum: ["customer", "admin"] }, // 'admin' role for dashboard access
	createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
