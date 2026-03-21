import { useState } from 'react';
import './AdminPanel.css';

import verificacionImg from '../assets/verificacion_vehicular.png';
import calendarioImg from '../assets/calendario_verificacion.png';
import estadoImg from '../assets/estado_verificacion.png';
import MapaVerificentros from '../components/MapaVerificentros';

const API_BASE =
  window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : 'https://hoynocircula-backend.onrender.com';

const imageSections = [
  {
    id: 1,
    title: 'Verificación Vehicular',
    image: verificacionImg,
    alt: 'Verificación Vehicular',
    badge: 'Consulta por placa',
    description:
      'Consulta por placa la información del vehículo registrada en el sistema y visualiza de forma ordenada si le toca verificar, fechas, costos y documentos sugeridos.'
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

  const [plate, setPlate] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [lookupVehicle, setLookupVehicle] = useState(null);
  const [lookupVerification, setLookupVerification] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  const handleOpenImage = (section) => {
    setSelectedImage(section);
  };

  const handleCloseImage = () => {
    setSelectedImage(null);
  };

  const handleCloseMapModal = () => {
    setShowMapModal(false);
  };

  const handleCloseVerificationModal = () => {
    setShowVerificationModal(false);
  };

  const handleResetLookup = () => {
    setPlate('');
    setLookupError('');
    setLookupVehicle(null);
    setLookupVerification(null);
    setShowVerificationModal(false);
  };

  const handleLookupVehicle = async (e) => {
    e.preventDefault();

    const cleanPlate = plate.trim().toUpperCase();

    if (!cleanPlate) {
      setLookupError('Ingresa una placa para consultar.');
      setLookupVehicle(null);
      setLookupVerification(null);
      return;
    }

    try {
      setLookupLoading(true);
      setLookupError('');
      setLookupVehicle(null);
      setLookupVerification(null);

      const response = await fetch(
        `${API_BASE}/api/lookup/vehicle/${encodeURIComponent(cleanPlate)}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'No fue posible consultar el vehículo.');
      }

      setLookupVehicle(data.vehicle || null);
      setLookupVerification(data.verification || null);
      setShowVerificationModal(true);
    } catch (error) {
      setLookupError(error.message || 'Ocurrió un error al consultar la placa.');
      setShowVerificationModal(false);
    } finally {
      setLookupLoading(false);
    }
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
                onClick={handleCloseMapModal}
                aria-label="Cerrar mapa"
              >
                ✕
              </button>
            </div>

            <p className="image-modal-text">
              En esta sección puedes consultar un mapa interactivo con apartados para
              CDMX y Estado de México, mostrando verificentros de forma dinámica
              dentro del listado y sobre el mapa.
            </p>

            <div className="map-frame-wrapper">
              <MapaVerificentros />
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

      {showVerificationModal && lookupVehicle && lookupVerification && (
        <div className="image-modal-overlay">
          <div className="image-modal verification-modal-custom">
            <div className="image-modal-header">
              <div>
                <span className="image-modal-badge">Resultado de consulta</span>
                <h3>Información de Verificación Vehicular</h3>
              </div>

              <button
                type="button"
                className="modal-close-btn"
                onClick={handleCloseVerificationModal}
                aria-label="Cerrar resultado"
              >
                ✕
              </button>
            </div>

            <p className="image-modal-text">
              Consulta generada con base en la placa registrada en el sistema. Aquí se
              muestran los datos del vehículo y la información de verificación de forma
              más amplia y ordenada.
            </p>

            <div className="vehicle-modal-layout">
              <div className="vehicle-result-panel">
                <h4>Datos del vehículo</h4>

                <div className="vehicle-result-grid">
                  <div className="vehicle-result-card">
                    <span>Placa</span>
                    <strong>{lookupVehicle.placa}</strong>
                  </div>

                  <div className="vehicle-result-card">
                    <span>Modelo</span>
                    <strong>{lookupVehicle.modelo}</strong>
                  </div>

                  <div className="vehicle-result-card">
                    <span>Holograma</span>
                    <strong>{lookupVehicle.holograma}</strong>
                  </div>

                  <div className="vehicle-result-card">
                    <span>Entidad</span>
                    <strong>{lookupVehicle.entidad}</strong>
                  </div>
                </div>
              </div>

              <div className="vehicle-result-panel">
                <h4>Información de verificación</h4>

                <div
                  className={`vehicle-status-banner ${
                    lookupVerification.debeVerificar === 'Sí'
                      ? 'vehicle-status-expired'
                      : 'vehicle-status-valid'
                  }`}
                >
                  <span className="vehicle-status-pill">
                    {lookupVerification.estatus}
                  </span>

                  <h4>
                    {lookupVerification.debeVerificar === 'Sí'
                      ? 'Sí te toca verificar'
                      : 'No te toca verificar por ahora'}
                  </h4>

                  <p>{lookupVerification.motivo}</p>
                </div>

                <div className="vehicle-result-grid">
                  <div className="vehicle-result-card">
                    <span>Terminación</span>
                    <strong>{lookupVerification.terminacion}</strong>
                  </div>

                  <div className="vehicle-result-card">
                    <span>Engomado</span>
                    <strong>{lookupVerification.engomado}</strong>
                  </div>

                  <div className="vehicle-result-card">
                    <span>Periodo actual</span>
                    <strong>{lookupVerification.periodoActual}</strong>
                  </div>

                  <div className="vehicle-result-card">
                    <span>Próximo periodo</span>
                    <strong>{lookupVerification.periodoSiguiente}</strong>
                  </div>

                  <div className="vehicle-result-card">
                    <span>Meses</span>
                    <strong>{lookupVerification.meses}</strong>
                  </div>

                  <div className="vehicle-result-card">
                    <span>Fecha límite</span>
                    <strong>{lookupVerification.fechaLimite}</strong>
                  </div>

                  <div className="vehicle-result-card vehicle-result-card-full">
                    <span>Costo estimado</span>
                    <strong>{lookupVerification.costoEstimado}</strong>
                  </div>

                  <div className="vehicle-result-card vehicle-result-card-full">
                    <span>Nota</span>
                    <strong>{lookupVerification.nota}</strong>
                  </div>
                </div>

                <div className="vehicle-documents-panel">
                  <h5>Documentos sugeridos</h5>
                  <ul>
                    {(lookupVerification.documentos || []).map((doc, index) => (
                      <li key={`${doc}-${index}`}>{doc}</li>
                    ))}
                  </ul>
                </div>

                <div className="verification-modal-actions">
                  <button
                    type="button"
                    className="vehicle-secondary-btn"
                    onClick={handleCloseVerificationModal}
                  >
                    Cerrar resultado
                  </button>

                  <button
                    type="button"
                    className="vehicle-outline-btn"
                    onClick={handleResetLookup}
                  >
                    Nueva consulta
                  </button>
                </div>
              </div>
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

            {section.id === 1 ? (
              <div className="vehicle-tool-wrapper">
                <form className="vehicle-tool-form" onSubmit={handleLookupVehicle}>
                  <div className="vehicle-field vehicle-field-full">
                    <label htmlFor="vehicle-lookup-plate">Placa</label>
                    <input
                      id="vehicle-lookup-plate"
                      type="text"
                      value={plate}
                      onChange={(e) => {
                        setPlate(e.target.value.toUpperCase());
                        if (lookupError) setLookupError('');
                      }}
                      placeholder="Ej. ABC123D"
                    />
                  </div>

                  {lookupError && (
                    <small className="vehicle-error">{lookupError}</small>
                  )}

                  <div className="vehicle-actions">
                    <button type="submit" className="section-action-btn">
                      {lookupLoading ? 'Consultando...' : 'Consultar vehículo'}
                    </button>

                    <button
                      type="button"
                      className="vehicle-secondary-btn"
                      onClick={handleResetLookup}
                    >
                      Limpiar
                    </button>
                  </div>
                </form>

                <div className="vehicle-query-note">
                  <div className="vehicle-query-note-icon">🚗</div>
                  <div>
                    <h4>Consulta desde base de datos</h4>
                    <p>
                      Ingresa la placa para abrir un resultado más amplio con datos del
                      vehículo, periodo, fecha límite, costo y documentos sugeridos.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="section-action-btn"
                onClick={() => handleOpenImage(section)}
              >
                Ver imagen en grande
              </button>
            )}
          </div>

          {section.id === 1 ? (
            <div className="verification-preview-card">
              <div className="verification-preview-badge">Resultado ampliado</div>
              <div className="verification-preview-icon">📄</div>
              <h4>Consulta ordenada y en grande</h4>
              <p>
                Al consultar la placa, el sistema abrirá un modal con la información
                completa del vehículo y su verificación para evitar que todo se vea
                amontonado en la tarjeta principal.
              </p>

              <div className="verification-preview-pills">
                <span>Placa</span>
                <span>Periodo</span>
                <span>Costo</span>
                <span>Documentos</span>
              </div>
            </div>
          ) : (
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
          )}
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