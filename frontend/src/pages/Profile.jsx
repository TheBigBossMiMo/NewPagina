import { useEffect, useState } from 'react';
import './Profile.css';

const API_URL = import.meta.env.VITE_API_URL;

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const sessionUserRaw = localStorage.getItem("session_user");
  const sessionUser = sessionUserRaw ? JSON.parse(sessionUserRaw) : null;
  const email = sessionUser?.email || "";

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setMsg(null);

        if (!email) {
          throw new Error("No hay sesión activa.");
        }

        if (!API_URL) {
          throw new Error("No se encontró VITE_API_URL.");
        }

        const res = await fetch(`${API_URL}/profile?email=${encodeURIComponent(email)}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || "No se pudo cargar el perfil.");
        }

        setUserData(data.user);
      } catch (error) {
        console.error("Error cargando perfil:", error);
        setMsg({
          type: "err",
          text: error.message || "Error cargando perfil."
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [email]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setUserData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEdit = () => {
    setOriginalData({ ...userData });
    setIsEditing(true);
    setMsg(null);
  };

  const handleCancel = () => {
    setUserData(originalData);
    setIsEditing(false);
    setMsg(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setMsg(null);

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

      if (!res.ok || !data.success) {
        throw new Error(data.message || "No se pudo actualizar el perfil.");
      }

      setUserData(data.user);

      const updatedSessionUser = {
        ...sessionUser,
        fullName: data.user.fullName,
        email: data.user.email,
        phone: data.user.phone,
        picture: data.user.picture,
        provider: data.user.provider,
        notificaciones: data.user.notificaciones
      };

      localStorage.setItem("session_user", JSON.stringify(updatedSessionUser));
      window.dispatchEvent(new Event("auth-changed"));

      setIsEditing(false);
      setMsg({
        type: "ok",
        text: "Perfil actualizado correctamente."
      });
    } catch (error) {
      console.error("Error actualizando perfil:", error);
      setMsg({
        type: "err",
        text: error.message || "Error actualizando perfil."
      });
    } finally {
      setSaving(false);
    }
  };

  const getInitial = () => {
    return (userData?.fullName || userData?.email || "U").charAt(0).toUpperCase();
  };

  const getProviderLabel = () => {
    return userData?.provider === "google" ? "Google" : "Local";
  };

  if (loading) {
    return <p style={{ textAlign: "center", marginTop: "2rem" }}>Cargando perfil...</p>;
  }

  if (!userData) {
    return <p style={{ textAlign: "center", marginTop: "2rem" }}>No se pudo cargar el perfil.</p>;
  }

  return (
    <div className="profile-page">
      <div className="profile-shell">
        <section className="profile-hero">
          <div className="profile-hero-top">
            <div className="profile-avatar-wrap">
              <div className="profile-avatar">
                {userData.picture ? (
                  <img src={userData.picture} alt="avatar" className="profile-avatar-img" />
                ) : (
                  <span>{getInitial()}</span>
                )}
              </div>
            </div>

            <div className="profile-hero-info">
              <span className="profile-badge">Mi cuenta</span>
              <h1>{userData.fullName}</h1>
              <p>{userData.email}</p>

              <div className="profile-mini-stats">
                <div className="mini-stat">
                  <span className="mini-stat-label">Tipo</span>
                  <strong>{getProviderLabel()}</strong>
                </div>

                <div className="mini-stat">
                  <span className="mini-stat-label">Teléfono</span>
                  <strong>{userData.phone || "No registrado"}</strong>
                </div>

                <div className="mini-stat">
                  <span className="mini-stat-label">Alertas</span>
                  <strong>{userData.notificaciones ? "Activadas" : "Desactivadas"}</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="profile-content">
          <div className="profile-card profile-form-card">
            <div className="profile-card-head">
              <div>
                <h2>Configuración personal</h2>
                <p>Edita tu información básica y preferencias.</p>
              </div>
            </div>

            {msg && (
              <div className={`profile-message ${msg.type === "err" ? "error" : "success"}`}>
                {msg.text}
              </div>
            )}

            <form onSubmit={handleSave} className="profile-form">
              <div className="profile-form-grid">
                <div className="form-group">
                  <label>Nombre</label>
                  <input
                    type="text"
                    name="fullName"
                    value={userData.fullName || ""}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>

                <div className="form-group">
                  <label>Correo</label>
                  <input
                    type="email"
                    value={userData.email || ""}
                    disabled
                  />
                </div>

                <div className="form-group">
                  <label>Teléfono</label>
                  <input
                    type="tel"
                    name="phone"
                    value={userData.phone || ""}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="Ej. 5512345678"
                  />
                </div>

                <div className="form-group">
                  <label>Tipo de cuenta</label>
                  <input
                    value={getProviderLabel()}
                    disabled
                  />
                </div>
              </div>

              <div className="profile-toggle-card">
                <div>
                  <h3>Notificaciones</h3>
                  <p>Recibe alertas relacionadas con contingencia ambiental.</p>
                </div>

                <label className="switch">
                  <input
                    type="checkbox"
                    name="notificaciones"
                    checked={!!userData.notificaciones}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="profile-actions">
                {!isEditing ? (
                  <button type="button" className="btn-edit" onClick={handleEdit}>
                    ✏️ Editar perfil
                  </button>
                ) : (
                  <>
                    <button type="button" className="btn-cancel" onClick={handleCancel}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn-save" disabled={saving}>
                      {saving ? "Guardando..." : "💾 Guardar cambios"}
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Profile;