# Maharashtra Agriculture Market Intelligence

A deliberately simple research application for discovering evidence-backed agricultural market and demand signals in selected Maharashtra districts.

## Run

```powershell
npm start
```

Then open `http://127.0.0.1:8080`.

On Windows, you can also double-click `start-8080.cmd`. It starts the app on `http://127.0.0.1:8080` and keeps the terminal open.

## What V1 Does

- Maintains the fixed district and nine-layer research scope.
- Runs one scanner: **Maharashtra Market & Demand Scanner**.
- Checks a curated registry of authoritative and credible sources.
- Extracts traceable evidence snippets from fetched documents.
- Creates structured market signals only when product, district, and market-signal evidence can be found.
- Stores all signals, sources, watchlist entries, and research runs as JSON records.
- Never overwrites previous research runs.

The scanner is deterministic. It does not ask an LLM for generic opportunity lists.
