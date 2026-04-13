import { BestSellersCarousel } from '@/components/best-sellers-carousel';
import { CategoryCollectionsGrid } from '@/components/category-collections-grid';
import { CustomerLoveSection } from '@/components/customer-love-section';
import { HomeHero } from '@/components/home-hero';
import { HomeTrustStrip } from '@/components/home-trust-strip';
import { VideoShowcaseSection } from '@/components/video-showcase-section';
import { ZivaadChoiceSection } from '@/components/zivaad-choice-section';
import { getProducts } from '@/lib/products';
import { getSiteContent } from '@/lib/site-content';

export const revalidate = 60;

function shuffleWithSeed<T>(items: T[], seed: string): T[] {
  const output = [...items];
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  for (let index = output.length - 1; index > 0; index -= 1) {
    hash = (hash * 1664525 + 1013904223) >>> 0;
    const swapIndex = hash % (index + 1);
    [output[index], output[swapIndex]] = [output[swapIndex], output[index]];
  }

  return output;
}

export default async function HomePage() {
  const [products, siteContent] = await Promise.all([getProducts(), getSiteContent()]);
  const zivaadChoice = products.filter((product) => product.zivaad_choice);
  const nonChoice = products.filter((product) => !product.zivaad_choice);

  const nonChoiceOrdered = siteContent.settings.shuffle_shop_before_filter
    ? shuffleWithSeed(nonChoice, `${Date.now()}:${products.length}`)
    : nonChoice;

  const featuredProducts = (nonChoiceOrdered.length > 0 ? nonChoiceOrdered : products).slice(0, 12);

  return (
    <>
      <HomeHero hero={siteContent.hero} />
      <HomeTrustStrip items={siteContent.settings.trust_marquee_items} />
      <ZivaadChoiceSection products={zivaadChoice} />
      <CategoryCollectionsGrid
        products={products}
        categories={siteContent.taxonomy.categories}
        categoryImages={siteContent.media.category_collection_images}
        title={siteContent.headings.collections || 'Collections'}
      />
      <BestSellersCarousel products={featuredProducts} title={siteContent.headings.best_sellers} />
      <CustomerLoveSection />
      <VideoShowcaseSection videoUrl={siteContent.media.storytelling_video_url} />
    </>
  );
}
