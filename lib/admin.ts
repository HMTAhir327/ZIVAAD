import type { Product, ProductBadge, ProductCategory } from '@/lib/types';
import { optimizeCloudinaryForImageStorage, optimizeCloudinaryForVideoStorage } from '@/lib/cloudinary';
import {
  getProductVariantData,
  normalizeProductOptionDefinitions,
  normalizeProductVariantDefinitions
} from '@/lib/product-variants';
import { normalizeDescriptionForEditor } from '@/lib/rich-text';

const fallbackImage =
  'https://res.cloudinary.com/demo/image/upload/v1690000000/samples/ecommerce/accessories-bag.jpg';

function normalizeCategory(category: string): ProductCategory {
  const normalized = category.trim().toLowerCase();
  if (normalized === 'ring') return 'rings';
  if (normalized === 'earring') return 'earrings';
  if (normalized === 'necklace') return 'necklaces';
  if (normalized === 'bracelet') return 'bracelets';
  if (normalized === 'bracelets') return 'bracelets';
  return normalized as ProductCategory;
}

function dedupeUrls(urls: string[]): string[] {
  return Array.from(new Set(urls.filter(Boolean)));
}

function optimizeProductImageUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  return optimizeCloudinaryForImageStorage(trimmed);
}

function normalizeHexColor(value: string): string | undefined {
  const trimmed = value.trim().toLowerCase();
  if (/^#([0-9a-f]{6})$/i.test(trimmed)) {
    return trimmed;
  }

  if (/^#([0-9a-f]{3})$/i.test(trimmed)) {
    const expanded = trimmed
      .slice(1)
      .split('')
      .map((char) => `${char}${char}`)
      .join('');
    return `#${expanded}`;
  }

  return undefined;
}

function normalizeOptionSwatches(
  rawSwatches: unknown,
  options: Product['product_options']
): Record<string, Record<string, string>> | undefined {
  if (!rawSwatches || typeof rawSwatches !== 'object' || !options || options.length === 0) {
    return undefined;
  }

  const normalized: Record<string, Record<string, string>> = {};
  const source = rawSwatches as Record<string, unknown>;

  options.forEach((option) => {
    const optionName = option.name;
    const sourceEntry = source[optionName];
    if (!sourceEntry || typeof sourceEntry !== 'object') {
      return;
    }

    const sourceMap = sourceEntry as Record<string, unknown>;
    const swatchEntries = option.values
      .map((value) => {
        const color = typeof sourceMap[value] === 'string' ? normalizeHexColor(sourceMap[value] as string) : undefined;
        return color ? ([value, color] as const) : undefined;
      })
      .filter(Boolean) as Array<readonly [string, string]>;

    if (swatchEntries.length > 0) {
      normalized[optionName] = Object.fromEntries(swatchEntries);
    }
  });

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function toBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  return fallback;
}

function toRating(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 4.8;
  }
  return Number(Math.min(5, Math.max(0, parsed)).toFixed(1));
}

function toRatingCount(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return Math.max(0, Math.floor(parsed));
}

export function sanitizeProducts(rawProducts: unknown): Product[] {
  if (!Array.isArray(rawProducts)) {
    throw new Error('Invalid products payload');
  }

  return rawProducts.map((item, index) => sanitizeProduct(item, index));
}

function sanitizeProduct(rawProduct: unknown, index: number): Product {
  if (typeof rawProduct !== 'object' || rawProduct === null) {
    throw new Error(`Invalid product at index ${index}`);
  }

  const product = rawProduct as Partial<Product>;

  if (!product.id || typeof product.id !== 'string') throw new Error(`Invalid id at index ${index}`);
  if (!product.name || typeof product.name !== 'string') throw new Error(`Invalid name at index ${index}`);
  if (typeof product.price !== 'number') throw new Error(`Invalid price at index ${index}`);
  if (typeof product.compare_price !== 'number') throw new Error(`Invalid compare price at index ${index}`);
  if (!product.category || typeof product.category !== 'string') throw new Error(`Invalid category at index ${index}`);
  const category = normalizeCategory(product.category);
  if (!category) throw new Error(`Invalid category at index ${index}`);

  const primaryImageRaw = product.primary_image_url || product.images?.[0] || fallbackImage;
  const primaryImage = optimizeCloudinaryForImageStorage(primaryImageRaw);
  if (typeof primaryImage !== 'string') throw new Error(`Invalid primary image at index ${index}`);

  const secondaryImageRaw = product.secondary_image_url || product.images?.[1] || primaryImage;
  const secondaryImage = optimizeCloudinaryForImageStorage(secondaryImageRaw);
  if (typeof secondaryImage !== 'string') throw new Error(`Invalid secondary image at index ${index}`);

  const gallerySeed =
    product.gallery_images && product.gallery_images.length > 0 ? product.gallery_images : (product.images ?? []);
  const optimizedGallerySeed = gallerySeed.map((url) => optimizeProductImageUrl(url));
  const galleryImages = dedupeUrls([
    primaryImage,
    ...(secondaryImage && secondaryImage !== primaryImage ? [secondaryImage] : []),
    ...optimizedGallerySeed
  ]);
  const images = galleryImages;

  if (typeof product.video_url !== 'string') throw new Error(`Invalid video url at index ${index}`);
  const optimizedVideoUrl = optimizeCloudinaryForVideoStorage(product.video_url);
  if (!product.description || typeof product.description !== 'string') {
    throw new Error(`Invalid description at index ${index}`);
  }
  const normalizedDescription = normalizeDescriptionForEditor(product.description);
  if (!product.badge || typeof product.badge !== 'string') throw new Error(`Invalid badge at index ${index}`);
  if (typeof product.stock !== 'number') throw new Error(`Invalid stock at index ${index}`);

  const normalizedOptions = normalizeProductOptionDefinitions(product.product_options);
  const normalizedVariants = normalizeProductVariantDefinitions(product.product_variants, normalizedOptions).map(
    (variant) => ({
      ...variant,
      image_url: variant.image_url ? optimizeProductImageUrl(variant.image_url) : undefined
    })
  );
  const variantData = getProductVariantData({
    product_options: normalizedOptions,
    product_variants: normalizedVariants
  });
  const aggregatedVariantStock = variantData.variants.reduce((sum, variant) => sum + variant.stock, 0);
  const normalizedStock = variantData.variants.length > 0 ? aggregatedVariantStock : product.stock;
  const normalizedSwatches = normalizeOptionSwatches(product.option_swatches, variantData.options);
  const supplierUrls = dedupeUrls(
    (Array.isArray(product.supplier_urls) ? product.supplier_urls : [])
      .map((url) => (typeof url === 'string' ? url.trim() : ''))
      .filter(Boolean)
  );

  return {
    id: product.id,
    name: product.name,
    price: product.price,
    compare_price: product.compare_price,
    category,
    primary_image_url: primaryImage,
    secondary_image_url: secondaryImage,
    gallery_images: galleryImages,
    images,
    video_url: optimizedVideoUrl,
    description: normalizedDescription,
    badge: product.badge as ProductBadge,
    stock: normalizedStock,
    supplier_urls: supplierUrls,
    zivaad_choice: toBoolean(product.zivaad_choice, false),
    sale_tag_enabled: toBoolean(product.sale_tag_enabled, false),
    rating: toRating(product.rating),
    rating_count: toRatingCount(product.rating_count),
    option_swatches: normalizedSwatches,
    product_options: variantData.options,
    product_variants: variantData.variants
  };
}
