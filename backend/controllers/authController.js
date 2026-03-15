const User = require("../models/User");
const SibApiV3Sdk = require("sib-api-v3-sdk");

let otpStore = {};

const OTP_EXPIRATION_MS = 5 * 60 * 1000;

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
      message: "Error enviando correo"
    });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { otp, fullName, phone, password } = req.body;

    const savedOtpData = otpStore[email];

    if (!savedOtpData) {
      return res.status(400).json({
        success: false,
        message: "No hay un código activo para este correo."
      });
    }

    if (Date.now() > savedOtpData.expiresAt) {
      delete otpStore[email];

      return res.status(400).json({
        success: false,
        message: "El código expiró."
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
        fullName,
        email,
        phone,
        password,
        verified: true,
        provider: "local"
      });

      await user.save();
    }

    return res.json({
      success: true,
      message: "Cuenta verificada"
    });

  } catch (error) {
    console.error("Error verificando OTP:", error);

    return res.status(500).json({
      success: false,
      message: "Error del servidor"
    });
  }
};