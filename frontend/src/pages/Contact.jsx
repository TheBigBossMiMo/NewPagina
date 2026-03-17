import { useRef, useState } from "react";
import emailjs from "@emailjs/browser";
import "./Contact.css";

const Contact = () => {
  const form = useRef(null);

  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" }); // type: "success" | "error"

  const sendEmail = async (e) => {
    e.preventDefault();

    if (!form.current) return;

    const data = new FormData(form.current);
    const nombre = (data.get("nombre") || "").toString().trim();
    const correo = (data.get("correo") || "").toString().trim();
    const rol = (data.get("rol") || "").toString().trim();
    const asunto = (data.get("asunto") || "").toString().trim();
    const mensaje = (data.get("mensaje") || "").toString().trim();

    if (!nombre || !correo || !rol || !asunto || !mensaje) {
      setStatus({
        type: "error",
        message: "Completa todos los campos sin dejar espacios vacíos.",
      });
      return;
    }

    try {
      setSending(true);
      setStatus({ type: "", message: "" });

      await emailjs.sendForm(
        "service_hh4jmie",
        "template_ahperpw",
        form.current,
        "9K36SMc1PKLEaR_Yk"
      );

      setStatus({
        type: "success",
        message: "Mensaje enviado correctamente 🚗✅",
      });

      form.current.reset();
    } catch (error) {
      console.error("EmailJS error:", error);
      setStatus({
        type: "error",
        message: "Error al enviar ❌. Revisa la configuración de EmailJS.",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="contact-container">
      <div className="contact-wrapper">
        <div className="contact-header">
          <span className="contact-badge">Centro de soporte</span>
          <h1>¿Necesitas ayuda?</h1>
          <p>
            Ponte en contacto con nosotros para resolver dudas sobre tu registro,
            circulación, verificación vehicular o cualquier detalle del sistema.
          </p>
        </div>

        <div className="contact-card">
          <div className="contact-info">
            <div className="contact-info-content">
              <div className="contact-icon-box">🚗</div>
              <h2>Hoy No Circula</h2>
              <p>
                ¿Tienes dudas sobre verificación, restricciones o tu registro?
                Escríbenos y te respondemos lo antes posible.
              </p>

              <div className="contact-highlights">
                <div className="contact-highlight">
                  <span>✓</span>
                  <p>Soporte para ciudadanos y empresas</p>
                </div>
                <div className="contact-highlight">
                  <span>✓</span>
                  <p>Atención sobre circulación y verificación</p>
                </div>
                <div className="contact-highlight">
                  <span>✓</span>
                  <p>Respuesta por correo electrónico</p>
                </div>
              </div>
            </div>
          </div>

          <div className="contact-form">
            <div className="contact-form-header">
              <h3>Formulario de Soporte</h3>
              <p>Completa los datos y envíanos tu mensaje.</p>
            </div>

            {status.message && (
              <div
                className={`contact-status ${
                  status.type === "success" ? "success" : "error"
                }`}
              >
                {status.message}
              </div>
            )}

            <form ref={form} onSubmit={sendEmail} className="contact-form-fields">
              <div className="contact-grid">
                <div className="contact-field">
                  <label htmlFor="nombre">Nombre completo</label>
                  <input
                    id="nombre"
                    name="nombre"
                    type="text"
                    placeholder="Nombre completo"
                    required
                  />
                </div>

                <div className="contact-field">
                  <label htmlFor="correo">Correo electrónico</label>
                  <input
                    id="correo"
                    name="correo"
                    type="email"
                    placeholder="Correo electrónico"
                    required
                  />
                </div>
              </div>

              <div className="contact-grid">
                <div className="contact-field">
                  <label htmlFor="rol">Rol</label>
                  <input
                    id="rol"
                    name="rol"
                    type="text"
                    placeholder="Rol (Ciudadano, Empresa...)"
                    required
                  />
                </div>

                <div className="contact-field">
                  <label htmlFor="asunto">Asunto</label>
                  <input
                    id="asunto"
                    name="asunto"
                    type="text"
                    placeholder="Asunto"
                    required
                  />
                </div>
              </div>

              <div className="contact-field">
                <label htmlFor="mensaje">Mensaje</label>
                <textarea
                  id="mensaje"
                  name="mensaje"
                  placeholder="Escribe tu mensaje..."
                  required
                />
              </div>

              <button type="submit" disabled={sending}>
                {sending ? "Enviando..." : "Enviar Mensaje"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;