const express = require('express');
const router = express.Router();
const { handleChatbotMessage } = require('../controllers/chatbotController');
const ChatSession = require('../models/ChatSession');

/* =========================
   AUXILIAR
========================= */
const normalizeEmail = (email = '') => String(email).trim().toLowerCase();

/* =========================
   RUTA PRINCIPAL CHATBOT
========================= */
router.post('/', handleChatbotMessage);

/* =========================
   TEST RÁPIDO (opcional)
========================= */
router.get('/test', (req, res) => {
  res.json({
    ok: true,
    message: 'Chatbot funcionando correctamente 🚀'
  });
});

/* =========================
   HISTORIAL DEL USUARIO
   (MongoDB real)
========================= */
router.get('/history/:email', async (req, res) => {
  try {
    const email = normalizeEmail(req.params.email);

    if (!email) {
      return res.status(400).json({
        ok: false,
        message: 'Email requerido'
      });
    }

    const session = await ChatSession.findOne({ email });

    if (!session) {
      return res.json({
        ok: true,
        history: [],
        activeTopic: null,
        activeVehicleIndex: null
      });
    }

    return res.json({
      ok: true,
      history: session.history || [],
      activeTopic: session.activeTopic || null,
      activeVehicleIndex:
        typeof session.activeVehicleIndex === 'number'
          ? session.activeVehicleIndex
          : null
    });
  } catch (error) {
    console.error('Error obteniendo historial:', error);

    return res.status(500).json({
      ok: false,
      message: 'Error obteniendo historial'
    });
  }
});

/* =========================
   GUARDAR / ACTUALIZAR HISTORIAL
   (opcional, útil para frontend futuro)
========================= */
router.post('/history', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const history = Array.isArray(req.body.history) ? req.body.history : [];
    const activeTopic = req.body.activeTopic || null;
    const activeVehicleIndex =
      typeof req.body.activeVehicleIndex === 'number'
        ? req.body.activeVehicleIndex
        : null;

    if (!email) {
      return res.status(400).json({
        ok: false,
        message: 'Email requerido'
      });
    }

    const normalizedHistory = history
      .map((item) => {
        const role =
          item?.role ||
          (item?.sender === 'bot' ? 'assistant' : item?.sender === 'user' ? 'user' : null);

        const content = item?.content || item?.text || '';

        if (!role || !content) return null;

        return {
          role,
          content: String(content).trim()
        };
      })
      .filter(Boolean);

    const session = await ChatSession.findOneAndUpdate(
      { email },
      {
        $set: {
          email,
          history: normalizedHistory,
          activeTopic,
          activeVehicleIndex
        }
      },
      {
        new: true,
        upsert: true
      }
    );

    return res.json({
      ok: true,
      message: 'Historial guardado correctamente',
      history: session.history || []
    });
  } catch (error) {
    console.error('Error guardando historial:', error);

    return res.status(500).json({
      ok: false,
      message: 'Error guardando historial'
    });
  }
});

/* =========================
   LIMPIAR HISTORIAL
   (opcional pero PRO)
========================= */
router.delete('/history/:email', async (req, res) => {
  try {
    const email = normalizeEmail(req.params.email);

    if (!email) {
      return res.status(400).json({
        ok: false,
        message: 'Email requerido'
      });
    }

    await ChatSession.findOneAndUpdate(
      { email },
      {
        history: [],
        activeTopic: null,
        activeVehicleIndex: null,
        lastVehicleField: null,
        lastIntent: null,
        lastOptionsContext: null
      },
      { new: true }
    );

    return res.json({
      ok: true,
      message: 'Historial limpiado correctamente'
    });
  } catch (error) {
    console.error('Error limpiando historial:', error);

    return res.status(500).json({
      ok: false,
      message: 'Error limpiando historial'
    });
  }
});

/* =========================
   FUTURO (escala)
========================= */
/*
router.get('/analytics', getAnalytics);
router.get('/alerts', getUserAlerts);
*/


module.exports = router;



module.exports = router;
