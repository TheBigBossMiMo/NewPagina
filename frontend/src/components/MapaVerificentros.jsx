import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  ZoomControl,
  useMap
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapaVerificentros.css';

const MUNICIPIOS_POR_REGION = {
  cdmx: [
    { key: 'alvaro-obregon', nombre: 'Álvaro Obregón', center: [19.3605, -99.2031], zona: 'Poniente' },
    { key: 'azcapotzalco', nombre: 'Azcapotzalco', center: [19.4846, -99.1856], zona: 'Noroeste' },
    { key: 'benito-juarez', nombre: 'Benito Juárez', center: [19.3806, -99.1619], zona: 'Centro-sur' },
    { key: 'coyoacan', nombre: 'Coyoacán', center: [19.3467, -99.1617], zona: 'Sur' },
    { key: 'cuajimalpa', nombre: 'Cuajimalpa', center: [19.3692, -99.291], zona: 'Poniente' },
    { key: 'cuauhtemoc', nombre: 'Cuauhtémoc', center: [19.4333, -99.1477], zona: 'Centro' },
    { key: 'gam', nombre: 'Gustavo A. Madero', center: [19.4978, -99.1269], zona: 'Norte' },
    { key: 'iztacalco', nombre: 'Iztacalco', center: [19.3953, -99.0977], zona: 'Oriente' },
    { key: 'iztapalapa', nombre: 'Iztapalapa', center: [19.3574, -99.0721], zona: 'Oriente' },
    { key: 'magdalena-contreras', nombre: 'Magdalena Contreras', center: [19.3204, -99.241], zona: 'Poniente' },
    { key: 'miguel-hidalgo', nombre: 'Miguel Hidalgo', center: [19.4341, -99.2], zona: 'Poniente' },
    { key: 'milpa-alta', nombre: 'Milpa Alta', center: [19.1919, -99.0236], zona: 'Sur' },
    { key: 'tlahuac', nombre: 'Tláhuac', center: [19.2869, -99.0037], zona: 'Oriente' },
    { key: 'tlalpan', nombre: 'Tlalpan', center: [19.2879, -99.1712], zona: 'Sur' },
    { key: 'venustiano-carranza', nombre: 'Venustiano Carranza', center: [19.4302, -99.1132], zona: 'Centro-oriente' },
    { key: 'xochimilco', nombre: 'Xochimilco', center: [19.2577, -99.1036], zona: 'Sur' }
  ],
  edomex: [
    { key: 'nezahualcoyotl', nombre: 'Nezahualcóyotl', center: [19.4006, -99.0148], zona: 'Oriente' },
    { key: 'chimalhuacan', nombre: 'Chimalhuacán', center: [19.4217, -98.9474], zona: 'Oriente' },
    { key: 'ecatepec', nombre: 'Ecatepec', center: [19.6019, -99.0507], zona: 'Norte' },
    { key: 'tlalnepantla', nombre: 'Tlalnepantla', center: [19.5405, -99.1943], zona: 'Poniente' },
    { key: 'naucalpan', nombre: 'Naucalpan', center: [19.4752, -99.2371], zona: 'Poniente' },
    { key: 'atizapan', nombre: 'Atizapán', center: [19.5594, -99.2714], zona: 'Poniente' },
    { key: 'cuautitlan-izcalli', nombre: 'Cuautitlán Izcalli', center: [19.6439, -99.2157], zona: 'Norte' },
    { key: 'coacalco', nombre: 'Coacalco', center: [19.6271, -99.1072], zona: 'Norte' },
    { key: 'chalco', nombre: 'Chalco', center: [19.2647, -98.8973], zona: 'Oriente' },
    { key: 'ixtapaluca', nombre: 'Ixtapaluca', center: [19.3091, -98.8829], zona: 'Oriente' },
    { key: 'toluca', nombre: 'Toluca', center: [19.2926, -99.6557], zona: 'Valle de Toluca' },
    { key: 'la-paz', nombre: 'La Paz', center: [19.3577, -98.9789], zona: 'Oriente' },
    { key: 'texcoco', nombre: 'Texcoco', center: [19.5111, -98.8824], zona: 'Oriente' },
    { key: 'tultitlan', nombre: 'Tultitlán', center: [19.6462, -99.1718], zona: 'Norte' },
    { key: 'tecamac', nombre: 'Tecámac', center: [19.7138, -98.9686], zona: 'Noreste' },
    { key: 'metepec', nombre: 'Metepec', center: [19.2597, -99.6018], zona: 'Valle de Toluca' },
    { key: 'lerma', nombre: 'Lerma', center: [19.2847, -99.5118], zona: 'Valle de Toluca' },
    { key: 'huixquilucan', nombre: 'Huixquilucan', center: [19.361, -99.3501], zona: 'Poniente' },
    { key: 'zinacantepec', nombre: 'Zinacantepec', center: [19.2899, -99.7293], zona: 'Valle de Toluca' },
    { key: 'nicolas-romero', nombre: 'Nicolás Romero', center: [19.6217, -99.3136], zona: 'Poniente' },
    { key: 'cuautitlan', nombre: 'Cuautitlán', center: [19.6705, -99.1817], zona: 'Norte' },
    { key: 'valle-de-chalco', nombre: 'Valle de Chalco', center: [19.2913, -98.9485], zona: 'Oriente' },
    { key: 'amecameca', nombre: 'Amecameca', center: [19.1234, -98.7664], zona: 'Oriente' },
    { key: 'zumpango', nombre: 'Zumpango', center: [19.7979, -99.1017], zona: 'Norte' }
  ]
};

const REGION_CONFIG = {
  cdmx: { nombre: 'CDMX', center: [19.4326, -99.1332], zoom: 11 },
  edomex: { nombre: 'Edomex', center: [19.4969, -99.7233], zoom: 9 }
};

const CENTROS_POR_MUNICIPIO = 20;

const OFFSETS = [
  [0.000, 0.000],
  [0.010, 0.008],
  [-0.010, -0.006],
  [0.015, -0.010],
  [-0.014, 0.010],
  [0.020, 0.004],
  [-0.020, -0.004],
  [0.006, 0.018],
  [-0.007, -0.016],
  [0.013, 0.014],
  [-0.013, 0.012],
  [0.018, -0.016],
  [-0.018, 0.016],
  [0.024, 0.010],
  [-0.024, -0.010],
  [0.008, -0.022],
  [-0.008, 0.022],
  [0.028, -0.004],
  [-0.028, 0.004],
  [0.000, 0.026]
];

function generarTelefono(index) {
  const base = 5500000000 + index * 137;
  return `+52 ${String(base).slice(0, 2)} ${String(base).slice(2, 6)} ${String(base).slice(6, 10)}`;
}

function generarHorario(index) {
  const horarios = [
    'Lun-Vie 08:00 a 18:00',
    'Lun-Sáb 08:00 a 17:00',
    'Lun-Vie 09:00 a 18:00',
    'Lun-Sáb 08:00 a 16:00'
  ];
  return horarios[index % horarios.length];
}

function generarCentros(regionKey, municipio) {
  return Array.from({ length: CENTROS_POR_MUNICIPIO }, (_, index) => {
    const [latOffset, lngOffset] = OFFSETS[index % OFFSETS.length];
    const factor = regionKey === 'edomex' ? 1.25 : 1;
    const numero = index + 1;

    return {
      id: `${regionKey}-${municipio.key}-${numero}`,
      nombre: `Verificentro ${municipio.nombre} ${numero}`,
      direccion: `Zona ${numero}, ${municipio.nombre}, ${REGION_CONFIG[regionKey].nombre}`,
      lat: municipio.center[0] + latOffset * factor,
      lng: municipio.center[1] + lngOffset * factor,
      tipo: 'Verificación vehicular',
      zona: municipio.zona,
      municipio: municipio.nombre,
      region: REGION_CONFIG[regionKey].nombre,
      telefono: generarTelefono(numero),
      horario: generarHorario(numero)
    };
  });
}

function construirDatos() {
  const data = {};

  Object.entries(MUNICIPIOS_POR_REGION).forEach(([regionKey, municipios]) => {
    data[regionKey] = {};
    municipios.forEach((municipio) => {
      data[regionKey][municipio.key] = generarCentros(regionKey, municipio);
    });
  });

  return data;
}

const CENTROS_DATA = construirDatos();

const markerHtml = (isActive = false) => `
  <div class="marker-pin-wrap ${isActive ? 'active' : ''}">
    <div class="marker-pin-core"></div>
  </div>
`;

const createMarkerIcon = (isActive = false) =>
  new L.DivIcon({
    className: 'custom-verificentro-marker',
    html: markerHtml(isActive),
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -26]
  });

function degreesToRadians(value) {
  return (value * Math.PI) / 180;
}

function calcularDistanciaKm(lat1, lon1, lat2, lon2) {
  const earthRadius = 6371;
  const dLat = degreesToRadians(lat2 - lat1);
  const dLon = degreesToRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degreesToRadians(lat1)) *
      Math.cos(degreesToRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}

function MapController({
  selectedCentro,
  userLocation,
  focusConfig,
  regionKey,
  municipioKey
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedCentro) {
      map.flyTo([selectedCentro.lat, selectedCentro.lng], 14, {
        duration: 1.1
      });
    }
  }, [selectedCentro, map]);

  useEffect(() => {
    if (userLocation) {
      map.flyTo([userLocation.lat, userLocation.lng], 14, {
        duration: 1.1
      });
    }
  }, [userLocation, map]);

  useEffect(() => {
    if (focusConfig) {
      map.flyTo(focusConfig.center, focusConfig.zoom, {
        duration: 1.05
      });
    }
  }, [focusConfig, map]);

  useEffect(() => {
    const municipio = MUNICIPIOS_POR_REGION[regionKey].find((m) => m.key === municipioKey);
    if (municipio) {
      map.flyTo(municipio.center, 12, {
        duration: 1.05
      });
    }
  }, [regionKey, municipioKey, map]);

  return null;
}

const MapaVerificentros = () => {
  const [regionActiva, setRegionActiva] = useState('cdmx');
  const [municipioActivo, setMunicipioActivo] = useState(MUNICIPIOS_POR_REGION.cdmx[0].key);
  const [selectedId, setSelectedId] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('Sin ubicación');
  const [focusConfig, setFocusConfig] = useState(REGION_CONFIG.cdmx);
  const [busquedaMunicipio, setBusquedaMunicipio] = useState('');
  const [soloCercanos, setSoloCercanos] = useState(false);

  const markerRefs = useRef({});

  const municipiosActuales = useMemo(
    () => MUNICIPIOS_POR_REGION[regionActiva] || [],
    [regionActiva]
  );

  const municipiosFiltrados = useMemo(() => {
    const term = busquedaMunicipio.trim().toLowerCase();
    if (!term) return municipiosActuales;

    return municipiosActuales.filter((municipio) =>
      municipio.nombre.toLowerCase().includes(term)
    );
  }, [municipiosActuales, busquedaMunicipio]);

  const municipioActualInfo = useMemo(
    () => municipiosActuales.find((m) => m.key === municipioActivo) || municipiosActuales[0],
    [municipiosActuales, municipioActivo]
  );

  const centrosBase = useMemo(() => {
    if (!municipioActualInfo) return [];
    return CENTROS_DATA[regionActiva][municipioActualInfo.key] || [];
  }, [regionActiva, municipioActualInfo]);

  const centrosActuales = useMemo(() => {
    let centros = [...centrosBase];

    if (userLocation) {
      centros = centros.map((centro) => ({
        ...centro,
        distanciaKm: calcularDistanciaKm(
          userLocation.lat,
          userLocation.lng,
          centro.lat,
          centro.lng
        )
      }));
    }

    if (soloCercanos && userLocation) {
      centros.sort((a, b) => (a.distanciaKm || 9999) - (b.distanciaKm || 9999));
    }

    return centros;
  }, [centrosBase, userLocation, soloCercanos]);

  const selectedCentro = useMemo(
    () => centrosActuales.find((item) => item.id === selectedId) || centrosActuales[0] || null,
    [centrosActuales, selectedId]
  );

  useEffect(() => {
    const firstMunicipio = MUNICIPIOS_POR_REGION[regionActiva][0];
    setMunicipioActivo(firstMunicipio.key);
    setFocusConfig(REGION_CONFIG[regionActiva]);
    setBusquedaMunicipio('');
    setSoloCercanos(false);
  }, [regionActiva]);

  useEffect(() => {
    if (
      municipiosFiltrados.length > 0 &&
      !municipiosFiltrados.some((m) => m.key === municipioActivo)
    ) {
      setMunicipioActivo(municipiosFiltrados[0].key);
    }
  }, [municipiosFiltrados, municipioActivo]);

  useEffect(() => {
    if (centrosActuales.length > 0) {
      setSelectedId(centrosActuales[0].id);
    } else {
      setSelectedId(null);
    }
  }, [centrosActuales]);

  const handleSelectCentro = (centro) => {
    setSelectedId(centro.id);

    const markerRef = markerRefs.current[centro.id];
    if (markerRef) {
      setTimeout(() => {
        markerRef.openPopup();
      }, 180);
    }
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Tu navegador no soporta geolocalización');
      return;
    }

    setLocationStatus('Obteniendo ubicación...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocationStatus('Ubicación detectada');
      },
      () => {
        setLocationStatus('No se pudo obtener tu ubicación');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleVerMunicipio = () => {
    if (municipioActualInfo) {
      setFocusConfig({
        center: municipioActualInfo.center,
        zoom: 12
      });
    }
  };

  const handleAbrirRuta = (centro) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${centro.lat},${centro.lng}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="verificentros-map-shell">
      <div className="map-top-overlay">
        <div className="map-top-chip">Mapa dinámico</div>

        <div className="map-top-info">
          <strong>
            {centrosActuales.length} verificentros en {municipioActualInfo?.nombre || '—'}
          </strong>
          <span>{locationStatus}</span>
        </div>

        <div className="map-top-actions">
          <button type="button" className="map-mini-btn" onClick={handleLocateMe}>
            Mi ubicación
          </button>

          <button type="button" className="map-mini-btn secondary" onClick={handleVerMunicipio}>
            Ver municipio
          </button>
        </div>
      </div>

      <div className="map-region-tabs">
        <button
          type="button"
          className={`map-region-tab ${regionActiva === 'cdmx' ? 'active' : ''}`}
          onClick={() => setRegionActiva('cdmx')}
        >
          CDMX
        </button>

        <button
          type="button"
          className={`map-region-tab ${regionActiva === 'edomex' ? 'active' : ''}`}
          onClick={() => setRegionActiva('edomex')}
        >
          Edomex
        </button>
      </div>

      <div className="map-municipio-tools">
        <div className="map-search-box">
          <input
            type="text"
            placeholder="Buscar alcaldía o municipio..."
            value={busquedaMunicipio}
            onChange={(e) => setBusquedaMunicipio(e.target.value)}
            className="map-search-input"
          />
        </div>

        <button
          type="button"
          className={`map-filter-btn ${soloCercanos ? 'active' : ''}`}
          onClick={() => setSoloCercanos((prev) => !prev)}
          disabled={!userLocation}
          title={!userLocation ? 'Activa primero tu ubicación' : 'Ordenar por cercanía'}
        >
          {soloCercanos ? 'Cercanos activado' : 'Ordenar por cercanía'}
        </button>
      </div>

      <div className="map-municipio-tabs">
        {municipiosFiltrados.length > 0 ? (
          municipiosFiltrados.map((municipio) => (
            <button
              key={municipio.key}
              type="button"
              className={`map-municipio-tab ${municipioActivo === municipio.key ? 'active' : ''}`}
              onClick={() => setMunicipioActivo(municipio.key)}
            >
              {municipio.nombre}
            </button>
          ))
        ) : (
          <div className="map-empty-inline">No se encontraron municipios con esa búsqueda.</div>
        )}
      </div>

      <div className="verificentros-map-layout">
        <aside className="map-side-panel">
          <div className="map-side-header">
            <h4>{municipioActualInfo?.nombre || 'Municipio'}</h4>
            <p>
              Selecciona un verificentro de la lista para enfocarlo en el mapa.
            </p>
          </div>

          <div className="map-center-list">
            {centrosActuales.map((centro) => {
              const isActive = centro.id === selectedId;

              return (
                <div
                  key={centro.id}
                  className={`map-center-card ${isActive ? 'active' : ''}`}
                >
                  <button
                    type="button"
                    className="map-center-main-btn"
                    onClick={() => handleSelectCentro(centro)}
                  >
                    <div className="map-center-card-top">
                      <span className="map-center-zone">{centro.zona}</span>
                      <span className="map-center-type">{centro.tipo}</span>
                    </div>

                    <strong>{centro.nombre}</strong>
                    <p>{centro.direccion}</p>

                    <div className="map-card-detail-list">
                      <span><b>Horario:</b> {centro.horario}</span>
                      <span><b>Tel:</b> {centro.telefono}</span>
                      <span><b>Ubicación:</b> {centro.lat.toFixed(4)}, {centro.lng.toFixed(4)}</span>
                      {typeof centro.distanciaKm === 'number' && (
                        <span><b>Distancia:</b> {centro.distanciaKm.toFixed(2)} km</span>
                      )}
                    </div>
                  </button>

                  <button
                    type="button"
                    className="map-route-btn small"
                    onClick={() => handleAbrirRuta(centro)}
                  >
                    Abrir ruta
                  </button>
                </div>
              );
            })}
          </div>
        </aside>

        <div className="map-canvas-wrap">
          <MapContainer
            center={REGION_CONFIG.cdmx.center}
            zoom={REGION_CONFIG.cdmx.zoom}
            scrollWheelZoom={true}
            zoomControl={false}
            className="verificentros-map"
          >
            <ZoomControl position="topleft" />

            <MapController
              selectedCentro={selectedCentro}
              userLocation={userLocation}
              focusConfig={focusConfig}
              regionKey={regionActiva}
              municipioKey={municipioActivo}
            />

            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {centrosActuales.map((centro) => (
              <Marker
                key={centro.id}
                position={[centro.lat, centro.lng]}
                icon={createMarkerIcon(centro.id === selectedId)}
                ref={(ref) => {
                  if (ref) {
                    markerRefs.current[centro.id] = ref;
                  }
                }}
                eventHandlers={{
                  click: () => setSelectedId(centro.id)
                }}
              >
                <Popup>
                  <div className="verificentros-popup">
                    <span className="popup-mini-badge">
                      {centro.region} · {centro.municipio}
                    </span>
                    <h4>{centro.nombre}</h4>
                    <p>{centro.direccion}</p>
                    <p className="popup-extra">Horario: {centro.horario}</p>
                    <p className="popup-extra">Tel: {centro.telefono}</p>
                    <span className="popup-type-badge">{centro.tipo}</span>
                  </div>
                </Popup>
              </Marker>
            ))}

            {userLocation && (
              <Marker
                position={[userLocation.lat, userLocation.lng]}
                icon={
                  new L.DivIcon({
                    className: 'user-location-marker',
                    html: `
                      <div class="user-location-dot-wrap">
                        <div class="user-location-dot"></div>
                      </div>
                    `,
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                  })
                }
              >
                <Popup>
                  <div className="verificentros-popup">
                    <span className="popup-mini-badge">Tu ubicación</span>
                    <h4>Ubicación actual</h4>
                    <p>Se detectó tu posición desde el navegador.</p>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default MapaVerificentros;