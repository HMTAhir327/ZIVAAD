import { getSiteContent } from '@/lib/site-content';

function WhatsAppIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20.2 12a8.2 8.2 0 0 1-12.1 7.2L4 20l.9-3.8A8.2 8.2 0 1 1 20.2 12Z" />
      <path d="M8.8 9.2c.2-.5.4-.6.7-.6h.6c.2 0 .4.1.5.4l.8 1.9c.1.3.1.5-.1.7l-.6.7c-.1.1-.1.3 0 .5.3.6 1 1.5 2.1 2.1.2.1.4.1.5 0l.7-.6c.2-.2.5-.2.7-.1l1.9.8c.3.1.4.3.4.5v.6c0 .3-.1.5-.6.7-.5.2-1.5.3-2.8-.3-1.3-.6-2.8-1.9-3.8-3.4-1-1.5-1.3-2.9-.9-3.9Z" />
    </svg>
  );
}

export async function FloatingWhatsAppButton() {
  const siteContent = await getSiteContent();

  return (
    <a
      href={siteContent.footer.social_links.whatsapp}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-20 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-stone-200 bg-white text-[#1a1a1a] shadow-[0_10px_26px_rgba(17,17,17,0.16)] transition-transform duration-300 hover:scale-105 sm:bottom-6 sm:right-6 sm:h-14 sm:w-14"
    >
      <WhatsAppIcon />
    </a>
  );
}
