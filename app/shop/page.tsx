import { ProductGrid } from '@/components/product-grid';
import { getProducts } from '@/lib/products';
import { getSiteContent } from '@/lib/site-content';

export const revalidate = 60;

interface ShopPageProps {
  searchParams?: {
    category?: string | string[];
    q?: string | string[];
  };
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const [products, siteContent] = await Promise.all([getProducts(), getSiteContent()]);
  const category = Array.isArray(searchParams?.category) ? searchParams?.category[0] : searchParams?.category;
  const searchQuery = Array.isArray(searchParams?.q) ? searchParams?.q[0] : searchParams?.q;
  const normalizedCategory = (category || '').trim().toLowerCase();
  const categorySet = new Set(products.map((product) => product.category));
  const initialCategory =
    normalizedCategory && normalizedCategory !== 'all' && categorySet.has(normalizedCategory) ? normalizedCategory : 'all';
  const initialQuery = (searchQuery || '').trim();

  return (
    <section className="w-full px-4 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-16">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-luxury text-stone-500">ZIVAAD Catalog</p>
      </div>
      <ProductGrid
        products={products}
        initialCategory={initialCategory}
        initialQuery={initialQuery}
        shuffleOnInitialLoad={siteContent.settings.shuffle_shop_before_filter}
      />
    </section>
  );
}
