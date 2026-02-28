import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // Escucha si el navegador permite instalar la PWA
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Escucha si el usuario ya la instaló para ocultar el botón
    window.addEventListener('appinstalled', () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log('¡App instalada con éxito!');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Muestra el prompt nativo de Chrome/Edge
    deferredPrompt.prompt();
    
    // Espera a que el usuario acepte o rechace
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">🚗 Hoy No Circula</Link>
      </div>
      <ul className="navbar-links">
        <li><Link to="/">Inicio</Link></li>
        <li><Link to="/registro">Mis Vehículos</Link></li>
        <li><Link to="/admin" style={{ color: '#fd7e14' }}>Panel Admin</Link></li>
        <li><Link to="/perfil">Mi Perfil</Link></li>
        
        {/* Renderizado condicional del botón de instalación */}
        {isInstallable && (
          <li>
            <button onClick={handleInstallClick} className="btn-descargar">
              ⬇️ Instalar App
            </button>
          </li>
        )}
        
        <li><Link to="/login" className="login-btn">Iniciar Sesión</Link></li>
      </ul>
    </nav>
  );
};

export default Navbar;