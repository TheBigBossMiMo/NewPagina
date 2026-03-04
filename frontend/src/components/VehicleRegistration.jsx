import { useEffect, useMemo, useState } from 'react';
import './VehicleRegistration.css';

const VehicleRegistration = () => {
  // Calculamos el año dinámicamente para el atributo "max" (+1 por los modelos del siguiente año)
  const currentYear = new Date().getFullYear();
  const maxModelYear = currentYear + 1;

  const [formData, setFormData] = useState({
    entidad: '', // ✅ ahora vacío para obligar a seleccionar
    placa: '',
    modelo: '',
    holograma: '' // ✅ vacío para obligar a seleccionar
  });

  // ✅ AGREGADO: estados UX
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'ok'|'warn'|'err', text: '' }
  const [resultadoHoy, setResultadoHoy] = useState(null); // info del semáforo
  const [calendario, setCalendario] = useState([]); // próximos días
  const [calendarVisible, setCalendarVisible] = useState(false); // ✅ mostrar/ocultar calendario
  const [savedOk, setSavedOk] = useState(false); // ✅ al guardar, ocultar calendario

  // ✅ para no pintar rojo desde el inicio
  const [touched, setTouched] = useState({
    entidad: false,
    placa: false,
    modelo: false,
    holograma: false
  });

  // ---------------------------
  // ✅ LÓGICA: HOY NO CIRCULA
  // ---------------------------

  // Lunes: 5-6, Martes: 7-8, Miércoles: 3-4, Jueves: 1-2, Viernes: 9-0
  const dayRule = {
    1: [5, 6], // Monday
    2: [7, 8], // Tuesday
    3: [3, 4], // Wednesday
    4: [1, 2], // Thursday
    5: [9, 0]  // Friday
  };

  const getLastDigit = (plate) => {
    const digits = (plate || '').match(/\d/g);
    if (!digits || digits.length === 0) return null;
    return Number(digits[digits.length - 1]);
  };

  const fmtDate = (d) => {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const dayNameES = (d) => {
    const names = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return names[d.getDay()];
  };

  // ✅ N-ésimo sábado del mes (1..5)
  const getSaturdayNumberInMonth = (date) => {
    // date es sábado
    return Math.ceil(date.getDate() / 7);
  };

  const evalHoyNoCircula = ({ entidad, placa, holograma }, date = new Date()) => {
    const day = date.getDay(); // 0 dom, 6 sab
    const lastDigit = getLastDigit(placa);

    if (!entidad) {
      return {
        status: 'NEUTRO',
        color: 'gray',
        title: 'Selecciona tu entidad',
        detail: 'El semáforo se activa al elegir entidad, placa y holograma.',
        date,
        entidad
      };
    }

    if (!placa || lastDigit === null) {
      return {
        status: 'NEUTRO',
        color: 'gray',
        title: 'Ingresa una placa válida',
        detail: 'Necesito al menos un dígito en la placa para evaluar.',
        date,
        entidad
      };
    }

    if (!holograma) {
      return {
        status: 'NEUTRO',
        color: 'gray',
        title: 'Selecciona holograma',
        detail: 'El semáforo y calendario se activan al elegir holograma.',
        date,
        entidad
      };
    }

    if (day === 0) {
      return {
        status: 'OK',
        color: 'green',
        title: 'Sí circula',
        detail: 'Domingo: sin restricción del programa base.',
        date,
        entidad
      };
    }

    if (day === 6) {
      if (holograma === '00' || holograma === '0') {
        return {
          status: 'OK',
          color: 'green',
          title: 'Sí circula',
          detail: `Sábado: sin restricción para holograma ${holograma}.`,
          date,
          entidad
        };
      }

      if (holograma === '2') {
        return {
          status: 'NO',
          color: 'red',
          title: 'Hoy NO circula',
          detail: 'Sábado: restricción sabatina para holograma 2.',
          date,
          entidad
        };
      }

      if (holograma === '1') {
        const nth = getSaturdayNumberInMonth(date); // 1..5
        const lastDigit2 = getLastDigit(placa);
        const isOdd = [1, 3, 5, 7, 9].includes(lastDigit2);
        const isEven = [0, 2, 4, 6, 8].includes(lastDigit2);

        if (nth === 5) {
          return {
            status: 'OK',
            color: 'green',
            title: 'Sí circula',
            detail: 'Quinto sábado: sin restricción sabatina para holograma 1.',
            date,
            entidad
          };
        }

        if (nth === 1 || nth === 3) {
          if (isOdd) {
            return {
              status: 'NO',
              color: 'red',
              title: 'Hoy NO circula',
              detail: `Sábado #${nth}: restricción por terminación impar. Tu placa termina en ${lastDigit2}.`,
              date,
              entidad
            };
          }
          return {
            status: 'OK',
            color: 'green',
            title: 'Sí circula',
            detail: `Sábado #${nth}: restricción por terminación impar. Tu placa termina en ${lastDigit2}.`,
            date,
            entidad
          };
        }

        if (nth === 2 || nth === 4) {
          if (isEven) {
            return {
              status: 'NO',
              color: 'red',
              title: 'Hoy NO circula',
              detail: `Sábado #${nth}: restricción por terminación par. Tu placa termina en ${lastDigit2}.`,
              date,
              entidad
            };
          }
          return {
            status: 'OK',
            color: 'green',
            title: 'Sí circula',
            detail: `Sábado #${nth}: restricción por terminación par. Tu placa termina en ${lastDigit2}.`,
            date,
            entidad
          };
        }

        return {
          status: 'OK',
          color: 'green',
          title: 'Sí circula',
          detail: 'Sábado: sin restricción adicional.',
          date,
          entidad
        };
      }
    }

    if (holograma === '00' || holograma === '0') {
      return {
        status: 'OK',
        color: 'green',
        title: 'Sí circula',
        detail: `Entre semana: sin restricción para holograma ${holograma}.`,
        date,
        entidad
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
          date,
          entidad
        };
      }

      return {
        status: 'OK',
        color: 'green',
        title: 'Sí circula',
        detail: `${dayNameES(date)} restringe terminación ${restrictedDigits.join(' y ')}. Tu placa termina en ${lastDigit}.`,
        date,
        entidad
      };
    }

    return {
      status: 'NEUTRO',
      color: 'gray',
      title: 'Sin datos',
      detail: 'Completa entidad, placa y holograma.',
      date,
      entidad
    };
  };

  const buildCalendar = (baseFormData, days = 14) => {
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

  // ---------------------------
  // ✅ VALIDACIONES
  // ---------------------------

  const placaOk = useMemo(() => {
    const p = formData.placa.trim().toUpperCase();
    if (!p) return false;

    const hasDigit = /\d/.test(p);
    const hasLetter = /[A-Z]/.test(p);
    const basicCharsOk = /^[A-Z0-9-]+$/.test(p);

    if (!hasDigit || !hasLetter || !basicCharsOk) return false;

    if (formData.entidad === 'CDMX') return p.length >= 6 && p.length <= 10;
    if (formData.entidad === 'EDOMEX') return p.length >= 6 && p.length <= 11;

    return p.length >= 6 && p.length <= 11;
  }, [formData.placa, formData.entidad]);

  const modeloOk = useMemo(() => {
    const n = Number(formData.modelo);
    return Number.isFinite(n) && n >= 1950 && n <= maxModelYear;
  }, [formData.modelo, maxModelYear]);

  const hologramaOk = useMemo(() => {
    return ['00', '0', '1', '2'].includes(formData.holograma);
  }, [formData.holograma]);

  const entidadOk = useMemo(() => {
    return ['CDMX', 'EDOMEX'].includes(formData.entidad);
  }, [formData.entidad]);

  const isFormValid = entidadOk && placaOk && modeloOk && hologramaOk;

  // ---------------------------
  // ✅ HANDLERS
  // ---------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;

    // ✅ CORRECCIÓN: si ya guardaste y empiezas a editar, quita el banner
    if (savedOk) setSavedOk(false);

    const finalValue = name === 'placa' ? value.toUpperCase() : value;

    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 2800);
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
      await new Promise((res) => setTimeout(res, 650));

      console.log('Datos a enviar al backend:', formData);

      showToast('ok', '✅ Vehículo registrado correctamente');
      alert('✅ Vehículo registrado correctamente (Mock)');

      // ✅ CORRECCIÓN: oculta calendario al guardar
      setSavedOk(true);
      setCalendarVisible(false);

      // ✅ CORRECCIÓN: quita verdes/rojos y LIMPIA el form (para que no “se vea igual”)
      setTouched({ entidad: false, placa: false, modelo: false, holograma: false });
      setFormData({ entidad: '', placa: '', modelo: '', holograma: '' });

    } catch (err) {
      console.error(err);
      showToast('err', '❌ Ocurrió un error al guardar (Mock).');
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------
  // ✅ ACTUALIZA SEMÁFORO + CALENDARIO
  // ---------------------------
  useEffect(() => {
    const r = evalHoyNoCircula(formData, new Date());
    setResultadoHoy(r);

    const cal = buildCalendar(formData, 14);
    setCalendario(cal);

    if (isFormValid && !savedOk) {
      setCalendarVisible(true);
    } else {
      setCalendarVisible(false);
    }

    // ✅ CORRECCIÓN: quitamos este auto-reset porque apagaba el banner si limpiabas el form
    // if (savedOk && !isFormValid) {
    //   setSavedOk(false);
    // }
  }, [formData, isFormValid, savedOk]);

  const inputClass = (field, ok) => {
    if (!touched[field]) return '';
    return ok ? 'input-valid' : 'input-invalid';
  };

  return (
    <div className="registration-container">
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.text}
        </div>
      )}

      <h2>Registrar Vehículo</h2>
      <p className="registration-subtitle">Añade un auto a tu garaje para gestionar su circulación.</p>

      <div className="semaforo-card">
        <div className={`semaforo-dot semaforo-${resultadoHoy?.color || 'gray'}`} />
        <div className="semaforo-info">
          <div className="semaforo-title">
            {resultadoHoy?.title || 'Semáforo'}
          </div>
          <div className="semaforo-detail">
            {resultadoHoy?.detail || '—'}
          </div>
        </div>
      </div>

      {/* ✅ CORRECCIÓN: noValidate evita estilos nativos (:valid/:invalid) */}
      <form noValidate onSubmit={handleSubmit} className="registration-form">

        <div className="form-group">
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
            <option value="" disabled>Selecciona tu entidad</option>
            <option value="CDMX">CDMX</option>
            <option value="EDOMEX">Estado de México</option>
          </select>
          {touched.entidad && !entidadOk && (
            <small className="hint hint-error">Selecciona una entidad válida.</small>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="placa">Placa</label>
          <input
            type="text"
            id="placa"
            name="placa"
            value={formData.placa}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={formData.entidad === 'EDOMEX' ? 'Ej. ABC-12-34' : 'Ej. ABC-123-A'}
            required
            maxLength={formData.entidad === 'EDOMEX' ? 11 : 10}
            autoComplete="off"
            className={inputClass('placa', placaOk)}
          />

          {touched.placa && !placaOk && (
            <small className="hint hint-error">
              Ingresa una placa válida ({formData.entidad || 'CDMX/EDOMEX'}): usa letras + números (6 a 11 caracteres).
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
            min="1950"
            max={maxModelYear}
            className={inputClass('modelo', modeloOk)}
          />

          <small className="hint">Rango permitido: 1950 - {maxModelYear}</small>

          {touched.modelo && !modeloOk && (
            <small className="hint hint-error">Ingresa el año correctamente.</small>
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
            <option value="" disabled>Selecciona holograma</option>
            <option value="00">Holograma 00</option>
            <option value="0">Holograma 0</option>
            <option value="1">Holograma 1</option>
            <option value="2">Holograma 2</option>
          </select>

          {touched.holograma && !hologramaOk && (
            <small className="hint hint-error">Selecciona un holograma válido.</small>
          )}
        </div>

        <button
          type="submit"
          className="submit-btn"
          disabled={!isFormValid || saving}
        >
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

        {savedOk && (
          <div className="saved-banner">
            ✅ Vehículo guardado. Puedes ingresar nuevamente datos para volver a ver el calendario.
          </div>
        )}
      </form>

      {calendarVisible && (
        <div className="calendar-card">
          <div className="calendar-head">
            <div className="calendar-title">Calendario automático (14 días)</div>
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
                  {item.color === 'red' ? '🔴 NO circula' : item.color === 'green' ? '🟢 Sí circula' : '⚪ Sin datos'}
                </div>
                <div className="day-reason">{item.detail}</div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default VehicleRegistration;