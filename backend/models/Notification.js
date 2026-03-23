const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userEmail: {
      type: String,
      required: true,
      index: true,
      lowercase: true,
      trim: true
    },

    type: {
      type: String,
      enum: [
        "contingencia",
        "doble_hoy_no_circula",
        "recordatorio",
        "vehiculo",
        "general",
        "chatbot"
      ],
      required: true,
      trim: true
    },

    title: {
      type: String,
      default: "",
      trim: true
    },

    message: {
      type: String,
      required: true,
      trim: true
    },

    read: {
      type: Boolean,
      default: false
    },

    relatedId: {
      type: String,
      default: null,
      trim: true
    },

    plate: {
      type: String,
      default: null,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

/* =========================
   ÍNDICES
========================= */
notificationSchema.index({ userEmail: 1, createdAt: -1 });

/* =========================
   NORMALIZACIÓN AUTOMÁTICA
========================= */
notificationSchema.pre("save", function () {
  if (this.userEmail) {
    this.userEmail = String(this.userEmail).trim().toLowerCase();
  }

  if (this.plate) {
    this.plate = String(this.plate).trim().toUpperCase();
  }

  if (this.title) {
    this.title = String(this.title).trim();
  }

  if (this.message) {
    this.message = String(this.message).trim();
  }

  if (this.relatedId) {
    this.relatedId = String(this.relatedId).trim();
  }
});

module.exports = mongoose.model("Notification", notificationSchema);


