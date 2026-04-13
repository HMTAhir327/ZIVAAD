import { getSiteContent } from '@/lib/site-content';

function WhatsAppIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-9 w-9 sm:h-10 sm:w-10" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.967-.94 1.164-.173.198-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.787-1.48-1.76-1.653-2.058-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.15-.173.198-.297.298-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.075-.792.372-.272.298-1.04 1.016-1.04 2.479 0 1.462 1.065 2.877 1.213 3.075.149.198 2.095 3.2 5.077 4.487.71.307 1.264.49 1.695.628.713.227 1.363.195 1.876.118.572-.085 1.758-.719 2.006-1.414.248-.694.248-1.29.173-1.413-.074-.124-.272-.198-.57-.347Z" />
      <path d="M12.005 2.003c-5.514 0-9.982 4.467-9.982 9.978 0 1.762.461 3.48 1.336 4.993L2 22l5.165-1.349a9.97 9.97 0 0 0 4.84 1.25h.005c5.511 0 9.979-4.468 9.979-9.979 0-2.671-1.041-5.182-2.931-7.07a9.94 9.94 0 0 0-7.053-2.849Zm0 18.19h-.004a8.3 8.3 0 0 1-4.228-1.157l-.304-.18-3.068.801.821-2.989-.2-.316a8.36 8.36 0 0 1-1.31-4.447c0-4.61 3.75-8.36 8.364-8.36a8.3 8.3 0 0 1 5.921 2.454 8.3 8.3 0 0 1 2.454 5.923c-.002 4.612-3.752 8.361-8.446 8.361Z" />
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
      className="fixed bottom-[calc(0.9rem+env(safe-area-inset-bottom))] right-4 z-[95] flex h-[4.2rem] w-[4.2rem] items-center justify-center rounded-full border-[3px] border-white bg-[#25D366] text-white shadow-[0_16px_32px_rgba(0,0,0,0.24)] ring-1 ring-black/10 transition-transform duration-300 hover:scale-105 sm:bottom-6 sm:right-6 sm:h-[4.4rem] sm:w-[4.4rem]"
    >
      <WhatsAppIcon />
    </a>
  );
}
