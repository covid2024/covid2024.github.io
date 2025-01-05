// js/config.js
const config = {
  gridRows: 14, // Updated
  gridCols: 14, // Updated
  hospitalCost: 2000,
  labCost: 2500,
  dayDuration: 10 * 60 * 1000,
  initialMutationIn: [10, 15],
  mutationInterval: [5, 10],
  researchRate: 0.05,
  recoveryRate: 0.03,
  hospitalRecoveryBonus: 0.005,
  hospitalLocalEffectRadius: 2,
  deathRate: 0.01,
  researchImpactOnDeathRate: 1000,
  spreadRate: 0.1,
  spreadRadius: 2, // Make sure this is not too large for the new map size
  chanceOfSpreading: 0.3,
  labLocalEffectRadius: 2,
  labLocalSpreadReduction: 0.1,
  coinPerDay: 500,
  labUpgradeCost: 5000,
  labUpgradeResearchBonus: 0.05,
  defaultPopulationDensity: 3750,
  defaultHumidity: 75,
  defaultTemperature: 27,
  defaultMovementRate: 25,
  adminPassword: "ycc_admin", // Remember to change this!
  quarantineCost: 1000,
  quarantineSupplyCost: 50,
};
