import './Footer.css';

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
          <a href="#privacidad">Aviso de Privacidad</a>
          <a href="#terminos">Términos de Uso</a>
          <a href="#contacto">Soporte</a>
        </nav>

      </div>
    </footer>
  );
};

export default Footer;