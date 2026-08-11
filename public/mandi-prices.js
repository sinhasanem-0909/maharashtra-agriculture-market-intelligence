const MANDI_RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070";
const MANDI_SOURCE_URL = "https://www.data.gov.in/resource/current-daily-price-various-commodities-various-markets-mandi";
const MANDI_API_BASE = `https://api.data.gov.in/resource/${MANDI_RESOURCE_ID}`;

const MANDI_COMMODITY_ALIASES = {
  Soybean: "Soyabean",
  Tur: "Arhar (Tur/Red Gram)(Whole)",
  Mung: "Green Gram (Moong)(Whole)",
  Udid: "Black Gram (Urd Beans)(Whole)",
  Groundnut: "Groundnut",
  Sesamum: "Sesamum(Sesame,Gingelly,Til)",
  Sunflower: "Sunflower",
  Maize: "Maize",
  Jowar: "Jowar(Sorghum)",
  Bajra: "Bajra(Pearl Millet/Cumbu)",
  Wheat: "Wheat",
  Rice: "Rice",
  Sugarcane: "Sugarcane",
  Tobacco: "Tobacco"
};

function getMandiApiKey() {
  return localStorage.getItem("maha_agri_data_gov_api_key") || "";
}

function setMandiApiKey() {
  const current = getMandiApiKey();
  const value = window.prompt("Enter your data.gov.in API key. It is stored only in this browser and is not committed to GitHub.", current);
  if (value === null) return false;
  if (!value.trim()) localStorage.removeItem("maha_agri_data_gov_api_key");
  else localStorage.setItem("maha_agri_data_gov_api_key", value.trim());
  return true;
}

function mandiEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function mandiNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function parseMandiDate(value) {
  if (!value) return null;
  const parts = String(value).split("/");
  if (parts.length === 3) return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function fetchMandiRecords(commodity) {
  const apiKey = getMandiApiKey();
  if (!apiKey) return { configured: false, records: [] };

  const sourceCommodity = MANDI_COMMODITY_ALIASES[commodity] || commodity;
  const params = new URLSearchParams({
    "api-key": apiKey,
    format: "json",
    limit: "500",
    "filters[state]": "Maharashtra",
    "filters[commodity]": sourceCommodity
  });

  const response = await fetch(`${MANDI_API_BASE}?${params.toString()}`);
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Mandi data request failed (${response.status})${body ? `: ${body.slice(0, 180)}` : ""}`);
  }

  const payload = await response.json();
  return { configured: true, records: Array.isArray(payload.records) ? payload.records : [] };
}

function summarizeMandiRecords(records) {
  const valid = records
    .map((record) => ({
      ...record,
      min: mandiNumber(record.min_price),
      max: mandiNumber(record.max_price),
      modal: mandiNumber(record.modal_price),
      date: parseMandiDate(record.arrival_date)
    }))
    .filter((record) => record.modal !== null && record.date);

  const byDate = new Map();
  valid.forEach((record) => {
    const key = record.date.toISOString().slice(0, 10);
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key).push(record.modal);
  });

  const daily = [...byDate.entries()]
    .map(([date, values]) => ({ date, modal: values.reduce((a, b) => a + b, 0) / values.length }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const latestDate = daily.length ? daily[daily.length - 1].date : null;
  const latest = latestDate ? valid.filter((r) => r.date.toISOString().slice(0, 10) === latestDate) : [];
  const previousDate = daily.length > 1 ? daily[daily.length - 2].date : null;
  const latestAvg = latest.length ? latest.reduce((sum, r) => sum + r.modal, 0) / latest.length : null;
  const previousAvg = previousDate ? daily.find((d) => d.date === previousDate)?.modal : null;
  const change = latestAvg !== null && previousAvg ? ((latestAvg - previousAvg) / previousAvg) * 100 : null;

  return { valid, daily, latest, latestDate, latestAvg, change };
}

async function renderMandiPrices(product, target) {
  target.innerHTML = `
    <div class="research-panel">
      <h4>Mandi Prices & Arrivals</h4>
      <p>Loading Maharashtra APMC data from the Government of India's AGMARKNET dataset…</p>
    </div>`;

  try {
    let result = await fetchMandiRecords(product.commodity);
    if (!result.configured) {
      target.innerHTML = `
        <div class="data-availability">
          <strong>Connect official mandi data</strong>
          <p>The Government of India publishes daily mandi prices and arrivals through AGMARKNET/data.gov.in. This application will fetch those records directly; it will not create or estimate prices.</p>
          <button class="secondary-button" id="setMandiKey">Connect data.gov.in</button>
          <p class="source-line"><a href="${MANDI_SOURCE_URL}" target="_blank" rel="noreferrer">Open the official mandi dataset</a></p>
        </div>`;
      document.querySelector("#setMandiKey").addEventListener("click", () => {
        if (setMandiApiKey()) renderMandiPrices(product, target);
      });
      return;
    }

    const summary = summarizeMandiRecords(result.records);
    if (!summary.valid.length) {
      target.innerHTML = `
        <div class="data-availability">
          <strong>No Maharashtra mandi records returned for ${mandiEscape(product.commodity)}</strong>
          <p>The official API returned no usable records for the mapped commodity name. No substitute price is shown.</p>
          <button class="secondary-button" id="changeMandiKey">Change data.gov.in key</button>
          <p class="source-line"><a href="${MANDI_SOURCE_URL}" target="_blank" rel="noreferrer">Official source</a></p>
        </div>`;
      document.querySelector("#changeMandiKey").addEventListener("click", () => {
        if (setMandiApiKey()) renderMandiPrices(product, target);
      });
      return;
    }

    const latestRows = summary.latest
      .sort((a, b) => (b.modal ?? 0) - (a.modal ?? 0))
      .slice(0, 25)
      .map((record) => `
        <tr>
          <td>${mandiEscape(record.market)}</td>
          <td>${mandiEscape(record.district)}</td>
          <td>${mandiEscape(record.variety || "—")}</td>
          <td>${mandiEscape(record.grade || "—")}</td>
          <td>₹${record.min ?? "—"}</td>
          <td><strong>₹${record.modal ?? "—"}</strong></td>
          <td>₹${record.max ?? "—"}</td>
          <td>${mandiEscape(record.arrival_date)}</td>
        </tr>`).join("");

    const trendRows = summary.daily.slice(-30).reverse().map((day) => `
      <tr><td>${mandiEscape(day.date)}</td><td><strong>₹${day.modal.toFixed(0)}</strong></td></tr>`).join("");

    target.innerHTML = `
      <div class="research-grid">
        <div class="research-panel">
          <h4>Latest market position</h4>
          <div class="mandi-kpis">
            <div><span>Latest date</span><strong>${mandiEscape(summary.latestDate)}</strong></div>
            <div><span>Markets reporting</span><strong>${summary.latest.length}</strong></div>
            <div><span>Average modal</span><strong>₹${summary.latestAvg?.toFixed(0) ?? "—"}</strong></div>
            <div><span>Day-on-day change</span><strong>${summary.change === null ? "Not available" : `${summary.change >= 0 ? "+" : ""}${summary.change.toFixed(1)}%`}</strong></div>
          </div>
          <p class="source-line">Source: <a href="${MANDI_SOURCE_URL}" target="_blank" rel="noreferrer">Government of India — AGMARKNET / data.gov.in</a>. Prices are reported per the source's market unit.</p>
        </div>
        <div class="research-panel">
          <h4>Recent modal-price trend</h4>
          <table class="mini-table"><thead><tr><th>Date</th><th>Average modal</th></tr></thead><tbody>${trendRows}</tbody></table>
        </div>
      </div>
      <div class="research-panel" style="margin-top:14px">
        <h4>Latest Maharashtra APMC records</h4>
        <div class="table-wrap">
          <table class="mini-table">
            <thead><tr><th>Market</th><th>District</th><th>Variety</th><th>Grade</th><th>Min</th><th>Modal</th><th>Max</th><th>Arrival date</th></tr></thead>
            <tbody>${latestRows}</tbody>
          </table>
        </div>
      </div>`;
  } catch (error) {
    target.innerHTML = `
      <div class="data-availability">
        <strong>Mandi data could not be fetched</strong>
        <p>${mandiEscape(error instanceof Error ? error.message : "Unknown API error")}</p>
        <button class="secondary-button" id="retryMandi">Retry / change API key</button>
        <p class="source-line"><a href="${MANDI_SOURCE_URL}" target="_blank" rel="noreferrer">Official AGMARKNET/data.gov.in source</a></p>
      </div>`;
    document.querySelector("#retryMandi").addEventListener("click", () => {
      if (setMandiApiKey()) renderMandiPrices(product, target);
    });
  }
}

window.renderMandiPrices = renderMandiPrices;
