const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
      trim: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    }
  },
  { _id: false }
);

const chatSessionSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },

    history: {
      type: [messageSchema],
      default: []
    },

    activeTopic: {
      type: String,
      default: null,
      trim: true
    },

    activeVehicleIndex: {
      type: Number,
      default: null
    },

    lastVehicleField: {
      type: String,
      default: null,
      trim: true
    },

    lastIntent: {
      type: String,
      default: null,
      trim: true
    },

    lastOptionsContext: {
      type: String,
      default: null,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

chatSessionSchema.index({ email: 1 }, { unique: true });

/* =========================
   NORMALIZACIÓN AUTOMÁTICA
========================= */
chatSessionSchema.pre('save', function () {
  if (this.email) {
    this.email = String(this.email).trim().toLowerCase();
  }

  if (Array.isArray(this.history)) {
    this.history = this.history
      .filter((item) => item && item.role && item.content)
      .map((item) => ({
        role: String(item.role).trim(),
        content: String(item.content).trim()
      }));
  }
});

module.exports = mongoose.model('ChatSession', chatSessionSchema);