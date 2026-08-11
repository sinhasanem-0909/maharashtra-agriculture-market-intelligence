function mandiEscape(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;");
}

async function renderMandiPrices(product, target) {
  target.innerHTML = `<div class="research-panel"><h4>Mandi Prices & Arrivals</h4><p>Fetching Maharashtra APMC data directly from AGMARKNET…</p></div>`;
  try {
    const response = await fetch(`/api/mandi-prices?commodity=${encodeURIComponent(product.commodity)}&days=30`);
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.detail || payload.error || "Mandi data request failed");
    const records = payload.records || [];
    if (!records.length) {
      target.innerHTML = `<div class="data-availability"><strong>No Maharashtra mandi records returned</strong><p>AGMARKNET returned no usable records for ${mandiEscape(product.commodity)} in the selected 30-day window. No substitute or estimated price is shown.</p><p class="source-line"><a href="${mandiEscape(payload.source?.baseUrl || "https://agmarknet.gov.in/")}" target="_blank" rel="noreferrer">Official AGMARKNET source</a></p></div>`;
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

    target.innerHTML = `
      <div class="research-note"><strong>Source rule:</strong> All prices and arrivals below are returned by AGMARKNET. The application does not estimate, smooth or replace missing prices.</div>
      <div class="universe-summary mandi-summary">
        <div class="universe-stat"><span>Markets reporting</span><strong>${markets.size}</strong><small>Returned by AGMARKNET</small></div>
        <div class="universe-stat"><span>Latest date</span><strong>${mandiEscape(latestDate)}</strong><small>Source-reported</small></div>
        <div class="universe-stat"><span>Average modal</span><strong>${averageModal === null ? "Not available" : `₹${averageModal.toFixed(0)}`}</strong><small>₹/quintal where reported</small></div>
        <div class="universe-stat"><span>Day-on-day</span><strong>${change === null ? "Not available" : `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`}</strong><small>Derived from source modal prices</small></div>
      </div>
      <div class="research-panel"><h4>Recent modal-price trend</h4><div class="table-wrap"><table class="mini-table"><thead><tr><th>Date</th><th>Average modal price</th></tr></thead><tbody>${trend.slice().reverse().map((item) => `<tr><td>${mandiEscape(item.date)}</td><td><strong>₹${item.value.toFixed(0)}</strong></td></tr>`).join("")}</tbody></table></div></div>
      <div class="research-panel" style="margin-top:14px"><h4>Latest Maharashtra APMC records</h4><div class="table-wrap"><table class="mini-table"><thead><tr><th>Market</th><th>District</th><th>Variety</th><th>Grade</th><th>Arrivals</th><th>Min</th><th>Modal</th><th>Max</th><th>Date</th></tr></thead><tbody>${latestRecords.slice(0, 100).map((row) => `<tr><td>${mandiEscape(row.market || "—")}</td><td>${mandiEscape(row.district || "—")}</td><td>${mandiEscape(row.variety || "—")}</td><td>${mandiEscape(row.grade || "—")}</td><td>${row.arrivalsTonnes === null ? "—" : mandiEscape(row.arrivalsTonnes)}</td><td>${row.minPrice === null ? "—" : `₹${mandiEscape(row.minPrice)}`}</td><td><strong>${row.modalPrice === null ? "—" : `₹${mandiEscape(row.modalPrice)}`}</strong></td><td>${row.maxPrice === null ? "—" : `₹${mandiEscape(row.maxPrice)}`}</td><td>${mandiEscape(row.date || "—")}</td></tr>`).join("")}</tbody></table></div></div>
      <p class="source-line">Source: <a href="${mandiEscape(payload.source?.baseUrl || "https://agmarknet.gov.in/")}" target="_blank" rel="noreferrer">AGMARKNET — Directorate of Marketing & Inspection, Government of India</a>. The query URL is available from the server response.</p>`;
  } catch (error) {
    target.innerHTML = `<div class="data-availability"><strong>AGMARKNET could not be reached</strong><p>${mandiEscape(error instanceof Error ? error.message : "Unknown error")}</p><span>No other dataset has been substituted.</span></div>`;
  }
}

window.renderMandiPrices = renderMandiPrices;
