import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Navbar.css';
import logo from '../assets/logo.png';

const API_BASE = (() => {
  const envUrl = import.meta.env.VITE_API_URL?.trim();
  if (envUrl) return envUrl.replace(/\/$/, '');

  if (window.location.hostname === 'localhost') {
    return 'http://localhost:5000';
  }

  return 'https://hoynocircula-backend.onrender.com';
})();

const safeParseJson = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  const rawText = await response.text();

  if (!rawText) {
    return { data: null, rawText, contentType };
  }

  if (contentType.includes('application/json')) {
    try {
      return {
        data: JSON.parse(rawText),
        rawText,
        contentType
      };
    } catch {
      throw new Error('La respuesta del servidor no contiene JSON válido.');
    }
  }

  if (rawText.trim().startsWith('{') || rawText.trim().startsWith('[')) {
    try {
      return {
        data: JSON.parse(rawText),
        rawText,
        contentType
      };
    } catch {
      throw new Error('La respuesta del servidor no contiene JSON válido.');
    }
  }

  return { data: null, rawText, contentType };
};

const formatNotificationDate = (value) => {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString('es-MX', {
      dateStyle: 'short',
      timeStyle: 'short'
    });
  } catch {
    return '';
  }
};

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

      if (shownBrowserNotificationsRef.current.has(tagId)) return;

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
        `${API_BASE}/api/notifications?email=${encodeURIComponent(email)}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json'
          }
        }
      );

      const { data, rawText } = await safeParseJson(response);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            rawText ||
            `Error ${response.status}: no se pudieron obtener las notificaciones.`
        );
      }

      if (!data) {
        throw new Error(
          'La API de notificaciones no devolvió JSON válido. Revisa la URL del backend o la ruta /api/notifications.'
        );
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

      if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const markInteraction = async () => {
      hasUserInteractedRef.current = true;

      if ('Notification' in window && Notification.permission === 'default') {
        try {
          await Notification.requestPermission();
        } catch (error) {
          console.error('No se pudo solicitar permiso de notificaciones:', error);
        }
      }

      window.removeEventListener('click', markInteraction);
      window.removeEventListener('keydown', markInteraction);
      window.removeEventListener('touchstart', markInteraction);
    };

    window.addEventListener('click', markInteraction, { once: true });
    window.addEventListener('keydown', markInteraction, { once: true });
    window.addEventListener('touchstart', markInteraction, { once: true });

    return () => {
      window.removeEventListener('click', markInteraction);
      window.removeEventListener('keydown', markInteraction);
      window.removeEventListener('touchstart', markInteraction);
    };
  }, []);

  useEffect(() => {
    const email = sessionUser?.email || sessionUser?.correo || '';

    if (!isLoggedIn || !email) {
      setNotifications([]);
      hasLoadedNotificationsRef.current = false;
      return;
    }

    fetchNotifications(email);

    const interval = setInterval(() => {
      fetchNotifications(email, true);
    }, 30000);

    return () => clearInterval(interval);
  }, [isLoggedIn, sessionUser]);

  useEffect(() => {
    if (!Array.isArray(chatNotifications) || chatNotifications.length === 0) return;

    const latestChat = chatNotifications[0];
    const latestId =
      latestChat?._id ||
      latestChat?.id ||
      latestChat?.uniqueId ||
      `${latestChat?.message || ''}-${latestChat?.createdAt || ''}`;

    if (!latestId) return;
    if (lastChatNotificationIdRef.current === latestId) return;

    if (lastChatNotificationIdRef.current !== null) {
      playNotificationSound();
      showBrowserNotification({
        ...latestChat,
        type: 'chatbot'
      });
    }

    lastChatNotificationIdRef.current = latestId;
  }, [chatNotifications]);

  const mergedNotifications = useMemo(() => {
    const mappedServerNotifications = notifications.map((notification) => ({
      ...notification,
      source: 'server',
      uniqueKey:
        notification._id ||
        notification.id ||
        `${notification.type}-${notification.createdAt}`
    }));

    const mappedChatNotifications = (Array.isArray(chatNotifications) ? chatNotifications : []).map(
      (notification, index) => ({
        ...notification,
        type: notification.type || 'chatbot',
        title: notification.title || 'Nuevo mensaje de Soporte Vial',
        source: 'chat',
        read: Boolean(notification.read),
        uniqueKey:
          notification._id ||
          notification.id ||
          notification.uniqueId ||
          `chat-${notification.createdAt || index}-${notification.message || ''}`
      })
    );

    return [...mappedChatNotifications, ...mappedServerNotifications].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.date || 0).getTime();
      const dateB = new Date(b.createdAt || b.date || 0).getTime();
      return dateB - dateA;
    });
  }, [notifications, chatNotifications]);

  const unreadServerCount = notifications.filter((notification) => !notification.read).length;
  const totalUnreadCount = unreadServerCount + unreadChatCount;
  const hasUnreadNotifications = totalUnreadCount > 0 || hasUnreadChat;

  const markAllNotificationsAsRead = async () => {
    try {
      if (markingAllRead) return;
      setMarkingAllRead(true);

      const email = sessionUser?.email || sessionUser?.correo || '';

      if (email) {
        const response = await fetch(`${API_BASE}/api/notifications/mark-all-read`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify({ email })
        });

        const { data } = await safeParseJson(response);

        if (!response.ok) {
          throw new Error(data?.message || 'No se pudieron marcar las notificaciones como leídas.');
        }

        setNotifications((prev) =>
          prev.map((notification) => ({ ...notification, read: true }))
        );
      }

      if (typeof onMarkChatNotificationsAsRead === 'function') {
        onMarkChatNotificationsAsRead();
      }
    } catch (error) {
      console.error('Error marcando notificaciones como leídas:', error);
    } finally {
      setMarkingAllRead(false);
    }
  };

  const handleRemoveNotification = async (notification) => {
    try {
      if (notification.source === 'chat') {
        if (typeof onRemoveChatNotification === 'function') {
          onRemoveChatNotification(notification);
        }
        return;
      }

      if (!notification._id) return;

      const response = await fetch(`${API_BASE}/api/notifications/${notification._id}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json'
        }
      });

      const { data } = await safeParseJson(response);

      if (!response.ok) {
        throw new Error(data?.message || 'No se pudo eliminar la notificación.');
      }

      setNotifications((prev) =>
        prev.filter((item) => item._id !== notification._id)
      );
    } catch (error) {
      console.error('Error eliminando notificación:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (notification.source === 'chat' && typeof onOpenChatFromNotification === 'function') {
      onOpenChatFromNotification();
    }

    if (notification.link) {
      navigate(notification.link);
    } else if (notification.route) {
      navigate(notification.route);
    } else if (notification.type === 'vehiculo') {
      navigate('/registro');
    } else if (
      notification.type === 'contingencia' ||
      notification.type === 'doble_hoy_no_circula'
    ) {
      navigate('/admin');
    }

    setIsNotificationsOpen(false);
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('session_user');
    localStorage.removeItem('mock_users');
    setIsLoggedIn(false);
    setSessionUser(null);
    setIsMenuOpen(false);
    setIsUserDropdownOpen(false);
    setIsNotificationsOpen(false);
    window.dispatchEvent(new Event('auth-changed'));
    navigate('/');
  };

  const handleInstallApp = async () => {
    try {
      const promptEvent = deferredPrompt || window.deferredPromptEvent;
      if (!promptEvent) return;

      promptEvent.prompt();
      const choiceResult = await promptEvent.userChoice;

      if (choiceResult?.outcome === 'accepted') {
        setIsInstallable(false);
        setDeferredPrompt(null);
        window.deferredPromptEvent = null;
      }
    } catch (error) {
      console.error('Error mostrando el prompt de instalación:', error);
    }
  };

  const userDisplayName =
    sessionUser?.name ||
    sessionUser?.fullName ||
    sessionUser?.nombre ||
    sessionUser?.username ||
    'Usuario';

  const userEmail = sessionUser?.email || sessionUser?.correo || '';

  const visibleLinks = [
    { to: '/', label: 'Inicio', isPrivate: false },
    { to: '/informacion', label: 'Información', isPrivate: false },
    { to: '/admin', label: 'Contingencia', isPrivate: true }
  ].filter((link) => !link.isPrivate || isLoggedIn);

  const isActivePath = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="navbar">
      <Link to="/" className="navbar-brand" onClick={() => setIsMenuOpen(false)}>
        <img src={logo} alt="Hoy No Circula" className="navbar-logo" />
      </Link>

      <button
        type="button"
        className="mobile-menu-btn"
        onClick={() => setIsMenuOpen((prev) => !prev)}
        aria-label="Abrir menú"
      >
        ☰
      </button>

      <div className={`navbar-links ${isMenuOpen ? 'active' : ''}`}>
        {visibleLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={isActivePath(link.to) ? 'active-nav-link' : ''}
            onClick={() => setIsMenuOpen(false)}
          >
            {link.label}
          </Link>
        ))}

        {isInstallable && (
          <button
            type="button"
            className="btn-descargar"
            onClick={handleInstallApp}
          >
            Instalar app
          </button>
        )}

        {isLoggedIn && (
          <div className="navbar-notification-wrapper" ref={notificationMenuRef}>
            <button
              type="button"
              className={`navbar-icon-btn ${hasUnreadNotifications ? 'navbar-icon-btn-alert' : ''}`}
              onClick={() => setIsNotificationsOpen((prev) => !prev)}
              aria-label="Abrir notificaciones"
            >
              🔔
              {hasUnreadNotifications && (
                <span className="navbar-notification-badge">
                  {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
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
                        : 'Sin pendientes'}
                    </span>
                  </div>

                  {mergedNotifications.length > 0 && (
                    <button
                      type="button"
                      className="mark-all-read-btn"
                      onClick={markAllNotificationsAsRead}
                      disabled={markingAllRead}
                    >
                      {markingAllRead ? 'Marcando...' : 'Marcar todo'}
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
                      No tienes notificaciones.
                    </div>
                  ) : (
                    mergedNotifications.map((notification) => (
                      <div
                        key={notification.uniqueKey}
                        className={`navbar-notification-card ${
                          notification.read ? 'read' : 'unread'
                        }`}
                      >
                        <div
                          className="navbar-notification-clickable"
                          onClick={() => handleNotificationClick(notification)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              handleNotificationClick(notification);
                            }
                          }}
                        >
                          <div className="navbar-notification-content">
                            <div className="navbar-notification-topline">
                              <strong>
                                {notification.title ||
                                  (notification.type === 'chatbot'
                                    ? 'Nuevo mensaje de Soporte Vial'
                                    : 'Notificación')}
                              </strong>
                              {!notification.read && <span className="navbar-notification-dot"></span>}
                            </div>

                            <p>{notification.message || 'Tienes una nueva notificación.'}</p>
                            <small>{formatNotificationDate(notification.createdAt)}</small>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="navbar-notification-remove-btn"
                          onClick={() => handleRemoveNotification(notification)}
                          aria-label="Eliminar notificación"
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {isLoggedIn ? (
          <div className="navbar-user-wrapper" ref={userMenuRef}>
            <button
              type="button"
              className="navbar-user-btn"
              onClick={() => setIsUserDropdownOpen((prev) => !prev)}
              aria-label="Abrir menú de usuario"
            >
              {sessionUser?.picture || sessionUser?.avatar ? (
                <img
                  src={sessionUser.picture || sessionUser.avatar}
                  alt={userDisplayName}
                  className="navbar-user-avatar"
                />
              ) : (
                <div className="navbar-user-avatar navbar-user-fallback">
                  {String(userDisplayName).charAt(0).toUpperCase()}
                </div>
              )}
            </button>

            {isUserDropdownOpen && (
              <div className="navbar-user-dropdown">
                <div className="navbar-user-dropdown-header">
                  {sessionUser?.picture || sessionUser?.avatar ? (
                    <img
                      src={sessionUser.picture || sessionUser.avatar}
                      alt={userDisplayName}
                      className="navbar-user-dropdown-avatar"
                    />
                  ) : (
                    <div className="navbar-user-dropdown-avatar navbar-user-fallback">
                      {String(userDisplayName).charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="navbar-user-info">
                    <strong>{userDisplayName}</strong>
                    <span>{userEmail}</span>
                  </div>
                </div>

                <div className="navbar-user-dropdown-divider"></div>

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
          </div>
        ) : (
          <Link
            to="/login"
            className={isActivePath('/login') ? 'login-btn active-login-btn' : 'login-btn'}
            onClick={() => setIsMenuOpen(false)}
          >
            Iniciar sesión
          </Link>
        )}
      </div>
    </header>
  );
};

export default Navbar;