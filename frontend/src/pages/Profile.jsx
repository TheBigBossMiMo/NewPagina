import { useState } from 'react';
import './Profile.css';

const Profile = () => {
  // Estado principal de los datos
  const [userData, setUserData] = useState({
    nombre: 'Gerardo R.', // Puse un nombre de ejemplo más real
    correo: 'conductor@ejemplo.com',
    telefono: '55 1234 5678',
    notificaciones: true
  });

  // Estado secundario para guardar el respaldo en caso de cancelar
  const [originalData, setOriginalData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEdit = () => {
    // Guardamos una copia exacta de los datos antes de empezar a editar
    setOriginalData({ ...userData });
    setIsEditing(true);
  };

  const handleCancel = () => {
    // Restauramos la copia de seguridad
    setUserData(originalData);
    setIsEditing(false);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setIsEditing(false);
    // Aquí iría la petición PUT/PATCH al Backend (Sprint 2/3)
    console.log('Actualizando perfil en BD:', userData);
    alert('✅ ¡Perfil actualizado con éxito!');
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar">👨‍💻</div>
        <h2>Mi Perfil</h2>
        <p className="profile-subtitle">Gestiona tu información personal</p>
      </div>

      <div className="profile-card">
        <form onSubmit={handleSave} className="profile-form">
          
          <div className="form-group">
            <label htmlFor="nombre">Nombre Completo</label>
            <input 
              type="text" 
              id="nombre" 
              name="nombre" 
              value={userData.nombre} 
              onChange={handleChange} 
              disabled={!isEditing}
              required 
            />
          </div>

          <div className="form-group">
            <label htmlFor="correo">Correo Electrónico</label>
            <input 
              type="email" 
              id="correo" 
              name="correo" 
              value={userData.correo} 
              onChange={handleChange} 
              disabled={!isEditing}
              required 
            />
          </div>

          <div className="form-group">
            <label htmlFor="telefono">Teléfono (WhatsApp)</label>
            <input 
              type="tel" 
              id="telefono" 
              name="telefono" 
              value={userData.telefono} 
              onChange={handleChange} 
              disabled={!isEditing}
              placeholder="Ej. 55 0000 0000"
            />
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input 
                type="checkbox" 
                name="notificaciones" 
                checked={userData.notificaciones} 
                onChange={handleChange} 
                disabled={!isEditing}
              />
              Recibir alertas de Contingencia Ambiental
            </label>
          </div>

          <div className="profile-actions">
            {!isEditing ? (
              <button 
                type="button" 
                className="btn-edit" 
                onClick={handleEdit}
              >
                ✏️ Editar Datos
              </button>
            ) : (
              <>
                <button type="button" className="btn-cancel" onClick={handleCancel}>
                  ✖ Cancelar
                </button>
                <button type="submit" className="btn-save">
                  💾 Guardar Cambios
                </button>
              </>
            )}
          </div>
          
        </form>
      </div>
    </div>
  );
};

export default Profile;