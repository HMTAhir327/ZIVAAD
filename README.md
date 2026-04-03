# ZIVAAD

Prestige-style luxury jewelry eCommerce built with Next.js App Router, Tailwind CSS, Framer Motion, and Zustand.

## Stack

- Next.js 14+ (App Router)
- Tailwind CSS + Framer Motion
- Zustand (cart + currency state with persistence)
- Cloudinary media URLs with automatic optimization transforms
- Local `data/products.json` product source
- Orders backup webhook for SheetDB / Pipedream before WhatsApp redirect

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

Copy `.env.example` to `.env.local`:

```bash
NEXT_PUBLIC_WHATSAPP_NUMBER=923001234567
NEXT_PUBLIC_USD_RATE=278
ORDER_WEBHOOK_URL=https://your-sheetdb-or-pipedream-webhook
```

## Core Routes

- `/` Luxury homepage (hero video, featured, reels strip, brand story, gallery)
- `/shop` Product listing with category filters
- `/products/[id]` Product detail with schema + social proof + sticky mobile add-to-cart
- `/admin` Local-only product manager (hidden outside development)
- `/api/orders` Order backup endpoint (timestamp, items, total, customer, IP)
- `/api/admin/products` Local-only products JSON read/write API

## Checkout Flow

1. Customer fills checkout details in cart drawer.
2. App posts order payload to `ORDER_WEBHOOK_URL` (SheetDB/Pipedream).
3. App builds encoded WhatsApp message and redirects to `https://wa.me/<number>?text=...`.

## Validation

```bash
npm run typecheck
npm run lint
npm run build
```
