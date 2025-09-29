// @ts-check

/**
 * @typedef {object} Inputs
 * @property {object} water
 * @property {object} production
 * @property {object} efficiency
 */

/**
 * @typedef {object} Outputs
 * @property {object} oxygen
 * @property {number} oxygen.bestInletMgL
 * @property {number} oxygen.minSatPct
 * @property {number} oxygen.effluentMgL
 * @property {number} oxygen.consMgPerDay
 * @property {number} oxygen.consKgPerDay
 * @property {object} tss
 * @property {number} tss.effluentMgL
 * @property {number} tss.prodMgPerDay
 * @property {number} tss.prodKgPerDay
 * @property {object} co2
 * @property {number} co2.effluentMgL
 * @property {number} co2.prodMgPerDay
 * @property {number} co2.prodKgPerDay
 * @property {object} tan
 * @property {number} tan.effluentMgL
 * @property {number} tan.prodMgPerDay
 * @property {number} tan.prodKgPerDay
 */

// Placeholder for the real calculation formula
export function computeBasic(inputs) {
  // TODO: Replace with proprietary formula set.
  // For now, return deterministic mocked values.
  return {
    oxygen: {
      bestInletMgL: 12.5,
      minSatPct: 95,
      effluentMgL: 10.2,
      consMgPerDay: 500,
      consKgPerDay: 0.5,
    },
    tss: {
      effluentMgL: 1.5,
      prodMgPerDay: 250,
      prodKgPerDay: 0.25,
    },
    co2: {
      effluentMgL: 2.0,
      prodMgPerDay: 300,
      prodKgPerDay: 0.3,
    },
    tan: {
      effluentMgL: 0.1,
      prodMgPerDay: 50,
      prodKgPerDay: 0.05,
    },
  };
}