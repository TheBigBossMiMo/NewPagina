require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const authRoutes = require("./routes/authRoutes");

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

/* =========================
   FUNCIONES AUXILIARES
========================= */

const normalizePlate = (value = "") => {
  return value.toUpperCase().replace(/\s+/g, "").trim();
};

const normalizeState = (value = "") => {
  const clean = value.toUpperCase().trim();

  if (clean === "CDMX") return "CDMX";
  if (clean === "EDOMEX" || clean === "ESTADO DE MEXICO" || clean === "ESTADO DE MÉXICO") {
    return "EDOMEX";
  }

  return "";
};

const isValidPlateFormatByState = (plate, state) => {
  const raw = plate.replace(/-/g, "");

  if (state === "CDMX") {
    return (
      /^[A-Z]{3}-\d{3}$/.test(plate) ||
      /^\d{3}-[A-Z]{3}$/.test(plate) ||
      /^[A-Z]{3}\d{3}$/.test(raw) ||
      /^\d{3}[A-Z]{3}$/.test(raw)
    );
  }

  if (state === "EDOMEX") {
    return (
      /^[A-Z]{2}-\d{2}-[A-Z]{2}$/.test(plate) ||
      /^\d{2}-[A-Z]{2}-\d{2}$/.test(plate) ||
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

const evaluateCirculation = ({ plate, holograma }) => {
  const diaActual = new Date().getDay(); // 0=Dom, 1=Lun ... 6=Sab
  const ultimoDigito = getLastNumericDigit(plate);

  if (ultimoDigito === null || Number.isNaN(ultimoDigito)) {
    return {
      circula: false,
      mensaje: "No fue posible determinar la circulación porque la matrícula no contiene dígitos válidos."
    };
  }

  // Regla simple mejorada:
  // Holograma 00 y 0 pueden circular
  if (holograma === "00" || holograma === "0") {
    return {
      circula: true,
      mensaje: "Hoy puedes circular sin problema."
    };
  }

  let circula = true;
  let colorRestringido = "";

  if (diaActual === 1 && (ultimoDigito === 5 || ultimoDigito === 6)) {
    circula = false;
    colorRestringido = "Amarillo";
  }

  if (diaActual === 2 && (ultimoDigito === 7 || ultimoDigito === 8)) {
    circula = false;
    colorRestringido = "Rosa";
  }

  if (diaActual === 3 && (ultimoDigito === 3 || ultimoDigito === 4)) {
    circula = false;
    colorRestringido = "Rojo";
  }

  if (diaActual === 4 && (ultimoDigito === 1 || ultimoDigito === 2)) {
    circula = false;
    colorRestringido = "Verde";
  }

  if (diaActual === 5 && (ultimoDigito === 9 || ultimoDigito === 0)) {
    circula = false;
    colorRestringido = "Azul";
  }

  return {
    circula,
    mensaje: circula
      ? "Hoy puedes circular sin problema."
      : `Hoy NO circulas. Engomado ${colorRestringido}.`
  };
};

/* =========================
   RUTA CORREGIDA
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

    const vehiclesCollection = mongoose.connection.collection("vehicles");

    const vehicle = await vehiclesCollection.findOne({
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
      plate: placaParam,
      holograma: hologramaFinal
    });

    return res.json({
      found: true,
      placa: placaParam,
      estado,
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