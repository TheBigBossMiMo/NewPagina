require('dotenv').config();
const Vehicle = require('../models/Vehicle');
const OpenAI = require('openai');
const {
  getSession,
  addToHistory,
  updateSession
} = require('./chatbotMemoryService');

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
Asistente del sistema Hoy No Circula.

Ayudas con:
- verificación vehicular
- contingencia ambiental
- doble hoy no circula
- calendario
- costos
- hologramas
- placas
- circulación
- vehículos registrados del usuario
- datos del vehículo
- navegación y uso de la página
- registro e inicio de sesión
- perfil del usuario
- sección de información del sistema
- dudas del sistema

Reglas:
- Responder siempre en español.
- Ser claro, natural y útil.
- No inventar datos oficiales.
- No salir del tema del sistema.
- Si el usuario pregunta algo fuera del sistema, redirigir con amabilidad.
- Si no hay información suficiente, decirlo claramente.
- No usar markdown.
- No usar encabezados.
- No responder como asistente general.
`;

/* =========================
   UTILIDADES
========================= */

const normalizeText = (value = '') =>
  String(value)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

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

const buildOptions = (items = []) =>
  items
    .filter(Boolean)
    .map((item) =>
      typeof item === 'string'
        ? { label: item, value: item }
        : item
    );

const buildVehicleLabel = (index) => `vehículo ${index + 1}`;

const formatVehicleSummary = (vehicle, index) => {
  if (!vehicle) return '';

  return [
    `Vehículo ${index + 1}:`,
    `Placa: ${vehicle.placa || 'No especificada'}`,
    `Entidad: ${vehicle.entidad || 'No especificada'}`,
    `Modelo: ${vehicle.modelo || 'No especificado'}`,
    `Holograma: ${vehicle.holograma || 'No especificado'}`,
    `Marca: ${vehicle.marca || 'No especificada'}`,
    `Submodelo: ${vehicle.submodelo || 'No especificado'}`,
    `Color: ${vehicle.color || 'No especificado'}`
  ].join('\n');
};

const getVehiclesContextText = (vehicles = []) => {
  if (!vehicles.length) return 'El usuario no tiene vehículos registrados.';
  return vehicles.map((v, i) => formatVehicleSummary(v, i)).join('\n\n');
};

const safeFieldLabel = (field) => {
  const labels = {
    color: 'color',
    marca: 'marca',
    placa: 'placa',
    holograma: 'holograma',
    modelo: 'modelo',
    submodelo: 'submodelo',
    entidad: 'entidad'
  };

  return labels[field] || field;
};

/* =========================
   DOMINIO
========================= */

const DOMAIN_KEYWORDS = [
  'hoy no circula',
  'doble hoy no circula',
  'doble no circula',
  'contingencia',
  'verificacion',
  'calendario',
  'costo',
  'costos',
  'holograma',
  'placa',
  'placas',
  'vehiculo',
  'vehiculos',
  'auto',
  'autos',
  'circula',
  'circulacion',
  'verificentro',
  'verificacion vehicular',
  'mi vehiculo',
  'mis vehiculos',
  'registrar',
  'registro',
  'registrarme',
  'iniciar sesion',
  'cerrar sesion',
  'correo',
  'perfil',
  'informacion',
  'pagina',
  'apartado',
  'modulo',
  'login',
  'sesion',
  'estado',
  'restricciones'
];

const isInDomain = (msg) => {
  const m = normalizeText(msg);
  return DOMAIN_KEYWORDS.some((k) => m.includes(normalizeText(k)));
};

/* =========================
   INTENCIONES
========================= */

const detectIntent = (msg = '') => {
  const m = normalizeText(msg);

  if (m === 'mi vehiculo') {
    return { type: 'vehicle_current' };
  }

  if (m === 'costos' || m === 'costo general') {
    return { type: 'cost_general' };
  }

  if (m.includes('costo de mi vehiculo') || m.includes('costo para mi vehiculo')) {
    return { type: 'cost_vehicle' };
  }

  if (m === 'calendario' || m === 'calendario general') {
    return { type: 'calendar_general' };
  }

  if (m.includes('calendario de mi vehiculo') || m.includes('quiero ver el calendario de mi vehiculo')) {
    return { type: 'calendar_vehicle' };
  }

  if (m === 'estado' || m.includes('estado de contingencia')) {
    return { type: 'contingency_status' };
  }

  if (m === 'restricciones' || m.includes('restricciones por contingencia')) {
    return { type: 'contingency_restrictions' };
  }

  if (m.includes('doble hoy no circula') || m.includes('doble no circula')) {
    return { type: 'topic', topic: 'doble_hoy_no_circula' };
  }

  if (m.includes('primer vehiculo') || m.includes('primero')) {
    return { type: 'vehicle_select', index: 0 };
  }

  if (m.includes('segundo vehiculo') || m.includes('segundo')) {
    return { type: 'vehicle_select', index: 1 };
  }

  if (m.includes('tercer vehiculo') || m.includes('tercero')) {
    return { type: 'vehicle_select', index: 2 };
  }

  if (
    m.includes('mis vehiculos') ||
    m.includes('que vehiculos tengo') ||
    m.includes('que autos tengo') ||
    m.includes('vehiculos registrados') ||
    m.includes('mis autos')
  ) {
    return { type: 'vehicles_list' };
  }

  if (
    m.includes('mi vehiculo') ||
    m.includes('mi auto') ||
    m.includes('ultimo vehiculo') ||
    m.includes('ultimo auto')
  ) {
    return { type: 'vehicle_current' };
  }

  if (m.includes('color')) return { type: 'vehicle_field', field: 'color' };
  if (m.includes('marca')) return { type: 'vehicle_field', field: 'marca' };
  if (m.includes('placa')) return { type: 'vehicle_field', field: 'placa' };
  if (m.includes('holograma')) return { type: 'vehicle_field', field: 'holograma' };
  if (m.includes('modelo')) return { type: 'vehicle_field', field: 'modelo' };
  if (m.includes('submodelo')) return { type: 'vehicle_field', field: 'submodelo' };
  if (m.includes('entidad') || m.includes('estado')) return { type: 'vehicle_field', field: 'entidad' };

  if (m.includes('costo') || m.includes('costos') || m.includes('cuanto cuesta')) {
    return { type: 'topic', topic: 'costos' };
  }

  if (m.includes('calendario')) {
    return { type: 'topic', topic: 'calendario' };
  }

  if (m.includes('contingencia')) {
    return { type: 'topic', topic: 'contingencia' };
  }

  if (m.includes('verificacion') || m.includes('verificar')) {
    return { type: 'topic', topic: 'verificacion' };
  }

  if (
    m.includes('registrarme') ||
    m.includes('registrar cuenta') ||
    m.includes('nuevo correo') ||
    m.includes('otro correo') ||
    m.includes('iniciar sesion con otro correo') ||
    m.includes('iniciar sesion con diferente correo') ||
    m.includes('crear cuenta')
  ) {
    return { type: 'page_guide', topic: 'registro' };
  }

  if (
    m.includes('donde veo mas informacion') ||
    m.includes('donde puedo ver mas') ||
    m.includes('donde visualizar mas') ||
    m.includes('apartado de informacion') ||
    m.includes('seccion de informacion') ||
    m.includes('informacion de la pagina')
  ) {
    return { type: 'page_guide', topic: 'informacion' };
  }

  if (
    m.includes('como registrar un vehiculo') ||
    m.includes('como registro un vehiculo') ||
    m.includes('registrar vehiculo') ||
    m.includes('agregar vehiculo') ||
    m.includes('anadir vehiculo') ||
    m.includes('añadir vehiculo')
  ) {
    return { type: 'page_guide', topic: 'registrar_vehiculo' };
  }

  if (
    m.includes('donde veo mis vehiculos') ||
    m.includes('donde estan mis vehiculos') ||
    m.includes('mis vehiculos del lado izquierdo') ||
    m.includes('como ver mis vehiculos')
  ) {
    return { type: 'page_guide', topic: 'mis_vehiculos' };
  }

  if (
    m.includes('perfil') ||
    m.includes('mi perfil') ||
    m.includes('donde esta mi perfil') ||
    m.includes('como entro a mi perfil')
  ) {
    return { type: 'page_guide', topic: 'perfil' };
  }

  if (
    m.includes('donde esta verificacion') ||
    m.includes('en que apartado esta verificacion') ||
    m.includes('donde esta contingencia') ||
    m.includes('en que apartado esta contingencia') ||
    m.includes('donde esta hoy no circula')
  ) {
    return { type: 'page_guide', topic: 'modulos' };
  }

  if (
    m.includes('ayuda') ||
    m.includes('opciones') ||
    m.includes('que puedes hacer') ||
    m.includes('que mas tienes')
  ) {
    return { type: 'help' };
  }

  return { type: 'general' };
};

/* =========================
   VEHÍCULOS
========================= */

const getVehicles = async (email) => {
  if (!email) return [];
  return Vehicle.find({ ownerEmail: String(email).trim().toLowerCase() }).sort({ createdAt: -1 });
};

const getVehicleBySessionIndex = (vehicles = [], index = 0) => {
  if (!vehicles.length) return null;
  if (typeof index !== 'number' || index < 0) return vehicles[0];
  return vehicles[index] || null;
};

/* =========================
   RESPUESTAS RÁPIDAS
========================= */

const getHelpResponse = () => ({
  reply:
    'Puedo ayudarte con verificación, contingencia, doble Hoy No Circula, calendario, costos, vehículos registrados y también con cómo usar la página, como registro, perfil, información y apartados del sistema. Dime qué deseas consultar.',
  options: buildOptions([
    { label: 'Mis vehículos', value: '¿Qué vehículos tengo registrados?' },
    { label: 'Verificación', value: 'Verificación' },
    { label: 'Contingencia', value: 'Contingencia' },
    { label: 'Doble hoy no circula', value: 'Doble hoy no circula' }
  ])
});

const getOutOfDomainResponse = (message = '') => {
  const m = normalizeText(message);

  let intro = 'No puedo ayudarte con ese tema directamente.';

  if (m.includes('novia') || m.includes('novio') || m.includes('termine') || m.includes('terminamos')) {
    intro = 'Lamento escuchar esa situación, pero no puedo ayudarte con ese tema directamente.';
  } else if (
    m.includes('llanta') ||
    m.includes('poncho') ||
    m.includes('ponchada') ||
    m.includes('bateria') ||
    m.includes('no prende') ||
    m.includes('no enciende') ||
    m.includes('coche') ||
    m.includes('carro')
  ) {
    intro = 'Lamento lo que pasó con tu vehículo, pero no puedo ayudarte con ese tipo de problema directamente.';
  } else if (
    m.includes('receta') ||
    m.includes('cocina') ||
    m.includes('comida') ||
    m.includes('tarea') ||
    m.includes('pelicula') ||
    m.includes('peliculas')
  ) {
    intro = 'No puedo ayudarte con ese tema directamente.';
  }

  return {
    reply:
      `${intro} Sí puedo apoyarte con verificación, contingencia, doble Hoy No Circula, calendario, costos, vehículos registrados y con el uso de la página.`,
    options: buildOptions([
      { label: 'Verificación', value: 'Verificación' },
      { label: 'Contingencia', value: 'Contingencia' },
      { label: 'Doble hoy no circula', value: 'Doble hoy no circula' },
      { label: 'Mis vehículos', value: '¿Qué vehículos tengo registrados?' }
    ])
  };
};

const getTopicResponse = (topic) => {
  if (topic === 'verificacion') {
    return {
      reply:
        'Seguimos con tu verificación. Puedo ayudarte con costos, calendario o con tu vehículo registrado. ¿Qué deseas ver?',
      options: buildOptions([
        { label: 'Costos', value: 'Costos' },
        { label: 'Calendario', value: 'Calendario' },
        { label: 'Mi vehículo', value: 'Mi vehículo' }
      ])
    };
  }

  if (topic === 'contingencia') {
    return {
      reply:
        'Seguimos con contingencia. Puedo ayudarte con el estado general, restricciones o cómo afecta a tu vehículo. ¿Qué deseas consultar?',
      options: buildOptions([
        { label: 'Estado', value: 'Estado' },
        { label: 'Restricciones', value: 'Restricciones' },
        { label: 'Mi vehículo', value: 'Mi vehículo' }
      ])
    };
  }

  if (topic === 'doble_hoy_no_circula') {
    return {
      reply:
        'Puedo orientarte sobre doble Hoy No Circula de forma general dentro del sistema. También puedo ayudarte a revisar cómo podría afectar a tu vehículo. ¿Qué deseas consultar?',
      options: buildOptions([
        { label: 'General', value: 'Explícame el doble hoy no circula.' },
        { label: 'Mi vehículo', value: 'Mi vehículo' },
        { label: 'Contingencia', value: 'Contingencia' }
      ])
    };
  }

  if (topic === 'calendario') {
    return {
      reply:
        'Puedo orientarte con el calendario de verificación según tu vehículo y el contexto del sistema. ¿Quieres verlo de forma general o aplicado a tu vehículo?',
      options: buildOptions([
        { label: 'Mi vehículo', value: 'Mi vehículo' },
        { label: 'General', value: 'Calendario general' }
      ])
    };
  }

  if (topic === 'costos') {
    return {
      reply:
        'Puedo ayudarte con los costos de verificación dentro del sistema. Si no tengo un valor oficial actualizado, te lo aclararé. ¿Quieres consulta general o sobre tu vehículo?',
      options: buildOptions([
        { label: 'Costo general', value: 'Costo general' },
        { label: 'Mi vehículo', value: 'Mi vehículo' }
      ])
    };
  }

  return getHelpResponse();
};

const getPageGuideResponse = (topic) => {
  if (topic === 'registro') {
    return {
      reply:
        'Si quieres registrarte con otro correo, primero cierra tu sesión actual y luego entra al apartado de acceso o registro para crear una nueva cuenta con el correo diferente.',
      options: buildOptions([
        { label: 'Información', value: '¿Dónde puedo ver más información de la página?' },
        { label: 'Mis vehículos', value: '¿Dónde veo mis vehículos?' }
      ])
    };
  }

  if (topic === 'informacion') {
    return {
      reply:
        'Si quieres ver más detalles del sistema, puedes entrar al apartado de Información. Ahí puedes visualizar mejor el contenido general de la página y conocer más sobre sus funciones.',
      options: buildOptions([
        { label: 'Verificación', value: 'Verificación' },
        { label: 'Contingencia', value: 'Contingencia' }
      ])
    };
  }

  if (topic === 'registrar_vehiculo') {
    return {
      reply:
        'Para registrar un vehículo, entra a tu perfil y ubica la sección de Mis vehículos. Desde ahí podrás agregar o registrar un vehículo dentro de tu cuenta.',
      options: buildOptions([
        { label: 'Mis vehículos', value: '¿Dónde veo mis vehículos?' },
        { label: 'Mi vehículo', value: 'Mi vehículo' }
      ])
    };
  }

  if (topic === 'mis_vehiculos') {
    return {
      reply:
        'Tus vehículos los puedes revisar dentro de tu perfil, en la sección Mis vehículos. Ahí podrás verlos y gestionar la información registrada.',
      options: buildOptions([
        { label: 'Registrar vehículo', value: '¿Cómo registro un vehículo?' },
        { label: 'Mi vehículo', value: 'Mi vehículo' }
      ])
    };
  }

  if (topic === 'perfil') {
    return {
      reply:
        'Puedes entrar a tu perfil desde la parte de usuario de la página. Dentro de ese apartado encontrarás información personal y la sección de Mis vehículos.',
      options: buildOptions([
        { label: 'Mis vehículos', value: '¿Dónde veo mis vehículos?' },
        { label: 'Registrar vehículo', value: '¿Cómo registro un vehículo?' }
      ])
    };
  }

  if (topic === 'modulos') {
    return {
      reply:
        'Dentro de la página puedes ubicar los apartados principales como verificación, contingencia, información y perfil. Desde esos módulos puedes consultar lo relacionado con tu vehículo y con el sistema.',
      options: buildOptions([
        { label: 'Verificación', value: 'Verificación' },
        { label: 'Contingencia', value: 'Contingencia' },
        { label: 'Información', value: '¿Dónde puedo ver más información de la página?' }
      ])
    };
  }

  return getHelpResponse();
};

/* =========================
   IA
========================= */

const askAI = async (systemPrompt, userPrompt) => {
  const res = await client.chat.completions.create({
    model: process.env.HF_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.5,
    max_tokens: 300
  });

  return res?.choices?.[0]?.message?.content || '';
};

/* =========================
   MAIN
========================= */

const getChatbotReply = async ({ message, email, fullName }) => {
  try {
    const cleanMessage = String(message || '').trim();
    const safeName = String(fullName || '').trim() || 'Usuario';

    const session = await getSession(email);
    const intent = detectIntent(cleanMessage);
    const vehicles = await getVehicles(email);

    if (session) {
      await addToHistory(session, 'user', cleanMessage);
      await updateSession(session, {
        lastIntent: intent.type
      });
    }

    /* FUERA DE DOMINIO */
    if (!isInDomain(cleanMessage) && intent.type !== 'help' && intent.type !== 'page_guide') {
      const outOfDomain = getOutOfDomainResponse(cleanMessage);

      if (session) {
        await addToHistory(session, 'assistant', outOfDomain.reply);
        await updateSession(session, {
          lastOptionsContext: 'out_of_domain'
        });
      }

      return outOfDomain;
    }

    /* AYUDA */
    if (intent.type === 'help') {
      const helpResponse = getHelpResponse();

      if (session) {
        await addToHistory(session, 'assistant', helpResponse.reply);
        await updateSession(session, {
          lastOptionsContext: 'help'
        });
      }

      return helpResponse;
    }

    /* GUÍA DE LA PÁGINA */
    if (intent.type === 'page_guide') {
      const pageGuideResponse = getPageGuideResponse(intent.topic);

      if (session) {
        await addToHistory(session, 'assistant', pageGuideResponse.reply);
        await updateSession(session, {
          activeTopic: 'pagina',
          lastOptionsContext: intent.topic
        });
      }

      return pageGuideResponse;
    }

    /* COSTO GENERAL */
    if (intent.type === 'cost_general') {
      const reply =
        'El costo de verificación puede variar según la entidad y las disposiciones vigentes. Dentro del sistema puedo orientarte de forma general, pero para el monto exacto conviene validarlo en una fuente oficial o verificentro autorizado.';

      if (session) {
        await addToHistory(session, 'assistant', reply);
        await updateSession(session, {
          activeTopic: 'costos',
          lastOptionsContext: 'cost_general'
        });
      }

      return { reply };
    }

    /* COSTO POR VEHÍCULO */
    if (intent.type === 'cost_vehicle') {
      if (!vehicles.length) {
        const reply = 'No encontré vehículos registrados en tu cuenta.';
        if (session) await addToHistory(session, 'assistant', reply);
        return { reply };
      }

      const index =
        typeof session?.activeVehicleIndex === 'number'
          ? session.activeVehicleIndex
          : 0;

      const vehicle = getVehicleBySessionIndex(vehicles, index);

      const reply = vehicle
        ? `Puedo orientarte con el costo de verificación para tu ${buildVehicleLabel(index)}.\nPlaca: ${vehicle.placa || 'No especificada'}\nEntidad: ${vehicle.entidad || 'No especificada'}\nHolograma: ${vehicle.holograma || 'No especificado'}\n\nEl monto exacto puede variar, así que conviene confirmarlo en una fuente oficial o verificentro autorizado.`
        : 'No pude obtener la información de tu vehículo.';

      if (session) {
        await addToHistory(session, 'assistant', reply);
        await updateSession(session, {
          activeTopic: 'costos',
          activeVehicleIndex: index,
          lastOptionsContext: 'cost_vehicle'
        });
      }

      return { reply };
    }

    /* CALENDARIO GENERAL */
    if (intent.type === 'calendar_general') {
      const reply =
        'El calendario de verificación se consulta de forma general según terminación de placa, engomado, entidad y periodo vigente. Si quieres, también puedo orientarte aplicado a tu vehículo registrado.';

      if (session) {
        await addToHistory(session, 'assistant', reply);
        await updateSession(session, {
          activeTopic: 'calendario',
          lastOptionsContext: 'calendar_general'
        });
      }

      return {
        reply,
        options: buildOptions([
          { label: 'Mi vehículo', value: 'Mi vehículo' },
          { label: 'Verificación', value: 'Verificación' }
        ])
      };
    }

    /* CALENDARIO POR VEHÍCULO */
    if (intent.type === 'calendar_vehicle') {
      if (!vehicles.length) {
        const reply = 'No encontré vehículos registrados en tu cuenta.';
        if (session) await addToHistory(session, 'assistant', reply);
        return { reply };
      }

      const index =
        typeof session?.activeVehicleIndex === 'number'
          ? session.activeVehicleIndex
          : 0;

      const vehicle = getVehicleBySessionIndex(vehicles, index);

      const reply = vehicle
        ? `Puedo orientarte con el calendario de verificación para tu ${buildVehicleLabel(index)}.\nPlaca: ${vehicle.placa || 'No especificada'}\nEntidad: ${vehicle.entidad || 'No especificada'}\nHolograma: ${vehicle.holograma || 'No especificado'}\n\nLa consulta debe tomarse con base en la terminación de placa, la entidad y el periodo correspondiente dentro del módulo de verificación.`
        : 'No pude obtener la información de tu vehículo.';

      if (session) {
        await addToHistory(session, 'assistant', reply);
        await updateSession(session, {
          activeTopic: 'calendario',
          activeVehicleIndex: index,
          lastOptionsContext: 'calendar_vehicle'
        });
      }

      return { reply };
    }

    /* ESTADO DE CONTINGENCIA */
    if (intent.type === 'contingency_status') {
      const reply =
        'Puedo orientarte con el estado general de contingencia dentro del sistema. Si no hay un dato oficial actualizado disponible, te lo indicaré claramente y te recomendaré validarlo en la fuente correspondiente.';

      if (session) {
        await addToHistory(session, 'assistant', reply);
        await updateSession(session, {
          activeTopic: 'contingencia',
          lastOptionsContext: 'contingency_status'
        });
      }

      return { reply };
    }

    /* RESTRICCIONES DE CONTINGENCIA */
    if (intent.type === 'contingency_restrictions') {
      const reply =
        'Las restricciones por contingencia pueden cambiar según la fase activa y las disposiciones vigentes. Dentro del sistema puedo orientarte de forma general y ayudarte a revisar cómo podría afectar a tu vehículo.';

      if (session) {
        await addToHistory(session, 'assistant', reply);
        await updateSession(session, {
          activeTopic: 'contingencia',
          lastOptionsContext: 'contingency_restrictions'
        });
      }

      return {
        reply,
        options: buildOptions([
          { label: 'Mi vehículo', value: 'Mi vehículo' },
          { label: 'Doble hoy no circula', value: 'Doble hoy no circula' }
        ])
      };
    }

    /* LISTA DE VEHÍCULOS */
    if (intent.type === 'vehicles_list') {
      if (!email) {
        const reply =
          'Para revisar tus vehículos necesito que inicies sesión. Después podré mostrarte los que tienes registrados.';
        if (session) await addToHistory(session, 'assistant', reply);
        return { reply };
      }

      if (!vehicles.length) {
        const reply = 'No encontré vehículos registrados en tu cuenta.';
        if (session) await addToHistory(session, 'assistant', reply);
        return { reply };
      }

      const reply = vehicles
        .map((vehicle, index) => formatVehicleSummary(vehicle, index))
        .join('\n\n');

      if (session) {
        await addToHistory(session, 'assistant', reply);
        await updateSession(session, {
          activeTopic: 'vehiculos',
          activeVehicleIndex: 0,
          lastOptionsContext: 'vehicles_list'
        });
      }

      return {
        reply,
        options: buildOptions([
          { label: 'Vehículo 1', value: 'Quiero consultar el primero.' },
          vehicles[1] ? { label: 'Vehículo 2', value: 'Quiero consultar el segundo.' } : null,
          vehicles[2] ? { label: 'Vehículo 3', value: 'Quiero consultar el tercero.' } : null,
          { label: 'Mi verificación', value: 'Verificación' }
        ])
      };
    }

    /* VEHÍCULO ACTUAL */
    if (intent.type === 'vehicle_current') {
      if (!vehicles.length) {
        const reply = 'No encontré vehículos registrados en tu cuenta.';
        if (session) await addToHistory(session, 'assistant', reply);
        return { reply };
      }

      const index =
        typeof session?.activeVehicleIndex === 'number'
          ? session.activeVehicleIndex
          : 0;

      const vehicle = getVehicleBySessionIndex(vehicles, index);

      if (!vehicle) {
        const reply = 'No encontré ese vehículo.';
        if (session) await addToHistory(session, 'assistant', reply);
        return { reply };
      }

      const activeTopic = session?.activeTopic || null;

      if (activeTopic === 'costos') {
        const reply =
          `Puedo orientarte con los costos de verificación para tu ${buildVehicleLabel(index)}.` +
          `\nPlaca: ${vehicle.placa || 'No especificada'}` +
          `\nEntidad: ${vehicle.entidad || 'No especificada'}` +
          `\nHolograma: ${vehicle.holograma || 'No especificado'}` +
          `\n\nSi el sistema no tiene un valor oficial actualizado, debo indicártelo como referencia general y recomendarte validarlo en una fuente oficial.`;

        if (session) {
          await addToHistory(session, 'assistant', reply);
          await updateSession(session, {
            activeTopic: 'costos',
            activeVehicleIndex: index,
            lastOptionsContext: 'vehicle_current_costos'
          });
        }

        return {
          reply,
          options: buildOptions([
            { label: 'Costo general', value: 'Costo general' },
            { label: 'Calendario', value: 'Calendario' },
            { label: 'Verificación', value: 'Verificación' }
          ])
        };
      }

      if (activeTopic === 'calendario') {
        const reply =
          `Puedo orientarte con el calendario de verificación para tu ${buildVehicleLabel(index)}.` +
          `\nPlaca: ${vehicle.placa || 'No especificada'}` +
          `\nEntidad: ${vehicle.entidad || 'No especificada'}` +
          `\nHolograma: ${vehicle.holograma || 'No especificado'}` +
          `\n\nLa consulta debe tomarse con base en la terminación de placa, la entidad y el periodo correspondiente dentro del módulo de verificación.`;

        if (session) {
          await addToHistory(session, 'assistant', reply);
          await updateSession(session, {
            activeTopic: 'calendario',
            activeVehicleIndex: index,
            lastOptionsContext: 'vehicle_current_calendario'
          });
        }

        return {
          reply,
          options: buildOptions([
            { label: 'Verificación', value: 'Verificación' },
            { label: 'Costos', value: 'Costos' },
            { label: 'Mis vehículos', value: '¿Qué vehículos tengo registrados?' }
          ])
        };
      }

      if (activeTopic === 'verificacion') {
        const reply =
          `Tomaré como referencia tu ${buildVehicleLabel(index)} para continuar con verificación.` +
          `\nPlaca: ${vehicle.placa || 'No especificada'}` +
          `\nEntidad: ${vehicle.entidad || 'No especificada'}` +
          `\nHolograma: ${vehicle.holograma || 'No especificado'}` +
          `\n\nAhora puedes consultar costos, calendario o más datos de este vehículo.`;

        if (session) {
          await addToHistory(session, 'assistant', reply);
          await updateSession(session, {
            activeTopic: 'verificacion',
            activeVehicleIndex: index,
            lastOptionsContext: 'vehicle_current_verificacion'
          });
        }

        return {
          reply,
          options: buildOptions([
            { label: 'Costos', value: 'Costos' },
            { label: 'Calendario', value: 'Calendario' },
            { label: 'Holograma', value: '¿Qué holograma tiene?' }
          ])
        };
      }

      if (activeTopic === 'contingencia') {
        const reply =
          `Puedo tomar como referencia tu ${buildVehicleLabel(index)} para revisar cómo podría verse afectado por contingencia.` +
          `\nPlaca: ${vehicle.placa || 'No especificada'}` +
          `\nEntidad: ${vehicle.entidad || 'No especificada'}` +
          `\nHolograma: ${vehicle.holograma || 'No especificado'}` +
          `\n\nLas restricciones exactas dependen de la fase y de la información oficial vigente.`;

        if (session) {
          await addToHistory(session, 'assistant', reply);
          await updateSession(session, {
            activeTopic: 'contingencia',
            activeVehicleIndex: index,
            lastOptionsContext: 'vehicle_current_contingencia'
          });
        }

        return {
          reply,
          options: buildOptions([
            { label: 'Estado', value: 'Estado' },
            { label: 'Restricciones', value: 'Restricciones' },
            { label: 'Doble hoy no circula', value: 'Doble hoy no circula' }
          ])
        };
      }

      if (activeTopic === 'doble_hoy_no_circula') {
        const reply =
          `Puedo tomar como referencia tu ${buildVehicleLabel(index)} para revisar cómo podría verse afectado por doble Hoy No Circula.` +
          `\nPlaca: ${vehicle.placa || 'No especificada'}` +
          `\nEntidad: ${vehicle.entidad || 'No especificada'}` +
          `\nHolograma: ${vehicle.holograma || 'No especificado'}` +
          `\n\nLa aplicación depende de las disposiciones oficiales vigentes, así que si no hay confirmación actualizada debo indicártelo claramente.`;

        if (session) {
          await addToHistory(session, 'assistant', reply);
          await updateSession(session, {
            activeTopic: 'doble_hoy_no_circula',
            activeVehicleIndex: index,
            lastOptionsContext: 'vehicle_current_doble_hnc'
          });
        }

        return {
          reply,
          options: buildOptions([
            { label: 'Contingencia', value: 'Contingencia' },
            { label: 'Verificación', value: 'Verificación' }
          ])
        };
      }

      const reply = formatVehicleSummary(vehicle, index);

      if (session) {
        await addToHistory(session, 'assistant', reply);
        await updateSession(session, {
          activeTopic: 'vehiculos',
          activeVehicleIndex: index,
          lastOptionsContext: 'vehicle_current'
        });
      }

      return {
        reply,
        options: buildOptions([
          { label: 'Color', value: '¿Cuál es el color?' },
          { label: 'Marca', value: '¿Cuál es la marca?' },
          { label: 'Holograma', value: '¿Qué holograma tiene?' }
        ])
      };
    }

    /* SELECCIÓN DE VEHÍCULO */
    if (intent.type === 'vehicle_select') {
      if (!vehicles.length) {
        const reply = 'No encontré vehículos registrados en tu cuenta.';
        if (session) await addToHistory(session, 'assistant', reply);
        return { reply };
      }

      const vehicle = getVehicleBySessionIndex(vehicles, intent.index);

      if (!vehicle) {
        const reply = `No encontré el ${buildVehicleLabel(intent.index)} en tu cuenta.`;
        if (session) await addToHistory(session, 'assistant', reply);
        return { reply };
      }

      const reply = `Perfecto, ahora tomaré como referencia tu ${buildVehicleLabel(intent.index)}. ¿Qué deseas consultar?`;

      if (session) {
        await updateSession(session, {
          activeTopic: 'vehiculos',
          activeVehicleIndex: intent.index,
          lastOptionsContext: 'vehicle_select'
        });
        await addToHistory(session, 'assistant', reply);
      }

      return {
        reply,
        options: buildOptions([
          { label: 'Color', value: '¿Cuál es el color?' },
          { label: 'Marca', value: '¿Cuál es la marca?' },
          { label: 'Placa', value: '¿Cuál es la placa?' },
          { label: 'Holograma', value: '¿Qué holograma tiene?' }
        ])
      };
    }

    /* CONSULTA DE CAMPO DEL VEHÍCULO */
    if (intent.type === 'vehicle_field') {
      if (!vehicles.length) {
        const reply = 'No encontré vehículos registrados en tu cuenta.';
        if (session) await addToHistory(session, 'assistant', reply);
        return { reply };
      }

      const index = typeof session?.activeVehicleIndex === 'number' ? session.activeVehicleIndex : 0;
      const vehicle = getVehicleBySessionIndex(vehicles, index);

      if (!vehicle) {
        const reply = 'No encontré ese vehículo.';
        if (session) await addToHistory(session, 'assistant', reply);
        return { reply };
      }

      const fieldValue = vehicle[intent.field];
      const fieldLabel = safeFieldLabel(intent.field);

      const reply = fieldValue
        ? `El ${fieldLabel} de tu ${buildVehicleLabel(index)} es ${fieldValue}.`
        : `No tengo registrado el ${fieldLabel} de tu ${buildVehicleLabel(index)}.`;

      if (session) {
        await updateSession(session, {
          activeTopic: 'vehiculos',
          activeVehicleIndex: index,
          lastVehicleField: intent.field,
          lastOptionsContext: 'vehicle_field'
        });
        await addToHistory(session, 'assistant', reply);
      }

      return {
        reply,
        options: buildOptions([
          { label: 'Otra marca', value: '¿Cuál es la marca?' },
          { label: 'Otro color', value: '¿Cuál es el color?' },
          { label: 'Mi verificación', value: 'Verificación' }
        ])
      };
    }

    /* TEMA */
    if (intent.type === 'topic') {
      const topicResponse = getTopicResponse(intent.topic);

      if (session) {
        await updateSession(session, {
          activeTopic: intent.topic,
          lastOptionsContext: intent.topic
        });
        await addToHistory(session, 'assistant', topicResponse.reply);
      }

      return topicResponse;
    }

    /* IA CON HISTORIAL */
    const history = session?.history?.length
      ? session.history.map((h) => `${h.role}: ${h.content}`).join('\n')
      : 'Sin historial previo.';

    const vehiclesContext = getVehiclesContextText(vehicles);
    const activeTopicText = session?.activeTopic ? `Tema activo: ${session.activeTopic}` : 'Tema activo: ninguno';
    const activeVehicleText =
      typeof session?.activeVehicleIndex === 'number'
        ? `Vehículo activo: ${session.activeVehicleIndex + 1}`
        : 'Vehículo activo: ninguno';

    const ai = await askAI(
      `${systemKnowledge}

Contexto del usuario:
Nombre: ${safeName}
${activeTopicText}
${activeVehicleText}

Vehículos registrados:
${vehiclesContext}
`,
      `Historial:
${history}

Mensaje del usuario:
${cleanMessage}

Responde solo dentro del sistema Hoy No Circula y también puedes orientar sobre el uso y navegación de la página.`
    );

    const finalReply = cleanReply(ai) || 'No pude generar una respuesta en este momento.';

    if (session) {
      await addToHistory(session, 'assistant', finalReply);
    }

    return {
      reply: finalReply
    };
  } catch (error) {
    console.error("🔥 ERROR CHATBOT:", error);

    return {
      reply: "Error real: " + (error.message || JSON.stringify(error))
    };
  }
};

module.exports = {
  getChatbotReply
};