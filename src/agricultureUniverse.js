const STATE_APY = require("../data/agriculture/state-apy-2025-26.json");

function getAgricultureUniverse() {
  return STATE_APY.records.map((record) => ({
    id: record.commodity.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    commodity: record.commodity,
    category: record.category,
    year: STATE_APY.source.dataYear,
    area: record.area,
    production: record.production,
    productivity: record.productivity,
    areaUnit: STATE_APY.source.areaUnit,
    productionUnit: STATE_APY.source.productionUnit,
    productivityUnit: STATE_APY.source.productivityUnit,
    source: {
      id: STATE_APY.source.id,
      name: STATE_APY.source.name,
      url: STATE_APY.source.url,
      publicationDate: STATE_APY.source.publicationDate,
      status: STATE_APY.source.status
    },
    districtDataStatus: "Not ingested yet",
    demandDataStatus: "Not ingested yet",
    supplyDataStatus: "Not ingested yet",
    mandiDataStatus: "Not ingested yet"
  }));
}

module.exports = {
  getAgricultureUniverse,
  AGRICULTURE_UNIVERSE_SOURCE: STATE_APY.source
};
