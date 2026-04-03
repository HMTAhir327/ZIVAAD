# ZIVAAD: Local Run + Vercel Deploy

## 1) Run Locally

### Prerequisites
- Node.js 18.18+ (or 20+ recommended)
- npm

### Commands
```bash
cd /Users/hafiz/Desktop/ZIVAAD
cp .env.example .env.local
npm install
npm run dev
```

Open: `http://localhost:3000`

### Admin JSON Editing (Local-Only Workflow)
- Open `http://localhost:3000/admin`
- Keep this in `.env.local`:
  - `ADMIN_LOCAL_WRITE_MODE=true`
- If omitted, local writes are still enabled by default; Vercel is read-only by default.
- Click **Save Changes** / **Save Content** to write:
  - `data/products.json`
  - `data/site-content.json`
- After your edits are final, commit and push these JSON files, then deploy.

### Production Build Test (Optional)
```bash
npm run typecheck
npm run lint
npm run build
npm start
```

---

## 2) Deploy on Vercel (Dashboard Method)

1. Push this project to GitHub/GitLab/Bitbucket.
2. Go to Vercel: https://vercel.com/new
3. Import the repository.
4. Framework preset: **Next.js** (auto-detected).
5. In **Project Settings → Environment Variables**, add:
   - `NEXT_PUBLIC_WHATSAPP_NUMBER` = `923XXXXXXXXX`
   - `NEXT_PUBLIC_USD_RATE` = `278` (or your live internal rate)
   - `ORDER_WEBHOOK_URL` = your SheetDB/Pipedream webhook URL
   - `ADMIN_LOCAL_WRITE_MODE` = `false` (recommended on Vercel; edit locally, then redeploy)
6. Click **Deploy**.
7. After deploy, test:
   - Home page and shop pages
   - Product page SEO/meta preview
   - Cart drawer and WhatsApp checkout redirect
   - Order backup webhook receives payload before WhatsApp redirect

---

## 3) Deploy on Vercel (CLI Method)

```bash
cd /Users/hafiz/Desktop/ZIVAAD
npm i -g vercel
vercel
```

Follow prompts:
- Link account
- Set project name (e.g., `zivaad`)
- Confirm settings

For production deploy:
```bash
vercel --prod
```

Set env vars from CLI if needed:
```bash
vercel env add NEXT_PUBLIC_WHATSAPP_NUMBER
vercel env add NEXT_PUBLIC_USD_RATE
vercel env add ORDER_WEBHOOK_URL
vercel env add ADMIN_LOCAL_WRITE_MODE
```

Then redeploy:
```bash
vercel --prod
```
