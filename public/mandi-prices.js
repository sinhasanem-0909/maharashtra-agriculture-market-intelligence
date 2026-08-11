function mandiEscape(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;");
}

function mandiNumber(value, decimals = 2) {
  if (value === null || value === undefined || value === "" || !Number.isFinite(Number(value))) return "—";
  return Number(value).toFixed(decimals).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}

async function renderMandiPrices(product, target) {
  target.innerHTML = `<div class="research-panel"><h4>Mandi Prices & Arrivals</h4><p>Fetching live Maharashtra market data…</p></div>`;
  try {
    const response = await fetch(`/api/mandi-prices?commodity=${encodeURIComponent(product.commodity)}&days=30`);
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.detail || payload.error || "Mandi data request failed");
    const records = payload.records || [];
    if (!records.length) {
      target.innerHTML = `<div class="data-availability"><strong>No Maharashtra mandi records returned</strong><p>No substitute or estimated price is shown.</p><p class="source-line"><a href="${mandiEscape(payload.source?.baseUrl || "https://www.msamb.com/ApmcDetail/APMCPriceInformation")}" target="_blank" rel="noreferrer">Open official market source</a></p></div>`;
      return;
    }

    const modalRecords = records.filter((row) => Number.isFinite(row.modalPrice));
    const averageModal = modalRecords.length ? modalRecords.reduce((sum, row) => sum + row.modalPrice, 0) / modalRecords.length : null;
    const markets = new Set(records.map((row) => row.market).filter(Boolean));
    const dates = records.map((row) => row.date).filter(Boolean).sort();
    const latestDate = dates.at(-1) || "Latest available";
    const latestRecords = records.filter((row) => !row.date || row.date === latestDate);

    const daily = new Map();
    modalRecords.forEach((row) => {
      const key = row.date || "Unknown";
      if (!daily.has(key)) daily.set(key, []);
      daily.get(key).push(row.modalPrice);
    });
    const trend = [...daily.entries()].map(([date, values]) => ({ date, value: values.reduce((a, b) => a + b, 0) / values.length })).sort((a, b) => a.date.localeCompare(b.date)).slice(-30);
    const previous = trend.length > 1 ? trend[trend.length - 2].value : null;
    const current = trend.length ? trend[trend.length - 1].value : null;
    const change = current !== null && previous !== null && previous !== 0 ? ((current - previous) / previous) * 100 : null;

    const sourceName = payload.source?.name || "Maharashtra State Agricultural Marketing Board / AGMARKNET";
    const sourceUrl = payload.source?.url || payload.source?.baseUrl || "https://www.msamb.com/ApmcDetail/APMCPriceInformation";
    const sourceLink = `<a href="${mandiEscape(sourceUrl)}" target="_blank" rel="noreferrer">${mandiEscape(sourceName)}</a>`;
    const trendNote = payload.fallback ? "Latest records are from the official MSAMB daily market feed; a 30-day AGMARKNET response was not available." : "Historical daily values are returned by the official AGMARKNET query.";

    target.innerHTML = `
      <div class="research-note"><strong>Source rule:</strong> All prices and arrivals below are fetched from an official Maharashtra/AGMARKNET source. The application does not estimate, smooth or replace missing prices.</div>
      <div class="universe-summary mandi-summary">
        <div class="universe-stat"><span>Markets reporting</span><strong>${markets.size}</strong><small>Source returned</small></div>
        <div class="universe-stat"><span>Latest date</span><strong>${mandiEscape(latestDate)}</strong><small>Source-reported</small></div>
        <div class="universe-stat"><span>Average reported modal price</span><strong>${averageModal === null ? "Not available" : `₹${mandiNumber(averageModal)}`}</strong><small>Across ${markets.size} reporting market${markets.size === 1 ? "" : "s"}</small></div>
        <div class="universe-stat"><span>Day-on-day</span><strong>${change === null ? "Not available" : `${change >= 0 ? "+" : ""}${mandiNumber(change)}%`}</strong><small>Derived from source modal prices</small></div>
      </div>
      <div class="research-panel"><h4>Recent modal-price trend</h4><p>${mandiEscape(trendNote)}</p><div class="table-wrap"><table class="mini-table"><thead><tr><th>Date</th><th>Average reported modal price</th></tr></thead><tbody>${trend.slice().reverse().map((item) => `<tr><td>${mandiEscape(item.date)}</td><td><strong>₹${mandiNumber(item.value)}</strong></td></tr>`).join("")}</tbody></table></div></div>
      <div class="research-panel" style="margin-top:14px"><h4>Latest Maharashtra APMC records</h4><div class="table-wrap"><table class="mini-table"><thead><tr><th>Market</th><th>Variety</th><th>Grade</th><th>Arrivals</th><th>Min</th><th>Modal</th><th>Max</th><th>Date</th></tr></thead><tbody>${latestRecords.slice(0, 100).map((row) => `<tr><td>${mandiEscape(row.market || "—")}</td><td>${mandiEscape(row.variety || "—")}</td><td>${mandiEscape(row.grade || "—")}</td><td>${row.arrivals === null || row.arrivals === undefined ? "—" : mandiNumber(row.arrivals)}</td><td>${row.minPrice === null ? "—" : `₹${mandiNumber(row.minPrice)}`}</td><td><strong>${row.modalPrice === null ? "—" : `₹${mandiNumber(row.modalPrice)}`}</strong></td><td>${row.maxPrice === null ? "—" : `₹${mandiNumber(row.maxPrice)}`}</td><td>${mandiEscape(row.date || "—")}</td></tr>`).join("")}</tbody></table></div></div>
      <p class="source-line">Source: ${sourceLink}. The original government source is retained as evidence.</p>`;
  } catch (error) {
    target.innerHTML = `<div class="data-availability"><strong>Live mandi data could not be fetched</strong><p>${mandiEscape(error instanceof Error ? error.message : "Unknown error")}</p><span>No substitute or estimated price is shown.</span></div>`;
  }
}

window.renderMandiPrices = renderMandiPrices;
