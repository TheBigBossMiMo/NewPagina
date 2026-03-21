import { useEffect, useMemo, useState } from 'react';
import './Profile.css';

/*const API_URL = import.meta.env.VITE_API_URL;*/

const API_BASE =
  window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : 'https://hoynocircula-backend.onrender.com';

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profileMsg, setProfileMsg] = useState(null);
  const [passwordMsg, setPasswordMsg] = useState(null);

  const [notifications, setNotifications] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  const [activeTab, setActiveTab] = useState('personal');

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false
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
        setProfileMsg(null);

        if (!email) {
          throw new Error('No hay sesión activa.');
        }

        /*if (!API_URL) {
          throw new Error('No se encontró VITE_API_URL.');
        }*/

        /*const res = await fetch(`${API_URL}/profile?email=${encodeURIComponent(email)}`);*/

        /*const res = await fetch(`${API_BASE}/api/profile?email=${encodeURIComponent(email)}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || 'No se pudo cargar el perfil.');
        }

        setUserData(data.user);*/

        const profileUrl = `${API_BASE}/api/auth/profile?email=${encodeURIComponent(email)}`;
        console.log('PROFILE URL:', profileUrl);

        const res = await fetch(profileUrl);
        const text = await res.text();

        console.log('PROFILE STATUS:', res.status);
        console.log('PROFILE RAW RESPONSE:', text);

        let data = {};
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(`La respuesta no es JSON. Status: ${res.status}`);
        }

        if (!res.ok || !data.success) {
          throw new Error(data.message || `No se pudo cargar el perfil. Status: ${res.status}`);
        }

        setUserData(data.user);
      } catch (error) {
        console.error('Error cargando perfil:', error);
        setProfileMsg({
          type: 'err',
          text: error.message || 'Error cargando perfil.'
        });
      } finally {
        setLoading(false);
      }
    };

    const fetchNotifications = async () => {
      try {
        /*if (!email || !API_URL) return;*/
        if (!email) return;

        /*const res = await fetch(`${API_URL}/notifications?email=${encodeURIComponent(email)}`);*/
        const res = await fetch(`${API_BASE}/api/notifications?email=${encodeURIComponent(email)}`);
        const data = await res.json();

        if (res.ok && data.success) {
          setNotifications(data.notifications || []);
        }
      } catch (error) {
        console.error('Error cargando notificaciones:', error);
      }
    };

    fetchProfile();
    fetchNotifications();
  }, [email]);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        /*if (!email || !API_URL) return;*/
        if (!email) return;

        setLoadingVehicles(true);

        /*        const res = await fetch(`${API_URL}/vehicles?email=${encodeURIComponent(email)}`);*/

        const res = await fetch(`${API_BASE}/api/vehicles?email=${encodeURIComponent(email)}`);
        const data = await res.json();

        if (res.ok && data.success) {
          const incomingVehicles = Array.isArray(data.vehicles) ? data.vehicles : [];

          const orderedVehicles = [...incomingVehicles].sort((a, b) => {
            const dateA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          });

          setVehicles(orderedVehicles);
        } else {
          setVehicles([]);
        }
      } catch (error) {
        console.error('Error cargando vehículos:', error);
        setVehicles([]);
      } finally {
        setLoadingVehicles(false);
      }
    };

    fetchVehicles();
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
    setProfileMsg(null);
  };

  const handleCancel = () => {
    if (originalData) {
      setUserData(originalData);
    }
    setIsEditing(false);
    setProfileMsg(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setProfileMsg(null);

      /*const res = await fetch(`${API_URL}/profile`, {*/
      const res = await fetch(`${API_BASE}/api/auth/profile`, {
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
      setProfileMsg({
        type: 'ok',
        text: 'Perfil actualizado correctamente.'
      });
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      setProfileMsg({
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

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!passwordData.currentPassword || !passwordData.newPassword) {
      setPasswordMsg({
        type: 'err',
        text: 'Debes completar la contraseña actual y la nueva contraseña.'
      });
      return;
    }

    const confirmed = window.confirm('¿Estás seguro de que quieres cambiar tu contraseña?');

    if (!confirmed) return;

    try {
      setChangingPassword(true);
      setPasswordMsg(null);

      /*const res = await fetch(`${API_URL}/change-password`, {*/
      const res = await fetch(`${API_BASE}/api/auth/change-password`, {
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

      setShowPasswords({
        currentPassword: false,
        newPassword: false
      });

      setPasswordMsg({
        type: 'ok',
        text: 'Contraseña actualizada correctamente.'
      });
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      setPasswordMsg({
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
      setProfileMsg(null);

      const reader = new FileReader();

      reader.onloadend = async () => {
        try {
          /*const res = await fetch(`${API_URL}/profile-image`, {*/
          const res = await fetch(`${API_BASE}/api/auth/profile-image`, {
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

          setProfileMsg({
            type: 'ok',
            text: 'Foto actualizada correctamente.'
          });
        } catch (error) {
          console.error('Error actualizando foto:', error);
          setProfileMsg({
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
      setProfileMsg({
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

  const getPhoneLabel = () => {
    return userData?.phone ? userData.phone : 'No registrado';
  };

  const getNotificationsLabel = () => {
    return userData?.notificaciones ? 'Activadas' : 'Desactivadas';
  };

  const getNotificationTypeLabel = (type) => {
    if (type === 'contingencia') return 'Contingencia';
    if (type === 'doble_hoy_no_circula') return 'Doble Hoy No Circula';
    if (type === 'recordatorio') return 'Recordatorio';
    return 'Notificación';
  };

  const totalVehicles = vehicles.length;

  const lastVehicle = useMemo(() => {
    if (!vehicles.length) return null;
    return vehicles[0];
  }, [vehicles]);

  const lastPlate = lastVehicle?.placa || '—';

  const lastDate = lastVehicle?.createdAt
    ? new Date(lastVehicle.createdAt).toLocaleDateString('es-MX')
    : '—';

  const entidadMasUsada = useMemo(() => {
    if (!vehicles.length) return '—';

    const counts = vehicles.reduce((acc, vehicle) => {
      const entidad = vehicle.entidad || '—';
      acc[entidad] = (acc[entidad] || 0) + 1;
      return acc;
    }, {});

    return Object.keys(counts).reduce((a, b) => (counts[a] >= counts[b] ? a : b));
  }, [vehicles]);

  const recentVehicles = useMemo(() => {
    return vehicles.slice(0, 3);
  }, [vehicles]);

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
              <h1>{userData.fullName || 'Usuario'}</h1>
              <p>{userData.email}</p>

              <div className="profile-hero-grid">
                <div className="hero-info-card">
                  <span>Tipo de cuenta</span>
                  <strong>{getProviderLabel()}</strong>
                </div>

                <div className="hero-info-card">
                  <span>Correo principal</span>
                  <strong>{userData.email}</strong>
                </div>

                <div className="hero-info-card">
                  <span>Teléfono</span>
                  <strong>{getPhoneLabel()}</strong>
                </div>

                <div className="hero-info-card">
                  <span>Notificaciones</span>
                  <strong>{getNotificationsLabel()}</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="profile-tabs-shell">
          <div className="profile-tabs-nav">
            <button
              type="button"
              className={`profile-tab-btn ${activeTab === 'personal' ? 'active' : ''}`}
              onClick={() => setActiveTab('personal')}
            >
              Información personal
            </button>

            <button
              type="button"
              className={`profile-tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
              onClick={() => setActiveTab('summary')}
            >
              Resumen de cuenta
            </button>

            <button
              type="button"
              className={`profile-tab-btn ${activeTab === 'preferences' ? 'active' : ''}`}
              onClick={() => setActiveTab('preferences')}
            >
              Preferencias
            </button>

            <button
              type="button"
              className={`profile-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              Seguridad
            </button>
          </div>

          <div className="profile-tab-panel">
            {activeTab === 'personal' && (
              <div className="profile-card profile-card-large">
                <div className="profile-card-head">
                  <div>
                    <h2>Información personal</h2>
                    <p>Edita tus datos básicos de cuenta sin afectar el acceso actual.</p>
                  </div>
                </div>

                {profileMsg && (
                  <div className={`profile-message ${profileMsg.type === 'err' ? 'error' : 'success'}`}>
                    {profileMsg.text}
                  </div>
                )}

                <form onSubmit={handleSave} className="profile-form">
                  <div className="profile-form-grid">
                    <div className="form-group">
                      <label>Nombre completo</label>
                      <input
                        type="text"
                        name="fullName"
                        value={userData.fullName || ''}
                        onChange={handleChange}
                        disabled={!isEditing}
                        placeholder="Ingresa tu nombre"
                      />
                    </div>

                    <div className="form-group">
                      <label>Correo electrónico</label>
                      <input type="email" value={userData.email || ''} disabled />
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
                      <input type="text" value={getProviderLabel()} disabled />
                    </div>
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
              </div>
            )}

            {activeTab === 'summary' && (
              <div className="profile-card profile-summary-card">
                <div className="profile-card-head">
                  <div>
                    <h2>Resumen de cuenta</h2>
                    <p>Estado general de tu perfil dentro de la plataforma.</p>
                  </div>
                </div>

                <div className="profile-summary-grid">
                  <div className="summary-item">
                    <span>Estado</span>
                    <strong>Cuenta activa</strong>
                  </div>

                  <div className="summary-item">
                    <span>Proveedor</span>
                    <strong>{getProviderLabel()}</strong>
                  </div>

                  <div className="summary-item">
                    <span>Vehículos registrados</span>
                    <strong>{loadingVehicles ? 'Cargando...' : totalVehicles}</strong>
                  </div>

                  <div className="summary-item">
                    <span>Última placa</span>
                    <strong>{loadingVehicles ? 'Cargando...' : lastPlate}</strong>
                  </div>

                  <div className="summary-item">
                    <span>Entidad principal</span>
                    <strong>{loadingVehicles ? 'Cargando...' : entidadMasUsada}</strong>
                  </div>

                  <div className="summary-item">
                    <span>Último registro</span>
                    <strong>{loadingVehicles ? 'Cargando...' : lastDate}</strong>
                  </div>

                  <div className="summary-item">
                    <span>Foto de perfil</span>
                    <strong>{userData.picture ? 'Personalizada' : 'Inicial automática'}</strong>
                  </div>

                  <div className="summary-item">
                    <span>Alertas</span>
                    <strong>{getNotificationsLabel()}</strong>
                  </div>
                </div>

                <div className="profile-card-head profile-inline-head">
                  <div>
                    <h2>Mis vehículos recientes</h2>
                    <p>Vista rápida de los últimos vehículos vinculados a tu cuenta.</p>
                  </div>
                </div>

                {loadingVehicles ? (
                  <div className="profile-note">Cargando vehículos...</div>
                ) : recentVehicles.length === 0 ? (
                  <div className="profile-note">
                    Aún no tienes vehículos registrados en tu cuenta.
                  </div>
                ) : (
                  <div className="profile-vehicle-preview-grid">
                    {recentVehicles.map((vehicle) => (
                      <div key={vehicle._id} className="profile-vehicle-preview-card">
                        <div className="profile-vehicle-preview-top">
                          <div className="profile-vehicle-preview-thumb">
                            {vehicle.vehicleImage ? (
                              <img
                                src={vehicle.vehicleImage}
                                alt={vehicle.placa || 'Vehículo'}
                                className="profile-vehicle-preview-thumb-img"
                              />
                            ) : (
                              '🚗'
                            )}
                          </div>

                          <div className="profile-vehicle-preview-main">
                            <h3>{vehicle.placa || 'Sin placa'}</h3>
                            <p>{vehicle.entidad || 'Entidad no definida'}</p>
                          </div>
                        </div>

                        <div className="profile-vehicle-preview-meta">
                          <div className="profile-vehicle-meta-item">
                            <span>Modelo</span>
                            <strong>{vehicle.modelo || '—'}</strong>
                          </div>

                          <div className="profile-vehicle-meta-item">
                            <span>Holograma</span>
                            <strong>{vehicle.holograma || '—'}</strong>
                          </div>
                        </div>

                        <div className="profile-vehicle-preview-footer">
                          <small>
                            Registrado:{' '}
                            {vehicle.createdAt
                              ? new Date(vehicle.createdAt).toLocaleDateString('es-MX')
                              : '—'}
                          </small>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="profile-card">
                <div className="profile-card-head">
                  <div>
                    <h2>Preferencias de notificación</h2>
                    <p>
                      Aquí controlaremos las alertas de contingencia, doble hoy no circula
                      y recordatorios generales. Los recordatorios del vehículo los moveremos a la pestaña
                      de vehículo cuando terminemos esa parte.
                    </p>
                  </div>
                </div>

                <div className="profile-toggle-card">
                  <div>
                    <h3>Notificaciones generales</h3>
                    <p>
                      Activa o desactiva la recepción de alertas y avisos asociados a tu cuenta.
                    </p>
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

                {!isEditing && (
                  <div className="profile-note">
                    Para cambiar esta preferencia, primero da clic en <strong>Editar perfil</strong>.
                  </div>
                )}

                <div className="profile-card-head profile-inline-head">
                  <div>
                    <h2>Notificaciones recientes</h2>
                    <p>Alertas importantes de tu cuenta y del sistema.</p>
                  </div>
                </div>

                {notifications.length === 0 ? (
                  <div className="profile-note">
                    No tienes notificaciones por el momento.
                  </div>
                ) : (
                  <div className="profile-summary-list">
                    {notifications.map((notification) => (
                      <div
                        key={notification._id || `${notification.type}-${notification.createdAt}`}
                        className="summary-item"
                      >
                        <span>{getNotificationTypeLabel(notification.type)}</span>
                        <strong>{notification.message}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'security' && (
              <div className="profile-card profile-security-card">
                <div className="profile-card-head">
                  <div>
                    <h2>Seguridad</h2>
                    <p>Actualiza tu contraseña de acceso de forma segura.</p>
                  </div>
                </div>

                {passwordMsg && (
                  <div className={`profile-message ${passwordMsg.type === 'err' ? 'error' : 'success'}`}>
                    {passwordMsg.text}
                  </div>
                )}

                {userData.provider !== 'google' ? (
                  <form onSubmit={handleChangePassword} className="profile-password-form">
                    <div className="profile-password-grid security-grid">
                      <div className="form-group">
                        <label>Contraseña actual</label>
                        <div className="password-field">
                          <input
                            type={showPasswords.currentPassword ? 'text' : 'password'}
                            name="currentPassword"
                            value={passwordData.currentPassword}
                            onChange={handlePasswordInputChange}
                            placeholder="Ingresa tu contraseña actual"
                          />
                          <button
                            type="button"
                            className="password-toggle-btn"
                            onClick={() => togglePasswordVisibility('currentPassword')}
                            aria-label={showPasswords.currentPassword ? 'Ocultar contraseña actual' : 'Mostrar contraseña actual'}
                          >
                            {showPasswords.currentPassword ? '👁️' : '🙈'}
                          </button>
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Nueva contraseña</label>
                        <div className="password-field">
                          <input
                            type={showPasswords.newPassword ? 'text' : 'password'}
                            name="newPassword"
                            value={passwordData.newPassword}
                            onChange={handlePasswordInputChange}
                            placeholder="Mínimo 8 caracteres"
                          />
                          <button
                            type="button"
                            className="password-toggle-btn"
                            onClick={() => togglePasswordVisibility('newPassword')}
                            aria-label={showPasswords.newPassword ? 'Ocultar nueva contraseña' : 'Mostrar nueva contraseña'}
                          >
                            {showPasswords.newPassword ? '👁️' : '🙈'}
                          </button>
                        </div>
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
                ) : (
                  <div className="profile-note">
                    Tu cuenta está vinculada con Google. La contraseña se administra desde Google.
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Profile;