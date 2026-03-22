import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

const SESSION_KEY = 'token';
const SESSION_USER_KEY = 'session_user';
const GOOGLE_USER_KEY = 'google_user';
const REMEMBER_ME_KEY = 'remember_me';

const API_URL = import.meta.env.VITE_API_URL;

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const [msg, setMsg] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotData, setForgotData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [forgotLoading, setForgotLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);

  const navigate = useNavigate();

  const normalizeEmail = (email) => (email || '').trim().toLowerCase();

  const setSession = (user, rememberMe = false) => {
    localStorage.setItem(SESSION_KEY, 'mock-token');
    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
    localStorage.setItem(REMEMBER_ME_KEY, rememberMe ? 'true' : 'false');

    if (user?.provider === 'google') {
      localStorage.setItem(GOOGLE_USER_KEY, JSON.stringify(user));
    }

    window.dispatchEvent(new Event('auth-changed'));
  };

  const clearUX = () => {
    setMsg(null);
  };

  useEffect(() => {
    const token = localStorage.getItem(SESSION_KEY);
    if (token) navigate('/');
  }, [navigate]);

  const handleChange = (e) => {
    clearUX();
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleForgotChange = (e) => {
    const { name, value } = e.target;
    setForgotData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const openForgotPasswordModal = () => {
    const email = normalizeEmail(formData.email);

    setForgotData({
      email,
      otp: '',
      newPassword: '',
      confirmPassword: ''
    });
    setCodeSent(false);
    setShowForgotPassword(false);
    setShowForgotConfirmPassword(false);
    setShowForgotModal(true);
    clearUX();
  };

  const closeForgotPasswordModal = () => {
    setShowForgotModal(false);
    setCodeSent(false);
    setForgotLoading(false);
    setForgotData({
      email: '',
      otp: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  const handleForgotPassword = () => {
    openForgotPasswordModal();
  };

  const handleSendRecoveryCode = async () => {
    const email = normalizeEmail(forgotData.email);

    if (!email) {
      setMsg({
        type: 'warn',
        text: 'Escribe tu correo para recuperar tu contraseña.'
      });
      return;
    }

    try {
      setForgotLoading(true);

      const response = await fetch(`${API_URL}/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'No se pudo enviar el código de recuperación.');
      }

      setCodeSent(true);
      setForgotData((prev) => ({
        ...prev,
        email
      }));

      setMsg({
        type: 'ok',
        text: `Te enviamos un código de recuperación a ${email}.`
      });
    } catch (error) {
      setMsg({
        type: 'err',
        text: error.message || 'No se pudo enviar el código de recuperación.'
      });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const email = normalizeEmail(forgotData.email);
    const otp = (forgotData.otp || '').trim();
    const newPassword = forgotData.newPassword || '';
    const confirmPassword = forgotData.confirmPassword || '';

    if (!email || !otp || !newPassword || !confirmPassword) {
      setMsg({
        type: 'err',
        text: 'Completa todos los campos para restablecer tu contraseña.'
      });
      return;
    }

    if (newPassword.length < 8) {
      setMsg({
        type: 'err',
        text: 'La nueva contraseña debe tener al menos 8 caracteres.'
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMsg({
        type: 'err',
        text: 'Las contraseñas no coinciden.'
      });
      return;
    }

    try {
      setForgotLoading(true);

      const response = await fetch(`${API_URL}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          otp,
          newPassword
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'No se pudo restablecer la contraseña.');
      }

      setMsg({
        type: 'ok',
        text: 'Contraseña actualizada correctamente. Ahora inicia sesión.'
      });

      closeForgotPasswordModal();

      setFormData((prev) => ({
        ...prev,
        email,
        password: ''
      }));
    } catch (error) {
      setMsg({
        type: 'err',
        text: error.message || 'No se pudo restablecer la contraseña.'
      });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearUX();

    const email = normalizeEmail(formData.email);
    const password = formData.password || '';

    if (!email || !password) {
      setMsg({ type: 'err', text: 'Completa correo y contraseña.' });
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'No se pudo iniciar sesión.');
      }

      const user = data.user;

      setSession(user, formData.rememberMe);

      setMsg({
        type: 'ok',
        text: `Bienvenido, ${user.fullName || user.email}.`
      });

      setTimeout(() => {
        navigate('/');
      }, 700);
    } catch (error) {
      setMsg({
        type: 'err',
        text: error.message || 'No se pudo iniciar sesión.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      clearUX();

      const decoded = jwtDecode(credentialResponse.credential);

      const googleUser = {
        fullName: decoded.name || '',
        email: normalizeEmail(decoded.email),
        picture: decoded.picture || '',
        provider: 'google',
        verified: true
      };

      const response = await fetch(`${API_URL}/google-register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fullName: googleUser.fullName,
          email: googleUser.email,
          picture: googleUser.picture
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSession(data.user || googleUser, true);
        setMsg({
          type: 'ok',
          text: `Inicio de sesión con Google exitoso. Bienvenido, ${googleUser.fullName}.`
        });

        setTimeout(() => {
          navigate('/');
        }, 800);

        return;
      }

      const backendMessage = data?.message || '';

      if (
        backendMessage.toLowerCase().includes('ya está registrado') ||
        backendMessage.toLowerCase().includes('ya esta registrado')
      ) {
        setSession(googleUser, true);
        setMsg({
          type: 'ok',
          text: `Inicio de sesión con Google exitoso. Bienvenido, ${googleUser.fullName}.`
        });

        setTimeout(() => {
          navigate('/');
        }, 800);

        return;
      }

      throw new Error(backendMessage || 'No se pudo iniciar sesión con Google.');
    } catch (error) {
      setMsg({
        type: 'err',
        text: error.message || 'No se pudo iniciar sesión con Google.'
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

      {showForgotModal && (
        <div className="forgot-overlay">
          <div className="forgot-modal">
            <h3>Recuperar contraseña</h3>
            <p className="forgot-modal-text">
              Ingresa tu correo para enviarte un código y luego crea una nueva contraseña.
            </p>

            <div className="input-wrapper">
              <label htmlFor="forgot-email">Correo electrónico</label>
              <input
                id="forgot-email"
                name="email"
                type="email"
                placeholder="ejemplo@correo.com"
                value={forgotData.email}
                onChange={handleForgotChange}
                autoComplete="email"
              />
            </div>

            {codeSent && (
              <>
                <div className="input-wrapper">
                  <label htmlFor="forgot-otp">Código de recuperación</label>
                  <input
                    id="forgot-otp"
                    name="otp"
                    type="text"
                    placeholder="Ingresa el código"
                    value={forgotData.otp}
                    onChange={handleForgotChange}
                  />
                </div>

                <div className="input-wrapper">
                  <label htmlFor="forgot-new-password">Nueva contraseña</label>
                  <div className="password-field">
                    <input
                      id="forgot-new-password"
                      name="newPassword"
                      type={showForgotPassword ? 'text' : 'password'}
                      placeholder="Nueva contraseña"
                      value={forgotData.newPassword}
                      onChange={handleForgotChange}
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowForgotPassword((prev) => !prev)}
                    >
                      {showForgotPassword ? 'Ocultar' : 'Ver'}
                    </button>
                  </div>
                </div>

                <div className="input-wrapper">
                  <label htmlFor="forgot-confirm-password">Confirmar contraseña</label>
                  <div className="password-field">
                    <input
                      id="forgot-confirm-password"
                      name="confirmPassword"
                      type={showForgotConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirma tu nueva contraseña"
                      value={forgotData.confirmPassword}
                      onChange={handleForgotChange}
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowForgotConfirmPassword((prev) => !prev)}
                    >
                      {showForgotConfirmPassword ? 'Ocultar' : 'Ver'}
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="forgot-actions">
              <button
                type="button"
                className="forgot-cancel-btn"
                onClick={closeForgotPasswordModal}
              >
                Cancelar
              </button>

              {!codeSent ? (
                <button
                  type="button"
                  className="forgot-submit-btn"
                  onClick={handleSendRecoveryCode}
                  disabled={forgotLoading}
                >
                  {forgotLoading ? 'Enviando...' : 'Enviar código'}
                </button>
              ) : (
                <button
                  type="button"
                  className="forgot-submit-btn"
                  onClick={handleResetPassword}
                  disabled={forgotLoading}
                >
                  {forgotLoading ? 'Actualizando...' : 'Cambiar contraseña'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;

