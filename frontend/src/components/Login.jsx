import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const USERS_KEY = 'mock_users';     // lista de usuarios registrados
const SESSION_KEY = 'token';        // sesión actual

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '' });

  // ✅ Mensajitos (errores y confirmación)
  const [msg, setMsg] = useState(null); // { type: 'err'|'ok', text: '' }
  const [confirmRegister, setConfirmRegister] = useState(false);

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

  const setSession = () => {
    localStorage.setItem(SESSION_KEY, 'mock-token');
    window.dispatchEvent(new Event('auth-changed'));
  };

  const clearUX = () => {
    setMsg(null);
    setConfirmRegister(false);
  };

  // Manejador centralizado para los inputs
  const handleChange = (e) => {
    clearUX();
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleToggle = () => {
    clearUX();
    setIsLogin(!isLogin);
    // Limpiar la contraseña si el usuario cambia de vista
    setFormData({ email: '', password: '' }); // ✅ limpia correo y contraseña
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
    const user = users.find(u => u.email === email);

    if (isLogin) {
      // ✅ LOGIN
      if (!user) {
        // No registrado -> pregunta
        setConfirmRegister(true);
        setMsg({ type: 'err', text: 'Este correo no está registrado. ¿Quieres registrarte?' });
        return;
      }

      if (user.password !== password) {
        setMsg({ type: 'err', text: 'Contraseña incorrecta.' });
        return;
      }

      // OK
      setSession();
      alert('Mock: Sesión Iniciada');
      navigate('/'); // ✅ manda al inicio
      return;
    }

    // ✅ REGISTRO
    if (user) {
      setMsg({ type: 'err', text: 'Ese correo ya está registrado. Inicia sesión.' });
      setIsLogin(true);
      return;
    }

    const newUsers = [...users, { email, password }];
    saveUsers(newUsers);

    // ✅ IMPORTANTE: ya NO iniciamos sesión automático, NO token, NO navigate('/')
    // Mostrar mensaje y mandar a la pestaña de login para que ingrese
    alert('Correo registrado. Ahora inicia sesión.');
    setIsLogin(true);
    setFormData(prev => ({ ...prev, password: '' })); // limpia password

    // Si quieres que también se quite el email (opcional), descomenta:
    // setFormData({ email: '', password: '' });
  };

  const handleConfirmYes = () => {
    // Cambiar a registrarse
    setConfirmRegister(false);
    setMsg(null);
    setIsLogin(false);
    // (Opcional) limpiar password para que el registro se vea más limpio
    setFormData(prev => ({ ...prev, password: '' }));
  };

  const handleConfirmNo = () => {
    setConfirmRegister(false);
    setMsg(null);
  };

  return (
    <div className="login-container">
      <h2>{isLogin ? '¡Bienvenido de vuelta!' : 'Crea tu cuenta'}</h2>
      <p className="login-subtitle">
        {isLogin
          ? 'Ingresa tus credenciales para acceder al sistema.'
          : 'Regístrate para gestionar el estado de tus vehículos.'}
      </p>

      {/* ✅ Mensaje (error / info) */}
      {msg && (
        <div
          style={{
            marginBottom: '12px',
            padding: '10px 12px',
            borderRadius: '10px',
            border: '1px solid rgba(0,0,0,0.12)',
            background: msg.type === 'err' ? 'rgba(239, 68, 68, 0.10)' : 'rgba(34,197,94,0.10)',
            fontSize: '14px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center' }}>
            <span>{msg.text}</span>

            {/* ✅ Si es confirmación, mostramos botones Sí/No */}
            {confirmRegister ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={handleConfirmYes} style={{ padding: '6px 10px', borderRadius: '8px' }}>
                  Sí
                </button>
                <button type="button" onClick={handleConfirmNo} style={{ padding: '6px 10px', borderRadius: '8px' }}>
                  No
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setMsg(null)}
                style={{ padding: '6px 10px', borderRadius: '8px' }}
              >
                X
              </button>
            )}
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
            autoComplete={isLogin ? "current-password" : "new-password"}
          />
        </div>

        <button type="submit">
          {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
        </button>
      </form>

      <p className="toggle-text">
        {isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
        <span onClick={handleToggle} role="button" tabIndex={0}>
          {isLogin ? 'Regístrate aquí' : 'Inicia sesión'}
        </span>
      </p>
    </div>
  );
};

export default Login;