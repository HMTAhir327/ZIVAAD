import Link from 'next/link';

import { getSiteContent } from '@/lib/site-content';

function InstagramIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="3.8" y="3.8" width="16.4" height="16.4" rx="4.2" />
      <circle cx="12" cy="12" r="4.1" />
      <circle cx="17.5" cy="6.6" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M20 12a8 8 0 0 1-11.8 7L4 20l.8-3.7A8 8 0 1 1 20 12Z" />
      <path d="M9.1 9.7c.2-.4.3-.5.6-.5h.5c.2 0 .3.1.4.3l.7 1.7c.1.2.1.4-.1.6l-.5.6c-.1.1-.1.2 0 .4.3.6.9 1.3 1.9 1.9.2.1.3.1.4 0l.6-.5c.2-.2.4-.2.6-.1l1.7.7c.2.1.3.2.3.4v.5c0 .2-.1.4-.5.6-.4.2-1.4.3-2.5-.3-1.2-.6-2.6-1.8-3.4-3.1-.9-1.3-1.2-2.5-.8-3.4Z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M13.8 20v-6.2h2.3l.4-2.6h-2.7V9.5c0-.8.3-1.3 1.4-1.3h1.4V5.9c-.2 0-1-.1-2-.1-2 0-3.3 1.2-3.3 3.4v2h-2.2v2.6h2.2V20h2.5Z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
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
      <div className="border-b border-stone-200 bg-[#fbfbfa]">
        <div className="mx-auto w-full max-w-[1320px] px-4 py-3 sm:px-8 lg:px-10">
          <div className="flex snap-x gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-2 sm:gap-3 sm:overflow-visible sm:pb-0 lg:grid-cols-4">
            <p className="min-w-[190px] snap-start border border-stone-200 bg-white px-3 py-2 text-[10px] uppercase tracking-luxury text-stone-600 sm:min-w-0">
              Cash on Delivery Across Pakistan
            </p>
            <p className="min-w-[190px] snap-start border border-stone-200 bg-white px-3 py-2 text-[10px] uppercase tracking-luxury text-stone-600 sm:min-w-0">
              3-5 Day Delivery Window
            </p>
            <p className="min-w-[190px] snap-start border border-stone-200 bg-white px-3 py-2 text-[10px] uppercase tracking-luxury text-stone-600 sm:min-w-0">
              Premium Anti-Tarnish Finish
            </p>
            <p className="min-w-[190px] snap-start border border-stone-200 bg-white px-3 py-2 text-[10px] uppercase tracking-luxury text-stone-600 sm:min-w-0">
              Support via WhatsApp & Email
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1320px] px-4 py-10 sm:px-8 sm:py-14 lg:px-10 lg:py-16">
        <div className="hidden gap-10 md:grid md:grid-cols-[1.4fr_0.9fr_0.9fr_0.9fr] lg:gap-14">
          <div>
            <p className="font-serif text-[2rem] tracking-[0.22em] text-stone-950">ZIVAAD</p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-stone-600">
              Minimal luxury to elevate everyday looks with understated shine.
            </p>
            <div className="mt-6 space-y-2 text-sm text-stone-700">
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

          <div>
            <p className="text-xs uppercase tracking-luxury text-stone-500">Shop</p>
            <div className="mt-4 space-y-2 text-sm text-stone-700">
              {shopLinks.map((item) => (
                <Link key={item.href} href={item.href} className="block hover:text-stone-950">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-luxury text-stone-500">Client Care</p>
            <div className="mt-4 space-y-2 text-sm text-stone-700">
              {careLinks.map((item) => (
                <Link key={item.href} href={item.href} className="block hover:text-stone-950">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-luxury text-stone-500">Policies</p>
            <div className="mt-4 space-y-2 text-sm text-stone-700">
              {policyLinks.map((item) => (
                <Link key={item.href} href={item.href} className="block hover:text-stone-950">
                  {item.label}
                </Link>
              ))}
              <div className="pt-3">
                <p className="mb-2 text-[10px] uppercase tracking-luxury text-stone-500">Follow</p>
                <div className="flex items-center gap-3 text-stone-700">
                  {socialLinks.map(({ href, label, Icon }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 transition-colors hover:border-stone-950 hover:text-stone-950"
                    >
                      <Icon />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

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
      <div className="border-t border-stone-200 px-4 py-5 text-center text-[11px] uppercase tracking-luxury text-stone-500">
        © {new Date().getFullYear()} ZIVAAD. Crafted with intention.
      </div>
    </footer>
  );
}
