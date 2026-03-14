import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './RegistrarseUsuario.css';
import ReCAPTCHA from 'react-google-recaptcha';
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";

const RECAPTCHA_SITE_KEY = '6LdgD4gsAAAAALf7kD2DgFo4veYQ9sndxWxh3Y1B';
/*const API_URL = 'http://localhost:3000/api/auth';*/
/*const API_URL = 'https://hoynocircula-backend.onrender.com/api/auth';*/
const API_URL = import.meta.env.VITE_API_URL;


const initialForm = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false,
  notRobot: false
};

const RegistrarseUsuario = () => {
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const recaptchaRef = useRef(null);
  const otpInputRefs = useRef([]);

  const [captchaOk, setCaptchaOk] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpExpiresIn, setOtpExpiresIn] = useState(300);
  const [resendIn, setResendIn] = useState(60);
  const [pendingUser, setPendingUser] = useState(null);

  const navigate = useNavigate();

  const normalizeEmail = (email) => (email || '').trim().toLowerCase();
  const normalizePhone = (phone) => (phone || '').replace(/\D/g, '');

  const clearUX = () => {
    setMsg(null);
  };

  const generateOtp = () => {
    return String(Math.floor(100000 + Math.random() * 900000));
  };

  const maskEmail = (email) => {
    const safeEmail = normalizeEmail(email);
    const [name, domain] = safeEmail.split('@');
    if (!name || !domain) return safeEmail;
    if (name.length <= 2) return `${name[0] || '*'}***@${domain}`;
    return `${name.slice(0, 2)}****@${domain}`;
  };

  const passwordChecks = useMemo(() => {
    const password = formData.password || '';
    return {
      minLength: password.length >= 8,
      uppercase: /[A-ZÁÉÍÓÚÑ]/.test(password),
      lowercase: /[a-záéíóúñ]/.test(password),
      number: /\d/.test(password),
      special: /[^A-Za-zÁÉÍÓÚáéíóúÑñ0-9]/.test(password)
    };
  }, [formData.password]);

  const passwordStrength = useMemo(() => {
    const checks = Object.values(passwordChecks).filter(Boolean).length;

    if (!formData.password) {
      return { label: 'Sin evaluar', className: 'none', percent: 0 };
    }

    if (checks <= 2) {
      return { label: 'Débil', className: 'weak', percent: 33 };
    }

    if (checks <= 4) {
      return { label: 'Media', className: 'medium', percent: 66 };
    }

    return { label: 'Fuerte', className: 'strong', percent: 100 };
  }, [passwordChecks, formData.password]);

  const isSubmitDisabled = saving || !formData.acceptTerms || !captchaOk;

  useEffect(() => {
    if (!showOtpModal || otpExpiresIn <= 0) return;

    const timer = setInterval(() => {
      setOtpExpiresIn((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [showOtpModal, otpExpiresIn]);

  useEffect(() => {
    if (!showOtpModal || resendIn <= 0) return;

    const timer = setInterval(() => {
      setResendIn((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [showOtpModal, resendIn]);

  useEffect(() => {
    if (showOtpModal && otpInputRefs.current[0]) {
      otpInputRefs.current[0].focus();
    }
  }, [showOtpModal]);

  const formatTime = (seconds) => {
    const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
    const secs = String(seconds % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'fullName': {
        const cleanValue = (value || '').trim();
        if (!cleanValue) return 'El nombre completo es obligatorio.';
        if (cleanValue.length < 3) return 'Ingresa un nombre válido.';
        if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(cleanValue)) {
          return 'El nombre solo debe contener letras y espacios.';
        }
        return '';
      }

      case 'email': {
        const cleanValue = normalizeEmail(value);
        if (!cleanValue) return 'El correo es obligatorio.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanValue)) {
          return 'Ingresa un correo válido.';
        }
        return '';
      }

      case 'phone': {
        const cleanValue = normalizePhone(value);
        if (!cleanValue) return 'El número telefónico es obligatorio.';
        if (cleanValue.length < 10) return 'Ingresa un número telefónico válido.';
        return '';
      }

      case 'password': {
        if (!value) return 'La contraseña es obligatoria.';
        if (value.length < 8) return 'Debe tener al menos 8 caracteres.';
        if (!/[A-ZÁÉÍÓÚÑ]/.test(value)) return 'Debe incluir al menos una mayúscula.';
        if (!/[a-záéíóúñ]/.test(value)) return 'Debe incluir al menos una minúscula.';
        if (!/\d/.test(value)) return 'Debe incluir al menos un número.';
        if (!/[^A-Za-zÁÉÍÓÚáéíóúÑñ0-9]/.test(value)) {
          return 'Debe incluir al menos un carácter especial.';
        }
        return '';
      }

      case 'confirmPassword': {
        if (!value) return 'Confirma tu contraseña.';
        if (value !== formData.password) return 'Las contraseñas no coinciden.';
        return '';
      }

      case 'acceptTerms': {
        if (!value) return 'Debes aceptar los términos y condiciones.';
        return '';
      }

      case 'notRobot': {
        if (!value) return 'Confirma que no eres un robot.';
        return '';
      }

      default:
        return '';
    }
  };

  const validateForm = () => {
    const newErrors = {
      fullName: validateField('fullName', formData.fullName),
      email: validateField('email', formData.email),
      phone: validateField('phone', formData.phone),
      password: validateField('password', formData.password),
      confirmPassword: validateField('confirmPassword', formData.confirmPassword),
      acceptTerms: validateField('acceptTerms', formData.acceptTerms),
      notRobot: validateField('notRobot', formData.notRobot)
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const handleChange = (e) => {
    clearUX();
    const { name, value, type, checked } = e.target;
    const nextValue = type === 'checkbox' ? checked : value;

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: nextValue
      };

      setErrors((prevErrors) => {
        const updatedErrors = {
          ...prevErrors,
          [name]: validateField(name, nextValue)
        };

        if (name === 'password') {
          updatedErrors.confirmPassword = validateField(
            'confirmPassword',
            updated.confirmPassword
          );
        }

        return updatedErrors;
      });

      return updated;
    });
  };

  const handleBlur = (e) => {
    const { name, type, checked, value } = e.target;
    const nextValue = type === 'checkbox' ? checked : value;

    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, nextValue)
    }));
  };

  const handleCaptchaChange = (value) => {
    const verified = Boolean(value);

    setCaptchaToken(value || '');
    setCaptchaOk(verified);

    setFormData((prev) => ({
      ...prev,
      notRobot: verified
    }));

    setErrors((prev) => ({
      ...prev,
      notRobot: validateField('notRobot', verified)
    }));

    if (verified) {
      setMsg(null);
    }
  };

  const handleCaptchaExpired = () => {
    setCaptchaToken('');
    setCaptchaOk(false);

    setFormData((prev) => ({
      ...prev,
      notRobot: false
    }));

    setErrors((prev) => ({
      ...prev,
      notRobot: 'El reCAPTCHA expiró. Vuélvelo a completar.'
    }));
  };

  const handleCaptchaErrored = () => {
    setCaptchaToken('');
    setCaptchaOk(false);

    setFormData((prev) => ({
      ...prev,
      notRobot: false
    }));

    setErrors((prev) => ({
      ...prev,
      notRobot: 'Ocurrió un error con reCAPTCHA. Inténtalo de nuevo.'
    }));
  };

  const resetCaptcha = () => {
    setCaptchaToken('');
    setCaptchaOk(false);

    setFormData((prev) => ({
      ...prev,
      notRobot: false
    }));

    if (recaptchaRef.current) {
      recaptchaRef.current.reset();
    }
  };

  const openOtpFlow = async (userData) => {
    try {
      const response = await fetch(`${API_URL}/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: userData.email
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'No se pudo enviar el código');
      }

      setPendingUser(userData);
      setGeneratedOtp('');
      setOtpDigits(['', '', '', '', '', '']);
      setOtpExpiresIn(300);
      setResendIn(60);
      setShowOtpModal(true);

      setMsg({
        type: 'ok',
        text: 'Se envió un código de verificación a tu correo.'
      });
    } catch (error) {
      console.error('Error enviando OTP:', error);
      setMsg({
        type: 'err',
        text: error.message || 'No se pudo enviar el correo de verificación.'
      });
    }
  };

  const handleGoogleRegister = async (credentialResponse) => {
    try {
      clearUX();

      const decoded = jwtDecode(credentialResponse.credential);
      const email = normalizeEmail(decoded.email);

      const response = await fetch(`${API_URL}/google-register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fullName: decoded.name || '',
          email,
          phone: '',
          password: '',
          verified: true,
          provider: 'google',
          picture: decoded.picture || ''
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'No se pudo completar el registro con Google.');
      }

      setMsg({
        type: 'ok',
        text: 'Cuenta registrada con Google correctamente. Ahora ya puedes iniciar sesión.'
      });

      setTimeout(() => {
        navigate('/login');
      }, 1400);
    } catch (error) {
      console.error('Error al procesar registro con Google:', error);
      setMsg({
        type: 'err',
        text: error.message || 'No se pudo completar el registro con Google.'
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    clearUX();

    if (!captchaOk || !captchaToken) {
      setErrors((prev) => ({
        ...prev,
        notRobot: 'Confirma que no eres un robot.'
      }));
      setMsg({ type: 'err', text: 'Completa el reCAPTCHA para continuar.' });
      return;
    }

    if (!validateForm()) {
      setMsg({ type: 'err', text: 'Corrige los campos marcados para continuar.' });
      return;
    }

    const email = normalizeEmail(formData.email);
    const phone = normalizePhone(formData.phone);

    const userDraft = {
      fullName: formData.fullName.trim(),
      email,
      phone,
      password: formData.password,
      verified: false,
      provider: 'local',
      captchaToken
    };

    setSaving(true);

    setTimeout(async () => {
      setSaving(false);
      await openOtpFlow(userDraft);
    }, 1000);
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;

    const updated = [...otpDigits];
    updated[index] = value;
    setOtpDigits(updated);

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleCloseOtpModal = () => {
    setShowOtpModal(false);
    setOtpDigits(['', '', '', '', '', '']);
    setGeneratedOtp('');
    setOtpExpiresIn(300);
    setResendIn(60);
    setPendingUser(null);
  };

  const handleVerifyOtp = async () => {
    const enteredOtp = otpDigits.join('');

    if (otpExpiresIn <= 0) {
      setMsg({ type: 'err', text: 'El código ha expirado. Solicita uno nuevo.' });
      return;
    }

    if (enteredOtp.length !== 6) {
      setMsg({ type: 'err', text: 'Ingresa el código completo de 6 dígitos.' });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: pendingUser?.email,
          otp: enteredOtp,
          fullName: pendingUser?.fullName,
          phone: pendingUser?.phone,
          password: pendingUser?.password
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'El código ingresado es incorrecto.');
      }

      setShowOtpModal(false);
      setPendingUser(null);
      setGeneratedOtp('');
      setOtpDigits(['', '', '', '', '', '']);

      resetCaptcha();
      setErrors({});
      setMsg({ type: 'ok', text: 'Cuenta creada y verificada correctamente. Ahora inicia sesión.' });
      setFormData(initialForm);

      setTimeout(() => {
        navigate('/login');
      }, 1200);
    } catch (error) {
      console.error('Error verificando OTP:', error);
      setMsg({
        type: 'err',
        text: error.message || 'No se pudo verificar el código.'
      });
    }
  };

  const handleResendOtp = async () => {
    if (resendIn > 0 || !pendingUser) return;

    try {
      const response = await fetch(`${API_URL}/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: pendingUser.email
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'No se pudo reenviar el código');
      }

      setGeneratedOtp(generateOtp());
      setOtpDigits(['', '', '', '', '', '']);
      setOtpExpiresIn(300);
      setResendIn(60);

      setMsg({
        type: 'ok',
        text: 'Se envió un nuevo código a tu correo.'
      });
    } catch (error) {
      console.error('Error reenviando OTP:', error);
      setMsg({
        type: 'err',
        text: error.message || 'No se pudo reenviar el código.'
      });
    }
  };

  return (
    <div className="register-page">
      <div className="register-shell">
        <section className="register-side">
          <span className="register-badge">Sistema de Gestión Vehicular</span>

          <h1>Crea tu cuenta y gestiona tus vehículos fácilmente</h1>

          <p className="register-side-text">
            Regístrate para consultar restricciones, administrar datos vehiculares y
            mantenerte al día con el programa Hoy No Circula de forma rápida y segura.
          </p>

          <div className="register-benefits">
            <div className="benefit-item">
              <span className="benefit-icon">✓</span>
              <div>
                <strong>Consulta rápida</strong>
                <p>Verifica si tu vehículo puede circular según terminación y holograma.</p>
              </div>
            </div>

            <div className="benefit-item">
              <span className="benefit-icon">✓</span>
              <div>
                <strong>Registro seguro</strong>
                <p>Guarda tu información con validaciones y proceso de verificación.</p>
              </div>
            </div>

            <div className="benefit-item">
              <span className="benefit-icon">✓</span>
              <div>
                <strong>Experiencia moderna</strong>
                <p>Accede a tu cuenta con un flujo claro, visual y profesional.</p>
              </div>
            </div>
          </div>

          <div className="register-info-card">
            <h3>Acceso inteligente</h3>
            <p>
              También puedes registrarte con Google para agilizar tu acceso y completar tu perfil automáticamente.
            </p>
          </div>
        </section>

        <section className="register-card">
          <div className="register-card-header">
            <h2>Crea tu cuenta</h2>
            <p>Completa tus datos para comenzar a usar la plataforma.</p>
          </div>

          {msg && (
            <div className={`register-alert ${msg.type === 'err' ? 'error' : 'success'}`}>
              <span>{msg.text}</span>
              <button type="button" onClick={() => setMsg(null)}>
                ×
              </button>
            </div>
          )}

          <div className="google-login-box">
            <GoogleLogin
              theme="outline"
              size="large"
              text="continue_with"
              shape="pill"
              width="300"
              onSuccess={handleGoogleRegister}
              onError={() => {
                console.log("Error al iniciar sesión con Google");
                setMsg({
                  type: 'err',
                  text: 'No se pudo iniciar sesión con Google.'
                });
              }}
            />
          </div>

          <p className="google-login-helper">
            Usa tu cuenta de Google para registrarte más rápido.
          </p>

          <div className="register-divider">
            <span>o regístrate con tu correo</span>
          </div>

          <form onSubmit={handleSubmit} className="register-form">
            <div className="input-wrapper">
              <label htmlFor="fullName">Nombre completo</label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Ej. Julio Jesús Mendoza"
                value={formData.fullName}
                onChange={handleChange}
                onBlur={handleBlur}
                autoComplete="name"
              />
              {errors.fullName && <small className="field-error">{errors.fullName}</small>}
            </div>

            <div className="input-wrapper">
              <label htmlFor="email">Correo electrónico</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="ejemplo@correo.com"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                autoComplete="email"
              />
              {errors.email && <small className="field-error">{errors.email}</small>}
            </div>

            <div className="input-wrapper">
              <label htmlFor="phone">Número telefónico</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="5512345678"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                autoComplete="tel"
              />
              {errors.phone && <small className="field-error">{errors.phone}</small>}
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
                  onBlur={handleBlur}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? 'Ocultar' : 'Ver'}
                </button>
              </div>
              {errors.password && <small className="field-error">{errors.password}</small>}

              {formData.password && (
                <div className="password-strength">
                  <div className="password-strength-top">
                    <span>Seguridad de contraseña</span>
                    <strong className={passwordStrength.className}>{passwordStrength.label}</strong>
                  </div>

                  <div className="strength-bar">
                    <div
                      className={`strength-fill ${passwordStrength.className}`}
                      style={{ width: `${passwordStrength.percent}%` }}
                    />
                  </div>

                  <div className="password-rules">
                    <span className={passwordChecks.minLength ? 'ok' : 'bad'}>
                      8 caracteres mínimo
                    </span>
                    <span className={passwordChecks.uppercase ? 'ok' : 'bad'}>
                      Una mayúscula
                    </span>
                    <span className={passwordChecks.lowercase ? 'ok' : 'bad'}>
                      Una minúscula
                    </span>
                    <span className={passwordChecks.number ? 'ok' : 'bad'}>
                      Un número
                    </span>
                    <span className={passwordChecks.special ? 'ok' : 'bad'}>
                      Un carácter especial
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="input-wrapper">
              <label htmlFor="confirmPassword">Confirmar contraseña</label>
              <div className="password-field">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                >
                  {showConfirmPassword ? 'Ocultar' : 'Ver'}
                </button>
              </div>
              {errors.confirmPassword && (
                <small className="field-error">{errors.confirmPassword}</small>
              )}
            </div>

            <div className="captcha-box">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={RECAPTCHA_SITE_KEY}
                onChange={handleCaptchaChange}
                onExpired={handleCaptchaExpired}
                onErrored={handleCaptchaErrored}
              />
            </div>
            {errors.notRobot && <small className="field-error block">{errors.notRobot}</small>}

            <label className="check-card">
              <input
                type="checkbox"
                name="acceptTerms"
                checked={formData.acceptTerms}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              <span>
                Acepto los <Link to="/terminos">términos y condiciones</Link> y el{' '}
                <Link to="/privacidad">aviso de privacidad</Link>
              </span>
            </label>
            {errors.acceptTerms && (
              <small className="field-error block">{errors.acceptTerms}</small>
            )}

            <button type="submit" className="submit-btn" disabled={isSubmitDisabled}>
              {saving ? 'Enviando código...' : 'Registrarse'}
            </button>
          </form>

          <p className="toggle-text">
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
          </p>
        </section>
      </div>

      {showOtpModal && (
        <div className="otp-overlay">
          <div className="otp-modal">
            <h3>Verifica tu cuenta</h3>
            <p className="otp-text">
              Te enviamos un código de verificación de 6 dígitos a{' '}
              <strong>{maskEmail(pendingUser?.email || '')}</strong>.
            </p>

            <div className="otp-inputs">
              {otpDigits.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  ref={(el) => (otpInputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                />
              ))}
            </div>

            <div className="otp-meta">
              <p>El código expira en <strong>{formatTime(otpExpiresIn)}</strong></p>
              <p>
                {resendIn > 0 ? (
                  <>Reenviar código en <strong>{resendIn}s</strong></>
                ) : (
                  <button type="button" className="resend-btn" onClick={handleResendOtp}>
                    Reenviar código
                  </button>
                )}
              </p>
            </div>

            <div className="otp-actions">
              <button type="button" className="otp-cancel" onClick={handleCloseOtpModal}>
                Cancelar
              </button>
              <button type="button" className="otp-verify" onClick={handleVerifyOtp}>
                Verificar código
              </button>
            </div>

            <p className="otp-demo-note">
              Ingresa el código enviado a tu correo electrónico.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrarseUsuario;