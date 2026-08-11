const CATEGORY = "Vegetables";

function getVegetables(records = []) {
  return records.filter((record) => record.category === CATEGORY);
}

module.exports = { CATEGORY, getVegetables };
