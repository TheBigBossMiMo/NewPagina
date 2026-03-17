import { useState } from 'react';
import { Link } from 'react-router-dom';
import './CirculationStatus.css';

const API_BASE =
  window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : 'https://hoynocircula-backend.onrender.com

const CirculationStatus = () => {
  const [estado, setEstado] = useState('CDMX');
  const [placa, setPlaca] = useState('');
  const [holograma, setHolograma] = useState('0');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [result, setResult] = useState(null);

  const normalizePlate = (value) => {
    return value.toUpperCase().replace(/\s+/g, '').trim();
  };

  const getPlatePlaceholder = () => {
    return estado === 'CDMX'
      ? 'Ej. ABC-123 / 123-ABC / ABC123'
      : 'Ej. AB-12-CD / 12-AB-34 / AB12CD';
  };

  const getPlateHelper = () => {
    return estado === 'CDMX'
      ? 'Formatos válidos CDMX: ABC-123, 123-ABC, ABC123, 123ABC'
      : 'Formatos válidos EDOMEX: AB-12-CD, 12-AB-34, AB12CD, 12AB34';
  };

  const isValidPlateFormat = (value, selectedState) => {
    const raw = value.replace(/-/g, '');

    if (selectedState === 'CDMX') {
      return (
        /^[A-Z]{3}-\d{3}$/.test(value) ||
        /^\d{3}-[A-Z]{3}$/.test(value) ||
        /^[A-Z]{3}\d{3}$/.test(raw) ||
        /^\d{3}[A-Z]{3}$/.test(raw)
      );
    }

    if (selectedState === 'EDOMEX') {
      return (
        /^[A-Z]{2}-\d{2}-[A-Z]{2}$/.test(value) ||
        /^\d{2}-[A-Z]{2}-\d{2}$/.test(value) ||
        /^[A-Z]{2}\d{2}[A-Z]{2}$/.test(raw) ||
        /^\d{2}[A-Z]{2}\d{2}$/.test(raw)
      );
    }

    return false;
  };

  const handleEstadoChange = (e) => {
    setEstado(e.target.value);
    setPlaca('');
    setResult(null);
    setErrorMessage('');
  };

  const handlePlacaChange = (e) => {
    const nextValue = normalizePlate(e.target.value);
    setPlaca(nextValue);

    if (result) setResult(null);
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const normalizedPlate = normalizePlate(placa);

    if (!normalizedPlate) {
      setErrorMessage('Ingresa una matrícula para realizar la consulta.');
      setResult(null);
      return;
    }

    if (!isValidPlateFormat(normalizedPlate, estado)) {
      setErrorMessage(
        estado === 'CDMX'
          ? 'La matrícula no coincide con un formato válido de CDMX.'
          : 'La matrícula no coincide con un formato válido del Estado de México.'
      );
      setResult(null);
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      setResult(null);

      const response = await fetch(
        `${API_BASE}/api/circula/${encodeURIComponent(normalizedPlate)}?holograma=${encodeURIComponent(holograma)}&estado=${encodeURIComponent(estado)}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'No se pudo realizar la consulta.');
      }

      if (data.found === false) {
        setResult({
          type: 'not-found',
          placa: normalizedPlate,
          estado,
          message:
            'No encontramos esta matrícula en la base de datos. Inicia sesión o regístrate para registrar tu vehículo y realizar la consulta correctamente.'
        });
        return;
      }

      setResult({
        type: data.circula ? 'circula' : 'no-circula',
        placa: data.placa,
        estado: data.estado || estado,
        message: data.mensaje,
        holograma: data.holograma || holograma
      });
    } catch (error) {
      console.error('Error consultando circulación:', error);
      setErrorMessage(error.message || 'Ocurrió un error al consultar la matrícula.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="status-container">
      <div className="status-header">
        <h2>Consulta de Circulación</h2>
        <p>
          Consulta si tu vehículo está registrado y si puede circular hoy.
        </p>
        <span className="status-subhelper">
          Selecciona tu entidad y valida la matrícula con el formato correcto.
        </span>
      </div>

      <form onSubmit={handleSubmit} className="status-form">
        <div className="status-state-row">
          <label htmlFor="estado">Entidad</label>
          <select id="estado" value={estado} onChange={handleEstadoChange}>
            <option value="CDMX">CDMX</option>
            <option value="EDOMEX">Estado de México</option>
          </select>
        </div>

        <div className="input-group">
          <input
            type="text"
            value={placa}
            onChange={handlePlacaChange}
            placeholder={getPlatePlaceholder()}
            required
            maxLength={10}
            autoComplete="off"
          />

          <select value={holograma} onChange={(e) => setHolograma(e.target.value)}>
            <option value="00">Holograma 00</option>
            <option value="0">Holograma 0</option>
            <option value="1">Holograma 1</option>
            <option value="2">Holograma 2</option>
          </select>

          <button type="submit" disabled={loading}>
            {loading ? 'Consultando...' : 'Consultar'}
          </button>
        </div>

        <div className="plate-helper">{getPlateHelper()}</div>
      </form>

      {errorMessage && (
        <div className="result-card error-card">
          <h3>⚠️ Validación requerida</h3>
          <p>{errorMessage}</p>
        </div>
      )}

      {result && result.type === 'circula' && (
        <div className="result-card circula">
          <h3>✅ ¡Hoy CIRCULAS!</h3>
          <p>{result.message}</p>
        </div>
      )}

      {result && result.type === 'no-circula' && (
        <div className="result-card no-circula">
          <h3>⛔ Hoy NO CIRCULAS</h3>
          <p>{result.message}</p>
        </div>
      )}

      {result && result.type === 'not-found' && (
        <div className="result-card not-found">
          <h3>🚘 Matrícula {result.placa} no encontrada</h3>
          <p>
            No encontramos la matrícula <strong>{result.placa}</strong> en la base de datos para{' '}
            <strong>{result.estado}</strong>. Para consultar correctamente, es necesario
            iniciar sesión o registrarse y registrar previamente el vehículo en el sistema.
          </p>

          <div className="result-actions">
            <Link to="/login" className="result-link secondary">
              Iniciar sesión
            </Link>
            <Link to="/registrarse-usuario" className="result-link primary">
              Registrarse
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default CirculationStatus;