import { readSiteContentFile } from '@/lib/site-content-storage';
import type { SiteContent } from '@/lib/types';
import { optimizeCloudinaryForHeroBannerImage, optimizeCloudinaryForVideoStorage } from '@/lib/cloudinary';

export const DEFAULT_SITE_CONTENT: SiteContent = {
  hero: {
    image_url: 'https://res.cloudinary.com/demo/image/upload/v1690000000/samples/ecommerce/leather-bag-gray.jpg',
    gradient_enabled: true,
    overlay_gradient: 'linear-gradient(to top, rgba(0,0,0,0.70), rgba(0,0,0,0.25), rgba(0,0,0,0.15))',
    eyebrow: 'ZIVAAD',
    title: 'Minimal Luxury Jewelry',
    subtitle: 'Sculpted essentials with clean lines, subtle shine, and a timeless point of view.',
    primary_cta_label: 'Shop Now',
    primary_cta_href: '/shop',
    secondary_cta_label: 'The Collection',
    secondary_cta_href: '/collection'
  },
  media: {
    storytelling_video_url: 'https://res.cloudinary.com/demo/video/upload/v1690000000/dog.mp4',
    editorial_banner_image_url:
      'https://res.cloudinary.com/demo/image/upload/v1690000000/samples/ecommerce/leather-bag-gray.jpg',
    editorial_banner_gradient_enabled: true,
    editorial_banner_overlay_gradient: 'linear-gradient(to right, rgba(0,0,0,0.62), rgba(0,0,0,0.12))',
    visual_story_images: [
      'https://res.cloudinary.com/demo/image/upload/v1690000000/samples/ecommerce/accessories-bag.jpg',
      'https://res.cloudinary.com/demo/image/upload/v1690000000/samples/ecommerce/leather-bag-gray.jpg',
      'https://res.cloudinary.com/demo/image/upload/v1690000000/samples/ecommerce/analog-classic.jpg',
      'https://res.cloudinary.com/demo/image/upload/v1690000000/samples/ecommerce/shoes.png'
    ],
    category_collection_images: {}
  },
  headings: {
    best_sellers: 'Best Selling Jewelry in Pakistan',
    shop: 'Shop Jewelry',
    collections: 'Shop Jewelry by Category',
    related_pieces: 'You May Also Like',
    cta: 'Build your everyday collection',
    editorial_banner: 'Timeless elegance for everyday wear'
  },
  footer: {
    email: 'zivaad.support@gmail.com',
    location: 'Lahore, Pakistan',
    whatsapp_display: '+92 308 4271446',
    social_links: {
      instagram: 'https://www.instagram.com/zivaadofficial/',
      whatsapp: 'https://wa.me/923084271446',
      facebook: 'https://www.facebook.com/profile.php?id=61577466489502',
      tiktok: 'https://www.tiktok.com/@zivaadofficial'
    }
  },
  taxonomy: {
    categories: ['rings', 'earrings', 'necklaces', 'bracelets'],
    badges: ['BESTSELLER', 'NEW', 'LIMITED']
  },
  settings: {
    shuffle_shop_before_filter: true
  }
};

function asString(value: unknown, fallback: string): string {
  if (typeof value !== 'string') {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed || fallback;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  return fallback;
}

function asStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const normalized = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);

  return normalized.length > 0 ? normalized : fallback;
}

function asStringRecord(value: unknown, fallback: Record<string, string>): Record<string, string> {
  if (!value || typeof value !== 'object') {
    return fallback;
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([key]) => key.trim().length > 0)
    .map(([key, val]) => [key, typeof val === 'string' ? val : ''] as const)
    .filter(([, val]) => val.trim().length > 0);

  if (entries.length === 0) {
    return fallback;
  }

  return Object.fromEntries(entries);
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values));
}

function normalizeCategories(values: string[]): string[] {
  return uniqueStrings(values.map((value) => value.trim().toLowerCase()).filter(Boolean));
}

function normalizeBadges(values: string[]): string[] {
  return uniqueStrings(values.map((value) => value.trim().toUpperCase()).filter(Boolean));
}

function normalizeImageUrlForSite(value: string, mode: 'hero' | 'banner'): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;

  if (mode === 'hero') {
    return optimizeCloudinaryForHeroBannerImage(trimmed);
  }

  return optimizeCloudinaryForHeroBannerImage(trimmed);
}

function normalizeSiteImageArray(values: string[], mode: 'hero' | 'banner'): string[] {
  return values
    .map((value) => normalizeImageUrlForSite(value, mode))
    .map((value) => value.trim())
    .filter(Boolean);
}

function normalizeCategoryImageMap(values: Record<string, string>): Record<string, string> {
  const entries = Object.entries(values)
    .map(([key, value]) => [key.trim().toLowerCase(), normalizeImageUrlForSite(value, 'banner')] as const)
    .map(([key, value]) => [key, value.trim()] as const)
    .filter(([key, value]) => key.length > 0 && value.length > 0);

  return Object.fromEntries(entries);
}

function normalizeVideoUrlForSite(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  return optimizeCloudinaryForVideoStorage(trimmed);
}

export function sanitizeSiteContent(raw: unknown): SiteContent {
  const input = (raw && typeof raw === 'object' ? raw : {}) as Partial<SiteContent>;
  const hero = (input.hero && typeof input.hero === 'object' ? input.hero : {}) as Partial<SiteContent['hero']>;
  const media = (input.media && typeof input.media === 'object' ? input.media : {}) as Partial<SiteContent['media']>;
  const headings =
    (input.headings && typeof input.headings === 'object' ? input.headings : {}) as Partial<SiteContent['headings']>;
  const footer = (input.footer && typeof input.footer === 'object' ? input.footer : {}) as Partial<SiteContent['footer']>;
  const socialLinks =
    (footer.social_links && typeof footer.social_links === 'object'
      ? footer.social_links
      : {}) as Partial<SiteContent['footer']['social_links']>;
  const taxonomy =
    (input.taxonomy && typeof input.taxonomy === 'object' ? input.taxonomy : {}) as Partial<SiteContent['taxonomy']>;
  const settings =
    (input.settings && typeof input.settings === 'object' ? input.settings : {}) as Partial<SiteContent['settings']>;

  const normalizedCategories = normalizeCategories(
    asStringArray(taxonomy.categories, DEFAULT_SITE_CONTENT.taxonomy.categories)
  );
  const normalizedBadges = normalizeBadges(asStringArray(taxonomy.badges, DEFAULT_SITE_CONTENT.taxonomy.badges));

  return {
    hero: {
      image_url: normalizeImageUrlForSite(asString(hero.image_url, DEFAULT_SITE_CONTENT.hero.image_url), 'hero'),
      gradient_enabled: asBoolean(hero.gradient_enabled, DEFAULT_SITE_CONTENT.hero.gradient_enabled),
      overlay_gradient: asString(hero.overlay_gradient, DEFAULT_SITE_CONTENT.hero.overlay_gradient),
      eyebrow: asString(hero.eyebrow, DEFAULT_SITE_CONTENT.hero.eyebrow),
      title: asString(hero.title, DEFAULT_SITE_CONTENT.hero.title),
      subtitle: asString(hero.subtitle, DEFAULT_SITE_CONTENT.hero.subtitle),
      primary_cta_label: asString(hero.primary_cta_label, DEFAULT_SITE_CONTENT.hero.primary_cta_label),
      primary_cta_href: asString(hero.primary_cta_href, DEFAULT_SITE_CONTENT.hero.primary_cta_href),
      secondary_cta_label: asString(hero.secondary_cta_label, DEFAULT_SITE_CONTENT.hero.secondary_cta_label),
      secondary_cta_href: asString(hero.secondary_cta_href, DEFAULT_SITE_CONTENT.hero.secondary_cta_href)
    },
    media: {
      storytelling_video_url: normalizeVideoUrlForSite(
        asString(media.storytelling_video_url, DEFAULT_SITE_CONTENT.media.storytelling_video_url)
      ),
      editorial_banner_image_url: normalizeImageUrlForSite(
        asString(media.editorial_banner_image_url, DEFAULT_SITE_CONTENT.media.editorial_banner_image_url),
        'banner'
      ),
      editorial_banner_gradient_enabled: asBoolean(
        media.editorial_banner_gradient_enabled,
        DEFAULT_SITE_CONTENT.media.editorial_banner_gradient_enabled
      ),
      editorial_banner_overlay_gradient: asString(
        media.editorial_banner_overlay_gradient,
        DEFAULT_SITE_CONTENT.media.editorial_banner_overlay_gradient
      ),
      visual_story_images: normalizeSiteImageArray(
        asStringArray(media.visual_story_images, DEFAULT_SITE_CONTENT.media.visual_story_images),
        'banner'
      ),
      category_collection_images: normalizeCategoryImageMap(
        asStringRecord(media.category_collection_images, DEFAULT_SITE_CONTENT.media.category_collection_images)
      )
    },
    headings: {
      best_sellers: asString(headings.best_sellers, DEFAULT_SITE_CONTENT.headings.best_sellers),
      shop: asString(headings.shop, DEFAULT_SITE_CONTENT.headings.shop),
      collections: asString(headings.collections, DEFAULT_SITE_CONTENT.headings.collections),
      related_pieces: asString(headings.related_pieces, DEFAULT_SITE_CONTENT.headings.related_pieces),
      cta: asString(headings.cta, DEFAULT_SITE_CONTENT.headings.cta),
      editorial_banner: asString(headings.editorial_banner, DEFAULT_SITE_CONTENT.headings.editorial_banner)
    },
    footer: {
      email: asString(footer.email, DEFAULT_SITE_CONTENT.footer.email),
      location: asString(footer.location, DEFAULT_SITE_CONTENT.footer.location),
      whatsapp_display: asString(footer.whatsapp_display, DEFAULT_SITE_CONTENT.footer.whatsapp_display),
      social_links: {
        instagram: asString(socialLinks.instagram, DEFAULT_SITE_CONTENT.footer.social_links.instagram),
        whatsapp: asString(socialLinks.whatsapp, DEFAULT_SITE_CONTENT.footer.social_links.whatsapp),
        facebook: asString(socialLinks.facebook, DEFAULT_SITE_CONTENT.footer.social_links.facebook),
        tiktok: asString(socialLinks.tiktok, DEFAULT_SITE_CONTENT.footer.social_links.tiktok)
      }
    },
    taxonomy: {
      categories:
        normalizedCategories.length > 0 ? normalizedCategories : [...DEFAULT_SITE_CONTENT.taxonomy.categories],
      badges: normalizedBadges.length > 0 ? normalizedBadges : [...DEFAULT_SITE_CONTENT.taxonomy.badges]
    },
    settings: {
      shuffle_shop_before_filter: asBoolean(
        settings.shuffle_shop_before_filter,
        DEFAULT_SITE_CONTENT.settings.shuffle_shop_before_filter
      )
    }
  };
}

export async function getSiteContent(): Promise<SiteContent> {
  try {
    const file = await readSiteContentFile();
    const parsed = JSON.parse(file);
    return sanitizeSiteContent(parsed);
  } catch {
    return DEFAULT_SITE_CONTENT;
  }
}
