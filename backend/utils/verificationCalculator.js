const ENGOMADO_INFO = {
  amarillo: {
    label: "Amarillo",
    terminaciones: ["5", "6"],
    periodos: {
      S1: { label: "Enero - Febrero", startMonth: 1, endMonth: 2 },
      S2: { label: "Julio - Agosto", startMonth: 7, endMonth: 8 }
    }
  },
  rosa: {
    label: "Rosa",
    terminaciones: ["7", "8"],
    periodos: {
      S1: { label: "Febrero - Marzo", startMonth: 2, endMonth: 3 },
      S2: { label: "Agosto - Septiembre", startMonth: 8, endMonth: 9 }
    }
  },
  rojo: {
    label: "Rojo",
    terminaciones: ["3", "4"],
    periodos: {
      S1: { label: "Marzo - Abril", startMonth: 3, endMonth: 4 },
      S2: { label: "Septiembre - Octubre", startMonth: 9, endMonth: 10 }
    }
  },
  verde: {
    label: "Verde",
    terminaciones: ["1", "2"],
    periodos: {
      S1: { label: "Abril - Mayo", startMonth: 4, endMonth: 5 },
      S2: { label: "Octubre - Noviembre", startMonth: 10, endMonth: 11 }
    }
  },
  azul: {
    label: "Azul",
    terminaciones: ["9", "0"],
    periodos: {
      S1: { label: "Mayo - Junio", startMonth: 5, endMonth: 6 },
      S2: { label: "Noviembre - Diciembre", startMonth: 11, endMonth: 12 }
    }
  }
};

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre"
];

/*
  Estos costos y documentos son REFERENCIALES para tu sistema.
  Si luego quieres, los puedes cambiar sin tocar el resto del flujo.
*/
const COSTOS_REFERENCIA = {
  CDMX: {
    "00": "$0 MXN (referencial / revisar condiciones del centro)",
    "0": "$738 MXN aprox.",
    "1": "$738 MXN aprox.",
    "2": "$738 MXN aprox."
  },
  EDOMEX: {
    "00": "$0 MXN (referencial / revisar condiciones del centro)",
    "0": "$738 MXN aprox.",
    "1": "$738 MXN aprox.",
    "2": "$738 MXN aprox."
  }
};

const DOCUMENTOS_REFERENCIA = {
  CDMX: [
    "Tarjeta de circulación vigente",
    "Comprobante de última verificación, si aplica",
    "Identificación oficial del propietario o conductor",
    "Vehículo en condiciones mecánicas y sin testigos críticos encendidos"
  ],
  EDOMEX: [
    "Tarjeta de circulación vigente",
    "Comprobante de verificación anterior, si aplica",
    "Identificación oficial",
    "Vehículo en condiciones adecuadas para la prueba"
  ]
};

const detectEngomado = (ending) => {
  const digit = String(ending || "").trim();

  const found = Object.entries(ENGOMADO_INFO).find(([, data]) =>
    data.terminaciones.includes(digit)
  );

  return found ? found[0] : null;
};

const getLastNumericDigit = (plate = "") => {
  const digits = String(plate).match(/\d/g);
  if (!digits || digits.length === 0) return null;
  return digits[digits.length - 1];
};

const getCurrentSemester = () => {
  const month = new Date().getMonth() + 1;
  return month <= 6 ? "S1" : "S2";
};

const getCurrentYear = () => {
  return new Date().getFullYear();
};

const formatDateLong = (date) => {
  return date.toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
};

const getLastDayOfMonth = (year, month) => {
  return new Date(year, month, 0);
};

const getWindowData = (engomado, semester, year) => {
  const data = ENGOMADO_INFO[engomado];
  if (!data) return null;

  const period = data.periodos[semester];
  if (!period) return null;

  const deadline = getLastDayOfMonth(year, period.endMonth);

  return {
    engomadoLabel: data.label,
    semester,
    year,
    label: period.label,
    startMonth: period.startMonth,
    endMonth: period.endMonth,
    deadlineDate: deadline,
    deadlineText: formatDateLong(deadline),
    monthsText: `${MONTH_NAMES[period.startMonth - 1]} y ${MONTH_NAMES[period.endMonth - 1]}`
  };
};

const getNextWindow = (engomado, currentMonth, currentYear) => {
  const s1 = getWindowData(engomado, "S1", currentYear);
  const s2 = getWindowData(engomado, "S2", currentYear);

  if (!s1 || !s2) return null;

  if (currentMonth < s1.startMonth) {
    return s1;
  }

  if (currentMonth >= s1.startMonth && currentMonth <= s1.endMonth) {
    return s1;
  }

  if (currentMonth < s2.startMonth) {
    return s2;
  }

  if (currentMonth >= s2.startMonth && currentMonth <= s2.endMonth) {
    return s2;
  }

  return getWindowData(engomado, "S1", currentYear + 1);
};

const buildVerificationMessage = ({
  holograma,
  isWithinWindow,
  nextWindow
}) => {
  if (holograma === "00") {
    return {
      debeVerificar: "No por ahora",
      estatus: "Sin obligación ordinaria actual",
      motivo:
        "El holograma 00 normalmente no sigue el mismo flujo ordinario del periodo actual. Se muestra información referencial."
    };
  }

  if (isWithinWindow) {
    return {
      debeVerificar: "Sí",
      estatus: "Te toca verificar ahora",
      motivo:
        `Tu vehículo se encuentra dentro del periodo actual de verificación (${nextWindow.label}).`
    };
  }

  return {
    debeVerificar: "No por ahora",
    estatus: "Próximo periodo programado",
    motivo:
      `Aún no estás dentro de tu ventana activa. Tu siguiente periodo es ${nextWindow.label}.`
  };
};

const calculateVerification = (vehicle) => {
  const placa = String(vehicle.placa || "").toUpperCase();
  const entidad = String(vehicle.entidad || "").toUpperCase();
  const holograma = String(vehicle.holograma || "").trim();
  const modelo = Number(vehicle.modelo || 0);

  const ending = getLastNumericDigit(placa);
  const engomadoKey = detectEngomado(ending);
  const engomadoData = engomadoKey ? ENGOMADO_INFO[engomadoKey] : null;

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = getCurrentYear();
  const currentSemester = getCurrentSemester();

  const currentWindow = engomadoKey
    ? getWindowData(engomadoKey, currentSemester, currentYear)
    : null;

  const nextWindow = engomadoKey
    ? getNextWindow(engomadoKey, currentMonth, currentYear)
    : null;

  const isWithinWindow = nextWindow
    ? currentMonth >= nextWindow.startMonth && currentMonth <= nextWindow.endMonth
    : false;

  const verificationStatus = buildVerificationMessage({
    holograma,
    isWithinWindow,
    nextWindow
  });

  const costoEstimado =
    COSTOS_REFERENCIA[entidad]?.[holograma] ||
    "Costo no configurado para esta entidad/holograma";

  const documentos =
    DOCUMENTOS_REFERENCIA[entidad] || [
      "Tarjeta de circulación vigente",
      "Identificación oficial",
      "Comprobante previo, si aplica"
    ];

  return {
    placa,
    entidad,
    modelo,
    holograma,
    terminacion: ending || "No identificada",
    engomado: engomadoData ? engomadoData.label : "No identificado",
    debeVerificar: verificationStatus.debeVerificar,
    estatus: verificationStatus.estatus,
    motivo: verificationStatus.motivo,
    periodoActual: currentWindow ? currentWindow.label : "No disponible",
    periodoSiguiente: nextWindow ? nextWindow.label : "No disponible",
    meses: nextWindow ? nextWindow.monthsText : "No disponible",
    fechaLimite: nextWindow ? nextWindow.deadlineText : "No disponible",
    costoEstimado,
    documentos,
    nota:
      "La información mostrada es orientativa y configurable dentro del sistema. Puede ajustarse más adelante según reglas oficiales o internas del proyecto."
  };
};

module.exports = { calculateVerification };