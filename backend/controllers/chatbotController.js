const { getChatbotReply } = require('../services/chatbotService');

const handleChatbotMessage = async (req, res) => {
  try {
    let { message, email, fullName } = req.body;

    // =========================
    // VALIDACIONES
    // =========================
    if (!message || !String(message).trim()) {
      return res.status(400).json({
        ok: false,
        reply: 'Necesito que me escribas un mensaje.'
      });
    }

    // =========================
    // NORMALIZACIÓN
    // =========================
    message = String(message).trim();

    /* Código ejemplo:
    // Antes:
    // email: email || ''
    // fullName: fullName || ''
    */

    email = email ? String(email).trim().toLowerCase() : '';
    fullName = fullName ? String(fullName).trim() : '';

    // =========================
    // DEBUG (opcional pero útil)
    // =========================
    console.log('📩 Chatbot request:', {
      message,
      email,
      fullName
    });

    // =========================
    // LLAMADA AL SERVICE
    // =========================
    const result = await getChatbotReply({
      message,
      email,
      fullName
    });

    // =========================
    // RESPUESTA
    // =========================
    return res.json({
      ok: true,
      reply: result.reply || 'Sin respuesta.',
      options: result.options || []
    });

  } catch (error) {
    console.error('❌ Error en chatbotController:', error);

    return res.status(500).json({
      ok: false,
      reply: 'Ocurrió un error al procesar tu mensaje.'
    });
  }
};

module.exports = {
  handleChatbotMessage
};