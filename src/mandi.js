const AGMARKNET_BASE = "https://agmarknet.gov.in/SearchCmmMkt.aspx";
const MSAMB_DAILY_URL = "https://www.msamb.com/Sakal.aspx";
const STATE_CODE = "MH";

const MSAMB_COMMODITY_ALIASES = {
  Rice: ["तांदूळ", "भात"],
  Wheat: ["गहू"],
  Jowar: ["ज्वारी"],
  Bajra: ["बाजरी"],
  Maize: ["मका"],
  Tur: ["तूर", "तूर डाळ"],
  Mung: ["मूग"],
  Udid: ["उडीद"],
  Gram: ["हरभरा"],
  Soybean: ["सोयाबीन"],
  Groundnut: ["भुईमूग", "भुईमुग"],
  Sesamum: ["तीळ"],
  Sunflower: ["सूर्यफूल"],
  Sugarcane: ["ऊस"],
  Cotton: ["कापूस"],
  Tobacco: ["तंबाखू"]
};

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

function parseNumber(value) {
  const number = Number(String(value || "").replace(/,/g, "").replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(number) ? number : null;
}

function parseMsambRows(html, commodity) {
  const aliases = MSAMB_COMMODITY_ALIASES[commodity] || [commodity];
  const tables = parseTables(html);
  const table = tables.find((rows) => {
    const header = (rows[0] || []).join(" ");
    return header.includes("बाजार समिती") && header.includes("आवक") && header.includes("सर्वसाधारण दर");
  });
  if (!table || table.length < 2) return [];

  return table.slice(1).map((row) => {
    const text = row.join(" ");
    const matchedAlias = aliases.find((alias) => text.includes(alias));
    if (!matchedAlias) return null;

    return {
      date: row[0] || "",
      commodity: matchedAlias,
      market: row[2] || row[1] || "",
      variety: row[3] || "",
      unit: row[4] || "",
      arrivals: parseNumber(row[5]),
      minPrice: parseNumber(row[6]),
      maxPrice: parseNumber(row[7]),
      modalPrice: parseNumber(row[8])
    };
  }).filter(Boolean);
}

async function fetchMsambLatest(commodity) {
  const response = await fetch(MSAMB_DAILY_URL, {
    headers: {
      "User-Agent": "Maharashtra-Agriculture-Market-Intelligence/1.0",
      Accept: "text/html,application/xhtml+xml"
    }
  });
  if (!response.ok) throw new Error(`MSAMB returned HTTP ${response.status}`);
  const html = await response.text();
  const records = parseMsambRows(html, commodity);
  return {
    source: {
      id: "msamb",
      name: "Maharashtra State Agricultural Marketing Board — Daily Market Prices",
      url: MSAMB_DAILY_URL,
      baseUrl: "https://www.msamb.com/",
      fetchedAt: new Date().toISOString(),
      status: "live-source"
    },
    query: { commodity, state: "Maharashtra", days: 2 },
    records
  };
}

function findArrivalTable(html) {
  const tables = parseTables(html);
  return tables.find((rows) => {
    const header = (rows[0] || []).join(" ").toLowerCase();
    return header.includes("market") && header.includes("modal") && (header.includes("arrival") || header.includes("arrivals"));
  }) || null;
}

function parseAgmarknetRows(table) {
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
    arrivals: arrivalsIndex >= 0 ? parseNumber(row[arrivalsIndex]) : null,
    minPrice: minIndex >= 0 ? parseNumber(row[minIndex]) : null,
    modalPrice: modalIndex >= 0 ? parseNumber(row[modalIndex]) : null,
    maxPrice: maxIndex >= 0 ? parseNumber(row[maxIndex]) : null,
    date: dateIndex >= 0 ? row[dateIndex] : ""
  })).filter((row) => row.market || row.modalPrice !== null);
}

async function fetchAgmarknet(commodity, days) {
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
    records: parseAgmarknetRows(table)
  };
}

async function getAgmarknetPrices(commodity, days = 30) {
  const errors = [];
  try {
    const agmarknet = await fetchAgmarknet(commodity, days);
    if (agmarknet.records.length) return agmarknet;
    errors.push("AGMARKNET returned no usable records for the mapped commodity.");
  } catch (error) {
    errors.push(error.message);
  }

  const msamb = await fetchMsambLatest(commodity);
  if (msamb.records.length) {
    return {
      ...msamb,
      fallback: true,
      note: "Latest Maharashtra market records are sourced directly from MSAMB. Historical trend data requires an AGMARKNET response."
    };
  }

  throw new Error(`${errors.join(" ")} MSAMB also returned no records for ${commodity}.`);
}

module.exports = { getAgmarknetPrices };
