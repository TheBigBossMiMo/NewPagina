import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Navbar.css';
import logo from '../assets/logo.png';

const Navbar = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // ✅ NUEVO: estado de sesión
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // ✅ NUEVO: función para refrescar estado de auth
  const refreshAuth = () => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  };

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  // ✅ NUEVO: checar auth al cargar y cuando cambie la ruta
  useEffect(() => {
    refreshAuth();
  }, [location]);

  // ✅ NUEVO: escuchar evento custom (por si lo disparas desde Login.jsx)
  useEffect(() => {
    const onAuthChanged = () => refreshAuth();
    window.addEventListener('auth-changed', onAuthChanged);
    return () => window.removeEventListener('auth-changed', onAuthChanged);
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstallable(false);
    setDeferredPrompt(null);
  };

  // ✅ NUEVO: logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setIsMenuOpen(false);
    navigate('/'); // ✅ en vez de /login
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">
          <img src={logo} alt="Logo Hoy No Circula" className="navbar-logo" />
        </Link>
      </div>

      {/* Botón Hamburguesa para móviles */}
      <button className="mobile-menu-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
        {isMenuOpen ? '✖' : '☰'}
      </button>

      <ul className={`navbar-links ${isMenuOpen ? 'active' : ''}`}>
        <li><Link to="/">Inicio</Link></li>

        {/* ✅ SOLO si hay sesión */}
        {isLoggedIn && (
          <>
            <li><Link to="/registro">Mis Vehículos</Link></li>
            <li><Link to="/admin" style={{ color: '#fd7e14' }}>Panel Admin</Link></li>
            <li><Link to="/perfil">Mi Perfil</Link></li>
          </>
        )}

        {isInstallable && (
          <li>
            <button onClick={handleInstallClick} className="btn-descargar">
              ⬇️ App
            </button>
          </li>
        )}

        {/* ✅ Si NO hay sesión: Login | Si SÍ: Salir */}
        {!isLoggedIn ? (
          <li><Link to="/login" className="login-btn">Login</Link></li>
        ) : (
          <li>
            <button onClick={handleLogout} className="login-btn">
              Salir
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;