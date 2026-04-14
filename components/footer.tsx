import Link from 'next/link';

import { getSiteContent } from '@/lib/site-content';

function InstagramIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="3.8" y="3.8" width="16.4" height="16.4" rx="4.2" />
      <circle cx="12" cy="12" r="4.1" />
      <circle cx="17.5" cy="6.6" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M20 12a8 8 0 0 1-11.8 7L4 20l.8-3.7A8 8 0 1 1 20 12Z" />
      <path d="M9.1 9.7c.2-.4.3-.5.6-.5h.5c.2 0 .3.1.4.3l.7 1.7c.1.2.1.4-.1.6l-.5.6c-.1.1-.1.2 0 .4.3.6.9 1.3 1.9 1.9.2.1.3.1.4 0l.6-.5c.2-.2.4-.2.6-.1l1.7.7c.2.1.3.2.3.4v.5c0 .2-.1.4-.5.6-.4.2-1.4.3-2.5-.3-1.2-.6-2.6-1.8-3.4-3.1-.9-1.3-1.2-2.5-.8-3.4Z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M13.8 20v-6.2h2.3l.4-2.6h-2.7V9.5c0-.8.3-1.3 1.4-1.3h1.4V5.9c-.2 0-1-.1-2-.1-2 0-3.3 1.2-3.3 3.4v2h-2.2v2.6h2.2V20h2.5Z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M14.4 5.2c.5 1.4 1.6 2.5 3 3v2.4a6 6 0 0 1-3-.8v4.9a4.8 4.8 0 1 1-4.8-4.8h.4v2.5h-.4a2.3 2.3 0 1 0 2.3 2.3V4h2.5v1.2Z" />
    </svg>
  );
}

export async function Footer() {
  const siteContent = await getSiteContent();
  const shopLinks = [
    { href: '/shop?category=rings', label: 'Rings' },
    { href: '/shop?category=earrings', label: 'Earrings' },
    { href: '/shop?category=necklaces', label: 'Necklaces' },
    { href: '/shop?category=jewellery%20set', label: 'Sets' },
    { href: '/shop?category=bracelets', label: 'Bracelets' },
    { href: '/collection', label: 'All Collections' }
  ];
  const careLinks = [
    { href: '/size-guide', label: 'Size Guide' },
    { href: '/contact', label: 'Contact Us' },
    { href: '/faq', label: 'FAQs' },
    { href: '/shipping-policy', label: 'Shipping' },
    { href: '/terms', label: 'Returns & Exchanges' },
    { href: '/about', label: 'About ZIVAAD' }
  ];
  const policyLinks = [
    { href: '/privacy-policy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms & Conditions' },
    { href: '/shipping-policy', label: 'Shipping Policy' }
  ];
  const socialLinks = [
    { href: siteContent.footer.social_links.instagram, label: 'Instagram', Icon: InstagramIcon },
    { href: siteContent.footer.social_links.whatsapp, label: 'WhatsApp', Icon: WhatsAppIcon },
    { href: siteContent.footer.social_links.facebook, label: 'Facebook', Icon: FacebookIcon },
    { href: siteContent.footer.social_links.tiktok, label: 'TikTok', Icon: TikTokIcon }
  ];

  return (
    <footer className="border-t border-stone-200 bg-white">
      {/* ── Trust Features Strip ── */}
      <div className="border-b border-stone-200 bg-stone-950">
        <div className="mx-auto w-full max-w-[1320px] px-4 py-5 sm:px-8 sm:py-6 lg:px-10">
          <div className="grid grid-cols-2 gap-y-5 gap-x-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-5">
            <div className="text-center">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="mx-auto h-6 w-6 text-[#b89a61]" fill="none" stroke="currentColor" strokeWidth="1.4">
                <path d="M3 7h11v10H3z" />
                <path d="M14 12h4l3 3v2h-7v-5Z" />
                <circle cx="7.5" cy="17.5" r="1.5" />
                <circle cx="18" cy="17.5" r="1.5" />
              </svg>
              <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.12em] text-white sm:text-xs">Free Delivery</p>
              <p className="mt-0.5 text-[10px] leading-snug text-white/50">Orders above Rs. 2,999</p>
            </div>
            <div className="text-center">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="mx-auto h-6 w-6 text-[#b89a61]" fill="none" stroke="currentColor" strokeWidth="1.4">
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <path d="M2 10h20" />
                <path d="M6 14h4" />
              </svg>
              <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.12em] text-white sm:text-xs">Cash on Delivery</p>
              <p className="mt-0.5 text-[10px] leading-snug text-white/50">All over Pakistan</p>
            </div>
            <div className="text-center">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="mx-auto h-6 w-6 text-[#b89a61]" fill="none" stroke="currentColor" strokeWidth="1.4">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
              <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.12em] text-white sm:text-xs">3–5 Day Delivery</p>
              <p className="mt-0.5 text-[10px] leading-snug text-white/50">Across major cities</p>
            </div>
            <div className="text-center">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="mx-auto h-6 w-6 text-[#b89a61]" fill="none" stroke="currentColor" strokeWidth="1.4">
                <path d="M17 1l4 4-4 4" />
                <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                <path d="M7 23l-4-4 4-4" />
                <path d="M21 13v2a4 4 0 0 1-4 4H3" />
              </svg>
              <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.12em] text-white sm:text-xs">7-Day Exchange</p>
              <p className="mt-0.5 text-[10px] leading-snug text-white/50">Easy exchange policy</p>
            </div>
            <div className="col-span-2 text-center sm:col-span-1">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="mx-auto h-6 w-6 text-[#b89a61]" fill="none" stroke="currentColor" strokeWidth="1.4">
                <path d="M20 12a8 8 0 0 1-11.8 7L4 20l.8-3.7A8 8 0 1 1 20 12Z" />
                <path d="M9.1 9.7c.2-.4.3-.5.6-.5h.5c.2 0 .3.1.4.3l.7 1.7c.1.2.1.4-.1.6l-.5.6c-.1.1-.1.2 0 .4.3.6.9 1.3 1.9 1.9.2.1.3.1.4 0l.6-.5c.2-.2.4-.2.6-.1l1.7.7c.2.1.3.2.3.4v.5c0 .2-.1.4-.5.6-.4.2-1.4.3-2.5-.3-1.2-.6-2.6-1.8-3.4-3.1-.9-1.3-1.2-2.5-.8-3.4Z" />
              </svg>
              <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.12em] text-white sm:text-xs">24/7 Support</p>
              <p className="mt-0.5 text-[10px] leading-snug text-white/50">WhatsApp &amp; Email</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Footer — Desktop ── */}
      <div className="mx-auto w-full max-w-[1320px] px-4 py-10 sm:px-8 sm:py-14 lg:px-10 lg:py-16">
        <div className="hidden gap-10 md:grid md:grid-cols-[1.5fr_0.8fr_0.8fr_0.8fr_1fr] lg:gap-12">
          {/* Brand Column */}
          <div>
            <p className="font-serif text-[2rem] tracking-[0.22em] text-stone-950">ZIVAAD</p>
            <p className="mt-4 max-w-[26ch] text-sm leading-relaxed text-stone-600">
              Minimal luxury to elevate everyday looks with understated shine.
            </p>
            <div className="mt-6 flex items-center gap-2.5">
              {socialLinks.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 text-stone-600 transition-all hover:border-[#b89a61] hover:text-[#b89a61]"
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {/* Shop Column */}
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-stone-900">Shop</p>
            <div className="mt-4 space-y-2.5 text-[13px] text-stone-600">
              {shopLinks.map((item) => (
                <Link key={item.href} href={item.href} className="block transition-colors hover:text-stone-950">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Client Care Column */}
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-stone-900">Help</p>
            <div className="mt-4 space-y-2.5 text-[13px] text-stone-600">
              {careLinks.map((item) => (
                <Link key={item.href} href={item.href} className="block transition-colors hover:text-stone-950">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Policies Column */}
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-stone-900">Legal</p>
            <div className="mt-4 space-y-2.5 text-[13px] text-stone-600">
              {policyLinks.map((item) => (
                <Link key={item.href} href={item.href} className="block transition-colors hover:text-stone-950">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact Column */}
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-stone-900">Get in Touch</p>
            <div className="mt-4 space-y-3 text-[13px] text-stone-600">
              <div className="flex items-start gap-2.5">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-[#b89a61]" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20 12a8 8 0 0 1-11.8 7L4 20l.8-3.7A8 8 0 1 1 20 12Z" />
                </svg>
                <span>{siteContent.footer.whatsapp_display}</span>
              </div>
              <div className="flex items-start gap-2.5">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-[#b89a61]" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M3 7l9 5 9-5" />
                </svg>
                <span>{siteContent.footer.email}</span>
              </div>
              <div className="flex items-start gap-2.5">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-[#b89a61]" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
                <span>Mon–Sat, 11 AM – 7 PM</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Main Footer — Mobile ── */}
        <div className="border border-stone-200 bg-[#fcfcfb] p-5 md:hidden">
          <p className="font-serif text-[1.9rem] tracking-[0.2em] text-stone-950 sm:text-2xl">ZIVAAD</p>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-stone-600">
            Minimal luxury to elevate everyday looks with understated shine.
          </p>
          <div className="mt-5 space-y-2 text-sm text-stone-700">
            <p>
              <span className="font-medium text-stone-900">WhatsApp:</span> {siteContent.footer.whatsapp_display}
            </p>
            <p>
              <span className="font-medium text-stone-900">Email:</span> {siteContent.footer.email}
            </p>
            <p>
              <span className="font-medium text-stone-900">Hours:</span> Mon-Sat, 11:00 AM - 7:00 PM
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-2 md:hidden">
          <details className="border border-stone-200">
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-stone-700">
              Shop
              <span className="text-stone-400">+</span>
            </summary>
            <div className="space-y-2 border-t border-stone-200 px-4 py-3 text-sm text-stone-700">
              {shopLinks.map((item) => (
                <Link key={item.href} href={item.href} className="block">
                  {item.label}
                </Link>
              ))}
            </div>
          </details>

          <details className="border border-stone-200">
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-stone-700">
              Client Care
              <span className="text-stone-400">+</span>
            </summary>
            <div className="space-y-2 border-t border-stone-200 px-4 py-3 text-sm text-stone-700">
              {careLinks.map((item) => (
                <Link key={item.href} href={item.href} className="block">
                  {item.label}
                </Link>
              ))}
            </div>
          </details>

          <details className="border border-stone-200">
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-stone-700">
              Policies
              <span className="text-stone-400">+</span>
            </summary>
            <div className="space-y-2 border-t border-stone-200 px-4 py-3 text-sm text-stone-700">
              {policyLinks.map((item) => (
                <Link key={item.href} href={item.href} className="block">
                  {item.label}
                </Link>
              ))}
            </div>
          </details>
        </div>

        <div className="mt-5 flex items-center justify-center gap-3 border border-stone-200 py-3 md:hidden">
          {socialLinks.map(({ href, label, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 text-stone-700 transition-colors hover:border-stone-950 hover:text-stone-950"
            >
              <Icon />
            </a>
          ))}
        </div>
      </div>

      {/* ── Payment Methods + Copyright ── */}
      <div className="border-t border-stone-200 bg-[#fafafa]">
        <div className="mx-auto flex w-full max-w-[1320px] flex-col items-center gap-3 px-4 py-5 sm:flex-row sm:justify-between sm:px-8 lg:px-10">
          <p className="text-[10px] uppercase tracking-[0.14em] text-stone-400">
            © {new Date().getFullYear()} ZIVAAD. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="rounded border border-stone-200 bg-white px-2.5 py-1 text-[9px] font-medium uppercase tracking-wider text-stone-500">COD</span>
            <span className="rounded border border-stone-200 bg-white px-2.5 py-1 text-[9px] font-medium uppercase tracking-wider text-stone-500">Bank Transfer</span>
            <span className="rounded border border-stone-200 bg-white px-2.5 py-1 text-[9px] font-medium uppercase tracking-wider text-stone-500">JazzCash</span>
            <span className="rounded border border-stone-200 bg-white px-2.5 py-1 text-[9px] font-medium uppercase tracking-wider text-stone-500">EasyPaisa</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
