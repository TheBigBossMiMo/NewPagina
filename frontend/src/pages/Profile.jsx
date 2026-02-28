import { useState } from 'react';
import './Profile.css';

const Profile = () => {
  // Estado inicial simulando datos de un usuario logueado
  const [userData, setUserData] = useState({
    nombre: 'Conductor Designado',
    correo: 'conductor@ejemplo.com',
    telefono: '55 1234 5678',
    notificaciones: true
  });

  const [isEditing, setIsEditing] = useState(false);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setUserData({
      ...userData,
      [e.target.name]: value
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    setIsEditing(false);
    // Aquí iría la petición PUT/PATCH al Backend
    alert('¡Perfil actualizado con éxito!\n(Los cambios se guardarán en la BD próximamente)');
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar">👤</div>
        <h2>Mi Perfil</h2>
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
                onClick={() => setIsEditing(true)}
              >
                Editar Datos
              </button>
            ) : (
              <>
                <button type="submit" className="btn-save">Guardar Cambios</button>
                <button 
                  type="button" 
                  className="btn-cancel" 
                  onClick={() => setIsEditing(false)}
                >
                  Cancelar
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