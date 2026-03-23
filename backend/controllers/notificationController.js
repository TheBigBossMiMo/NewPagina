const mongoose = require("mongoose");
const Notification = require("../models/Notification");

/* =========================
   NORMALIZAR EMAIL
========================= */
const normalizeEmail = (email) => {
  return String(email || "").trim().toLowerCase();
};

const normalizeText = (value) => {
  return String(value || "").trim();
};

const normalizePlate = (value) => {
  return String(value || "").trim().toUpperCase();
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/* =========================
   TIPOS PERMITIDOS
========================= */
const allowedTypes = [
  "contingencia",
  "doble_hoy_no_circula",
  "recordatorio",
  "vehiculo",
  "general",
  "chatbot"
];

/* =========================
   OBTENER NOTIFICACIONES DEL USUARIO
========================= */
exports.getNotifications = async (req, res) => {
  try {
    const email = normalizeEmail(req.query.email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "El email es obligatorio."
      });
    }

    const notifications = await Notification.find({ userEmail: email })
      .sort({ createdAt: -1 })
      .lean();

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

/* =========================
   CREAR NOTIFICACIÓN
========================= */
exports.createNotification = async (req, res) => {
  try {
    const userEmail = normalizeEmail(req.body.userEmail);
    const type = normalizeText(req.body.type);
    const title = normalizeText(req.body.title);
    const message = normalizeText(req.body.message);
    const relatedId = req.body.relatedId ? normalizeText(req.body.relatedId) : null;
    const plate = req.body.plate ? normalizePlate(req.body.plate) : null;

    if (!userEmail || !type || !message) {
      return res.status(400).json({
        success: false,
        message: "userEmail, type y message son obligatorios."
      });
    }

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Tipo de notificación inválido."
      });
    }

    const notification = new Notification({
      userEmail,
      type,
      title,
      message,
      relatedId,
      plate
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

/* =========================
   MARCAR COMO LEÍDA
========================= */
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const email = normalizeEmail(req.body.email || req.query.email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "El email es obligatorio."
      });
    }

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "ID de notificación inválido."
      });
    }

    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notificación no encontrada."
      });
    }

    if (notification.userEmail !== email) {
      return res.status(403).json({
        success: false,
        message: "No tienes permiso para modificar esta notificación."
      });
    }

    if (!notification.read) {
      notification.read = true;
      await notification.save();
    }

    return res.json({
      success: true,
      message: "Notificación marcada como leída.",
      notification
    });
  } catch (error) {
    console.error("Error marcando notificación como leída:", error);
    return res.status(500).json({
      success: false,
      message: "Error marcando notificación como leída"
    });
  }
};

/* =========================
   MARCAR TODAS COMO LEÍDAS
========================= */
exports.markAllAsRead = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email || req.query.email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "El email es obligatorio."
      });
    }

    await Notification.updateMany(
      { userEmail: email, read: false },
      { $set: { read: true } }
    );

    return res.json({
      success: true,
      message: "Todas las notificaciones fueron marcadas como leídas."
    });
  } catch (error) {
    console.error("Error marcando todas como leídas:", error);
    return res.status(500).json({
      success: false,
      message: "Error marcando todas como leídas"
    });
  }
};

/* =========================
   ELIMINAR NOTIFICACIÓN
========================= */
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const email = normalizeEmail(req.body.email || req.query.email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "El email es obligatorio."
      });
    }

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "ID de notificación inválido."
      });
    }

    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notificación no encontrada."
      });
    }

    if (notification.userEmail !== email) {
      return res.status(403).json({
        success: false,
        message: "No tienes permiso para eliminar esta notificación."
      });
    }

    await notification.deleteOne();

    return res.json({
      success: true,
      message: "Notificación eliminada correctamente."
    });
  } catch (error) {
    console.error("Error eliminando notificación:", error);
    return res.status(500).json({
      success: false,
      message: "Error eliminando notificación"
    });
  }
};

