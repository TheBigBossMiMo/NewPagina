import "./TermsOfUse.css";

const TermsOfUse = () => {
  return (
    <div className="terms-container">
      <div className="terms-card">
        <h1>Términos y Condiciones de Uso</h1>

        <p className="terms-updated">
          <strong>Última actualización:</strong> Marzo 2026
        </p>

        <p className="terms-intro">
          Bienvenido a HOY NO CIRCULA – Sistema de Gestión Vehicular CDMX. Al acceder y utilizar
          esta plataforma, usted acepta los presentes Términos y Condiciones. Si no está de acuerdo
          con alguno de ellos, deberá abstenerse de utilizar el servicio.
        </p>

        <h2>1. Aceptación de los términos</h2>
        <p>
          El acceso y uso de la plataforma implica la aceptación expresa de estos Términos y
          Condiciones, así como de las políticas complementarias publicadas en el sitio.
        </p>

        <h2>2. Objeto del servicio</h2>
        <p>
          La plataforma HOY NO CIRCULA tiene como finalidad proporcionar información relacionada con
          el programa de circulación vehicular, verificación, contingencias ambientales y servicios
          relacionados dentro de la Ciudad de México.
        </p>

        <h2>3. Registro y cuentas de usuario</h2>
        <p>
          Para acceder a ciertas funcionalidades, el usuario deberá crear una cuenta proporcionando
          información veraz y actualizada. El usuario es responsable de mantener la confidencialidad
          de sus credenciales de acceso.
        </p>

        <h2>4. Obligaciones del usuario</h2>
        <ul>
          <li>Utilizar la plataforma de manera lícita y conforme a la normativa vigente.</li>
          <li>No realizar actividades que puedan afectar la seguridad del sistema.</li>
          <li>No proporcionar información falsa o inexacta.</li>
          <li>No intentar acceder a áreas restringidas sin autorización.</li>
        </ul>

        <h2>5. Limitación de responsabilidad</h2>
        <p>
          HOY NO CIRCULA proporciona información con fines informativos. No se garantiza que la
          información esté libre de errores o desactualizaciones. El usuario es responsable de
          verificar la información directamente con las autoridades correspondientes.
        </p>

        <h2>6. Propiedad intelectual</h2>
        <p>
          Todos los contenidos, diseños, logotipos y elementos visuales de la plataforma son
          propiedad del proyecto HOY NO CIRCULA o se utilizan con autorización correspondiente.
        </p>

        <h2>7. Modificaciones</h2>
        <p>
          La plataforma se reserva el derecho de modificar los presentes Términos y Condiciones en
          cualquier momento. Las modificaciones entrarán en vigor una vez publicadas en el sitio.
        </p>

        <h2>8. Legislación aplicable</h2>
        <p>
          Estos Términos se rigen por las leyes aplicables en los Estados Unidos Mexicanos. Cualquier
          controversia será sometida a la jurisdicción competente en la Ciudad de México.
        </p>
      </div>
    </div>
  );
};

export default TermsOfUse;