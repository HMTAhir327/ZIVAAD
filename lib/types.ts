export type ProductCategory = string;

export type ProductBadge = string;

export interface ProductOption {
  name: string;
  values: string[];
}

export interface ProductVariant {
  id: string;
  sku?: string;
  title?: string;
  option_values: Record<string, string>;
  price?: number;
  compare_price?: number;
  stock: number;
  image_url?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  compare_price: number;
  category: ProductCategory;
  primary_image_url?: string;
  secondary_image_url?: string;
  gallery_images: string[];
  images: string[];
  video_url: string;
  description: string;
  badge: ProductBadge;
  stock: number;
  zivaad_choice?: boolean;
  sale_tag_enabled?: boolean;
  option_swatches?: Record<string, Record<string, string>>;
  product_options?: ProductOption[];
  product_variants?: ProductVariant[];
}

export interface SiteContent {
  hero: {
    image_url: string;
    gradient_enabled: boolean;
    overlay_gradient: string;
    eyebrow: string;
    title: string;
    subtitle: string;
    primary_cta_label: string;
    primary_cta_href: string;
    secondary_cta_label: string;
    secondary_cta_href: string;
  };
  media: {
    storytelling_video_url: string;
    editorial_banner_image_url: string;
    editorial_banner_gradient_enabled: boolean;
    editorial_banner_overlay_gradient: string;
    visual_story_images: string[];
    category_collection_images: Record<string, string>;
  };
  headings: {
    best_sellers: string;
    shop: string;
    collections: string;
    related_pieces: string;
    cta: string;
    editorial_banner: string;
  };
  footer: {
    email: string;
    location: string;
    whatsapp_display: string;
    social_links: {
      instagram: string;
      whatsapp: string;
      facebook: string;
      tiktok: string;
    };
  };
  taxonomy: {
    categories: ProductCategory[];
    badges: ProductBadge[];
  };
  settings: {
    shuffle_shop_before_filter: boolean;
  };
}

export interface CartItem {
  line_id: string;
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  stock: number;
  variant_id?: string;
  variant_sku?: string;
  variant_title?: string;
  selected_options?: Record<string, string>;
}

export interface CheckoutCustomer {
  name: string;
  city: string;
  address: string;
}
