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
   OBTENER NOTIFICACIONES POR EMAIL
========================= */
router.get("/", getNotifications);

/* =========================
   CREAR NOTIFICACIÓN
========================= */
router.post("/", createNotification);

/* =========================
   MARCAR UNA COMO LEÍDA
========================= */
router.put("/:id/read", markAsRead);

/* =========================
   MARCAR TODAS COMO LEÍDAS
========================= */
router.put("/read-all", markAllAsRead);

/* =========================
   ELIMINAR NOTIFICACIÓN
========================= */
router.delete("/:id", deleteNotification);

module.exports = router;