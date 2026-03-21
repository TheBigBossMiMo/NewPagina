const API = "http://localhost:3000/api/lookup";

export const fetchVehicleByPlate = async (plate) => {
  const res = await fetch(`${API}/vehicle/${plate}`);
  const data = await res.json();

  if (!data.success) {
    throw new Error(data.message || "No se pudo consultar el vehículo");
  }

  return data;
};