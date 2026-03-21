const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: true,
    index: true
  },

  type: {
    type: String,
    enum: [
      "contingencia",
      "doble_hoy_no_circula",
      "recordatorio",
      "vehiculo", // 🔥 nuevo (para avisos ligados a placas)
      "general"   // 🔥 nuevo (por si mandas anuncios globales)
    ],
    required: true
  },

  title: { // 🔥 NUEVO (para UI bonita)
    type: String,
    default: ""
  },

  message: {
    type: String,
    required: true
  },

  read: {
    type: Boolean,
    default: false
  },

  relatedId: {
    type: String,
    default: null
  },

  // 🔥 NUEVO: guardar placa o referencia directa
  plate: {
    type: String,
    default: null
  }

}, {
  timestamps: true
});

module.exports = mongoose.model("Notification", notificationSchema);