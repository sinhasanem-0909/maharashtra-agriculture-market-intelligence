const processedByproductsState = { records: [], category: "All", search: "" };
const processedByproductsCategories = ["All", "Cereals", "Pulses", "Oilseeds", "Cash Crops", "Fruits", "Vegetables", "Spices"];

async function loadProcessedByproducts() {
  const response = await fetch("/data/processed-byproducts/processed-byproducts.json");
  if (!response.ok) throw new Error("Processed & By-Products data could not be loaded");
  const payload = await response.json();
  processedByproductsState.records = payload.records || [];
  processedByproductsState.metadata = payload.metadata || {};
  renderProcessedByproducts();
}

function processedCategoryForCommodity(commodity) {
  const value = commodity.toLowerCase();
  if (["wheat", "rice", "millets"].some((x) => value.includes(x))) return "Cereals";
  if (["pigeon pea", "green gram", "black gram", "tur", "moong", "urad"].some((x) => value.includes(x))) return "Pulses";
  if (["soybean", "groundnut"].some((x) => value.includes(x))) return "Oilseeds";
  if (["sugarcane"].some((x) => value.includes(x))) return "Cash Crops";
  if (["mango", "grapes", "banana", "jackfruit"].some((x) => value.includes(x))) return "Fruits";
  if (["onion"].some((x) => value.includes(x))) return "Vegetables";
  return "Spices";
}

function renderProcessedByproducts() {
  const target = document.querySelector("#processedByproducts");
  if (!target) return;
  const filtered = processedByproductsState.records.filter((record) => {
    const categoryMatch = processedByproductsState.category === "All" || processedCategoryForCommodity(record.commodity) === processedByproductsState.category;
    const query = processedByproductsState.search.toLowerCase();
    const searchMatch = !query || `${record.commodity} ${record.product} ${record.type} ${record.application}`.toLowerCase().includes(query);
    return categoryMatch && searchMatch;
  });
  const commodityCount = new Set(filtered.map((record) => record.commodity)).size;
  target.innerHTML = `
    <div class="section-title">
      <div>
        <p class="eyebrow">Evidence-backed transformation map</p>
        <h3>Processed & By-Products</h3>
        <p>Products and by-products documented by authoritative agricultural research and government sources.</p>
      </div>
    </div>
    <div class="agriculture-category-tabs processed-tabs">
      ${processedByproductsCategories.map((category) => `<button class="agriculture-category-tab ${processedByproductsState.category === category ? "active" : ""}" data-pb-category="${category}">${category}</button>`).join("")}
    </div>
    <div class="universe-summary">
      <div class="universe-stat"><span>Evidence records</span><strong>${filtered.length}</strong></div>
      <div class="universe-stat"><span>Source commodities</span><strong>${commodityCount}</strong></div>
      <div class="universe-stat"><span>Evidence status</span><strong>Source-backed</strong><small>No AI-generated relationships</small></div>
      <div class="universe-stat"><span>Last verified</span><strong>${processedByproductsState.metadata.lastVerified || "Not available"}</strong></div>
    </div>
    <div class="research-note"><strong>Data rule:</strong> ${processedByproductsState.metadata.rule || "Only source-supported relationships are displayed."}</div>
    <div class="filters agriculture-filters"><input id="processedByproductsSearch" value="${escapeHtml(processedByproductsState.search)}" placeholder="Search commodity, product, use..." /></div>
    <div class="table-wrap agriculture-table processed-byproducts-table">
      <table>
        <thead><tr><th>Source commodity</th><th>Product / by-product</th><th>Type</th><th>Processing stage</th><th>Primary use</th><th>Evidence</th></tr></thead>
        <tbody>
          ${filtered.length ? filtered.map((record) => `<tr><td><strong>${escapeHtml(record.commodity)}</strong></td><td>${escapeHtml(record.product)}</td><td>${escapeHtml(record.type)}</td><td>${escapeHtml(record.processingStage)}</td><td>${escapeHtml(record.application)}</td><td><details><summary>View evidence</summary><p>${escapeHtml(record.evidence)}</p><a href="${escapeHtml(record.sourceUrl)}" target="_blank" rel="noreferrer">${escapeHtml(record.sourceName)} ↗</a></details></td></tr>`).join("") : `<tr><td colspan="6">No source-backed records match this filter.</td></tr>`}
        </tbody>
      </table>
    </div>
  `;
  target.querySelectorAll("[data-pb-category]").forEach((button) => button.addEventListener("click", () => { processedByproductsState.category = button.dataset.pbCategory; renderProcessedByproducts(); }));
  target.querySelector("#processedByproductsSearch").addEventListener("input", (event) => { processedByproductsState.search = event.target.value; renderProcessedByproducts(); });
}

function hookProcessedByproductsNavigation() {
  document.querySelectorAll('.nav-item').forEach((item) => item.addEventListener('click', () => {
    if (item.dataset.screen === "processedByproducts") setTimeout(renderProcessedByproducts, 0);
  }));
}

loadProcessedByproducts().catch((error) => console.error(error));
hookProcessedByproductsNavigation();
