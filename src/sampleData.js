export const cars = [
  {
    manufacturer: "Volvo",
    model: "EX30",
    connectorTypes: ["Type 2 AC", "CCS DC"],
    maxAcKw: 11,
    maxDcKw: 153,
    chargingScheme: "Volvo"
  }
];

export const providers = [
  { id: 'osprey', name: 'Osprey', contactless: true, appRequired: false, volvoCompatible: true, bmwCompatible: true },
  { id: 'instavolt', name: 'Instavolt', contactless: true, appRequired: false, volvoCompatible: true, bmwCompatible: true },
  { id: 'ionity', name: 'Ionity', contactless: true, appRequired: false, volvoCompatible: true, bmwCompatible: true },
  { id: 'bp-pulse', name: 'BP Pulse', contactless: true, appRequired: true, volvoCompatible: true, bmwCompatible: true },
  { id: 'pod-point', name: 'Pod Point', contactless: false, appRequired: true, volvoCompatible: false, bmwCompatible: true },
  { id: 'tesla', name: 'Tesla Supercharger', contactless: false, appRequired: true, volvoCompatible: false, bmwCompatible: false }
];

export const chargers = [
  { id: 'rugby-osprey-1', providerId: 'osprey', name: 'Rugby Services Osprey', address: 'Rugby', latitude: 52.370, longitude: -1.260, connectorType: 'CCS', maxKw: 150, availabilityStatus: '2 available' },
  { id: 'southam-instavolt-1', providerId: 'instavolt', name: 'Southam Instavolt', address: 'Southam', latitude: 52.253, longitude: -1.389, connectorType: 'CCS', maxKw: 160, availabilityStatus: '1 available' },
  { id: 'warwick-ionity-1', providerId: 'ionity', name: 'Warwick Ionity', address: 'Warwick', latitude: 52.281, longitude: -1.584, connectorType: 'CCS', maxKw: 350, availabilityStatus: 'Busy' },
  { id: 'daventry-bp-1', providerId: 'bp-pulse', name: 'Daventry BP Pulse', address: 'Daventry', latitude: 52.256, longitude: -1.161, connectorType: 'CCS', maxKw: 50, availabilityStatus: '1 available' },
  { id: 'leamington-podpoint-1', providerId: 'pod-point', name: 'Leamington Pod Point', address: 'Leamington Spa', latitude: 52.285, longitude: -1.532, connectorType: 'CCS', maxKw: 22, availabilityStatus: 'Unknown' },
  { id: 'banbury-tesla-1', providerId: 'tesla', name: 'Banbury Tesla Supercharger', address: 'Banbury', latitude: 52.060, longitude: -1.340, connectorType: 'CCS', maxKw: 250, availabilityStatus: '4 available' }
];
