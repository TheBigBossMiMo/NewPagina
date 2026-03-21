import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
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
import Contact from "./pages/Contact";
import Informacion from './pages/Informacion';
import RegistrarseUsuario from './components/RegistrarseUsuario';

// 🔥 NUEVO IMPORT
import VehicleLookupPage from './pages/VehicleLookupPage';

function AppContent() {
  const location = useLocation();

  const hasSession = !!localStorage.getItem('token');

  const showChatbot = hasSession && !location.pathname.startsWith('/login');

  return (
    <div className="app-layout">
      <Navbar />

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

          {/* 🔥 NUEVA RUTA */}
          <Route path="/consulta-vehiculo" element={<VehicleLookupPage />} />
        </Routes>
      </main>

      {showChatbot && <ChatbotWidget />}

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