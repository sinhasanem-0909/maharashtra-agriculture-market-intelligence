const CATEGORY = "Fruits";

function getFruits(records = []) {
  return records.filter((record) => record.category === CATEGORY);
}

module.exports = { CATEGORY, getFruits };
