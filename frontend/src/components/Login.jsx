import { useState } from 'react';
import './Login.css';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '' });

  // Manejador centralizado para los inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleToggle = () => {
    setIsLogin(!isLogin);
    // Limpiar la contraseña si el usuario cambia de vista
    setFormData(prev => ({ ...prev, password: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(isLogin ? 'Iniciando sesión con:' : 'Registrando con:', formData);
    alert(isLogin ? 'Mock: Sesión Iniciada' : 'Mock: Usuario Registrado');
    // Aquí conectarás con tu Backend 
  };

  return (
    <div className="login-container">
      <h2>{isLogin ? '¡Bienvenido de vuelta!' : 'Crea tu cuenta'}</h2>
      <p className="login-subtitle">
        {isLogin 
          ? 'Ingresa tus credenciales para acceder al sistema.' 
          : 'Regístrate para gestionar el estado de tus vehículos.'}
      </p>

      <form onSubmit={handleSubmit} className="login-form">
        
        {/* Usamos un wrapper para agrupar label e input */}
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