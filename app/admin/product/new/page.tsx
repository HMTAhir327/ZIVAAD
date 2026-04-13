import { notFound } from 'next/navigation';

import { AdminProductFormPage } from '@/components/admin-product-form-page';
import { getAdminWriteBlockMessage, isAdminUiEnabled, isAdminWriteEnabled } from '@/lib/admin-mode';
import { getProducts } from '@/lib/products';
import { getSiteContent } from '@/lib/site-content';
import type { Product } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function generateProductId() {
  return `new-piece-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function randomRating() {
  const value = 4.6 + Math.random() * 0.4;
  return Number(value.toFixed(1));
}

function randomRatingCount() {
  return Math.floor(35 + Math.random() * 560);
}

function createEmptyProduct(defaultCategory: string, defaultBadge: string): Product {
  return {
    id: generateProductId(),
    name: 'Untitled Piece',
    price: 0,
    compare_price: 0,
    category: defaultCategory,
    primary_image_url: '',
    secondary_image_url: '',
    gallery_images: [],
    images: [],
    video_url: '',
    description: '<p>Designed for everyday elegance.</p>',
    badge: defaultBadge,
    stock: 10,
    supplier_urls: [],
    zivaad_choice: false,
    sale_tag_enabled: false,
    rating: randomRating(),
    rating_count: randomRatingCount(),
    option_swatches: {},
    product_options: [],
    product_variants: []
  };
}

export default async function AdminNewProductPage() {
  if (!isAdminUiEnabled()) {
    notFound();
  }

  const adminCanWrite = isAdminWriteEnabled();
  const adminWriteNotice = adminCanWrite
    ? 'Local write mode is active. Saving updates writes to data/products.json.'
    : getAdminWriteBlockMessage();

  const [products, siteContent] = await Promise.all([getProducts(), getSiteContent()]);
  const categoryOptions = Array.from(
    new Set([...siteContent.taxonomy.categories, ...products.map((product) => product.category)])
  ).sort((a, b) => a.localeCompare(b));
  const badgeOptions = Array.from(
    new Set([...siteContent.taxonomy.badges, ...products.map((product) => product.badge)])
  ).sort((a, b) => a.localeCompare(b));

  const defaultCategory = categoryOptions[0] || 'rings';
  const defaultBadge = badgeOptions[0] || 'NEW';

  return (
    <AdminProductFormPage
      mode="create"
      initialProduct={createEmptyProduct(defaultCategory, defaultBadge)}
      allProducts={products}
      categoryOptions={categoryOptions}
      badgeOptions={badgeOptions}
      adminCanWrite={adminCanWrite}
      adminWriteNotice={adminWriteNotice}
    />
  );
}
