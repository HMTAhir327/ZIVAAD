import type { Metadata } from 'next';

import { CategoryCollectionsGrid } from '@/components/category-collections-grid';
import { getProducts } from '@/lib/products';
import { getSiteContent } from '@/lib/site-content';

export const metadata: Metadata = {
  title: 'Collections',
  description: 'Explore ZIVAAD collections by category.'
};

export const revalidate = 60;

export default async function CollectionPage() {
  const [products, siteContent] = await Promise.all([getProducts(), getSiteContent()]);

  return (
    <CategoryCollectionsGrid
      products={products}
      categories={siteContent.taxonomy.categories}
      categoryImages={siteContent.media.category_collection_images}
      title={siteContent.headings.collections}
    />
  );
}
