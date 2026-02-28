import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import VehicleRegistration from './components/VehicleRegistration';
import Login from './components/Login';
import './App.css';
import AdminPanel from './pages/AdminPanel';

function App() {
  return (
    <Router>
      <div className="app-layout" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        
<main className="main-content" style={{ flex: '1', padding: '2rem 0' }}>          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/registro" element={<VehicleRegistration />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}

export default App;