import type { Metadata } from 'next';
import { Cormorant_Garamond, Montserrat } from 'next/font/google';

import { AddedToBoxToast } from '@/components/added-to-box-toast';
import { CartDrawer } from '@/components/cart-drawer';
import { Footer } from '@/components/footer';
import { FloatingWhatsAppButton } from '@/components/floating-whatsapp-button';
import { Navbar } from '@/components/navbar';

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
  metadataBase: new URL('https://zivaad.vercel.app'),
  title: {
    default: 'ZIVAAD | Minimal Luxury Jewelry',
    template: '%s | ZIVAAD'
  },
  description:
    'Luxury-inspired minimal jewelry ecommerce experience with WhatsApp checkout. Rings, earrings, and necklaces crafted for everyday elegance.',
  openGraph: {
    title: 'ZIVAAD | Minimal Luxury Jewelry',
    description:
      'Luxury-inspired minimal jewelry ecommerce experience with WhatsApp checkout. Rings, earrings, and necklaces crafted for everyday elegance.',
    type: 'website',
    locale: 'en_PK',
    url: 'https://zivaad.vercel.app',
    siteName: 'ZIVAAD',
    images: [
      {
        url: 'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_1200/v1690000000/samples/ecommerce/accessories-bag.jpg',
        width: 1200,
        height: 630,
        alt: 'ZIVAAD luxury jewelry'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ZIVAAD | Minimal Luxury Jewelry',
    description:
      'Luxury-inspired minimal jewelry ecommerce experience with WhatsApp checkout. Rings, earrings, and necklaces crafted for everyday elegance.'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${headingFont.variable} ${bodyFont.variable}`}>
      <body className="bg-white text-[#1a1a1a] antialiased">
        <div className="relative min-h-screen overflow-x-clip">
          <Navbar />
          <CartDrawer />
          <AddedToBoxToast />
          <FloatingWhatsAppButton />
          <main className="pt-[5.25rem] sm:pt-[6rem]">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
