const Vehicle = require("../models/Vehicle");

/* =========================
   NORMALIZAR PLACA
========================= */
const normalizePlate = (placa) => {
  return (placa || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .trim();
};

/* =========================
   VALIDACIONES AUXILIARES
========================= */
const getMaxModelYear = () => {
  return new Date().getFullYear() + 2;
};

/* =========================
   CREAR VEHÍCULO
========================= */
exports.createVehicle = async (req, res) => {
  try {
    const {
      email,
      fullName,
      entidad,
      placa,
      modelo,
      holograma,
      marca,
      submodelo,
      color,
      imagen
    } = req.body;

    const ownerEmail = (email || "").trim().toLowerCase();
    const ownerFullName = (fullName || "").trim();
    const entidadValue = String(entidad || "").trim().toUpperCase();
    const placaValue = String(placa || "").trim().toUpperCase();
    const placaNormalizada = normalizePlate(placaValue);
    const modeloNumber = Number(modelo);
    const hologramaValue = String(holograma || "").trim();
    const marcaValue = String(marca || "").trim();
    const submodeloValue = String(submodelo || "").trim();
    const colorValue = String(color || "").trim();
    const imagenValue = String(imagen || "").trim();
    const maxModelYear = getMaxModelYear();

    if (!ownerEmail || !entidadValue || !placaValue || !modelo || !hologramaValue) {
      return res.status(400).json({
        success: false,
        message: "Datos incompletos"
      });
    }

    if (!["CDMX", "EDOMEX"].includes(entidadValue)) {
      return res.status(400).json({
        success: false,
        message: "Entidad inválida"
      });
    }

    if (!placaNormalizada) {
      return res.status(400).json({
        success: false,
        message: "Placa inválida"
      });
    }

    if (!Number.isFinite(modeloNumber) || modeloNumber < 1950 || modeloNumber > maxModelYear) {
      return res.status(400).json({
        success: false,
        message: `Modelo inválido. Debe estar entre 1950 y ${maxModelYear}`
      });
    }

    if (!["00", "0", "1", "2"].includes(hologramaValue)) {
      return res.status(400).json({
        success: false,
        message: "Holograma inválido"
      });
    }

    const existing = await Vehicle.findOne({
      entidad: entidadValue,
      placaNormalizada
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Esta placa ya está registrada en el sistema"
      });
    }

    const vehicle = new Vehicle({
      ownerEmail,
      ownerFullName,
      entidad: entidadValue,
      placa: placaValue,
      placaNormalizada,
      modelo: modeloNumber,
      holograma: hologramaValue,
      marca: marcaValue,
      submodelo: submodeloValue,
      color: colorValue,
      imagen: imagenValue
    });

    await vehicle.save();

    return res.status(201).json({
      success: true,
      message: "Vehículo registrado correctamente",
      vehicle
    });
  } catch (error) {
    console.error("Error createVehicle:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Esta placa ya está registrada en el sistema"
      });
    }

    return res.status(500).json({
      success: false,
      message: "Error del servidor"
    });
  }
};

/* =========================
   OBTENER VEHÍCULOS DEL USUARIO
========================= */
exports.getVehiclesByOwner = async (req, res) => {
  try {
    const email = (req.query.email || "").trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email requerido"
      });
    }

    const vehicles = await Vehicle.find({ ownerEmail: email }).sort({
      createdAt: -1
    });

    return res.json({
      success: true,
      vehicles
    });
  } catch (error) {
    console.error("Error getVehicles:", error);
    return res.status(500).json({
      success: false,
      message: "Error del servidor"
    });
  }
};

/* =========================
   OBTENER VEHÍCULO POR ID
========================= */
exports.getVehicleById = async (req, res) => {
  try {
    const { id } = req.params;
    const email = (req.query.email || "").trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email requerido"
      });
    }

    const vehicle = await Vehicle.findById(id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehículo no encontrado"
      });
    }

    if (vehicle.ownerEmail !== email) {
      return res.status(403).json({
        success: false,
        message: "No tienes acceso a este vehículo"
      });
    }

    return res.json({
      success: true,
      vehicle
    });
  } catch (error) {
    console.error("Error getVehicleById:", error);
    return res.status(500).json({
      success: false,
      message: "Error del servidor"
    });
  }
};

/* =========================
   ACTUALIZAR VEHÍCULO
========================= */
exports.updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const email = (req.body.email || "").trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email requerido"
      });
    }

    const vehicle = await Vehicle.findById(id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehículo no encontrado"
      });
    }

    if (vehicle.ownerEmail !== email) {
      return res.status(403).json({
        success: false,
        message: "No puedes editar este vehículo"
      });
    }

    const entidadValue = String(req.body.entidad || vehicle.entidad).trim().toUpperCase();
    const placaValue = String(req.body.placa || vehicle.placa).trim().toUpperCase();
    const placaNormalizada = normalizePlate(placaValue);
    const modeloNumber = Number(req.body.modelo ?? vehicle.modelo);
    const hologramaValue = String(req.body.holograma || vehicle.holograma).trim();
    const marcaValue = String(req.body.marca ?? vehicle.marca ?? "").trim();
    const submodeloValue = String(req.body.submodelo ?? vehicle.submodelo ?? "").trim();
    const colorValue = String(req.body.color ?? vehicle.color ?? "").trim();
    const imagenValue = String(req.body.imagen ?? vehicle.imagen ?? "").trim();
    const maxModelYear = getMaxModelYear();

    if (!["CDMX", "EDOMEX"].includes(entidadValue)) {
      return res.status(400).json({
        success: false,
        message: "Entidad inválida"
      });
    }

    if (!placaNormalizada) {
      return res.status(400).json({
        success: false,
        message: "Placa inválida"
      });
    }

    if (!Number.isFinite(modeloNumber) || modeloNumber < 1950 || modeloNumber > maxModelYear) {
      return res.status(400).json({
        success: false,
        message: `Modelo inválido. Debe estar entre 1950 y ${maxModelYear}`
      });
    }

    if (!["00", "0", "1", "2"].includes(hologramaValue)) {
      return res.status(400).json({
        success: false,
        message: "Holograma inválido"
      });
    }

    const existingVehicle = await Vehicle.findOne({
      entidad: entidadValue,
      placaNormalizada,
      _id: { $ne: id }
    });

    if (existingVehicle) {
      return res.status(409).json({
        success: false,
        message: "Ya existe otro vehículo con esa placa en esa entidad"
      });
    }

    vehicle.entidad = entidadValue;
    vehicle.placa = placaValue;
    vehicle.placaNormalizada = placaNormalizada;
    vehicle.modelo = modeloNumber;
    vehicle.holograma = hologramaValue;
    vehicle.marca = marcaValue;
    vehicle.submodelo = submodeloValue;
    vehicle.color = colorValue;
    vehicle.imagen = imagenValue;

    await vehicle.save();

    return res.json({
      success: true,
      message: "Vehículo actualizado",
      vehicle
    });
  } catch (error) {
    console.error("Error updateVehicle:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Ya existe otro vehículo con esa placa en esa entidad"
      });
    }

    return res.status(500).json({
      success: false,
      message: "Error del servidor"
    });
  }
};

/* =========================
   ELIMINAR VEHÍCULO
========================= */
exports.deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const email = (req.query.email || "").trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email requerido"
      });
    }

    const vehicle = await Vehicle.findById(id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehículo no encontrado"
      });
    }

    if (vehicle.ownerEmail !== email) {
      return res.status(403).json({
        success: false,
        message: "No puedes eliminar este vehículo"
      });
    }

    await vehicle.deleteOne();

    return res.json({
      success: true,
      message: "Vehículo eliminado correctamente"
    });
  } catch (error) {
    console.error("Error deleteVehicle:", error);
    return res.status(500).json({
      success: false,
      message: "Error del servidor"
    });
  }
};