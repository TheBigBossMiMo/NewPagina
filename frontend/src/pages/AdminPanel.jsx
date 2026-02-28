import { useState } from 'react';
import './AdminPanel.css';

const AdminPanel = () => {
  const [faseContingencia, setFaseContingencia] = useState(0); // 0 = Normal, 1 = Fase 1, 2 = Fase 2

  const handleActivarFase = (fase) => {
    setFaseContingencia(fase);
    const mensajes = [
      'Contingencia desactivada. Circulación normal.',
      '¡Alerta! Contingencia Fase 1 activada. Doble Hoy No Circula.',
      '¡Peligro! Contingencia Fase 2 activada. Restricción severa.'
    ];
    alert(mensajes[fase] + '\n(Mock: Esto actualizará la BD en el futuro)');
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Panel de Control - Administrador</h2>
        <span className="admin-badge">Nivel: SuperAdmin</span>
      </div>

      <div className="dashboard-grid">
        {/* Tarjeta de Control de Contingencias */}
        <div className="dashboard-card contingencia-card">
          <h3>Control de Contingencia Ambiental</h3>
          <p>Estado actual: 
            <strong className={`estado-texto fase-${faseContingencia}`}>
              {faseContingencia === 0 ? ' NORMAL' : ` FASE ${faseContingencia}`}
            </strong>
          </p>
          
          <div className="btn-group">
            <button 
              className={`btn-control btn-normal ${faseContingencia === 0 ? 'active' : ''}`}
              onClick={() => handleActivarFase(0)}
            >
              Desactivar (Normal)
            </button>
            <button 
              className={`btn-control btn-fase1 ${faseContingencia === 1 ? 'active' : ''}`}
              onClick={() => handleActivarFase(1)}
            >
              Activar Fase 1
            </button>
            <button 
              className={`btn-control btn-fase2 ${faseContingencia === 2 ? 'active' : ''}`}
              onClick={() => handleActivarFase(2)}
            >
              Activar Fase 2
            </button>
          </div>
        </div>

        {/* Tarjeta de Estadísticas Rápidas (Bonus Visual) */}
        <div className="dashboard-card stats-card">
          <h3>Estadísticas Rápidas</h3>
          <ul className="stats-list">
            <li><span>Usuarios Registrados:</span> <strong>1,245</strong></li>
            <li><span>Vehículos en BD:</span> <strong>3,890</strong></li>
            <li><span>Consultas Hoy:</span> <strong>450</strong></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;