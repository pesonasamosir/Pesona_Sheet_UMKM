# PESONA — Inventori & Finansial UMKM (Next.js)

Privacy-first UMKM app. **All data stays in the visitor's browser (IndexedDB).**

## Vercel deploy

**Root Directory must be `web`.**

1. Vercel → Project → Settings → General → Root Directory → `web`
2. Framework: Next.js
3. Redeploy

If you see `OSError: Read-only file system: '/var/task/database'`, Vercel is still
running the legacy Flask app from the repo root — fix Root Directory as above.

## Local development

```bash
npm install
npm run dev
```

Or from this folder:

```bash
cd web
npm install
npm run dev
```

Open http://localhost:3000

```bash
npm run verify:formulas
```
