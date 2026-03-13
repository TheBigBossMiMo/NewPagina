import calendarioVerificacion from '../assets/calendario_verificacion.png';
import engomadoColores from '../assets/engomado_colores.jpg';
import contingenciaInfo from '../assets/contingencia.jpg';
import './Informacion.css';

const Informacion = () => {
  return (
    <div className="info-page">
      <section className="info-hero">
        <span className="info-badge">Información del programa</span>
        <h1>Programa Hoy No Circula</h1>
        <p>
          Consulta información general sobre el funcionamiento del programa,
          los criterios de restricción vehicular, el calendario de verificación
          y las medidas aplicables en caso de contingencia ambiental.
        </p>
      </section>

      <section className="info-summary">
        <article className="info-summary-card">
          <div className="info-summary-icon">🚗</div>
          <h3>¿Qué es Hoy No Circula?</h3>
          <p>
            Es un programa orientado a regular la circulación vehicular con el
            objetivo de disminuir emisiones contaminantes y contribuir al
            mejoramiento de la calidad del aire.
          </p>
        </article>

        <article className="info-summary-card">
          <div className="info-summary-icon">📋</div>
          <h3>¿Cómo funciona?</h3>
          <p>
            La restricción depende del color del engomado, el último dígito de
            la placa, el holograma de verificación y, en algunos casos, de
            condiciones extraordinarias como contingencias ambientales.
          </p>
        </article>

        <article className="info-summary-card">
          <div className="info-summary-icon">🌿</div>
          <h3>Objetivo ambiental</h3>
          <p>
            El programa busca reducir la cantidad de vehículos en circulación en
            determinados días y horarios para disminuir contaminantes en la
            atmósfera.
          </p>
        </article>
      </section>

      <section className="info-section">
        <div className="info-section-header">
          <h2>¿Cómo funciona el programa?</h2>
          <p>
            La circulación de los vehículos puede restringirse con base en
            diferentes criterios establecidos por la normativa aplicable.
          </p>
        </div>

        <div className="info-grid-two">
          <article className="info-card">
            <h3>Color del engomado y terminación de placa</h3>
            <p>
              Uno de los criterios principales del programa es el color del
              engomado y el último número de la placa de circulación. A partir
              de estos elementos se determina el día en el que un vehículo puede
              tener restricción.
            </p>
          </article>

          <article className="info-card">
            <h3>Holograma de verificación</h3>
            <p>
              El tipo de holograma también influye en las condiciones de
              circulación. Dependiendo de la clasificación del vehículo, pueden
              existir diferencias en los días de restricción y en las
              disposiciones aplicables.
            </p>
          </article>

          <article className="info-card">
            <h3>Horario de restricción</h3>
            <p>
              En términos generales, la restricción se aplica dentro de un
              horario determinado durante el día. Este horario puede variar si
              existe una contingencia ambiental o una disposición extraordinaria.
            </p>
          </article>

          <article className="info-card">
            <h3>Condiciones extraordinarias</h3>
            <p>
              En episodios de mala calidad del aire, las autoridades pueden
              establecer medidas adicionales. En esos casos, más vehículos pueden
              quedar sujetos a limitaciones temporales de circulación.
            </p>
          </article>
        </div>
      </section>

      <section className="info-section">
        <div className="info-section-header">
          <h2>Información visual de apoyo</h2>
          <p>
            Estas referencias ayudan a entender mejor los criterios del programa
            y la forma en que se organizan los periodos de verificación.
          </p>
        </div>

        <div className="info-visual-block">
          <article className="info-visual-card">
            <div className="info-visual-text">
              <span className="info-mini-badge">Calendario</span>
              <h3>Periodo de verificación vehicular</h3>
              <p>
                Consulta los periodos en los que corresponde verificar el
                vehículo según el color del engomado y la terminación de la
                placa.
              </p>
            </div>
            <div className="info-visual-image-wrap">
              <img
                src={calendarioVerificacion}
                alt="Calendario de verificación vehicular"
                className="info-visual-image"
              />
            </div>
          </article>

          <article className="info-visual-card">
            <div className="info-visual-text">
              <span className="info-mini-badge">Engomado</span>
              <h3>Colores y terminación de placa</h3>
              <p>
                El color del engomado y el último dígito de la placa permiten
                identificar el día correspondiente de restricción vehicular.
              </p>
            </div>
            <div className="info-visual-image-wrap">
              <img
                src={engomadoColores}
                alt="Colores de engomado y terminación de placa"
                className="info-visual-image"
              />
            </div>
          </article>

          <article className="info-visual-card">
            <div className="info-visual-text">
              <span className="info-mini-badge">Contingencia</span>
              <h3>Restricciones por contingencia ambiental</h3>
              <p>
                En situaciones extraordinarias pueden aplicarse medidas
                complementarias para reducir el impacto ambiental en la zona
                metropolitana.
              </p>
            </div>
            <div className="info-visual-image-wrap">
              <img
                src={contingenciaInfo}
                alt="Restricciones por contingencia ambiental"
                className="info-visual-image"
              />
            </div>
          </article>
        </div>
      </section>

      <section className="info-section info-recommendations">
        <div className="info-section-header">
          <h2>Recomendaciones para el ciudadano</h2>
          <p>
            Antes de circular, es conveniente revisar la información actual del
            programa y considerar las condiciones particulares del vehículo.
          </p>
        </div>

        <div className="info-recommendations-list">
          <div className="recommendation-item">
            Verifica que los datos del vehículo estén actualizados.
          </div>
          <div className="recommendation-item">
            Consulta el calendario y el tipo de holograma correspondiente.
          </div>
          <div className="recommendation-item">
            Revisa si existen avisos por contingencia ambiental.
          </div>
          <div className="recommendation-item">
            Planea tus traslados considerando restricciones y horarios.
          </div>
        </div>
      </section>
    </div>
  );
};

export default Informacion;