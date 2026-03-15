const transporter = require("../config/mailer");
const User = require("../models/User");

let otpStore = {};

const OTP_EXPIRATION_MS = 5 * 60 * 1000; // 5 minutos

const normalizeEmail = (email) => (email || "").trim().toLowerCase();

exports.sendOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "El correo es obligatorio."
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    otpStore[email] = {
      code: otp,
      expiresAt: Date.now() + OTP_EXPIRATION_MS
    };

    await transporter.sendMail({
      from: `"Hoy No Circula" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Código de verificación",
      html: `
        <h2>Verificación de cuenta</h2>
        <p>Tu código de verificación es:</p>
        <h1>${otp}</h1>
        <p>Este código expira en 5 minutos.</p>
      `
    });

    return res.json({
      success: true,
      message: "Código enviado al correo"
    });
  } catch (error) {
    console.error("Error enviando OTP:", error);

    return res.status(500).json({
      success: false,
      message: "Error enviando correo"
    });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { otp, fullName, phone, password } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "El correo y el código son obligatorios."
      });
    }

    const savedOtpData = otpStore[email];

    if (!savedOtpData) {
      return res.status(400).json({
        success: false,
        message: "No hay un código activo para este correo. Solicita uno nuevo."
      });
    }

    if (Date.now() > savedOtpData.expiresAt) {
      delete otpStore[email];

      return res.status(400).json({
        success: false,
        message: "El código ha expirado. Solicita uno nuevo."
      });
    }

    if (savedOtpData.code !== otp) {
      return res.status(400).json({
        success: false,
        message: "Código incorrecto"
      });
    }

    delete otpStore[email];

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        fullName: fullName || "",
        email,
        phone: phone || "",
        password: password || "",
        verified: true,
        provider: "local"
      });

      await user.save();
    } else {
      user.verified = true;

      if (fullName) user.fullName = fullName;
      if (phone) user.phone = phone;
      if (password) user.password = password;

      await user.save();
    }

    return res.json({
      success: true,
      message: "Código verificado correctamente",
      user
    });
  } catch (error) {
    console.error("Error verificando OTP:", error);

    return res.status(500).json({
      success: false,
      message: "Error del servidor"
    });
  }
};

exports.googleRegister = async (req, res) => {
  try {
    const fullName = req.body.fullName;
    const email = normalizeEmail(req.body.email);
    const picture = req.body.picture;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "El correo es obligatorio."
      });
    }

    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({
        success: false,
        message: "Ese correo ya está registrado. Inicia sesión con esa cuenta."
      });
    }

    user = new User({
      fullName: fullName || "",
      email,
      phone: "",
      password: "",
      verified: true,
      provider: "google",
      picture: picture || ""
    });

    await user.save();

    return res.json({
      success: true,
      message: "Cuenta registrada con Google correctamente.",
      user
    });
  } catch (error) {
      console.error("Error enviando OTP:", error);

      return res.status(500).json({
        success: false,
        message: error.message || "Error enviando correo"
      });
    }
/**/
};