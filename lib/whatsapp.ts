import { formatSelectedOptions } from '@/lib/product-variants';
import type { CartItem, CheckoutCustomer } from '@/lib/types';

export const ZIVAAD_WHATSAPP_NUMBER = '923084271446';
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://zivaad.com').replace(/\/+$/, '');

function buildProductLink(productId: string): string {
  return `${SITE_URL}/product/${encodeURIComponent(productId)}`;
}

export function buildWhatsAppOrderMessage(items: CartItem[], subtotal: number, customer: CheckoutCustomer): string {
  const itemLines = items
    .map((item) => {
      const variantLabel = item.variant_title || formatSelectedOptions(item.selected_options);
      const variantSuffix = variantLabel ? ` (${variantLabel})` : '';
      const skuSuffix = item.variant_sku ? ` [SKU: ${item.variant_sku}]` : '';
      const productLink = buildProductLink(item.id);
      return `${item.quantity}x ${item.name}${variantSuffix}${skuSuffix} - ${item.price * item.quantity} PKR\nLink: ${productLink}`;
    })
    .join('\n');

  return [
    'Hello ZIVAAD,',
    '',
    'I would like to place an order:',
    '',
    'Items:',
    itemLines,
    '',
    `Total: ${subtotal} PKR`,
    '',
    `Name: ${customer.name}`,
    `City: ${customer.city}`,
    `Address: ${customer.address}`,
    '',
    'Please confirm my order.'
  ].join('\n');
}

export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/${ZIVAAD_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
