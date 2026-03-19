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

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: ''
  });

  const [changingPassword, setChangingPassword] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const sessionUserRaw = localStorage.getItem('session_user');
  const sessionUser = sessionUserRaw ? JSON.parse(sessionUserRaw) : null;
  const email = sessionUser?.email || '';

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setMsg(null);

        if (!email) {
          throw new Error('No hay sesión activa.');
        }

        if (!API_URL) {
          throw new Error('No se encontró VITE_API_URL.');
        }

        const res = await fetch(`${API_URL}/profile?email=${encodeURIComponent(email)}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || 'No se pudo cargar el perfil.');
        }

        setUserData(data.user);
      } catch (error) {
        console.error('Error cargando perfil:', error);
        setMsg({
          type: 'err',
          text: error.message || 'Error cargando perfil.'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [email]);

  const updateSessionUser = (updatedUser) => {
    const updatedSessionUser = {
      ...sessionUser,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      phone: updatedUser.phone,
      picture: updatedUser.picture,
      provider: updatedUser.provider,
      notificaciones: updatedUser.notificaciones
    };

    localStorage.setItem('session_user', JSON.stringify(updatedSessionUser));
    window.dispatchEvent(new Event('auth-changed'));
  };

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
    if (originalData) {
      setUserData(originalData);
    }
    setIsEditing(false);
    setMsg(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setMsg(null);

      const res = await fetch(`${API_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
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
        throw new Error(data.message || 'No se pudo actualizar el perfil.');
      }

      setUserData(data.user);
      updateSessionUser(data.user);

      setIsEditing(false);
      setMsg({
        type: 'ok',
        text: 'Perfil actualizado correctamente.'
      });
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      setMsg({
        type: 'err',
        text: error.message || 'Error actualizando perfil.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;

    setPasswordData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    try {
      setChangingPassword(true);
      setMsg(null);

      const res = await fetch(`${API_URL}/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'No se pudo cambiar la contraseña.');
      }

      setPasswordData({
        currentPassword: '',
        newPassword: ''
      });

      setMsg({
        type: 'ok',
        text: 'Contraseña actualizada correctamente.'
      });
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      setMsg({
        type: 'err',
        text: error.message || 'Error cambiando contraseña.'
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      setUploadingImage(true);
      setMsg(null);

      const reader = new FileReader();

      reader.onloadend = async () => {
        try {
          const res = await fetch(`${API_URL}/profile-image`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email,
              picture: reader.result
            })
          });

          const data = await res.json();

          if (!res.ok || !data.success) {
            throw new Error(data.message || 'No se pudo actualizar la foto.');
          }

          setUserData(data.user);
          updateSessionUser(data.user);

          setMsg({
            type: 'ok',
            text: 'Foto actualizada correctamente.'
          });
        } catch (error) {
          console.error('Error actualizando foto:', error);
          setMsg({
            type: 'err',
            text: error.message || 'Error actualizando foto.'
          });
        } finally {
          setUploadingImage(false);
          e.target.value = '';
        }
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error leyendo imagen:', error);
      setUploadingImage(false);
      setMsg({
        type: 'err',
        text: 'No se pudo procesar la imagen.'
      });
    }
  };

  const getInitial = () => {
    return (userData?.fullName || userData?.email || 'U').charAt(0).toUpperCase();
  };

  const getProviderLabel = () => {
    return userData?.provider === 'google' ? 'Google' : 'Local';
  };

  if (loading) {
    return <p style={{ textAlign: 'center', marginTop: '2rem' }}>Cargando perfil...</p>;
  }

  if (!userData) {
    return <p style={{ textAlign: 'center', marginTop: '2rem' }}>No se pudo cargar el perfil.</p>;
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

              {userData.provider !== 'google' && (
                <div className="profile-avatar-upload">
                  <label className="profile-upload-btn">
                    {uploadingImage ? 'Subiendo...' : 'Cambiar foto'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      hidden
                    />
                  </label>
                </div>
              )}
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
                  <strong>{userData.phone || 'No registrado'}</strong>
                </div>

                <div className="mini-stat">
                  <span className="mini-stat-label">Alertas</span>
                  <strong>{userData.notificaciones ? 'Activadas' : 'Desactivadas'}</strong>
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
              <div className={`profile-message ${msg.type === 'err' ? 'error' : 'success'}`}>
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
                    value={userData.fullName || ''}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>

                <div className="form-group">
                  <label>Correo</label>
                  <input
                    type="email"
                    value={userData.email || ''}
                    disabled
                  />
                </div>

                <div className="form-group">
                  <label>Teléfono</label>
                  <input
                    type="tel"
                    name="phone"
                    value={userData.phone || ''}
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
                      {saving ? 'Guardando...' : '💾 Guardar cambios'}
                    </button>
                  </>
                )}
              </div>
            </form>

            {userData.provider !== 'google' && (
              <form onSubmit={handleChangePassword} className="profile-password-card">
                <div className="profile-password-head">
                  <h3>Seguridad</h3>
                  <p>Cambia tu contraseña de acceso.</p>
                </div>

                <div className="profile-password-grid">
                  <div className="form-group">
                    <label>Contraseña actual</label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordInputChange}
                      placeholder="Ingresa tu contraseña actual"
                    />
                  </div>

                  <div className="form-group">
                    <label>Nueva contraseña</label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordInputChange}
                      placeholder="Mínimo 8 caracteres"
                    />
                  </div>
                </div>

                <div className="profile-password-actions">
                  <button
                    type="submit"
                    className="btn-password"
                    disabled={changingPassword}
                  >
                    {changingPassword ? 'Actualizando...' : '🔒 Cambiar contraseña'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Profile;