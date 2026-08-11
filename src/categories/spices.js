const CATEGORY = "Spices";

function getSpices(records = []) {
  return records.filter((record) => record.category === CATEGORY);
}

module.exports = { CATEGORY, getSpices };
