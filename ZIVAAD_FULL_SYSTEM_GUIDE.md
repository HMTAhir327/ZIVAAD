# ZIVAAD Full System Guide

Last updated: 2026-04-13  
Project: `ZIVAAD` (Next.js App Router luxury jewelry storefront)

This document is the single source of truth for:
- Product Designers
- Content Creators
- Product Architects
- Frontend Engineers
- Growth / CRO stakeholders

It explains the full website behavior, admin schema, conversion system, data flow, and implementation details.

---

## 1) Executive Summary

ZIVAAD is a headless-style, content-driven jewelry storefront built on Next.js App Router with local JSON data as source of truth.  
Checkout is WhatsApp-first (no payment gateway), with pre-checkout order backup to webhook (Make/Google Sheets).

Core principles implemented:
- Premium editorial aesthetics (minimal, high whitespace, restrained motion)
- Strong browsing clarity (category discovery + filters + collection rails)
- Conversion architecture without discount-store visual noise
- Admin editing for products, taxonomy, and site content
- Local-authoring workflow with production-safe admin lock

---

## 2) Information Architecture (Routes + Purpose)

| Route | Purpose | Primary Conversion Goal |
|---|---|---|
| `/` | Homepage (hero, trust strip, curated products, collections, story, testimonials) | Start shopping and trust-building |
| `/shop` | Catalog listing with filters + sort + mobile filter sidebar | Product discovery and add-to-cart |
| `/collection` | Category-first browsing view | Faster category entry |
| `/product/[slug]` | Product detail page (PDP) with variants/options and trust content | Add to bag / WhatsApp pre-sales |
| `/products/[id]` | Legacy redirect to `/product/[id]` | Preserve old links |
| `/cart` | Full-page cart with customer details and WhatsApp checkout | Checkout completion |
| `/contact` | Contact/support page + WhatsApp form | Support and inquiry conversion |
| `/about` | Brand story | Trust and brand depth |
| `/faq` | FAQ page | Objection handling |
| `/shipping-policy` | Shipping policy page | Delivery trust |
| `/privacy-policy` | Privacy policy | Compliance trust |
| `/terms` | Terms/returns/COD rules | Purchase confidence |
| `/admin` | Admin dashboard (dev-only UI) | Catalog and content operations |
| `/admin/product/new` | Dedicated new product editor | Structured product creation |
| `/admin/product/[id]` | Dedicated product editor page | Safe product updates |
| `/api/orders` | Order backup webhook endpoint | Order logging before WhatsApp redirect |
| `/api/admin/products` | Product write API fallback | Save reliability |
| `/api/admin/site-content` | Site settings write API fallback | Save reliability |

---

## 3) End-to-End System Flow

## 3.1 Customer flow (storefront)
1. User lands on homepage.
2. Trust and category cues reduce uncertainty early.
3. User clicks product card or quick-add.
4. Cart opens with free-shipping progress and required customer fields.
5. On checkout click:
   - Order payload is sent to `/api/orders` (webhook backup).
   - WhatsApp message is generated (including product links).
   - User is redirected to `wa.me`.

## 3.2 Admin flow (content operations)
1. Admin opens `/admin` in local dev.
2. Uses tabs:
   - Products
   - Site Settings
   - Taxonomy
3. Product editing occurs in dedicated page routes (`/admin/product/new` or `/admin/product/[id]`).
4. Save action sanitizes and writes JSON.
5. Paths are revalidated (`/`, `/shop`, `/collection`, PDP routes, admin routes).

---

## 4) Core Tech Architecture

## 4.1 Stack
- Framework: Next.js 14+ App Router
- Styling: Tailwind CSS
- Motion: Framer Motion
- State: Zustand
- Data store: `data/products.json`, `data/site-content.json`
- Media delivery: Cloudinary URLs + transformation normalization
- Deployment: Vercel

## 4.2 Rendering strategy
- Most pages are server components for initial performance and SEO.
- Client components are used for interactivity: cart, filters, cards, overlays, admin UI editors.
- Revalidation set on key pages (`revalidate = 60`) for near-static speed with update freshness.

## 4.3 Data source-of-truth files
- `data/products.json`
- `data/site-content.json`

Read + sanitize pipeline:
- `lib/products.ts`
- `lib/site-content.ts`
- `lib/admin.ts` (admin save sanitization)

---

## 5) Data Schema (Canonical)

## 5.1 Product schema (`Product`)
Defined in: `lib/types.ts`

```ts
interface Product {
  id: string;
  name: string;
  price: number;
  compare_price: number;
  category: string;
  primary_image_url?: string;
  secondary_image_url?: string;
  gallery_images: string[];
  images: string[];
  video_url: string;
  description: string; // rich HTML string
  badge: string; // taxonomy driven
  stock: number; // auto-summed from variants when variants exist
  supplier_urls?: string[];
  zivaad_choice?: boolean; // featured in "ZIVAAD Choice"
  sale_tag_enabled?: boolean; // controls PDP sale pill visibility
  option_swatches?: Record<string, Record<string, string>>; // e.g. Color -> White -> #f5f5f4
  product_options?: { name: string; values: string[] }[];
  product_variants?: {
    id: string;
    sku?: string;
    title?: string;
    option_values: Record<string, string>;
    price?: number;
    compare_price?: number;
    stock: number;
    image_url?: string;
  }[];
}
```

Implementation details:
- `category` normalized to lowercase.
- `badge` normalized to uppercase.
- `gallery_images`/`images` deduplicated and auto-filled from primary/secondary.
- `stock` auto-aggregates from variants when variants exist.
- Cloudinary URLs are normalized during save.

## 5.2 Site Content schema (`SiteContent`)
Defined in: `lib/types.ts`

Contains:
- `hero` (image, gradient toggle/value, text, CTAs)
- `media` (storytelling video, editorial media, collection category images, visual story images)
- `headings` (all key merchandising section headings)
- `footer` (support identity + social links)
- `taxonomy` (categories + badges managed in admin)
- `settings` (behavior flags like shuffle before filtering)

## 5.3 Cart schema (`CartItem` + `CheckoutCustomer`)
Defined in: `lib/types.ts` and stored in Zustand persist.

- `CartItem` tracks variant-aware line items and selected options.
- `CheckoutCustomer` captures:
  - name
  - city
  - address

Customer details persist across cart drawer and cart page.

---

## 6) Admin System (How It Works)

## 6.1 Access and security model
Admin mode logic: `lib/admin-mode.ts`

- UI access rule:
  - `/admin` only when `NODE_ENV === 'development'`
  - In production, route returns 404 (`notFound()`).
- Write rule:
  - `ADMIN_LOCAL_WRITE_MODE=true` enables writes.
  - On Vercel (`VERCEL=1`) writes are blocked by default unless explicitly overridden.

This ensures safe local content operations without public production admin editing.

## 6.2 Admin routes
- `/admin`: dashboard with tabs
- `/admin/product/new`: create product (blank scaffold)
- `/admin/product/[id]`: edit existing product

## 6.3 Admin tabs and responsibilities (`components/admin-editor.tsx`)

### A) Products tab
- Search by id/name/description/category/badge
- Filter by category and badge
- Product grid with edit/delete actions
- Add Product button routes to `/admin/product/new`
- Save Products triggers server action with API fallback

### B) Site Settings tab
- Hero config (image, copy, gradient toggle, CTA labels/links)
- Media config (video, editorial media, visual story images)
- Category image mapping (per category card image)
- Catalog behavior toggles (e.g. shuffle before filters)
- Headings manager
- Footer contact and social links
- URL, image, video, and gradient previews

### C) Taxonomy tab
- Category CRUD
- Badge CRUD
- Usage-aware safety (prevent deleting used taxonomy terms)
- Sync handling for taxonomy + products

## 6.4 Dedicated Product Editor (`components/admin-product-form-page.tsx`)

Sections:
- Basic info: id, name, pricing, stock
- Merchandising flags:
  - `sale_tag_enabled`
  - `zivaad_choice`
- Rich text description editor
- Media:
  - Gallery URLs textarea
  - Primary/Secondary image selectors via media dropdowns
  - Variant image selectors from same media pool
  - Supplier URLs textarea (sourcing ops support)
- Options (Color/Size/etc.)
- Color swatch editor with hex picker/input
- Variants table:
  - generate/refresh combinations
  - manual add
  - per-variant SKU/price/compare/stock/image

Key behavior:
- Gallery URLs auto-populate media dropdown options.
- If primary/secondary are empty, first two gallery URLs are auto-assigned.
- Stock becomes variant-driven when variants exist.

## 6.5 Save pipeline

Primary save:
- Server Action in `app/admin/actions.ts`
  - `saveProductsAction`
  - `saveSiteContentAction`

Fallback save:
- API routes:
  - `POST /api/admin/products`
  - `POST /api/admin/site-content`

On success:
- JSON write to `data/*.json`
- `revalidatePath(...)` for store/admin routes

---

## 7) Storefront Conversion System (CRO)

This section explains both definitions and implemented behavior.

## 7.1 What “hooks” means here

### A) Messaging hooks (merchandising hooks)
Short high-signal statements that make users continue:
- Hero promise: “Minimal Luxury Jewelry”
- PDP quality line and reassurance copy
- Trust strip statements (COD, delivery, finish, support)

### B) UI hooks (interaction hooks)
Micro-interactions that increase engagement:
- Product image hover swap (desktop)
- Mobile card image swipe carousel
- Quick add button with “Added to Box” feedback toast
- Mobile fullscreen image viewer on PDP

### C) Engineering hooks (React hooks)
Used extensively for behavior orchestration:
- `useState`, `useEffect`, `useMemo`, `useRef`, `useTransition`
- Framer motion transitions for overlays and panel choreography

## 7.2 CTA hierarchy (implemented)

### Primary CTAs
- Hero primary CTA (“Shop Now”)
- Product detail primary CTA (“Add X to Bag”)
- Cart checkout CTA (“Checkout via WhatsApp”)

### Secondary CTAs
- Hero secondary CTA (collection exploration)
- “View All” / “View Catalog” in merchandising sections
- PDP “Ask on WhatsApp Before Ordering”

### Tertiary CTAs
- Quick links and category chips
- Footer navigation links

Design rule used:
- One dominant CTA per section.
- Supporting CTAs visually lighter.
- No discount-heavy visual noise.

## 7.3 Trust placement strategy

Trust is intentionally repeated at key decision moments:
- Header utility/trust row (desktop)
- Hero trust microline
- Home trust strip immediately below hero
- PDP trust badges:
  - COD Available
  - Dispatch in 24 Hours
  - Premium Finish
- Cart progress and backup reassurance
- Footer confidence strip + policy links + support channels

## 7.4 PDP persuasion strategy

PDP persuasion is “premium confidence”, not hard-sell:
- Clear title + pricing hierarchy
- Optional sale badge only when enabled in admin
- Short quality proposition copy
- Variant clarity:
  - color swatches
  - size pills
  - unavailable option disabling
- Low-stock urgency only when true (`stock < 5`)
- FAQ-like collapsible sections:
  - Shipping & Delivery
  - Returns & Support
  - Care Guide
- Related pieces carousel with contextual copy

## 7.5 Mobile conversion flow

Implemented for thumb-first shopping:
- Mobile navbar + menu sidebar + quick category rail
- Mobile product cards:
  - swipe gallery
  - tap image/title to open PDP
- Mobile shop filter sidebar
- Mobile PDP:
  - swipe main media
  - fullscreen image modal
  - sticky add-to-bag CTA
- Cart and checkout forms optimized for mobile input

## 7.6 Footer confidence signals

Footer is structured for confidence and reduced drop-off:
- Confidence strip (COD, delivery, finish, support)
- Client care links (FAQ, shipping, returns, contact)
- Policy links (privacy, terms, shipping)
- Full support identity:
  - WhatsApp
  - email
  - social profiles

---

## 8) Product Card System (Preserved Direction)

Product cards intentionally maintain current premium style.

Behavior:
- Desktop:
  - primary image cross-fades to secondary on hover
  - quick-add corner button appears on hover
- Mobile:
  - swipe between gallery images inside card
  - image tap opens PDP

Signals:
- Badge display (`NEW IN`, `BEST SELLER`, etc.)
- Price + compare price
- Category micro label
- Low stock microcopy when relevant

Core file: `components/product-card.tsx`

---

## 9) Checkout + WhatsApp Bridge + Order Backup

## 9.1 Checkout logic
Files:
- `components/cart-drawer.tsx`
- `components/cart-page-view.tsx`
- `lib/whatsapp.ts`

Behavior:
1. Build structured message from cart lines + customer details.
2. Include product deep links (`/product/{id}`) per line.
3. Redirect to WhatsApp URL.

## 9.2 Order backup webhook
File: `app/api/orders/route.ts`

Before redirect, order is posted to webhook payload with:
- timestamp
- normalized line items
- total + currency
- customer object
- source (`cart-drawer` or `cart-page`)
- user IP and user agent

If webhook fails:
- Checkout still proceeds to WhatsApp (no conversion dead-end).

---

## 10) State Management and Hooks Map

## 10.1 Zustand stores

### `useCartStore` (`store/cart-store.ts`)
- `items`, `customer`, `isCartOpen`
- actions:
  - `addItem`, `removeItem`, `updateQuantity`, `clearCart`
  - `openCart`, `closeCart`
  - `updateCustomer`
  - selectors (`getSubtotal`, `getItemCount`)
- persisted in `localStorage` key: `zivaad-cart`

### `useCurrencyStore` (`store/currency-store.ts`)
- currency toggle (`PKR`/`USD`)
- persisted in `localStorage` key: `zivaad-currency`

### `useUiStore` (`store/ui-store.ts`)
- transient toast messaging (`Added to Box`)

## 10.2 Key React hook patterns
- `useMemo` for pricing/variants/filter computation
- `useEffect` for overlay scroll lock and data sync
- `useTransition` for admin save operations
- `useRef` for carousel/filter panel click-outside logic

---

## 11) SEO System

## 11.1 Global metadata
File: `app/layout.tsx`

Includes:
- title template
- description
- Open Graph
- Twitter cards
- Cloudinary favicon and social image

## 11.2 Product metadata
File: `app/product/[slug]/page.tsx`

Per-product dynamic metadata:
- title
- description (rich text stripped to plain text)
- OG/Twitter image from product media

## 11.3 Structured data
PDP injects JSON-LD `Product` schema:
- name
- description
- image array
- brand
- offer(s) (variant-aware stock/pricing)

## 11.4 Indexing files
- `app/sitemap.ts`
- `app/robots.ts`

Note:
- `sitemap.ts`/`robots.ts` currently use `https://zivaad.vercel.app`.
- `layout.tsx` metadata uses `https://zivaad.com`.
- Recommended: align all canonical base URLs in one place.

---

## 12) Performance System

Implemented controls:
- `next/image` for image delivery
- Cloudinary URL transformations (`lib/cloudinary.ts`)
  - product cards: e.g. auto format/quality + width control
  - hero/banners optimized for larger viewport widths
  - videos capped and optimized
- Lazy behavior through viewport rendering and selective priority usage
- Motion kept subtle (no heavy continuous animation except review marquee)

Admin-side automatic optimization on save:
- product images and variants normalized through sanitizer
- site hero/banner/video normalized through site-content sanitizer

---

## 13) Content Operations Guide (for Content Creator)

Use `/admin`:

1. Go to **Taxonomy** first:
   - create required categories and badges.
2. Go to **Products**:
   - Add product, then open dedicated editor.
3. In editor:
   - Add gallery URLs first.
   - Select primary/secondary from media dropdown previews.
   - Add rich description content with clean headings/lists.
   - Add options and generate variants.
   - Set swatch colors and variant images.
4. Go to **Site Settings**:
   - update hero text, trust-facing headings, collection images, and footer links.
5. Save and verify storefront pages.

Best practice:
- Keep product copy benefit-led and concise.
- Use consistent category naming.
- Keep image style coherent (neutral background, similar tone).

---

## 14) UX Design Guide (for Product Designer)

Design language currently implemented:
- Typography:
  - Serif (`Cormorant Garamond`) for statements/headings
  - Sans (`Montserrat`) for utility/body labels
- Palette: white/stone/charcoal with restrained accents
- Motion: smooth and subtle (`ease-luxury`), no aggressive effects
- Spacing: section breathing room with editorial rhythm

CRO style principle:
- Improve conversion through structure clarity, not loud visuals.

Non-goals:
- No discount-banner aesthetics
- No cluttered badge storms
- No aggressive popups

---

## 15) Product Architecture Guide (for Product Architect)

## 15.1 Domain model
- Product
- Variant
- Option
- Swatch mapping
- Taxonomy
- Site content
- Cart line (variant-aware)
- Checkout customer
- Order backup payload

## 15.2 Key dependencies
- Product normalization depends on variant utilities (`lib/product-variants.ts`).
- Admin save pipeline depends on sanitization and local write mode.
- Merchandising order on homepage depends on:
  - `zivaad_choice`
  - `settings.shuffle_shop_before_filter`

## 15.3 Scalability path
Current local JSON can be replaced by DB repository layer:
- keep existing TS interfaces as contract
- replace file read/write with DB adapters
- retain sanitizer layer for ingestion safety

---

## 16) Environment Variables

From `.env.example`:

```env
NEXT_PUBLIC_WHATSAPP_NUMBER=923084271446
NEXT_PUBLIC_USD_RATE=278
ORDER_WEBHOOK_URL=https://hook.us1.make.com/your-webhook-or-sheetdb-endpoint
ADMIN_LOCAL_WRITE_MODE=true
```

Recommended additional variable:
- `NEXT_PUBLIC_SITE_URL=https://zivaad.com` (used by WhatsApp message product links)

---

## 17) Quality Checklist (Pre-Deploy)

- Admin writes work in local dev and are blocked in production.
- New product shows in:
  - homepage sections (according to flags)
  - shop filters
  - category page
  - PDP route
- Variant selection updates price/image/stock correctly.
- Cart customer fields persist between drawer and full cart.
- WhatsApp checkout message includes:
  - item lines
  - selected options/SKU where available
  - product links
  - customer details
- `/api/orders` sends payload to webhook.
- Footer/contact links and support details are correct.
- Mobile:
  - menu overlay layering is correct
  - filter sidebar opens/closes smoothly
  - PDP fullscreen image works
  - sticky CTA is usable

---

## 18) Glossary (Business + CRO Terms)

- **Hook**: A message or interaction that captures attention and keeps user momentum.
- **CTA hierarchy**: Priority ordering of actions (primary > secondary > tertiary) through visual weight.
- **PDP persuasion**: Trust and clarity mechanisms on product detail pages to increase add-to-cart intent.
- **Trust placement**: Deliberate positioning of confidence signals where objections appear.
- **Mobile conversion flow**: Friction-minimized sequence from discovery to checkout on mobile.
- **Footer confidence signals**: Support/policy/navigation elements in footer that reduce purchase anxiety.
- **CRO**: Conversion Rate Optimization through UX structure, messaging clarity, and friction removal.

---

## 19) Primary Files Map

- Layout + global metadata: `app/layout.tsx`
- Homepage orchestration: `app/page.tsx`
- Shop listing + filters: `app/shop/page.tsx`, `components/product-grid.tsx`
- PDP: `app/product/[slug]/page.tsx`, `components/product-detail-view.tsx`
- Product card: `components/product-card.tsx`
- Cart drawer/page: `components/cart-drawer.tsx`, `components/cart-page-view.tsx`
- WhatsApp builder: `lib/whatsapp.ts`
- Admin dashboard: `app/admin/page.tsx`, `components/admin-editor.tsx`
- Product editor pages: `app/admin/product/new/page.tsx`, `app/admin/product/[id]/page.tsx`, `components/admin-product-form-page.tsx`
- Admin save actions: `app/admin/actions.ts`
- Admin APIs: `app/api/admin/products/route.ts`, `app/api/admin/site-content/route.ts`
- Order backup API: `app/api/orders/route.ts`
- Product normalization: `lib/products.ts`, `lib/admin.ts`
- Site content normalization: `lib/site-content.ts`
- State stores: `store/cart-store.ts`, `store/currency-store.ts`, `store/ui-store.ts`
- Footer + trust: `components/footer.tsx`, `components/home-trust-strip.tsx`
- Navigation: `components/navbar.tsx`

---

## 20) Notes for New Team Members

If you are onboarding:
1. Read this file fully.
2. Run local project and test one full shopping flow.
3. Use `/admin` to add one product with variants.
4. Validate webhook backup in Make/Sheets.
5. Confirm mobile UX on real device dimensions.

This will give you complete functional understanding in under one working session.

