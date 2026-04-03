import type { Metadata } from 'next';

import { ContactForm } from '@/components/contact-form';
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

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contact ZIVAAD for orders, support, and collaboration.'
};

export default async function ContactPage() {
  const siteContent = await getSiteContent();
  const socialLinks = [
    { href: siteContent.footer.social_links.instagram, label: 'Instagram', Icon: InstagramIcon },
    { href: siteContent.footer.social_links.whatsapp, label: 'WhatsApp', Icon: WhatsAppIcon },
    { href: siteContent.footer.social_links.facebook, label: 'Facebook', Icon: FacebookIcon },
    { href: siteContent.footer.social_links.tiktok, label: 'TikTok', Icon: TikTokIcon }
  ];

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-20">
      <p className="text-xs uppercase tracking-luxury text-stone-500">Contact</p>
      <h1 className="mt-3 font-serif text-4xl text-stone-950 sm:text-6xl">Get In Touch</h1>

      <div className="mt-7 grid gap-8 md:mt-8 md:grid-cols-2">
        <div className="space-y-3 text-sm text-stone-700">
          <p>
            <span className="font-medium">WhatsApp:</span>{' '}
            <a
              href={siteContent.footer.social_links.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-stone-950"
            >
              {siteContent.footer.whatsapp_display}
            </a>
          </p>
          <p>
            <span className="font-medium">Email:</span> {siteContent.footer.email}
          </p>
          <p>
            <span className="font-medium">Hours:</span> Mon-Sat, 11:00 AM - 7:00 PM
          </p>
          <div className="pt-3">
            <p className="mb-2 text-[10px] uppercase tracking-luxury text-stone-500">Follow ZIVAAD</p>
            <div className="flex items-center gap-3">
              {socialLinks.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 text-stone-700 transition-colors hover:border-stone-950 hover:text-stone-950"
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>
        </div>

        <ContactForm />
      </div>
    </section>
  );
}
