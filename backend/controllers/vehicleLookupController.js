const Vehicle = require("../models/Vehicle");
const { calculateVerification } = require("../utils/verificationCalculator");

const normalizePlate = (placa) => {
  return (placa || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .trim();
};

exports.lookupVehicle = async (req, res) => {
  try {
    const { placa } = req.params;

    if (!placa) {
      return res.status(400).json({
        success: false,
        message: "Placa requerida"
      });  
    }

    const normalized = normalizePlate(placa);

    const vehicle = await Vehicle.findOne({
      placaNormalizada: normalized
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehículo no encontrado"
      });
    }

    const verification = calculateVerification(vehicle);

    return res.json({
      success: true,
      vehicle,
      verification
    });
  } catch (error) {
    console.error("lookupVehicle error:", error);

    return res.status(500).json({
      success: false,
      message: "Error del servidor"
    });
  }
};