// js/config.js
const config = {
  gridRows: 14,
  gridCols: 14,
  hospitalCost: 2000,
  labCost: 2500,
  dayDuration: 10 * 60 * 1000,
  initialMutationIn: [10, 15],
  mutationInterval: [5, 10],
  researchRate: 0.05,
  recoveryRate: 0.03,
  hospitalRecoveryBonus: 0.005, // Tăng tỷ lệ hồi phục khi có bệnh viện
  hospitalLocalEffectRadius: 2, // Bán kính ảnh hưởng của bệnh viện
  deathRate: 0.01,
  researchImpactOnDeathRate: 1000,
  spreadRate: 0.3,
  spreadRadius: 3,
  chanceOfSpreading: 0.5,
  labLocalEffectRadius: 2, // Bán kính ảnh hưởng của phòng lab
  labLocalSpreadReduction: 0.1, // Giảm tỷ lệ lây lan khi có phòng lab
  coinPerDay: 500,
  labUpgradeCost: 5000,
  labUpgradeResearchBonus: 0.05,
  defaultPopulationDensity: 3750,
  defaultHumidity: 75,
  defaultTemperature: 27,
  defaultMovementRate: 25,
  adminPassword: "ycc_admin",
  quarantineCost: 1000,
  quarantineSupplyCost: 50,
};
