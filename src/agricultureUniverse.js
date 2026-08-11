const STATE_APY = require("../data/agriculture/state-apy-2025-26.json");
const HISTORICAL_APY = require("../data/agriculture/state-apy-2024-25.json");
const HORTICULTURE = require("../data/agriculture/horticulture-2024-25.json");
const HORTICULTURE_CROPS = require("../data/agriculture/horticulture-crops-2024-25-first-advance.json");
const { getCategoryRecords, getAvailableCategories } = require("./categories");

const AGRICULTURE_DATA_SOURCES = [
  { id: "maharashtra-state-apy-2025-26", name: "Department of Agriculture, Government of Maharashtra — State APY 2025–26 Third Advance Estimates", url: "https://krishi.maharashtra.gov.in/Site/Upload/GR/State_2026.pdf", role: "State crop area, production and productivity", status: "ingested" },
  { id: "maharashtra-state-apy-2024-25", name: "Department of Agriculture, Government of Maharashtra — State APY 2024–25 Third Advance Estimates", url: "https://krishi.maharashtra.gov.in/Site/Upload/GR/THIRD%20ADVANCE%20ESTIMATES%202024-25%20STATE%20ABSTRACT.pdf", role: "Historical state crop area, production and productivity", status: "ingested" },
  { id: HORTICULTURE.source.id, name: HORTICULTURE.source.name, url: HORTICULTURE.source.url, role: "Horticulture category totals", status: "ingested" },
  { id: HORTICULTURE_CROPS.source.id, name: HORTICULTURE_CROPS.source.name, url: HORTICULTURE_CROPS.source.url, role: "Horticulture crop-level area and production", status: "ingested" },
  { id: "agmarknet", name: "AGMARKNET", url: "https://agmarknet.gov.in/", role: "Mandi arrivals, minimum, maximum and modal prices", status: "source-identified" },
  { id: "maharashtra-price-monitoring", name: "Department of Agriculture, Government of Maharashtra — Weekly Price Monitoring Reports", url: "https://krishi.maharashtra.gov.in/Site/Common/ViewGr.aspx?Doctype=5e6c3729-a3c8-476e-85d7-b0ce4a2c97c9%3FMenuID%3D1103", role: "State market-price monitoring and price outlook", status: "source-identified" },
  { id: "des-apy", name: "Directorate of Economics and Statistics, Government of India — Area, Production & Yield", url: "https://data.desagri.gov.in/website/apy-query-report-web", role: "Cross-check and historical area, production and yield", status: "source-identified" }
];

const historicalByCommodity = new Map(HISTORICAL_APY.records.map((record) => [record.commodity, record]));

function buildFieldCropRecords() {
  return STATE_APY.records.map((record) => {
    const historical = historicalByCommodity.get(record.commodity);
    const currentProductionUnit = record.productionUnit || STATE_APY.source.productionUnit;
    const currentProductivityUnit = record.productivityUnit || STATE_APY.source.productivityUnit;
    const historicalProductionUnit = historical?.productionUnit || HISTORICAL_APY.source.productionUnit;
    const historicalProductivityUnit = historical?.productivityUnit || HISTORICAL_APY.source.productivityUnit;
    const historicalSeries = [
      historical && { year: HISTORICAL_APY.source.dataYear, area: historical.area, production: historical.production, productivity: historical.productivity, areaUnit: historical.areaUnit || HISTORICAL_APY.source.areaUnit, productionUnit: historicalProductionUnit, productivityUnit: historicalProductivityUnit, source: { id: HISTORICAL_APY.source.id, name: HISTORICAL_APY.source.name, url: HISTORICAL_APY.source.url, publicationDate: HISTORICAL_APY.source.publicationDate, status: HISTORICAL_APY.source.status } },
      { year: STATE_APY.source.dataYear, area: record.area, production: record.production, productivity: record.productivity, areaUnit: record.areaUnit || STATE_APY.source.areaUnit, productionUnit: currentProductionUnit, productivityUnit: currentProductivityUnit, source: { id: STATE_APY.source.id, name: STATE_APY.source.name, url: STATE_APY.source.url, publicationDate: STATE_APY.source.publicationDate, status: STATE_APY.source.status } }
    ].filter(Boolean);
    return { id: record.commodity.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), commodity: record.commodity, category: record.category, year: STATE_APY.source.dataYear, area: record.area, production: record.production, productivity: record.productivity, areaUnit: record.areaUnit || STATE_APY.source.areaUnit, productionUnit: currentProductionUnit, productivityUnit: currentProductivityUnit, productionChangeFromPreviousYearPct: historical ? ((record.production - historical.production) / historical.production) * 100 : null, historicalSeries, source: { id: STATE_APY.source.id, name: STATE_APY.source.name, url: STATE_APY.source.url, publicationDate: STATE_APY.source.publicationDate, status: STATE_APY.source.status }, dataAvailability: { stateProduction: "available", historicalProduction: historical ? "available" : "not-yet-available", districtProduction: "source-identified", horticulture: "not-applicable", mandiPrices: "source-identified", demand: "not-yet-available", supply: "not-yet-available", trade: "not-yet-ingested", valueChain: "not-yet-ingested", infrastructure: "not-yet-ingested" } };
  });
}

function buildHorticultureRecords() {
  return HORTICULTURE_CROPS.records.map((crop) => ({
    id: `hort-${crop.commodity.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
    commodity: crop.commodity,
    category: crop.category,
    year: HORTICULTURE_CROPS.source.dataYear,
    area: crop.area,
    production: crop.production,
    productivity: crop.area && crop.production != null ? crop.production / crop.area : null,
    areaUnit: HORTICULTURE_CROPS.source.areaUnit,
    productionUnit: HORTICULTURE_CROPS.source.productionUnit,
    productivityUnit: "MT/ha",
    productionChangeFromPreviousYearPct: null,
    historicalSeries: [],
    source: { id: HORTICULTURE_CROPS.source.id, name: HORTICULTURE_CROPS.source.name, url: HORTICULTURE_CROPS.source.url, publicationDate: null, status: HORTICULTURE_CROPS.source.estimate },
    dataAvailability: { stateProduction: crop.production != null ? "available" : "not-reported", historicalProduction: "not-yet-available", districtProduction: "not-yet-available", horticulture: "available", mandiPrices: "source-identified", demand: "not-yet-available", supply: "not-yet-available", trade: "not-yet-ingested", valueChain: "not-yet-ingested", infrastructure: "not-yet-ingested" }
  }));
}

function getAgricultureUniverse() { return [...buildFieldCropRecords(), ...buildHorticultureRecords()]; }
function getAgricultureCategory(category) { return getCategoryRecords(getAgricultureUniverse(), category); }
function getAgricultureCategories() { return getAvailableCategories(getAgricultureUniverse()); }
function getHorticultureCategorySummaries() { return HORTICULTURE.categories.map(({ crops, ...summary }) => ({ ...summary, source: HORTICULTURE.source })); }

module.exports = { getAgricultureUniverse, getAgricultureCategory, getAgricultureCategories, getHorticultureCategorySummaries, AGRICULTURE_UNIVERSE_SOURCE: STATE_APY.source, AGRICULTURE_DATA_SOURCES };
