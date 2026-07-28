# PESONA UMKM Project

## Production app (Vercel)

Use the Next.js app in **`web/`** — privacy-first, IndexedDB, no server SQLite.

### Fix for `OSError: Read-only file system: '/var/task/database'`

That error means Vercel was running the **legacy Flask** app. Flask cannot write SQLite under `/var/task` on Vercel.

**Do this in the Vercel dashboard:**

1. Project → **Settings** → **General** → **Root Directory**
2. Set Root Directory to: `web`
3. Framework Preset: **Next.js**
4. **Redeploy** (Deployments → … → Redeploy)

Repo changes already applied to prevent Python auto-detect:

- `app.py` → `flask_app.py`
- `requirements.txt` → `requirements.flask.txt`
- Root `vercel.json` + `package.json` point builds at `web/`

### Local Next.js

```bash
cd web
npm install
npm run dev
```

### Legacy Flask (local only)

```bash
pip install -r requirements.flask.txt
python flask_app.py
```
