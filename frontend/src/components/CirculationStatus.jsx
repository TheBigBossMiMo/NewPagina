import { useState } from 'react';
import './CirculationStatus.css';

const CirculationStatus = () => {
  const [placa, setPlaca] = useState('');
  const [holograma, setHolograma] = useState('0');
  const [status, setStatus] = useState(null); // null, 'circula', 'no-circula'

  // Formatea la placa a mayúsculas automáticamente
  const handlePlacaChange = (e) => {
    setPlaca(e.target.value.toUpperCase());
    // Opcional: limpiar el estado de resultado si el usuario vuelve a escribir
    if (status) setStatus(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Lógica temporal de Frontend
    const lastDigit = parseInt(placa.slice(-1));
    if (isNaN(lastDigit)) {
      alert("Por favor, ingresa una placa válida que termine en número.");
      return;
    }

    if (lastDigit % 2 === 0) {
      setStatus('circula');
    } else {
      setStatus('no-circula');
    }
  };

  return (
    <div className="status-container">
      <h2>Consulta de Circulación</h2>
      <form onSubmit={handleSubmit} className="status-form">
        <div className="input-group">
          <input 
            type="text" 
            value={placa} 
            onChange={handlePlacaChange} 
            placeholder="Ej. ABC-123" 
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
          <button type="submit">Consultar</button>
        </div>
      </form>

      {status && (
        <div className={`result-card ${status}`}>
          <h3>
            {status === 'circula' ? '✅ ¡Hoy CIRCULAS!' : '⛔ Hoy NO CIRCULAS'}
          </h3>
          <p>
            {status === 'circula' 
              ? 'Puedes transitar libremente por la CDMX y el Estado de México.' 
              : 'Tienes restricción de circulación de 5:00 a 22:00 hrs.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default CirculationStatus;