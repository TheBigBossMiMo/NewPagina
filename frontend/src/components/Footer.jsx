import './Footer.css';
import { Link } from "react-router-dom";

const Footer = () => {
  // Obtenemos el año actual automáticamente
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-container">
      <div className="footer-content">

        {/* Información del Proyecto */}
        <div className="footer-brand">
          <p>© {currentYear} Sistema de Gestión Vehicular CDMX.</p>
          <p className="footer-subtitle">
            Proyecto Universitario - Grupo ITIC-901M
          </p>
        </div>

        {/* Enlaces Rápidos */}
        <nav className="footer-links" aria-label="Enlaces del pie de página">
          <Link to="/privacy">Aviso de Privacidad</Link>
          <a href="#terminos">Términos de Uso</a>
          <a href="#contacto">Soporte</a>
        </nav>

      </div>
    </footer>
  );
};

export default Footer;