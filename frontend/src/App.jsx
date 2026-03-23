import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import VehicleRegistration from './components/VehicleRegistration';
import Login from './components/Login';
import ChatbotWidget from './components/ChatbotWidget';
import AdminPanel from './pages/AdminPanel';
import Profile from './pages/Profile';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfUse from './pages/TermsOfUse';
import Contact from './pages/Contact';
import Informacion from './pages/Informacion';
import RegistrarseUsuario from './components/RegistrarseUsuario';

function AppContent() {
  const location = useLocation();

  const [hasSession, setHasSession] = useState(!!localStorage.getItem('token'));
  const [chatNotifications, setChatNotifications] = useState([]);
  const [hasUnreadChat, setHasUnreadChat] = useState(false);
  const [openChatRequestId, setOpenChatRequestId] = useState(0);

  const showChatbot = hasSession && !location.pathname.startsWith('/login');

  useEffect(() => {
    const syncSession = () => {
      const token = localStorage.getItem('token');
      setHasSession(!!token);
    };

    syncSession();

    window.addEventListener('auth-changed', syncSession);

    return () => {
      window.removeEventListener('auth-changed', syncSession);
    };
  }, []);

  useEffect(() => {
    if (!hasSession) {
      setChatNotifications([]);
      setHasUnreadChat(false);
      setOpenChatRequestId(0);
    }
  }, [hasSession]);

  useEffect(() => {
    if (location.pathname.startsWith('/login')) {
      setHasUnreadChat(false);
    }
  }, [location.pathname]);

  const pushChatNotification = (messageText) => {
    const cleanText = String(messageText || '').trim();
    if (!cleanText) return;

    const preview =
      cleanText.length > 95 ? `${cleanText.slice(0, 95)}...` : cleanText;

    const newNotification = {
      id: `chat-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title: 'Nuevo mensaje de Soporte Vial',
      message: preview,
      createdAt: new Date().toISOString(),
      read: false,
      type: 'chatbot'
    };

    setChatNotifications((prev) => {
      const isDuplicate =
        prev.length > 0 &&
        prev[0].message === newNotification.message &&
        prev[0].read === false;

      if (isDuplicate) return prev;

      return [newNotification, ...prev];
    });

    setHasUnreadChat(true);
  };

  const markChatNotificationsAsRead = () => {
    setChatNotifications((prev) =>
      prev.map((item) => ({
        ...item,
        read: true
      }))
    );
    setHasUnreadChat(false);
  };

  const removeChatNotification = (notificationId) => {
    setChatNotifications((prev) => {
      const updated = prev.filter((item) => item.id !== notificationId);
      const stillHasUnread = updated.some((item) => !item.read);
      setHasUnreadChat(stillHasUnread);
      return updated;
    });
  };

  const requestOpenChat = () => {
    setOpenChatRequestId((prev) => prev + 1);
  };

  const unreadChatCount = useMemo(() => {
    return chatNotifications.filter((item) => !item.read).length;
  }, [chatNotifications]);

  return (
    <div className="app-layout">
      <Navbar
        chatNotifications={chatNotifications}
        unreadChatCount={unreadChatCount}
        hasUnreadChat={hasUnreadChat}
        onRemoveChatNotification={removeChatNotification}
        onMarkChatNotificationsAsRead={markChatNotificationsAsRead}
        onOpenChatFromNotification={requestOpenChat}
      />

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/registro" element={<VehicleRegistration />} />
          <Route path="/perfil" element={<Profile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfUse />} />
          <Route path="/contacto" element={<Contact />} />
          <Route path="/informacion" element={<Informacion />} />
          <Route path="/registrarse-usuario" element={<RegistrarseUsuario />} />
        </Routes>
      </main>

      {showChatbot && (
        <ChatbotWidget
          hasUnreadExternal={hasUnreadChat}
          onBotMessageWhileMinimized={pushChatNotification}
          onChatOpened={markChatNotificationsAsRead}
          openChatRequestId={openChatRequestId}
        />
      )}

      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;