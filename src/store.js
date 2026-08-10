const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

const DEFAULT_DB = {
  evidenceItems: [],
  productIntelligence: [],
  signals: [],
  sources: [],
  runs: [],
  watchlist: []
};

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2));
  }
}

function readDb() {
  ensureDb();
  const db = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  return {
    ...DEFAULT_DB,
    ...db,
    evidenceItems: db.evidenceItems || [],
    productIntelligence: db.productIntelligence || [],
    signals: db.signals || [],
    sources: db.sources || [],
    runs: db.runs || [],
    watchlist: db.watchlist || []
  };
}

function writeDb(db) {
  ensureDb();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function nextRunId(db) {
  const next = db.runs.length + 1;
  return `RUN-${String(next).padStart(3, "0")}`;
}

module.exports = {
  readDb,
  writeDb,
  nextRunId
};
