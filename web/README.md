# PESONA — Inventori & Finansial UMKM (Next.js)

Privacy-first UMKM business intelligence app. **All data stays in the visitor's browser (IndexedDB).** No shared server database, no telemetry.

## Stack

- Next.js App Router (Vercel-ready static/SSR shell)
- Tailwind CSS v4
- Dexie / IndexedDB for per-device isolation
- Recharts for trends
- SheetJS (`xlsx`) for Excel export/import backup

## Local development

```bash
cd web
npm install
npm run dev
```

Open http://localhost:3000

Verify Excel formulas:

```bash
npm run verify:formulas
```

## Deploy to Vercel

1. Set the Vercel **Root Directory** to `web`
2. Framework: Next.js (auto-detected)
3. Build command: `npm run build`
4. Output: default Next.js

No environment variables or databases required.

## Privacy model

| Concern | Behavior |
|--------|----------|
| Cross-device sharing | Never — each browser has its own IndexedDB |
| Server writes | None for business data |
| Backup / transfer | Manual Export JSON or Excel, then Import JSON |
| Tracking | Disabled (`robots: noindex`) |

## Pages

- `/` Dashboard — revenue, profit, margin, stock alerts, charts
- `/produk` Produk & HPP
- `/inventori` EOQ / Safety Stock / ROP / LFL
- `/inventori/mingguan` Weekly MRP planner
- `/arus-kas` Cash flow & profitability
- `/biaya` Fixed, overhead, assumptions
- `/data` Export / Import / wipe / reseed

## Formula source

Aligned 1:1 with `Sheet Inventori dan Finansial UMKM.xlsx` (same as the legacy Flask services in the parent folder).
