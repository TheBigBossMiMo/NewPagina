const express = require("express");
const router = express.Router();

const {
  sendOtp,
  verifyOtp,
  googleRegister,
  login,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  changePasswordProfile,
  updateProfileImage
} = require("../controllers/authController");

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/google-register", googleRegister);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.get("/profile", getProfile);
router.put("/profile", updateProfile);

router.put("/change-password", changePasswordProfile);
router.put("/profile-image", updateProfileImage);

module.exports = router;