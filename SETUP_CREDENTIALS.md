# ZIVAAD — Credentials & Setup Guide

This document lists all credentials and configuration needed to run ZIVAAD in production.

---

## Environment Variables

All environment variables go in `.env.local` (local dev) or Vercel Project Settings (production).

### Required

| Variable | Example | Where to Get |
|----------|---------|-------------|
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `923084271446` | Your WhatsApp Business number in international format (no + sign) |
| `NEXT_PUBLIC_USD_RATE` | `278` | PKR to USD exchange rate for currency toggle display |
| `ORDER_WEBHOOK_URL` | `https://hook.us1.make.com/abc123` | Webhook URL to receive order backups before WhatsApp redirect |
| `ADMIN_LOCAL_WRITE_MODE` | `true` (local) / `false` (Vercel) | Enables admin write operations locally |

### Analytics & Tracking

| Variable | Example | Where to Get |
|----------|---------|-------------|
| `NEXT_PUBLIC_GA4_ID` | `G-AB1CD2EF3G` | Google Analytics → Admin → Data Streams → Measurement ID |
| `NEXT_PUBLIC_META_PIXEL_ID` | `123456789012345` | Meta Events Manager → Data Sources → Your Pixel → Pixel ID |
| `NEXT_PUBLIC_TIKTOK_PIXEL_ID` | `ABCDEF123456` | TikTok Ads Manager → Assets → Events → Web Events → Pixel ID |

---

## How to Get Each Credential

### Google Analytics 4 (GA4)
1. Go to [analytics.google.com](https://analytics.google.com)
2. Create a property for "zivaad.com"
3. Go to Admin → Data Streams → Add Web Stream
4. Enter `https://zivaad.com`
5. Copy the **Measurement ID** (starts with `G-`)
6. Paste into `NEXT_PUBLIC_GA4_ID`

### Meta (Facebook/Instagram) Pixel
1. Go to [business.facebook.com/events_manager](https://business.facebook.com/events_manager)
2. Click "Connect Data Sources" → "Web" → "Meta Pixel"
3. Name it "ZIVAAD Pixel"
4. Copy the **Pixel ID** (numeric, ~15 digits)
5. Paste into `NEXT_PUBLIC_META_PIXEL_ID`
6. The pixel auto-tracks: PageView, ViewContent (when implemented)

### TikTok Pixel
1. Go to [ads.tiktok.com](https://ads.tiktok.com) → Assets → Events → Web Events
2. Create a pixel → "Manually Install Pixel Code"
3. Copy the **Pixel ID**
4. Paste into `NEXT_PUBLIC_TIKTOK_PIXEL_ID`

### Order Webhook (Make.com / Zapier)
1. Go to [make.com](https://make.com) (recommended) or [zapier.com](https://zapier.com)
2. Create a new scenario/zap
3. Add a "Webhook" trigger → "Custom Webhook"
4. Copy the webhook URL
5. Paste into `ORDER_WEBHOOK_URL`
6. Connect the webhook to Google Sheets / your preferred data store
7. Order payload includes: timestamp, items (name, quantity, price, variant), total, customer (name, city, address), currency, source, ip, user_agent

---

## Vercel Deployment

### Environment Variables to Set
In Vercel Project Settings → Environment Variables, add ALL of the above:

```
NEXT_PUBLIC_WHATSAPP_NUMBER=923084271446
NEXT_PUBLIC_USD_RATE=278
ORDER_WEBHOOK_URL=https://hook.us1.make.com/your-real-webhook
ADMIN_LOCAL_WRITE_MODE=false
NEXT_PUBLIC_GA4_ID=G-YOUR-REAL-ID
NEXT_PUBLIC_META_PIXEL_ID=YOUR-REAL-PIXEL-ID
NEXT_PUBLIC_TIKTOK_PIXEL_ID=YOUR-REAL-TIKTOK-ID
```

### Deploy Commands
```bash
# Preview deploy
vercel

# Production deploy
vercel --prod
```

---

## Admin Panel

- **URL**: `/admin` (only works in development mode, returns 404 in production)
- **Access**: Run `npm run dev` locally
- **Features**: Product CRUD, reviews management, site content editing, sale manager, taxonomy
- **Write mode**: Controlled by `ADMIN_LOCAL_WRITE_MODE` env var

### Admin Workflow
1. Run `npm run dev` locally
2. Go to `http://localhost:3000/admin`
3. Make changes (products, reviews, site content, sales)
4. Click "Save" in admin
5. Commit the updated JSON files to git
6. Push to trigger Vercel redeploy

---

## Project Structure

```
ZIVAAD/
├── app/                    # Next.js App Router pages
│   ├── admin/              # Admin panel (dev-only)
│   ├── api/                # API routes (orders, admin, catalog, profiles)
│   ├── product/[slug]/     # Product detail pages
│   ├── shop/               # Shop/catalog page
│   └── ...                 # Other pages
├── components/             # React components
├── data/                   # JSON data store
│   ├── products.json       # Product catalog + reviews
│   ├── site-content.json   # CMS content (hero, headings, settings)
│   └── profiles.json       # Customer profiles for reviews/social proof
├── lib/                    # Utilities (types, cloudinary, currency, etc.)
├── store/                  # Zustand client-side stores
└── public/                 # Static assets
```

---

## Key URLs

| URL | Purpose |
|-----|---------|
| `https://zivaad.com` | Production site |
| `https://zivaad.com/shop` | Shop page |
| `https://zivaad.com/product/{id}` | Product pages |
| `https://zivaad.com/size-guide` | Size guide |
| `https://zivaad.com/sitemap.xml` | XML Sitemap |
| `https://zivaad.com/robots.txt` | Robots file |

---

## Support Channels

- **WhatsApp**: +92 308 4271446
- **Email**: zivaad.support@gmail.com
- **Instagram**: @zivaadofficial
- **Facebook**: /zivaadofficial
- **TikTok**: @zivaadofficial
