const express = require("express");
const router = express.Router();

const {
  createVehicle,
  getVehiclesByOwner,
  getVehicleById,
  updateVehicle,
  deleteVehicle
} = require("../controllers/vehicleController");

/* =========================
   CREAR VEHÍCULO
   POST /api/vehicles
========================= */
router.post("/", createVehicle);

/* =========================
   OBTENER VEHÍCULOS DEL USUARIO
   GET /api/vehicles?email=...
========================= */
router.get("/", getVehiclesByOwner);

/* =========================
   OBTENER VEHÍCULO POR ID
========================= */
router.get("/:id", (req, res, next) => {
  const { id } = req.params;

  // Validación simple de ObjectId (evita errores de Mongo)
  if (!id || id.length !== 24) {
    return res.status(400).json({
      success: false,
      message: "ID inválido"
    });
  }

  next();
}, getVehicleById);

/* =========================
   ACTUALIZAR VEHÍCULO
========================= */
router.put("/:id", (req, res, next) => {
  const { id } = req.params;

  if (!id || id.length !== 24) {
    return res.status(400).json({
      success: false,
      message: "ID inválido"
    });
  }

  next();
}, updateVehicle);

/* =========================
   ELIMINAR VEHÍCULO
========================= */
router.delete("/:id", (req, res, next) => {
  const { id } = req.params;

  if (!id || id.length !== 24) {
    return res.status(400).json({
      success: false,
      message: "ID inválido"
    });
  }

  next();
}, deleteVehicle);

module.exports = router;