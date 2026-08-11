const agricultureState = {
  payload: null,
  selectedCommodity: null,
  activeTab: "overview"
};

async function loadAgricultureUniverse() {
  const response = await fetch("/api/agriculture-universe");
  if (!response.ok) throw new Error("Agriculture Universe could not be loaded");
  agricultureState.payload = await response.json();
  renderAgricultureUniverse();
}

function agricultureEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatPct(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "Not available";
  const number = Number(value);
  return `${number >= 0 ? "+" : ""}${number.toFixed(1)}%`;
}

function renderAgricultureUniverse() {
  const target = document.querySelector("#universe");
  if (!target || !agricultureState.payload) return;
  const records = agricultureState.payload.records || [];
  const categories = [...new Set(records.map((item) => item.category).filter(Boolean))].sort();
  target.innerHTML = `
    <div class="section-title agriculture-title"><div><p class="eyebrow">Source-driven research universe</p><h3>Maharashtra Agriculture Universe</h3><p>What Maharashtra actually produces, based on authoritative agricultural statistics currently ingested.</p></div><div class="source-chip"><span>Latest source</span><a href="${agricultureEscape(agricultureState.payload.source.url)}" target="_blank" rel="noreferrer">${agricultureEscape(agricultureState.payload.source.name)}</a><small>${agricultureEscape(agricultureState.payload.source.dataYear)} · ${agricultureEscape(agricultureState.payload.source.publicationDate)}</small></div></div>
    <div class="universe-summary"><div class="universe-stat"><span>Commodities in source</span><strong>${records.length}</strong></div><div class="universe-stat"><span>Categories</span><strong>${categories.length}</strong></div><div class="universe-stat"><span>Current production</span><strong>Available</strong><small>2025–26 third advance estimate</small></div><div class="universe-stat"><span>Historical production</span><strong>Available</strong><small>2024–25 third advance estimate</small></div></div>
    <div class="research-note"><strong>Data rule:</strong> Numbers are taken from the cited source. The application does not estimate missing production, demand, supply or prices. Historical change is calculated only from the two cited production values.</div>
    <div class="filters agriculture-filters"><input id="agricultureSearch" placeholder="Search commodity" /><select id="agricultureCategory"><option value="">All categories</option>${categories.map((category) => `<option value="${agricultureEscape(category)}">${agricultureEscape(category)}</option>`).join("")}</select></div>
    <div class="table-wrap agriculture-table"><table><thead><tr><th>Commodity</th><th>Category</th><th>Area</th><th>Production</th><th>Yield</th><th>Production change</th><th>Districts</th><th>Demand</th><th>Supply</th><th>Mandi</th></tr></thead><tbody id="agricultureRows"></tbody></table></div>`;
  document.querySelector("#agricultureSearch").addEventListener("input", renderAgricultureRows);
  document.querySelector("#agricultureCategory").addEventListener("change", renderAgricultureRows);
  renderAgricultureRows();
}

function renderAgricultureRows() {
  const rows = document.querySelector("#agricultureRows");
  if (!rows || !agricultureState.payload) return;
  const search = document.querySelector("#agricultureSearch").value.toLowerCase();
  const category = document.querySelector("#agricultureCategory").value;
  const records = agricultureState.payload.records.filter((record) => (!search || record.commodity.toLowerCase().includes(search)) && (!category || record.category === category));
  rows.innerHTML = records.map((record) => `<tr><td><button class="link-button commodity-link" data-commodity="${agricultureEscape(record.commodity)}">${agricultureEscape(record.commodity)}</button></td><td>${agricultureEscape(record.category)}</td><td>${agricultureEscape(record.area)} ${agricultureEscape(record.areaUnit)}</td><td><strong>${agricultureEscape(record.production)}</strong> ${agricultureEscape(record.productionUnit)}</td><td>${agricultureEscape(record.productivity)} ${agricultureEscape(record.productivityUnit)}</td><td>${agricultureEscape(formatPct(record.productionChangeFromPreviousYearPct))}</td><td><span class="data-status">Not ingested</span></td><td><span class="data-status">Not available</span></td><td><span class="data-status">Not available</span></td><td><span class="data-status">Live source</span></td></tr>`).join("") || `<tr><td colspan="10">No commodities match the filter.</td></tr>`;
  rows.querySelectorAll("[data-commodity]").forEach((button) => button.addEventListener("click", () => openCommodity(button.dataset.commodity)));
}

function openCommodity(commodity) {
  agricultureState.selectedCommodity = agricultureState.payload.records.find((record) => record.commodity === commodity) || null;
  agricultureState.activeTab = "overview";
  if (typeof setScreen === "function") setScreen("products");
  setTimeout(renderCommodityDetail, 0);
}

function renderCommodityDetail() {
  const target = document.querySelector("#products");
  const product = agricultureState.selectedCommodity;
  if (!target) return;
  if (!product) {
    target.innerHTML = `<div class="section-title"><div><p class="eyebrow">Commodity research</p><h3>Commodity Intelligence</h3><p>Select a commodity from the Agriculture Universe to investigate it.</p></div></div><div class="empty-research">Select a commodity from <strong>Maharashtra Agriculture Universe</strong>.</div>`;
    return;
  }
  const tabs = ["overview", "production", "historical", "districts", "demand", "prices", "trade", "value-chain", "infrastructure", "sources"];
  const previousChange = formatPct(product.productionChangeFromPreviousYearPct);
  target.innerHTML = `<div class="commodity-header"><div><p class="eyebrow">Commodity Intelligence</p><h3>${agricultureEscape(product.commodity)}</h3><p>${agricultureEscape(product.category)} · Maharashtra · ${agricultureEscape(product.year)}</p></div><button class="secondary-button" id="backToUniverse">← Back to Agriculture Universe</button></div><div class="commodity-snapshot"><div><span>Current area</span><strong>${agricultureEscape(product.area)} ${agricultureEscape(product.areaUnit)}</strong><small>Source measured</small></div><div><span>Current production</span><strong>${agricultureEscape(product.production)} ${agricultureEscape(product.productionUnit)}</strong><small>Source measured</small></div><div><span>Current yield</span><strong>${agricultureEscape(product.productivity)} ${agricultureEscape(product.productivityUnit)}</strong><small>Source measured</small></div><div><span>Production change</span><strong>${agricultureEscape(previousChange)}</strong><small>vs 2024–25</small></div><div><span>District mapping</span><strong>Not ingested</strong><small>Drill-down layer deferred</small></div><div><span>Mandi prices</span><strong>Official API</strong><small>AGMARKNET / data.gov.in</small></div></div><div class="commodity-tabs">${tabs.map((tab) => `<button class="commodity-tab ${agricultureState.activeTab === tab ? "active" : ""}" data-tab="${tab}">${tab === "demand" ? "Demand & Supply" : tab === "value-chain" ? "Value Chain" : tab === "historical" ? "Historical Production" : tab === "sources" ? "Sources" : tab.charAt(0).toUpperCase() + tab.slice(1)}</button>`).join("")}</div><div id="commodityTabContent" class="commodity-content"></div>`;
  document.querySelector("#backToUniverse").addEventListener("click", () => { if (typeof setScreen === "function") setScreen("universe"); setTimeout(renderAgricultureUniverse, 0); });
  target.querySelectorAll("[data-tab]").forEach((button) => button.addEventListener("click", () => { agricultureState.activeTab = button.dataset.tab; renderCommodityDetail(); }));
  renderCommodityTab();
}

function renderHistoricalProduction(product) {
  const series = product.historicalSeries || [];
  if (!series.length) return `<div class="data-availability"><strong>Historical production</strong><p>No historical record is currently ingested for this commodity.</p></div>`;
  const rows = series.map((item) => `<tr><td><strong>${agricultureEscape(item.year)}</strong></td><td>${agricultureEscape(item.area)} ${agricultureEscape(item.areaUnit)}</td><td>${agricultureEscape(item.production)} ${agricultureEscape(item.productionUnit)}</td><td>${agricultureEscape(item.productivity)} ${agricultureEscape(item.productivityUnit)}</td><td><a href="${agricultureEscape(item.source.url)}" target="_blank" rel="noreferrer">Source</a></td></tr>`).join("");
  return `<div class="research-panel"><h4>State production history</h4><p>Historical values are shown exactly as published by the Maharashtra Agriculture Department. The change percentage is a derived calculation from the cited values.</p><table class="mini-table"><thead><tr><th>Year</th><th>Area</th><th>Production</th><th>Yield</th><th>Evidence</th></tr></thead><tbody>${rows}</tbody></table><p class="source-line">Current and historical records are sourced independently; click Source for the original publication.</p></div>`;
}

function renderCommodityTab() {
  const target = document.querySelector("#commodityTabContent");
  const product = agricultureState.selectedCommodity;
  if (!target || !product) return;
  const source = agricultureState.payload.source;
  const sourceLink = `<a href="${agricultureEscape(source.url)}" target="_blank" rel="noreferrer">${agricultureEscape(source.name)}</a>`;
  const unavailable = (title, message) => `<div class="data-availability"><strong>${title}</strong><p>${message}</p><span>Not available in the currently ingested source set.</span></div>`;
  const content = {
    overview: `<div class="research-grid"><div class="research-panel"><h4>Current factual picture</h4><p><strong>${agricultureEscape(product.commodity)}</strong> is recorded in Maharashtra's ${agricultureEscape(product.category)} data for ${agricultureEscape(product.year)}.</p><p>Area: <strong>${agricultureEscape(product.area)} ${agricultureEscape(product.areaUnit)}</strong></p><p>Production: <strong>${agricultureEscape(product.production)} ${agricultureEscape(product.productionUnit)}</strong></p><p>Productivity: <strong>${agricultureEscape(product.productivity)} ${agricultureEscape(product.productivityUnit)}</strong></p><p>Production change vs 2024–25: <strong>${agricultureEscape(formatPct(product.productionChangeFromPreviousYearPct))}</strong></p></div><div class="research-panel"><h4>What we do not claim yet</h4><p>District production, demand, supply, trade, processing capacity and infrastructure have not been populated until their authoritative datasets are ingested.</p></div></div>`,
    production: `<div class="research-panel"><h4>Current production</h4><table class="mini-table"><tbody><tr><th>Year</th><td>${agricultureEscape(product.year)}</td></tr><tr><th>Area</th><td>${agricultureEscape(product.area)} ${agricultureEscape(product.areaUnit)}</td></tr><tr><th>Production</th><td>${agricultureEscape(product.production)} ${agricultureEscape(product.productionUnit)}</td></tr><tr><th>Yield</th><td>${agricultureEscape(product.productivity)} ${agricultureEscape(product.productivityUnit)}</td></tr></tbody></table><p class="source-line">Source: ${sourceLink} · ${agricultureEscape(source.publicationDate)}</p></div>`,
    historical: renderHistoricalProduction(product),
    districts: unavailable("District mapping", "District production is intentionally deferred. It is a drill-down layer rather than a required state-level production metric."),
    demand: unavailable("Demand & Supply", "No Maharashtra-specific demand or supply number has been ingested yet. When data exists, it will be displayed with its measurement basis and source rather than estimated by AI."),
    prices: `<div id="mandiPriceContent"></div>`,
    trade: unavailable("Trade", "Trade data has not yet been ingested. Export/import figures will be added only from an authoritative trade source."),
    "value-chain": unavailable("Value Chain", "The value-chain layer will be populated from authoritative processing, horticulture and market sources. It is deliberately not being inferred from the commodity name."),
    infrastructure: unavailable("Infrastructure", "Processing, storage, packhouse, cold-chain and other infrastructure data will be added from authoritative registries and government sources."),
    sources: `<div class="research-panel"><h4>Evidence sources</h4><p>${sourceLink}</p><p>Publication date: ${agricultureEscape(source.publicationDate)}</p><p>Data year: ${agricultureEscape(source.dataYear)}</p><p>Status: ${agricultureEscape(source.status)}</p><p>Historical source: <a href="${agricultureEscape(HISTORICAL_SOURCE_URL)}" target="_blank" rel="noreferrer">Maharashtra 2024–25 Third Advance Estimates</a></p><p>Mandi source: <a href="https://www.data.gov.in/resource/current-daily-price-various-commodities-various-markets-mandi" target="_blank" rel="noreferrer">Government of India — AGMARKNET / data.gov.in</a></p></div>`
  };
  target.innerHTML = content[agricultureState.activeTab];
  if (agricultureState.activeTab === "prices" && window.renderMandiPrices) {
    window.renderMandiPrices(product, document.querySelector("#mandiPriceContent"));
  }
}

const HISTORICAL_SOURCE_URL = "https://krishi.maharashtra.gov.in/Site/Upload/GR/THIRD%20ADVANCE%20ESTIMATES%202024-25%20STATE%20ABSTRACT.pdf";

function hookAgricultureNavigation() {
  document.querySelectorAll('.nav-item').forEach((item) => item.addEventListener('click', () => {
    if (item.dataset.screen === "universe") setTimeout(renderAgricultureUniverse, 0);
    if (item.dataset.screen === "products") setTimeout(renderCommodityDetail, 0);
  }));
}

loadAgricultureUniverse().catch((error) => console.error(error));
hookAgricultureNavigation();
