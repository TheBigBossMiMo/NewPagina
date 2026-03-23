import { useEffect, useMemo, useState } from 'react';
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

const normalizeLookupResponse = (data, cleanPlate, cleanState) => {
  const payload = data?.data || data;

  const vehicle =
    payload?.vehicle ||
    payload?.vehiculo || {
      placa: payload?.placa || cleanPlate,
      modelo: payload?.modelo || payload?.marca || 'Sin información',
      holograma: payload?.holograma || 'Sin información',
      entidad: payload?.entidad || payload?.estado || cleanState || 'Sin información'
    };

  const verification =
    payload?.verification ||
    payload?.verificacion || {
      estatus: payload?.estatus || (payload?.circula ? 'Puede circular' : 'Restricción activa'),
      debeVerificar:
        payload?.debeVerificar ??
        payload?.debe_verificar ??
        payload?.requiereVerificacion ??
        (payload?.circula ? 'No' : 'Sí'),
      motivo:
        payload?.motivo ||
        payload?.mensaje ||
        payload?.razon ||
        'Consulta procesada correctamente.',
      terminacion: payload?.terminacion || 'Sin información',
      engomado: payload?.engomado || 'Sin información',
      periodoActual: payload?.periodoActual || payload?.periodo || 'Sin información',
      periodoSiguiente: payload?.periodoSiguiente || 'Sin información',
      meses: payload?.meses || 'Sin información',
      fechaLimite: payload?.fechaLimite || 'Sin información',
      costoEstimado: payload?.costoEstimado || 'Sin información',
      nota: payload?.nota || payload?.mensaje || 'Sin información',
      documentos: Array.isArray(payload?.documentos) ? payload.documentos : []
    };

  return { vehicle, verification };
};

const AdminPanel = () => {
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showContingencyModal, setShowContingencyModal] = useState(false);

  const [plate, setPlate] = useState('');
  const [lookupState, setLookupState] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [lookupVehicle, setLookupVehicle] = useState(null);
  const [lookupVerification, setLookupVerification] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  const [statusPlate, setStatusPlate] = useState('');
  const [statusState, setStatusState] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [statusVehicle, setStatusVehicle] = useState(null);
  const [statusVerification, setStatusVerification] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const statusMeta = useMemo(() => {
    if (!statusVehicle || !statusVerification) return null;
    return buildStatusMeta(statusVehicle, statusVerification);
  }, [statusVehicle, statusVerification]);

  useEffect(() => {
    setShowContingencyModal(true);
  }, []);

  const scrollToSection = (id) => {
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  };

  const handleContingencyOption = (option) => {
    setShowContingencyModal(false);

    if (option === 'verificacion') {
      scrollToSection('verificacion-section');
      return;
    }

    if (option === 'estado') {
      scrollToSection('estado-section');
      return;
    }

    if (option === 'calendario') {
      setShowCalendarModal(true);
      return;
    }

    if (option === 'mapa') {
      setShowMapModal(true);
    }
  };

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

  const handleCloseContingencyModal = () => {
    setShowContingencyModal(false);
  };

  const handleCloseVerificationModal = () => {
    setShowVerificationModal(false);
  };

  const handleCloseStatusModal = () => {
    setShowStatusModal(false);
  };

  const handleResetLookup = () => {
    setPlate('');
    setLookupState('');
    setLookupError('');
    setLookupVehicle(null);
    setLookupVerification(null);
    setShowVerificationModal(false);
  };

  const handleResetStatusLookup = () => {
    setStatusPlate('');
    setStatusState('');
    setStatusError('');
    setStatusVehicle(null);
    setStatusVerification(null);
    setShowStatusModal(false);
  };

  const fetchVehicleLookup = async (rawPlate, rawState) => {
    const cleanPlate = String(rawPlate || '').trim().toUpperCase();
    const cleanState = String(rawState || '').trim().toUpperCase();

    if (!cleanPlate) {
      throw new Error('Ingresa una placa para consultar.');
    }

    if (!cleanState || !['CDMX', 'EDOMEX'].includes(cleanState)) {
      throw new Error('Debes seleccionar una entidad válida: CDMX o EDOMEX.');
    }

    const response = await fetch(
      `${API_BASE}/api/circula/${encodeURIComponent(cleanPlate)}?estado=${encodeURIComponent(cleanState)}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json'
        }
      }
    );

    const contentType = response.headers.get('content-type') || '';
    const rawText = await response.text();

    let data = null;

    if (rawText) {
      if (contentType.includes('application/json') || rawText.trim().startsWith('{')) {
        try {
          data = JSON.parse(rawText);
        } catch (error) {
          throw new Error('La respuesta del servidor no contiene JSON válido.');
        }
      }
    }

    if (!response.ok) {
      throw new Error(
        data?.message ||
          data?.error ||
          `Error ${response.status}: no fue posible consultar el vehículo.`
      );
    }

    if (!data) {
      throw new Error('El backend devolvió una respuesta inválida.');
    }

    return normalizeLookupResponse(data, cleanPlate, cleanState);
  };

  const handleLookupVehicle = async (e) => {
    e.preventDefault();

    try {
      setLookupLoading(true);
      setLookupError('');
      setLookupVehicle(null);
      setLookupVerification(null);

      const result = await fetchVehicleLookup(plate, lookupState);

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

      const result = await fetchVehicleLookup(statusPlate, statusState);

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
                <h3>Mapa de Centros de Verificación</h
