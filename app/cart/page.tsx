import type { Metadata } from 'next';

import { CartPageView } from '@/components/cart-page-view';

export const metadata: Metadata = {
  title: 'Cart',
  description: 'Review your ZIVAAD cart and checkout via WhatsApp.'
};

export default function CartPage() {
  return <CartPageView />;
}

