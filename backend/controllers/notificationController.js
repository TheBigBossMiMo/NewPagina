const Notification = require("../models/Notification");

// Obtener notificaciones del usuario
exports.getNotifications = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "El email es obligatorio."
      });
    }

    const notifications = await Notification.find({ userEmail: email })
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error("Error obteniendo notificaciones:", error);
    return res.status(500).json({
      success: false,
      message: "Error obteniendo notificaciones"
    });
  }
};

// Crear notificación
exports.createNotification = async (req, res) => {
  try {
    const { userEmail, type, message } = req.body;

    if (!userEmail || !type || !message) {
      return res.status(400).json({
        success: false,
        message: "userEmail, type y message son obligatorios."
      });
    }

    const notification = new Notification({
      userEmail,
      type,
      message
    });

    await notification.save();

    return res.status(201).json({
      success: true,
      notification
    });
  } catch (error) {
    console.error("Error creando notificación:", error);
    return res.status(500).json({
      success: false,
      message: "Error creando notificación"
    });
  }
};