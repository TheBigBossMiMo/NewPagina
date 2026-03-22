import { useState, useRef, useEffect } from 'react';
import './ChatbotWidget.css';

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: '¡Hola! Soy el asistente virtual de Hoy No Circula CDMX. 🚗 ¿En qué te puedo ayudar hoy?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Contexto “duda”
  const [awaitingDoubt, setAwaitingDoubt] = useState(false);

  // Flujo Hoy No Circula
  const [flowStep, setFlowStep] = useState(null); // null | 'entidad' | 'placa' | 'holograma'
  const [circulationData, setCirculationData] = useState({
    entidad: '',
    placa: '',
    holograma: ''
  });

  // Flujo Verificación
  const [verifyStep, setVerifyStep] = useState(null); // null | 'entidad' | 'placa'
  const [verifyData, setVerifyData] = useState({
    entidad: '',
    placa: ''
  });

  // ✅ Flujo Placas (demo): para sacar color de engomado (y guiar a HNC/verificación)
  const [platesStep, setPlatesStep] = useState(null); // null | 'placa'
  const [platesData, setPlatesData] = useState({ placa: '' });

  // Opciones ya usadas (para ocultarlas cuando el usuario elige)
  const [usedOptions, setUsedOptions] = useState({});

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // =========================
  // Helpers
  // =========================
  const normalize = (text) => {
    return text
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ');
  };

  const extractLastDigit = (t) => {
    const digits = t.match(/\d/g);
    if (!digits || digits.length === 0) return null;
    return digits[digits.length - 1];
  };

  const extractHologram = (t) => {
    if (t.includes('00')) return '00';
    const m = t.match(/\b(0|1|2)\b/);
    return m ? m[1] : null;
  };

  const detectEntidad = (t) => {
    if (t.includes('cdmx') || t.includes('ciudad de mexico')) return 'CDMX';
    if (t.includes('edomex') || t.includes('edo mex') || t.includes('estado de mexico')) return 'EdoMex';
    if (t === 'edo') return 'EdoMex';
    return null;
  };

  const weekdayName = (d = new Date()) => {
    const names = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    return names[d.getDay()];
  };

  // ✅ Color del engomado (CDMX) por terminación
  const getEngomadoColor = (lastDigit) => {
    const d = String(lastDigit);

    if (d === '5' || d === '6') return 'Amarillo';
    if (d === '7' || d === '8') return 'Rosa';
    if (d === '3' || d === '4') return 'Rojo';
    if (d === '1' || d === '2') return 'Verde';
    if (d === '9' || d === '0') return 'Azul';

    return 'No identificado';
  };

  // Regla demo CDMX (L-V)
  const isRestrictedCDMX = ({ lastDigit, holograma }, date = new Date()) => {
    const day = date.getDay(); // 0 dom ... 6 sáb

    // Demo: sábado/domingo sin restricción
    if (day === 0 || day === 6) return false;

    // 00 y 0: exentos (demo)
    if (holograma === '00' || holograma === '0') return false;

    // Solo 1 y 2
    if (holograma !== '1' && holograma !== '2') return false;

    const map = {
      1: ['5', '6'], // lunes
      2: ['7', '8'], // martes
      3: ['3', '4'], // miércoles
      4: ['1', '2'], // jueves
      5: ['9', '0'], // viernes
    };

    const restrictedDigits = map[day] || [];
    return restrictedDigits.includes(String(lastDigit));
  };

  // ✅ AJUSTE: siempre dice “Hoy SÍ/NO te toca circular” y además “Resultado: ...”
  // ✅ NO repite color aquí (color se muestra en “Datos capturados”)
  const buildCirculationAnswer = (entidad, lastDigit, holograma) => {
    const today = new Date();
    const dayName = weekdayName(today);

    // Si no es CDMX, no calculamos (pero sí decimos que aún no se puede)
    if (entidad !== 'CDMX') {
      return `📅 Hoy es ${dayName}.
ℹ️ Por ahora el cálculo automático está disponible solo para CDMX (Sprint 2 demo).`;
    }

    const restricted = isRestrictedCDMX({ lastDigit, holograma }, today);

    // 00 y 0: exentos (demo)
    if (holograma === '00' || holograma === '0') {
      return `📅 Hoy es ${dayName}.
✅ Hoy SÍ te toca circular.
Motivo: Con holograma ${holograma} normalmente no tienes restricción.
Resultado: Sí circulas ✅`;
    }

    if (restricted) {
      return `📅 Hoy es ${dayName}.
⛔ Hoy NO te toca circular.
Motivo: Con holograma ${holograma} y terminación ${lastDigit} te toca restricción.
Resultado: No circulas 🚫`;
    }

    return `📅 Hoy es ${dayName}.
✅ Hoy SÍ te toca circular.
Motivo: Con holograma ${holograma} y terminación ${lastDigit} no te toca restricción.
Resultado: Sí circulas ✅`;
  };

  // Verificación (DEMO) por bimestre según último dígito
  const getVerifyPeriodCDMX = (lastDigit) => {
    const map = {
      '5': 'Enero - Febrero',
      '6': 'Enero - Febrero',
      '7': 'Febrero - Marzo',
      '8': 'Febrero - Marzo',
      '3': 'Marzo - Abril',
      '4': 'Marzo - Abril',
      '1': 'Abril - Mayo',
      '2': 'Abril - Mayo',
      '9': 'Mayo - Junio',
      '0': 'Mayo - Junio'
    };
    return map[String(lastDigit)] || 'No disponible';
  };

  const getVerifyPeriodEdoMex = (lastDigit) => {
    // Demo: igual que CDMX para Sprint 2 (puedes cambiarlo después)
    return getVerifyPeriodCDMX(lastDigit);
  };

  const makeOptionsId = () => `opt_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  const digitOptions = [
    { label: '0', value: '0' }, { label: '1', value: '1' }, { label: '2', value: '2' },
    { label: '3', value: '3' }, { label: '4', value: '4' }, { label: '5', value: '5' },
    { label: '6', value: '6' }, { label: '7', value: '7' }, { label: '8', value: '8' },
    { label: '9', value: '9' }
  ];

  // Reiniciar a “inicio”
  const resetConversation = () => {
    setAwaitingDoubt(false);

    setFlowStep(null);
    setCirculationData({ entidad: '', placa: '', holograma: '' });

    setVerifyStep(null);
    setVerifyData({ entidad: '', placa: '' });

    setPlatesStep(null);
    setPlatesData({ placa: '' });

    setUsedOptions({});

    setMessages([
      { sender: 'bot', text: '¡Hola! Soy el asistente virtual de Hoy No Circula CDMX. 🚗 ¿En qué te puedo ayudar hoy?' },
      {
        sender: 'bot',
        text: 'Elige una opción rápida o escribe tu consulta:',
        optionsId: makeOptionsId(),
        options: [
          { label: 'Hoy No Circula', value: 'hoy no circula' },
          { label: 'Hologramas', value: 'hologramas' },
          { label: 'Verificación', value: 'verificacion' },
          { label: 'Placas', value: 'placas' },
        ]
      }
    ]);
  };

  // =========================
  // BOT engine
  // =========================
  const getBotReply = (rawText) => {
    const text = normalize(rawText);

    // ---- Conversación final: seguir/salir ----
    if (text === 'salir') {
      return 'Gracias por usar Soporte Vial. No olvides que aquí estaré, tu gran amigo Asistente Vial, hasta la próxima 👋';
    }
    if (text === 'seguir') {
      return { action: 'RESET' };
    }

    // =====================
    // FLUJO PLACAS (demo)
    // =====================
    if (platesStep === 'placa') {
      const lastDigit = extractLastDigit(text);
      if (lastDigit !== null) {
        const color = getEngomadoColor(lastDigit);

        setPlatesData({ placa: String(lastDigit) });
        setPlatesStep(null);

        return {
          text: `✅ Listo.\n• Terminación: ${lastDigit}\n• Color de engomado: ${color}\n\n¿Quieres consultar algo más con tus datos?`,
          optionsId: makeOptionsId(),
          options: [
            { label: 'Hoy No Circula', value: 'hoy no circula' },
            { label: 'Verificación', value: 'verificacion' },
            { label: 'Seguir', value: 'seguir' },
            { label: 'Salir', value: 'salir' }
          ]
        };
      }

      return {
        text: 'Solo dime el último número de tu placa (0 a 9) para decirte el color del engomado.',
        optionsId: makeOptionsId(),
        options: digitOptions
      };
    }

    // =====================
    // FLUJO VERIFICACIÓN
    // =====================
    if (verifyStep === 'entidad') {
      const ent = detectEntidad(text);
      if (ent) {
        setVerifyData(prev => ({ ...prev, entidad: ent }));
        setVerifyStep('placa');

        return {
          text: `Perfecto 👍 (${ent}). Ahora dime el último dígito de tu placa para decirte el periodo de verificación y el color de engomado.`,
          optionsId: makeOptionsId(),
          options: digitOptions
        };
      }

      return {
        text: '¿Eres de CDMX o EdoMex?',
        optionsId: makeOptionsId(),
        options: [
          { label: 'CDMX', value: 'CDMX' },
          { label: 'EdoMex', value: 'EdoMex' }
        ]
      };
    }

    if (verifyStep === 'placa') {
      const lastDigit = extractLastDigit(text);
      if (lastDigit !== null) {
        const entidad = verifyData.entidad;
        const periodo = entidad === 'CDMX'
          ? getVerifyPeriodCDMX(lastDigit)
          : getVerifyPeriodEdoMex(lastDigit);

        const color = getEngomadoColor(lastDigit);

        setVerifyData(prev => ({ ...prev, placa: String(lastDigit) }));
        setVerifyStep(null);

        return {
          text:
`✅ Listo. Datos capturados:
• Entidad: ${entidad}
• Terminación de placa: ${lastDigit}
• Color de engomado: ${color}

📆 Tu periodo de verificación (demo): ${periodo}

¿Quieres algo más?`,
          optionsId: makeOptionsId(),
          options: [
            { label: 'Seguir', value: 'seguir' },
            { label: 'Salir', value: 'salir' }
          ]
        };
      }

      return {
        text: 'Solo dime el último número de tu placa (0 a 9).',
        optionsId: makeOptionsId(),
        options: digitOptions
      };
    }

    // =====================
    // FLUJO HOY NO CIRCULA
    // =====================
    if (flowStep === 'entidad') {
      const ent = detectEntidad(text);
      if (ent) {
        setCirculationData(prev => ({ ...prev, entidad: ent }));
        setFlowStep('placa');

        return {
          text: `Perfecto 👍 (${ent}). Ahora dime el último dígito de tu placa (para sacar color de engomado y restricción).`,
          optionsId: makeOptionsId(),
          options: digitOptions
        };
      }

      return {
        text: 'Necesito saber si tu vehículo es de CDMX o EdoMex. ¿Cuál es?',
        optionsId: makeOptionsId(),
        options: [
          { label: 'CDMX', value: 'CDMX' },
          { label: 'EdoMex', value: 'EdoMex' }
        ]
      };
    }

    if (flowStep === 'placa') {
      const lastDigit = extractLastDigit(text);
      if (lastDigit !== null) {
        // Guardamos la terminación
        setCirculationData(prev => ({ ...prev, placa: String(lastDigit) }));
        setFlowStep('holograma');

        // ✅ AQUÍ YA NO repetimos “terminación/color” para que NO se duplique.
        // El resumen completo sale hasta el final (cuando ya tenemos holograma).
        return {
          text: `Gracias ✅\nAhora dime qué holograma tienes:`,
          optionsId: makeOptionsId(),
          options: [
            { label: '00', value: '00' },
            { label: '0', value: '0' },
            { label: '1', value: '1' },
            { label: '2', value: '2' }
          ]
        };
      }

      return {
        text: 'Solo dime el último número de tu placa.',
        optionsId: makeOptionsId(),
        options: digitOptions
      };
    }

    if (flowStep === 'holograma') {
      const holo = extractHologram(text);
      if (holo) {
        const entidad = circulationData.entidad;
        const placa = circulationData.placa; // último dígito
        const holograma = holo;
        const color = getEngomadoColor(placa);

        setCirculationData(prev => ({ ...prev, holograma }));
        setFlowStep(null);

        const result = buildCirculationAnswer(entidad, placa, holograma);

        // ✅ FINAL: aquí va TODO el resumen (una sola vez) + el resultado
        return {
          text:
`✅ Listo. Datos capturados:
• Entidad: ${entidad}
• Terminación de placa: ${placa}
• Color de engomado: ${color}
• Holograma: ${holograma}

${result}

¿Quieres algo más?`,
          optionsId: makeOptionsId(),
          options: [
            { label: 'Seguir', value: 'seguir' },
            { label: 'Salir', value: 'salir' }
          ]
        };
      }

      return {
        text: 'El holograma puede ser: 00, 0, 1 o 2. ¿Cuál tienes?',
        optionsId: makeOptionsId(),
        options: [
          { label: '00', value: '00' },
          { label: '0', value: '0' },
          { label: '1', value: '1' },
          { label: '2', value: '2' }
        ]
      };
    }

    // ---- Contexto duda ----
    if (awaitingDoubt) {
      setAwaitingDoubt(false);

      if (text.includes('hoy no circula') || text.includes('circulo') || text.includes('circula') || text.includes('restriccion')) {
        setFlowStep('entidad');
        return {
          text: 'Va 🙂 Para decirte si circulas necesito datos.\n¿Tu vehículo es de CDMX o EdoMex?',
          optionsId: makeOptionsId(),
          options: [
            { label: 'CDMX', value: 'CDMX' },
            { label: 'EdoMex', value: 'EdoMex' }
          ]
        };
      }

      if (text.includes('verificacion') || text.includes('verificar')) {
        setVerifyStep('entidad');
        return {
          text: 'Va 🙂 Para decirte tu periodo de verificación necesito datos.\n¿Eres de CDMX o EdoMex?',
          optionsId: makeOptionsId(),
          options: [
            { label: 'CDMX', value: 'CDMX' },
            { label: 'EdoMex', value: 'EdoMex' }
          ]
        };
      }

      if (text.includes('placa') || text.includes('placas') || text.includes('matricula')) {
        setPlatesStep('placa');
        return {
          text: 'Para decirte el color del engomado necesito el último dígito de tu placa.',
          optionsId: makeOptionsId(),
          options: digitOptions
        };
      }

      return {
        text: `Entendido. Tu duda es: "${rawText}".\nElige una opción:`,
        optionsId: makeOptionsId(),
        options: [
          { label: 'Hoy No Circula', value: 'hoy no circula' },
          { label: 'Verificación', value: 'verificacion' },
          { label: 'Hologramas', value: 'hologramas' },
          { label: 'Placas', value: 'placas' }
        ]
      };
    }

    // ---- Intents básicos ----
    const isGreeting =
      text === 'hola' || text === 'ola' || text === 'holi' ||
      text.includes('buenas') || text.includes('buenos dias') ||
      text.includes('buenas tardes') || text.includes('buenas noches') ||
      text.includes('hey');

    if (isGreeting) {
      return {
        text: '¡Hola! 👋 Elige una opción:',
        optionsId: makeOptionsId(),
        options: [
          { label: 'Hoy No Circula', value: 'hoy no circula' },
          { label: 'Hologramas', value: 'hologramas' },
          { label: 'Verificación', value: 'verificacion' },
          { label: 'Placas', value: 'placas' }
        ]
      };
    }

    const isDoubt =
      text.includes('tengo una duda') ||
      text.includes('una duda') ||
      text.includes('ayuda') ||
      text.includes('no entiendo') ||
      text.includes('tengo una pregunta') ||
      text.includes('pregunta');

    if (isDoubt) {
      setAwaitingDoubt(true);
      return 'Claro 🙂 ¿Cuál es tu duda?';
    }

    if (text.includes('hoy no circula') || text.includes('circulo') || text.includes('circula') || text.includes('restriccion')) {
      setFlowStep('entidad');
      return {
        text: 'Para decirte si circulas necesito algunos datos.\n¿Tu vehículo es de CDMX o EdoMex?',
        optionsId: makeOptionsId(),
        options: [
          { label: 'CDMX', value: 'CDMX' },
          { label: 'EdoMex', value: 'EdoMex' }
        ]
      };
    }

    // Verificación -> inicia flujo
    if (text.includes('verificacion') || text.includes('verificar')) {
      setVerifyStep('entidad');
      return {
        text: 'Sobre verificación: para decirte el periodo y el color del engomado, primero dime si eres de CDMX o EdoMex.',
        optionsId: makeOptionsId(),
        options: [
          { label: 'CDMX', value: 'CDMX' },
          { label: 'EdoMex', value: 'EdoMex' }
        ]
      };
    }

    // Placas -> inicia flujo placas (color)
    if (text.includes('placa') || text.includes('placas') || text.includes('matricula')) {
      setPlatesStep('placa');
      return {
        text: 'Para decirte el color del engomado, dime el último dígito de tu placa.',
        optionsId: makeOptionsId(),
        options: digitOptions
      };
    }

    if (text.includes('holograma') || text.includes('hologramas')) {
      return {
        text: 'Los hologramas comunes son: 00, 0, 1 y 2.\nElige una opción:',
        optionsId: makeOptionsId(),
        options: [
          { label: 'Hoy No Circula', value: 'hoy no circula' },
          { label: 'Verificación', value: 'verificacion' }
        ]
      };
    }

    // Fallback
    return {
      text: 'No te entendí del todo 😅\nElige una opción:',
      optionsId: makeOptionsId(),
      options: [
        { label: 'Hoy No Circula', value: 'hoy no circula' },
        { label: 'Verificación', value: 'verificacion' },
        { label: 'Hologramas', value: 'hologramas' },
        { label: 'Placas', value: 'placas' }
      ]
    };
  };

  // =========================
  // Envío y opciones
  // =========================
  const addUserAndBot = (textToSend) => {
    const userMessage = { sender: 'user', text: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    setTimeout(() => {
      const reply = getBotReply(textToSend);
      setIsTyping(false);

      if (reply && typeof reply === 'object' && reply.action === 'RESET') {
        resetConversation();
        return;
      }

      if (typeof reply === 'string') {
        setMessages(prev => [...prev, { sender: 'bot', text: reply }]);
        return;
      }

      const botPayload = {
        sender: 'bot',
        text: reply.text,
        options: reply.options || [],
        optionsId: reply.optionsId || (reply.options?.length ? makeOptionsId() : null)
      };

      setMessages(prev => [...prev, botPayload]);
    }, 650);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const textToSend = input;
    setInput('');
    addUserAndBot(textToSend);
  };

  const handleOptionClick = (optionsId, value) => {
    setUsedOptions(prev => ({ ...prev, [optionsId]: true }));
    addUserAndBot(value);
  };

  return (
    <div className="chatbot-container">
      <button
        className={`chatbot-toggle ${isOpen ? 'hidden' : ''}`}
        onClick={() => setIsOpen(true)}
      >
        💬 Asistente
      </button>

      <div className={`chatbot-window ${isOpen ? 'active' : ''}`}>
        <div className="chatbot-header">
          <div className="chatbot-title">
            <span className="bot-avatar">🤖</span>
            <div>
              <h4>Soporte Vial</h4>
              <span className="online-status">En línea</span>
            </div>
          </div>
          <button className="close-btn" onClick={() => setIsOpen(false)} aria-label="Cerrar chat">
            ✖
          </button>
        </div>

        <div className="chatbot-messages">
          {messages.map((msg, index) => (
            <div key={index} className={`message-wrapper ${msg.sender}`}>
              <div className="message-bubble">
                {msg.text}

                {msg.sender === 'bot' && msg.options?.length > 0 && msg.optionsId && !usedOptions[msg.optionsId] && (
                  <div className="bot-options">
                    {msg.options.map((opt, i) => (
                      <button
                        key={i}
                        type="button"
                        className="quick-reply-btn"
                        onClick={() => handleOptionClick(msg.optionsId, opt.value)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="message-wrapper bot">
              <div className="message-bubble typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="chatbot-input">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu consulta aquí..."
            autoComplete="off"
          />
          <button type="submit" disabled={!input.trim()}>
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatbotWidget;
