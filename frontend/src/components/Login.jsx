import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

const USERS_KEY = 'mock_users';
const SESSION_KEY = 'token';
const SESSION_USER_KEY = 'session_user';
const GOOGLE_USER_KEY = 'google_user';
const REMEMBER_ME_KEY = 'remember_me';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [msg, setMsg] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const navigate = useNavigate();

  const normalizeEmail = (email) => (email || '').trim().toLowerCase();

  const getUsers = () => {
    try {
      const raw = localStorage.getItem(USERS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const saveUsers = (users) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  };

  const getGoogleUser = () => {
    try {
      const raw = localStorage.getItem(GOOGLE_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const setSession = (user, rememberMe = false) => {
    localStorage.setItem(SESSION_KEY, 'mock-token');
    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
    localStorage.setItem(REMEMBER_ME_KEY, rememberMe ? 'true' : 'false');
    window.dispatchEvent(new Event('auth-changed'));
  };

  const clearUX = () => {
    setMsg(null);
  };

  useEffect(() => {
    const token = localStorage.getItem(SESSION_KEY);

    if (token) {
      navigate('/');
    }
  }, [navigate]);

  const handleChange = (e) => {
    clearUX();
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleForgotPassword = () => {
    clearUX();

    const email = normalizeEmail(formData.email);

    if (!email) {
      setMsg({
        type: 'warn',
        text: 'Escribe primero tu correo para ayudarte a recuperar la contraseña.'
      });
      return;
    }

    setMsg({
      type: 'ok',
      text: `Demo: Se envió un enlace de recuperación a ${email}.`
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    clearUX();

    const email = normalizeEmail(formData.email);
    const password = formData.password;

    if (!email || !password) {
      setMsg({ type: 'err', text: 'Completa correo y contraseña.' });
      return;
    }

    const users = getUsers();
    const user = users.find((u) => u.email === email);

    if (!user) {
      setMsg({ type: 'err', text: 'Este correo no está registrado.' });
      return;
    }

    if (user.provider === 'google' && !user.password) {
      setMsg({
        type: 'warn',
        text: 'Esta cuenta fue registrada con Google. Usa el botón de Google para iniciar sesión.'
      });
      return;
    }

    if (user.password !== password) {
      setMsg({ type: 'err', text: 'Contraseña incorrecta.' });
      return;
    }

    setSaving(true);

    setTimeout(() => {
      setSession(user, formData.rememberMe);
      setSaving(false);

      setMsg({
        type: 'ok',
        text: `Bienvenido, ${user.fullName || user.email}.`
      });

      setTimeout(() => {
        navigate('/');
      }, 700);
    }, 900);
  };

  const handleGoogleSuccess = (credentialResponse) => {
    try {
      clearUX();

      const decoded = jwtDecode(credentialResponse.credential);

      const googleUser = {
        fullName: decoded.name,
        email: normalizeEmail(decoded.email),
        picture: decoded.picture,
        provider: 'google',
        verified: true
      };

      const users = getUsers();
      const existingUser = users.find((u) => u.email === googleUser.email);

      let sessionUser = existingUser;

      if (!existingUser) {
        const newGoogleUser = {
          fullName: googleUser.fullName,
          email: googleUser.email,
          picture: googleUser.picture,
          provider: 'google',
          verified: true
        };

        saveUsers([...users, newGoogleUser]);
        sessionUser = newGoogleUser;
      }

      localStorage.setItem(GOOGLE_USER_KEY, JSON.stringify(googleUser));
      setSession(sessionUser || googleUser, true);

      setMsg({
        type: 'ok',
        text: `Inicio de sesión con Google exitoso. Bienvenido, ${googleUser.fullName}.`
      });

      setTimeout(() => {
        navigate('/');
      }, 800);
    } catch (error) {
      console.error('Error al procesar inicio con Google:', error);
      setMsg({
        type: 'err',
        text: 'No se pudo iniciar sesión con Google.'
      });
    }
  };

  const handleGoogleError = () => {
    setMsg({
      type: 'err',
      text: 'No se pudo iniciar sesión con Google.'
    });
  };

  const alertClass =
    msg?.type === 'err'
      ? 'error'
      : msg?.type === 'warn'
      ? 'warning'
      : 'success';

  return (
    <div className="login-container">
      <h2>¡Bienvenido de vuelta!</h2>
      <p className="login-subtitle">
        Ingresa tus credenciales para acceder al sistema.
      </p>

      {msg && (
        <div className={`login-alert ${alertClass}`}>
          <div className="login-alert-content">
            <span>{msg.text}</span>
            <button type="button" onClick={() => setMsg(null)}>
              ×
            </button>
          </div>
        </div>
      )}

      <div className="google-login-wrap">
        <GoogleLogin
          theme="outline"
          size="large"
          text="continue_with"
          shape="pill"
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
        />
      </div>

      <div className="login-divider">
        <span>o inicia sesión con tu correo</span>
      </div>

      <form onSubmit={handleSubmit} className="login-form">
        <div className="input-wrapper">
          <label htmlFor="email">Correo Electrónico</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="ejemplo@correo.com"
            value={formData.email}
            onChange={handleChange}
            required
            autoComplete="email"
          />
        </div>

        <div className="input-wrapper">
          <label htmlFor="password">Contraseña</label>
          <div className="password-field">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? 'Ocultar' : 'Ver'}
            </button>
          </div>
        </div>

        <div className="login-row">
          <label className="remember-check">
            <input
              type="checkbox"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
            />
            <span>Mantener sesión iniciada</span>
          </label>

          <button
            type="button"
            className="forgot-link"
            onClick={handleForgotPassword}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        <button type="submit" disabled={saving}>
          {saving ? 'Ingresando...' : 'Iniciar Sesión'}
        </button>
      </form>

      <p className="toggle-text">
        ¿No tienes cuenta? <Link to="/registrarse-usuario">Regístrate aquí</Link>
      </p>
    </div>
  );
};

export default Login;