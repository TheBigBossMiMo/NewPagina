const User = require("../models/User");
const SibApiV3Sdk = require("sib-api-v3-sdk");
const bcrypt = require("bcryptjs");

let otpStore = {};

const OTP_EXPIRATION_MS = 5 * 60 * 1000; // 5 minutos

const normalizeEmail = (email) => (email || "").trim().toLowerCase();

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

exports.sendOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "El correo es obligatorio."
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Ese correo ya está registrado. Inicia sesión con esa cuenta normal."
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    otpStore[email] = {
      code: otp,
      expiresAt: Date.now() + OTP_EXPIRATION_MS
    };

    await tranEmailApi.sendTransacEmail({
      sender: {
        name: "Hoy No Circula",
        email: "soporte.hoynocircula@gmail.com"
      },
      to: [{ email }],
      subject: "Código de verificación",
      htmlContent: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Verificación de cuenta</h2>
          <p>Tu código de verificación es:</p>
          <h1 style="letter-spacing: 4px;">${otp}</h1>
          <p>Este código expira en 5 minutos.</p>
        </div>
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
      message:
        error?.response?.body?.message ||
        error.message ||
        "Error enviando correo"
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

    if (!password || !password.trim()) {
      return res.status(400).json({
        success: false,
        message: "La contraseña es obligatoria."
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

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      delete otpStore[email];
      return res.status(400).json({
        success: false,
        message: "Ese correo ya está registrado. Inicia sesión con esa cuenta"
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password.trim(), salt);

    const user = new User({
      fullName: fullName || "",
      email,
      phone: phone || "",
      password: hashedPassword,
      verified: true,
      provider: "local"
    });

    await user.save();

    delete otpStore[email];

    return res.json({
      success: true,
      message: "Código verificado correctamente",
      user
    });
  } catch (error) {
    console.error("Error verificando OTP:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Error del servidor"
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

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Ese correo ya está registrado. Inicia sesión con esa cuenta de google."
      });
    }

    const user = new User({
      fullName: fullName || "",
      email,
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
    console.error("Error registrando con Google:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Error del servidor al registrar con Google."
    });
  }
};

/* =========================
   LOGIN NORMAL
========================= */
exports.login = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = (req.body.password || "").trim();

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "El correo y la contraseña son obligatorios."
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Ese correo no está registrado."
      });
    }

    if (user.provider === "google") {
      return res.status(400).json({
        success: false,
        message: "Este correo fue registrado con Google. Inicia sesión con Google."
      });
    }

    const storedPassword = (user.password || "").trim();

    if (!storedPassword) {
      return res.status(400).json({
        success: false,
        message: "Este usuario no tiene contraseña configurada."
      });
    }

    const looksHashed =
      storedPassword.startsWith("$2a$") ||
      storedPassword.startsWith("$2b$") ||
      storedPassword.startsWith("$2y$");

    let isPasswordCorrect = false;

    if (looksHashed) {
      if (typeof user.comparePassword === "function") {
        try {
          isPasswordCorrect = await user.comparePassword(password);
        } catch (compareError) {
          console.error("Error usando comparePassword:", compareError);
          isPasswordCorrect = await bcrypt.compare(password, storedPassword);
        }
      } else {
        isPasswordCorrect = await bcrypt.compare(password, storedPassword);
      }
    } else {
      isPasswordCorrect = storedPassword === password;

      if (isPasswordCorrect) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();
      }
    }

    if (!isPasswordCorrect) {
      return res.status(400).json({
        success: false,
        message: "Contraseña incorrecta."
      });
    }

    return res.json({
      success: true,
      message: "Inicio de sesión correcto.",
      user
    });
  } catch (error) {
    console.error("Error en login:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Error del servidor al iniciar sesión."
    });
  }
};