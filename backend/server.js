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

app.get("/api/circula/:placa", (req, res) => {
  const { placa } = req.params;
  const ultimoDigito = parseInt(placa.slice(-1));

  if (isNaN(ultimoDigito)) {
    return res.status(400).json({ error: "Formato de placa inválido" });
  }

  const diaActual = new Date().getDay();
  let circula = true;
  let colorRestringido = "";
/*hol*/

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

  res.json({
    placa,
    circula,
    mensaje: circula
      ? "Hoy puedes circular sin problema."
      : `Hoy NO circulas. Engomado ${colorRestringido}.`
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
