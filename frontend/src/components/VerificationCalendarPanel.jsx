import { useMemo, useState } from 'react';
import './VerificationCalendarPanel.css';

const calendarDataByRegion = {
  cdmx: {
    key: 'cdmx',
    label: 'CDMX',
    badge: 'Calendario CDMX',
    description:
      'Consulta visualmente el calendario de verificación para CDMX según color de engomado y terminación de placa.',
    schedule: [
      {
        id: 'amarillo',
        engomado: 'Amarillo',
        colorClass: 'calendar-color-yellow',
        terminaciones: ['5', '6'],
        primerPeriodo: 'Enero - Febrero',
        segundoPeriodo: 'Julio - Agosto',
        etiqueta: 'Periodo correspondiente al engomado amarillo'
      },
      {
        id: 'rosa',
        engomado: 'Rosa',
        colorClass: 'calendar-color-pink',
        terminaciones: ['7', '8'],
        primerPeriodo: 'Febrero - Marzo',
        segundoPeriodo: 'Agosto - Septiembre',
        etiqueta: 'Periodo correspondiente al engomado rosa'
      },
      {
        id: 'rojo',
        engomado: 'Rojo',
        colorClass: 'calendar-color-red',
        terminaciones: ['3', '4'],
        primerPeriodo: 'Marzo - Abril',
        segundoPeriodo: 'Septiembre - Octubre',
        etiqueta: 'Periodo correspondiente al engomado rojo'
      },
      {
        id: 'verde',
        engomado: 'Verde',
        colorClass: 'calendar-color-green',
        terminaciones: ['1', '2'],
        primerPeriodo: 'Abril - Mayo',
        segundoPeriodo: 'Octubre - Noviembre',
        etiqueta: 'Periodo correspondiente al engomado verde'
      },
      {
        id: 'azul',
        engomado: 'Azul',
        colorClass: 'calendar-color-blue',
        terminaciones: ['9', '0'],
        primerPeriodo: 'Mayo - Junio',
        segundoPeriodo: 'Noviembre - Diciembre',
        etiqueta: 'Periodo correspondiente al engomado azul'
      }
    ]
  },
  edomex: {
    key: 'edomex',
    label: 'EDOMEX',
    badge: 'Calendario EDOMEX',
    description:
      'Consulta visualmente el calendario de verificación para Estado de México según color de engomado y terminación.',
    schedule: [
      {
        id: 'amarillo',
        engomado: 'Amarillo',
        colorClass: 'calendar-color-yellow',
        terminaciones: ['5', '6'],
        primerPeriodo: 'Enero - Febrero',
        segundoPeriodo: 'Julio - Agosto',
        etiqueta: 'Periodo correspondiente al engomado amarillo'
      },
      {
        id: 'rosa',
        engomado: 'Rosa',
        colorClass: 'calendar-color-pink',
        terminaciones: ['7', '8'],
        primerPeriodo: 'Febrero - Marzo',
        segundoPeriodo: 'Agosto - Septiembre',
        etiqueta: 'Periodo correspondiente al engomado rosa'
      },
      {
        id: 'rojo',
        engomado: 'Rojo',
        colorClass: 'calendar-color-red',
        terminaciones: ['3', '4'],
        primerPeriodo: 'Marzo - Abril',
        segundoPeriodo: 'Septiembre - Octubre',
        etiqueta: 'Periodo correspondiente al engomado rojo'
      },
      {
        id: 'verde',
        engomado: 'Verde',
        colorClass: 'calendar-color-green',
        terminaciones: ['1', '2'],
        primerPeriodo: 'Abril - Mayo',
        segundoPeriodo: 'Octubre - Noviembre',
        etiqueta: 'Periodo correspondiente al engomado verde'
      },
      {
        id: 'azul',
        engomado: 'Azul',
        colorClass: 'calendar-color-blue',
        terminaciones: ['9', '0'],
        primerPeriodo: 'Mayo - Junio',
        segundoPeriodo: 'Noviembre - Diciembre',
        etiqueta: 'Periodo correspondiente al engomado azul'
      }
    ]
  }
};

const allTerminations = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

const VerificationCalendarPanel = () => {
  const [selectedRegion, setSelectedRegion] = useState('cdmx');
  const [selectedTermination, setSelectedTermination] = useState('');
  const [selectedEngomado, setSelectedEngomado] = useState('');

  const currentRegion = calendarDataByRegion[selectedRegion];
  const verificationSchedule = currentRegion.schedule;

  const terminationMatch = useMemo(() => {
    if (!selectedTermination) return null;

    return verificationSchedule.find((item) =>
      item.terminaciones.includes(selectedTermination)
    );
  }, [selectedTermination, verificationSchedule]);

  const engomadoMatch = useMemo(() => {
    if (!selectedEngomado) return null;

    return verificationSchedule.find(
      (item) => item.engomado.toLowerCase() === selectedEngomado.toLowerCase()
    );
  }, [selectedEngomado, verificationSchedule]);

  const handleChangeRegion = (region) => {
    setSelectedRegion(region);
    setSelectedTermination('');
    setSelectedEngomado('');
  };

  const handleSelectTermination = (termination) => {
    setSelectedTermination((prev) => (prev === termination ? '' : termination));
  };

  const handleSelectEngomado = (engomado) => {
    setSelectedEngomado((prev) => (prev === engomado ? '' : engomado));
  };

  const handleResetTermination = () => {
    setSelectedTermination('');
  };

  const handleResetEngomado = () => {
    setSelectedEngomado('');
  };

  return (
    <div className="verification-calendar-panel">
      <div className="calendar-region-switcher">
        <div className="calendar-region-switcher-header">
          <span className="verification-calendar-badge">Selecciona la entidad</span>
          <h4>Calendarios por entidad</h4>
          <p>
            Puedes alternar entre <strong>CDMX</strong> y <strong>EDOMEX</strong> para
            visualizar el calendario correspondiente dentro del mismo módulo.
          </p>
        </div>

        <div className="calendar-region-buttons">
          <button
            type="button"
            className={`calendar-region-btn ${
              selectedRegion === 'cdmx' ? 'calendar-region-btn-active' : ''
            }`}
            onClick={() => handleChangeRegion('cdmx')}
          >
            CDMX
          </button>

          <button
            type="button"
            className={`calendar-region-btn ${
              selectedRegion === 'edomex' ? 'calendar-region-btn-active' : ''
            }`}
            onClick={() => handleChangeRegion('edomex')}
          >
            EDOMEX
          </button>
        </div>
      </div>

      <div className="calendar-modal-summary">
        <div className="calendar-modal-summary-icon">🗓️</div>

        <div className="calendar-modal-summary-content">
          <span className="verification-calendar-badge">{currentRegion.badge}</span>
          <h4>Calendario de Verificación {currentRegion.label}</h4>
          <p>
            {currentRegion.description} Primero revisa el resumen general y después usa
            los filtros divididos por tipo de búsqueda.
          </p>

          <div className="calendar-summary-pills">
            <span>{currentRegion.label}</span>
            <span>Engomado</span>
            <span>Terminación</span>
            <span>Consulta visual</span>
          </div>
        </div>
      </div>

      <div className="calendar-table-wrapper">
        <div className="calendar-table-header">
          <h5>Resumen general del calendario {currentRegion.label}</h5>
          <p>
            Esta tabla muestra de forma rápida qué periodos corresponden a cada color
            de engomado y sus terminaciones asociadas para {currentRegion.label}.
          </p>
        </div>

        <div className="calendar-table">
          <div className="calendar-table-row calendar-table-head">
            <span>Engomado</span>
            <span>Terminación</span>
            <span>Primer periodo</span>
            <span>Segundo periodo</span>
          </div>

          {verificationSchedule.map((item) => (
            <div key={`${currentRegion.key}-${item.id}`} className="calendar-table-row">
              <span>
                <i className={`calendar-inline-dot ${item.colorClass}`}></i>
                {item.engomado}
              </span>
              <span>{item.terminaciones.join(' y ')}</span>
              <span>{item.primerPeriodo}</span>
              <span>{item.segundoPeriodo}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="calendar-dual-layout">
        <div className="calendar-filter-column">
          <div className="calendar-filter-block">
            <div className="calendar-filter-title-row">
              <h5>Filtro por engomado</h5>
              {selectedEngomado && (
                <span className="calendar-filter-status">
                  Seleccionado: {selectedEngomado}
                </span>
              )}
            </div>

            <p className="calendar-filter-text">
              Selecciona el color del engomado y el resultado aparecerá en esta misma
              columna para {currentRegion.label}.
            </p>

            <div className="calendar-engomado-actions">
              {verificationSchedule.map((item) => (
                <button
                  key={`${currentRegion.key}-engomado-${item.id}`}
                  type="button"
                  className={`calendar-engomado-btn ${item.colorClass} ${
                    selectedEngomado === item.engomado
                      ? 'calendar-engomado-btn-active'
                      : ''
                  }`}
                  onClick={() => handleSelectEngomado(item.engomado)}
                >
                  {item.engomado}
                </button>
              ))}

              <button
                type="button"
                className="calendar-reset-btn"
                onClick={handleResetEngomado}
              >
                Limpiar
              </button>
            </div>
          </div>

          <div className="calendar-side-result">
            {engomadoMatch ? (
              <article className={`calendar-result-card ${engomadoMatch.colorClass}`}>
                <div className="calendar-result-label">Resultado por engomado</div>
                <h5>
                  {engomadoMatch.engomado} - {currentRegion.label}
                </h5>
                <p>{engomadoMatch.etiqueta}</p>

                <div className="calendar-result-list">
                  <div>
                    <span>Terminaciones</span>
                    <strong>{engomadoMatch.terminaciones.join(' y ')}</strong>
                  </div>
                  <div>
                    <span>Primer periodo</span>
                    <strong>{engomadoMatch.primerPeriodo}</strong>
                  </div>
                  <div>
                    <span>Segundo periodo</span>
                    <strong>{engomadoMatch.segundoPeriodo}</strong>
                  </div>
                </div>
              </article>
            ) : (
              <div className="calendar-empty-result">
                <div className="calendar-empty-icon">🎨</div>
                <h5>Sin engomado seleccionado</h5>
                <p>
                  Elige un color para mostrar aquí su periodo correspondiente de{' '}
                  {currentRegion.label}.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="calendar-filter-column">
          <div className="calendar-filter-block">
            <div className="calendar-filter-title-row">
              <h5>Filtro por terminación</h5>
              {selectedTermination && (
                <span className="calendar-filter-status">
                  Seleccionada: {selectedTermination}
                </span>
              )}
            </div>

            <p className="calendar-filter-text">
              Selecciona la terminación de placa y el resultado aparecerá en esta misma
              columna para {currentRegion.label}.
            </p>

            <div className="calendar-termination-chips">
              {allTerminations.map((termination) => (
                <button
                  key={`${currentRegion.key}-termination-${termination}`}
                  type="button"
                  className={`calendar-chip ${
                    selectedTermination === termination
                      ? 'calendar-chip-active'
                      : ''
                  }`}
                  onClick={() => handleSelectTermination(termination)}
                >
                  {termination}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="calendar-reset-btn calendar-reset-inline"
              onClick={handleResetTermination}
            >
              Limpiar
            </button>
          </div>

          <div className="calendar-side-result">
            {terminationMatch ? (
              <article className={`calendar-result-card ${terminationMatch.colorClass}`}>
                <div className="calendar-result-label">Resultado por terminación</div>
                <h5>
                  Terminación {selectedTermination} - {currentRegion.label}
                </h5>
                <p>
                  Esta terminación corresponde al engomado{' '}
                  <strong>{terminationMatch.engomado}</strong>.
                </p>

                <div className="calendar-result-list">
                  <div>
                    <span>Engomado</span>
                    <strong>{terminationMatch.engomado}</strong>
                  </div>
                  <div>
                    <span>Primer periodo</span>
                    <strong>{terminationMatch.primerPeriodo}</strong>
                  </div>
                  <div>
                    <span>Segundo periodo</span>
                    <strong>{terminationMatch.segundoPeriodo}</strong>
                  </div>
                </div>
              </article>
            ) : (
              <div className="calendar-empty-result">
                <div className="calendar-empty-icon">🔢</div>
                <h5>Sin terminación seleccionada</h5>
                <p>
                  Elige un número para mostrar aquí su información de verificación de{' '}
                  {currentRegion.label}.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="calendar-help-card">
        <div className="calendar-help-icon">ℹ️</div>
        <div>
          <h5>¿Cómo usar este calendario?</h5>
          <p>
            Primero selecciona la entidad. Después revisa el resumen general y usa el
            filtro por color de engomado en la columna izquierda o por terminación en la
            columna derecha, sin que la información se vea amontonada.
          </p>
          <p className="calendar-help-note">
            La consulta personalizada por placa se encuentra disponible en el módulo de
            Verificación Vehicular.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerificationCalendarPanel;