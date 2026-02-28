import { useState, useRef, useEffect } from 'react';
import './ChatbotWidget.css';

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: '¡Hola! Soy el asistente virtual de Hoy No Circula CDMX. 🚗 ¿En qué te puedo ayudar hoy?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Auto-scroll cada vez que cambian los mensajes o el estado de escribiendo
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // 1. Mostrar el mensaje del usuario
    const userMessage = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true); 

    // 2. Simular la respuesta del Bot (Aquí luego conectaremos tu Backend)
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { 
        sender: 'bot', 
        text: 'Aún estoy en fase de entrenamiento (Sprint 2). Pronto podré consultar tus placas en la Base de Datos. 🤖' 
      }]);
    }, 1500);
  };

  return (
    <div className="chatbot-container">
      {/* Botón flotante para abrir el chat */}
      <button className={`chatbot-toggle ${isOpen ? 'hidden' : ''}`} onClick={() => setIsOpen(true)}>
        💬 Asistente
      </button>

      {/* Ventana del Chat */}
      <div className={`chatbot-window ${isOpen ? 'active' : ''}`}>
        <div className="chatbot-header">
          <div className="chatbot-title">
            <span className="bot-avatar">🤖</span>
            <div>
              <h4>Soporte Vial</h4>
              <span className="online-status">En línea</span>
            </div>
          </div>
          <button className="close-btn" onClick={() => setIsOpen(false)}>✖</button>
        </div>
        
        <div className="chatbot-messages">
          {messages.map((msg, index) => (
            <div key={index} className={`message-wrapper ${msg.sender}`}>
              <div className="message-bubble">
                {msg.text}
              </div>
            </div>
          ))}
          
          {/* Indicador de "Escribiendo..." */}
          {isTyping && (
            <div className="message-wrapper bot">
              <div className="message-bubble typing-indicator">
                <span>.</span><span>.</span><span>.</span>
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