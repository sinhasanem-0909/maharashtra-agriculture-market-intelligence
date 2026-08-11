const CATEGORY = "Oilseeds";

function getOilseeds(records = []) {
  return records.filter((record) => record.category === CATEGORY);
}

module.exports = { CATEGORY, getOilseeds };
