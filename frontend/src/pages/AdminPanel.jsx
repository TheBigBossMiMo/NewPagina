import { useMemo, useState } from 'react';
import './AdminPanel.css';

import verificacionImg from '../assets/verificacion_vehicular.png';
import estadoImg from '../assets/estado_verificacion.png';
import MapaVerificentros from '../components/MapaVerificentros';
import VerificationCalendarPanel from '../components/VerificationCalendarPanel';

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
    alt: 'Calendario de Verificación',
    badge: 'Calendario oficial',
    description:
      'Consulta el calendario de verificación de forma clara según el color del engomado y la terminación de placa, con una vista organizada dentro del panel principal.'
  },
  {
    id: 3,
    title: 'Estado de Verificación del Vehículo',
    image: estadoImg,
    alt: 'Estado de Verificación del Vehículo',
    badge: 'Estado vehicular',
    description:
      'Consulta por placa un resumen rápido del estado de verificación del vehículo, con indicadores visuales, periodo, fecha límite y datos relevantes para una revisión más ágil.'
  }
];

const normalizeText = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const isTruthyVerification = (value) => {
  const normalized = normalizeText(value);
  return normalized === 'si' || normalized === 'sí';
};

const isExemptStatus = (verification) => {
  const estatus = normalizeText(verification?.estatus);
  const motivo = normalizeText(verification?.motivo);
  const nota = normalizeText(verification?.nota);

  return (
    estatus.includes('exent') ||
    motivo.includes('exent') ||
    nota.includes('exent')
  );
};

const buildStatusMeta = (vehicle, verification) => {
  const estatus = verification?.estatus || 'Sin información';
  const shouldVerify = isTruthyVerification(verification?.debeVerificar);
  const exento = isExemptStatus(verification);

  if (exento) {
    return {
      tone: 'exempt',
      badge: 'Exento',
      title: 'Vehículo exento por ahora',
      message:
        verification?.motivo ||
        verification?.nota ||
        'Este vehículo no requiere verificación en este momento según la información disponible.'
    };
  }

  if (shouldVerify) {
    return {
      tone: 'expired',
      badge: estatus || 'Pendiente',
      title: 'Tu vehículo requiere atención de verificación',
      message:
        verification?.motivo ||
        'El sistema indica que sí corresponde realizar la verificación dentro del periodo actual.'
    };
  }

  return {
    tone: 'valid',
    badge: estatus || 'Al corriente',
    title: 'Tu vehículo se encuentra al corriente por ahora',
    message:
      verification?.motivo ||
      'De acuerdo con la información registrada, por ahora no corresponde verificar.'
  };
};

const AdminPanel = () => {
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  const [plate, setPlate] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [lookupVehicle, setLookupVehicle] = useState(null);
  const [lookupVerification, setLookupVerification] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  const [statusPlate, setStatusPlate] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [statusVehicle, setStatusVehicle] = useState(null);
  const [statusVerification, setStatusVerification] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const statusMeta = useMemo(() => {
    if (!statusVehicle || !statusVerification) return null;
    return buildStatusMeta(statusVehicle, statusVerification);
  }, [statusVehicle, statusVerification]);

  const handleOpenImage = (section) => {
    if (section.id === 2 || section.id === 3) return;
    setSelectedImage(section);
  };

  const handleCloseImage = () => {
    setSelectedImage(null);
  };

  const handleCloseMapModal = () => {
    setShowMapModal(false);
  };

  const handleCloseCalendarModal = () => {
    setShowCalendarModal(false);
  };

  const handleCloseVerificationModal = () => {
    setShowVerificationModal(false);
  };

  const handleCloseStatusModal = () => {
    setShowStatusModal(false);
  };

  const handleResetLookup = () => {
    setPlate('');
    setLookupError('');
    setLookupVehicle(null);
    setLookupVerification(null);
    setShowVerificationModal(false);
  };

  const handleResetStatusLookup = () => {
    setStatusPlate('');
    setStatusError('');
    setStatusVehicle(null);
    setStatusVerification(null);
    setShowStatusModal(false);
  };

  const fetchVehicleLookup = async (rawPlate) => {
    const cleanPlate = rawPlate.trim().toUpperCase();

    if (!cleanPlate) {
      throw new Error('Ingresa una placa para consultar.');
    }

    const response = await fetch(
      `${API_BASE}/api/lookup/vehicle/${encodeURIComponent(cleanPlate)}`
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'No fue posible consultar el vehículo.');
    }

    return {
      vehicle: data.vehicle || null,
      verification: data.verification || null
    };
  };

  const handleLookupVehicle = async (e) => {
    e.preventDefault();

    try {
      setLookupLoading(true);
      setLookupError('');
      setLookupVehicle(null);
      setLookupVerification(null);

      const result = await fetchVehicleLookup(plate);

      setLookupVehicle(result.vehicle);
      setLookupVerification(result.verification);
      setShowVerificationModal(true);
    } catch (error) {
      setLookupError(error.message || 'Ocurrió un error al consultar la placa.');
      setShowVerificationModal(false);
    } finally {
      setLookupLoading(false);
    }
  };

  const handleStatusLookup = async (e) => {
    e.preventDefault();

    try {
      setStatusLoading(true);
      setStatusError('');
      setStatusVehicle(null);
      setStatusVerification(null);

      const result = await fetchVehicleLookup(statusPlate);

      setStatusVehicle(result.vehicle);
      setStatusVerification(result.verification);
      setShowStatusModal(true);
    } catch (error) {
      setStatusError(error.message || 'Ocurrió un error al consultar la placa.');
      setShowStatusModal(false);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleOpenStatusDetail = () => {
    if (!statusVehicle || !statusVerification) return;

    setLookupVehicle(statusVehicle);
    setLookupVerification(statusVerification);
    setLookupError('');
    setShowStatusModal(false);
    setShowVerificationModal(true);
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
              Aquí puedes ubicar más fácil los verificentros y revisar opciones cercanas
              para que tengas una referencia rápida antes de salir.
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

      {showCalendarModal && (
        <div className="image-modal-overlay">
          <div className="image-modal verification-modal-custom">
            <div className="image-modal-header">
              <div>
                <span className="image-modal-badge">Calendario dinámico</span>
                <h3>Calendario de Verificación</h3>
              </div>

              <button
                type="button"
                className="modal-close-btn"
                onClick={handleCloseCalendarModal}
                aria-label="Cerrar calendario"
              >
                ✕
              </button>
            </div>

            <p className="image-modal-text">
              Consulta el calendario completo de verificación de forma más ordenada,
              primero con un resumen general y después con filtros divididos por
              engomado y terminación.
            </p>

            <VerificationCalendarPanel />
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
                    isTruthyVerification(lookupVerification.debeVerificar)
                      ? 'vehicle-status-expired'
                      : 'vehicle-status-valid'
                  }`}
                >
                  <span className="vehicle-status-pill">
                    {lookupVerification.estatus}
                  </span>

                  <h4>
                    {isTruthyVerification(lookupVerification.debeVerificar)
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

      {showStatusModal && statusVehicle && statusVerification && statusMeta && (
        <div className="image-modal-overlay">
          <div className="image-modal status-modal-custom">
            <div className="image-modal-header">
              <div>
                <span className="image-modal-badge">Estado del vehículo</span>
                <h3>Estado de Verificación del Vehículo</h3>
              </div>

              <button
                type="button"
                className="modal-close-btn"
                onClick={handleCloseStatusModal}
                aria-label="Cerrar estado"
              >
                ✕
              </button>
            </div>

            <p className="image-modal-text">
              Consulta rápida del estado de verificación con una vista más ejecutiva y
              visual. Puedes abrir después el detalle completo si lo necesitas.
            </p>

            <div className="vehicle-result-panel vehicle-status-summary-panel">
              <div
                className={`vehicle-status-banner ${
                  statusMeta.tone === 'expired'
                    ? 'vehicle-status-expired'
                    : statusMeta.tone === 'exempt'
                      ? 'vehicle-status-exempt'
                      : 'vehicle-status-valid'
                }`}
              >
                <span className="vehicle-status-pill">{statusMeta.badge}</span>
                <h4>{statusMeta.title}</h4>
                <p>{statusMeta.message}</p>
              </div>

              <div className="vehicle-status-quick-info">
                <div className="vehicle-status-quick-chip">
                  <span>Placa</span>
                  <strong>{statusVehicle.placa}</strong>
                </div>
                <div className="vehicle-status-quick-chip">
                  <span>Modelo</span>
                  <strong>{statusVehicle.modelo}</strong>
                </div>
                <div className="vehicle-status-quick-chip">
                  <span>Entidad</span>
                  <strong>{statusVehicle.entidad}</strong>
                </div>
                <div className="vehicle-status-quick-chip">
                  <span>Holograma</span>
                  <strong>{statusVehicle.holograma}</strong>
                </div>
              </div>

              <div className="vehicle-result-grid">
                <div className="vehicle-result-card">
                  <span>Terminación</span>
                  <strong>{statusVerification.terminacion}</strong>
                </div>

                <div className="vehicle-result-card">
                  <span>Engomado</span>
                  <strong>{statusVerification.engomado}</strong>
                </div>

                <div className="vehicle-result-card">
                  <span>Periodo actual</span>
                  <strong>{statusVerification.periodoActual}</strong>
                </div>

                <div className="vehicle-result-card">
                  <span>Próximo periodo</span>
                  <strong>{statusVerification.periodoSiguiente}</strong>
                </div>

                <div className="vehicle-result-card">
                  <span>Meses</span>
                  <strong>{statusVerification.meses}</strong>
                </div>

                <div className="vehicle-result-card">
                  <span>Fecha límite</span>
                  <strong>{statusVerification.fechaLimite}</strong>
                </div>

                <div className="vehicle-result-card vehicle-result-card-full">
                  <span>Costo estimado</span>
                  <strong>{statusVerification.costoEstimado}</strong>
                </div>

                <div className="vehicle-result-card vehicle-result-card-full">
                  <span>Nota</span>
                  <strong>{statusVerification.nota}</strong>
                </div>
              </div>

              <div className="vehicle-documents-panel">
                <h5>Documentos sugeridos</h5>
                <ul>
                  {(statusVerification.documentos || []).map((doc, index) => (
                    <li key={`${doc}-${index}`}>{doc}</li>
                  ))}
                </ul>
              </div>

              <div className="verification-modal-actions vehicle-status-actions">
                <button
                  type="button"
                  className="vehicle-secondary-btn"
                  onClick={handleResetStatusLookup}
                >
                  Nueva consulta
                </button>

                <button
                  type="button"
                  className="vehicle-outline-btn"
                  onClick={handleOpenStatusDetail}
                >
                  Ver detalle completo
                </button>
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
          calendario, estado del vehículo y acceso a un mapa interactivo de centros de
          verificación.
        </p>
      </section>

      {imageSections.map((section) => {
        if (section.id === 2) {
          return (
            <section
              key={section.id}
              className="service-section service-section-single"
            >
              <div className="service-section-content service-section-content-center">
                <span className="service-badge">{section.badge}</span>
                <h3>{section.title}</h3>
                <p>{section.description}</p>

                <div className="verification-preview-card verification-center-card calendar-preview-card">
                  <div className="calendar-preview-top">
                    <div className="verification-preview-badge">
                      Resumen del calendario
                    </div>
                  </div>

                  <div className="calendar-preview-icon-wrap">
                    <div className="verification-preview-icon">🗓️</div>
                  </div>

                  <div className="calendar-preview-content">
                    <h4>Calendario</h4>
                    <p>
                      Consulta rápida por engomado, terminación y periodos en un solo lugar.
                    </p>
                  </div>

                  <div className="verification-preview-pills calendar-preview-pills">
                    <span>Engomado</span>
                    <span>Terminación</span>
                    <span>Periodos</span>
                    <span>Modal</span>
                  </div>

                  <button
                    type="button"
                    className="section-action-btn verification-preview-btn calendar-preview-btn"
                    onClick={() => setShowCalendarModal(true)}
                  >
                    Ver calendario
                  </button>
                </div>
              </div>
            </section>
          );
        }

        if (section.id === 1) {
          return (
            <section
              key={section.id}
              className="service-section service-section-single"
            >
              <div className="service-section-content service-section-content-center">
                <span className="service-badge">{section.badge}</span>
                <h3>{section.title}</h3>
                <p>{section.description}</p>

                <div className="vehicle-tool-wrapper vehicle-tool-wrapper-center">
                  <form
                    className="vehicle-tool-form vehicle-tool-form-centered"
                    onSubmit={handleLookupVehicle}
                  >
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

                    <div className="vehicle-actions vehicle-actions-center">
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
                </div>
              </div>
            </section>
          );
        }

        if (section.id === 3) {
          return (
            <section
              key={section.id}
              className="service-section service-section-single"
            >
              <div className="service-section-content service-section-content-center">
                <span className="service-badge">{section.badge}</span>
                <h3>{section.title}</h3>
                <p>{section.description}</p>

                <div className="vehicle-tool-wrapper vehicle-tool-wrapper-center">
                  <form
                    className="vehicle-tool-form vehicle-tool-form-centered"
                    onSubmit={handleStatusLookup}
                  >
                    <div className="vehicle-field vehicle-field-full">
                      <label htmlFor="vehicle-status-plate">Placa</label>
                      <input
                        id="vehicle-status-plate"
                        type="text"
                        value={statusPlate}
                        onChange={(e) => {
                          setStatusPlate(e.target.value.toUpperCase());
                          if (statusError) setStatusError('');
                        }}
                        placeholder="Ej. ABC123D"
                      />
                    </div>

                    {statusError && (
                      <small className="vehicle-error">{statusError}</small>
                    )}

                    <div className="vehicle-actions vehicle-actions-center">
                      <button type="submit" className="section-action-btn">
                        {statusLoading ? 'Consultando...' : 'Consultar estado'}
                      </button>

                      <button
                        type="button"
                        className="vehicle-secondary-btn"
                        onClick={handleResetStatusLookup}
                      >
                        Limpiar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </section>
          );
        }

        return (
          <section key={section.id} className="service-section">
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
        );
      })}

      <section className="service-section service-map-section">
        <div className="service-section-content">
          <span className="service-badge">Ubicación</span>
          <h3>Mapa de Centros de Verificación</h3>
          <p>
            Aquí puedes ubicar centros de verificación de una manera más práctica y
            darte una idea de cuáles te quedan mejor según tu zona.
          </p>
          <p>
            Te sirve como apoyo rápido para revisar opciones cercanas antes de elegir a
            cuál ir.
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
          <span>Ubica opciones cercanas</span>
        </div>
      </section>
    </div>
  );
};

export default AdminPanel;

