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
  const socialLinks = [
    { href: siteContent.footer.social_links.instagram, label: 'Instagram', Icon: InstagramIcon },
    { href: siteContent.footer.social_links.whatsapp, label: 'WhatsApp', Icon: WhatsAppIcon },
    { href: siteContent.footer.social_links.facebook, label: 'Facebook', Icon: FacebookIcon },
    { href: siteContent.footer.social_links.tiktok, label: 'TikTok', Icon: TikTokIcon }
  ];

  return (
    <footer className="border-t border-stone-200 bg-white">
      <div className="grid w-full gap-10 px-4 py-12 sm:px-8 md:grid-cols-2 md:gap-12 md:py-16 lg:grid-cols-4 lg:px-10">
        <div className="text-center md:text-left">
          <p className="font-serif text-2xl tracking-[0.22em]">ZIVAAD</p>
          <p className="mx-auto mt-4 max-w-xs text-sm text-stone-600 md:mx-0">
            Minimal luxury jewelry designed to elevate everyday looks with understated shine.
          </p>
        </div>

        <div className="border-t border-stone-200 pt-6 md:border-0 md:pt-0">
          <p className="text-xs uppercase tracking-luxury text-stone-500">The Collection</p>
          <div className="mt-4 space-y-2 text-sm text-stone-700">
            <Link href="/collection" className="block hover:text-stone-950">
              All Collections
            </Link>
            <Link href="/shop?category=rings" className="block hover:text-stone-950">
              Rings
            </Link>
            <Link href="/shop?category=earrings" className="block hover:text-stone-950">
              Earrings
            </Link>
            <Link href="/shop?category=necklaces" className="block hover:text-stone-950">
              Necklaces
            </Link>
          </div>
        </div>

        <div className="border-t border-stone-200 pt-6 md:border-0 md:pt-0">
          <p className="text-xs uppercase tracking-luxury text-stone-500">Client Care</p>
          <div className="mt-4 space-y-2 text-sm text-stone-700">
            <Link href="/contact" className="block hover:text-stone-950">
              Contact Us
            </Link>
            <Link href="/about" className="block hover:text-stone-950">
              About
            </Link>
            <div className="pt-1">
              <p className="mb-2 text-[10px] uppercase tracking-luxury text-stone-500">Follow</p>
              <div className="flex items-center gap-3 text-stone-700 max-md:justify-center">
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

        <div className="border-t border-stone-200 pt-6 md:border-0 md:pt-0">
          <p className="text-xs uppercase tracking-luxury text-stone-500">Legal</p>
          <div className="mt-4 space-y-2 text-sm text-stone-700">
            <Link href="/privacy-policy" className="block hover:text-stone-950">
              Privacy Policy
            </Link>
            <Link href="/terms" className="block hover:text-stone-950">
              Terms & Conditions
            </Link>
            <Link href="/shipping-policy" className="block hover:text-stone-950">
              Shipping Policy
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-stone-200 px-4 py-5 text-center text-[11px] uppercase tracking-luxury text-stone-500">
        © {new Date().getFullYear()} ZIVAAD. Crafted with intention.
      </div>
    </footer>
  );
}
