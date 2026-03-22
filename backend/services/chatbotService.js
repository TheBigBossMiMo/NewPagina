const Vehicle = require('../models/Vehicle');
const OpenAI = require('openai');

console.log('HF_TOKEN cargado:', !!process.env.HF_TOKEN);
console.log('HF_MODEL cargado:', process.env.HF_MODEL);

const client = new OpenAI({
  baseURL: 'https://router.huggingface.co/v1',
  apiKey: process.env.HF_TOKEN
});

/* =========================
   CONTEXTO DEL SISTEMA
========================= */

const systemKnowledge = `
Información del sistema Hoy No Circula:

El chatbot puede ayudar con:
- Hoy No Circula
- doble hoy no circula
- contingencia ambiental
- verificación vehicular
- costo de verificación
- calendario de verificación
- hologramas
- placas
- vehículos registrados del usuario
- resumen del último vehículo
- dudas generales del sistema

Reglas:
- Responde siempre en español.
- Responde de forma natural, clara, útil y amable.
- Habla como un asistente humano, no como documentación técnica.
- No inventes datos oficiales.
- Si no hay información actualizada, dilo claramente.
- Si el usuario pregunta por sus vehículos, usa el contexto disponible.
- Si el usuario no ha iniciado sesión o no tiene vehículos, dilo con claridad.
- No uses markdown.
- No uses negritas con **.
- No uses listas numeradas tipo 1. 2. 3.
- No uses encabezados tipo #.
- No uses formato raro ni decorativo.
- Da respuestas limpias, naturales y fáciles de leer.
- Si el usuario saluda, responde de forma cálida y breve.
- Si el usuario pregunta "qué más tienes", explica tus funciones en texto natural, sin listas con formato markdown.
- Si pregunta por contingencia o doble hoy no circula, responde solo de forma general si no tienes datos oficiales en tiempo real.
- Si pregunta por costos o calendarios oficiales y no hay una fuente actualizada disponible en el sistema, aclara que debe verificarse con fuentes oficiales.
- No responder cualquier cosa, como de cocina, peliculas, excepto de coches o de la pagina.
`;


/* =========================
   CONTEXTO DEL USUARIO
========================= */

const getUserVehiclesContext = async (email) => {
  if (!email) return 'El usuario no ha iniciado sesión.';

  const vehicles = await Vehicle.find({ ownerEmail: email }).sort({ createdAt: -1 });

  if (!vehicles.length) return 'El usuario no tiene vehículos registrados.';

  return vehicles
    .map(
      (v, i) => `
Vehículo ${i + 1}:
Placa: ${v.placa || 'No especificada'}
Entidad: ${v.entidad || 'No especificada'}
Modelo: ${v.modelo || 'No especificado'}
Holograma: ${v.holograma || 'No especificado'}
Marca: ${v.marca || 'No especificada'}
Submodelo: ${v.submodelo || 'No especificado'}
Color: ${v.color || 'No especificado'}
`
    )
    .join('\n');
};

/* =========================
   LIMPIEZA DE RESPUESTA
========================= */

const cleanReply = (text = '') => {
  return String(text)
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#{1,6}\s*/g, '')
    .replace(/^\s*[-•]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/`{1,3}/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

/* =========================
   RESPUESTA IA
========================= */

const getChatbotReply = async ({ message, email, fullName }) => {
  try {
    const vehiclesContext = await getUserVehiclesContext(email);

    const safeName =
      fullName && String(fullName).trim() ? String(fullName).trim() : 'Usuario';

    const systemPrompt = `
Eres un asistente inteligente del sistema "Hoy No Circula".

Personalidad:
- Conversacional
- Natural
- Amigable
- Clara
- No robótica

${systemKnowledge}

Contexto del usuario:
Nombre: ${safeName}
${vehiclesContext}
`;

    const userPrompt = `
Mensaje del usuario:
${message}

Instrucciones para responder:
- Responde en español.
- Responde como chat real.
- No uses markdown.
- No pongas negritas ni listas con 1., 2., 3.
- Si puedes responder con base en los vehículos del usuario, hazlo.
- Si la pregunta trata sobre reglas oficiales actuales, contingencia o costos exactos y no tienes confirmación oficial actualizada, acláralo sin inventar.
- Mantén la respuesta útil, limpia y natural.
`;

    const completion = await client.chat.completions.create({
      model: process.env.HF_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 350
    });

    const rawReply =
      completion?.choices?.[0]?.message?.content ||
      'No pude generar una respuesta en este momento.';

    return {
      reply: cleanReply(rawReply)
    };
  } catch (error) {
    console.error(
      'Error IA completo:',
      error?.response?.data || error?.message || error
    );

    return {
      reply: 'Ocurrió un error al procesar tu consulta con IA.'
    };
  }
};

module.exports = {
  getChatbotReply
};