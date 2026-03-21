const User = require("../models/User");
const SibApiV3Sdk = require("sib-api-v3-sdk");
const bcrypt = require("bcryptjs");

let otpStore = {};
let resetOtpStore = {};

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

/* =========================
   FORGOT PASSWORD
========================= */
exports.forgotPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "El correo es obligatorio."
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Cuenta no encontrada."
      });
    }

    if (user.provider === "google") {
      return res.status(400).json({
        success: false,
        message: "Esta cuenta fue registrada con Google. Inicia sesión con Google."
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    resetOtpStore[email] = {
      code: otp,
      expiresAt: Date.now() + OTP_EXPIRATION_MS
    };

    await tranEmailApi.sendTransacEmail({
      sender: {
        name: "Hoy No Circula",
        email: "soporte.hoynocircula@gmail.com"
      },
      to: [{ email }],
      subject: "Recuperación de contraseña",
      htmlContent: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Recuperación de contraseña</h2>
          <p>Tu código de recuperación es:</p>
          <h1 style="letter-spacing: 4px;">${otp}</h1>
          <p>Este código expira en 5 minutos.</p>
        </div>
      `
    });

    return res.json({
      success: true,
      message: "Código de recuperación enviado correctamente."
    });
  } catch (error) {
    console.error("Error en forgotPassword:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Error del servidor al enviar el código."
    });
  }
};

/* =========================
   RESET PASSWORD
========================= */
exports.resetPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || "").trim();
    const newPassword = String(req.body.newPassword || "").trim();

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Completa correo, código y nueva contraseña."
      });
    }

    const savedOtpData = resetOtpStore[email];

    if (!savedOtpData) {
      return res.status(400).json({
        success: false,
        message: "No hay un código activo para este correo. Solicita uno nuevo."
      });
    }

    if (Date.now() > savedOtpData.expiresAt) {
      delete resetOtpStore[email];
      return res.status(400).json({
        success: false,
        message: "El código ha expirado. Solicita uno nuevo."
      });
    }

    if (savedOtpData.code !== otp) {
      return res.status(400).json({
        success: false,
        message: "Código incorrecto."
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      delete resetOtpStore[email];
      return res.status(404).json({
        success: false,
        message: "Cuenta no encontrada."
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    delete resetOtpStore[email];

    return res.json({
      success: true,
      message: "Contraseña actualizada correctamente."
    });
  } catch (error) {
    console.error("Error en resetPassword:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Error del servidor al actualizar la contraseña."
    });
  }
};

/* =========================
   GET PROFILE
========================= */
exports.getProfile = async (req, res) => {
  try {
    const email = (req.query.email || "").trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email requerido"
      });
    }

    const user = await User.findOne({ email }).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    return res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error("Error getProfile:", error);
    return res.status(500).json({
      success: false,
      message: "Error del servidor"
    });
  }
};

/* =========================
   UPDATE PROFILE
========================= */
exports.updateProfile = async (req, res) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    const { fullName, phone, notificaciones } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email requerido"
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    user.fullName = fullName ?? user.fullName;
    user.phone = phone ?? user.phone;

    if (typeof notificaciones === "boolean") {
      user.notificaciones = notificaciones;
    }

    await user.save();

    return res.json({
      success: true,
      message: "Perfil actualizado",
      user
    });
  } catch (error) {
    console.error("Error updateProfile:", error);
    return res.status(500).json({
      success: false,
      message: "Error del servidor"
    });
  }
};

/* =========================
   CHANGE PASSWORD (PROFILE)
========================= */
exports.changePasswordProfile = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const currentPassword = String(req.body.currentPassword || "").trim();
    const newPassword = String(req.body.newPassword || "").trim();

    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Datos incompletos."
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "La nueva contraseña debe tener al menos 8 caracteres."
      });
    }

    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);

    if (!hasUppercase || !hasLowercase || !hasNumber) {
      return res.status(400).json({
        success: false,
        message: "La nueva contraseña debe incluir mayúscula, minúscula y número."
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    if (user.provider === "google") {
      return res.status(400).json({
        success: false,
        message: "Las cuentas de Google no pueden cambiar contraseña."
      });
    }

    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: "Este usuario no tiene contraseña configurada."
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Contraseña actual incorrecta"
      });
    }

    const samePassword = await bcrypt.compare(newPassword, user.password);

    if (samePassword) {
      return res.status(400).json({
        success: false,
        message: "La nueva contraseña no puede ser igual a la actual."
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    return res.json({
      success: true,
      message: "Contraseña actualizada correctamente"
    });
  } catch (error) {
    console.error("Error changePasswordProfile:", error);
    return res.status(500).json({
      success: false,
      message: "Error del servidor"
    });
  }
};

/* =========================
   UPDATE PROFILE IMAGE (LOCAL)
========================= */
exports.updateProfileImage = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { picture } = req.body;

    if (!email || !picture) {
      return res.status(400).json({
        success: false,
        message: "Datos incompletos"
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    if (user.provider === "google") {
      return res.status(400).json({
        success: false,
        message: "Las cuentas de Google usan su foto original"
      });
    }

    user.picture = picture;

    await user.save();

    return res.json({
      success: true,
      message: "Foto actualizada",
      user
    });
  } catch (error) {
    console.error("Error updateProfileImage:", error);
    return res.status(500).json({
      success: false,
      message: "Error del servidor"
    });
  }
};