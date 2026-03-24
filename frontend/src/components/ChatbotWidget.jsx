import { useEffect, useMemo, useRef, useState } from 'react';
import './ChatbotWidget.css';

const API_BASE =
  window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : 'https://hoynocircula-backend.onrender.com';

const IDLE_TIME_MS = 35000;
const AFTER_IDLE_CLOSE_MS = 25000;
const CLOSE_AFTER_FINAL_MESSAGE_MS = 7000;

const ChatbotWidget = ({
  hasUnreadExternal = false,
  onBotMessageWhileMinimized,
  onChatOpened,
  openChatRequestId = 0
}) => {
  const sessionUserRaw = localStorage.getItem('session_user');
  const sessionUser = sessionUserRaw ? JSON.parse(sessionUserRaw) : null;
  const sessionEmail = sessionUser?.email || '';
  const sessionFullName = sessionUser?.fullName || '';

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const idleTimerRef = useRef(null);
  const closeAfterIdleTimerRef = useRef(null);
  const finalCloseTimerRef = useRef(null);
  const hasSentIdlePromptRef = useRef(false);

  const isOpenRef = useRef(false);
  const isMinimizedRef = useRef(false);

  /* =========================
     NUEVO: CONTROL DE HISTORIAL
  ========================= */
  const hasLoadedHistoryRef = useRef(false);
  const hasInjectedResumeMessageRef = useRef(false);

  const buildWelcomeMessage = () => ({
    sender: 'bot',
    text: sessionFullName
      ? `¡Hola ${sessionFullName}! Soy el asistente virtual de Hoy No Circula 🚗\nPuedo ayudarte con verificación, contingencia, doble Hoy No Circula, calendario, costos y también con la información de tus vehículos registrados.`
      : '¡Hola! Soy el asistente virtual de Hoy No Circula 🚗\nPuedo ayudarte con verificación, contingencia, doble Hoy No Circula, calendario, costos y también con la información de tus vehículos registrados.',
    optionsId: 'welcome-options',
    options: [
      { label: 'Mis vehículos', value: '¿Qué vehículos tengo registrados?' },
      { label: 'Hoy No Circula', value: 'Explícame cómo funciona Hoy No Circula.' },
      { label: 'Verificación', value: 'Explícame la verificación vehicular.' },
      { label: 'Contingencia', value: '¿Qué es la contingencia ambiental?' }
    ]
  });

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([buildWelcomeMessage()]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [usedOptions, setUsedOptions] = useState({});
  const [hasUnread, setHasUnread] = useState(false);

  const canSend = useMemo(() => input.trim().length > 0 && !isTyping, [input, isTyping]);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    isMinimizedRef.current = isMinimized;
  }, [isMinimized]);

  useEffect(() => {
    if (hasUnreadExternal) {
      setHasUnread(true);
    }
  }, [hasUnreadExternal]);

  /* =========================
     NUEVO: REINICIAR BANDERAS
  ========================= */
  useEffect(() => {
    hasLoadedHistoryRef.current = false;
    hasInjectedResumeMessageRef.current = false;
  }, [sessionEmail]);

  const clearIdleTimer = () => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  };

  const clearCloseAfterIdleTimer = () => {
    if (closeAfterIdleTimerRef.current) {
      clearTimeout(closeAfterIdleTimerRef.current);
      closeAfterIdleTimerRef.current = null;
    }
  };

  const clearFinalCloseTimer = () => {
    if (finalCloseTimerRef.current) {
      clearTimeout(finalCloseTimerRef.current);
      finalCloseTimerRef.current = null;
    }
  };

  const scrollToBottom = (behavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
      return;
    }

    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior
      });
    }
  };

  /* =========================
     NUEVO: NORMALIZAR HISTORIAL
  ========================= */
  const normalizeHistoryMessages = (history = []) => {
    if (!Array.isArray(history)) return [];

    return history
      .map((item) => {
        const role = item?.role || item?.sender || '';
        const content = item?.content || item?.text || '';

        if (!content) return null;

        return {
          sender: role === 'assistant' || role === 'bot' ? 'bot' : 'user',
          text: content
        };
      })
      .filter(Boolean);
  };

  /* =========================
     NUEVO: CARGAR HISTORIAL
  ========================= */
  const loadChatHistory = async ({ injectResumeMessage = true } = {}) => {
    if (!sessionEmail) {
      hasLoadedHistoryRef.current = true;
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/api/chatbot/history/${encodeURIComponent(sessionEmail)}`
      );

      let data = {};
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) return;

      const normalizedHistory = normalizeHistoryMessages(data.history || []);

      if (!normalizedHistory.length) {
        hasLoadedHistoryRef.current = true;
        return;
      }

      const shouldInjectResume =
        injectResumeMessage && !hasInjectedResumeMessageRef.current;

      const topic = data.activeTopic || '';
      const vehicleIndex = data.activeVehicleIndex;

      let resumeText =
        'Seguimos donde lo dejamos. ¿Qué deseas consultar ahora?';

      if (topic === 'verificacion') {
        resumeText =
          typeof vehicleIndex === 'number'
            ? `Seguimos con tu verificación del vehículo ${vehicleIndex + 1}. ¿Qué deseas consultar ahora?`
            : 'Seguimos con tu verificación. ¿Qué deseas consultar ahora?';
      } else if (topic === 'contingencia') {
        resumeText =
          'Seguimos con contingencia. ¿Quieres revisar estado, restricciones o cómo afecta a tu vehículo?';
      } else if (topic === 'vehiculos') {
        resumeText =
          typeof vehicleIndex === 'number'
            ? `Seguimos con tu vehículo ${vehicleIndex + 1}. ¿Qué deseas revisar ahora?`
            : 'Seguimos con tus vehículos. ¿Qué deseas revisar ahora?';
      }

      const finalMessages = shouldInjectResume
        ? [
            ...normalizedHistory,
            {
              sender: 'bot',
              text: resumeText
            }
          ]
        : normalizedHistory;

      setMessages(finalMessages);
      hasLoadedHistoryRef.current = true;

      if (shouldInjectResume) {
        hasInjectedResumeMessageRef.current = true;
      }
    } catch (error) {
      console.error('Error cargando historial del chat:', error);
      hasLoadedHistoryRef.current = true;
    }
  };

  const resetConversation = () => {
    clearIdleTimer();
    clearCloseAfterIdleTimer();
    clearFinalCloseTimer();
    setMessages([buildWelcomeMessage()]);
    setUsedOptions({});
    setInput('');
    setIsTyping(false);
    setHasUnread(false);
    hasSentIdlePromptRef.current = false;
    hasInjectedResumeMessageRef.current = false;
  };

  const closeAndResetSilently = () => {
    clearIdleTimer();
    clearCloseAfterIdleTimer();
    clearFinalCloseTimer();
    setIsOpen(false);
    setIsMinimized(false);
    setHasUnread(false);
    setMessages([buildWelcomeMessage()]);
    setUsedOptions({});
    setInput('');
    setIsTyping(false);
    hasSentIdlePromptRef.current = false;
    hasInjectedResumeMessageRef.current = false;
  };

  const scheduleCloseAfterIdle = () => {
    clearCloseAfterIdleTimer();
    clearFinalCloseTimer();

    closeAfterIdleTimerRef.current = setTimeout(() => {
      if (!hasSentIdlePromptRef.current) return;

      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: 'Como no recibí respuesta en un momento, cerraré esta conversación para mantener todo ordenado.\n\nCuando quieras, puedes volver a abrir el asistente y con gusto seguimos donde lo dejamos.'
        }
      ]);

      finalCloseTimerRef.current = setTimeout(() => {
        closeAndResetSilently();
      }, CLOSE_AFTER_FINAL_MESSAGE_MS);
    }, AFTER_IDLE_CLOSE_MS);
  };

  const resetIdleTimer = () => {
    clearIdleTimer();

    idleTimerRef.current = setTimeout(() => {
      if (!isOpenRef.current || isMinimizedRef.current || isTyping || hasSentIdlePromptRef.current) {
        return;
      }

      hasSentIdlePromptRef.current = true;

      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: sessionFullName
            ? `${sessionFullName}, ¿sigues ahí? 👀\nSi quieres, puedo ayudarte con tus vehículos, tu verificación o explicarte cómo funciona la contingencia.`
            : '¿Sigues ahí? 👀\nSi quieres, puedo ayudarte con tus vehículos, tu verificación o explicarte cómo funciona la contingencia.',
          optionsId: `idle-options-${Date.now()}`,
          options: [
            { label: 'Mis vehículos', value: '¿Qué vehículos tengo registrados?' },
            { label: 'Mi verificación', value: 'Ayúdame con mi verificación.' },
            { label: 'Contingencia', value: 'Explícame la contingencia ambiental.' }
          ]
        }
      ]);

      scheduleCloseAfterIdle();
    }, IDLE_TIME_MS);
  };

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => scrollToBottom('auto'), 80);
      resetIdleTimer();
    } else {
      clearIdleTimer();
    }

    return () => {
      clearIdleTimer();
    };
  }, [isOpen, isMinimized, isTyping]);

  useEffect(() => {
    return () => {
      clearIdleTimer();
      clearCloseAfterIdleTimer();
      clearFinalCloseTimer();
    };
  }, []);

  useEffect(() => {
    if (!openChatRequestId) return;

    const openChatFromExternalTrigger = async () => {
      setIsOpen(true);
      setIsMinimized(false);
      setHasUnread(false);
      hasSentIdlePromptRef.current = false;
      clearCloseAfterIdleTimer();
      clearFinalCloseTimer();

      if (!hasLoadedHistoryRef.current) {
        await loadChatHistory();
      }

      if (typeof onChatOpened === 'function') {
        onChatOpened();
      }

      setTimeout(() => {
        scrollToBottom('auto');
        resetIdleTimer();
      }, 100);
    };

    openChatFromExternalTrigger();
  }, [openChatRequestId]);

  const makeOptionsId = () => `opt_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  const sendMessageToBackend = async (textToSend) => {
    const response = await fetch(`${API_BASE}/api/chatbot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: textToSend,
        email: sessionEmail,
        fullName: sessionFullName
      })
    });

    let data = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      throw new Error(data.reply || 'No se pudo obtener respuesta del chatbot.');
    }

    return {
      text: data.reply || 'No recibí respuesta.',
      options: Array.isArray(data.options) ? data.options : [],
      optionsId: Array.isArray(data.options) && data.options.length ? makeOptionsId() : null
    };
  };

  const appendBotMessage = (botPayload) => {
    setMessages((prev) => [...prev, botPayload]);

    const isCollapsed = isMinimizedRef.current || !isOpenRef.current;

    if (isCollapsed) {
      setHasUnread(true);

      if (typeof onBotMessageWhileMinimized === 'function') {
        onBotMessageWhileMinimized(botPayload.text);
      }
    }

    setTimeout(() => {
      if (isOpenRef.current && !isMinimizedRef.current) {
        scrollToBottom('smooth');
      }
    }, 80);
  };

  const addUserAndBot = async (textToSend) => {
    hasSentIdlePromptRef.current = false;
    clearCloseAfterIdleTimer();
    clearFinalCloseTimer();
    setHasUnread(false);

    const userMessage = { sender: 'user', text: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const reply = await sendMessageToBackend(textToSend);

      setTimeout(() => {
        setIsTyping(false);

        const botPayload = {
          sender: 'bot',
          text: reply.text,
          options: reply.options || [],
          optionsId: reply.optionsId
        };

        appendBotMessage(botPayload);
        resetIdleTimer();
      }, 500);
    } catch (error) {
      console.error('Error conectando chatbot:', error);

      setTimeout(() => {
        setIsTyping(false);

        appendBotMessage({
          sender: 'bot',
          text: 'Ocurrió un error al conectar con el asistente. Intenta de nuevo en un momento.'
        });

        resetIdleTimer();
      }, 300);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!canSend) return;

    const textToSend = input.trim();
    setInput('');
    await addUserAndBot(textToSend);
  };

  const handleOptionClick = async (optionsId, value) => {
    setUsedOptions((prev) => ({ ...prev, [optionsId]: true }));
    await addUserAndBot(value);
  };

  const handleOpen = async () => {
    setIsOpen(true);
    setIsMinimized(false);
    setHasUnread(false);
    hasSentIdlePromptRef.current = false;
    clearCloseAfterIdleTimer();
    clearFinalCloseTimer();

    if (!hasLoadedHistoryRef.current) {
      await loadChatHistory();
    }

    if (typeof onChatOpened === 'function') {
      onChatOpened();
    }

    setTimeout(() => {
      scrollToBottom('auto');
      resetIdleTimer();
    }, 80);
  };

  const handleMinimize = () => {
    clearIdleTimer();
    setIsMinimized(true);
  };

  const handleCloseAndReset = () => {
    clearIdleTimer();
    clearCloseAfterIdleTimer();
    clearFinalCloseTimer();
    setIsOpen(false);
    setIsMinimized(false);
    resetConversation();
  };

  return (
    <div className="chatbot-container">
      {(!isOpen || isMinimized) && (
        <button
          className={`chatbot-toggle ${hasUnread ? 'has-unread' : ''}`}
          onClick={handleOpen}
          type="button"
        >
          <span className="chatbot-toggle-icon">💬</span>
          <span>{hasUnread ? 'Nuevo mensaje' : 'Asistente'}</span>
          {hasUnread && <span className="chatbot-unread-dot" />}
        </button>
      )}

      {isOpen && !isMinimized && (
        <div className="chatbot-window active">
          <div className="chatbot-header">
            <div className="chatbot-title">
              <span className="bot-avatar">🤖</span>
              <div>
                <h4>Soporte Vial</h4>
                <span className="online-status">En línea</span>
              </div>
            </div>

            <div className="chatbot-header-actions">
              <button
                className="minimize-btn"
                onClick={handleMinimize}
                aria-label="Minimizar chat"
                type="button"
                title="Minimizar"
              >
                —
              </button>

              <button
                className="close-btn"
                onClick={handleCloseAndReset}
                aria-label="Cerrar chat"
                type="button"
                title="Cerrar y reiniciar"
              >
                ✖
              </button>
            </div>
          </div>

          <div className="chatbot-messages" ref={messagesContainerRef}>
            {messages.map((msg, index) => (
              <div key={index} className={`message-wrapper ${msg.sender}`}>
                <div className="message-bubble">
                  {msg.text}

                  {msg.sender === 'bot' &&
                    msg.options?.length > 0 &&
                    msg.optionsId &&
                    !usedOptions[msg.optionsId] && (
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
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="chatbot-input">
            <input
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                hasSentIdlePromptRef.current = false;
                clearCloseAfterIdleTimer();
                clearFinalCloseTimer();
                resetIdleTimer();
              }}
              onFocus={() => {
                hasSentIdlePromptRef.current = false;
                clearCloseAfterIdleTimer();
                clearFinalCloseTimer();
                resetIdleTimer();
              }}
              placeholder="Escribe tu consulta aquí..."
              autoComplete="off"
            />
            <button type="submit" disabled={!canSend}>
              {isTyping ? '...' : 'Enviar'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatbotWidget;