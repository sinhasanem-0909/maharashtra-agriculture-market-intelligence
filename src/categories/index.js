const { getCereals } = require("./cereals");
const { getPulses } = require("./pulses");
const { getOilseeds } = require("./oilseeds");
const { getCashCrops } = require("./cashCrops");
const { getFruits } = require("./fruits");
const { getVegetables } = require("./vegetables");
const { getSpices } = require("./spices");

const CATEGORY_GETTERS = {
  Cereals: getCereals,
  Pulses: getPulses,
  Oilseeds: getOilseeds,
  "Cash Crops": getCashCrops,
  Fruits: getFruits,
  Vegetables: getVegetables,
  Spices: getSpices
};

function getCategoryRecords(records, category) {
  const getter = CATEGORY_GETTERS[category];
  return getter ? getter(records) : [];
}

function getAvailableCategories(records) {
  return Object.keys(CATEGORY_GETTERS).map((category) => ({
    category,
    count: getCategoryRecords(records, category).length
  }));
}

module.exports = { CATEGORY_GETTERS, getCategoryRecords, getAvailableCategories };
