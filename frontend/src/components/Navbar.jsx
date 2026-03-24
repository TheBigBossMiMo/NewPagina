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
        set
