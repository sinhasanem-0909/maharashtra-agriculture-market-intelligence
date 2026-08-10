const crypto = require("crypto");
const { readDb, writeDb, nextRunId } = require("./store");
const { SOURCES } = require("./sources");
const { DISTRICTS } = require("./scope");
const { PRODUCT_INTELLIGENCE } = require("./productIntelligence");

const USER_AGENT = "MaharashtraAgricultureMarketIntelligence/2.0 evidence scanner";

const DISTRICT_ALIASES = {
  Ahilyanagar: ["ahilyanagar", "ahmednagar", "ahmed nagar"]
};

const PRODUCT_ALIASES = {
  Grapes: ["grapes", "grape"],
  Onion: ["onion", "onions"],
  Mango: ["mango", "mangoes", "alphonso"],
  Pomegranate: ["pomegranate", "pomegranates"],
  Sugarcane: ["sugarcane", "sugar cane", "jaggery", "molasses", "ethanol"],
  Cashew: ["cashew", "cashew nut", "raw cashew"]
};

const CATEGORY_TERMS = {
  "Production & Availability": ["production", "area", "yield", "cultivation", "producing", "harvest"],
  "Price & Arrival": ["price", "arrival", "modal price", "mandi", "market rate", "wholesale"],
  "Demand & Trade": ["demand", "export", "import", "buyer", "consumption", "market", "trade"],
  "Processing & Value Addition": ["processing", "processed", "pulp", "dehydrated", "raisin", "juice", "wine", "jaggery", "ethanol", "kernel"],
  "Infrastructure & Logistics": ["packhouse", "pack house", "cold storage", "warehouse", "storage", "logistics", "testing", "grading"],
  "Waste & By-products": ["waste", "by-product", "byproduct", "pomace", "peel", "seed", "bagasse", "press mud", "shell"]
};

function normalize(text) {
  return String(text || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/â€“/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function containsAny(text, terms) {
  const lower = normalize(text);
  return terms.some((term) => lower.includes(term.toLowerCase()));
}

function districtTerms(district) {
  return DISTRICT_ALIASES[district] || [district];
}

function productTerms(product) {
  return PRODUCT_ALIASES[product] || [product];
}

function evidenceId(parts) {
  return `EVI-${crypto.createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 16)}`;
}

function signalId(parts) {
  return `SIG-${crypto.createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 16)}`;
}

function publicationDateFromHeaders(headers) {
  const lastModified = headers.get("last-modified");
  if (!lastModified) return "Unknown";
  const parsed = new Date(lastModified);
  return Number.isNaN(parsed.getTime()) ? "Unknown" : parsed.toISOString().slice(0, 10);
}

async function fetchSource(source) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch(source.url, {
      headers: { "user-agent": USER_AGENT },
      signal: controller.signal
    });
    const body = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      publicationDate: publicationDateFromHeaders(response.headers),
      text: stripHtml(body)
    };
  } finally {
    clearTimeout(timeout);
  }
}

function parsePackhouseEvidence({ source, text, publicationDate, researchDate }) {
  const rows = text.match(/\b\d+\s+APEDA\/FFV\/PH\/[\s\S]{80,850}?(?=\s+\d+\s+APEDA\/FFV\/PH\/|\s*$)/g) || [];
  const items = [];

  for (const row of rows) {
    const district = DISTRICTS.find((name) => containsAny(row, districtTerms(name)));
    if (!district) continue;

    for (const productRecord of PRODUCT_INTELLIGENCE) {
      if (!containsAny(row, productTerms(productRecord.product))) continue;
      items.push({
        id: evidenceId([source.id, district, productRecord.product, "Infrastructure & Logistics", row]),
        product: productRecord.product,
        district,
        category: "Infrastructure & Logistics",
        evidenceType: "VERIFIED EVIDENCE",
        claim: `APEDA lists an active recognized packhouse in ${district} handling ${productRecord.product}.`,
        evidence: row.trim(),
        source: source.name,
        sourceId: source.id,
        sourceUrl: source.url,
        sourcePublicationDate: publicationDate,
        researchDate,
        authorityLevel: source.authorityLevel,
        tags: ["packhouse", "post-harvest", "quality infrastructure"]
      });
    }
  }

  return items;
}

function extractLocalEvidence(text, product, category) {
  const aliases = productTerms(product);
  const terms = CATEGORY_TERMS[category] || [];
  const sentences = text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => sentence.length > 45 && sentence.length < 650);

  const scored = sentences
    .map((sentence) => {
      const lower = normalize(sentence);
      const productHit = aliases.some((term) => lower.includes(term));
      const termHits = terms.filter((term) => lower.includes(term));
      return { sentence, productHit, termHits, score: (productHit ? 2 : 0) + termHits.length };
    })
    .filter((item) => item.productHit && item.termHits.length > 0)
    .sort((a, b) => b.score - a.score);

  return scored[0]?.sentence || "";
}

function parseProductLevelEvidence({ source, text, publicationDate, researchDate }) {
  const items = [];

  for (const productRecord of PRODUCT_INTELLIGENCE) {
    if (!containsAny(text, productTerms(productRecord.product))) continue;

    for (const category of Object.keys(CATEGORY_TERMS)) {
      const evidence = extractLocalEvidence(text, productRecord.product, category);
      if (!evidence) continue;
      items.push({
        id: evidenceId([source.id, productRecord.product, category, evidence]),
        product: productRecord.product,
        district: "Multiple / product-level",
        category,
        evidenceType: "VERIFIED EVIDENCE",
        claim: `${source.name} contains ${category.toLowerCase()} evidence for ${productRecord.product}.`,
        evidence,
        source: source.name,
        sourceId: source.id,
        sourceUrl: source.url,
        sourcePublicationDate: publicationDate,
        researchDate,
        authorityLevel: source.authorityLevel,
        tags: CATEGORY_TERMS[category].filter((term) => normalize(evidence).includes(term))
      });
    }
  }

  return items;
}

function productIntelligenceEvidence(researchDate) {
  return PRODUCT_INTELLIGENCE.flatMap((productRecord) => {
    return productRecord.districts.map((district) => ({
      id: evidenceId(["product-intelligence", productRecord.id, district]),
      product: productRecord.product,
      district,
      category: "Product Possibility Map",
      evidenceType: "INFERENCE",
      claim: `${productRecord.product} has mapped raw, processed, industrial, buyer, infrastructure, and by-product pathways for ${district}.`,
      evidence: `Pathways: ${[
        ...productRecord.rawForms,
        ...productRecord.processedForms,
        ...productRecord.intermediateIndustrialForms,
        ...productRecord.byproducts
      ].join(", ")}. Buyer categories: ${productRecord.buyerCategories.join(", ")}.`,
      source: "Product Intelligence & Value-Chain Explorer",
      sourceId: "product-intelligence",
      sourceUrl: "",
      sourcePublicationDate: "Internal research map",
      researchDate,
      authorityLevel: "Research synthesis",
      tags: ["product possibility", "value chain", "hypothesis input"]
    }));
  });
}

function signalTemplate(productRecord, district, evidenceItems) {
  const categories = new Set(evidenceItems.map((item) => item.category));
  const hasDemand = categories.has("Demand & Trade");
  const hasProcessing = categories.has("Processing & Value Addition");
  const hasInfrastructure = categories.has("Infrastructure & Logistics");
  const hasProduction = categories.has("Production & Availability");
  const hasPrice = categories.has("Price & Arrival");
  const hasWaste = categories.has("Waste & By-products");

  if (hasDemand && hasInfrastructure) {
    return {
      businessLayer: "Aggregation & Market Linkage",
      signalType: "Demand-linked infrastructure validation needed",
      claim: `${productRecord.product} in ${district} has product-level demand/trade evidence and district-level infrastructure evidence. Validate whether buyers can be served from this district.`,
      conclusionType: "INFERENCE",
      opportunityImplication: `Research buyer demand, quality requirements, and aggregation economics for ${productRecord.product} from ${district}.`
    };
  }

  if (hasProcessing && (hasProduction || hasInfrastructure)) {
    return {
      businessLayer: "Processing & Value Addition",
      signalType: "Processing pathway validation needed",
      claim: `${productRecord.product} in ${district} has evidence for processing/value-added pathways plus local supply or infrastructure context.`,
      conclusionType: "INFERENCE",
      opportunityImplication: `Validate processors, conversion economics, and raw-material availability for ${productRecord.product} value addition in ${district}.`
    };
  }

  if (hasPrice && hasProduction) {
    return {
      businessLayer: "Distribution, Retail & Trade",
      signalType: "Price and availability volatility candidate",
      claim: `${productRecord.product} in ${district} has evidence touching both availability and price/arrival behavior.`,
      conclusionType: "INFERENCE",
      opportunityImplication: `Check whether storage, aggregation, or processing can reduce value loss for ${productRecord.product} in ${district}.`
    };
  }

  if (hasWaste && (hasProcessing || hasInfrastructure)) {
    return {
      businessLayer: "Waste, By-products & Circular Agriculture",
      signalType: "By-product monetization candidate",
      claim: `${productRecord.product} in ${district} has by-product evidence connected to processing or infrastructure context.`,
      conclusionType: "INFERENCE",
      opportunityImplication: `Validate whether ${productRecord.product} by-products in ${district} have paying industrial, feed, compost, or ingredient buyers.`
    };
  }

  return null;
}

function confidenceFor(evidenceItems) {
  const verifiedCount = evidenceItems.filter((item) => item.evidenceType === "VERIFIED EVIDENCE").length;
  const sourceCount = new Set(evidenceItems.filter((item) => item.sourceId !== "product-intelligence").map((item) => item.sourceId)).size;
  if (verifiedCount >= 2 && sourceCount >= 2) return "High";
  if (verifiedCount >= 2 || sourceCount >= 1) return "Medium";
  return "Low";
}

function createSignalsFromEvidence(evidenceItems, researchDate) {
  const signals = [];

  for (const productRecord of PRODUCT_INTELLIGENCE) {
    for (const district of productRecord.districts) {
      const scoped = evidenceItems.filter((item) => {
        const sameProduct = item.product === productRecord.product;
        const sameDistrict = item.district === district || item.district === "Multiple / product-level";
        return sameProduct && sameDistrict;
      });

      const verified = scoped.filter((item) => item.evidenceType === "VERIFIED EVIDENCE");
      if (verified.length === 0) continue;

      const template = signalTemplate(productRecord, district, scoped);
      if (!template) continue;

      const supportingEvidence = scoped.slice(0, 6);
      signals.push({
        id: signalId([productRecord.id, district, template.signalType]),
        product: productRecord.product,
        district,
        businessLayer: template.businessLayer,
        signalType: template.signalType,
        claim: template.claim,
        conclusionType: template.conclusionType,
        evidenceType: template.conclusionType,
        evidence: supportingEvidence.map((item) => item.evidence).join(" | "),
        supportingEvidenceIds: supportingEvidence.map((item) => item.id),
        source: supportingEvidence.map((item) => item.source).join("; "),
        sourceUrl: supportingEvidence.find((item) => item.sourceUrl)?.sourceUrl || "",
        sourcePublicationDate: supportingEvidence.map((item) => item.sourcePublicationDate).filter(Boolean).join("; "),
        researchDate,
        confidence: confidenceFor(scoped),
        opportunityImplication: template.opportunityImplication,
        potentialBusinessPossibilities: productRecord.validationQuestions,
        contradictoryEvidence: [],
        status: "Active",
        evidenceHash: crypto.createHash("sha256").update(supportingEvidence.map((item) => item.id).join("|")).digest("hex")
      });
    }
  }

  return signals;
}

function updateRecords(existing, incoming, run, runId) {
  for (const record of incoming) {
    const current = existing.find((item) => item.id === record.id);
    if (!current) {
      existing.push({ ...record, firstSeenRunId: runId, lastSeenRunId: runId });
      if (record.id.startsWith("SIG-")) run.newSignals += 1;
    } else if (current.evidenceHash && record.evidenceHash && current.evidenceHash !== record.evidenceHash) {
      Object.assign(current, record, { firstSeenRunId: current.firstSeenRunId, lastSeenRunId: runId, status: "Updated" });
      if (record.id.startsWith("SIG-")) run.updatedSignals += 1;
    } else {
      current.lastSeenRunId = runId;
      current.researchDate = record.researchDate;
    }
  }
}

function updateSourceRegistry(db, source, checkedAt, evidenceCount) {
  const current = db.sources.find((item) => item.id === source.id);
  const record = {
    ...source,
    lastChecked: checkedAt,
    signalsSupported: db.signals.filter((signal) => signal.source.includes(source.name)).length,
    evidenceItemsSupported: evidenceCount
  };
  if (current) Object.assign(current, record);
  else db.sources.push(record);
}

async function runMarketScanner() {
  const db = readDb();
  db.productIntelligence = PRODUCT_INTELLIGENCE;

  const runId = nextRunId(db);
  const startTime = new Date().toISOString();
  const researchDate = startTime.slice(0, 10);
  const run = {
    runId,
    agent: "MAHARASHTRA MARKET & DEMAND SCANNER",
    philosophy: "Institutions define what is possible; markets validate what is needed.",
    startTime,
    endTime: null,
    sourcesChecked: 0,
    documentsFound: 0,
    relevantDocuments: 0,
    evidenceItemsCreated: 0,
    productIntelligenceRecords: PRODUCT_INTELLIGENCE.length,
    newSignals: 0,
    updatedSignals: 0,
    weakenedSignals: 0,
    contradictedSignals: 0,
    errors: [],
    status: "Running",
    sourceResults: []
  };

  db.runs.push(run);
  writeDb(db);

  let evidenceItems = productIntelligenceEvidence(researchDate);

  for (const source of SOURCES) {
    run.sourcesChecked += 1;
    const checkedAt = new Date().toISOString();
    try {
      const result = await fetchSource(source);
      if (!result.ok) {
        run.errors.push(`${source.name}: HTTP ${result.status}`);
        updateSourceRegistry(db, source, checkedAt, 0);
        continue;
      }

      run.documentsFound += 1;
      const isRelevant = containsAny(result.text, ["maharashtra", ...DISTRICTS, ...PRODUCT_INTELLIGENCE.map((item) => item.product)]);
      let extracted = [];
      if (isRelevant) {
        run.relevantDocuments += 1;
        extracted =
          source.id === "apeda-active-packhouses" || source.id === "apeda-packhouses"
            ? parsePackhouseEvidence({ source, text: result.text, publicationDate: result.publicationDate, researchDate: checkedAt.slice(0, 10) })
            : parseProductLevelEvidence({ source, text: result.text, publicationDate: result.publicationDate, researchDate: checkedAt.slice(0, 10) });
      }

      evidenceItems = evidenceItems.concat(extracted);
      updateSourceRegistry(db, source, checkedAt, extracted.length);
      run.sourceResults.push({
        sourceId: source.id,
        sourceName: source.name,
        relevant: isRelevant,
        evidenceItemsExtracted: extracted.length
      });
    } catch (error) {
      run.errors.push(`${source.name}: ${error.message}`);
      updateSourceRegistry(db, source, checkedAt, 0);
    }
    writeDb(db);
  }

  updateRecords(db.evidenceItems, evidenceItems, run, runId);
  run.evidenceItemsCreated = evidenceItems.length;

  const signals = createSignalsFromEvidence(evidenceItems, researchDate);
  updateRecords(db.signals, signals, run, runId);

  run.endTime = new Date().toISOString();
  run.status = run.errors.length === SOURCES.length ? "Failed" : "Completed";
  writeDb(db);
  return run;
}

module.exports = {
  runMarketScanner
};
