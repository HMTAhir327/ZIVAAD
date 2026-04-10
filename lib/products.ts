import type { Product } from '@/lib/types';
import { getProductVariantData } from '@/lib/product-variants';
import { readProductsFile } from '@/lib/product-storage';

const fallbackImage =
  'https://res.cloudinary.com/demo/image/upload/v1690000000/samples/ecommerce/accessories-bag.jpg';

function normalizeCategory(category: string): Product['category'] {
  const normalized = category.trim().toLowerCase();
  if (normalized === 'ring') return 'rings';
  if (normalized === 'earring') return 'earrings';
  if (normalized === 'necklace') return 'necklaces';
  if (normalized === 'bracelet') return 'bracelets';
  if (normalized === 'bracelets') return 'bracelets';
  return (normalized || 'uncategorized') as Product['category'];
}

function dedupeUrls(urls: string[]): string[] {
  return Array.from(new Set(urls.filter(Boolean)));
}

function normalizeProduct(product: Product): Product {
  const normalizedCategory = normalizeCategory(product.category);
  const primary = product.primary_image_url || product.images?.[0] || fallbackImage;
  const secondary = product.secondary_image_url || product.images?.[1] || primary;
  const variantData = getProductVariantData(product);
  const gallerySeed =
    product.gallery_images && product.gallery_images.length > 0 ? product.gallery_images : (product.images ?? []);

  const gallery_images = dedupeUrls([primary, ...(secondary && secondary !== primary ? [secondary] : []), ...gallerySeed]);
  const images = gallery_images;
  const aggregatedVariantStock = variantData.variants.reduce((sum, variant) => sum + variant.stock, 0);
  const normalizedStock = variantData.variants.length > 0 ? aggregatedVariantStock : product.stock;

  return {
    ...product,
    category: normalizedCategory,
    primary_image_url: primary,
    secondary_image_url: secondary,
    gallery_images,
    images,
    zivaad_choice: Boolean(product.zivaad_choice),
    sale_tag_enabled: Boolean(product.sale_tag_enabled),
    stock: normalizedStock,
    product_options: variantData.options,
    product_variants: variantData.variants
  };
}

export async function getProducts(): Promise<Product[]> {
  const file = await readProductsFile();
  const products = JSON.parse(file) as Product[];
  return products.map(normalizeProduct);
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const products = await getProducts();
  return products.find((product) => product.id === id);
}

export async function getFeaturedProducts(limit = 6): Promise<Product[]> {
  const products = await getProducts();
  return products.filter((product) => product.badge === 'BESTSELLER').slice(0, limit);
}
