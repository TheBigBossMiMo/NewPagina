require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const authRoutes = require("./routes/authRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const Vehicle = require("./models/Vehicle");

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://new-pagina-kappa.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Origen no permitido por CORS: " + origin));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB conectado");
  })
  .catch((err) => {
    console.error("Error MongoDB:", err);
  });

app.get("/", (req, res) => {
  res.send("Backend Hoy No Circula activo");
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "API funcionando." });
});

app.use("/api/auth", authRoutes);
app.use("/api/notifications", notificationRoutes);



/* =========================
   FUNCIONES AUXILIARES
========================= */

const normalizePlate = (value = "") => {
  return value.toUpperCase().replace(/\s+/g, "").trim();
};

const normalizeRawPlate = (value = "") => {
  return normalizePlate(value).replace(/-/g, "");
};

const normalizeState = (value = "") => {
  const clean = value.toUpperCase().trim();

  if (clean === "CDMX") return "CDMX";
  if (
    clean === "EDOMEX" ||
    clean === "ESTADO DE MEXICO" ||
    clean === "ESTADO DE MÉXICO"
  ) {
    return "EDOMEX";
  }

  return "";
};

const isValidPlateFormatByState = (plate, state) => {
  const normalized = normalizePlate(plate);
  const raw = normalized.replace(/-/g, "");

  if (state === "CDMX") {
    return (
      /^[A-Z]{3}-\d{3}$/.test(normalized) ||
      /^\d{3}-[A-Z]{3}$/.test(normalized) ||
      /^[A-Z]{3}\d{3}$/.test(raw) ||
      /^\d{3}[A-Z]{3}$/.test(raw)
    );
  }

  if (state === "EDOMEX") {
    return (
      /^[A-Z]{2}-\d{2}-[A-Z]{2}$/.test(normalized) ||
      /^\d{2}-[A-Z]{2}-\d{2}$/.test(normalized) ||
      /^[A-Z]{2}\d{2}[A-Z]{2}$/.test(raw) ||
      /^\d{2}[A-Z]{2}\d{2}$/.test(raw)
    );
  }

  return false;
};

const getLastNumericDigit = (plate) => {
  const digits = plate.match(/\d/g);
  if (!digits || digits.length === 0) return null;
  return parseInt(digits[digits.length - 1], 10);
};

const getSaturdayNumberInMonth = (date) => {
  return Math.ceil(date.getDate() / 7);
};

const evaluateCirculation = ({ plate, holograma }) => {
  const diaActual = new Date().getDay(); // 0=Dom, 1=Lun ... 6=Sab
  const ultimoDigito = getLastNumericDigit(plate);

  if (ultimoDigito === null || Number.isNaN(ultimoDigito)) {
    return {
      circula: false,
      mensaje: "No fue posible determinar la circulación porque la matrícula no contiene dígitos válidos."
    };
  }

  const dayRule = {
    1: [5, 6], // Lunes
    2: [7, 8], // Martes
    3: [3, 4], // Miércoles
    4: [1, 2], // Jueves
    5: [9, 0]  // Viernes
  };

  if (diaActual === 0) {
    return {
      circula: true,
      mensaje: "Domingo: sin restricción del programa base."
    };
  }

  if (diaActual === 6) {
    if (holograma === "00" || holograma === "0") {
      return {
        circula: true,
        mensaje: `Sábado: sin restricción para holograma ${holograma}.`
      };
    }

    if (holograma === "2") {
      return {
        circula: false,
        mensaje: "Sábado: restricción sabatina para holograma 2."
      };
    }

    if (holograma === "1") {
      const nth = getSaturdayNumberInMonth(new Date());
      const isOdd = [1, 3, 5, 7, 9].includes(ultimoDigito);
      const isEven = [0, 2, 4, 6, 8].includes(ultimoDigito);

      if (nth === 5) {
        return {
          circula: true,
          mensaje: "Quinto sábado: sin restricción sabatina para holograma 1."
        };
      }

      if ((nth === 1 || nth === 3) && isOdd) {
        return {
          circula: false,
          mensaje: `Sábado #${nth}: restricción por terminación impar.`
        };
      }

      if ((nth === 2 || nth === 4) && isEven) {
        return {
          circula: false,
          mensaje: `Sábado #${nth}: restricción por terminación par.`
        };
      }

      return {
        circula: true,
        mensaje: "Sábado: sin restricción adicional."
      };
    }
  }

  if (holograma === "00" || holograma === "0") {
    return {
      circula: true,
      mensaje: `Entre semana: sin restricción para holograma ${holograma}.`
    };
  }

  const restrictedDigits = dayRule[diaActual] || [];
  const isRestrictedToday = restrictedDigits.includes(ultimoDigito);

  if (isRestrictedToday) {
    return {
      circula: false,
      mensaje: `Hoy NO circulas. Terminación restringida: ${restrictedDigits.join(" y ")}.`
    };
  }

  return {
    circula: true,
    mensaje: "Hoy puedes circular sin problema."
  };
};

/* =========================
   REGISTRAR VEHÍCULO
========================= */

app.post("/api/vehicles", async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const maxModelYear = currentYear + 2;

    const entidad = normalizeState(req.body.entidad || "");
    const placa = normalizePlate(req.body.placa || "");
    const placaNormalizada = normalizeRawPlate(req.body.placa || "");
    const modelo = Number(req.body.modelo);
    const holograma = String(req.body.holograma || "").trim();

    if (!entidad) {
      return res.status(400).json({
        message: "Selecciona una entidad válida."
      });
    }

    if (!placa || !isValidPlateFormatByState(placa, entidad)) {
      return res.status(400).json({
        message:
          entidad === "CDMX"
            ? "La placa no coincide con un formato válido de CDMX."
            : "La placa no coincide con un formato válido del Estado de México."
      });
    }

    if (!Number.isFinite(modelo) || modelo < 1950 || modelo > maxModelYear) {
      return res.status(400).json({
        message: `El modelo debe estar entre 1950 y ${maxModelYear}.`
      });
    }

    if (!["00", "0", "1", "2"].includes(holograma)) {
      return res.status(400).json({
        message: "Selecciona un holograma válido."
      });
    }

    const existingVehicle = await Vehicle.findOne({
      entidad,
      placaNormalizada
    });

    if (existingVehicle) {
      return res.status(409).json({
        message: "Esta placa ya está registrada en esa entidad."
      });
    }

    const vehicle = new Vehicle({
      entidad,
      placa,
      placaNormalizada,
      modelo,
      holograma
    });

    await vehicle.save();

    return res.status(201).json({
      success: true,
      message: "Vehículo registrado correctamente.",
      vehicle
    });
  } catch (error) {
    console.error("Error registrando vehículo:", error);
    return res.status(500).json({
      success: false,
      message: "Error del servidor al registrar el vehículo."
    });
  }
});

/* =========================
   VER VEHÍCULOS
========================= */

app.get("/api/vehicles", async (req, res) => {
  try {
    const vehicles = await Vehicle.find().sort({ createdAt: -1 });

    return res.json({
      success: true,
      vehicles
    });
  } catch (error) {
    console.error("Error obteniendo vehículos:", error);
    return res.status(500).json({
      success: false,
      message: "Error del servidor al obtener los vehículos."
    });
  }
});

/* =========================
   VER UN VEHÍCULO POR ID
========================= */

app.get("/api/vehicles/:id", async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehículo no encontrado."
      });
    }

    return res.json({
      success: true,
      vehicle
    });
  } catch (error) {
    console.error("Error obteniendo vehículo por ID:", error);
    return res.status(500).json({
      success: false,
      message: "Error del servidor al obtener el vehículo."
    });
  }
});

/* =========================
   EDITAR VEHÍCULO
========================= */

app.put("/api/vehicles/:id", async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const maxModelYear = currentYear + 2;

    const entidad = normalizeState(req.body.entidad || "");
    const placa = normalizePlate(req.body.placa || "");
    const placaNormalizada = normalizeRawPlate(req.body.placa || "");
    const modelo = Number(req.body.modelo);
    const holograma = String(req.body.holograma || "").trim();

    if (!entidad) {
      return res.status(400).json({
        message: "Selecciona una entidad válida."
      });
    }

    if (!placa || !isValidPlateFormatByState(placa, entidad)) {
      return res.status(400).json({
        message:
          entidad === "CDMX"
            ? "La placa no coincide con un formato válido de CDMX."
            : "La placa no coincide con un formato válido del Estado de México."
      });
    }

    if (!Number.isFinite(modelo) || modelo < 1950 || modelo > maxModelYear) {
      return res.status(400).json({
        message: `El modelo debe estar entre 1950 y ${maxModelYear}.`
      });
    }

    if (!["00", "0", "1", "2"].includes(holograma)) {
      return res.status(400).json({
        message: "Selecciona un holograma válido."
      });
    }

    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehículo no encontrado."
      });
    }

    const existingVehicle = await Vehicle.findOne({
      entidad,
      placaNormalizada,
      _id: { $ne: req.params.id }
    });

    if (existingVehicle) {
      return res.status(409).json({
        success: false,
        message: "Ya existe otro vehículo con esa placa en esa entidad."
      });
    }

    vehicle.entidad = entidad;
    vehicle.placa = placa;
    vehicle.placaNormalizada = placaNormalizada;
    vehicle.modelo = modelo;
    vehicle.holograma = holograma;

    await vehicle.save();

    return res.json({
      success: true,
      message: "Vehículo actualizado correctamente.",
      vehicle
    });
  } catch (error) {
    console.error("Error actualizando vehículo:", error);
    return res.status(500).json({
      success: false,
      message: "Error del servidor al actualizar el vehículo."
    });
  }
});

/* =========================
   ELIMINAR VEHÍCULO
========================= */

app.delete("/api/vehicles/:id", async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehículo no encontrado."
      });
    }

    return res.json({
      success: true,
      message: "Vehículo eliminado correctamente."
    });
  } catch (error) {
    console.error("Error eliminando vehículo:", error);
    return res.status(500).json({
      success: false,
      message: "Error del servidor al eliminar el vehículo."
    });
  }
});

/* =========================
   CONSULTAR CIRCULACIÓN
========================= */

app.get("/api/circula/:placa", async (req, res) => {
  try {
    const placaParam = normalizePlate(req.params.placa || "");
    const holograma = (req.query.holograma || "0").toString().trim();
    const estado = normalizeState(req.query.estado || "");

    if (!placaParam) {
      return res.status(400).json({
        error: "Debes proporcionar una matrícula."
      });
    }

    if (!estado) {
      return res.status(400).json({
        error: "Debes seleccionar una entidad válida: CDMX o EDOMEX."
      });
    }

    if (!isValidPlateFormatByState(placaParam, estado)) {
      return res.status(400).json({
        error:
          estado === "CDMX"
            ? "La matrícula no coincide con un formato válido de CDMX."
            : "La matrícula no coincide con un formato válido del Estado de México."
      });
    }

    const placaSinGuiones = placaParam.replace(/-/g, "");
    const placaNormalizada = normalizeRawPlate(placaParam);

    const vehicle =
      await Vehicle.findOne({
        entidad: estado,
        placaNormalizada
      }) ||
      await Vehicle.findOne({
        $and: [
          {
            $or: [
              { placa: placaParam },
              { placa: placaSinGuiones },
              { matricula: placaParam },
              { matricula: placaSinGuiones }
            ]
          },
          {
            $or: [
              { estado: estado },
              { entidad: estado }
            ]
          }
        ]
      });

    if (!vehicle) {
      return res.json({
        found: false,
        placa: placaParam,
        estado,
        mensaje:
          "No encontramos esta matrícula en la base de datos. Inicia sesión o regístrate para registrar tu vehículo."
      });
    }

    const hologramaFinal = vehicle.holograma || holograma;
    const circulation = evaluateCirculation({
      plate: vehicle.placa || placaParam,
      holograma: hologramaFinal
    });

    return res.json({
      found: true,
      placa: vehicle.placa || placaParam,
      estado: vehicle.entidad || vehicle.estado || estado,
      holograma: hologramaFinal,
      circula: circulation.circula,
      mensaje: circulation.mensaje
    });
  } catch (error) {
    console.error("Error en /api/circula:", error);
    return res.status(500).json({
      error: "Ocurrió un error al consultar la circulación."
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});