import { useEffect, useState } from 'react';
import './Profile.css';

const API_URL = "http://localhost:3000/api/auth";

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const sessionUser = JSON.parse(localStorage.getItem("session_user"));
  const email = sessionUser?.email;

  /* =========================
     CARGAR PERFIL (GET)
  ========================= */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/profile?email=${email}`);
        const data = await res.json();

        if (data.success) {
          setUserData(data.user);
        }
      } catch (error) {
        console.error("Error cargando perfil:", error);
      }
    };

    if (email) fetchProfile();
  }, [email]);

  /* =========================
     CAMBIOS INPUT
  ========================= */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setUserData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEdit = () => {
    setOriginalData({ ...userData });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setUserData(originalData);
    setIsEditing(false);
  };

  /* =========================
     GUARDAR (PUT)
  ========================= */
  const handleSave = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${API_URL}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: userData.email,
          fullName: userData.fullName,
          phone: userData.phone,
          notificaciones: userData.notificaciones
        })
      });

      const data = await res.json();

      if (data.success) {
        setIsEditing(false);
        alert("✅ Perfil actualizado correctamente");
      }
    } catch (error) {
      console.error("Error actualizando perfil:", error);
    }
  };

  if (!userData) {
    return <p style={{ textAlign: "center" }}>Cargando perfil...</p>;
  }

  return (
    <div className="profile-container">

      {/* HEADER */}
      <div className="profile-header">

        <div className="profile-avatar">
          {userData.picture ? (
            <img src={userData.picture} alt="avatar" className="profile-avatar-img" />
          ) : (
            userData.fullName?.charAt(0).toUpperCase()
          )}
        </div>

        <h2>{userData.fullName}</h2>
        <p className="profile-subtitle">{userData.email}</p>
      </div>

      {/* CARD */}
      <div className="profile-card">
        <form onSubmit={handleSave} className="profile-form">

          <div className="form-group">
            <label>Nombre</label>
            <input
              type="text"
              name="fullName"
              value={userData.fullName}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </div>

          <div className="form-group">
            <label>Correo</label>
            <input value={userData.email} disabled />
          </div>

          <div className="form-group">
            <label>Teléfono</label>
            <input
              type="tel"
              name="phone"
              value={userData.phone}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </div>

          <div className="form-group">
            <label>Tipo de cuenta</label>
            <input value={userData.provider} disabled />
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
              Recibir alertas de contingencia
            </label>
          </div>

          <div className="profile-actions">
            {!isEditing ? (
              <button type="button" className="btn-edit" onClick={handleEdit}>
                ✏️ Editar
              </button>
            ) : (
              <>
                <button type="button" className="btn-cancel" onClick={handleCancel}>
                  Cancelar
                </button>
                <button type="submit" className="btn-save">
                  💾 Guardar
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