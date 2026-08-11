const CATEGORY = "Cash Crops";

function getCashCrops(records = []) {
  return records.filter((record) => record.category === CATEGORY);
}

module.exports = { CATEGORY, getCashCrops };
