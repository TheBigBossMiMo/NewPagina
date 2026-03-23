import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Navbar.css';
import logo from '../assets/logo.png';

const API_BASE =
  window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : 'https://hoynocircula-backend.onrender.com';

const Navbar = ({
  chatNotifications = [],
  unreadChatCount = 0,
  hasUnreadChat = false,
  onRemoveChatNotification,
  onMarkChatNotificationsAsRead,
  onOpenChatFromNotification
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sessionUser, setSessionUser] = useState(null);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const userMenuRef = useRef(null);
  const notificationMenuRef = useRef(null);

  const hasLoadedNotificationsRef = useRef(false);
  const hasUserInteractedRef = useRef(false);
  const audioContextRef = useRef(null);
  const shownBrowserNotificationsRef = useRef(new Set());
  const lastChatNotificationIdRef = useRef(null);

  const refreshAuth = () => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('session_user');

    setIsLoggedIn(!!token);

    try {
      setSessionUser(storedUser ? JSON.parse(storedUser) : null);
    } catch {
      setSessionUser(null);
    }
  };

  const playNotificationSound = () => {
    try {
      if (!hasUserInteractedRef.current) return;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }

      const ctx = audioContextRef.current;

      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      oscillator.frequency.setValueAtTime(988, ctx.currentTime + 0.08);

      gainNode.gain.setValueAtTime(0.0001, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.24);
    } catch (error) {
      console.error('Error reproduciendo sonido de notificación:', error);
    }
  };

  const showBrowserNotification = (notification) => {
    try {
      if (!('Notification' in window)) return;
      if (Notification.permission !== 'granted') return;
      if (!document.hidden) return;

      const tagId =
        notification._id ||
        notification.id ||
        notification.uniqueId ||
        `notification-${Date.now()}`;

      if (shownBrowserNotificationsRef.current.has(tagId)) {
        return;
      }

      shownBrowserNotificationsRef.current.add(tagId);

      const title =
        notification.title && notification.title.trim()
          ? notification.title
          : notification.type === 'contingencia'
          ? 'Contingencia ambiental'
          : notification.type === 'doble_hoy_no_circula'
          ? 'Doble Hoy No Circula'
          : notification.type === 'recordatorio'
          ? 'Recordatorio'
          : notification.type === 'vehiculo'
          ? 'Aviso de vehículo'
          : notification.type === 'chatbot'
          ? 'Nuevo mensaje de Soporte Vial'
          : 'Notificación';

      const body = notification.message || 'Tienes una nueva notificación.';

      const browserNotification = new Notification(title, {
        body,
        icon: logo,
        badge: logo,
        tag: tagId
      });

      browserNotification.onclick = () => {
        window.focus();
        browserNotification.close();

        if (notification.type === 'chatbot' && typeof onOpenChatFromNotification === 'function') {
          onOpenChatFromNotification();
        }
      };

      browserNotification.onclose = () => {
        setTimeout(() => {
          shownBrowserNotificationsRef.current.delete(tagId);
        }, 1500);
      };
    } catch (error) {
      console.error('Error mostrando notificación del navegador:', error);
    }
  };

  const processIncomingNotifications = (incomingNotifications) => {
    const safeNotifications = Array.isArray(incomingNotifications) ? incomingNotifications : [];

    setNotifications((prevNotifications) => {
      const prevUnreadIds = new Set(
        prevNotifications
          .filter((notification) => !notification.read)
          .map((notification) => notification._id)
      );

      const newUnreadNotifications = safeNotifications.filter(
        (notification) => !notification.read && !prevUnreadIds.has(notification._id)
      );

      if (hasLoadedNotificationsRef.current && newUnreadNotifications.length > 0) {
        playNotificationSound();

        newUnreadNotifications.forEach((notification) => {
          showBrowserNotification(notification);
        });
      }

      if (!hasLoadedNotificationsRef.current) {
        hasLoadedNotificationsRef.current = true;
      }

      return safeNotifications;
    });
  };

  const fetchNotifications = async (email, silent = false) => {
    try {
      if (!email) {
        setNotifications([]);
        return;
      }

      if (!silent) {
        setLoadingNotifications(true);
      }

      const response = await fetch(
        `${API_BASE}/api/notifications?email=${encodeURIComponent(email)}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'No se pudieron obtener las notificaciones.');
      }

      processIncomingNotifications(data.notifications);
    } catch (error) {
      console.error('Error obteniendo notificaciones:', error);
      if (!silent) {
        setNotifications([]);
      }
    } finally {
      if (!silent) {
        setLoadingNotifications(false);
      }
    }
  };

  useEffect(() => {
    setIsMenuOpen(false);
    setIsUserDropdownOpen(false);
    setIsNotificationsOpen(false);
  }, [location]);

  useEffect(() => {
    refreshAuth();
  }, [location]);

  useEffect(() => {
    const onAuthChanged = () => refreshAuth();
    window.addEventListener('auth-changed', onAuthChanged);
    return () => window.removeEventListener('auth-changed', onAuthChanged);
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      window.deferredPromptEvent = e;
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      window.deferredPromptEvent = null;
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    const syncInstallState = () => {
      const promptEvent = window.deferredPromptEvent || null;
      setDeferredPrompt(promptEvent);
      setIsInstallable(!!promptEvent);
    };

    syncInstallState();

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('pwa-install-ready', syncInstallState);
    window.addEventListener('pwa-installed', syncInstallState);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('pwa-install-ready', syncInstallState);
      window.removeEventListener('pwa-installed', syncInstallState);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }

      if (
        notificationMenuRef.current &&
        !notificationMenuRef.current.contains(event.target)
      ) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const enableInteraction = async () => {
      hasUserInteractedRef.current = true;

      if ('Notification' in window && Notification.permission === 'default') {
        try {
          await Notification.requestPermission();
        } catch (error) {
          console.error('Error solicitando permiso de notificaciones:', error);
        }
      }

      window.removeEventListener('click', enableInteraction);
      window.removeEventListener('keydown', enableInteraction);
      window.removeEventListener('touchstart', enableInteraction);
    };

    window.addEventListener('click', enableInteraction);
    window.addEventListener('keydown', enableInteraction);
    window.addEventListener('touchstart', enableInteraction);

    return () => {
      window.removeEventListener('click', enableInteraction);
      window.removeEventListener('keydown', enableInteraction);
      window.removeEventListener('touchstart', enableInteraction);
    };
  }, []);

  useEffect(() => {
    hasLoadedNotificationsRef.current = false;

    if (isLoggedIn && sessionUser?.email) {
      fetchNotifications(sessionUser.email);
    } else {
      setNotifications([]);
    }
  }, [isLoggedIn, sessionUser?.email]);

  useEffect(() => {
    if (!isLoggedIn || !sessionUser?.email) return;

    const intervalId = setInterval(() => {
      fetchNotifications(sessionUser.email, true);
    }, 20000);

    return () => clearInterval(intervalId);
  }, [isLoggedIn, sessionUser?.email]);

  useEffect(() => {
    if (!hasUnreadChat || chatNotifications.length === 0) return;

    const latestChatNotification = chatNotifications[0];
    const latestId =
      latestChatNotification?.id ||
      latestChatNotification?._id ||
      latestChatNotification?.uniqueId;

    if (!latestId) return;
    if (lastChatNotificationIdRef.current === latestId) return;

    lastChatNotificationIdRef.current = latestId;

    playNotificationSound();
    showBrowserNotification({
      ...latestChatNotification,
      type: latestChatNotification.type || 'chatbot'
    });
  }, [hasUnreadChat, chatNotifications]);

  const handleInstallClick = async () => {
    const promptEvent = deferredPrompt || window.deferredPromptEvent || null;

    if (!promptEvent) {
      alert('La instalación aún no está disponible. Recarga la página e inténtalo de nuevo.');
      return;
    }

    try {
      await promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;

      if (outcome === 'accepted') {
        setIsInstallable(false);
      }

      window.deferredPromptEvent = null;
      setDeferredPrompt(null);
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Error al intentar instalar la app:', error);
      alert('No fue posible abrir la instalación de la app.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('session_user');
    localStorage.removeItem('google_user');
    localStorage.removeItem('remember_me');

    setIsLoggedIn(false);
    setSessionUser(null);
    setNotifications([]);
    setIsMenuOpen(false);
    setIsUserDropdownOpen(false);
    setIsNotificationsOpen(false);
    hasLoadedNotificationsRef.current = false;
    shownBrowserNotificationsRef.current.clear();
    lastChatNotificationIdRef.current = null;

    window.dispatchEvent(new Event('auth-changed'));
    navigate('/');
  };

  const isActiveRoute = (routes) => {
    return routes.includes(location.pathname);
  };

  const getUserInitial = () => {
    const name = sessionUser?.fullName || sessionUser?.email || 'U';
    return name.charAt(0).toUpperCase();
  };

  const getDisplayName = () => {
    if (!sessionUser) return 'Usuario';
    return sessionUser.fullName || sessionUser.email || 'Usuario';
  };

  const getDisplayEmail = () => {
    return sessionUser?.email || 'Sin correo';
  };

  const unreadBackendCount = useMemo(() => {
    return notifications.filter((notification) => !notification.read).length;
  }, [notifications]);

  const totalUnreadCount = unreadBackendCount + unreadChatCount;

  const mergedNotifications = useMemo(() => {
    const backendNotifications = notifications.map((notification) => ({
      ...notification,
      source: 'backend',
      uniqueId: `backend-${notification._id}`
    }));

    const localChatNotifications = chatNotifications.map((notification) => ({
      ...notification,
      type: notification.type || 'chatbot',
      source: 'chat',
      uniqueId: `chat-${notification.id}`
    }));

    return [...localChatNotifications, ...backendNotifications].sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );
  }, [notifications, chatNotifications]);

  const getNotificationIcon = (type) => {
    if (type === 'contingencia') return '🚨';
    if (type === 'doble_hoy_no_circula') return '🚫';
    if (type === 'recordatorio') return '⏰';
    if (type === 'vehiculo') return '🚗';
    if (type === 'chatbot') return '🤖';
    return '🔔';
  };

  const getNotificationTitle = (notification) => {
    if (notification.title && notification.title.trim()) {
      return notification.title;
    }

    if (notification.type === 'contingencia') return 'Contingencia ambiental';
    if (notification.type === 'doble_hoy_no_circula') return 'Doble Hoy No Circula';
    if (notification.type === 'recordatorio') return 'Recordatorio';
    if (notification.type === 'vehiculo') return 'Aviso de vehículo';
    if (notification.type === 'chatbot') return 'Nuevo mensaje de Soporte Vial';

    return 'Notificación';
  };

  const formatNotificationDate = (date) => {
    if (!date) return '';

    try {
      return new Date(date).toLocaleString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  const handleOpenNotifications = async () => {
    const nextOpen = !isNotificationsOpen;
    setIsNotificationsOpen(nextOpen);
    setIsUserDropdownOpen(false);

    if (nextOpen) {
      if (sessionUser?.email) {
        await fetchNotifications(sessionUser.email);
      }

      if (typeof onMarkChatNotificationsAsRead === 'function') {
        onMarkChatNotificationsAsRead();
      }
    }
  };

  const handleMarkAsRead = async (notificationId, alreadyRead) => {
    try {
      if (!sessionUser?.email || !notificationId || alreadyRead) return;

      const response = await fetch(
        `${API_BASE}/api/notifications/${notificationId}/read`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: sessionUser.email
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'No se pudo marcar la notificación como leída.');
      }

      setNotifications((prev) =>
        prev.map((notification) =>
          notification._id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marcando notificación como leída:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      if (sessionUser?.email && notifications.length > 0) {
        setMarkingAllRead(true);

        const response = await fetch(`${API_BASE}/api/notifications/read-all`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: sessionUser.email
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'No se pudieron marcar todas como leídas.');
        }

        setNotifications((prev) =>
          prev.map((notification) => ({
            ...notification,
            read: true
          }))
        );
      }

      if (typeof onMarkChatNotificationsAsRead === 'function') {
        onMarkChatNotificationsAsRead();
      }
    } catch (error) {
      console.error('Error marcando todas como leídas:', error);
    } finally {
      setMarkingAllRead(false);
    }
  };

  const handleRemoveMergedNotification = (notification) => {
    if (notification.source === 'chat') {
      if (typeof onRemoveChatNotification === 'function') {
        onRemoveChatNotification(notification.id);
      }
      return;
    }

    setNotifications((prev) =>
      prev.filter((item) => item._id !== notification._id)
    );
  };

  const handleChatNotificationClick = (notification) => {
    if (typeof onMarkChatNotificationsAsRead === 'function') {
      onMarkChatNotificationsAsRead();
    }

    if (typeof onOpenChatFromNotification === 'function') {
      onOpenChatFromNotification();
    }

    setIsNotificationsOpen(false);
  };

  const handleNotificationCardClick = async (notification) => {
    if (notification.source === 'backend') {
      await handleMarkAsRead(notification._id, notification.read);
      return;
    }

    handleChatNotificationClick(notification);
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" className="navbar-brand-link">
          <img src={logo} alt="Logo Hoy No Circula" className="navbar-logo" />
        </Link>
      </div>

      <button
        className="mobile-menu-btn"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Abrir menú"
        type="button"
      >
        {isMenuOpen ? '✖' : '☰'}
      </button>

      <ul className={`navbar-links ${isMenuOpen ? 'active' : ''}`}>
        <li>
          <Link
            to="/"
            className={`nav-link-pill ${isActiveRoute(['/']) ? 'active-nav-link' : ''}`}
          >
            Inicio
          </Link>
        </li>

        <li>
          <Link
            to="/informacion"
            className={`nav-link-pill ${isActiveRoute(['/informacion']) ? 'active-nav-link' : ''}`}
          >
            Información
          </Link>
        </li>

        {!isLoggedIn && (
          <>
            <li>
              <Link
                to="/registrarse-usuario"
                className={`nav-link-pill ${isActiveRoute(['/registrarse-usuario']) ? 'active-nav-link' : ''}`}
              >
                Registrarse
              </Link>
            </li>

            <li>
              <Link
                to="/login"
                className={`login-btn ${isActiveRoute(['/login']) ? 'active-login-btn' : ''}`}
              >
                Login
              </Link>
            </li>
          </>
        )}

        {isLoggedIn && (
          <li>
            <Link
              to="/admin"
              className={`nav-link-pill admin-link ${isActiveRoute(['/admin']) ? 'active-nav-link' : ''}`}
            >
              Contingencia
            </Link>
          </li>
        )}

        <li>
          <button
            onClick={handleInstallClick}
            className="btn-descargar"
            type="button"
            disabled={!isInstallable}
            title={
              isInstallable
                ? 'Instalar aplicación'
                : 'La instalación aún no está disponible'
            }
          >
            ⬇️ App
          </button>
        </li>

        {isLoggedIn && (
          <>
            <li
              className="navbar-notification-item navbar-notification-wrapper"
              ref={notificationMenuRef}
            >
              <button
                type="button"
                className={`navbar-icon-btn ${totalUnreadCount > 0 ? 'navbar-icon-btn-alert' : ''}`}
                aria-label="Notificaciones"
                title="Notificaciones"
                onClick={handleOpenNotifications}
              >
                🔔
                {totalUnreadCount > 0 && (
                  <span className="navbar-notification-badge">
                    {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
                  </span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="navbar-notification-dropdown">
                  <div className="navbar-notification-header">
                    <div>
                      <strong>Notificaciones</strong>
                      <span>
                        {totalUnreadCount > 0
                          ? `${totalUnreadCount} sin leer`
                          : 'Todo al día'}
                      </span>
                    </div>

                    {mergedNotifications.length > 0 && (
                      <button
                        type="button"
                        className="mark-all-read-btn"
                        onClick={handleMarkAllAsRead}
                        disabled={markingAllRead}
                      >
                        {markingAllRead ? 'Marcando...' : 'Marcar todas'}
                      </button>
                    )}
                  </div>

                  <div className="navbar-notification-list">
                    {loadingNotifications ? (
                      <div className="navbar-notification-empty">
                        Cargando notificaciones...
                      </div>
                    ) : mergedNotifications.length === 0 ? (
                      <div className="navbar-notification-empty">
                        No tienes notificaciones por el momento.
                      </div>
                    ) : (
                      mergedNotifications.map((notification) => (
                        <div
                          key={notification.uniqueId}
                          className={`navbar-notification-card ${notification.read ? 'read' : 'unread'}`}
                        >
                          <div className="navbar-notification-icon">
                            {getNotificationIcon(notification.type)}
                          </div>

                          <div
                            className="navbar-notification-content navbar-notification-clickable"
                            role="button"
                            tabIndex={0}
                            onClick={() => handleNotificationCardClick(notification)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                handleNotificationCardClick(notification);
                              }
                            }}
                          >
                            <div className="navbar-notification-topline">
                              <strong>{getNotificationTitle(notification)}</strong>
                              {!notification.read && (
                                <span className="navbar-notification-dot" />
                              )}
                            </div>

                            <p>{notification.message}</p>

                            <small>
                              {notification.plate ? `${notification.plate} · ` : ''}
                              {formatNotificationDate(notification.createdAt)}
                            </small>
                          </div>

                          <button
                            type="button"
                            className="navbar-notification-remove-btn"
                            title="Eliminar notificación"
                            aria-label="Eliminar notificación"
                            onClick={() => handleRemoveMergedNotification(notification)}
                          >
                            ✕
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </li>

            <li className="navbar-user-wrapper" ref={userMenuRef}>
              <button
                type="button"
                className="navbar-user-btn"
                onClick={() => {
                  setIsUserDropdownOpen((prev) => !prev);
                  setIsNotificationsOpen(false);
                }}
                aria-label="Abrir menú de usuario"
              >
                {sessionUser?.picture ? (
                  <img
                    src={sessionUser.picture}
                    alt={getDisplayName()}
                    className="navbar-user-avatar"
                  />
                ) : (
                  <div className="navbar-user-avatar navbar-user-fallback">
                    {getUserInitial()}
                  </div>
                )}
              </button>

              {isUserDropdownOpen && (
                <div className="navbar-user-dropdown">
                  <div className="navbar-user-dropdown-header">
                    {sessionUser?.picture ? (
                      <img
                        src={sessionUser.picture}
                        alt={getDisplayName()}
                        className="navbar-user-dropdown-avatar"
                      />
                    ) : (
                      <div className="navbar-user-dropdown-avatar navbar-user-fallback">
                        {getUserInitial()}
                      </div>
                    )}

                    <div className="navbar-user-info">
                      <strong>{getDisplayName()}</strong>
                      <span>{getDisplayEmail()}</span>
                    </div>
                  </div>

                  <div className="navbar-user-dropdown-divider" />

                  <Link
                    to="/perfil"
                    className="navbar-user-dropdown-item"
                    onClick={() => {
                      setIsUserDropdownOpen(false);
                      setIsMenuOpen(false);
                    }}
                  >
                    Mi perfil
                  </Link>

                  <Link
                    to="/registro"
                    className="navbar-user-dropdown-item"
                    onClick={() => {
                      setIsUserDropdownOpen(false);
                      setIsMenuOpen(false);
                    }}
                  >
                    Mis vehículos
                  </Link>

                  <button
                    type="button"
                    className="navbar-user-dropdown-item logout-item"
                    onClick={handleLogout}
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;