import { BestSellersCarousel } from '@/components/best-sellers-carousel';
import { CategoryCollectionsGrid } from '@/components/category-collections-grid';
import { CustomerLoveSection } from '@/components/customer-love-section';
import { HomeHero } from '@/components/home-hero';
import { HomeCtaSection } from '@/components/home-cta-section';
import { VideoShowcaseSection } from '@/components/video-showcase-section';
import { getProducts } from '@/lib/products';
import { getSiteContent } from '@/lib/site-content';

export const revalidate = 60;

export default async function HomePage() {
  const [products, siteContent] = await Promise.all([getProducts(), getSiteContent()]);
  const bestSellers = products.filter((product) => product.badge === 'BESTSELLER');
  const nonBestSellers = products.filter((product) => product.badge !== 'BESTSELLER');
  const featuredProducts = [...bestSellers, ...nonBestSellers].slice(0, 12);

  return (
    <>
      <HomeHero hero={siteContent.hero} />
      <CategoryCollectionsGrid
        products={products}
        categories={siteContent.taxonomy.categories}
        categoryImages={siteContent.media.category_collection_images}
        title={siteContent.headings.collections || 'Collections'}
      />
      <BestSellersCarousel products={featuredProducts} title={siteContent.headings.best_sellers} />
      <VideoShowcaseSection videoUrl={siteContent.media.storytelling_video_url} />
      <HomeCtaSection title={siteContent.headings.cta} />
      <CustomerLoveSection />
    
    </>
  );
}
