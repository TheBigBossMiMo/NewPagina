import { useState } from 'react';
import './VehicleRegistration.css';

const VehicleRegistration = () => {
  // Calculamos el año dinámicamente para el atributo "max" (+1 por los modelos del siguiente año)
  const currentYear = new Date().getFullYear();
  const maxModelYear = currentYear + 1;

  const [formData, setFormData] = useState({
    placa: '',
    modelo: '',
    holograma: '0'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Si es la placa, forzamos mayúsculas
    const finalValue = name === 'placa' ? value.toUpperCase() : value;

    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí después conectaremos con el Backend (HU-01)
    console.log('Datos a enviar al backend:', formData);
    alert('✅ Vehículo registrado correctamente (Mock)');
  };

  return (
    <div className="registration-container">
      <h2>Registrar Vehículo</h2>
      <p className="registration-subtitle">Añade un auto a tu garaje para gestionar su circulación.</p>
      
      <form onSubmit={handleSubmit} className="registration-form">
        
        <div className="form-group">
          <label htmlFor="placa">Placa</label>
          <input 
            type="text" 
            id="placa" 
            name="placa" 
            value={formData.placa} 
            onChange={handleChange} 
            placeholder="Ej. ABC-123-A"
            required 
            maxLength="10"
            autoComplete="off"
          />
        </div>

        <div className="form-group">
          <label htmlFor="modelo">Modelo (Año)</label>
          <input 
            type="number" 
            id="modelo" 
            name="modelo" 
            value={formData.modelo} 
            onChange={handleChange} 
            placeholder={`Ej. ${currentYear}`}
            required 
            min="1950" 
            max={maxModelYear}
          />
        </div>

        <div className="form-group">
          <label htmlFor="holograma">Holograma</label>
          <select 
            id="holograma" 
            name="holograma" 
            value={formData.holograma} 
            onChange={handleChange}
          >
            <option value="00">Holograma 00</option>
            <option value="0">Holograma 0</option>
            <option value="1">Holograma 1</option>
            <option value="2">Holograma 2</option>
          </select>
        </div>

        <button type="submit" className="submit-btn">
          <span>💾</span> Guardar Vehículo
        </button>
      </form>
    </div>
  );
};

export default VehicleRegistration;