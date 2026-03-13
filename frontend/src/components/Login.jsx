import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';

const USERS_KEY = 'mock_users';
const SESSION_KEY = 'token';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [msg, setMsg] = useState(null);

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

  const setSession = () => {
    localStorage.setItem(SESSION_KEY, 'mock-token');
    window.dispatchEvent(new Event('auth-changed'));
  };

  const clearUX = () => {
    setMsg(null);
  };

  const handleChange = (e) => {
    clearUX();
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

    if (user.password !== password) {
      setMsg({ type: 'err', text: 'Contraseña incorrecta.' });
      return;
    }

    setSession();
    alert('Mock: Sesión iniciada');
    navigate('/');
  };

  return (
    <div className="login-container">
      <h2>¡Bienvenido de vuelta!</h2>
      <p className="login-subtitle">
        Ingresa tus credenciales para acceder al sistema.
      </p>

      {msg && (
        <div
          style={{
            marginBottom: '12px',
            padding: '10px 12px',
            borderRadius: '10px',
            border: '1px solid rgba(0,0,0,0.12)',
            background: 'rgba(239, 68, 68, 0.10)',
            fontSize: '14px'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '10px',
              alignItems: 'center'
            }}
          >
            <span>{msg.text}</span>
            <button
              type="button"
              onClick={() => setMsg(null)}
              style={{ padding: '6px 10px', borderRadius: '8px' }}
            >
              X
            </button>
          </div>
        </div>
      )}

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
          <input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={6}
            autoComplete="current-password"
          />
        </div>

        <button type="submit">Iniciar Sesión</button>
      </form>

      <p className="toggle-text">
        ¿No tienes cuenta? <Link to="/registrarse-usuario">Regístrate aquí</Link>
      </p>
    </div>
  );
};

export default Login;