const CATEGORY = "Pulses";

function getPulses(records = []) {
  return records.filter((record) => record.category === CATEGORY);
}

module.exports = { CATEGORY, getPulses };
