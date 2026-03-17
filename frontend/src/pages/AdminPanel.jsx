import { useState } from 'react';
import './AdminPanel.css';

import verificacionImg from '../assets/verificacion_vehicular.png';
import calendarioImg from '../assets/calendario_verificacion.png';
import estadoImg from '../assets/estado_verificacion.png';

const imageSections = [
  {
    id: 1,
    title: 'Verificación Vehicular',
    image: verificacionImg,
    alt: 'Verificación Vehicular',
    badge: 'Consulta visual',
    description:
      'En esta sección puedes visualizar información general sobre la verificación vehicular, incluyendo criterios básicos relacionados con hologramas, periodos y validaciones aplicables al vehículo.'
  },
  {
    id: 2,
    title: 'Calendario de Verificación',
    image: calendarioImg,
    alt: 'Calendario de Verificación',
    badge: 'Calendario oficial',
    description:
      'Aquí se muestra el calendario de verificación para identificar el periodo correspondiente según el color del engomado y la terminación de placa. Esto permite consultar con mayor claridad cuándo corresponde verificar.'
  },
  {
    id: 3,
    title: 'Estado de Verificación del Vehículo',
    image: estadoImg,
    alt: 'Estado de Verificación del Vehículo',
    badge: 'Estado vehicular',
    description:
      'Esta referencia permite entender visualmente el estado de verificación del vehículo y los elementos que se consideran al momento de revisar si cumple con las disposiciones establecidas.'
  }
];

const AdminPanel = () => {
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const handleOpenImage = (section) => {
    setSelectedImage(section);
  };

  const handleCloseImage = () => {
    setSelectedImage(null);
  };

  return (
    <div className="admin-container">
      {selectedImage && (
        <div className="image-modal-overlay">
          <div className="image-modal">
            <div className="image-modal-header">
              <div>
                <span className="image-modal-badge">{selectedImage.badge}</span>
                <h3>{selectedImage.title}</h3>
              </div>

              <button
                type="button"
                className="modal-close-btn"
                onClick={handleCloseImage}
                aria-label="Cerrar imagen"
              >
                ✕
              </button>
            </div>

            <p className="image-modal-text">{selectedImage.description}</p>

            <div className="image-modal-preview">
              <img
                src={selectedImage.image}
                alt={selectedImage.alt}
                className="image-modal-img"
              />
            </div>
          </div>
        </div>
      )}

      {showMapModal && (
        <div className="image-modal-overlay">
          <div className="image-modal map-modal-custom">
            <div className="image-modal-header">
              <div>
                <span className="image-modal-badge">Mapa interactivo</span>
                <h3>Mapa de Centros de Verificación</h3>
              </div>

              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowMapModal(false)}
                aria-label="Cerrar mapa"
              >
                ✕
              </button>
            </div>

            <p className="image-modal-text">
              En esta sección puedes consultar una vista interactiva de apoyo para ubicar
              centros de verificación. Más adelante puedes conectar este módulo con una API
              más completa o con ubicaciones reales personalizadas.
            </p>

            <div className="map-frame-wrapper">
              <iframe
                title="Mapa de Centros de Verificación"
                className="map-frame"
                src="https://www.openstreetmap.org/export/embed.html?bbox=-99.40%2C19.20%2C-98.80%2C19.70&layer=mapnik"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <div className="map-actions">
              <a
                href="https://www.openstreetmap.org/#map=11/19.4326/-99.1332"
                target="_blank"
                rel="noreferrer"
                className="section-action-btn"
              >
                Abrir mapa completo
              </a>
            </div>
          </div>
        </div>
      )}

      <section className="services-hero">
        <span className="services-hero-badge">Servicios del módulo</span>
        <h2>Servicios de Verificación</h2>
        <p>
          Consulta información visual relevante sobre verificación vehicular,
          calendario, estado del vehículo y acceso a un mapa interactivo de
          centros de verificación.
        </p>
      </section>

      {imageSections.map((section, index) => (
        <section
          key={section.id}
          className={`service-section ${index % 2 === 1 ? 'reverse' : ''}`}
        >
          <div className="service-section-content">
            <span className="service-badge">{section.badge}</span>
            <h3>{section.title}</h3>
            <p>{section.description}</p>

            <button
              type="button"
              className="section-action-btn"
              onClick={() => handleOpenImage(section)}
            >
              Ver imagen en grande
            </button>
          </div>

          <div
            className="service-section-image"
            onClick={() => handleOpenImage(section)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleOpenImage(section);
              }
            }}
          >
            <img src={section.image} alt={section.alt} />
            <div className="image-zoom-hint">🔍 Clic para ampliar</div>
          </div>
        </section>
      ))}

      <section className="service-section service-map-section">
        <div className="service-section-content">
          <span className="service-badge">Ubicación</span>
          <h3>Mapa de Centros de Verificación</h3>
          <p>
            Accede a una vista interactiva del mapa para ubicar centros de verificación.
            Este apartado puede servir como referencia inicial y después conectarse con
            una API más robusta o con direcciones específicas según tu proyecto.
          </p>

          <button
            type="button"
            className="section-action-btn"
            onClick={() => setShowMapModal(true)}
          >
            Abrir mapa interactivo
          </button>
        </div>

        <div
          className="service-map-preview"
          onClick={() => setShowMapModal(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setShowMapModal(true);
            }
          }}
        >
          <div className="map-preview-icon">📍</div>
          <strong>Centros de Verificación</strong>
          <span>Vista interactiva disponible</span>
        </div>
      </section>
    </div>
  );
};

export default AdminPanel;