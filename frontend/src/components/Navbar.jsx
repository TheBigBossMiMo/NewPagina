import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Navbar.css';
import logo from '../assets/logo.png';

const Navbar = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // ✅ estado de sesión
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // ✅ refrescar estado de auth
  const refreshAuth = () => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  };

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  // ✅ checar auth al cargar y cuando cambie la ruta
  useEffect(() => {
    refreshAuth();
  }, [location]);

  // ✅ escuchar evento custom
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

    const handleAppInstalled = () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstallable(false);
    setDeferredPrompt(null);
    setIsMenuOpen(false);
  };

  // ✅ logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setIsMenuOpen(false);
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" className="navbar-brand-link">
          <img src={logo} alt="Logo Hoy No Circula" className="navbar-logo" />
        </Link>
      </div>

      <button
        className="mobile-menu-btn"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Abrir menú"
        type="button"
      >
        {isMenuOpen ? '✖' : '☰'}
      </button>

      <ul className={`navbar-links ${isMenuOpen ? 'active' : ''}`}>
        <li>
          <Link
            to="/"
            className={`nav-link-pill ${location.pathname === '/' ? 'active-nav-link' : ''}`}
          >
            Inicio
          </Link>
        </li>

        <li>
          <Link
            to="/informacion"
            className={`nav-link-pill ${location.pathname === '/informacion' ? 'active-nav-link' : ''}`}
          >
            Información
          </Link>
        </li>

        {!isLoggedIn && (
          <>
            <li>
              <Link
                to="/registrarse-usuario"
                className={`nav-link-pill ${location.pathname === '/registrarse-usuario' ? 'active-nav-link' : ''}`}
              >
                Registrarse
              </Link>
            </li>

            <li>
              <Link
                to="/login"
                className={`login-btn ${location.pathname === '/login' ? 'active-login-btn' : ''}`}
              >
                Login
              </Link>
            </li>
          </>
        )}

        {isLoggedIn && (
          <>
            <li>
              <Link
                to="/registro"
                className={`nav-link-pill ${location.pathname === '/registro' ? 'active-nav-link' : ''}`}
              >
                Mis Vehículos
              </Link>
            </li>

            <li>
              <Link
                to="/perfil"
                className={`nav-link-pill ${location.pathname === '/perfil' ? 'active-nav-link' : ''}`}
              >
                Mi Perfil
              </Link>
            </li>

            <li>
              <Link to="/admin" className="nav-link-pill admin-link">
                Panel Admin
              </Link>
            </li>
          </>
        )}

        {isInstallable && (
          <li>
            <button onClick={handleInstallClick} className="btn-descargar" type="button">
              ⬇️ App
            </button>
          </li>
        )}

        {isLoggedIn && (
          <li>
            <button onClick={handleLogout} className="login-btn" type="button">
              Salir
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;