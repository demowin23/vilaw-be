const express = require("express");
const {
  sendRegistrationOTPController,
  register,
  sendLoginOTPController,
  loginWithOTP,
  login,
  getMe,
  updateProfile,
  logout,
} = require("../controllers/authController");

const { auth } = require("../middleware/auth");

const router = express.Router();

// OTP routes
router.post("/send-registration-otp", sendRegistrationOTPController);
router.post("/send-login-otp", sendLoginOTPController);

// Auth routes
router.post("/register", register);
router.post("/login-otp", loginWithOTP);
router.post("/login", login);

// Protected routes
router.get("/me", auth, getMe);
router.put("/update-profile", auth, updateProfile);
router.post("/logout", auth, logout);

module.exports = router;
