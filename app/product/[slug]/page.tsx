import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { CollectionCarousel } from '@/components/collection-carousel';
import { ProductDetailView } from '@/components/product-detail-view';
import { optimizeCloudinaryImage } from '@/lib/cloudinary';
import { getProductVariantData } from '@/lib/product-variants';
import { getProductById, getProducts } from '@/lib/products';
import { stripRichTextToPlainText } from '@/lib/rich-text';
import { getSiteContent } from '@/lib/site-content';

interface ProductPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getProductById(params.slug);

  if (!product) {
    return {
      title: 'Product Not Found',
      description: 'This product could not be found.'
    };
  }

  const previewImage = product.gallery_images?.[0] || product.images[0];
  const image = optimizeCloudinaryImage(previewImage, 1200);
  const plainDescription = stripRichTextToPlainText(product.description);

  return {
    title: product.name,
    description: plainDescription,
    openGraph: {
      title: `${product.name} | ZIVAAD`,
      description: plainDescription,
      type: 'website',
      images: [
        {
          url: image,
          width: 1200,
          height: 1200,
          alt: product.name
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | ZIVAAD`,
      description: plainDescription,
      images: [image]
    }
  };
}

export const revalidate = 60;

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProductById(params.slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = (await getProducts())
    .filter((item) => item.category === product.category && item.id !== product.id);
  const siteContent = await getSiteContent();
  const variantData = getProductVariantData(product);
  const plainDescription = stripRichTextToPlainText(product.description);
  const schemaImages = (product.gallery_images?.length ? product.gallery_images : product.images).map((image) =>
    optimizeCloudinaryImage(image, 1200)
  );
  const offers =
    variantData.variants.length > 0
      ? variantData.variants.map((variant) => ({
          '@type': 'Offer',
          sku: variant.sku || variant.id,
          priceCurrency: 'PKR',
          price: (variant.price ?? product.price).toString(),
          availability: variant.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
        }))
      : {
          '@type': 'Offer',
          priceCurrency: 'PKR',
          price: product.price.toString(),
          availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
        };

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: plainDescription,
    image: schemaImages,
    brand: {
      '@type': 'Brand',
      name: 'ZIVAAD'
    },
    offers
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productSchema)
        }}
      />

      <ProductDetailView product={product} />

      {relatedProducts.length > 0 ? (
        <section className="w-full px-4 pb-20 sm:px-8 sm:pb-24 lg:px-10 lg:pb-32">
          <div className="mb-6 sm:mb-8">
            <p className="text-xs uppercase tracking-luxury text-stone-500">Related Pieces</p>
            <h2 className="mt-2 font-serif text-3xl text-stone-950 sm:text-4xl">{siteContent.headings.related_pieces}</h2>
          </div>
          <CollectionCarousel items={relatedProducts} />
        </section>
      ) : null}
    </>
  );
}
