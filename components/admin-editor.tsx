'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState, useTransition } from 'react';

import { saveProductsAction, saveSiteContentAction } from '@/app/admin/actions';
import {
  getProductVariantData,
  normalizeProductOptionDefinitions,
  normalizeProductVariantDefinitions
} from '@/lib/product-variants';
import type { Product, ProductCategory, ProductOption, ProductVariant, SiteContent } from '@/lib/types';

const DEFAULT_CATEGORIES: ProductCategory[] = ['rings', 'earrings', 'necklaces'];
const DEFAULT_BADGES = ['BESTSELLER', 'NEW', 'LIMITED'];
const DEFAULT_OPTION_NAMES = ['Color', 'Size', 'Material', 'Length', 'Finish'];

type AdminCategoryFilter = ProductCategory | 'all';
type AdminBadgeFilter = string | 'all';
type AdminTab = 'products' | 'taxonomy' | 'site-settings' | 'profiles';

const fallbackImage =
  'https://res.cloudinary.com/demo/image/upload/v1690000000/samples/ecommerce/accessories-bag.jpg';

interface AdminEditorProps {
  initialProducts: Product[];
  initialSiteContent: SiteContent;
  adminCanWrite: boolean;
  adminWriteNotice: string;
}

function normalizeMedia(product: Product): Product {
  const variantData = getProductVariantData(product);
  const galleryFromField = (product.gallery_images ?? []).map((url) => url.trim()).filter(Boolean);
  const fallbackImages = (product.images ?? []).map((url) => url.trim()).filter(Boolean);
  const galleryImages = Array.from(new Set((galleryFromField.length > 0 ? galleryFromField : fallbackImages).filter(Boolean)));

  const primaryInput = typeof product.primary_image_url === 'string' ? product.primary_image_url.trim() : '';
  const secondaryInput = typeof product.secondary_image_url === 'string' ? product.secondary_image_url.trim() : '';
  const fallbackPrimary = galleryImages[0] || fallbackImages[0] || '';
  const fallbackSecondary = galleryImages[1] || fallbackImages[1] || fallbackPrimary;
  const primary = primaryInput || (product.primary_image_url == null ? fallbackPrimary : '');
  const secondary = secondaryInput || (product.secondary_image_url == null ? fallbackSecondary : '');
  const normalizedCategory = normalizeCategoryTerm(product.category || '') || DEFAULT_CATEGORIES[0];
  const normalizedBadge = normalizeBadgeTerm(product.badge || '') || DEFAULT_BADGES[0];
  const normalizedImages =
    galleryImages.length > 0
      ? Array.from(new Set([primary, secondary, ...galleryImages].filter(Boolean)))
      : Array.from(new Set([primary, ...(secondary && secondary !== primary ? [secondary] : [])].filter(Boolean)));
  const normalizedStock =
    variantData.variants.length > 0
      ? variantData.variants.reduce((sum, variant) => sum + variant.stock, 0)
      : product.stock;

  return {
    ...product,
    category: normalizedCategory,
    badge: normalizedBadge,
    primary_image_url: primary,
    secondary_image_url: secondary,
    gallery_images: galleryImages,
    images: normalizedImages,
    stock: normalizedStock,
    product_options: variantData.options,
    product_variants: variantData.variants
  };
}

function toNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeCategoryTerm(value: string): ProductCategory {
  return value.trim().toLowerCase();
}

function normalizeBadgeTerm(value: string): string {
  return value.trim().toUpperCase();
}

function uniqueValues(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function normalizeCategoryList(values: string[]): ProductCategory[] {
  return uniqueValues(values.map((value) => normalizeCategoryTerm(value))) as ProductCategory[];
}

function normalizeBadgeList(values: string[]): string[] {
  return uniqueValues(values.map((value) => normalizeBadgeTerm(value)));
}

function formatOptionValues(option: ProductOption): string {
  return (option.values || []).join(', ');
}

function parseOptionValues(value: string): string[] {
  return value
    .split(/,|\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function createVariantId(): string {
  return `variant-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function countOptionCombinations(options: ProductOption[]): number {
  if (options.length === 0) {
    return 0;
  }

  return options.reduce((count, option) => {
    const size = Math.max(1, option.values.length);
    return count * size;
  }, 1);
}

function buildVariantCombinations(options: ProductOption[]): Array<Record<string, string>> {
  if (options.length === 0) {
    return [];
  }

  const combinations: Array<Record<string, string>> = [];

  function walk(optionIndex: number, current: Record<string, string>) {
    if (optionIndex >= options.length) {
      combinations.push({ ...current });
      return;
    }

    const option = options[optionIndex];
    option.values.forEach((value) => {
      current[option.name] = value;
      walk(optionIndex + 1, current);
    });
  }

  walk(0, {});
  return combinations;
}

function buildVariantSignature(options: ProductOption[], optionValues: Record<string, string>): string {
  return options
    .map((option) => `${option.name.toLowerCase()}=${(optionValues[option.name] || '').trim().toLowerCase()}`)
    .join('|');
}

function buildVariantLabel(options: ProductOption[], optionValues: Record<string, string>): string {
  return options
    .map((option) => optionValues[option.name])
    .filter(Boolean)
    .join(' / ');
}

function generateVariantsFromOptions(product: Product, options: ProductOption[]): ProductVariant[] {
  const combinations = buildVariantCombinations(options);
  if (combinations.length === 0) {
    return [];
  }

  const existingVariants = normalizeProductVariantDefinitions(product.product_variants, options);
  const existingBySignature = new Map<string, ProductVariant>();

  existingVariants.forEach((variant) => {
    const signature = buildVariantSignature(options, variant.option_values);
    if (!existingBySignature.has(signature)) {
      existingBySignature.set(signature, variant);
    }
  });

  return combinations.map((optionValues) => {
    const signature = buildVariantSignature(options, optionValues);
    const existing = existingBySignature.get(signature);

    return {
      id: existing?.id || createVariantId(),
      sku: existing?.sku || '',
      title: existing?.title || buildVariantLabel(options, optionValues),
      option_values: optionValues,
      price: existing?.price ?? product.price,
      compare_price: existing?.compare_price ?? product.compare_price,
      stock: existing?.stock ?? 0,
      image_url: existing?.image_url || product.primary_image_url || ''
    };
  });
}

interface FieldLabelProps {
  children: string;
}

function FieldLabel({ children }: FieldLabelProps) {
  return <label className="text-[10px] uppercase tracking-luxury text-stone-500">{children}</label>;
}

function normalizeUrl(value: string): string {
  return value.trim();
}

function parseUrlTextareaInput(value: string): string[] {
  return value
    .split(/(?:\r?\n)+|,\s*(?=https?:\/\/)/i)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseTextLines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function toPositiveInt(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return Math.max(0, Math.floor(parsed));
}

function cycleSecondsToParts(totalSeconds: number) {
  const safe = Math.max(1, Math.floor(totalSeconds));
  const days = Math.floor(safe / 86400);
  const hours = Math.floor((safe % 86400) / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  return { days, hours, minutes, seconds };
}

function cyclePartsToSeconds(parts: { days: number; hours: number; minutes: number; seconds: number }) {
  const total = parts.days * 86400 + parts.hours * 3600 + parts.minutes * 60 + parts.seconds;
  return Math.max(1, total);
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

interface ImageUrlPreviewProps {
  url: string;
  label: string;
  aspectClass?: string;
}

function ImageUrlPreview({ url, label, aspectClass = 'aspect-[16/10]' }: ImageUrlPreviewProps) {
  const [hasError, setHasError] = useState(false);
  const normalized = normalizeUrl(url);
  const valid = isValidHttpUrl(normalized);

  useEffect(() => {
    setHasError(false);
  }, [normalized]);

  return (
    <div className="space-y-2">
      <p className="text-[10px] uppercase tracking-luxury text-stone-500">{label}</p>
      <div className={`relative overflow-hidden border border-stone-200 bg-stone-100 ${aspectClass}`}>
        {!normalized ? (
          <div className="flex h-full items-center justify-center px-3 text-center text-xs text-stone-500">
            Add an image URL to preview.
          </div>
        ) : !valid ? (
          <div className="flex h-full items-center justify-center px-3 text-center text-xs text-stone-500">
            Invalid URL format.
          </div>
        ) : hasError ? (
          <div className="flex h-full items-center justify-center px-3 text-center text-xs text-stone-500">
            Image preview unavailable.
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={normalized}
            alt={label}
            className="h-full w-full object-cover"
            onError={() => setHasError(true)}
            loading="lazy"
          />
        )}
      </div>
      {valid ? (
        <a
          href={normalized}
          target="_blank"
          rel="noreferrer"
          className="text-[10px] uppercase tracking-luxury text-stone-500 underline underline-offset-2 hover:text-stone-900"
        >
          Open URL
        </a>
      ) : null}
    </div>
  );
}

interface VideoUrlPreviewProps {
  url: string;
  label: string;
}

function VideoUrlPreview({ url, label }: VideoUrlPreviewProps) {
  const normalized = normalizeUrl(url);
  const valid = isValidHttpUrl(normalized);

  return (
    <div className="space-y-2">
      <p className="text-[10px] uppercase tracking-luxury text-stone-500">{label}</p>
      <div className="relative aspect-[16/10] overflow-hidden border border-stone-200 bg-black">
        {!normalized ? (
          <div className="flex h-full items-center justify-center px-3 text-center text-xs text-stone-300">
            Add a video URL to preview.
          </div>
        ) : !valid ? (
          <div className="flex h-full items-center justify-center px-3 text-center text-xs text-stone-300">
            Invalid URL format.
          </div>
        ) : (
          <video
            key={normalized}
            src={normalized}
            className="h-full w-full object-cover"
            controls
            muted
            preload="metadata"
          />
        )}
      </div>
      {valid ? (
        <a
          href={normalized}
          target="_blank"
          rel="noreferrer"
          className="text-[10px] uppercase tracking-luxury text-stone-500 underline underline-offset-2 hover:text-stone-900"
        >
          Open URL
        </a>
      ) : null}
    </div>
  );
}

interface LinkPreviewProps {
  label: string;
  url: string;
}

function LinkPreview({ label, url }: LinkPreviewProps) {
  const normalized = normalizeUrl(url);
  const valid = isValidHttpUrl(normalized);

  return (
    <div className="flex items-center justify-between border border-stone-200 px-3 py-2">
      <p className="text-xs text-stone-700">{label}</p>
      {valid ? (
        <a
          href={normalized}
          target="_blank"
          rel="noreferrer"
          className="text-[10px] uppercase tracking-luxury text-stone-500 underline underline-offset-2 hover:text-stone-900"
        >
          Preview
        </a>
      ) : (
        <span className="text-[10px] uppercase tracking-luxury text-stone-400">No URL</span>
      )}
    </div>
  );
}

interface GradientPreviewProps {
  label: string;
  gradient: string;
  enabled?: boolean;
}

function GradientPreview({ label, gradient, enabled = true }: GradientPreviewProps) {
  const value = gradient.trim();

  return (
    <div className="space-y-2">
      <p className="text-[10px] uppercase tracking-luxury text-stone-500">{label}</p>
      <div className="relative aspect-[16/7] overflow-hidden border border-stone-200 bg-stone-100">
        {!enabled ? (
          <div className="flex h-full items-center justify-center px-3 text-center text-xs text-stone-500">
            Gradient disabled.
          </div>
        ) : value ? (
          <div className="absolute inset-0" style={{ backgroundImage: value }} />
        ) : (
          <div className="flex h-full items-center justify-center px-3 text-center text-xs text-stone-500">
            Add a CSS gradient value to preview.
          </div>
        )}
      </div>
    </div>
  );
}

function formatCategoryLabel(category: string): string {
  return category
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');
}

export function AdminEditor({ initialProducts, initialSiteContent, adminCanWrite, adminWriteNotice }: AdminEditorProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  const [products, setProducts] = useState<Product[]>(() => initialProducts.map(normalizeMedia));
  const [siteContent, setSiteContent] = useState<SiteContent>(initialSiteContent);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [status, setStatus] = useState('');
  const [taxonomyStatus, setTaxonomyStatus] = useState('');
  const [contentStatus, setContentStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<AdminCategoryFilter>('all');
  const [badgeFilter, setBadgeFilter] = useState<AdminBadgeFilter>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [saleFilter, setSaleFilter] = useState<string>('all');
  const [showSalePanel, setShowSalePanel] = useState(false);
  const [saleSelection, setSaleSelection] = useState<Set<number>>(new Set());
  const [saleDiscountPercent, setSaleDiscountPercent] = useState(20);
  const [newCategory, setNewCategory] = useState('');
  const [newBadge, setNewBadge] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingBadge, setEditingBadge] = useState<string | null>(null);
  const [editingCategoryValue, setEditingCategoryValue] = useState('');
  const [editingBadgeValue, setEditingBadgeValue] = useState('');
  const [profiles, setProfiles] = useState<Array<{ id: string; name: string }>>([]);
  const [profileSearch, setProfileSearch] = useState('');
  const [newProfileName, setNewProfileName] = useState('');
  const [profileStatus, setProfileStatus] = useState('');

  const [isSavingProducts, startSavingProducts] = useTransition();
  const [isSavingContent, startSavingContent] = useTransition();

  const taxonomyCategories = useMemo(
    () =>
      normalizeCategoryList(siteContent.taxonomy?.categories ?? DEFAULT_CATEGORIES).sort((a, b) => a.localeCompare(b)),
    [siteContent.taxonomy?.categories]
  );

  const taxonomyBadges = useMemo(
    () => normalizeBadgeList(siteContent.taxonomy?.badges ?? DEFAULT_BADGES).sort((a, b) => a.localeCompare(b)),
    [siteContent.taxonomy?.badges]
  );

  const categoryOptions = useMemo(() => {
    const dynamic = normalizeCategoryList(products.map((product) => product.category).filter(Boolean));
    return uniqueValues([...taxonomyCategories, ...dynamic]).sort((a, b) => a.localeCompare(b)) as ProductCategory[];
  }, [taxonomyCategories, products]);

  const badgeOptions = useMemo(() => {
    const dynamic = normalizeBadgeList(products.map((product) => product.badge?.trim()).filter(Boolean) as string[]);
    return uniqueValues([...taxonomyBadges, ...dynamic]).sort((a, b) => a.localeCompare(b));
  }, [taxonomyBadges, products]);

  const categoryUsageMap = useMemo(() => {
    const usage = new Map<string, number>();
    products.forEach((product) => {
      const key = normalizeCategoryTerm(product.category);
      usage.set(key, (usage.get(key) ?? 0) + 1);
    });
    return usage;
  }, [products]);

  const badgeUsageMap = useMemo(() => {
    const usage = new Map<string, number>();
    products.forEach((product) => {
      const key = normalizeBadgeTerm(product.badge);
      usage.set(key, (usage.get(key) ?? 0) + 1);
    });
    return usage;
  }, [products]);

  useEffect(() => {
    if (editingIndex !== null && editingIndex >= products.length) {
      setEditingIndex(null);
    }
  }, [editingIndex, products.length]);

  useEffect(() => {
    let active = true;
    fetch('/api/admin/profiles')
      .then((res) => res.json())
      .then((data) => { if (active && data.ok) setProfiles(data.profiles); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  function addProfile() {
    const name = newProfileName.trim();
    if (!name) return;
    const exists = profiles.some((p) => p.name.toLowerCase() === name.toLowerCase());
    if (exists) { setProfileStatus(`"${name}" already exists.`); return; }
    fetch('/api/admin/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setProfiles((prev) => [...prev, { id: data.id, name }]);
          setNewProfileName('');
          setProfileStatus(`"${name}" added.`);
        }
      })
      .catch(() => setProfileStatus('Failed to add profile.'));
  }

  function deleteProfile(id: string) {
    fetch('/api/admin/profiles', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setProfiles((prev) => prev.filter((p) => p.id !== id));
          setProfileStatus('Profile deleted.');
        }
      })
      .catch(() => setProfileStatus('Failed to delete.'));
  }

  const saleCycleParts = useMemo(
    () => cycleSecondsToParts(siteContent.settings?.sale_counter_cycle_seconds ?? 1),
    [siteContent.settings?.sale_counter_cycle_seconds]
  );

  const totalStock = useMemo(() => products.reduce((sum, product) => sum + product.stock, 0), [products]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return products
      .map((product, index) => ({ product, index }))
      .filter(({ product }) => {
        const categoryMatch = categoryFilter === 'all' || product.category === categoryFilter;
        if (!categoryMatch) return false;

        const badgeMatch =
          badgeFilter === 'all' || product.badge.trim().toLowerCase() === badgeFilter.trim().toLowerCase();
        if (!badgeMatch) return false;

        if (stockFilter === 'out-of-stock' && product.stock > 0) return false;
        if (stockFilter === 'low-stock' && (product.stock === 0 || product.stock >= 5)) return false;
        if (stockFilter === 'in-stock' && product.stock <= 0) return false;
        if (stockFilter === 'high-stock' && product.stock < 20) return false;

        if (saleFilter === 'on-sale' && !product.sale_tag_enabled) return false;
        if (saleFilter === 'not-on-sale' && product.sale_tag_enabled) return false;
        if (saleFilter === 'has-reviews' && (!product.reviews || product.reviews.length === 0)) return false;
        if (saleFilter === 'no-reviews' && product.reviews && product.reviews.length > 0) return false;
        if (saleFilter === 'zivaad-choice' && !product.zivaad_choice) return false;

        if (!normalizedSearch) return true;

        const searchable = [product.id, product.name, product.description, product.category, product.badge]
          .join(' ')
          .toLowerCase();

        return searchable.includes(normalizedSearch);
      });
  }, [products, searchTerm, categoryFilter, badgeFilter, stockFilter, saleFilter]);

  const editingProduct = editingIndex !== null ? products[editingIndex] : null;
  const editingProductOptions = useMemo(
    () => normalizeProductOptionDefinitions(editingProduct?.product_options),
    [editingProduct]
  );
  const editingProductVariants = useMemo(
    () => normalizeProductVariantDefinitions(editingProduct?.product_variants, editingProductOptions),
    [editingProduct, editingProductOptions]
  );
  const editingVariantCombinationCount = useMemo(
    () => countOptionCombinations(editingProductOptions),
    [editingProductOptions]
  );
  const duplicateVariantSignatures = useMemo(() => {
    if (editingProductOptions.length === 0 || editingProductVariants.length === 0) {
      return new Set<string>();
    }

    const counts = new Map<string, number>();
    editingProductVariants.forEach((variant) => {
      const signature = buildVariantSignature(editingProductOptions, variant.option_values);
      counts.set(signature, (counts.get(signature) ?? 0) + 1);
    });

    return new Set(Array.from(counts.entries()).filter(([, count]) => count > 1).map(([signature]) => signature));
  }, [editingProductOptions, editingProductVariants]);
  const editingCategoryOptions = useMemo(() => {
    if (!editingProduct) {
      return categoryOptions;
    }

    return uniqueValues([...categoryOptions, normalizeCategoryTerm(editingProduct.category)]).sort((a, b) =>
      a.localeCompare(b)
    ) as ProductCategory[];
  }, [categoryOptions, editingProduct]);

  const editingBadgeOptions = useMemo(() => {
    if (!editingProduct) {
      return badgeOptions;
    }

    return uniqueValues([...badgeOptions, normalizeBadgeTerm(editingProduct.badge)]).sort((a, b) => a.localeCompare(b));
  }, [badgeOptions, editingProduct]);

  function setProductField<K extends keyof Product>(index: number, key: K, value: Product[K]) {
    setProducts((prev) =>
      prev.map((product, currentIndex) => {
        if (currentIndex !== index) {
          return product;
        }

        const updated = { ...product, [key]: value } as Product;

        if (key === 'category') {
          const normalizedCategory = normalizeCategoryTerm(String(value));
          updated.category = (normalizedCategory || product.category) as ProductCategory;
        }

        if (key === 'badge') {
          const normalizedBadge = normalizeBadgeTerm(String(value));
          updated.badge = normalizedBadge || product.badge;
        }

        if (key === 'primary_image_url' || key === 'secondary_image_url' || key === 'gallery_images') {
          return normalizeMedia(updated);
        }

        return updated;
      })
    );
  }

  function setProductOptions(index: number, rawOptions: ProductOption[]) {
    setProducts((prev) =>
      prev.map((product, currentIndex) => {
        if (currentIndex !== index) {
          return product;
        }

        const normalizedOptions = normalizeProductOptionDefinitions(rawOptions);
        const normalizedVariants = normalizeProductVariantDefinitions(product.product_variants, normalizedOptions);
        return normalizeMedia({
          ...product,
          product_options: normalizedOptions,
          product_variants: normalizedVariants
        });
      })
    );
  }

  function addProductOption(index: number) {
    const product = products[index];
    if (!product) {
      return;
    }

    const current = normalizeProductOptionDefinitions(product.product_options);
    const suggestedName = DEFAULT_OPTION_NAMES[current.length] || `Option ${current.length + 1}`;
    setProductOptions(index, [...current, { name: suggestedName, values: ['Default'] }]);
  }

  function updateProductOptionName(index: number, optionIndex: number, value: string) {
    const product = products[index];
    if (!product) {
      return;
    }

    const current = normalizeProductOptionDefinitions(product.product_options);
    const next = current.map((option, idx) => (idx === optionIndex ? { ...option, name: value } : option));
    setProductOptions(index, next);
  }

  function updateProductOptionValues(index: number, optionIndex: number, value: string) {
    const product = products[index];
    if (!product) {
      return;
    }

    const current = normalizeProductOptionDefinitions(product.product_options);
    const next = current.map((option, idx) =>
      idx === optionIndex ? { ...option, values: parseOptionValues(value) } : option
    );
    setProductOptions(index, next);
  }

  function removeProductOption(index: number, optionIndex: number) {
    const product = products[index];
    if (!product) {
      return;
    }

    const current = normalizeProductOptionDefinitions(product.product_options);
    setProductOptions(index, current.filter((_, idx) => idx !== optionIndex));
  }

  function addStandardOptionSet(index: number) {
    const product = products[index];
    if (!product) {
      return;
    }

    const current = normalizeProductOptionDefinitions(product.product_options);
    const existingNames = new Set(current.map((option) => option.name.trim().toLowerCase()));
    const next = [...current];

    if (!existingNames.has('color') && !existingNames.has('colour')) {
      next.push({ name: 'Color', values: ['Gold', 'Silver'] });
    }

    if (!existingNames.has('size')) {
      next.push({ name: 'Size', values: ['6', '7', '8'] });
    }

    setProductOptions(index, next);
    setStatus('Added standard Color and Size options.');
  }

  function setProductVariants(index: number, rawVariants: ProductVariant[]) {
    setProducts((prev) =>
      prev.map((product, currentIndex) => {
        if (currentIndex !== index) {
          return product;
        }

        const normalizedOptions = normalizeProductOptionDefinitions(product.product_options);
        const normalizedVariants = normalizeProductVariantDefinitions(rawVariants, normalizedOptions);
        return normalizeMedia({
          ...product,
          product_options: normalizedOptions,
          product_variants: normalizedVariants
        });
      })
    );
  }

  function addProductVariant(index: number) {
    const product = products[index];
    if (!product) {
      return;
    }

    const options = normalizeProductOptionDefinitions(product.product_options);
    if (options.length === 0) {
      setStatus('Add at least one product option (e.g. Color, Size) before adding variants.');
      return;
    }

    const currentVariants = normalizeProductVariantDefinitions(product.product_variants, options);
    const optionValues = Object.fromEntries(
      options.map((option) => [option.name, option.values[0] || ''])
    ) as Record<string, string>;
    const nextVariant: ProductVariant = {
      id: createVariantId(),
      sku: '',
      title: buildVariantLabel(options, optionValues),
      option_values: optionValues,
      price: product.price,
      compare_price: product.compare_price,
      stock: 0,
      image_url: product.primary_image_url || ''
    };

    setProductVariants(index, [...currentVariants, nextVariant]);
  }

  function regenerateProductVariants(index: number) {
    const product = products[index];
    if (!product) {
      return;
    }

    const options = normalizeProductOptionDefinitions(product.product_options);
    if (options.length === 0) {
      setStatus('Add at least one product option (for example Color or Size) before generating variants.');
      return;
    }

    const combinations = countOptionCombinations(options);
    if (combinations > 250) {
      setStatus(`Too many combinations (${combinations}). Reduce option values before generating variants.`);
      return;
    }

    const generatedVariants = generateVariantsFromOptions(product, options);
    setProductVariants(index, generatedVariants);
    setStatus(`Generated ${generatedVariants.length} variant combinations from current options.`);
  }

  function updateProductVariantField<K extends keyof ProductVariant>(
    index: number,
    variantIndex: number,
    key: K,
    value: ProductVariant[K]
  ) {
    const product = products[index];
    if (!product) {
      return;
    }

    const options = normalizeProductOptionDefinitions(product.product_options);
    const currentVariants = normalizeProductVariantDefinitions(product.product_variants, options);
    const nextVariants = currentVariants.map((variant, idx) => (idx === variantIndex ? { ...variant, [key]: value } : variant));
    setProductVariants(index, nextVariants);
  }

  function updateProductVariantOptionValue(
    index: number,
    variantIndex: number,
    optionName: string,
    optionValue: string
  ) {
    const product = products[index];
    if (!product) {
      return;
    }

    const options = normalizeProductOptionDefinitions(product.product_options);
    const currentVariants = normalizeProductVariantDefinitions(product.product_variants, options);
    const nextVariants = currentVariants.map((variant, idx) =>
      idx === variantIndex
        ? {
            ...variant,
            option_values: {
              ...variant.option_values,
              [optionName]: optionValue
            }
          }
        : variant
    );
    setProductVariants(index, nextVariants);
  }

  function removeProductVariant(index: number, variantIndex: number) {
    const product = products[index];
    if (!product) {
      return;
    }

    const options = normalizeProductOptionDefinitions(product.product_options);
    const currentVariants = normalizeProductVariantDefinitions(product.product_variants, options);
    setProductVariants(index, currentVariants.filter((_, idx) => idx !== variantIndex));
  }

  function updateGalleryImages(index: number, value: string) {
    const gallery = parseUrlTextareaInput(value);

    setProducts((prev) =>
      prev.map((product, currentIndex) => {
        if (currentIndex !== index) {
          return product;
        }

        const primaryEmpty = !product.primary_image_url?.trim();
        const secondaryEmpty = !product.secondary_image_url?.trim();

        const next: Product = {
          ...product,
          gallery_images: gallery,
          images: gallery
        };

        if (primaryEmpty && gallery[0]) {
          next.primary_image_url = gallery[0];
        }

        if (secondaryEmpty && (gallery[1] || gallery[0])) {
          next.secondary_image_url = gallery[1] || gallery[0];
        }

        return normalizeMedia(next);
      })
    );
  }

  function syncImagesFromGallery(index: number) {
    setProducts((prev) =>
      prev.map((product, currentIndex) => {
        if (currentIndex !== index) {
          return product;
        }

        const gallery = product.gallery_images?.filter(Boolean) ?? [];
        if (gallery.length === 0) {
          return product;
        }

        return normalizeMedia({
          ...product,
          primary_image_url: gallery[0],
          secondary_image_url: gallery[1] || gallery[0]
        });
      })
    );
  }

  function updateSiteContent<K extends keyof SiteContent>(section: K, patch: Partial<SiteContent[K]>) {
    setSiteContent((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...patch
      }
    }));
  }

  function updateFooterSocialLink(key: keyof SiteContent['footer']['social_links'], value: string) {
    setSiteContent((prev) => ({
      ...prev,
      footer: {
        ...prev.footer,
        social_links: {
          ...prev.footer.social_links,
          [key]: value
        }
      }
    }));
  }

  function updateVisualStoryImages(value: string) {
    const urls = parseUrlTextareaInput(value);

    updateSiteContent('media', { visual_story_images: urls });
  }

  function updateCategoryCollectionImage(category: string, value: string) {
    const normalizedCategory = normalizeCategoryTerm(category);
    const nextValue = value.trim();

    setSiteContent((prev) => {
      const current = { ...(prev.media.category_collection_images || {}) };
      if (!nextValue) {
        delete current[normalizedCategory];
      } else {
        current[normalizedCategory] = nextValue;
      }

      return {
        ...prev,
        media: {
          ...prev.media,
          category_collection_images: current
        }
      };
    });
  }

  function updateTaxonomy(patch: Partial<SiteContent['taxonomy']>) {
    setSiteContent((prev) => ({
      ...prev,
      taxonomy: {
        ...prev.taxonomy,
        ...patch
      }
    }));
  }

  function addCategoryOption() {
    if (!adminCanWrite) {
      setTaxonomyStatus(adminWriteNotice);
      return;
    }

    const normalized = normalizeCategoryTerm(newCategory);
    if (!normalized) {
      setTaxonomyStatus('Enter a category value before adding.');
      return;
    }

    const current = normalizeCategoryList(siteContent.taxonomy.categories);
    if (current.includes(normalized)) {
      setTaxonomyStatus(`Category "${normalized}" already exists.`);
      return;
    }

    updateTaxonomy({ categories: [...current, normalized].sort((a, b) => a.localeCompare(b)) });
    setNewCategory('');
    setTaxonomyStatus(`Category "${normalized}" added.`);
  }

  function addBadgeOption() {
    if (!adminCanWrite) {
      setTaxonomyStatus(adminWriteNotice);
      return;
    }

    const normalized = normalizeBadgeTerm(newBadge);
    if (!normalized) {
      setTaxonomyStatus('Enter a badge value before adding.');
      return;
    }

    const current = normalizeBadgeList(siteContent.taxonomy.badges);
    if (current.includes(normalized)) {
      setTaxonomyStatus(`Badge "${normalized}" already exists.`);
      return;
    }

    updateTaxonomy({ badges: [...current, normalized].sort((a, b) => a.localeCompare(b)) });
    setNewBadge('');
    setTaxonomyStatus(`Badge "${normalized}" added.`);
  }

  function startCategoryEdit(category: string) {
    setEditingCategory(category);
    setEditingCategoryValue(category);
  }

  function cancelCategoryEdit() {
    setEditingCategory(null);
    setEditingCategoryValue('');
  }

  function saveCategoryEdit(originalCategory: string) {
    if (!adminCanWrite) {
      setTaxonomyStatus(adminWriteNotice);
      return;
    }

    const normalizedOriginal = normalizeCategoryTerm(originalCategory);
    const normalizedNext = normalizeCategoryTerm(editingCategoryValue);
    if (!normalizedNext) {
      setTaxonomyStatus('Category cannot be empty.');
      return;
    }

    if (normalizedNext !== normalizedOriginal && categoryOptions.includes(normalizedNext)) {
      setTaxonomyStatus(`Category "${normalizedNext}" already exists.`);
      return;
    }

    const currentCategories = normalizeCategoryList(siteContent.taxonomy.categories);
    const withOriginal =
      currentCategories.includes(normalizedOriginal) ? currentCategories : [...currentCategories, normalizedOriginal];
    updateTaxonomy({
      categories: normalizeCategoryList(
        withOriginal.map((item) => (normalizeCategoryTerm(item) === normalizedOriginal ? normalizedNext : item))
      ).sort((a, b) => a.localeCompare(b))
    });

    setProducts((prev) =>
      prev.map((product) =>
        normalizeCategoryTerm(product.category) === normalizedOriginal
          ? { ...product, category: normalizedNext as ProductCategory }
          : product
      )
    );

    setSiteContent((prev) => {
      const mapping = { ...(prev.media.category_collection_images || {}) };
      if (mapping[normalizedOriginal]) {
        mapping[normalizedNext] = mapping[normalizedOriginal];
        delete mapping[normalizedOriginal];
      }

      return {
        ...prev,
        media: {
          ...prev.media,
          category_collection_images: mapping
        }
      };
    });

    cancelCategoryEdit();
    setTaxonomyStatus(`Category "${normalizedOriginal}" renamed to "${normalizedNext}".`);
  }

  function removeCategoryOption(category: string) {
    if (!adminCanWrite) {
      setTaxonomyStatus(adminWriteNotice);
      return;
    }

    const normalized = normalizeCategoryTerm(category);
    const managedCategories = normalizeCategoryList(siteContent.taxonomy.categories);
    const isManagedCategory = managedCategories.includes(normalized);
    if (isManagedCategory && managedCategories.length <= 1) {
      setTaxonomyStatus('At least one category is required.');
      return;
    }

    const usageCount = categoryUsageMap.get(normalized) ?? 0;
    if (usageCount > 0) {
      setTaxonomyStatus(`Cannot delete "${normalized}". It is assigned to ${usageCount} product(s).`);
      return;
    }

    const nextCategories = managedCategories.filter((item) => item !== normalized);
    updateTaxonomy({ categories: nextCategories.sort((a, b) => a.localeCompare(b)) });

    setSiteContent((prev) => {
      const mapping = { ...(prev.media.category_collection_images || {}) };
      delete mapping[normalized];

      return {
        ...prev,
        media: {
          ...prev.media,
          category_collection_images: mapping
        }
      };
    });

    if (editingCategory === category) {
      cancelCategoryEdit();
    }

    setTaxonomyStatus(`Category "${normalized}" removed.`);
  }

  function startBadgeEdit(badge: string) {
    setEditingBadge(badge);
    setEditingBadgeValue(badge);
  }

  function cancelBadgeEdit() {
    setEditingBadge(null);
    setEditingBadgeValue('');
  }

  function saveBadgeEdit(originalBadge: string) {
    if (!adminCanWrite) {
      setTaxonomyStatus(adminWriteNotice);
      return;
    }

    const normalizedOriginal = normalizeBadgeTerm(originalBadge);
    const normalizedNext = normalizeBadgeTerm(editingBadgeValue);
    if (!normalizedNext) {
      setTaxonomyStatus('Badge cannot be empty.');
      return;
    }

    if (normalizedNext !== normalizedOriginal && badgeOptions.includes(normalizedNext)) {
      setTaxonomyStatus(`Badge "${normalizedNext}" already exists.`);
      return;
    }

    const currentBadges = normalizeBadgeList(siteContent.taxonomy.badges);
    const withOriginal = currentBadges.includes(normalizedOriginal) ? currentBadges : [...currentBadges, normalizedOriginal];
    updateTaxonomy({
      badges: normalizeBadgeList(withOriginal.map((item) => (normalizeBadgeTerm(item) === normalizedOriginal ? normalizedNext : item))).sort(
        (a, b) => a.localeCompare(b)
      )
    });

    setProducts((prev) =>
      prev.map((product) =>
        normalizeBadgeTerm(product.badge) === normalizedOriginal ? { ...product, badge: normalizedNext } : product
      )
    );

    cancelBadgeEdit();
    setTaxonomyStatus(`Badge "${normalizedOriginal}" renamed to "${normalizedNext}".`);
  }

  function removeBadgeOption(badge: string) {
    if (!adminCanWrite) {
      setTaxonomyStatus(adminWriteNotice);
      return;
    }

    const normalized = normalizeBadgeTerm(badge);
    const managedBadges = normalizeBadgeList(siteContent.taxonomy.badges);
    const isManagedBadge = managedBadges.includes(normalized);
    if (isManagedBadge && managedBadges.length <= 1) {
      setTaxonomyStatus('At least one badge is required.');
      return;
    }

    const usageCount = badgeUsageMap.get(normalized) ?? 0;
    if (usageCount > 0) {
      setTaxonomyStatus(`Cannot delete "${normalized}". It is assigned to ${usageCount} product(s).`);
      return;
    }

    const nextBadges = managedBadges.filter((item) => item !== normalized);
    updateTaxonomy({ badges: nextBadges.sort((a, b) => a.localeCompare(b)) });

    if (editingBadge === badge) {
      cancelBadgeEdit();
    }

    setTaxonomyStatus(`Badge "${normalized}" removed.`);
  }

  function toggleSaleSelection(index: number) {
    setSaleSelection((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function selectAllForSale() {
    setSaleSelection(new Set(products.map((_, i) => i)));
  }

  function clearSaleSelection() {
    setSaleSelection(new Set());
  }

  function applySaleToSelected() {
    if (saleSelection.size === 0) return;
    setProducts((prev) =>
      prev.map((p, i) => {
        if (!saleSelection.has(i)) return p;
        return { ...p, sale_tag_enabled: true };
      })
    );
    setStatus(`Sale enabled on ${saleSelection.size} product(s). Save to apply.`);
  }

  function removeSaleFromSelected() {
    if (saleSelection.size === 0) return;
    setProducts((prev) =>
      prev.map((p, i) => {
        if (!saleSelection.has(i)) return p;
        return { ...p, sale_tag_enabled: false };
      })
    );
    setStatus(`Sale removed from ${saleSelection.size} product(s). Save to apply.`);
  }

  function applyDiscountToSelected() {
    if (saleSelection.size === 0 || saleDiscountPercent <= 0 || saleDiscountPercent >= 100) return;
    setProducts((prev) =>
      prev.map((p, i) => {
        if (!saleSelection.has(i)) return p;
        const basePrice = p.compare_price > 0 ? p.compare_price : p.price;
        const discountedPrice = Math.round(basePrice * (1 - saleDiscountPercent / 100));
        return {
          ...p,
          compare_price: basePrice,
          price: discountedPrice,
          sale_tag_enabled: true
        };
      })
    );
    setStatus(`${saleDiscountPercent}% discount applied to ${saleSelection.size} product(s). Save to apply.`);
  }

  function addProduct() {
    if (typeof window !== 'undefined') {
      window.location.assign('/admin/product/new');
    }
  }

  function removeProduct(index: number) {
    if (!adminCanWrite) {
      setStatus(adminWriteNotice);
      return;
    }

    setProducts((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
    setEditingIndex((prev) => {
      if (prev === null) return null;
      if (prev === index) return null;
      return prev > index ? prev - 1 : prev;
    });
  }

  function openProductEditor(index: number) {
    const target = products[index];
    if (!target) {
      return;
    }

    if (typeof window !== 'undefined') {
      window.location.assign(`/admin/product/${encodeURIComponent(target.id)}`);
    }
  }

  function closeProductEditor() {
    setEditingIndex(null);
  }

  function saveProducts() {
    if (!adminCanWrite) {
      setStatus(adminWriteNotice);
      return;
    }

    setStatus('Saving...');

    startSavingProducts(async () => {
      const payload = products.map(normalizeMedia);
      let result = await saveProductsAction(payload);

      if (!result.ok) {
        try {
          const response = await fetch('/api/admin/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ products: payload })
          });
          const data = (await response.json()) as { ok?: boolean; count?: number; error?: string };

          if (response.ok && data.ok) {
            result = { ok: true, count: data.count ?? payload.length };
          } else {
            result = { ok: false, error: data.error || result.error || 'Failed to save products.' };
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to save products.';
          result = { ok: false, error: `${result.error || 'Save action failed.'} ${message}`.trim() };
        }
      }

      if (!result.ok) {
        setStatus(result.error || 'Failed to save products.');
        return;
      }

      setProducts(payload);
      setStatus(`Saved ${result.count} products to data/products.json. Refresh /shop to verify.`);
    });
  }

  function saveContent() {
    if (!adminCanWrite) {
      setContentStatus(adminWriteNotice);
      return;
    }

    setContentStatus('Saving...');

    startSavingContent(async () => {
      let result = await saveSiteContentAction(siteContent);

      if (!result.ok) {
        try {
          const response = await fetch('/api/admin/site-content', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ siteContent })
          });
          const data = (await response.json()) as { ok?: boolean; error?: string };

          result = response.ok && data.ok ? { ok: true } : { ok: false, error: data.error || result.error };
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to save content.';
          result = { ok: false, error: `${result.error || 'Save action failed.'} ${message}`.trim() };
        }
      }

      if (!result.ok) {
        setContentStatus(result.error || 'Failed to save content.');
        return;
      }

      setContentStatus('Site settings (including taxonomy) saved to data/site-content.json.');
    });
  }

  function saveTaxonomy() {
    if (!adminCanWrite) {
      setTaxonomyStatus(adminWriteNotice);
      return;
    }

    setTaxonomyStatus('Saving...');

    startSavingContent(async () => {
      const productPayload = products.map(normalizeMedia);
      let productResult = await saveProductsAction(productPayload);

      if (!productResult.ok) {
        try {
          const response = await fetch('/api/admin/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ products: productPayload })
          });
          const data = (await response.json()) as { ok?: boolean; count?: number; error?: string };

          if (response.ok && data.ok) {
            productResult = { ok: true, count: data.count ?? productPayload.length };
          } else {
            productResult = { ok: false, error: data.error || productResult.error || 'Failed to save products.' };
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to save products.';
          productResult = { ok: false, error: `${productResult.error || 'Save action failed.'} ${message}`.trim() };
        }
      }

      if (!productResult.ok) {
        setTaxonomyStatus(productResult.error || 'Failed to save product changes.');
        return;
      }

      let contentResult = await saveSiteContentAction(siteContent);

      if (!contentResult.ok) {
        try {
          const response = await fetch('/api/admin/site-content', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ siteContent })
          });
          const data = (await response.json()) as { ok?: boolean; error?: string };
          contentResult = response.ok && data.ok ? { ok: true } : { ok: false, error: data.error || contentResult.error };
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to save content.';
          contentResult = { ok: false, error: `${contentResult.error || 'Save action failed.'} ${message}`.trim() };
        }
      }

      if (!contentResult.ok) {
        setTaxonomyStatus(contentResult.error || 'Failed to save taxonomy.');
        return;
      }

      setProducts(productPayload);
      setContentStatus('Site settings (including taxonomy) saved to data/site-content.json.');
      setTaxonomyStatus(`Taxonomy saved and synced to ${productResult.count} products.`);
    });
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="mb-8 border-b border-stone-200 pb-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-luxury text-stone-500">ZIVAAD Admin</p>
            <h1 className="mt-2 font-serif text-5xl text-stone-950">Catalog & Site Settings</h1>
            <p className="mt-3 text-sm text-stone-600">
              {products.length} products · {totalStock} units in stock · {products.filter(p => p.stock === 0).length} out of stock · {products.filter(p => p.stock > 0 && p.stock < 5).length} low stock · {products.filter(p => p.sale_tag_enabled).length} on sale · {products.filter(p => p.reviews && p.reviews.length > 0).length} with reviews
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('products')}
              className={`border px-4 py-2 text-[11px] uppercase tracking-luxury ${
                activeTab === 'products' ? 'border-stone-950 bg-stone-950 text-white' : 'border-stone-300 text-stone-700'
              }`}
            >
              Products
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('site-settings')}
              className={`border px-4 py-2 text-[11px] uppercase tracking-luxury ${
                activeTab === 'site-settings' ? 'border-stone-950 bg-stone-950 text-white' : 'border-stone-300 text-stone-700'
              }`}
            >
              Site Settings
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('taxonomy')}
              className={`border px-4 py-2 text-[11px] uppercase tracking-luxury ${
                activeTab === 'taxonomy' ? 'border-stone-950 bg-stone-950 text-white' : 'border-stone-300 text-stone-700'
              }`}
            >
              Taxonomy
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('profiles')}
              className={`border px-4 py-2 text-[11px] uppercase tracking-luxury ${
                activeTab === 'profiles' ? 'border-stone-950 bg-stone-950 text-white' : 'border-stone-300 text-stone-700'
              }`}
            >
              Profiles ({profiles.length})
            </button>
          </div>
        </div>
      </div>

      <div
        className={`mb-6 border p-4 text-sm ${
          adminCanWrite ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-200 bg-amber-50 text-amber-900'
        }`}
      >
        {adminWriteNotice}
      </div>

      {activeTab === 'products' ? (
        <>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="grid w-full gap-3 md:grid-cols-2 lg:w-auto lg:grid-cols-[300px_160px_160px_160px_160px_auto]">
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by id, name, description..."
                className="border border-stone-300 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-stone-950"
              />

              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value as AdminCategoryFilter)}
                className="border border-stone-300 bg-white px-3 py-2 text-sm"
              >
                <option value="all">All Categories</option>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {formatCategoryLabel(category)}
                  </option>
                ))}
              </select>

              <select
                value={badgeFilter}
                onChange={(event) => setBadgeFilter(event.target.value as AdminBadgeFilter)}
                className="border border-stone-300 bg-white px-3 py-2 text-sm"
              >
                <option value="all">All Badges</option>
                {badgeOptions.map((badge) => (
                  <option key={badge} value={badge}>
                    {badge}
                  </option>
                ))}
              </select>

              <select
                value={stockFilter}
                onChange={(event) => setStockFilter(event.target.value)}
                className="border border-stone-300 bg-white px-3 py-2 text-sm"
              >
                <option value="all">All Stock</option>
                <option value="out-of-stock">Out of Stock (0)</option>
                <option value="low-stock">Low Stock (1-4)</option>
                <option value="in-stock">In Stock (1+)</option>
                <option value="high-stock">High Stock (20+)</option>
              </select>

              <select
                value={saleFilter}
                onChange={(event) => setSaleFilter(event.target.value)}
                className="border border-stone-300 bg-white px-3 py-2 text-sm"
              >
                <option value="all">All Status</option>
                <option value="on-sale">On Sale</option>
                <option value="not-on-sale">Not On Sale</option>
                <option value="has-reviews">Has Reviews</option>
                <option value="no-reviews">No Reviews</option>
                <option value="zivaad-choice">Zivaad Choice</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                  setBadgeFilter('all');
                  setStockFilter('all');
                  setSaleFilter('all');
                }}
                className="border border-stone-300 px-4 py-2 text-[10px] uppercase tracking-luxury text-stone-700"
              >
                Clear
              </button>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={addProduct}
                disabled={!adminCanWrite}
                className="border border-stone-950 px-5 py-2 text-[11px] uppercase tracking-luxury text-stone-950 disabled:opacity-50"
              >
                Add Product
              </button>
              <button
                type="button"
                onClick={saveProducts}
                disabled={isSavingProducts || !adminCanWrite}
                className="bg-stone-950 px-5 py-2 text-[11px] uppercase tracking-luxury text-white disabled:opacity-50"
              >
                {isSavingProducts ? 'Saving...' : 'Save Products'}
              </button>
            </div>
          </div>

          <div className="mb-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setShowSalePanel(!showSalePanel); if (!showSalePanel) clearSaleSelection(); }}
              className={`border px-4 py-2 text-[10px] uppercase tracking-luxury transition-colors ${showSalePanel ? 'border-[#b89a61] bg-[#b89a61] text-white' : 'border-stone-300 text-stone-700 hover:border-stone-950'}`}
            >
              {showSalePanel ? 'Close Sale Manager' : 'Sale Manager'}
            </button>
          </div>

          {showSalePanel ? (
            <div className="mb-6 border border-[#d9c292] bg-[#fdf8ef] p-4">
              <p className="text-[11px] font-medium uppercase tracking-luxury text-stone-900">Bulk Sale Manager</p>
              <p className="mt-1 text-xs text-stone-500">Select products below, then apply sale or set discount.</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button type="button" onClick={selectAllForSale} className="border border-stone-300 bg-white px-3 py-1.5 text-[10px] uppercase tracking-luxury text-stone-700 hover:border-stone-950">Select All</button>
                <button type="button" onClick={clearSaleSelection} className="border border-stone-300 bg-white px-3 py-1.5 text-[10px] uppercase tracking-luxury text-stone-700 hover:border-stone-950">Clear</button>
                <span className="text-xs text-stone-500">{saleSelection.size} selected</span>
                <span className="mx-1 text-stone-300">|</span>
                <button type="button" onClick={applySaleToSelected} disabled={saleSelection.size === 0 || !adminCanWrite} className="border border-green-600 bg-green-600 px-3 py-1.5 text-[10px] uppercase tracking-luxury text-white disabled:opacity-40">Enable Sale</button>
                <button type="button" onClick={removeSaleFromSelected} disabled={saleSelection.size === 0 || !adminCanWrite} className="border border-red-500 bg-red-500 px-3 py-1.5 text-[10px] uppercase tracking-luxury text-white disabled:opacity-40">Remove Sale</button>
                <span className="mx-1 text-stone-300">|</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={saleDiscountPercent}
                    onChange={(e) => setSaleDiscountPercent(Math.max(1, Math.min(99, Number(e.target.value) || 0)))}
                    className="w-16 border border-stone-300 bg-white px-2 py-1.5 text-center text-sm outline-none focus:border-stone-950"
                  />
                  <span className="text-xs text-stone-500">%</span>
                  <button type="button" onClick={applyDiscountToSelected} disabled={saleSelection.size === 0 || !adminCanWrite} className="border border-[#b89a61] bg-[#b89a61] px-3 py-1.5 text-[10px] uppercase tracking-luxury text-white disabled:opacity-40">Apply Discount</button>
                </div>
              </div>
            </div>
          ) : null}

          {status ? <p className="mb-5 text-sm text-stone-700">{status}</p> : null}

          {filteredProducts.length === 0 ? (
            <div className="border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-600">
              No products match your current search/filter.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map(({ product, index }) => (
                <article key={`${product.id}-${index}`} className={`border bg-white p-4 ${showSalePanel && saleSelection.has(index) ? 'border-[#b89a61] ring-1 ring-[#b89a61]' : 'border-stone-200'}`}>
                  {showSalePanel ? (
                    <label className="mb-2 flex cursor-pointer items-center gap-2">
                      <input type="checkbox" checked={saleSelection.has(index)} onChange={() => toggleSaleSelection(index)} className="h-4 w-4 accent-[#b89a61]" />
                      <span className="text-[10px] uppercase tracking-luxury text-stone-600">Select for sale</span>
                      {product.sale_tag_enabled ? (
                        <span className="ml-auto rounded bg-[#b89a61] px-1.5 py-0.5 text-[8px] font-medium uppercase text-white">Sale On</span>
                      ) : null}
                    </label>
                  ) : null}
                  <div className="relative aspect-[4/5] overflow-hidden border border-stone-200 bg-stone-100">
                    <Image
                      src={product.primary_image_url || product.images[0] || fallbackImage}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover"
                    />
                    <span className="absolute left-3 top-3 bg-white/90 px-2 py-1 text-[10px] uppercase tracking-luxury text-stone-700">
                      {product.badge || 'NEW'}
                    </span>
                    {product.sale_tag_enabled && product.compare_price > product.price ? (
                      <span className="absolute right-3 top-3 bg-[#b89a61] px-2 py-1 text-[9px] font-medium text-white">
                        {Math.round((1 - product.price / product.compare_price) * 100)}% Off
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3">
                    <p className="truncate font-medium text-stone-950">{product.name}</p>
                    <p className="mt-1 text-xs uppercase tracking-luxury text-stone-500">{product.id}</p>
                    <div className="mt-2 flex items-center gap-2 text-sm">
                      <span className="font-medium text-stone-900">PKR {product.price.toLocaleString()}</span>
                      {product.compare_price > product.price ? (
                        <span className="text-stone-400 line-through">PKR {product.compare_price.toLocaleString()}</span>
                      ) : null}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] uppercase tracking-luxury text-stone-500">
                      <span>{product.category}</span>
                      <span>Stock: {product.stock}</span>
                    </div>
                    <p className="mt-2 text-[10px] uppercase tracking-luxury text-stone-500">
                      Variants: {(product.product_variants || []).length}
                    </p>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => openProductEditor(index)}
                      className="flex-1 border border-stone-300 px-3 py-2 text-[10px] uppercase tracking-luxury text-stone-700"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => removeProduct(index)}
                      disabled={!adminCanWrite}
                      className="flex-1 border border-stone-300 px-3 py-2 text-[10px] uppercase tracking-luxury text-stone-700 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {editingProduct && editingIndex !== null ? (
            <div className="fixed inset-0 z-[80] bg-black/30" onClick={closeProductEditor}>
              <aside
                className="absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto bg-white p-6 shadow-2xl sm:p-8"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="mb-6 flex items-start justify-between gap-3 border-b border-stone-200 pb-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-luxury text-stone-500">Edit Product</p>
                    <h2 className="mt-2 font-serif text-4xl text-stone-950">{editingProduct.name || 'Untitled Piece'}</h2>
                    <p className="mt-2 text-xs uppercase tracking-luxury text-stone-500">{editingProduct.id}</p>
                  </div>
                  <button
                    type="button"
                    onClick={closeProductEditor}
                    className="border border-stone-300 px-3 py-1 text-[10px] uppercase tracking-luxury text-stone-700"
                  >
                    Close
                  </button>
                </div>

                <fieldset disabled={!adminCanWrite} className="space-y-6 disabled:opacity-70">
                  <div className="relative aspect-[16/10] overflow-hidden border border-stone-200 bg-stone-100">
                    <Image
                      src={editingProduct.primary_image_url || editingProduct.images[0] || fallbackImage}
                      alt={editingProduct.name}
                      fill
                      sizes="(max-width: 1024px) 100vw, 600px"
                      className="object-cover"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <FieldLabel>ID</FieldLabel>
                      <input
                        value={editingProduct.id}
                        onChange={(event) => setProductField(editingIndex, 'id', event.target.value)}
                        className="w-full border border-stone-300 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <FieldLabel>Name</FieldLabel>
                      <input
                        value={editingProduct.name}
                        onChange={(event) => setProductField(editingIndex, 'name', event.target.value)}
                        className="w-full border border-stone-300 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <FieldLabel>Description</FieldLabel>
                    <textarea
                      value={editingProduct.description}
                      onChange={(event) => setProductField(editingIndex, 'description', event.target.value)}
                      rows={3}
                      className="w-full resize-y border border-stone-300 bg-white px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-2">
                      <FieldLabel>Price</FieldLabel>
                      <input
                        type="number"
                        value={editingProduct.price}
                        onChange={(event) => setProductField(editingIndex, 'price', toNumber(event.target.value))}
                        className="w-full border border-stone-300 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <FieldLabel>Compare Price</FieldLabel>
                      <input
                        type="number"
                        value={editingProduct.compare_price}
                        onChange={(event) => setProductField(editingIndex, 'compare_price', toNumber(event.target.value))}
                        className="w-full border border-stone-300 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <FieldLabel>Stock</FieldLabel>
                      <input
                        type="number"
                        value={editingProduct.stock}
                        onChange={(event) => setProductField(editingIndex, 'stock', toNumber(event.target.value))}
                        disabled={editingProductVariants.length > 0}
                        className="w-full border border-stone-300 bg-white px-3 py-2 text-sm"
                      />
                      {editingProductVariants.length > 0 ? (
                        <p className="text-[10px] uppercase tracking-luxury text-stone-500">
                          Auto-calculated from variant stock.
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-3 border border-stone-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <FieldLabel>Product Options (Color, Ring Size, Finish, etc.)</FieldLabel>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => addStandardOptionSet(editingIndex)}
                          className="border border-stone-950 px-3 py-1 text-[10px] uppercase tracking-luxury text-stone-950"
                        >
                          Add Color + Size
                        </button>
                        <button
                          type="button"
                          onClick={() => addProductOption(editingIndex)}
                          className="border border-stone-300 px-3 py-1 text-[10px] uppercase tracking-luxury text-stone-700"
                        >
                          Add Option
                        </button>
                      </div>
                    </div>

                    {editingProductOptions.length === 0 ? (
                      <p className="text-sm text-stone-500">
                        No options yet. Add options first, then create variant combinations.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {editingProductOptions.map((option, optionIndex) => (
                          <div key={`${option.name}-${optionIndex}`} className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
                            <input
                              value={option.name}
                              onChange={(event) => updateProductOptionName(editingIndex, optionIndex, event.target.value)}
                              placeholder="Option name (e.g. Color)"
                              className="w-full border border-stone-300 bg-white px-3 py-2 text-sm"
                            />
                            <input
                              value={formatOptionValues(option)}
                              onChange={(event) => updateProductOptionValues(editingIndex, optionIndex, event.target.value)}
                              placeholder="Values comma separated (e.g. Gold, Silver, Rose Gold)"
                              className="w-full border border-stone-300 bg-white px-3 py-2 text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => removeProductOption(editingIndex, optionIndex)}
                              className="border border-stone-300 px-3 py-2 text-[10px] uppercase tracking-luxury text-stone-700"
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 border border-stone-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <FieldLabel>Product Variants</FieldLabel>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => regenerateProductVariants(editingIndex)}
                          className="border border-stone-950 px-3 py-1 text-[10px] uppercase tracking-luxury text-stone-950"
                        >
                          Generate / Refresh
                        </button>
                        <button
                          type="button"
                          onClick={() => addProductVariant(editingIndex)}
                          className="border border-stone-300 px-3 py-1 text-[10px] uppercase tracking-luxury text-stone-700"
                        >
                          Add Manual
                        </button>
                      </div>
                    </div>

                    {editingProductOptions.length > 0 ? (
                      <div className="flex flex-wrap items-center justify-between gap-2 border border-stone-200 bg-stone-50 px-3 py-2">
                        <p className="text-xs text-stone-700">
                          {editingVariantCombinationCount} possible combinations from current options.
                        </p>
                        <p className="text-[10px] uppercase tracking-luxury text-stone-500">
                          Generate after changing option names or values.
                        </p>
                      </div>
                    ) : null}

                    {editingProductVariants.length === 0 ? (
                      <p className="text-sm text-stone-500">
                        No variants yet. Add options first, then use Generate / Refresh to build clean combinations.
                      </p>
                    ) : (
                      <div className="overflow-x-auto border border-stone-200">
                        <table className="min-w-[1040px] w-full border-collapse">
                          <thead className="bg-stone-50">
                            <tr>
                              <th className="border-b border-stone-200 px-3 py-2 text-left text-[10px] uppercase tracking-luxury text-stone-500">
                                Combination
                              </th>
                              <th className="border-b border-stone-200 px-3 py-2 text-left text-[10px] uppercase tracking-luxury text-stone-500">
                                SKU
                              </th>
                              <th className="border-b border-stone-200 px-3 py-2 text-left text-[10px] uppercase tracking-luxury text-stone-500">
                                Price
                              </th>
                              <th className="border-b border-stone-200 px-3 py-2 text-left text-[10px] uppercase tracking-luxury text-stone-500">
                                Compare
                              </th>
                              <th className="border-b border-stone-200 px-3 py-2 text-left text-[10px] uppercase tracking-luxury text-stone-500">
                                Stock
                              </th>
                              <th className="border-b border-stone-200 px-3 py-2 text-left text-[10px] uppercase tracking-luxury text-stone-500">
                                Image URL
                              </th>
                              <th className="border-b border-stone-200 px-3 py-2 text-left text-[10px] uppercase tracking-luxury text-stone-500">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {editingProductVariants.map((variant, variantIndex) => {
                              const signature = buildVariantSignature(editingProductOptions, variant.option_values);
                              const isDuplicate = duplicateVariantSignatures.has(signature);
                              const variantLabel = buildVariantLabel(editingProductOptions, variant.option_values);

                              return (
                                <tr key={`${variant.id}-${variantIndex}`} className="align-top">
                                  <td className="border-b border-stone-200 px-3 py-2">
                                    <p className="text-sm text-stone-900">{variantLabel || variant.title || 'Variant'}</p>
                                    {isDuplicate ? (
                                      <p className="mt-1 text-[10px] uppercase tracking-luxury text-red-700">
                                        Duplicate combination
                                      </p>
                                    ) : null}
                                    <p className="mt-1 text-[10px] uppercase tracking-luxury text-stone-500">{variant.id}</p>
                                    <div className="mt-2 space-y-1.5">
                                      {editingProductOptions.map((option) => (
                                        <label
                                          key={`${variant.id}-${option.name}`}
                                          className="grid grid-cols-[70px_minmax(0,1fr)] items-center gap-2"
                                        >
                                          <span className="truncate text-[10px] uppercase tracking-luxury text-stone-500">
                                            {option.name}
                                          </span>
                                          <select
                                            value={variant.option_values[option.name] || option.values[0] || ''}
                                            onChange={(event) =>
                                              updateProductVariantOptionValue(
                                                editingIndex,
                                                variantIndex,
                                                option.name,
                                                event.target.value
                                              )
                                            }
                                            className="w-full border border-stone-300 bg-white px-2 py-1.5 text-xs"
                                          >
                                            {option.values.map((value) => (
                                              <option key={`${option.name}-${value}`} value={value}>
                                                {value}
                                              </option>
                                            ))}
                                          </select>
                                        </label>
                                      ))}
                                    </div>
                                  </td>

                                  <td className="border-b border-stone-200 px-3 py-2">
                                    <input
                                      value={variant.sku || ''}
                                      onChange={(event) =>
                                        updateProductVariantField(editingIndex, variantIndex, 'sku', event.target.value)
                                      }
                                      className="w-[150px] border border-stone-300 bg-white px-2 py-1.5 text-xs"
                                      placeholder="SKU"
                                    />
                                  </td>

                                  <td className="border-b border-stone-200 px-3 py-2">
                                    <input
                                      type="number"
                                      value={variant.price ?? ''}
                                      onChange={(event) =>
                                        updateProductVariantField(
                                          editingIndex,
                                          variantIndex,
                                          'price',
                                          event.target.value ? toNumber(event.target.value) : undefined
                                        )
                                      }
                                      className="w-[110px] border border-stone-300 bg-white px-2 py-1.5 text-xs"
                                    />
                                  </td>

                                  <td className="border-b border-stone-200 px-3 py-2">
                                    <input
                                      type="number"
                                      value={variant.compare_price ?? ''}
                                      onChange={(event) =>
                                        updateProductVariantField(
                                          editingIndex,
                                          variantIndex,
                                          'compare_price',
                                          event.target.value ? toNumber(event.target.value) : undefined
                                        )
                                      }
                                      className="w-[110px] border border-stone-300 bg-white px-2 py-1.5 text-xs"
                                    />
                                  </td>

                                  <td className="border-b border-stone-200 px-3 py-2">
                                    <input
                                      type="number"
                                      value={variant.stock}
                                      onChange={(event) =>
                                        updateProductVariantField(editingIndex, variantIndex, 'stock', toNumber(event.target.value))
                                      }
                                      className="w-[90px] border border-stone-300 bg-white px-2 py-1.5 text-xs"
                                    />
                                  </td>

                                  <td className="border-b border-stone-200 px-3 py-2">
                                    <input
                                      value={variant.image_url || ''}
                                      onChange={(event) =>
                                        updateProductVariantField(editingIndex, variantIndex, 'image_url', event.target.value)
                                      }
                                      placeholder="https://..."
                                      className="w-[230px] border border-stone-300 bg-white px-2 py-1.5 text-xs"
                                    />
                                  </td>

                                  <td className="border-b border-stone-200 px-3 py-2">
                                    <div className="flex flex-col gap-2">
                                      <input
                                        value={variant.title || ''}
                                        onChange={(event) =>
                                          updateProductVariantField(editingIndex, variantIndex, 'title', event.target.value)
                                        }
                                        placeholder="Custom title"
                                        className="w-[160px] border border-stone-300 bg-white px-2 py-1.5 text-xs"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => removeProductVariant(editingIndex, variantIndex)}
                                        className="border border-stone-300 px-3 py-1 text-[10px] uppercase tracking-luxury text-stone-700"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <FieldLabel>Category</FieldLabel>
                      <select
                        value={editingProduct.category}
                        onChange={(event) => setProductField(editingIndex, 'category', event.target.value as ProductCategory)}
                        className="w-full border border-stone-300 bg-white px-3 py-2 text-sm"
                      >
                        {editingCategoryOptions.map((category) => (
                          <option key={category} value={category}>
                            {formatCategoryLabel(category)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <FieldLabel>Badge</FieldLabel>
                      <select
                        value={editingProduct.badge}
                        onChange={(event) => setProductField(editingIndex, 'badge', event.target.value)}
                        className="w-full border border-stone-300 bg-white px-3 py-2 text-sm"
                      >
                        {editingBadgeOptions.map((badge) => (
                          <option key={badge} value={badge}>
                            {badge}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <FieldLabel>Cloudinary Video URL</FieldLabel>
                    <input
                      value={editingProduct.video_url}
                      onChange={(event) => setProductField(editingIndex, 'video_url', event.target.value)}
                      className="w-full border border-stone-300 bg-white px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <FieldLabel>Primary Image URL</FieldLabel>
                      <input
                        value={editingProduct.primary_image_url || ''}
                        onChange={(event) => setProductField(editingIndex, 'primary_image_url', event.target.value)}
                        className="w-full border border-stone-300 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <FieldLabel>Secondary Image URL</FieldLabel>
                      <input
                        value={editingProduct.secondary_image_url || ''}
                        onChange={(event) => setProductField(editingIndex, 'secondary_image_url', event.target.value)}
                        className="w-full border border-stone-300 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <FieldLabel>Gallery Images (one URL per line or comma separated)</FieldLabel>
                      <button
                        type="button"
                        onClick={() => syncImagesFromGallery(editingIndex)}
                        className="border border-stone-300 px-3 py-1 text-[10px] uppercase tracking-luxury text-stone-700"
                      >
                        Sync Images
                      </button>
                    </div>
                    <textarea
                      value={(editingProduct.gallery_images || []).join('\n')}
                      onChange={(event) => updateGalleryImages(editingIndex, event.target.value)}
                      rows={4}
                      className="w-full resize-y border border-stone-300 bg-white px-3 py-2 text-sm"
                    />
                  </div>
                </fieldset>

                <div className="mt-7 flex flex-wrap justify-end gap-2 border-t border-stone-200 pt-4">
                  <button
                    type="button"
                    onClick={closeProductEditor}
                    className="border border-stone-300 px-4 py-2 text-[10px] uppercase tracking-luxury text-stone-700"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={saveProducts}
                    disabled={!adminCanWrite || isSavingProducts}
                    className="bg-stone-950 px-5 py-2 text-[10px] uppercase tracking-luxury text-white disabled:opacity-50"
                  >
                    {isSavingProducts ? 'Saving...' : 'Save Products'}
                  </button>
                </div>
              </aside>
            </div>
          ) : null}
        </>
      ) : activeTab === 'taxonomy' ? (
        <section className="border border-stone-200 bg-white p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-stone-200 pb-4">
            <div>
              <p className="text-[10px] uppercase tracking-luxury text-stone-500">Catalog Structure</p>
              <h2 className="mt-1 font-serif text-3xl text-stone-950">Categories & Badges</h2>
              <p className="mt-2 text-sm text-stone-600">
                Manage selectable values used while adding or editing products.
              </p>
            </div>
            <button
              type="button"
              onClick={saveTaxonomy}
              disabled={isSavingContent || !adminCanWrite}
              className="bg-stone-950 px-6 py-2 text-[11px] uppercase tracking-luxury text-white disabled:opacity-50"
            >
              {isSavingContent ? 'Saving...' : 'Save Taxonomy'}
            </button>
          </div>

          {taxonomyStatus ? <p className="mb-3 text-sm text-stone-700">{taxonomyStatus}</p> : null}
          {contentStatus ? <p className="mb-5 text-sm text-stone-700">{contentStatus}</p> : null}

          <fieldset disabled={!adminCanWrite} className="grid gap-6 lg:grid-cols-2 disabled:opacity-70">
            <article className="border border-stone-200 p-4">
              <p className="text-[10px] uppercase tracking-luxury text-stone-500">Categories</p>
              <div className="mt-3 flex gap-2">
                <input
                  value={newCategory}
                  onChange={(event) => setNewCategory(event.target.value)}
                  placeholder="Add new category (e.g. anklets)"
                  className="w-full border border-stone-300 bg-white px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={addCategoryOption}
                  className="border border-stone-950 px-4 py-2 text-[10px] uppercase tracking-luxury text-stone-950"
                >
                  Add
                </button>
              </div>

              <div className="mt-4 space-y-2">
                {categoryOptions.length === 0 ? (
                  <p className="text-sm text-stone-500">No categories defined.</p>
                ) : (
                  categoryOptions.map((category) => {
                    const usageCount = categoryUsageMap.get(category) ?? 0;
                    const isEditing = editingCategory === category;

                    return (
                      <div key={category} className="flex items-center gap-2 border border-stone-200 px-3 py-2">
                        <div className="min-w-0 flex-1">
                          {isEditing ? (
                            <input
                              value={editingCategoryValue}
                              onChange={(event) => setEditingCategoryValue(event.target.value)}
                              className="w-full border border-stone-300 bg-white px-2 py-1 text-sm"
                            />
                          ) : (
                            <>
                              <p className="truncate text-sm text-stone-900">{formatCategoryLabel(category)}</p>
                              <p className="text-[10px] uppercase tracking-luxury text-stone-500">
                                {usageCount} product{usageCount === 1 ? '' : 's'}
                              </p>
                            </>
                          )}
                        </div>
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => saveCategoryEdit(category)}
                              className="border border-stone-300 px-3 py-1 text-[10px] uppercase tracking-luxury text-stone-700"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={cancelCategoryEdit}
                              className="border border-stone-300 px-3 py-1 text-[10px] uppercase tracking-luxury text-stone-700"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startCategoryEdit(category)}
                              className="border border-stone-300 px-3 py-1 text-[10px] uppercase tracking-luxury text-stone-700"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => removeCategoryOption(category)}
                              disabled={usageCount > 0}
                              className="border border-stone-300 px-3 py-1 text-[10px] uppercase tracking-luxury text-stone-700 disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </article>

            <article className="border border-stone-200 p-4">
              <p className="text-[10px] uppercase tracking-luxury text-stone-500">Badges</p>
              <div className="mt-3 flex gap-2">
                <input
                  value={newBadge}
                  onChange={(event) => setNewBadge(event.target.value)}
                  placeholder="Add new badge (e.g. EXCLUSIVE)"
                  className="w-full border border-stone-300 bg-white px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={addBadgeOption}
                  className="border border-stone-950 px-4 py-2 text-[10px] uppercase tracking-luxury text-stone-950"
                >
                  Add
                </button>
              </div>

              <div className="mt-4 space-y-2">
                {badgeOptions.length === 0 ? (
                  <p className="text-sm text-stone-500">No badges defined.</p>
                ) : (
                  badgeOptions.map((badge) => {
                    const usageCount = badgeUsageMap.get(badge) ?? 0;
                    const isEditing = editingBadge === badge;

                    return (
                      <div key={badge} className="flex items-center gap-2 border border-stone-200 px-3 py-2">
                        <div className="min-w-0 flex-1">
                          {isEditing ? (
                            <input
                              value={editingBadgeValue}
                              onChange={(event) => setEditingBadgeValue(event.target.value)}
                              className="w-full border border-stone-300 bg-white px-2 py-1 text-sm"
                            />
                          ) : (
                            <>
                              <p className="truncate text-sm text-stone-900">{badge}</p>
                              <p className="text-[10px] uppercase tracking-luxury text-stone-500">
                                {usageCount} product{usageCount === 1 ? '' : 's'}
                              </p>
                            </>
                          )}
                        </div>
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => saveBadgeEdit(badge)}
                              className="border border-stone-300 px-3 py-1 text-[10px] uppercase tracking-luxury text-stone-700"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={cancelBadgeEdit}
                              className="border border-stone-300 px-3 py-1 text-[10px] uppercase tracking-luxury text-stone-700"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startBadgeEdit(badge)}
                              className="border border-stone-300 px-3 py-1 text-[10px] uppercase tracking-luxury text-stone-700"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => removeBadgeOption(badge)}
                              disabled={usageCount > 0}
                              className="border border-stone-300 px-3 py-1 text-[10px] uppercase tracking-luxury text-stone-700 disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </article>
          </fieldset>
        </section>
      ) : (
        <section className="border border-stone-200 bg-white p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-stone-200 pb-4">
            <div>
              <p className="text-[10px] uppercase tracking-luxury text-stone-500">Website Content</p>
              <h2 className="mt-1 font-serif text-3xl text-stone-950">Site Settings</h2>
            </div>
            <button
              type="button"
              onClick={saveContent}
              disabled={isSavingContent || !adminCanWrite}
              className="bg-stone-950 px-6 py-2 text-[11px] uppercase tracking-luxury text-white disabled:opacity-50"
            >
              {isSavingContent ? 'Saving...' : 'Save Content'}
            </button>
          </div>

          {contentStatus ? <p className="mb-5 text-sm text-stone-700">{contentStatus}</p> : null}

          <fieldset disabled={!adminCanWrite} className="grid gap-5 disabled:opacity-70">
            <article className="border border-stone-200 p-4">
              <p className="text-[10px] uppercase tracking-luxury text-stone-500">Hero Banner</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <input
                  value={siteContent.hero.image_url}
                  onChange={(event) => updateSiteContent('hero', { image_url: event.target.value })}
                  placeholder="Hero image URL"
                  className="border border-stone-300 bg-white px-3 py-2 text-sm sm:col-span-2"
                />
                <label className="flex items-center gap-2 text-xs text-stone-700 sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={siteContent.hero.gradient_enabled}
                    onChange={(event) => updateSiteContent('hero', { gradient_enabled: event.target.checked })}
                    className="h-4 w-4 border border-stone-300"
                  />
                  Enable hero gradient overlay
                </label>
                <input
                  value={siteContent.hero.overlay_gradient}
                  onChange={(event) => updateSiteContent('hero', { overlay_gradient: event.target.value })}
                  placeholder="Hero overlay gradient (CSS)"
                  className="border border-stone-300 bg-white px-3 py-2 text-sm sm:col-span-2 disabled:bg-stone-100"
                  disabled={!siteContent.hero.gradient_enabled}
                />
                <input
                  value={siteContent.hero.eyebrow}
                  onChange={(event) => updateSiteContent('hero', { eyebrow: event.target.value })}
                  placeholder="Hero eyebrow"
                  className="border border-stone-300 bg-white px-3 py-2 text-sm"
                />
                <input
                  value={siteContent.hero.title}
                  onChange={(event) => updateSiteContent('hero', { title: event.target.value })}
                  placeholder="Hero title"
                  className="border border-stone-300 bg-white px-3 py-2 text-sm"
                />
                <input
                  value={siteContent.hero.subtitle}
                  onChange={(event) => updateSiteContent('hero', { subtitle: event.target.value })}
                  placeholder="Hero subtitle"
                  className="border border-stone-300 bg-white px-3 py-2 text-sm sm:col-span-2"
                />
                <input
                  value={siteContent.hero.primary_cta_label}
                  onChange={(event) => updateSiteContent('hero', { primary_cta_label: event.target.value })}
                  placeholder="Primary button label"
                  className="border border-stone-300 bg-white px-3 py-2 text-sm"
                />
                <input
                  value={siteContent.hero.primary_cta_href}
                  onChange={(event) => updateSiteContent('hero', { primary_cta_href: event.target.value })}
                  placeholder="Primary button link"
                  className="border border-stone-300 bg-white px-3 py-2 text-sm"
                />
                <input
                  value={siteContent.hero.secondary_cta_label}
                  onChange={(event) => updateSiteContent('hero', { secondary_cta_label: event.target.value })}
                  placeholder="Secondary button label"
                  className="border border-stone-300 bg-white px-3 py-2 text-sm"
                />
                <input
                  value={siteContent.hero.secondary_cta_href}
                  onChange={(event) => updateSiteContent('hero', { secondary_cta_href: event.target.value })}
                  placeholder="Secondary button link"
                  className="border border-stone-300 bg-white px-3 py-2 text-sm"
                />
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <ImageUrlPreview url={siteContent.hero.image_url} label="Hero Image Preview" />
                <div className="grid gap-4">
                  <GradientPreview
                    label="Hero Gradient Preview"
                    gradient={siteContent.hero.overlay_gradient}
                    enabled={siteContent.hero.gradient_enabled}
                  />
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-luxury text-stone-500">Hero Link Preview</p>
                    <div className="space-y-2">
                      <LinkPreview label="Primary CTA Link" url={siteContent.hero.primary_cta_href} />
                      <LinkPreview label="Secondary CTA Link" url={siteContent.hero.secondary_cta_href} />
                    </div>
                  </div>
                </div>
              </div>
            </article>

            <article className="border border-stone-200 p-4">
              <p className="text-[10px] uppercase tracking-luxury text-stone-500">Media</p>
              <div className="mt-3 grid gap-3">
                <input
                  value={siteContent.media.storytelling_video_url}
                  onChange={(event) => updateSiteContent('media', { storytelling_video_url: event.target.value })}
                  placeholder="Storytelling video URL"
                  className="border border-stone-300 bg-white px-3 py-2 text-sm"
                />
                <input
                  value={siteContent.media.editorial_banner_image_url}
                  onChange={(event) => updateSiteContent('media', { editorial_banner_image_url: event.target.value })}
                  placeholder="Editorial banner image URL"
                  className="border border-stone-300 bg-white px-3 py-2 text-sm"
                />
                <label className="flex items-center gap-2 text-xs text-stone-700">
                  <input
                    type="checkbox"
                    checked={siteContent.media.editorial_banner_gradient_enabled}
                    onChange={(event) =>
                      updateSiteContent('media', { editorial_banner_gradient_enabled: event.target.checked })
                    }
                    className="h-4 w-4 border border-stone-300"
                  />
                  Enable editorial gradient overlay
                </label>
                <input
                  value={siteContent.media.editorial_banner_overlay_gradient}
                  onChange={(event) =>
                    updateSiteContent('media', { editorial_banner_overlay_gradient: event.target.value })
                  }
                  placeholder="Editorial banner overlay gradient (CSS)"
                  className="border border-stone-300 bg-white px-3 py-2 text-sm disabled:bg-stone-100"
                  disabled={!siteContent.media.editorial_banner_gradient_enabled}
                />
                <textarea
                  value={(siteContent.media.visual_story_images || []).join('\n')}
                  onChange={(event) => updateVisualStoryImages(event.target.value)}
                  rows={4}
                  placeholder="Visual Story image URLs (one per line or comma separated)"
                  className="resize-y border border-stone-300 bg-white px-3 py-2 text-sm"
                />
                <div className="space-y-3 border-t border-stone-200 pt-4">
                  <p className="text-[10px] uppercase tracking-luxury text-stone-500">Category Collection Images</p>
                  <p className="text-xs text-stone-600">
                    Add one Cloudinary image URL per category for the home Collections section.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {categoryOptions.map((category) => (
                      <div key={`collection-image-${category}`} className="space-y-2">
                        <p className="text-[10px] uppercase tracking-luxury text-stone-500">{formatCategoryLabel(category)}</p>
                        <input
                          value={(siteContent.media.category_collection_images || {})[category] || ''}
                          onChange={(event) => updateCategoryCollectionImage(category, event.target.value)}
                          placeholder={`${formatCategoryLabel(category)} image URL`}
                          className="w-full border border-stone-300 bg-white px-3 py-2 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-4">
                <div className="grid gap-4 lg:grid-cols-2">
                  <VideoUrlPreview url={siteContent.media.storytelling_video_url} label="Storytelling Video Preview" />
                  <div className="grid gap-4">
                    <ImageUrlPreview
                      url={siteContent.media.editorial_banner_image_url}
                      label="Editorial Banner Preview"
                    />
                    <GradientPreview
                      label="Editorial Gradient Preview"
                      gradient={siteContent.media.editorial_banner_overlay_gradient}
                      enabled={siteContent.media.editorial_banner_gradient_enabled}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-luxury text-stone-500">Visual Story Gallery Preview</p>
                  {(siteContent.media.visual_story_images || []).length === 0 ? (
                    <div className="border border-dashed border-stone-300 p-4 text-xs text-stone-500">
                      Add visual story image URLs to preview them here.
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {siteContent.media.visual_story_images.map((url, index) => (
                        <ImageUrlPreview key={`${url}-${index}`} url={url} label={`Image ${index + 1}`} aspectClass="aspect-square" />
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-luxury text-stone-500">Category Collection Image Preview</p>
                  {categoryOptions.length === 0 ? (
                    <div className="border border-dashed border-stone-300 p-4 text-xs text-stone-500">
                      Add categories first to manage category collection images.
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {categoryOptions.map((category) => (
                        <ImageUrlPreview
                          key={`collection-preview-${category}`}
                          url={(siteContent.media.category_collection_images || {})[category] || ''}
                          label={formatCategoryLabel(category)}
                          aspectClass="aspect-square"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </article>

            <article className="border border-stone-200 p-4">
              <p className="text-[10px] uppercase tracking-luxury text-stone-500">Catalog Behavior</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-2 border border-stone-300 px-3 py-2 text-xs text-stone-700 sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={Boolean(siteContent.settings?.shuffle_shop_before_filter)}
                    onChange={(event) =>
                      updateSiteContent('settings', { shuffle_shop_before_filter: event.target.checked })
                    }
                    className="h-4 w-4 border border-stone-300"
                  />
                  Shuffle products on Shop and Home before users apply filters
                </label>
              </div>

              <div className="mt-4 grid gap-3 border-t border-stone-200 pt-4">
                <p className="text-[10px] uppercase tracking-luxury text-stone-500">Top Announcement Strips</p>
                <label className="flex items-center gap-2 border border-stone-300 px-3 py-2 text-xs text-stone-700">
                  <input
                    type="checkbox"
                    checked={Boolean(siteContent.settings?.sale_counter_enabled)}
                    onChange={(event) => updateSiteContent('settings', { sale_counter_enabled: event.target.checked })}
                    className="h-4 w-4 border border-stone-300"
                  />
                  Enable sale counter strip
                </label>
                <label className="flex items-center gap-2 border border-stone-300 px-3 py-2 text-xs text-stone-700">
                  <input
                    type="checkbox"
                    checked={Boolean(siteContent.settings?.sale_counter_repeat_enabled)}
                    onChange={(event) =>
                      updateSiteContent('settings', { sale_counter_repeat_enabled: event.target.checked })
                    }
                    className="h-4 w-4 border border-stone-300"
                  />
                  Repeat countdown automatically after timer ends
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    value={siteContent.settings.sale_counter_title}
                    onChange={(event) => updateSiteContent('settings', { sale_counter_title: event.target.value })}
                    placeholder="Sale title (e.g. Winter Sale)"
                    className="border border-stone-300 bg-white px-3 py-2 text-sm"
                  />
                  <input
                    value={siteContent.settings.sale_counter_badge}
                    onChange={(event) => updateSiteContent('settings', { sale_counter_badge: event.target.value })}
                    placeholder="Sale badge (e.g. Flat 50%)"
                    className="border border-stone-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <input
                  value={siteContent.settings.sale_counter_subtitle}
                  onChange={(event) => updateSiteContent('settings', { sale_counter_subtitle: event.target.value })}
                  placeholder="Sale counter subtitle"
                  className="border border-stone-300 bg-white px-3 py-2 text-sm"
                />
                {siteContent.settings.sale_counter_repeat_enabled ? (
                  <>
                    <div className="grid gap-3 sm:grid-cols-4">
                      <input
                        type="number"
                        min={0}
                        value={saleCycleParts.days}
                        onChange={(event) =>
                          updateSiteContent('settings', {
                            sale_counter_cycle_seconds: cyclePartsToSeconds({
                              ...saleCycleParts,
                              days: toPositiveInt(event.target.value)
                            })
                          })
                        }
                        placeholder="Days"
                        className="border border-stone-300 bg-white px-3 py-2 text-sm"
                      />
                      <input
                        type="number"
                        min={0}
                        max={23}
                        value={saleCycleParts.hours}
                        onChange={(event) =>
                          updateSiteContent('settings', {
                            sale_counter_cycle_seconds: cyclePartsToSeconds({
                              ...saleCycleParts,
                              hours: Math.min(23, toPositiveInt(event.target.value))
                            })
                          })
                        }
                        placeholder="Hours"
                        className="border border-stone-300 bg-white px-3 py-2 text-sm"
                      />
                      <input
                        type="number"
                        min={0}
                        max={59}
                        value={saleCycleParts.minutes}
                        onChange={(event) =>
                          updateSiteContent('settings', {
                            sale_counter_cycle_seconds: cyclePartsToSeconds({
                              ...saleCycleParts,
                              minutes: Math.min(59, toPositiveInt(event.target.value))
                            })
                          })
                        }
                        placeholder="Minutes"
                        className="border border-stone-300 bg-white px-3 py-2 text-sm"
                      />
                      <input
                        type="number"
                        min={0}
                        max={59}
                        value={saleCycleParts.seconds}
                        onChange={(event) =>
                          updateSiteContent('settings', {
                            sale_counter_cycle_seconds: cyclePartsToSeconds({
                              ...saleCycleParts,
                              seconds: Math.min(59, toPositiveInt(event.target.value))
                            })
                          })
                        }
                        placeholder="Seconds"
                        className="border border-stone-300 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        type="number"
                        min={0}
                        max={23}
                        value={siteContent.settings.sale_counter_anchor_hour}
                        onChange={(event) =>
                          updateSiteContent('settings', {
                            sale_counter_anchor_hour: Math.min(23, toPositiveInt(event.target.value))
                          })
                        }
                        placeholder="Reset hour (0-23)"
                        className="border border-stone-300 bg-white px-3 py-2 text-sm"
                      />
                      <input
                        type="number"
                        min={0}
                        max={59}
                        value={siteContent.settings.sale_counter_anchor_minute}
                        onChange={(event) =>
                          updateSiteContent('settings', {
                            sale_counter_anchor_minute: Math.min(59, toPositiveInt(event.target.value))
                          })
                        }
                        placeholder="Reset minute (0-59)"
                        className="border border-stone-300 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                  </>
                ) : null}
                <input
                  value={siteContent.settings.sale_counter_end_at}
                  onChange={(event) => updateSiteContent('settings', { sale_counter_end_at: event.target.value })}
                  placeholder="Sale end date (ISO), e.g. 2026-12-31T18:59:59.000Z"
                  className="border border-stone-300 bg-white px-3 py-2 text-sm disabled:bg-stone-100"
                  disabled={siteContent.settings.sale_counter_repeat_enabled}
                />
                <textarea
                  value={(siteContent.settings.promo_messages || []).join('\n')}
                  onChange={(event) => updateSiteContent('settings', { promo_messages: parseTextLines(event.target.value) })}
                  rows={3}
                  placeholder="Promo messages (one per line)"
                  className="resize-y border border-stone-300 bg-white px-3 py-2 text-sm"
                />
                <textarea
                  value={(siteContent.settings.trust_marquee_items || []).join('\n')}
                  onChange={(event) =>
                    updateSiteContent('settings', { trust_marquee_items: parseTextLines(event.target.value) })
                  }
                  rows={3}
                  placeholder="Trust marquee items (one per line)"
                  className="resize-y border border-stone-300 bg-white px-3 py-2 text-sm"
                />
                <div>
                  <p className="text-[10px] uppercase tracking-luxury text-stone-500">PDP Notice</p>
                  <p className="mt-1 text-[11px] text-stone-500">Shows on all product pages. Leave empty to hide.</p>
                  <textarea
                    value={siteContent.settings.pdp_notice}
                    onChange={(e) => updateSiteContent('settings', { pdp_notice: e.target.value })}
                    rows={2}
                    className="mt-2 w-full border border-stone-300 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-stone-950"
                    placeholder="e.g., Place your order before Friday for Eid delivery..."
                  />
                </div>
              </div>
            </article>

            <article className="border border-stone-200 p-4">
              <p className="text-[10px] uppercase tracking-luxury text-stone-500">Main Headings</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <input
                  value={siteContent.headings.best_sellers}
                  onChange={(event) => updateSiteContent('headings', { best_sellers: event.target.value })}
                  placeholder="Best sellers"
                  className="border border-stone-300 bg-white px-3 py-2 text-sm"
                />
                <input
                  value={siteContent.headings.shop}
                  onChange={(event) => updateSiteContent('headings', { shop: event.target.value })}
                  placeholder="Shop"
                  className="border border-stone-300 bg-white px-3 py-2 text-sm"
                />
                <input
                  value={siteContent.headings.collections}
                  onChange={(event) => updateSiteContent('headings', { collections: event.target.value })}
                  placeholder="Collections"
                  className="border border-stone-300 bg-white px-3 py-2 text-sm"
                />
                <input
                  value={siteContent.headings.related_pieces}
                  onChange={(event) => updateSiteContent('headings', { related_pieces: event.target.value })}
                  placeholder="Related pieces"
                  className="border border-stone-300 bg-white px-3 py-2 text-sm"
                />
                <input
                  value={siteContent.headings.cta}
                  onChange={(event) => updateSiteContent('headings', { cta: event.target.value })}
                  placeholder="CTA"
                  className="border border-stone-300 bg-white px-3 py-2 text-sm"
                />
                <input
                  value={siteContent.headings.editorial_banner}
                  onChange={(event) => updateSiteContent('headings', { editorial_banner: event.target.value })}
                  placeholder="Editorial banner"
                  className="border border-stone-300 bg-white px-3 py-2 text-sm"
                />
              </div>
            </article>

            <article className="border border-stone-200 p-4">
              <p className="text-[10px] uppercase tracking-luxury text-stone-500">Footer & Social Links</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <input
                  value={siteContent.footer.email}
                  onChange={(event) => updateSiteContent('footer', { email: event.target.value })}
                  placeholder="Footer email"
                  className="border border-stone-300 bg-white px-3 py-2 text-sm"
                />
                <input
                  value={siteContent.footer.location}
                  onChange={(event) => updateSiteContent('footer', { location: event.target.value })}
                  placeholder="Footer location"
                  className="border border-stone-300 bg-white px-3 py-2 text-sm"
                />
                <input
                  value={siteContent.footer.whatsapp_display}
                  onChange={(event) => updateSiteContent('footer', { whatsapp_display: event.target.value })}
                  placeholder="Footer WhatsApp display"
                  className="border border-stone-300 bg-white px-3 py-2 text-sm sm:col-span-2"
                />
                <input
                  value={siteContent.footer.social_links.instagram}
                  onChange={(event) => updateFooterSocialLink('instagram', event.target.value)}
                  placeholder="Instagram URL"
                  className="border border-stone-300 bg-white px-3 py-2 text-sm"
                />
                <input
                  value={siteContent.footer.social_links.whatsapp}
                  onChange={(event) => updateFooterSocialLink('whatsapp', event.target.value)}
                  placeholder="WhatsApp URL"
                  className="border border-stone-300 bg-white px-3 py-2 text-sm"
                />
                <input
                  value={siteContent.footer.social_links.facebook}
                  onChange={(event) => updateFooterSocialLink('facebook', event.target.value)}
                  placeholder="Facebook URL"
                  className="border border-stone-300 bg-white px-3 py-2 text-sm"
                />
                <input
                  value={siteContent.footer.social_links.tiktok}
                  onChange={(event) => updateFooterSocialLink('tiktok', event.target.value)}
                  placeholder="TikTok URL"
                  className="border border-stone-300 bg-white px-3 py-2 text-sm"
                />
              </div>
              <div className="mt-4 space-y-2">
                <p className="text-[10px] uppercase tracking-luxury text-stone-500">Social URL Preview</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <LinkPreview label="Instagram" url={siteContent.footer.social_links.instagram} />
                  <LinkPreview label="WhatsApp" url={siteContent.footer.social_links.whatsapp} />
                  <LinkPreview label="Facebook" url={siteContent.footer.social_links.facebook} />
                  <LinkPreview label="TikTok" url={siteContent.footer.social_links.tiktok} />
                </div>
              </div>
            </article>
          </fieldset>
        </section>
      )}

      {activeTab === 'profiles' ? (
        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-stone-600">{profiles.length} profiles in database — used for reviews and social proof popups</p>
          </div>

          {profileStatus ? <p className="text-sm text-stone-700">{profileStatus}</p> : null}

          <div className="flex gap-2">
            <input
              type="text"
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addProfile(); } }}
              placeholder="Add new profile name..."
              className="flex-1 border border-stone-300 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-stone-950"
            />
            <button
              type="button"
              onClick={addProfile}
              disabled={!adminCanWrite || !newProfileName.trim()}
              className="bg-stone-950 px-5 py-2 text-[11px] uppercase tracking-luxury text-white disabled:opacity-40"
            >
              Add
            </button>
          </div>

          <div>
            <input
              type="text"
              value={profileSearch}
              onChange={(e) => setProfileSearch(e.target.value)}
              placeholder="Search profiles..."
              className="w-full border border-stone-300 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-stone-950 sm:max-w-xs"
            />
          </div>

          <div className="max-h-[60vh] overflow-y-auto border border-stone-200">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-stone-50">
                <tr className="border-b border-stone-200 text-left text-[10px] uppercase tracking-luxury text-stone-500">
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {profiles
                  .filter((p) => !profileSearch.trim() || p.name.toLowerCase().includes(profileSearch.trim().toLowerCase()) || p.id.toLowerCase().includes(profileSearch.trim().toLowerCase()))
                  .map((profile) => (
                    <tr key={profile.id} className="hover:bg-stone-50">
                      <td className="px-3 py-2 text-xs text-stone-400">{profile.id}</td>
                      <td className="px-3 py-2 text-stone-900">{profile.name}</td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => deleteProfile(profile.id)}
                          disabled={!adminCanWrite}
                          className="text-[10px] uppercase tracking-luxury text-red-500 hover:text-red-700 disabled:opacity-40"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </section>
  );
}
