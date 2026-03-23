const Vehicle = require('../models/Vehicle');

const checkVerification = async () => {
  const vehicles = await Vehicle.find();

  vehicles.forEach(v => {
    // ejemplo simple
    if (v.holograma === '2') {
      console.log(`⚠️ Vehículo ${v.placa} debe verificar pronto`);
    }
  });
};

module.exports = checkVerification;