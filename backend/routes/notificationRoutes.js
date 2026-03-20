const express = require("express");
const router = express.Router();

const {
  getNotifications,
  createNotification
} = require("../controllers/notificationController");

/* =========================
   OBTENER NOTIFICACIONES POR EMAIL
========================= */
router.get("/", getNotifications);

/* =========================
   CREAR NOTIFICACIÓN
========================= */
router.post("/", createNotification);

module.exports = router;