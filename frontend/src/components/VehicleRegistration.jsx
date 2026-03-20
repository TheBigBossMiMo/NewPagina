import { useEffect, useMemo, useState } from 'react';
import './VehicleRegistration.css';

const API_BASE =
  window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : 'https://hoynocircula-backend.onrender.com';

const MIN_MODEL_YEAR = 1950;
const MAX_FUTURE_MODEL_YEARS = 2;

const VehicleRegistration = () => {
  const currentYear = new Date().getFullYear();
  const maxModelYear = currentYear + MAX_FUTURE_MODEL_YEARS;

  const sessionUserRaw = localStorage.getItem('session_user');
  const sessionUser = sessionUserRaw ? JSON.parse(sessionUserRaw) : null;
  const sessionEmail = sessionUser?.email || '';
  const sessionFullName = sessionUser?.fullName || '';

  const [activeTab, setActiveTab] = useState('inicio');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [formData, setFormData] = useState({
    entidad: '',
    placa: '',
    modelo: '',
    holograma: ''
  });

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [resultadoHoy, setResultadoHoy] = useState(null);
  const [calendario, setCalendario] = useState([]);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [savedOk, setSavedOk] = useState(false);

  const [touched, setTouched] = useState({
    entidad: false,
    placa: false,
    modelo: false,
    holograma: false
  });

  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [updatingVehicle, setUpdatingVehicle] = useState(false);
  const [deletingVehicleId, setDeletingVehicleId] = useState('');

  const [editFormData, setEditFormData] = useState({
    entidad: '',
    placa: '',
    modelo: '',
    holograma: ''
  });

  const [editTouched, setEditTouched] = useState({
    entidad: false,
    placa: false,
    modelo: false,
    holograma: false
  });

  const [detailVehicle, setDetailVehicle] = useState(null);
  const [detailCalendar, setDetailCalendar] = useState([]);

  const dayRule = {
    1: [5, 6],
    2: [7, 8],
    3: [3, 4],
    4: [1, 2],
    5: [9, 0]
  };

  const normalizePlate = (value) => {
    return (value || '').toUpperCase().replace(/\s+/g, '').trim();
  };

  const getLastDigit = (plate) => {
    const digits = (plate || '').match(/\d/g);
    if (!digits || digits.length === 0) return null;
    return Number(digits[digits.length - 1]);
  };

  const fmtDate = (d) => {
    const date = new Date(d);
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const dayNameES = (d) => {
    const names = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return names[d.getDay()];
  };

  const getSaturdayNumberInMonth = (date) => {
    return Math.ceil(date.getDate() / 7);
  };

  const isValidPlateFormat = (plate, entidad) => {
    const normalized = normalizePlate(plate);
    const raw = normalized.replace(/-/g, '');

    if (!normalized) return false;

    if (entidad === 'CDMX') {
      return (
        /^[A-Z]{3}-\d{3}$/.test(normalized) ||
        /^\d{3}-[A-Z]{3}$/.test(normalized) ||
        /^[A-Z]{3}\d{3}$/.test(raw) ||
        /^\d{3}[A-Z]{3}$/.test(raw)
      );
    }

    if (entidad === 'EDOMEX') {
      return (
        /^[A-Z]{2}-\d{2}-[A-Z]{2}$/.test(normalized) ||
        /^\d{2}-[A-Z]{2}-\d{2}$/.test(normalized) ||
        /^[A-Z]{2}\d{2}[A-Z]{2}$/.test(raw) ||
        /^\d{2}[A-Z]{2}\d{2}$/.test(raw)
      );
    }

    return false;
  };

  const getPlatePlaceholder = () => {
    return formData.entidad === 'EDOMEX'
      ? 'Ej. AB-12-CD / 12-AB-34 / AB12CD'
      : 'Ej. ABC-123 / 123-ABC / ABC123';
  };

  const getPlateHelper = () => {
    if (formData.entidad === 'CDMX') {
      return 'Formatos válidos CDMX: ABC-123, 123-ABC, ABC123, 123ABC';
    }

    if (formData.entidad === 'EDOMEX') {
      return 'Formatos válidos EDOMEX: AB-12-CD, 12-AB-34, AB12CD, 12AB34';
    }

    return 'Primero selecciona una entidad para validar el formato correcto de la placa.';
  };

  const getEditPlatePlaceholder = () => {
    return editFormData.entidad === 'EDOMEX'
      ? 'Ej. AB-12-CD / 12-AB-34 / AB12CD'
      : 'Ej. ABC-123 / 123-ABC / ABC123';
  };

  const getEditPlateHelper = () => {
    if (editFormData.entidad === 'CDMX') {
      return 'Formatos válidos CDMX: ABC-123, 123-ABC, ABC123, 123ABC';
    }

    if (editFormData.entidad === 'EDOMEX') {
      return 'Formatos válidos EDOMEX: AB-12-CD, 12-AB-34, AB12CD, 12AB34';
    }

    return 'Primero selecciona una entidad para validar el formato correcto de la placa.';
  };

  const getEngomadoInfo = (plate) => {
    const lastDigit = getLastDigit(plate);

    if (lastDigit === null) {
      return {
        label: 'Sin engomado',
        colorName: 'gray',
        digits: 'Sin terminación válida'
      };
    }

    if ([5, 6].includes(lastDigit)) {
      return { label: 'Amarillo', colorName: 'yellow', digits: '5 y 6' };
    }

    if ([7, 8].includes(lastDigit)) {
      return { label: 'Rosa', colorName: 'pink', digits: '7 y 8' };
    }

    if ([3, 4].includes(lastDigit)) {
      return { label: 'Rojo', colorName: 'red', digits: '3 y 4' };
    }

    if ([1, 2].includes(lastDigit)) {
      return { label: 'Verde', colorName: 'green', digits: '1 y 2' };
    }

    return { label: 'Azul', colorName: 'blue', digits: '9 y 0' };
  };

  const evalHoyNoCircula = ({ entidad, placa, holograma }, date = new Date()) => {
    const day = date.getDay();
    const lastDigit = getLastDigit(placa);

    if (!entidad) {
      return {
        status: 'NEUTRO',
        color: 'gray',
        title: 'Selecciona tu entidad',
        detail: 'El semáforo se activa al elegir entidad, placa y holograma.',
        date
      };
    }

    if (!placa || lastDigit === null) {
      return {
        status: 'NEUTRO',
        color: 'gray',
        title: 'Ingresa una placa válida',
        detail: 'Necesito una matrícula válida con el formato correspondiente.',
        date
      };
    }

    if (!holograma) {
      return {
        status: 'NEUTRO',
        color: 'gray',
        title: 'Selecciona holograma',
        detail: 'El semáforo y calendario se activan al elegir holograma.',
        date
      };
    }

    if (day === 0) {
      return {
        status: 'OK',
        color: 'green',
        title: 'Sí circula',
        detail: 'Domingo: sin restricción del programa base.',
        date
      };
    }

    if (day === 6) {
      if (holograma === '00' || holograma === '0') {
        return {
          status: 'OK',
          color: 'green',
          title: 'Sí circula',
          detail: `Sábado: sin restricción para holograma ${holograma}.`,
          date
        };
      }

      if (holograma === '2') {
        return {
          status: 'NO',
          color: 'red',
          title: 'Hoy NO circula',
          detail: 'Sábado: restricción sabatina para holograma 2.',
          date
        };
      }

      if (holograma === '1') {
        const nth = getSaturdayNumberInMonth(date);
        const lastDigit2 = getLastDigit(placa);
        const isOdd = [1, 3, 5, 7, 9].includes(lastDigit2);
        const isEven = [0, 2, 4, 6, 8].includes(lastDigit2);

        if (nth === 5) {
          return {
            status: 'OK',
            color: 'green',
            title: 'Sí circula',
            detail: 'Quinto sábado: sin restricción sabatina para holograma 1.',
            date
          };
        }

        if (nth === 1 || nth === 3) {
          if (isOdd) {
            return {
              status: 'NO',
              color: 'red',
              title: 'Hoy NO circula',
              detail: `Sábado #${nth}: restricción por terminación impar. Tu placa termina en ${lastDigit2}.`,
              date
            };
          }

          return {
            status: 'OK',
            color: 'green',
            title: 'Sí circula',
            detail: `Sábado #${nth}: restricción por terminación impar. Tu placa termina en ${lastDigit2}.`,
            date
          };
        }

        if (nth === 2 || nth === 4) {
          if (isEven) {
            return {
              status: 'NO',
              color: 'red',
              title: 'Hoy NO circula',
              detail: `Sábado #${nth}: restricción por terminación par. Tu placa termina en ${lastDigit2}.`,
              date
            };
          }

          return {
            status: 'OK',
            color: 'green',
            title: 'Sí circula',
            detail: `Sábado #${nth}: restricción por terminación par. Tu placa termina en ${lastDigit2}.`,
            date
          };
        }
      }
    }

    if (holograma === '00' || holograma === '0') {
      return {
        status: 'OK',
        color: 'green',
        title: 'Sí circula',
        detail: `Entre semana: sin restricción para holograma ${holograma}.`,
        date
      };
    }

    if (holograma === '1' || holograma === '2') {
      const restrictedDigits = dayRule[day] || [];
      const isRestrictedToday = restrictedDigits.includes(lastDigit);

      if (isRestrictedToday) {
        return {
          status: 'NO',
          color: 'red',
          title: 'Hoy NO circula',
          detail: `${dayNameES(date)} restringe terminación ${restrictedDigits.join(' y ')}. Tu placa termina en ${lastDigit}.`,
          date
        };
      }

      return {
        status: 'OK',
        color: 'green',
        title: 'Sí circula',
        detail: `${dayNameES(date)} restringe terminación ${restrictedDigits.join(' y ')}. Tu placa termina en ${lastDigit}.`,
        date
      };
    }

    return {
      status: 'NEUTRO',
      color: 'gray',
      title: 'Sin datos',
      detail: 'Completa entidad, placa y holograma.',
      date
    };
  };

  const buildCalendar = (baseFormData, days = 7) => {
    const arr = [];
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      arr.push(evalHoyNoCircula(baseFormData, d));
    }

    return arr;
  };

  const placaOk = useMemo(() => {
    return isValidPlateFormat(formData.placa, formData.entidad);
  }, [formData.placa, formData.entidad]);

  const modeloOk = useMemo(() => {
    const n = Number(formData.modelo);
    return Number.isFinite(n) && n >= MIN_MODEL_YEAR && n <= maxModelYear;
  }, [formData.modelo, maxModelYear]);

  const hologramaOk = useMemo(() => {
    return ['00', '0', '1', '2'].includes(formData.holograma);
  }, [formData.holograma]);

  const entidadOk = useMemo(() => {
    return ['CDMX', 'EDOMEX'].includes(formData.entidad);
  }, [formData.entidad]);

  const isFormValid = entidadOk && placaOk && modeloOk && hologramaOk;

  const editPlacaOk = useMemo(() => {
    return isValidPlateFormat(editFormData.placa, editFormData.entidad);
  }, [editFormData.placa, editFormData.entidad]);

  const editModeloOk = useMemo(() => {
    const n = Number(editFormData.modelo);
    return Number.isFinite(n) && n >= MIN_MODEL_YEAR && n <= maxModelYear;
  }, [editFormData.modelo, maxModelYear]);

  const editHologramaOk = useMemo(() => {
    return ['00', '0', '1', '2'].includes(editFormData.holograma);
  }, [editFormData.holograma]);

  const editEntidadOk = useMemo(() => {
    return ['CDMX', 'EDOMEX'].includes(editFormData.entidad);
  }, [editFormData.entidad]);

  const isEditFormValid = editEntidadOk && editPlacaOk && editModeloOk && editHologramaOk;

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (savedOk) setSavedOk(false);

    if (name === 'entidad') {
      setFormData((prev) => ({
        ...prev,
        entidad: value,
        placa: ''
      }));
      return;
    }

    const finalValue = name === 'placa' ? normalizePlate(value) : value;

    setFormData((prev) => ({
      ...prev,
      [name]: finalValue
    }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    if (name === 'entidad') {
      setEditFormData((prev) => ({
        ...prev,
        entidad: value,
        placa: ''
      }));
      return;
    }

    const finalValue = name === 'placa' ? normalizePlate(value) : value;

    setEditFormData((prev) => ({
      ...prev,
      [name]: finalValue
    }));
  };

  const handleEditBlur = (e) => {
    const { name } = e.target;
    setEditTouched((prev) => ({ ...prev, [name]: true }));
  };

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchVehicles = async () => {
    try {
      setLoadingVehicles(true);

      if (!sessionEmail) {
        setVehicles([]);
        return;
      }

      const response = await fetch(
        `${API_BASE}/api/vehicles?email=${encodeURIComponent(sessionEmail)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'No se pudieron obtener los vehículos.');
      }

      setVehicles(Array.isArray(data.vehicles) ? data.vehicles : []);
    } catch (error) {
      console.error('Error obteniendo vehículos:', error);
      showToast('err', error.message || 'No se pudieron obtener los vehículos.');
    } finally {
      setLoadingVehicles(false);
    }
  };

  const handleClearForm = () => {
    setFormData({
      entidad: '',
      placa: '',
      modelo: '',
      holograma: ''
    });

    setTouched({
      entidad: false,
      placa: false,
      modelo: false,
      holograma: false
    });

    setSavedOk(false);
    setCalendarVisible(false);
    setToast(null);
  };

  const handleEditReset = () => {
    setSelectedVehicleId('');
    setEditFormData({
      entidad: '',
      placa: '',
      modelo: '',
      holograma: ''
    });
    setEditTouched({
      entidad: false,
      placa: false,
      modelo: false,
      holograma: false
    });
  };

  const openVehicleDetail = (vehicle) => {
    setDetailVehicle(vehicle);
    setDetailCalendar(
      buildCalendar(
        {
          entidad: vehicle.entidad || '',
          placa: vehicle.placa || '',
          holograma: vehicle.holograma || ''
        },
        7
      )
    );
  };

  const closeVehicleDetail = () => {
    setDetailVehicle(null);
    setDetailCalendar([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setTouched({
      entidad: true,
      placa: true,
      modelo: true,
      holograma: true
    });

    if (!isFormValid) {
      showToast('warn', '⚠️ Revisa entidad, placa, modelo y holograma.');
      return;
    }

    setSaving(true);

    try {
      if (!sessionEmail) {
        showToast('err', 'Debes iniciar sesión para registrar vehículos.');
        setSaving(false);
        return;
      }

      const payload = {
        email: sessionEmail,
        fullName: sessionFullName,
        entidad: formData.entidad,
        placa: normalizePlate(formData.placa),
        modelo: Number(formData.modelo),
        holograma: formData.holograma
      };

      const response = await fetch(`${API_BASE}/api/vehicles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'No se pudo registrar el vehículo.');
      }

      showToast('ok', '✅ Vehículo registrado correctamente');
      setSavedOk(true);
      setCalendarVisible(false);

      setTouched({
        entidad: false,
        placa: false,
        modelo: false,
        holograma: false
      });

      setFormData({
        entidad: '',
        placa: '',
        modelo: '',
        holograma: ''
      });

      await fetchVehicles();
    } catch (err) {
      console.error(err);
      showToast('err', err.message || '❌ Ocurrió un error al guardar.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateVehicle = async (e) => {
    e.preventDefault();

    setEditTouched({
      entidad: true,
      placa: true,
      modelo: true,
      holograma: true
    });

    if (!selectedVehicleId) {
      showToast('warn', '⚠️ Primero selecciona un vehículo para editar.');
      return;
    }

    if (!isEditFormValid) {
      showToast('warn', '⚠️ Revisa los datos del vehículo a editar.');
      return;
    }

    setUpdatingVehicle(true);

    try {
      if (!sessionEmail) {
        showToast('err', 'Debes iniciar sesión para editar vehículos.');
        setUpdatingVehicle(false);
        return;
      }

      const payload = {
        email: sessionEmail,
        entidad: editFormData.entidad,
        placa: normalizePlate(editFormData.placa),
        modelo: Number(editFormData.modelo),
        holograma: editFormData.holograma
      };

      const response = await fetch(`${API_BASE}/api/vehicles/${selectedVehicleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'No se pudo actualizar el vehículo.');
      }

      showToast('ok', '✅ Vehículo actualizado correctamente');
      handleEditReset();
      await fetchVehicles();
      setActiveTab('ver');
    } catch (error) {
      console.error('Error actualizando vehículo:', error);
      showToast('err', error.message || '❌ Ocurrió un error al actualizar.');
    } finally {
      setUpdatingVehicle(false);
    }
  };

  const handleDeleteVehicle = async (vehicleId, plate) => {
    const confirmed = window.confirm(
      `¿Seguro que deseas eliminar el vehículo con placa ${plate}?`
    );

    if (!confirmed) return;

    try {
      if (!sessionEmail) {
        showToast('err', 'Debes iniciar sesión para eliminar vehículos.');
        return;
      }

      setDeletingVehicleId(vehicleId);

      const response = await fetch(
        `${API_BASE}/api/vehicles/${vehicleId}?email=${encodeURIComponent(sessionEmail)}`,
        {
          method: 'DELETE'
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'No se pudo eliminar el vehículo.');
      }

      showToast('ok', '✅ Vehículo eliminado correctamente');

      if (selectedVehicleId === vehicleId) {
        handleEditReset();
      }

      if (detailVehicle?._id === vehicleId) {
        closeVehicleDetail();
      }

      await fetchVehicles();
    } catch (error) {
      console.error('Error eliminando vehículo:', error);
      showToast('err', error.message || '❌ Ocurrió un error al eliminar.');
    } finally {
      setDeletingVehicleId('');
    }
  };

  useEffect(() => {
    const r = evalHoyNoCircula(formData, new Date());
    setResultadoHoy(r);

    const cal = buildCalendar(formData, 7);
    setCalendario(cal);

    if (isFormValid && !savedOk) {
      setCalendarVisible(true);
    } else {
      setCalendarVisible(false);
    }
  }, [formData, isFormValid, savedOk]);

  useEffect(() => {
    if (activeTab === 'ver' || activeTab === 'editar' || activeTab === 'eliminar') {
      fetchVehicles();
    }
  }, [activeTab]);

  const inputClass = (field, ok) => {
    if (!touched[field]) return '';
    return ok ? 'input-valid' : 'input-invalid';
  };

  const editInputClass = (field, ok) => {
    if (!editTouched[field]) return '';
    return ok ? 'input-valid' : 'input-invalid';
  };

  const handleSelectTab = (tab) => {
    setActiveTab(tab);
    setIsMenuOpen(false);
  };

  const engomadoDetail = detailVehicle ? getEngomadoInfo(detailVehicle.placa) : null;
  const detalleHoy = detailVehicle
    ? evalHoyNoCircula(
        {
          entidad: detailVehicle.entidad,
          placa: detailVehicle.placa,
          holograma: detailVehicle.holograma
        },
        new Date()
      )
    : null;

  return (
    <div className="vehicles-layout">
      <aside className="vehicles-sidebar">
        <h3>Vehículos</h3>
        <p className="vehicles-sidebar-subtext">Gestión del módulo</p>

        <button
          onClick={() => handleSelectTab('inicio')}
          className={activeTab === 'inicio' ? 'active sidebar-home-btn' : 'sidebar-home-btn'}
          type="button"
        >
          🏠 Inicio
        </button>

        <button
          type="button"
          className={`menu-toggle-btn ${isMenuOpen ? 'open' : ''}`}
          onClick={() => setIsMenuOpen((prev) => !prev)}
        >
          <span>📂 Menú</span>
          <span>{isMenuOpen ? '▲' : '▼'}</span>
        </button>

        {isMenuOpen && (
          <div className="vehicles-menu-list">
            <button
              onClick={() => handleSelectTab('registrar')}
              className={activeTab === 'registrar' ? 'active' : ''}
              type="button"
            >
              ➕ Registrar
            </button>

            <button
              onClick={() => handleSelectTab('ver')}
              className={activeTab === 'ver' ? 'active' : ''}
              type="button"
            >
              🚗 Ver vehículos
            </button>

            <button
              onClick={() => handleSelectTab('editar')}
              className={activeTab === 'editar' ? 'active' : ''}
              type="button"
            >
              ✏️ Editar
            </button>

            <button
              onClick={() => handleSelectTab('eliminar')}
              className={activeTab === 'eliminar' ? 'active' : ''}
              type="button"
            >
              🗑️ Eliminar
            </button>
          </div>
        )}
      </aside>

      <div className="vehicles-content">
        {toast && <div className={`toast toast-${toast.type}`}>{toast.text}</div>}

        {activeTab === 'inicio' && (
          <div className="registration-container vehicles-dashboard">
            <div className="dashboard-hero">
              <div className="dashboard-hero-badge">
                <span>🚘</span>
                <span>Panel inteligente de gestión vehicular</span>
              </div>

              <div className="dashboard-hero-main">
                <div className="dashboard-hero-copy">
                  <div className="registration-top">
                    <h2>Dashboard de Vehículos</h2>
                    <p className="registration-subtitle">
                      Administra tus vehículos desde un solo lugar. Usa el menú lateral para acceder a
                      cada función del módulo.
                    </p>
                  </div>

                  <div className="dashboard-hero-chips">
                    <span>Registro rápido</span>
                    <span>Consulta de vehículos</span>
                    <span>Edición segura</span>
                    <span>Eliminación controlada</span>
                  </div>
                </div>

                <div className="dashboard-hero-side">
                  <div className="dashboard-highlight-card">
                    <div className="dashboard-highlight-icon">⚡</div>
                    <strong>Acceso centralizado</strong>
                    <p>
                      Desde este panel puedes iniciar el flujo de registro, consulta, edición o
                      eliminación sin salir del módulo.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="vehicles-stats">
              <div className="vehicles-stat-card">
                <span className="vehicles-stat-icon">🚗</span>
                <div>
                  <strong>Vehículos</strong>
                  <p>Gestiona tus registros vehiculares.</p>
                </div>
              </div>

              <div className="vehicles-stat-card">
                <span className="vehicles-stat-icon">📅</span>
                <div>
                  <strong>Consultas</strong>
                  <p>Revisa información de circulación y actualizaciones.</p>
                </div>
              </div>

              <div className="vehicles-stat-card">
                <span className="vehicles-stat-icon">⚙️</span>
                <div>
                  <strong>Acciones rápidas</strong>
                  <p>Registra, consulta, edita o elimina datos fácilmente.</p>
                </div>
              </div>
            </div>

            <div className="vehicles-quick-grid">
              <div className="vehicle-quick-card" onClick={() => handleSelectTab('registrar')}>
                <span className="quick-icon">➕</span>
                <h3>Registrar vehículo</h3>
                <p>Agrega un nuevo vehículo con entidad, placa, modelo y holograma.</p>
                <div className="quick-card-footer">Disponible desde el menú lateral</div>
              </div>

              <div className="vehicle-quick-card" onClick={() => handleSelectTab('ver')}>
                <span className="quick-icon">🚗</span>
                <h3>Ver vehículos</h3>
                <p>Consulta los vehículos registrados del usuario.</p>
                <div className="quick-card-footer">Disponible desde el menú lateral</div>
              </div>

              <div className="vehicle-quick-card" onClick={() => handleSelectTab('editar')}>
                <span className="quick-icon">✏️</span>
                <h3>Editar vehículo</h3>
                <p>Actualiza la información de un vehículo registrado.</p>
                <div className="quick-card-footer">Disponible desde el menú lateral</div>
              </div>

              <div className="vehicle-quick-card" onClick={() => handleSelectTab('eliminar')}>
                <span className="quick-icon">🗑️</span>
                <h3>Eliminar vehículo</h3>
                <p>Elimina registros que ya no necesites dentro del sistema.</p>
                <div className="quick-card-footer">Disponible desde el menú lateral</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'registrar' && (
          <div className="registration-shell">
            <div className="registration-container">
              <div className="registration-top">
                <h2>Registrar Vehículo</h2>
                <p className="registration-subtitle">
                  Añade un auto a tu garaje para gestionar su circulación y futuras consultas.
                </p>
              </div>

              <div className="semaforo-card">
                <div className={`semaforo-dot semaforo-${resultadoHoy?.color || 'gray'}`} />
                <div className="semaforo-info">
                  <div className="semaforo-title">{resultadoHoy?.title || 'Semáforo'}</div>
                  <div className="semaforo-detail">{resultadoHoy?.detail || '—'}</div>
                </div>
              </div>

              <form noValidate onSubmit={handleSubmit} className="registration-form">
                <div className="form-grid">
                  <div className="form-group full-row">
                    <label htmlFor="entidad">Entidad</label>
                    <select
                      id="entidad"
                      name="entidad"
                      value={formData.entidad}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={inputClass('entidad', entidadOk)}
                      required
                    >
                      <option value="" disabled>
                        Selecciona tu entidad
                      </option>
                      <option value="CDMX">CDMX</option>
                      <option value="EDOMEX">Estado de México</option>
                    </select>
                    {touched.entidad && !entidadOk && (
                      <small className="hint hint-error">Selecciona una entidad válida.</small>
                    )}
                  </div>

                  <div className="form-group full-row">
                    <label htmlFor="placa">Placa</label>
                    <input
                      type="text"
                      id="placa"
                      name="placa"
                      value={formData.placa}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder={getPlatePlaceholder()}
                      required
                      maxLength={formData.entidad === 'EDOMEX' ? 10 : 7}
                      autoComplete="off"
                      className={inputClass('placa', placaOk)}
                    />

                    <small className="hint">{getPlateHelper()}</small>

                    {touched.placa && !placaOk && (
                      <small className="hint hint-error">
                        {formData.entidad === 'EDOMEX'
                          ? 'Ingresa una placa válida del Estado de México.'
                          : formData.entidad === 'CDMX'
                          ? 'Ingresa una placa válida de CDMX.'
                          : 'Selecciona la entidad y captura una placa válida.'}
                      </small>
                    )}

                    {touched.placa && placaOk && (
                      <small className="hint hint-ok">Placa válida ✅</small>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="modelo">Modelo (Año)</label>
                    <input
                      type="number"
                      id="modelo"
                      name="modelo"
                      value={formData.modelo}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder={`Ej. ${currentYear}`}
                      required
                      min={MIN_MODEL_YEAR}
                      max={maxModelYear}
                      className={inputClass('modelo', modeloOk)}
                    />

                    <small className="hint">
                      Rango permitido: {MIN_MODEL_YEAR} - {maxModelYear}
                    </small>

                    {touched.modelo && !modeloOk && (
                      <small className="hint hint-error">
                        Ingresa un año válido. Se aceptan modelos desde {MIN_MODEL_YEAR} hasta{' '}
                        {maxModelYear}.
                      </small>
                    )}

                    {touched.modelo && modeloOk && (
                      <small className="hint hint-ok">Año válido ✅</small>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="holograma">Holograma</label>
                    <select
                      id="holograma"
                      name="holograma"
                      value={formData.holograma}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      className={inputClass('holograma', hologramaOk)}
                    >
                      <option value="" disabled>
                        Selecciona holograma
                      </option>
                      <option value="00">Holograma 00</option>
                      <option value="0">Holograma 0</option>
                      <option value="1">Holograma 1</option>
                      <option value="2">Holograma 2</option>
                    </select>

                    {touched.holograma && !hologramaOk && (
                      <small className="hint hint-error">Selecciona un holograma válido.</small>
                    )}
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="submit-btn" disabled={!isFormValid || saving}>
                    {saving ? (
                      <>
                        <span className="spinner" /> Guardando...
                      </>
                    ) : (
                      <>
                        <span>💾</span> Guardar Vehículo
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="submit-btn secondary-btn"
                    onClick={handleClearForm}
                    disabled={saving}
                  >
                    <span>🧹</span> Limpiar formulario
                  </button>
                </div>

                {savedOk && (
                  <div className="saved-banner">
                    ✅ Vehículo guardado. Ya quedó registrado en el sistema.
                  </div>
                )}
              </form>

              {calendarVisible && (
                <div className="calendar-card">
                  <div className="calendar-head">
                    <div className="calendar-title">Calendario automático (7 días)</div>
                    <div className="calendar-subtitle">
                      Basado en placa + holograma. Fecha de hoy: {fmtDate(new Date())}
                    </div>
                  </div>

                  <div className="calendar-grid">
                    {calendario.map((item, idx) => (
                      <div key={idx} className={`day-pill pill-${item.color}`}>
                        <div className="day-top">
                          <span className="day-name">{dayNameES(item.date)}</span>
                          <span className="day-date">{fmtDate(item.date)}</span>
                        </div>
                        <div className="day-status">
                          {item.color === 'red'
                            ? '🔴 NO circula'
                            : item.color === 'green'
                            ? '🟢 Sí circula'
                            : '⚪ Sin datos'}
                        </div>
                        <div className="day-reason">{item.detail}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'ver' && (
          <div className="registration-container">
            <div className="registration-top">
              <h2>Ver vehículos</h2>
              <p className="registration-subtitle">
                Aquí se muestran los vehículos registrados en el sistema.
              </p>
            </div>

            {loadingVehicles ? (
              <div className="saved-banner">Cargando vehículos...</div>
            ) : vehicles.length === 0 ? (
              <div className="saved-banner">Aún no hay vehículos registrados.</div>
            ) : (
              <div className="calendar-grid">
                {vehicles.map((vehicle) => (
                  <div key={vehicle._id} className="day-pill">
                    <div className="day-top">
                      <span className="day-name">{vehicle.placa}</span>
                      <span className="day-date">{vehicle.entidad}</span>
                    </div>

                    <div className="day-status">Modelo: {vehicle.modelo}</div>
                    <div className="day-reason">Holograma: {vehicle.holograma}</div>
                    <div className="day-reason">Registrado: {fmtDate(vehicle.createdAt)}</div>

                    <div className="form-actions" style={{ marginTop: '1rem' }}>
                      <button
                        type="button"
                        className="submit-btn secondary-btn"
                        onClick={() => openVehicleDetail(vehicle)}
                      >
                        👁️ Ver detalle
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'editar' && (
          <div className="registration-container">
            <div className="registration-top">
              <h2>Editar vehículo</h2>
              <p className="registration-subtitle">
                Selecciona un vehículo y actualiza su información.
              </p>
            </div>

            {loadingVehicles ? (
              <div className="saved-banner">Cargando vehículos...</div>
            ) : vehicles.length === 0 ? (
              <div className="saved-banner">No hay vehículos disponibles para editar.</div>
            ) : (
              <>
                <div className="form-group full-row" style={{ marginBottom: '1.2rem' }}>
                  <label htmlFor="vehicle-select">Selecciona vehículo</label>
                  <select
                    id="vehicle-select"
                    value={selectedVehicleId}
                    onChange={(e) => {
                      const vehicle = vehicles.find((v) => v._id === e.target.value);
                      if (vehicle) {
                        setSelectedVehicleId(vehicle._id);
                        setEditFormData({
                          entidad: vehicle.entidad || '',
                          placa: vehicle.placa || '',
                          modelo: vehicle.modelo || '',
                          holograma: vehicle.holograma || ''
                        });
                        setEditTouched({
                          entidad: false,
                          placa: false,
                          modelo: false,
                          holograma: false
                        });
                      } else {
                        handleEditReset();
                      }
                    }}
                  >
                    <option value="">Selecciona un vehículo</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle._id} value={vehicle._id}>
                        {vehicle.placa} - {vehicle.entidad}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedVehicleId ? (
                  <form noValidate onSubmit={handleUpdateVehicle} className="registration-form">
                    <div className="form-grid">
                      <div className="form-group full-row">
                        <label htmlFor="edit-entidad">Entidad</label>
                        <select
                          id="edit-entidad"
                          name="entidad"
                          value={editFormData.entidad}
                          onChange={handleEditChange}
                          onBlur={handleEditBlur}
                          className={editInputClass('entidad', editEntidadOk)}
                          required
                        >
                          <option value="" disabled>
                            Selecciona tu entidad
                          </option>
                          <option value="CDMX">CDMX</option>
                          <option value="EDOMEX">Estado de México</option>
                        </select>
                        {editTouched.entidad && !editEntidadOk && (
                          <small className="hint hint-error">Selecciona una entidad válida.</small>
                        )}
                      </div>

                      <div className="form-group full-row">
                        <label htmlFor="edit-placa">Placa</label>
                        <input
                          type="text"
                          id="edit-placa"
                          name="placa"
                          value={editFormData.placa}
                          onChange={handleEditChange}
                          onBlur={handleEditBlur}
                          placeholder={getEditPlatePlaceholder()}
                          required
                          maxLength={editFormData.entidad === 'EDOMEX' ? 10 : 7}
                          autoComplete="off"
                          className={editInputClass('placa', editPlacaOk)}
                        />

                        <small className="hint">{getEditPlateHelper()}</small>

                        {editTouched.placa && !editPlacaOk && (
                          <small className="hint hint-error">
                            {editFormData.entidad === 'EDOMEX'
                              ? 'Ingresa una placa válida del Estado de México.'
                              : editFormData.entidad === 'CDMX'
                              ? 'Ingresa una placa válida de CDMX.'
                              : 'Selecciona la entidad y captura una placa válida.'}
                          </small>
                        )}

                        {editTouched.placa && editPlacaOk && (
                          <small className="hint hint-ok">Placa válida ✅</small>
                        )}
                      </div>

                      <div className="form-group">
                        <label htmlFor="edit-modelo">Modelo (Año)</label>
                        <input
                          type="number"
                          id="edit-modelo"
                          name="modelo"
                          value={editFormData.modelo}
                          onChange={handleEditChange}
                          onBlur={handleEditBlur}
                          placeholder={`Ej. ${currentYear}`}
                          required
                          min={MIN_MODEL_YEAR}
                          max={maxModelYear}
                          className={editInputClass('modelo', editModeloOk)}
                        />

                        <small className="hint">
                          Rango permitido: {MIN_MODEL_YEAR} - {maxModelYear}
                        </small>

                        {editTouched.modelo && !editModeloOk && (
                          <small className="hint hint-error">
                            Ingresa un año válido. Se aceptan modelos desde {MIN_MODEL_YEAR} hasta{' '}
                            {maxModelYear}.
                          </small>
                        )}

                        {editTouched.modelo && editModeloOk && (
                          <small className="hint hint-ok">Año válido ✅</small>
                        )}
                      </div>

                      <div className="form-group">
                        <label htmlFor="edit-holograma">Holograma</label>
                        <select
                          id="edit-holograma"
                          name="holograma"
                          value={editFormData.holograma}
                          onChange={handleEditChange}
                          onBlur={handleEditBlur}
                          required
                          className={editInputClass('holograma', editHologramaOk)}
                        >
                          <option value="" disabled>
                            Selecciona holograma
                          </option>
                          <option value="00">Holograma 00</option>
                          <option value="0">Holograma 0</option>
                          <option value="1">Holograma 1</option>
                          <option value="2">Holograma 2</option>
                        </select>

                        {editTouched.holograma && !editHologramaOk && (
                          <small className="hint hint-error">Selecciona un holograma válido.</small>
                        )}
                      </div>
                    </div>

                    <div className="form-actions">
                      <button
                        type="submit"
                        className="submit-btn"
                        disabled={!isEditFormValid || updatingVehicle}
                      >
                        {updatingVehicle ? 'Actualizando...' : '💾 Guardar cambios'}
                      </button>

                      <button
                        type="button"
                        className="submit-btn secondary-btn"
                        onClick={handleEditReset}
                        disabled={updatingVehicle}
                      >
                        Limpiar selección
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="saved-banner">
                    Selecciona un vehículo para cargar sus datos y editarlo.
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'eliminar' && (
          <div className="registration-container">
            <div className="registration-top">
              <h2>Eliminar vehículo</h2>
              <p className="registration-subtitle">
                Aquí puedes eliminar un vehículo del sistema.
              </p>
            </div>

            {loadingVehicles ? (
              <div className="saved-banner">Cargando vehículos...</div>
            ) : vehicles.length === 0 ? (
              <div className="saved-banner">No hay vehículos disponibles para eliminar.</div>
            ) : (
              <div className="calendar-grid">
                {vehicles.map((vehicle) => (
                  <div key={vehicle._id} className="day-pill pill-red">
                    <div className="day-top">
                      <span className="day-name">{vehicle.placa}</span>
                      <span className="day-date">{vehicle.entidad}</span>
                    </div>

                    <div className="day-status">Modelo: {vehicle.modelo}</div>
                    <div className="day-reason">Holograma: {vehicle.holograma}</div>

                    <div className="form-actions" style={{ marginTop: '1rem' }}>
                      <button
                        type="button"
                        className="submit-btn"
                        onClick={() => handleDeleteVehicle(vehicle._id, vehicle.placa)}
                        disabled={deletingVehicleId === vehicle._id}
                      >
                        {deletingVehicleId === vehicle._id ? 'Eliminando...' : '🗑️ Eliminar'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {detailVehicle && (
        <div className="vehicle-detail-overlay" onClick={closeVehicleDetail}>
          <div
            className="vehicle-detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="vehicle-detail-header">
              <div>
                <h3>Detalle del vehículo</h3>
                <p>Consulta rápida de circulación, engomado y próximos 7 días.</p>
              </div>

              <button
                type="button"
                className="vehicle-detail-close"
                onClick={closeVehicleDetail}
              >
                ✕
              </button>
            </div>

            <div className="vehicle-detail-top-grid">
              <div className="vehicle-detail-main-card">
                <div className="vehicle-detail-plate-row">
                  <div>
                    <div className="vehicle-detail-plate">{detailVehicle.placa}</div>
                    <div className="vehicle-detail-entity">{detailVehicle.entidad}</div>
                  </div>

                  {engomadoDetail && (
                    <div className={`engomado-badge engomado-${engomadoDetail.colorName}`}>
                      <span className="engomado-dot" />
                      <div>
                        <strong>Engomado {engomadoDetail.label}</strong>
                        <small>Terminación {engomadoDetail.digits}</small>
                      </div>
                    </div>
                  )}
                </div>

                <div className="vehicle-detail-data-grid">
                  <div className="vehicle-detail-data-item">
                    <span>Modelo</span>
                    <strong>{detailVehicle.modelo}</strong>
                  </div>

                  <div className="vehicle-detail-data-item">
                    <span>Holograma</span>
                    <strong>{detailVehicle.holograma}</strong>
                  </div>

                  <div className="vehicle-detail-data-item">
                    <span>Registrado</span>
                    <strong>{fmtDate(detailVehicle.createdAt)}</strong>
                  </div>
                </div>
              </div>

              {detalleHoy && (
                <div className={`vehicle-status-card status-${detalleHoy.color}`}>
                  <div className="vehicle-status-label">Estado de hoy</div>
                  <div className="vehicle-status-title">{detalleHoy.title}</div>
                  <div className="vehicle-status-text">{detalleHoy.detail}</div>
                </div>
              )}
            </div>

            <div className="calendar-card detail-calendar-card">
              <div className="calendar-head">
                <div className="calendar-title">Calendario dinámico (7 días)</div>
                <div className="calendar-subtitle">
                  Se actualiza automáticamente a partir del día actual.
                </div>
              </div>

              <div className="detail-calendar-grid">
                {detailCalendar.map((item, idx) => (
                  <div key={idx} className={`day-pill pill-${item.color}`}>
                    <div className="day-top">
                      <span className="day-name">{dayNameES(item.date)}</span>
                      <span className="day-date">{fmtDate(item.date)}</span>
                    </div>

                    <div className="day-status">
                      {item.color === 'red'
                        ? '🔴 NO circula'
                        : item.color === 'green'
                        ? '🟢 Sí circula'
                        : '⚪ Sin datos'}
                    </div>

                    <div className="day-reason">{item.detail}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-actions vehicle-detail-actions">
              <button
                type="button"
                className="submit-btn secondary-btn"
                onClick={() => {
                  closeVehicleDetail();
                  setSelectedVehicleId(detailVehicle._id);
                  setEditFormData({
                    entidad: detailVehicle.entidad || '',
                    placa: detailVehicle.placa || '',
                    modelo: detailVehicle.modelo || '',
                    holograma: detailVehicle.holograma || ''
                  });
                  setEditTouched({
                    entidad: false,
                    placa: false,
                    modelo: false,
                    holograma: false
                  });
                  setActiveTab('editar');
                }}
              >
                ✏️ Ir a editar
              </button>

              <button
                type="button"
                className="submit-btn"
                onClick={closeVehicleDetail}
              >
                Cerrar detalle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleRegistration;