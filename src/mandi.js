const AGMARKNET_BASE = "https://agmarknet.gov.in/SearchCmmMkt.aspx";
const STATE_CODE = "MH";

function cleanText(value) {
  return String(value || "")
    .replace(/<br\s*\/?\s*>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function parseTables(html) {
  const tables = [];
  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  let tableMatch;
  while ((tableMatch = tableRegex.exec(html))) {
    const rows = [];
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let rowMatch;
    while ((rowMatch = rowRegex.exec(tableMatch[1]))) {
      const cells = [];
      const cellRegex = /<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi;
      let cellMatch;
      while ((cellMatch = cellRegex.exec(rowMatch[1]))) cells.push(cleanText(cellMatch[1]));
      if (cells.length) rows.push(cells);
    }
    if (rows.length) tables.push(rows);
  }
  return tables;
}

function findArrivalTable(html) {
  const tables = parseTables(html);
  return tables.find((rows) => {
    const header = (rows[0] || []).join(" ").toLowerCase();
    return header.includes("market") && header.includes("modal") && (header.includes("arrival") || header.includes("arrivals"));
  }) || null;
}

function parseNumber(value) {
  const number = Number(String(value || "").replace(/,/g, "").replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(number) ? number : null;
}

function parseArrivalRows(table) {
  if (!table || table.length < 2) return [];
  const headers = table[0].map((value) => value.toLowerCase());
  const indexOf = (...terms) => headers.findIndex((header) => terms.some((term) => header.includes(term)));
  const marketIndex = indexOf("market name", "market");
  const districtIndex = indexOf("district name", "district");
  const commodityIndex = indexOf("commodity");
  const varietyIndex = indexOf("variety");
  const gradeIndex = indexOf("grade");
  const arrivalsIndex = indexOf("arrivals");
  const minIndex = indexOf("min price", "minimum price");
  const maxIndex = indexOf("max price", "maximum price");
  const modalIndex = indexOf("modal price", "model price");
  const dateIndex = indexOf("date");

  return table.slice(1).map((row) => ({
    district: districtIndex >= 0 ? row[districtIndex] : "",
    market: marketIndex >= 0 ? row[marketIndex] : "",
    commodity: commodityIndex >= 0 ? row[commodityIndex] : "",
    variety: varietyIndex >= 0 ? row[varietyIndex] : "",
    grade: gradeIndex >= 0 ? row[gradeIndex] : "",
    arrivalsTonnes: arrivalsIndex >= 0 ? parseNumber(row[arrivalsIndex]) : null,
    minPrice: minIndex >= 0 ? parseNumber(row[minIndex]) : null,
    modalPrice: modalIndex >= 0 ? parseNumber(row[modalIndex]) : null,
    maxPrice: maxIndex >= 0 ? parseNumber(row[maxIndex]) : null,
    date: dateIndex >= 0 ? row[dateIndex] : ""
  })).filter((row) => row.market || row.modalPrice !== null);
}

async function getAgmarknetPrices(commodity, days = 30) {
  const end = new Date();
  const start = new Date(end.getTime() - Math.max(1, days) * 86400000);
  const fmt = (date) => date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, "-");
  const params = new URLSearchParams({
    Tx_Commodity: "0",
    Tx_State: STATE_CODE,
    Tx_District: "0",
    Tx_Market: "0",
    DateFrom: fmt(start),
    DateTo: fmt(end),
    Fr_Date: fmt(start),
    To_Date: fmt(end),
    Tx_Trend: "2",
    Tx_CommodityHead: commodity,
    Tx_StateHead: "Maharashtra",
    Tx_DistrictHead: "--Select--",
    Tx_MarketHead: "--Select--"
  });

  const url = `${AGMARKNET_BASE}?${params.toString()}`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Maharashtra-Agriculture-Market-Intelligence/1.0",
      Accept: "text/html,application/xhtml+xml"
    }
  });
  if (!response.ok) throw new Error(`AGMARKNET returned HTTP ${response.status}`);
  const html = await response.text();
  const table = findArrivalTable(html);
  const records = parseArrivalRows(table);

  return {
    source: {
      id: "agmarknet",
      name: "AGMARKNET — Directorate of Marketing & Inspection, Government of India",
      url,
      baseUrl: "https://agmarknet.gov.in/",
      fetchedAt: new Date().toISOString(),
      status: "live-source"
    },
    query: { commodity, state: "Maharashtra", days },
    records
  };
}

module.exports = { getAgmarknetPrices };
