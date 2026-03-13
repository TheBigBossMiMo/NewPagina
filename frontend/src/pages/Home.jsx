import { useEffect, useState } from 'react';
import CirculationStatus from '../components/CirculationStatus';
import calendarioVerificacion from '../assets/calendario_verificacion.png';
import engomadoColores from '../assets/engomado_colores.jpg';
import contingenciaInfo from '../assets/contingencia.jpg';
import avisoVerificacion from '../assets/aviso_verificacion.png';
import './Home.css';

const slides = [
  {
    id: 1,
    type: 'image',
    tag: 'Calendario de verificación',
    title: 'Periodo de verificación vehicular',
    description:
      'Consulta los meses en los que corresponde realizar la verificación de tu vehículo según el color del engomado.',
    image: calendarioVerificacion
  },
  {
    id: 2,
    type: 'image',
    tag: 'Restricción vehicular',
    title: 'Colores de engomado y terminación de placa',
    description:
      'El programa Hoy No Circula determina el día de restricción dependiendo del color del engomado y el último dígito de la placa.',
    image: engomadoColores
  },
  {
    id: 3,
    type: 'image',
    tag: 'Contingencia ambiental',
    title: 'Restricciones por contingencia',
    description:
      'Durante contingencias ambientales las restricciones pueden cambiar y aplicarse a más vehículos para reducir emisiones contaminantes.',
    image: contingenciaInfo
  }
];

const initialModalData = {
  tag: 'Aviso oficial',
  title: 'Calendario de verificación vehicular',
  description:
    'Consulta esta información de referencia para identificar el periodo en el que corresponde verificar tu vehículo.',
  image: avisoVerificacion
};

const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showModal, setShowModal] = useState(true);
  const [selectedSlide, setSelectedSlide] = useState(initialModalData);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const handleOpenModal = (slide) => {
    setSelectedSlide(slide);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <div className="home-page">
      {showModal && (
        <div className="official-modal-overlay">
          <div className="official-modal image-modal">
            <div className="official-modal-header">
              <span className="official-modal-badge info">
                {selectedSlide.tag}
              </span>
              <button
                className="modal-close-x"
                onClick={handleCloseModal}
                aria-label="Cerrar aviso"
              >
                ✕
              </button>
            </div>

            <h2>{selectedSlide.title}</h2>
            <p>{selectedSlide.description}</p>

            <div className="modal-image-wrapper">
              <img
                src={selectedSlide.image}
                alt={selectedSlide.title}
                className="modal-info-image"
              />
            </div>
          </div>
        </div>
      )}

      <section className="home-slider-section">
        <div className="home-slider-card">
          {slides[currentSlide].type === 'image' ? (
            <div className="slider-image-layout">
              <div className="home-slider-content">
                <span className="slide-tag">{slides[currentSlide].tag}</span>
                <h2>{slides[currentSlide].title}</h2>
                <p>{slides[currentSlide].description}</p>
              </div>

              <div className="slider-image-wrapper">
                <img
                  src={slides[currentSlide].image}
                  alt={slides[currentSlide].title}
                  className="slider-info-image clickable-slide-image"
                  onClick={() => handleOpenModal(slides[currentSlide])}
                />
              </div>
            </div>
          ) : (
            <div className="home-slider-content">
              <span className="slide-tag">{slides[currentSlide].tag}</span>
              <h2>{slides[currentSlide].title}</h2>
              <p>{slides[currentSlide].description}</p>
            </div>
          )}

          <div className="slider-dots">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                className={`slider-dot ${index === currentSlide ? 'active' : ''}`}
                onClick={() => setCurrentSlide(index)}
                aria-label={`Ir a la diapositiva ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="hero-section">
        <div className="hero-badge">Sistema Hoy No Circula</div>

        <h1>Bienvenido al Portal Ciudadano</h1>

        <p>
          Consulta de manera rápida y segura si tu vehículo puede circular hoy
          en la CDMX y el Estado de México, además de conocer información del
          programa y avisos relevantes para la ciudadanía.
        </p>
      </section>

      <section className="quick-check-section" id="consulta-rapida">
        <div className="section-header">
          <h2>Consulta rápida Hoy No Circula</h2>
          <p>
            Ingresa los datos de tu vehículo para verificar si puede transitar
            el día de hoy.
          </p>
        </div>

        <div className="home-widget-container">
          <CirculationStatus />
        </div>
      </section>

      <section className="features-section">
        <div className="section-header">
          <h2>¿Qué puedes hacer en el sistema?</h2>
          <p>
            Este portal fue diseñado para apoyar a los ciudadanos en la consulta
            vehicular y el acceso a información relevante del programa.
          </p>
        </div>

        <div className="features-grid improved-features-grid">
          <article className="feature-card pro-card">
            <div className="feature-icon-circle">🔎</div>
            <h3>Consulta rápida</h3>
            <p>
              Verifica de forma inmediata el estatus de circulación de tu
              vehículo con base en sus datos principales.
            </p>
          </article>

          <article className="feature-card pro-card">
            <div className="feature-icon-circle">ℹ️</div>
            <h3>Información del programa</h3>
            <p>
              Conoce cómo funciona el programa Hoy No Circula, sus reglas
              generales y su objetivo ambiental.
            </p>
          </article>

          <article className="feature-card pro-card">
            <div className="feature-icon-circle">👤</div>
            <h3>Registro de usuario</h3>
            <p>
              Crea una cuenta para acceder a más servicios y administrar tu
              información dentro del sistema.
            </p>
          </article>

          <article className="feature-card pro-card">
            <div className="feature-icon-circle">🔐</div>
            <h3>Inicio de sesión</h3>
            <p>
              Accede al portal para consultar funciones avanzadas y dar
              seguimiento a tu información.
            </p>
          </article>
        </div>
      </section>

      <section className="visitor-section">
        <div className="section-header">
          <h2>Funciones para usuario visitante</h2>
          <p>
            Sin iniciar sesión, el usuario puede acceder a las funciones
            principales de consulta e información.
          </p>
        </div>

        <div className="visitor-flow">
          <div className="visitor-step">
            <div className="step-number">01</div>
            <div className="step-content">
              <h4>Inicio</h4>
            </div>
          </div>

          <div className="flow-arrow">→</div>

          <div className="visitor-step">
            <div className="step-number">02</div>
            <div className="step-content">
              <h4>Consulta rápida</h4>
              <p>Hoy No Circula</p>
            </div>
          </div>

          <div className="flow-arrow">→</div>

          <div className="visitor-step">
            <div className="step-number">03</div>
            <div className="step-content">
              <h4>Información del programa</h4>
            </div>
          </div>

          <div className="flow-arrow">→</div>

          <div className="visitor-step">
            <div className="step-number">04</div>
            <div className="step-content">
              <h4>Login</h4>
            </div>
          </div>

          <div className="flow-arrow">→</div>

          <div className="visitor-step">
            <div className="step-number">05</div>
            <div className="step-content">
              <h4>Registro</h4>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;