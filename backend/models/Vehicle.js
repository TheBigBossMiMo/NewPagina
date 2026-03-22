const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    ownerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    ownerFullName: {
      type: String,
      default: "",
      trim: true
    },
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
    },
    marca: {
      type: String,
      default: "",
      trim: true
    },
    submodelo: {
      type: String,
      default: "",
      trim: true
    },
    color: {
      type: String,
      default: "",
      trim: true
    },
    imagen: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

vehicleSchema.index({ entidad: 1, placaNormalizada: 1 }, { unique: true });
vehicleSchema.index({ ownerEmail: 1 });
vehicleSchema.index({ ownerEmail: 1, createdAt: -1 });

module.exports = mongoose.model("Vehicle", vehicleSchema);