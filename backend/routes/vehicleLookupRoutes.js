const express = require("express");
const router = express.Router();

const { lookupVehicle } = require("../controllers/vehicleLookupController");

/* =========================
   CONSULTAR VEHÍCULO POR PLACA
   GET /api/lookup/vehicle/:placa
========================= */
router.get("/vehicle/:placa", lookupVehicle);

module.exports = router;