import { notFound } from 'next/navigation';

import { AdminProductFormPage } from '@/components/admin-product-form-page';
import { getAdminWriteBlockMessage, isAdminUiEnabled, isAdminWriteEnabled } from '@/lib/admin-mode';
import { getProducts } from '@/lib/products';
import { getSiteContent } from '@/lib/site-content';

interface AdminEditProductPageProps {
  params: {
    id: string;
  };
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function AdminEditProductPage({ params }: AdminEditProductPageProps) {
  if (!isAdminUiEnabled()) {
    notFound();
  }

  const adminCanWrite = isAdminWriteEnabled();
  const adminWriteNotice = adminCanWrite
    ? 'Local write mode is active. Saving updates writes to data/products.json.'
    : getAdminWriteBlockMessage();

  const [products, siteContent] = await Promise.all([getProducts(), getSiteContent()]);
  const productId = decodeURIComponent(params.id);
  const product = products.find((item) => item.id === productId);

  if (!product) {
    notFound();
  }

  const categoryOptions = Array.from(
    new Set([...siteContent.taxonomy.categories, ...products.map((item) => item.category)])
  ).sort((a, b) => a.localeCompare(b));
  const badgeOptions = Array.from(
    new Set([...siteContent.taxonomy.badges, ...products.map((item) => item.badge)])
  ).sort((a, b) => a.localeCompare(b));

  return (
    <AdminProductFormPage
      mode="edit"
      originalProductId={product.id}
      initialProduct={product}
      allProducts={products}
      categoryOptions={categoryOptions}
      badgeOptions={badgeOptions}
      adminCanWrite={adminCanWrite}
      adminWriteNotice={adminWriteNotice}
    />
  );
}

export function generateMetadata() {
  return {
    title: 'Edit Product | ZIVAAD Admin'
  };
}
