const AGRICULTURE_CATEGORY_ORDER = ["Cereals", "Pulses", "Oilseeds", "Cash Crops", "Fruits", "Vegetables", "Spices"];
let agricultureCategoryPayload = null;
let activeAgricultureCategory = "Cereals";

function categoryEscape(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;");
}

function categoryNumber(value, decimals = 2) {
  if (value === null || value === undefined || value === "" || !Number.isFinite(Number(value))) return "Not available";
  return Number(value).toFixed(decimals).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}

async function loadCategoryUniverse() {
  const response = await fetch("/api/agriculture-universe");
  if (!response.ok) throw new Error("Agriculture Universe could not be loaded");
  agricultureCategoryPayload = await response.json();
  renderCategoryUniverse();
}

function renderCategoryUniverse() {
  const target = document.querySelector("#universe");
  if (!target || !agricultureCategoryPayload) return;
  const records = agricultureCategoryPayload.records || [];
  const available = new Set(records.map((record) => record.category));
  const categories = AGRICULTURE_CATEGORY_ORDER.filter((category) => available.has(category));
  if (!categories.includes(activeAgricultureCategory)) activeAgricultureCategory = categories[0] || "Cereals";

  target.innerHTML = `
    <div class="section-title agriculture-title">
      <div><p class="eyebrow">Source-driven research universe</p><h3>Maharashtra Agriculture Universe</h3><p>Start with an agricultural category, then drill into the commodities actually reported by the source datasets.</p></div>
      <div class="source-chip"><span>Sources</span><strong>State APY + Horticulture statistics</strong><small>Numbers remain tied to their individual source and estimate year.</small></div>
    </div>
    <div class="agriculture-category-tabs" role="tablist" aria-label="Agriculture categories">
      ${categories.map((category) => `<button class="agriculture-category-tab ${category === activeAgricultureCategory ? "active" : ""}" data-category="${category}" role="tab">${category}</button>`).join("")}
    </div>
    <div id="agricultureCategoryContent"></div>
  `;

  target.querySelectorAll("[data-category]").forEach((button) => button.addEventListener("click", () => {
    activeAgricultureCategory = button.dataset.category;
    renderCategoryUniverse();
  }));
  renderCategoryContent();
}

function renderCategoryContent() {
  const target = document.querySelector("#agricultureCategoryContent");
  if (!target || !agricultureCategoryPayload) return;
  const records = agricultureCategoryPayload.records.filter((record) => record.category === activeAgricultureCategory);
  const measured = records.filter((record) => record.production != null);
  const area = measured.reduce((sum, record) => sum + Number(record.area || 0), 0);
  const production = measured.reduce((sum, record) => sum + Number(record.production || 0), 0);
  const sourceIds = [...new Set(records.map((record) => record.source?.name).filter(Boolean))];

  target.innerHTML = `
    <div class="category-heading"><div><h4>${categoryEscape(activeAgricultureCategory)}</h4><p>${records.length} source-listed commodities · ${measured.length} with reported production</p></div><div class="category-source">${sourceIds.map(categoryEscape).join(" · ")}</div></div>
    <div class="universe-summary category-summary">
      <div class="universe-stat"><span>Commodities</span><strong>${records.length}</strong></div>
      <div class="universe-stat"><span>Reported area</span><strong>${area ? categoryNumber(area) : "Not available"}</strong><small>Source units may differ by dataset</small></div>
      <div class="universe-stat"><span>Reported production</span><strong>${production ? categoryNumber(production) : "Not available"}</strong><small>Only measured rows included</small></div>
    </div>
    <div class="research-note"><strong>Data rule:</strong> A blank value means the source did not report that crop value. The application does not convert a blank into zero and does not estimate missing production.</div>
    <div class="table-wrap agriculture-table">
      <table><thead><tr><th>Commodity</th><th>Area</th><th>Production</th><th>Yield</th><th>Data status</th><th>Source</th></tr></thead>
      <tbody>${records.map((record) => `<tr>
        <td><button class="link-button commodity-link" data-commodity="${categoryEscape(record.commodity)}">${categoryEscape(record.commodity)}</button></td>
        <td>${record.area == null ? "Not reported" : `${categoryNumber(record.area)} ${categoryEscape(record.areaUnit)}`}</td>
        <td>${record.production == null ? "Not reported" : `${categoryNumber(record.production)} ${categoryEscape(record.productionUnit)}`}</td>
        <td>${record.productivity == null ? "Not available" : `${categoryNumber(record.productivity)} ${categoryEscape(record.productivityUnit)}`}</td>
        <td><span class="data-status">${record.production == null ? "Not reported" : "Measured"}</span></td>
        <td><a href="${categoryEscape(record.source?.url || "#")}" target="_blank" rel="noreferrer">Source</a></td>
      </tr>`).join("") || `<tr><td colspan="6">No commodities are currently ingested for this category.</td></tr>`}</tbody></table>
    </div>
  `;

  target.querySelectorAll("[data-commodity]").forEach((button) => button.addEventListener("click", () => {
    if (typeof openCommodity === "function") openCommodity(button.dataset.commodity);
  }));
}

function hookCategoryNavigation() {
  document.querySelectorAll('.nav-item').forEach((item) => item.addEventListener('click', () => {
    if (item.dataset.screen === "universe") setTimeout(renderCategoryUniverse, 0);
  }));
}

loadCategoryUniverse().catch((error) => console.error(error));
hookCategoryNavigation();
