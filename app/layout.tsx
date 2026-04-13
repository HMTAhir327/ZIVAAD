import type { Metadata } from 'next';
import { Cormorant_Garamond, Montserrat } from 'next/font/google';

import { AddedToBoxToast } from '@/components/added-to-box-toast';
import { CartDrawer } from '@/components/cart-drawer';
import { Footer } from '@/components/footer';
import { FloatingWhatsAppButton } from '@/components/floating-whatsapp-button';
import { Navbar } from '@/components/navbar';
import { getSiteContent } from '@/lib/site-content';

import './globals.css';

const headingFont = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-heading',
  weight: ['400', '500', '600', '700']
});

const bodyFont = Montserrat({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600']
});

export const metadata: Metadata = {
  metadataBase: new URL('https://zivaad.com'),
  title: {
    default: 'ZIVAAD | Minimal Luxury Jewelry',
    template: '%s | ZIVAAD'
  },
  description: 'Sculpted essentials with clean lines and a timeless point of view.',
  icons: {
    icon: [{ url: 'https://res.cloudinary.com/dyb3292pp/image/upload/q_auto/f_auto/v1775200846/zivaad_sm_logo_o8hykt.jpg' }],
    shortcut: [
      { url: 'https://res.cloudinary.com/dyb3292pp/image/upload/q_auto/f_auto/v1775200846/zivaad_sm_logo_o8hykt.jpg' }
    ],
    apple: [
      { url: 'https://res.cloudinary.com/dyb3292pp/image/upload/q_auto/f_auto/v1775200846/zivaad_sm_logo_o8hykt.jpg' }
    ]
  },
  openGraph: {
    title: 'ZIVAAD | Minimal Luxury Jewelry',
    description: 'Luxury-inspired minimal jewelry experience.',
    type: 'website',
    locale: 'en_PK',
    url: 'https://zivaad.com/',
    siteName: 'ZIVAAD',
    images: [
      {
        url: 'https://res.cloudinary.com/dyb3292pp/image/upload/q_auto/f_auto/v1775200846/zivaad_sm_logo_o8hykt.jpg',
        alt: 'ZIVAAD | Minimal Luxury Jewelry'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ZIVAAD | Minimal Luxury Jewelry',
    description: 'Luxury-inspired minimal jewelry experience.',
    images: ['https://res.cloudinary.com/dyb3292pp/image/upload/q_auto/f_auto/v1775200846/zivaad_sm_logo_o8hykt.jpg']
  }
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const siteContent = await getSiteContent();
  const mainTopPaddingClass = siteContent.settings.sale_counter_enabled
    ? 'pt-[8rem] sm:pt-[8.75rem] lg:pt-[11.3rem]'
    : 'pt-[5.5rem] sm:pt-[6rem] lg:pt-[8.5rem]';

  return (
    <html lang="en" className={`${headingFont.variable} ${bodyFont.variable}`}>
      <body className="bg-white text-[#1a1a1a] antialiased">
        <div className="relative min-h-screen overflow-x-clip">
          <Navbar settings={siteContent.settings} />
          <CartDrawer />
          <AddedToBoxToast />
          <FloatingWhatsAppButton />
          <main className={mainTopPaddingClass}>{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
