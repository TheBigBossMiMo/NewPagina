const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    entidad: {
      type: String,
      enum: ["CDMX", "EDOMEX"],
      required: true
    },
    placa: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    placaNormalizada: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    modelo: {
      type: Number,
      required: true
    },
    holograma: {
      type: String,
      enum: ["00", "0", "1", "2"],
      required: true
    }
  },
  {
    timestamps: true
  }
);

vehicleSchema.index({ entidad: 1, placaNormalizada: 1 }, { unique: true });

module.exports = mongoose.model("Vehicle", vehicleSchema);