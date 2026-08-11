const CATEGORY = "Cereals";

function getCereals(records = []) {
  return records.filter((record) => record.category === CATEGORY);
}

module.exports = { CATEGORY, getCereals };
