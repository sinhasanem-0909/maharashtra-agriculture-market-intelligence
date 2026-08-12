const transformationState = { records: [], category: "All", search: "", selected: null, metadata: {} };
const transformationCategories = ["All", "Cereals", "Pulses", "Oilseeds", "Cash Crops", "Fruits", "Vegetables", "Spices"];

async function loadTransformationUniverse() {
  const [baseResponse, vegetableResponse] = await Promise.all([
    fetch("/data/transformation/transformation-universe.json"),
    fetch("/data/transformation/vegetable-transformations.json")
  ]);
  if (!baseResponse.ok || !vegetableResponse.ok) throw new Error("Transformation universe could not be loaded");
  const [basePayload, vegetablePayload] = await Promise.all([baseResponse.json(), vegetableResponse.json()]);
  transformationState.records = [...(basePayload.records || []), ...(vegetablePayload.records || [])];
  transformationState.metadata = {
    ...(basePayload.metadata || {}),
    lastVerified: [basePayload.metadata?.lastVerified, vegetablePayload.metadata?.lastVerified].filter(Boolean).sort().pop() || "Not available"
  };
  renderTransformationUniverse();
}

function renderTransformationUniverse() {
  const target = document.querySelector("#transformationUniverse");
  if (!target) return;
  const filtered = transformationState.records.filter((r) => {
    const categoryMatch = transformationState.category === "All" || r.category === transformationState.category;
    const q = transformationState.search.toLowerCase();
    const text = [r.commodity, r.sourcePart, r.processingRoute, r.intermediate, r.derivedProduct, r.endUse, r.industry].join(" ").toLowerCase();
    return categoryMatch && (!q || text.includes(q));
  });
  const commodities = new Set(filtered.map((r) => r.commodity)).size;
  const categoryCounts = transformationCategories.filter((c) => c !== "All").map((c) => [c, transformationState.records.filter((r) => r.category === c).length]);
  target.innerHTML = `
    <div class="section-title">
      <div>
        <p class="eyebrow">Evidence foundation for business discovery</p>
        <h3>Agricultural Transformation Universe</h3>
        <p>Maps what each agricultural commodity can become — including processing streams, residues, intermediates, derived products and documented end uses.</p>
      </div>
    </div>
    <div class="agriculture-category-tabs transformation-tabs">
      ${transformationCategories.map((c) => {
        const count = c === "All" ? transformationState.records.length : categoryCounts.find(([name]) => name === c)?.[1] || 0;
        return `<button class="agriculture-category-tab ${transformationState.category === c ? "active" : ""}" data-t-category="${c}">${c}<span>${count}</span></button>`;
      }).join("")}
    </div>
    <div class="universe-summary">
      <div class="universe-stat"><span>Evidence pathways</span><strong>${filtered.length}</strong></div>
      <div class="universe-stat"><span>Commodities covered</span><strong>${commodities}</strong></div>
      <div class="universe-stat"><span>Evidence rule</span><strong>Source-backed</strong><small>AI does not create relationships</small></div>
      <div class="universe-stat"><span>Last verified</span><strong>${transformationState.metadata.lastVerified || "Not available"}</strong></div>
    </div>
    <div class="research-note"><strong>Research rule:</strong> ${escapeHtml(transformationState.metadata.rule || "Only source-supported relationships are displayed.")}</div>
    <div class="filters agriculture-filters"><input id="transformationSearch" value="${escapeHtml(transformationState.search)}" placeholder="Search commodity, part, product, application..." /></div>
    <div class="table-wrap agriculture-table transformation-table">
      <table>
        <thead><tr><th>Commodity</th><th>Source part / residue</th><th>Processing / extraction</th><th>Intermediate</th><th>Derived product</th><th>End use / industry</th><th>Evidence</th></tr></thead>
        <tbody>${filtered.length ? filtered.map((r, i) => `<tr><td><strong>${escapeHtml(r.commodity)}</strong><br><small>${escapeHtml(r.category)}</small></td><td>${escapeHtml(r.sourcePart)}<br><small>${escapeHtml(r.partType)}</small></td><td>${escapeHtml(r.processingRoute)}</td><td>${escapeHtml(r.intermediate)}</td><td>${escapeHtml(r.derivedProduct)}<br><small>${escapeHtml(r.productType)}</small></td><td>${escapeHtml(r.endUse)}<br><small>${escapeHtml(r.industry)}</small></td><td><button class="link-button" data-t-evidence="${i}">View source</button></td></tr>`).join("") : `<tr><td colspan="7">No source-backed transformation pathways match this filter.</td></tr>`}</tbody>
      </table>
    </div>
    <div id="transformationEvidence" class="transformation-evidence"></div>
  `;
  target.querySelectorAll("[data-t-category]").forEach((b) => b.addEventListener("click", () => { transformationState.category = b.dataset.tCategory; renderTransformationUniverse(); }));
  target.querySelector("#transformationSearch").addEventListener("input", (e) => { transformationState.search = e.target.value; renderTransformationUniverse(); });
  target.querySelectorAll("[data-t-evidence]").forEach((b) => b.addEventListener("click", () => {
    const record = filtered[Number(b.dataset.tEvidence)];
    target.querySelector("#transformationEvidence").innerHTML = `<div class="research-panel"><h4>${escapeHtml(record.derivedProduct)}</h4><p>${escapeHtml(record.evidenceNote)}</p><p><strong>Evidence level:</strong> ${escapeHtml(record.evidenceLevel)}</p><a href="${escapeHtml(record.sourceUrl)}" target="_blank" rel="noreferrer">${escapeHtml(record.sourceName)} ↗</a></div>`;
  }));
}

function hookTransformationNavigation() {
  document.querySelectorAll('.nav-item').forEach((item) => item.addEventListener('click', () => {
    if (item.dataset.screen === "transformationUniverse") setTimeout(renderTransformationUniverse, 0);
  }));
}

loadTransformationUniverse().catch((error) => console.error(error));
hookTransformationNavigation();
