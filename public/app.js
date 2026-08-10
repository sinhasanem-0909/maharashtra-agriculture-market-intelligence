const state = {
  dashboard: null,
  scope: null,
  products: [],
  evidence: [],
  signals: [],
  sources: [],
  runs: [],
  watchlist: [],
  activeScreen: "dashboard",
  pendingSignalFilter: null
};

const screens = [...document.querySelectorAll(".screen")];
const navItems = [...document.querySelectorAll(".nav-item")];
const refreshButton = document.querySelector("#refreshButton");
const statusBanner = document.querySelector("#statusBanner");
const signalDialog = document.querySelector("#signalDialog");
const signalDetail = document.querySelector("#signalDetail");

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "content-type": "application/json" },
    ...options
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || response.statusText);
  }
  return response.json();
}

function showStatus(message, persistent = false) {
  statusBanner.textContent = message;
  statusBanner.classList.remove("hidden");
  if (!persistent) {
    setTimeout(() => statusBanner.classList.add("hidden"), 4500);
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function unique(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

function formatDate(value) {
  if (!value) return "Not checked";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

async function loadData() {
  const [dashboard, scope, products, evidence, signals, sources, runs, watchlist] = await Promise.all([
    api("/api/dashboard"),
    api("/api/scope"),
    api("/api/products"),
    api("/api/evidence"),
    api("/api/signals"),
    api("/api/sources"),
    api("/api/runs"),
    api("/api/watchlist")
  ]);
  Object.assign(state, { dashboard, scope, products, evidence, signals, sources, runs, watchlist });
  render();
}

function setScreen(name) {
  state.activeScreen = name;
  screens.forEach((screen) => screen.classList.toggle("active", screen.id === name));
  navItems.forEach((item) => item.classList.toggle("active", item.dataset.screen === name));
  render();
}

function renderDashboard() {
  const target = document.querySelector("#dashboard");
  const data = state.dashboard;
  const lastRun = data.lastRun;
  target.innerHTML = `
    <div class="section-title">
      <div>
        <h3>Dashboard</h3>
        <p>Research scope, current signal inventory, and latest scanner activity.</p>
      </div>
    </div>
    <div class="metric-grid">
      <button class="metric metric-action" data-open-screen="signals"><span>Market signals</span><strong>${data.totals.marketSignals}</strong></button>
      <button class="metric metric-action" data-open-screen="products"><span>Product intelligence</span><strong>${data.totals.productIntelligenceRecords}</strong></button>
      <button class="metric metric-action" data-open-screen="sources"><span>Evidence items</span><strong>${data.totals.evidenceItems}</strong></button>
      <button class="metric metric-action" data-filter-confidence="High"><span>High-confidence opportunities</span><strong>${data.totals.highConfidenceOpportunities}</strong></button>
    </div>
    <div class="band philosophy-band">
      <h4>Research Philosophy</h4>
      <p><strong>Institutions define what is possible. Markets validate what is needed.</strong></p>
      <p>Product intelligence maps raw, processed, intermediate, industrial, and by-product pathways. Market signals are created only when evidence supports demand, shortage, price volatility, processing need, infrastructure gap, or underused by-product logic.</p>
    </div>
    <div class="band">
      <h4>Current Research Scope</h4>
      <p><strong>Geography:</strong> ${escapeHtml(data.scope.geography)}</p>
      <div class="district-list">${data.scope.districts.map((district) => `<button class="tag tag-button" data-filter-district="${district}">${district}</button>`).join("")}</div>
    </div>
    <div class="band">
      <h4>Business Layers</h4>
      <div class="layer-list">${data.scope.businessLayers.map((layer) => `<button class="tag tag-button" data-filter-layer="${escapeHtml(layer)}">${escapeHtml(layer)}</button>`).join("")}</div>
    </div>
    <div class="band">
      <h4>Last Research Run</h4>
      ${
        lastRun
          ? `<p><strong>${lastRun.runId}</strong> ${lastRun.status} from ${formatDate(lastRun.startTime)} to ${formatDate(lastRun.endTime)}</p>
             <p>${lastRun.sourcesChecked} sources checked, ${lastRun.documentsFound} documents found, ${lastRun.relevantDocuments} relevant documents, ${lastRun.errors.length} errors.</p>`
          : "<p>No research run yet. Use Refresh Market Intelligence to begin.</p>"
      }
      <p><strong>Research completeness:</strong> ${data.totals.researchCompleteness}% of district-layer pairs currently have at least one signal.</p>
    </div>
  `;
  target.querySelectorAll("[data-open-screen]").forEach((button) => {
    button.addEventListener("click", () => setScreen(button.dataset.openScreen));
  });
  target.querySelectorAll("[data-filter-confidence]").forEach((button) => {
    button.addEventListener("click", () => {
      state.pendingSignalFilter = { confidence: button.dataset.filterConfidence };
      setScreen("signals");
    });
  });
  target.querySelectorAll("[data-filter-district]").forEach((button) => {
    button.addEventListener("click", () => {
      state.pendingSignalFilter = { district: button.dataset.filterDistrict };
      setScreen("signals");
    });
  });
  target.querySelectorAll("[data-filter-layer]").forEach((button) => {
    button.addEventListener("click", () => {
      state.pendingSignalFilter = { layer: button.dataset.filterLayer };
      setScreen("signals");
    });
  });
}

function renderUniverse() {
  const target = document.querySelector("#universe");
  const covered = new Set(state.signals.map((signal) => `${signal.district}|${signal.businessLayer}`));
  const counts = new Map();
  for (const signal of state.signals) {
    const key = `${signal.district}|${signal.businessLayer}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const heads = ["District", ...state.scope.businessLayers].map((label) => `<div class="universe-head">${escapeHtml(label)}</div>`).join("");
  const rows = state.scope.districts
    .map((district) => {
      const cells = state.scope.businessLayers
        .map((layer) => {
          const key = `${district}|${layer}`;
          return `<div class="universe-cell ${covered.has(key) ? "covered" : ""}">${counts.get(key) || 0} signals</div>`;
        })
        .join("");
      return `<div class="universe-head">${district}</div>${cells}`;
    })
    .join("");

  target.innerHTML = `
    <div class="section-title">
      <div>
        <h3>Market Universe</h3>
        <p>Fixed research matrix: selected districts across all nine agriculture business layers.</p>
      </div>
    </div>
    <div class="table-wrap"><div class="universe-grid">${heads}${rows}</div></div>
  `;
}

function renderProducts() {
  const target = document.querySelector("#products");
  const rows = state.products
    .map(
      (product) => `
        <tr>
          <td>
            <div class="product-name">${escapeHtml(product.product)}</div>
            <div class="tag-row">${(product.districts || []).map((district) => `<span class="tag">${escapeHtml(district)}</span>`).join("")}</div>
          </td>
          <td>${escapeHtml((product.institutionAnchors || []).join(", "))}</td>
          <td>${escapeHtml((product.rawForms || []).join(", "))}</td>
          <td>${escapeHtml((product.processedForms || []).join(", "))}</td>
          <td>${escapeHtml((product.intermediateIndustrialForms || []).join(", "))}</td>
          <td>${escapeHtml((product.byproducts || []).join(", "))}</td>
          <td>${escapeHtml((product.buyerCategories || []).join(", "))}</td>
          <td>${escapeHtml((product.infrastructureNeeds || []).join(", "))}</td>
          <td>
            <details>
              <summary>Validation questions</summary>
              <ul class="compact-list">${(product.validationQuestions || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
            </details>
            <button class="secondary-button product-signal-button" data-product-filter="${escapeHtml(product.product)}">View signals</button>
          </td>
        </tr>`
    )
    .join("");

  target.innerHTML = `
    <div class="section-title">
      <div>
        <h3>Product Intelligence & Value-Chain Explorer</h3>
        <p>Structured product possibility maps used to expand the scanner's search space before market validation.</p>
      </div>
    </div>
    <div class="table-wrap product-intelligence-table">
      <table>
        <thead>
          <tr>
            <th>Product / Districts</th>
            <th>Institution Anchors</th>
            <th>Raw Forms</th>
            <th>Processed Forms</th>
            <th>Intermediate / Industrial</th>
            <th>By-products / Waste</th>
            <th>Buyer Categories</th>
            <th>Infrastructure Needs</th>
            <th>Validation / Signals</th>
          </tr>
        </thead>
        <tbody>
          ${rows || `<tr><td colspan="9">No product intelligence records available.</td></tr>`}
        </tbody>
      </table>
    </div>
  `;

  target.querySelectorAll("[data-product-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.pendingSignalFilter = { product: button.dataset.productFilter };
      setScreen("signals");
    });
  });
}

function renderSignals() {
  const target = document.querySelector("#signals");
  target.innerHTML = `
    <div class="section-title">
      <div>
        <h3>Market Signals</h3>
        <p>Searchable evidence records. Open a signal to inspect evidence and source traceability.</p>
      </div>
    </div>
    <div class="filters">
      <input id="signalSearch" placeholder="Search product, claim, source, evidence" />
      ${selectHtml("districtFilter", "District", unique(state.signals.map((s) => s.district)))}
      ${selectHtml("productFilter", "Product", unique(state.signals.map((s) => s.product)))}
      ${selectHtml("layerFilter", "Business layer", unique(state.signals.map((s) => s.businessLayer)))}
      ${selectHtml("typeFilter", "Signal type", unique(state.signals.map((s) => s.signalType)))}
      ${selectHtml("confidenceFilter", "Confidence", ["High", "Medium", "Low"])}
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Signal</th><th>Product</th><th>District</th><th>Layer</th><th>Type</th><th>Confidence</th><th>Status</th></tr></thead>
        <tbody id="signalRows"></tbody>
      </table>
    </div>
  `;
  ["signalSearch", "districtFilter", "productFilter", "layerFilter", "typeFilter", "confidenceFilter"].forEach((id) => {
    document.querySelector(`#${id}`).addEventListener("input", renderSignalRows);
  });
  if (state.pendingSignalFilter) {
    if (state.pendingSignalFilter.district) document.querySelector("#districtFilter").value = state.pendingSignalFilter.district;
    if (state.pendingSignalFilter.product) document.querySelector("#productFilter").value = state.pendingSignalFilter.product;
    if (state.pendingSignalFilter.layer) document.querySelector("#layerFilter").value = state.pendingSignalFilter.layer;
    if (state.pendingSignalFilter.confidence) document.querySelector("#confidenceFilter").value = state.pendingSignalFilter.confidence;
    state.pendingSignalFilter = null;
  }
  renderSignalRows();
}

function selectHtml(id, label, options) {
  return `<select id="${id}"><option value="">${label}</option>${options.map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`).join("")}</select>`;
}

function renderSignalRows() {
  const rows = document.querySelector("#signalRows");
  if (!rows) return;
  const search = document.querySelector("#signalSearch").value.toLowerCase();
  const district = document.querySelector("#districtFilter").value;
  const product = document.querySelector("#productFilter").value;
  const layer = document.querySelector("#layerFilter").value;
  const type = document.querySelector("#typeFilter").value;
  const confidence = document.querySelector("#confidenceFilter").value;

  const filtered = state.signals.filter((signal) => {
    const blob = `${signal.product} ${signal.claim} ${signal.source} ${signal.evidence}`.toLowerCase();
    return (
      (!search || blob.includes(search)) &&
      (!district || signal.district === district) &&
      (!product || signal.product === product) &&
      (!layer || signal.businessLayer === layer) &&
      (!type || signal.signalType === type) &&
      (!confidence || signal.confidence === confidence)
    );
  });

  rows.innerHTML = filtered.length
    ? filtered
        .map(
          (signal) => `
        <tr>
          <td><button class="link-button" data-signal="${signal.id}">${escapeHtml(signal.claim)}</button></td>
          <td>${escapeHtml(signal.product)}</td>
          <td>${escapeHtml(signal.district)}</td>
          <td>${escapeHtml(signal.businessLayer)}</td>
          <td>${escapeHtml(signal.signalType)}</td>
          <td><span class="badge ${signal.confidence.toLowerCase()}">${escapeHtml(signal.confidence)}</span></td>
          <td>${escapeHtml(signal.status)}</td>
        </tr>`
        )
        .join("")
    : `<tr><td colspan="7">No signals match the current filters.</td></tr>`;

  rows.querySelectorAll("[data-signal]").forEach((button) => {
    button.addEventListener("click", () => openSignal(button.dataset.signal));
  });
}

function openSignal(id) {
  const signal = state.signals.find((item) => item.id === id);
  if (!signal) return;
  const evidenceItems = (signal.supportingEvidenceIds || [])
    .map((evidenceId) => state.evidence.find((item) => item.id === evidenceId))
    .filter(Boolean);
  signalDetail.innerHTML = `
    <div class="detail-content">
      <p class="eyebrow">${escapeHtml(signal.conclusionType || signal.evidenceType)}</p>
      <h3>${escapeHtml(signal.claim)}</h3>
      <div class="evidence-box">
        <strong>Signal Logic</strong>
        <p>${escapeHtml(signal.opportunityImplication)}</p>
      </div>
      <div class="detail-grid">
        ${field("Product / commodity", signal.product)}
        ${field("District", signal.district)}
        ${field("Business layer", signal.businessLayer)}
        ${field("Signal type", signal.signalType)}
        ${field("Source publication date", signal.sourcePublicationDate)}
        ${field("Research date", signal.researchDate)}
        ${field("Confidence", signal.confidence)}
        ${field("Status", signal.status)}
      </div>
      <div class="band">
        <h4>Supporting Evidence Ledger</h4>
        ${
          evidenceItems.length
            ? evidenceItems
                .map(
                  (item) => `
                  <div class="evidence-item">
                    <p><strong>${escapeHtml(item.category)}</strong> <span class="badge">${escapeHtml(item.evidenceType)}</span></p>
                    <p>${escapeHtml(item.claim)}</p>
                    <blockquote>${escapeHtml(item.evidence)}</blockquote>
                    <p class="muted">${escapeHtml(item.source)} ${item.sourceUrl ? `- <a href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noreferrer">source</a>` : ""}</p>
                  </div>`
                )
                .join("")
            : `<p>${escapeHtml(signal.evidence)}</p><p><a href="${escapeHtml(signal.sourceUrl)}" target="_blank" rel="noreferrer">${escapeHtml(signal.source)}</a></p>`
        }
      </div>
      <div class="band">
        <h4>Questions To Validate Before Business Model</h4>
        <ul>${signal.potentialBusinessPossibilities.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
        <h4>Contradictory Evidence</h4>
        <p>${signal.contradictoryEvidence.length ? signal.contradictoryEvidence.map(escapeHtml).join("<br>") : "None recorded."}</p>
      </div>
      <div class="watchlist-editor">
        <select id="watchStatus"><option>Watching</option><option>Prioritize</option><option>Needs validation</option><option>Archived</option></select>
        <textarea id="watchNotes" placeholder="Watchlist notes"></textarea>
        <button class="secondary-button" id="addWatch">Save</button>
      </div>
    </div>
  `;
  document.querySelector("#addWatch").addEventListener("click", async () => {
    await api("/api/watchlist", {
      method: "POST",
      body: JSON.stringify({
        signalId: signal.id,
        status: document.querySelector("#watchStatus").value,
        notes: document.querySelector("#watchNotes").value
      })
    });
    await loadData();
    showStatus("Signal saved to watchlist.");
  });
  signalDialog.showModal();
}

function field(label, value) {
  return `<div class="field"><span>${escapeHtml(label)}</span>${escapeHtml(value)}</div>`;
}

function renderSources() {
  const target = document.querySelector("#sources");
  target.innerHTML = `
    <div class="section-title">
      <div>
        <h3>Research Sources</h3>
        <p>Curated source registry with authority level and signal support counts.</p>
      </div>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Source</th><th>Type</th><th>Authority</th><th>Last checked</th><th>Topics</th><th>Evidence</th><th>Signals</th></tr></thead>
        <tbody>
          ${state.sources
            .map(
              (source) => `
              <tr>
                <td><a href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">${escapeHtml(source.name)}</a></td>
                <td>${escapeHtml(source.type)}</td>
                <td>${escapeHtml(source.authorityLevel)}</td>
                <td>${formatDate(source.lastChecked)}</td>
                <td>${escapeHtml((source.topicsCovered || []).join(", "))}</td>
                <td>${source.evidenceItemsSupported || 0}</td>
                <td>${source.signalsSupported || 0}</td>
              </tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderRuns() {
  const target = document.querySelector("#runs");
  target.innerHTML = `
    <div class="section-title">
      <div>
        <h3>Research Runs</h3>
        <p>Persistent historical scan records. Previous runs are never overwritten.</p>
      </div>
      <button class="primary-button" id="runRefresh">Refresh Market Intelligence</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Run ID</th><th>Date</th><th>Sources</th><th>Documents</th><th>Evidence</th><th>New</th><th>Updated</th><th>Errors</th><th>Status</th></tr></thead>
        <tbody>
          ${state.runs
            .slice()
            .reverse()
            .map(
              (run) => `
              <tr>
                <td><button class="link-button" data-run="${run.runId}">${run.runId}</button></td>
                <td>${formatDate(run.startTime)}</td>
                <td>${run.sourcesChecked}</td>
                <td>${run.documentsFound}</td>
                <td>${run.evidenceItemsCreated || 0}</td>
                <td>${run.newSignals}</td>
                <td>${run.updatedSignals}</td>
                <td>${run.errors.length}</td>
                <td>${escapeHtml(run.status)}</td>
              </tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>
    <div id="runDetail"></div>
  `;
  document.querySelector("#runRefresh").addEventListener("click", refreshMarketIntelligence);
  target.querySelectorAll("[data-run]").forEach((button) => {
    button.addEventListener("click", () => renderRunDetail(button.dataset.run));
  });
}

function renderRunDetail(runId) {
  const run = state.runs.find((item) => item.runId === runId);
  const target = document.querySelector("#runDetail");
  target.innerHTML = `
    <div class="band">
      <h4>${run.runId}</h4>
      <p>${run.status} from ${formatDate(run.startTime)} to ${formatDate(run.endTime)}</p>
      <p>${run.sourcesChecked} sources checked, ${run.documentsFound} documents found, ${run.relevantDocuments} relevant documents, ${run.evidenceItemsCreated || 0} evidence items, ${run.newSignals} new signals, ${run.updatedSignals} updated signals, ${run.weakenedSignals} weakened signals, ${run.contradictedSignals} contradicted signals.</p>
      <h4>Source Results</h4>
      <ul>${(run.sourceResults || []).map((item) => `<li>${escapeHtml(item.sourceName)}: ${item.relevant ? "Relevant" : "Not relevant"}, ${item.evidenceItemsExtracted ?? item.signalsExtracted ?? 0} evidence items extracted</li>`).join("") || "<li>No source results recorded.</li>"}</ul>
      <h4>Errors</h4>
      <ul>${run.errors.map((error) => `<li>${escapeHtml(error)}</li>`).join("") || "<li>No errors recorded.</li>"}</ul>
    </div>
  `;
}

function renderWatchlist() {
  const target = document.querySelector("#watchlist");
  target.innerHTML = `
    <div class="section-title">
      <div>
        <h3>Watchlist</h3>
        <p>Saved signals for follow-up validation and business investigation.</p>
      </div>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Signal</th><th>Product</th><th>District</th><th>Layer</th><th>Date added</th><th>Status</th><th>Notes</th></tr></thead>
        <tbody>
          ${
            state.watchlist.length
              ? state.watchlist
                  .map(
                    (item) => `
                <tr>
                  <td>${escapeHtml(item.signal)}</td>
                  <td>${escapeHtml(item.product)}</td>
                  <td>${escapeHtml(item.district)}</td>
                  <td>${escapeHtml(item.businessLayer)}</td>
                  <td>${formatDate(item.dateAdded)}</td>
                  <td>${escapeHtml(item.status)}</td>
                  <td>${escapeHtml(item.notes)}</td>
                </tr>`
                  )
                  .join("")
              : `<tr><td colspan="7">No saved signals yet. Open a market signal and save it to the watchlist.</td></tr>`
          }
        </tbody>
      </table>
    </div>
  `;
}

function render() {
  if (!state.dashboard || !state.scope) return;
  if (state.activeScreen === "dashboard") renderDashboard();
  if (state.activeScreen === "universe") renderUniverse();
  if (state.activeScreen === "products") renderProducts();
  if (state.activeScreen === "signals") renderSignals();
  if (state.activeScreen === "sources") renderSources();
  if (state.activeScreen === "runs") renderRuns();
  if (state.activeScreen === "watchlist") renderWatchlist();
}

async function refreshMarketIntelligence() {
  refreshButton.disabled = true;
  showStatus("Scanner running. Authoritative sources are being checked and previous runs will be preserved.", true);
  try {
    const run = await api("/api/runs/refresh", { method: "POST" });
    await loadData();
    showStatus(`${run.runId} ${run.status}: ${run.newSignals} new signals, ${run.updatedSignals} updated signals, ${run.errors.length} errors.`);
    setScreen("runs");
    renderRunDetail(run.runId);
  } catch (error) {
    showStatus(`Refresh failed: ${error.message}`, true);
  } finally {
    refreshButton.disabled = false;
  }
}

navItems.forEach((item) => item.addEventListener("click", () => setScreen(item.dataset.screen)));
refreshButton.addEventListener("click", refreshMarketIntelligence);
loadData().catch((error) => showStatus(`Application failed to load: ${error.message}`, true));