import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

function App() {
  return (
    <Router>
      <div className="app-layout">
        <Navbar />
        
        {/* El main-content empuja al Footer hacia abajo gracias a flex: 1 */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/registro" element={<VehicleRegistration />} />
            <Route path="/perfil" element={<Profile />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfUse />} />



          </Routes>
        </main>

        <ChatbotWidget />
        <Footer />
      </div>
    </Router>
  );
}

export default App;