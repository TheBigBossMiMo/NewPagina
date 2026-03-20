const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: true,
    index: true // 🔥 mejora rendimiento búsquedas
  },
  type: {
    type: String,
    enum: ["contingencia", "doble_hoy_no_circula", "recordatorio"],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },

  // 🔥 NUEVO: para futuras automatizaciones
  relatedId: {
    type: String,
    default: null
  }

}, {
  timestamps: true
});

module.exports = mongoose.model("Notification", notificationSchema);