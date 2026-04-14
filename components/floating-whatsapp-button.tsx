import { getSiteContent } from '@/lib/site-content';

export async function FloatingWhatsAppButton() {
  const siteContent = await getSiteContent();

  return (
    <a
      href={siteContent.footer.social_links.whatsapp}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] right-3 z-[95] block transition-all duration-300 hover:scale-110 sm:bottom-5 sm:right-5"
    >
      <svg aria-hidden="true" viewBox="0 0 40 40" className="h-12 w-12 drop-shadow-md sm:h-14 sm:w-14">
        <path d="M20 2C10.1 2 2 10.1 2 20c0 3.2.8 6.2 2.4 8.9L2 38l9.3-2.4C13.9 37.2 16.9 38 20 38c9.9 0 18-8.1 18-18S29.9 2 20 2Z" fill="#25D366" stroke="white" strokeWidth="2.5" />
        <path d="M28.2 24.1c-.4-.2-2.3-1.1-2.7-1.3-.3-.1-.6-.2-.8.2-.3.4-1 1.3-1.2 1.5-.2.2-.4.3-.8.1-.4-.2-1.6-.6-3.1-1.9-1.1-1-1.9-2.3-2.1-2.7-.2-.4 0-.6.2-.8.2-.2.4-.4.6-.7.2-.2.2-.4.4-.6.1-.3.1-.5 0-.7-.1-.2-.8-2.1-1.2-2.8-.3-.8-.6-.7-.8-.7h-.7c-.3 0-.7.1-1 .4-.4.4-1.4 1.3-1.4 3.2s1.4 3.7 1.6 4c.2.2 2.7 4.2 6.6 5.8.9.4 1.6.6 2.2.8.9.3 1.7.3 2.4.2.7-.1 2.3-.9 2.6-1.8.3-.9.3-1.7.2-1.8-.1-.2-.4-.3-.8-.5Z" fill="white" />
      </svg>
    </a>
  );
}
