require("dotenv").config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require("./routes/authRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB conectado");
    })
    .catch((err) => {
        console.error("Error MongoDB:", err);
    });

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'API funcionando.' });
});

// HU-16 / Lógica base: Endpoint para evaluar si una placa circula
app.get('/api/circula/:placa', (req, res) => {
    const { placa } = req.params;
    const ultimoDigito = parseInt(placa.slice(-1));

    if (isNaN(ultimoDigito)) {
        return res.status(400).json({ error: 'Formato de placa inválido' });
    }

    // Lógica básica (Mock de días para ejemplo)
    const diaActual = new Date().getDay(); // 0=Dom, 1=Lun, ..., 6=Sab
    let circula = true;
    let colorRestringido = '';

    // Reglas simplificadas (Lun=5,6 - Mar=7,8 - Mie=3,4 - Jue=1,2 - Vie=9,0)
    if (diaActual === 1 && (ultimoDigito === 5 || ultimoDigito === 6)) { circula = false; colorRestringido = 'Amarillo'; }
    if (diaActual === 2 && (ultimoDigito === 7 || ultimoDigito === 8)) { circula = false; colorRestringido = 'Rosa'; }
    if (diaActual === 3 && (ultimoDigito === 3 || ultimoDigito === 4)) { circula = false; colorRestringido = 'Rojo'; }
    if (diaActual === 4 && (ultimoDigito === 1 || ultimoDigito === 2)) { circula = false; colorRestringido = 'Verde'; }
    if (diaActual === 5 && (ultimoDigito === 9 || ultimoDigito === 0)) { circula = false; colorRestringido = 'Azul'; }

    res.json({
        placa,
        circula,
        mensaje: circula ? 'Hoy puedes circular sin problema.' : `Hoy NO circulas. Engomado ${colorRestringido}.`
    });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});