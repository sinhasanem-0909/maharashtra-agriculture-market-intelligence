const http = require("http");
const fs = require("fs");
const path = require("path");
const { readDb, writeDb } = require("./src/store");
const { runMarketScanner } = require("./src/scanner");
const { SOURCES } = require("./src/sources");
const { DISTRICTS, BUSINESS_LAYERS } = require("./src/scope");
const { getAgricultureUniverse, AGRICULTURE_UNIVERSE_SOURCE } = require("./src/agricultureUniverse");
const { getAgmarknetPrices } = require("./src/mandi");

const portArgIndex = process.argv.indexOf("--port");
const PORT = process.env.PORT || (portArgIndex !== -1 ? process.argv[portArgIndex + 1] : null) || 8080;
const HOST = process.env.HOST || "127.0.0.1";
const PUBLIC_DIR = path.join(__dirname, "public");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

function sendJson(res, data, status = 200) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) req.destroy();
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
}

function dashboardPayload() {
  const db = readDb();
  const lastRun = db.runs.at(-1) || null;
  const highConfidence = db.signals.filter((signal) => signal.confidence === "High").length;
  const currentRunNew = lastRun ? lastRun.newSignals : 0;
  const coveredPairs = new Set(db.signals.map((signal) => `${signal.district}|${signal.businessLayer}`));
  const totalPairs = DISTRICTS.length * BUSINESS_LAYERS.length;
  const agricultureUniverse = getAgricultureUniverse();

  return {
    scope: {
      geography: "Selected Maharashtra districts only",
      districts: DISTRICTS,
      businessLayers: BUSINESS_LAYERS
    },
    lastRun,
    totals: {
      marketSignals: db.signals.length,
      evidenceItems: db.evidenceItems.length,
      agricultureUniverseRecords: agricultureUniverse.length,
      newSignals: currentRunNew,
      updatedSignals: lastRun ? lastRun.updatedSignals : 0,
      highConfidenceOpportunities: highConfidence,
      researchCompleteness: Math.round((coveredPairs.size / totalPairs) * 100)
    }
  };
}

async function handleApi(req, res, pathname, url) {
  if (req.method === "GET" && pathname === "/api/dashboard") return sendJson(res, dashboardPayload());
  if (req.method === "GET" && pathname === "/api/scope") return sendJson(res, { districts: DISTRICTS, businessLayers: BUSINESS_LAYERS });
  if (req.method === "GET" && pathname === "/api/agriculture-universe") {
    return sendJson(res, {
      source: AGRICULTURE_UNIVERSE_SOURCE,
      records: getAgricultureUniverse()
    });
  }
  if (req.method === "GET" && pathname === "/api/mandi-prices") {
    const commodity = url.searchParams.get("commodity");
    if (!commodity) return sendJson(res, { error: "commodity is required" }, 400);
    const days = Math.min(90, Math.max(1, Number(url.searchParams.get("days") || 30)));
    try {
      return sendJson(res, await getAgmarknetPrices(commodity, days));
    } catch (error) {
      return sendJson(res, {
        error: "Unable to retrieve live AGMARKNET data",
        detail: error.message,
        source: "https://agmarknet.gov.in/"
      }, 502);
    }
  }
  if (req.method === "GET" && pathname === "/api/signals") return sendJson(res, readDb().signals);
  if (req.method === "GET" && pathname === "/api/evidence") return sendJson(res, readDb().evidenceItems);
  if (req.method === "GET" && pathname === "/api/products") return sendJson(res, getAgricultureUniverse());
  if (req.method === "GET" && pathname === "/api/sources") {
    const db = readDb();
    const sources = SOURCES.map((source) => db.sources.find((item) => item.id === source.id) || { ...source, lastChecked: null, signalsSupported: 0 });
    return sendJson(res, sources);
  }
  if (req.method === "GET" && pathname === "/api/runs") return sendJson(res, readDb().runs);
  if (req.method === "POST" && pathname === "/api/runs/refresh") {
    const run = await runMarketScanner();
    return sendJson(res, run, 201);
  }
  if (req.method === "GET" && pathname === "/api/watchlist") return sendJson(res, readDb().watchlist);
  if (req.method === "POST" && pathname === "/api/watchlist") {
    const payload = await readBody(req);
    const db = readDb();
    const signal = db.signals.find((item) => item.id === payload.signalId);
    if (!signal) return sendJson(res, { error: "Signal not found" }, 404);
    const existing = db.watchlist.find((item) => item.signalId === signal.id);
    if (existing) {
      existing.notes = payload.notes || existing.notes;
      existing.status = payload.status || existing.status;
      writeDb(db);
      return sendJson(res, existing);
    }
    const item = {
      id: `WL-${Date.now()}`,
      signalId: signal.id,
      signal: signal.claim,
      product: signal.product,
      district: signal.district,
      businessLayer: signal.businessLayer,
      dateAdded: new Date().toISOString(),
      status: payload.status || "Watching",
      notes: payload.notes || ""
    };
    db.watchlist.push(item);
    writeDb(db);
    return sendJson(res, item, 201);
  }
  if (req.method === "PATCH" && pathname.startsWith("/api/watchlist/")) {
    const id = decodeURIComponent(pathname.split("/").pop());
    const payload = await readBody(req);
    const db = readDb();
    const item = db.watchlist.find((entry) => entry.id === id);
    if (!item) return sendJson(res, { error: "Watchlist item not found" }, 404);
    item.notes = payload.notes ?? item.notes;
    item.status = payload.status ?? item.status;
    writeDb(db);
    return sendJson(res, item);
  }
  return sendJson(res, { error: "Not found" }, 404);
}

function serveStatic(res, pathname) {
  const safePath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.normalize(path.join(PUBLIC_DIR, safePath));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "content-type": MIME[path.extname(filePath)] || "application/octet-stream" });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url.pathname, url);
      return;
    }
    serveStatic(res, url.pathname);
  } catch (error) {
    sendJson(res, { error: error.message }, 500);
  }
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Start with another port, for example: node server.js --port 8081`);
    process.exit(1);
  }
  throw error;
});

server.listen(Number(PORT), HOST, () => {
  console.log(`Maharashtra Agriculture Market Intelligence running at http://${HOST}:${PORT}`);
});
