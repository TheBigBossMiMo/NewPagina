const express = require("express");
const router = express.Router();

const {
  sendOtp,
  verifyOtp,
  googleRegister
} = require("../controllers/authController");

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/google-register", googleRegister);

module.exports = router;