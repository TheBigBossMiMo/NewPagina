import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Navbar.css';
import logo from '../assets/logo.png';

const Navbar = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // ✅ estado de sesión
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ✅ datos usuario
  const [sessionUser, setSessionUser] = useState(null);

  // ✅ dropdown usuario
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const userMenuRef = useRef(null);

  // ✅ refrescar estado de auth
  const refreshAuth = () => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('session_user');

    setIsLoggedIn(!!token);

    try {
      setSessionUser(storedUser ? JSON.parse(storedUser) : null);
    } catch {
      setSessionUser(null);
    }
  };

  useEffect(() => {
    setIsMenuOpen(false);
    setIsUserDropdownOpen(false);
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

  // ✅ cerrar dropdown al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
    localStorage.removeItem('session_user');
    localStorage.removeItem('google_user');
    localStorage.removeItem('remember_me');

    setIsLoggedIn(false);
    setSessionUser(null);
    setIsMenuOpen(false);
    setIsUserDropdownOpen(false);

    window.dispatchEvent(new Event('auth-changed'));
    navigate('/');
  };

  // ✅ helper para marcar links activos
  const isActiveRoute = (routes) => {
    return routes.includes(location.pathname);
  };

  const isVehiculosActive = () => {
    return [
      '/registro',
      '/vehiculos',
      '/mis-vehiculos',
      '/registrar-vehiculo',
      '/editar-vehiculo',
      '/eliminar-vehiculo'
    ].includes(location.pathname);
  };

  const getUserInitial = () => {
    const name = sessionUser?.fullName || sessionUser?.email || 'U';
    return name.charAt(0).toUpperCase();
  };

  const getDisplayName = () => {
    if (!sessionUser) return 'Usuario';
    return sessionUser.fullName || sessionUser.email || 'Usuario';
  };

  const getDisplayEmail = () => {
    return sessionUser?.email || 'Sin correo';
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
            className={`nav-link-pill ${isActiveRoute(['/']) ? 'active-nav-link' : ''}`}
          >
            Inicio
          </Link>
        </li>

        <li>
          <Link
            to="/informacion"
            className={`nav-link-pill ${isActiveRoute(['/informacion']) ? 'active-nav-link' : ''}`}
          >
            Información
          </Link>
        </li>

        {!isLoggedIn && (
          <>
            <li>
              <Link
                to="/registrarse-usuario"
                className={`nav-link-pill ${isActiveRoute(['/registrarse-usuario']) ? 'active-nav-link' : ''}`}
              >
                Registrarse
              </Link>
            </li>

            <li>
              <Link
                to="/login"
                className={`login-btn ${isActiveRoute(['/login']) ? 'active-login-btn' : ''}`}
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
                className={`nav-link-pill ${isVehiculosActive() ? 'active-nav-link' : ''}`}
              >
                Vehículos
              </Link>
            </li>

            <li>
              <Link
                to="/perfil"
                className={`nav-link-pill ${isActiveRoute(['/perfil']) ? 'active-nav-link' : ''}`}
              >
                Mi Perfil
              </Link>
            </li>

            <li>
              <Link
                to="/admin"
                className={`nav-link-pill admin-link ${isActiveRoute(['/admin']) ? 'active-nav-link' : ''}`}
              >
                Contingencia
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
          <>
            <li className="navbar-notification-item">
              <button
                type="button"
                className="navbar-icon-btn"
                aria-label="Notificaciones"
                title="Notificaciones"
              >
                🔔
              </button>
            </li>

            <li className="navbar-user-wrapper" ref={userMenuRef}>
              <button
                type="button"
                className="navbar-user-btn"
                onClick={() => setIsUserDropdownOpen((prev) => !prev)}
                aria-label="Abrir menú de usuario"
              >
                {sessionUser?.picture ? (
                  <img
                    src={sessionUser.picture}
                    alt={getDisplayName()}
                    className="navbar-user-avatar"
                  />
                ) : (
                  <div className="navbar-user-avatar navbar-user-fallback">
                    {getUserInitial()}
                  </div>
                )}
              </button>

              {isUserDropdownOpen && (
                <div className="navbar-user-dropdown">
                  <div className="navbar-user-dropdown-header">
                    {sessionUser?.picture ? (
                      <img
                        src={sessionUser.picture}
                        alt={getDisplayName()}
                        className="navbar-user-dropdown-avatar"
                      />
                    ) : (
                      <div className="navbar-user-dropdown-avatar navbar-user-fallback">
                        {getUserInitial()}
                      </div>
                    )}

                    <div className="navbar-user-info">
                      <strong>{getDisplayName()}</strong>
                      <span>{getDisplayEmail()}</span>
                    </div>
                  </div>

                  <div className="navbar-user-dropdown-divider" />

                  <Link
                    to="/perfil"
                    className="navbar-user-dropdown-item"
                    onClick={() => setIsUserDropdownOpen(false)}
                  >
                    Mi perfil
                  </Link>

                  <Link
                    to="/registro"
                    className="navbar-user-dropdown-item"
                    onClick={() => setIsUserDropdownOpen(false)}
                  >
                    Mis vehículos
                  </Link>

                  <button
                    type="button"
                    className="navbar-user-dropdown-item logout-item"
                    onClick={handleLogout}
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </li>

            <li>
              <button onClick={handleLogout} className="login-btn" type="button">
                Salir
              </button>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;