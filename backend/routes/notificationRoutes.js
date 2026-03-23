const express = require("express");
const router = express.Router();

const {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification
} = require("../controllers/notificationController");

/* =========================
   TEST RÁPIDO
========================= */
router.get("/test", (req, res) => {
  return res.json({
    success: true,
    message: "Rutas de notificaciones funcionando correctamente 🚀"
  });
});

/* =========================
   OBTENER CONTEO DE NO LEÍDAS
   (útil para escalar después)
========================= */
router.get("/unread-count", async (req, res) => {
  try {
    const Notification = require("../models/Notification");
    const email = String(req.query.email || "").trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "El email es obligatorio."
      });
    }

    const count = await Notification.countDocuments({
      userEmail: email,
      read: false
    });

    return res.json({
      success: true,
      unreadCount: count
    });
  } catch (error) {
    console.error("Error obteniendo conteo de no leídas:", error);
    return res.status(500).json({
      success: false,
      message: "Error obteniendo conteo de notificaciones"
    });
  }
});

/* =========================
   OBTENER NOTIFICACIONES POR EMAIL
========================= */
router.get("/", getNotifications);

/* =========================
   CREAR NOTIFICACIÓN
========================= */
router.post("/", createNotification);

/* =========================
   MARCAR TODAS COMO LEÍDAS
========================= */
router.put("/read-all", markAllAsRead);

/* =========================
   MARCAR UNA COMO LEÍDA
========================= */
router.put("/:id/read", markAsRead);

/* =========================
   ELIMINAR NOTIFICACIÓN
========================= */
router.delete("/:id", deleteNotification);

module.exports = router;

