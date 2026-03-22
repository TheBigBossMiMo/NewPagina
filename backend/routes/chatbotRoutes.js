const express = require('express');
const router = express.Router();
const { handleChatbotMessage } = require('../controllers/chatbotController');

/* =========================
   RUTA PRINCIPAL CHATBOT
========================= */
router.post('/', handleChatbotMessage);

/* =========================
   TEST RÁPIDO (opcional)
   Para verificar que el chatbot vive
========================= */
router.get('/test', (req, res) => {
  res.json({
    ok: true,
    message: 'Chatbot funcionando correctamente 🚀'
  });
});

/* =========================
   FUTURO (ejemplo)
   Aquí puedes crecer después
========================= */

/* Código ejemplo:
router.get('/history', getChatHistory);
router.delete('/history', clearChatHistory);
*/

module.exports = router;
