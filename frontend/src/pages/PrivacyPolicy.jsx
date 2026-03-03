import React from "react";
import "./PrivacyPolicy.css";

const PrivacyPolicy = () => {
  return (
    <div className="privacy-container">
      <h1>Aviso de Privacidad</h1>
      <p><strong>Última actualización:</strong> Marzo 2026</p>

      <p>
        HOY NO CIRCULA - Sistema de Gestión Vehicular CDMX (en adelante "el Responsable"),
        con domicilio en Ciudad de México, México, es responsable del uso y protección
        de sus datos personales, y al respecto le informa lo siguiente:
      </p>

      <h2>1. ¿Qué datos personales recabamos?</h2>
      <p>Para el uso de la plataforma se podrán recabar los siguientes datos:</p>
      <ul>
        <li>Datos de identificación: Nombre completo.</li>
        <li>Datos de contacto: Correo electrónico.</li>
        <li>Datos vehiculares: Placa del vehículo, tipo de vehículo.</li>
        <li>Datos de autenticación: Información necesaria para iniciar sesión.</li>
      </ul>

      <h2>2. ¿Para qué fines utilizamos sus datos?</h2>
      <p><strong>Finalidades primarias:</strong></p>
      <ul>
        <li>Permitir el registro y consulta de vehículos.</li>
        <li>Proporcionar información del programa "Hoy No Circula".</li>
        <li>Gestionar el acceso a la cuenta del usuario.</li>
        <li>Mejorar la experiencia dentro de la plataforma.</li>
      </ul>

      <p><strong>Finalidades secundarias:</strong></p>
      <ul>
        <li>Estadísticas de uso para mejora del sistema.</li>
        <li>Notificaciones relacionadas con cambios en el programa vehicular.</li>
      </ul>

      <h2>3. Transferencia de datos</h2>
      <p>
        Sus datos podrán ser compartidos con proveedores de servicios tecnológicos
        para el alojamiento de la infraestructura (servidores y base de datos),
        así como con autoridades competentes cuando sea legalmente requerido.
      </p>
      <p>
        No se venden ni rentan datos personales a terceros con fines comerciales.
      </p>

      <h2>4. Derechos ARCO</h2>
      <p>
        Usted tiene derecho a acceder, rectificar, cancelar u oponerse al uso
        de sus datos personales (Derechos ARCO).
      </p>
      <p>
        Para ejercer estos derechos puede enviar una solicitud al correo:
        <strong> privacidad@hoynocircula.app</strong>
      </p>

      <h2>5. Uso de cookies</h2>
      <p>
        Esta plataforma puede utilizar cookies y tecnologías similares para
        mejorar la experiencia del usuario.
      </p>

      <h2>6. Cambios al Aviso de Privacidad</h2>
      <p>
        El presente aviso puede ser modificado en cualquier momento.
        Las actualizaciones serán publicadas dentro de la plataforma.
      </p>
    </div>
  );
};

export default PrivacyPolicy;