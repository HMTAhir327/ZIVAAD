'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { saveProductsAction } from '@/app/admin/actions';
import { RichTextEditor } from '@/components/rich-text-editor';
import { normalizeProductOptionDefinitions, normalizeProductVariantDefinitions } from '@/lib/product-variants';
import { normalizeDescriptionForEditor } from '@/lib/rich-text';
import type { Product, ProductCategory, ProductOption, ProductReview, ProductVariant } from '@/lib/types';

const fallbackImage =
  'https://res.cloudinary.com/demo/image/upload/v1690000000/samples/ecommerce/accessories-bag.jpg';

const DEFAULT_OPTION_NAMES = ['Color', 'Size', 'Material', 'Length', 'Finish'];
const DEFAULT_COLOR_SWATCHES: Record<string, string> = {
  black: '#111111',
  white: '#f5f5f4',
  gold: '#c9a24a',
  silver: '#bfc3c9',
  'rose gold': '#b9897d',
  rose: '#b76e79',
  red: '#b91c1c',
  green: '#166534',
  blue: '#1d4ed8',
  pink: '#e879a6'
};

function normalizeCategoryTerm(value: string): ProductCategory {
  return value.trim().toLowerCase();
}

function normalizeBadgeTerm(value: string): string {
  return value.trim().toUpperCase();
}

function uniqueValues(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function parseOptionValues(value: string): string[] {
  return value
    .split(/,|\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseGalleryUrls(value: string): string[] {
  return uniqueValues(
    value
      .split(/(?:\r?\n)+|,\s*(?=https?:\/\/)/i)
      .map((item) => item.trim())
      .filter(Boolean)
  );
}

function parseSupplierUrls(value: string): string[] {
  return uniqueValues(
    value
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean)
  );
}

function formatMediaOptionLabel(url: string, index: number): string {
  try {
    const parsed = new URL(url);
    const filename = parsed.pathname.split('/').pop() || url;
    return `${index + 1}. ${filename}`;
  } catch {
    return `${index + 1}. ${url}`;
  }
}

interface MediaPickerOption {
  url: string;
  label: string;
}

interface MediaPickerProps {
  value: string;
  options: MediaPickerOption[];
  onChange: (value: string) => void;
  placeholder: string;
  emptyLabel?: string;
  className?: string;
}

function MediaPicker({ value, options, onChange, placeholder, emptyLabel, className = '' }: MediaPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selected = options.find((option) => option.url === value);
  const buttonLabel = selected?.label || placeholder;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-[42px] w-full items-center justify-between gap-2 border border-stone-300 bg-white px-2.5 text-left"
      >
        <span className="flex min-w-0 items-center gap-2">
          {value ? (
            <img src={value} alt="" className="h-7 w-7 shrink-0 rounded-sm border border-stone-200 object-cover bg-stone-100" />
          ) : (
            <span className="h-7 w-7 shrink-0 rounded-sm border border-dashed border-stone-300 bg-stone-50" />
          )}
          <span className="truncate text-xs text-stone-700">{buttonLabel}</span>
        </span>
        <span className="shrink-0 text-[11px] text-stone-400">▾</span>
      </button>

      {isOpen ? (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-40 max-h-64 overflow-y-auto border border-stone-200 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
          {emptyLabel ? (
            <button
              type="button"
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              className="flex w-full items-center gap-2 border-b border-stone-100 px-2.5 py-2 text-left text-xs text-stone-700 hover:bg-stone-50"
            >
              <span className="h-7 w-7 shrink-0 rounded-sm border border-dashed border-stone-300 bg-stone-50" />
              <span className="truncate">{emptyLabel}</span>
            </button>
          ) : null}

          {options.map((option) => (
            <button
              key={option.url}
              type="button"
              onClick={() => {
                onChange(option.url);
                setIsOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-2.5 py-2 text-left text-xs hover:bg-stone-50 ${
                option.url === value ? 'bg-stone-100 text-stone-900' : 'text-stone-700'
              }`}
            >
              <img
                src={option.url}
                alt=""
                className="h-8 w-8 shrink-0 rounded-sm border border-stone-200 object-cover bg-stone-100"
              />
              <span className="truncate">{option.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function formatOptionValues(option: ProductOption): string {
  return option.values.join(', ');
}

function createVariantId(): string {
  return `variant-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function countOptionCombinations(options: ProductOption[]): number {
  if (options.length === 0) {
    return 0;
  }

  return options.reduce((count, option) => count * Math.max(1, option.values.length), 1);
}

function buildVariantCombinations(options: ProductOption[]): Array<Record<string, string>> {
  if (options.length === 0) {
    return [];
  }

  const combinations: Array<Record<string, string>> = [];

  function walk(index: number, current: Record<string, string>) {
    if (index >= options.length) {
      combinations.push({ ...current });
      return;
    }

    const option = options[index];
    option.values.forEach((value) => {
      current[option.name] = value;
      walk(index + 1, current);
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

function isColorOption(optionName: string): boolean {
  const key = optionName.trim().toLowerCase();
  return key === 'color' || key === 'colour' || key.includes('color') || key.includes('colour');
}

function normalizeHex(value: string): string | undefined {
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

function getFallbackSwatch(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (normalizeHex(normalized)) {
    return normalizeHex(normalized) as string;
  }
  return DEFAULT_COLOR_SWATCHES[normalized] || '#d6d3d1';
}

function normalizeOptionSwatches(
  swatches: Product['option_swatches'] | undefined,
  options: ProductOption[]
): Product['option_swatches'] {
  const normalized: Record<string, Record<string, string>> = {};

  options.forEach((option) => {
    if (!isColorOption(option.name)) {
      return;
    }

    const sourceMap = swatches?.[option.name] || {};
    const values = option.values
      .map((value) => {
        const configured = sourceMap[value];
        const hex = normalizeHex(configured || '') || getFallbackSwatch(value);
        return [value, hex] as const;
      })
      .filter(Boolean);

    if (values.length > 0) {
      normalized[option.name] = Object.fromEntries(values);
    }
  });

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function syncDerivedProduct(product: Product): Product {
  const options = normalizeProductOptionDefinitions(product.product_options);
  const variants = normalizeProductVariantDefinitions(product.product_variants, options);
  const gallerySource =
    product.gallery_images && product.gallery_images.length > 0 ? product.gallery_images : (product.images || []);
  const gallery = uniqueValues(gallerySource.map((url) => url.trim()).filter(Boolean));
  const primaryInput = typeof product.primary_image_url === 'string' ? product.primary_image_url.trim() : '';
  const secondaryInput = typeof product.secondary_image_url === 'string' ? product.secondary_image_url.trim() : '';
  const fallbackPrimary = gallery[0] || product.images?.[0]?.trim() || '';
  const fallbackSecondary = gallery[1] || product.images?.[1]?.trim() || fallbackPrimary;
  const primary = primaryInput || (product.primary_image_url == null ? fallbackPrimary : '');
  const secondary = secondaryInput || (product.secondary_image_url == null ? fallbackSecondary : '');
  const images = uniqueValues([primary, secondary, ...gallery].filter(Boolean));
  const stock = variants.length > 0 ? variants.reduce((sum, variant) => sum + variant.stock, 0) : product.stock;
  const optionSwatches = normalizeOptionSwatches(product.option_swatches, options);
  const supplierUrls = uniqueValues((product.supplier_urls || []).map((url) => url.trim()).filter(Boolean));

  return {
    ...product,
    category: normalizeCategoryTerm(product.category || '') || 'rings',
    badge: normalizeBadgeTerm(product.badge || '') || 'NEW',
    primary_image_url: primary,
    secondary_image_url: secondary,
    gallery_images: gallery.length > 0 ? gallery : images,
    images,
    stock,
    supplier_urls: supplierUrls,
    zivaad_choice: Boolean(product.zivaad_choice),
    sale_tag_enabled: Boolean(product.sale_tag_enabled),
    option_swatches: optionSwatches,
    product_options: options,
    product_variants: variants,
    reviews: product.reviews || []
  };
}

function generateVariantsFromOptions(product: Product, options: ProductOption[]): ProductVariant[] {
  const combinations = buildVariantCombinations(options);
  if (combinations.length === 0) {
    return [];
  }

  const existing = normalizeProductVariantDefinitions(product.product_variants, options);
  const existingBySignature = new Map<string, ProductVariant>();
  existing.forEach((variant) => {
    const signature = buildVariantSignature(options, variant.option_values);
    if (!existingBySignature.has(signature)) {
      existingBySignature.set(signature, variant);
    }
  });

  return combinations.map((optionValues) => {
    const signature = buildVariantSignature(options, optionValues);
    const current = existingBySignature.get(signature);

    return {
      id: current?.id || createVariantId(),
      sku: current?.sku || '',
      title: current?.title || buildVariantLabel(options, optionValues),
      option_values: optionValues,
      price: current?.price ?? product.price,
      compare_price: current?.compare_price ?? product.compare_price,
      stock: current?.stock ?? 0,
      image_url: current?.image_url || product.primary_image_url || ''
    };
  });
}

interface AdminProductFormPageProps {
  mode: 'create' | 'edit';
  initialProduct: Product;
  allProducts: Product[];
  categoryOptions: ProductCategory[];
  badgeOptions: string[];
  adminCanWrite: boolean;
  adminWriteNotice: string;
  originalProductId?: string;
}

export function AdminProductFormPage({
  mode,
  initialProduct,
  allProducts,
  categoryOptions,
  badgeOptions,
  adminCanWrite,
  adminWriteNotice,
  originalProductId
}: AdminProductFormPageProps) {
  const router = useRouter();
  const [product, setProduct] = useState<Product>(() => {
    return syncDerivedProduct({
      ...initialProduct,
      description: normalizeDescriptionForEditor(initialProduct.description || '')
    });
  });
  const [galleryDraft, setGalleryDraft] = useState<string>(() => {
    const normalized = syncDerivedProduct({
      ...initialProduct,
      description: normalizeDescriptionForEditor(initialProduct.description || '')
    });
    return (normalized.gallery_images || []).join('\n');
  });
  const [supplierDraft, setSupplierDraft] = useState<string>(() => {
    const normalized = syncDerivedProduct({
      ...initialProduct,
      description: normalizeDescriptionForEditor(initialProduct.description || '')
    });
    return (normalized.supplier_urls || []).join('\n');
  });
  const [optionValueDrafts, setOptionValueDrafts] = useState<Record<number, string>>({});
  const [editingReviewIndex, setEditingReviewIndex] = useState<number | null>(null);
  const [reviewDraft, setReviewDraft] = useState<{ name: string; rating: number; text: string; date: string; verified: boolean }>({
    name: '',
    rating: 5,
    text: '',
    date: new Date().toISOString().slice(0, 10),
    verified: true
  });
  const [profiles, setProfiles] = useState<Array<{ id: string; name: string }>>([]);
  const [profileSearch, setProfileSearch] = useState('');
  const [status, setStatus] = useState('');
  const [isSaving, startSaving] = useTransition();

  const options = useMemo(() => normalizeProductOptionDefinitions(product.product_options), [product.product_options]);
  const variants = useMemo(
    () => normalizeProductVariantDefinitions(product.product_variants, options),
    [product.product_variants, options]
  );
  const combinationCount = useMemo(() => countOptionCombinations(options), [options]);
  const mediaOptions = useMemo(() => {
    const variantImages = variants.map((variant) => (variant.image_url || '').trim()).filter(Boolean);
    return uniqueValues(
      [
        ...(product.gallery_images || []),
        ...(product.images || []),
        (product.primary_image_url || '').trim(),
        (product.secondary_image_url || '').trim(),
        ...variantImages
      ]
        .map((url) => url.trim())
        .filter(Boolean)
    );
  }, [
    product.gallery_images,
    product.images,
    product.primary_image_url,
    product.secondary_image_url,
    variants
  ]);
  const mediaPickerOptions = useMemo(
    () => mediaOptions.map((url, index) => ({ url, label: formatMediaOptionLabel(url, index) })),
    [mediaOptions]
  );
  const duplicateVariantSignatures = useMemo(() => {
    if (options.length === 0 || variants.length === 0) {
      return new Set<string>();
    }

    const counts = new Map<string, number>();
    variants.forEach((variant) => {
      const signature = buildVariantSignature(options, variant.option_values);
      counts.set(signature, (counts.get(signature) ?? 0) + 1);
    });

    return new Set(Array.from(counts.entries()).filter(([, count]) => count > 1).map(([signature]) => signature));
  }, [options, variants]);

  useEffect(() => {
    setOptionValueDrafts((prev) => {
      const next: Record<number, string> = {};
      Object.entries(prev).forEach(([key, value]) => {
        const index = Number(key);
        if (Number.isInteger(index) && index >= 0 && index < options.length) {
          next[index] = value;
        }
      });
      return next;
    });
  }, [options.length]);

  useEffect(() => {
    let active = true;
    fetch('/api/admin/profiles')
      .then((res) => res.json())
      .then((data) => { if (active && data.ok) setProfiles(data.profiles); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  function commitOptionValuesDraft(optionIndex: number) {
    const draft = optionValueDrafts[optionIndex];
    if (draft === undefined) {
      return;
    }

    updateOptionValues(optionIndex, draft);
    setOptionValueDrafts((prev) => {
      const next = { ...prev };
      delete next[optionIndex];
      return next;
    });
  }

  function setField<K extends keyof Product>(key: K, value: Product[K]) {
    setProduct((prev) => {
      const next = { ...prev, [key]: value } as Product;

      if (key === 'category') {
        next.category = (normalizeCategoryTerm(String(value)) || prev.category) as ProductCategory;
      }

      if (key === 'badge') {
        next.badge = normalizeBadgeTerm(String(value)) || prev.badge;
      }

      if (key === 'primary_image_url' || key === 'secondary_image_url') {
        const gallery = (next.gallery_images || []).map((url) => url.trim()).filter(Boolean);
        const primary = (next.primary_image_url || '').trim();
        const secondary = (next.secondary_image_url || '').trim();
        next.images = uniqueValues([primary, secondary, ...gallery].filter(Boolean));
      }

      if (key === 'stock') {
        return syncDerivedProduct(next);
      }

      return next;
    });
  }

  function setOptions(rawOptions: ProductOption[]) {
    setProduct((prev) => {
      const normalizedOptions = normalizeProductOptionDefinitions(rawOptions);
      const normalizedVariants = normalizeProductVariantDefinitions(prev.product_variants, normalizedOptions);
      const optionSwatches = normalizeOptionSwatches(prev.option_swatches, normalizedOptions);

      return syncDerivedProduct({
        ...prev,
        product_options: normalizedOptions,
        product_variants: normalizedVariants,
        option_swatches: optionSwatches
      });
    });
  }

  function addOption() {
    const suggestedName = DEFAULT_OPTION_NAMES[options.length] || `Option ${options.length + 1}`;
    setOptions([...options, { name: suggestedName, values: ['Default'] }]);
  }

  function addColorSizeSet() {
    const names = new Set(options.map((option) => option.name.trim().toLowerCase()));
    const next = [...options];

    if (!names.has('color') && !names.has('colour')) {
      next.push({ name: 'Color', values: ['Gold', 'Silver'] });
    }

    if (!names.has('size')) {
      next.push({ name: 'Size', values: ['6', '7', '8'] });
    }

    setOptions(next);
  }

  function updateOptionName(optionIndex: number, value: string) {
    const previous = options[optionIndex];
    if (!previous) {
      return;
    }

    const nextOptions = options.map((option, idx) => (idx === optionIndex ? { ...option, name: value } : option));
    const normalizedNext = normalizeProductOptionDefinitions(nextOptions);
    const renamed = normalizedNext[optionIndex];
    const nextName = renamed?.name || previous.name;

    setProduct((prev) => {
      const swatches = { ...(prev.option_swatches || {}) };
      if (previous.name !== nextName && swatches[previous.name]) {
        swatches[nextName] = swatches[previous.name];
        delete swatches[previous.name];
      }

      const nextVariants = normalizeProductVariantDefinitions(prev.product_variants, options).map((variant) => {
        const nextOptionValues = { ...variant.option_values };
        if (previous.name !== nextName && nextOptionValues[previous.name] !== undefined) {
          nextOptionValues[nextName] = nextOptionValues[previous.name];
          delete nextOptionValues[previous.name];
        }

        return { ...variant, option_values: nextOptionValues };
      });

      return syncDerivedProduct({
        ...prev,
        product_options: normalizedNext,
        product_variants: nextVariants,
        option_swatches: swatches
      });
    });
  }

  function updateOptionValues(optionIndex: number, value: string) {
    const target = options[optionIndex];
    if (!target) {
      return;
    }

    const nextValues = parseOptionValues(value);
    const nextOptions = options.map((option, idx) => (idx === optionIndex ? { ...option, values: nextValues } : option));

    setProduct((prev) => {
      const normalizedOptions = normalizeProductOptionDefinitions(nextOptions);
      const updatedOption = normalizedOptions[optionIndex];
      const validValues = updatedOption?.values || [];

      const nextSwatches = { ...(prev.option_swatches || {}) };
      if (updatedOption && isColorOption(updatedOption.name)) {
        const sourceSwatches = nextSwatches[updatedOption.name] || nextSwatches[target.name] || {};
        const normalizedColorMap: Record<string, string> = {};
        validValues.forEach((colorValue) => {
          const existing = normalizeHex(sourceSwatches[colorValue] || '');
          normalizedColorMap[colorValue] = existing || getFallbackSwatch(colorValue);
        });

        nextSwatches[updatedOption.name] = normalizedColorMap;
        if (target.name !== updatedOption.name) {
          delete nextSwatches[target.name];
        }
      } else {
        delete nextSwatches[target.name];
      }

      const nextVariants = normalizeProductVariantDefinitions(prev.product_variants, options).map((variant) => {
        const nextOptionValues = { ...variant.option_values };
        if (updatedOption) {
          const currentValue = nextOptionValues[updatedOption.name];
          const valueExists = validValues.some(
            (valid) => valid.toLowerCase() === (currentValue || '').toLowerCase()
          );
          if (!valueExists) {
            nextOptionValues[updatedOption.name] = validValues[0] || '';
          }
        }

        return { ...variant, option_values: nextOptionValues };
      });

      return syncDerivedProduct({
        ...prev,
        product_options: normalizedOptions,
        product_variants: nextVariants,
        option_swatches: nextSwatches
      });
    });
  }

  function removeOption(optionIndex: number) {
    const target = options[optionIndex];
    if (!target) {
      return;
    }

    setProduct((prev) => {
      const nextOptions = options.filter((_, idx) => idx !== optionIndex);
      const swatches = { ...(prev.option_swatches || {}) };
      delete swatches[target.name];

      const nextVariants = normalizeProductVariantDefinitions(prev.product_variants, options).map((variant) => {
        const nextOptionValues = { ...variant.option_values };
        delete nextOptionValues[target.name];
        return { ...variant, option_values: nextOptionValues };
      });

      return syncDerivedProduct({
        ...prev,
        product_options: nextOptions,
        product_variants: nextVariants,
        option_swatches: swatches
      });
    });
  }

  function setSwatch(optionName: string, optionValue: string, nextColor: string) {
    const normalized = normalizeHex(nextColor);
    if (!normalized) {
      return;
    }

    setProduct((prev) => {
      const nextSwatches = { ...(prev.option_swatches || {}) };
      const optionMap = { ...(nextSwatches[optionName] || {}) };
      optionMap[optionValue] = normalized;
      nextSwatches[optionName] = optionMap;

      return { ...prev, option_swatches: nextSwatches };
    });
  }

  function regenerateVariants() {
    const optionsWithDrafts = normalizeProductOptionDefinitions(
      options.map((option, optionIndex) =>
        optionValueDrafts[optionIndex] !== undefined
          ? { ...option, values: parseOptionValues(optionValueDrafts[optionIndex]) }
          : option
      )
    );

    if (optionsWithDrafts.length === 0) {
      setStatus('Add at least one option before generating variants.');
      return;
    }

    const combinations = countOptionCombinations(optionsWithDrafts);
    if (combinations > 250) {
      setStatus(`Too many combinations (${combinations}). Reduce values first.`);
      return;
    }

    const baseProduct = syncDerivedProduct({
      ...product,
      product_options: optionsWithDrafts
    });
    const nextVariants = generateVariantsFromOptions(baseProduct, optionsWithDrafts);
    setProduct(
      syncDerivedProduct({
        ...baseProduct,
        product_variants: nextVariants
      })
    );
    setOptionValueDrafts({});
    setStatus(`Generated ${nextVariants.length} variant combinations.`);
  }

  function addManualVariant() {
    if (options.length === 0) {
      setStatus('Add options first before creating a manual variant.');
      return;
    }

    const optionValues = Object.fromEntries(options.map((option) => [option.name, option.values[0] || '']));
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

    setProduct((prev) =>
      syncDerivedProduct({
        ...prev,
        product_variants: [...variants, nextVariant]
      })
    );
  }

  function updateVariantField<K extends keyof ProductVariant>(variantIndex: number, key: K, value: ProductVariant[K]) {
    const nextVariants = variants.map((variant, idx) => (idx === variantIndex ? { ...variant, [key]: value } : variant));
    setProduct((prev) =>
      syncDerivedProduct({
        ...prev,
        product_variants: nextVariants
      })
    );
  }

  function updateVariantOption(variantIndex: number, optionName: string, value: string) {
    const nextVariants = variants.map((variant, idx) =>
      idx === variantIndex
        ? {
            ...variant,
            option_values: {
              ...variant.option_values,
              [optionName]: value
            }
          }
        : variant
    );

    setProduct((prev) =>
      syncDerivedProduct({
        ...prev,
        product_variants: nextVariants
      })
    );
  }

  function removeVariant(variantIndex: number) {
    const nextVariants = variants.filter((_, idx) => idx !== variantIndex);
    setProduct((prev) =>
      syncDerivedProduct({
        ...prev,
        product_variants: nextVariants
      })
    );
  }

  function updateGallery(rawInput: string) {
    setGalleryDraft(rawInput);
    const urls = parseGalleryUrls(rawInput);

    setProduct((prev) => {
      const next = {
        ...prev,
        gallery_images: urls,
        images: uniqueValues([
          (prev.primary_image_url || '').trim(),
          (prev.secondary_image_url || '').trim(),
          ...urls
        ])
      };

      if (!prev.primary_image_url?.trim() && urls[0]) {
        next.primary_image_url = urls[0];
      }
      if (!prev.secondary_image_url?.trim() && (urls[1] || urls[0])) {
        next.secondary_image_url = urls[1] || urls[0];
      }

      return next;
    });
  }

  function updateSupplierUrls(rawInput: string) {
    setSupplierDraft(rawInput);
    const urls = parseSupplierUrls(rawInput);
    setProduct((prev) => ({
      ...prev,
      supplier_urls: urls
    }));
  }

  function startAddReview() {
    setReviewDraft({
      name: '',
      rating: 5,
      text: '',
      date: new Date().toISOString().slice(0, 10),
      verified: true
    });
    setEditingReviewIndex(-1);
  }

  function startEditReview(index: number) {
    const review = (product.reviews || [])[index];
    if (!review) return;
    setReviewDraft({
      name: review.name,
      rating: review.rating,
      text: review.text,
      date: review.date,
      verified: review.verified
    });
    setEditingReviewIndex(index);
  }

  function cancelReviewEdit() {
    setEditingReviewIndex(null);
  }

  function saveReviewDraft() {
    const reviews = [...(product.reviews || [])];
    if (editingReviewIndex === -1) {
      const newReview: ProductReview = {
        id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: reviewDraft.name,
        rating: reviewDraft.rating,
        text: reviewDraft.text,
        date: reviewDraft.date,
        verified: reviewDraft.verified
      };
      reviews.push(newReview);
    } else if (editingReviewIndex !== null && editingReviewIndex >= 0) {
      reviews[editingReviewIndex] = {
        ...reviews[editingReviewIndex],
        name: reviewDraft.name,
        rating: reviewDraft.rating,
        text: reviewDraft.text,
        date: reviewDraft.date,
        verified: reviewDraft.verified
      };
    }
    setProduct((prev) => ({ ...prev, reviews }));
    setEditingReviewIndex(null);

    // Auto-add reviewer name to profiles if not already present
    const reviewerName = reviewDraft.name.trim();
    if (reviewerName && profiles.length > 0) {
      const exists = profiles.some((p) => p.name.toLowerCase() === reviewerName.toLowerCase());
      if (!exists) {
        fetch('/api/admin/profiles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: reviewerName })
        })
          .then((res) => res.json())
          .then((data) => { if (data.ok) setProfiles((prev) => [...prev, { id: data.id, name: reviewerName }]); })
          .catch(() => {});
      }
    }
  }

  function deleteReview(index: number) {
    const reviews = (product.reviews || []).filter((_, idx) => idx !== index);
    setProduct((prev) => ({ ...prev, reviews }));
  }

  function handleSave() {
    if (!adminCanWrite) {
      setStatus(adminWriteNotice);
      return;
    }

    const hasPendingDrafts = Object.keys(optionValueDrafts).length > 0;
    const productWithDrafts = hasPendingDrafts
      ? syncDerivedProduct({
          ...product,
          product_options: options.map((option, optionIndex) =>
            optionValueDrafts[optionIndex] !== undefined
              ? { ...option, values: parseOptionValues(optionValueDrafts[optionIndex]) }
              : option
          )
        })
      : product;

    const galleryFromDraft = parseGalleryUrls(galleryDraft);
    const suppliersFromDraft = parseSupplierUrls(supplierDraft);
    const normalizedProduct = syncDerivedProduct({
      ...productWithDrafts,
      gallery_images: galleryFromDraft,
      supplier_urls: suppliersFromDraft
    });
    if (hasPendingDrafts) {
      setProduct(normalizedProduct);
      setOptionValueDrafts({});
    }
    if (!normalizedProduct.id.trim() || !normalizedProduct.name.trim()) {
      setStatus('Product ID and Name are required.');
      return;
    }

    const conflict = allProducts.find(
      (item) => item.id === normalizedProduct.id && item.id !== (originalProductId || '')
    );
    if (conflict) {
      setStatus(`Product ID "${normalizedProduct.id}" already exists. Use a unique ID.`);
      return;
    }

    const payload =
      mode === 'create'
        ? [normalizedProduct, ...allProducts]
        : allProducts.map((item) => (item.id === originalProductId ? normalizedProduct : item));

    setStatus('Saving...');

    startSaving(async () => {
      let result: { ok: true; count: number } | { ok: false; error: string };
      const actionResult = await saveProductsAction(payload);
      result = actionResult.ok
        ? { ok: true, count: actionResult.count ?? payload.length }
        : { ok: false, error: actionResult.error || 'Failed to save products.' };

      if (!result.ok) {
        try {
          const response = await fetch('/api/admin/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ products: payload })
          });
          const data = (await response.json()) as { ok?: boolean; count?: number; error?: string };
          result = response.ok && data.ok
            ? { ok: true, count: data.count ?? payload.length }
            : { ok: false, error: data.error || 'Failed to save products.' };
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to save products.';
          result = { ok: false, error: `Save action failed. ${message}`.trim() };
        }
      }

      if (!result.ok) {
        setStatus(result.error || 'Failed to save product.');
        return;
      }

      router.push('/admin');
      router.refresh();
    });
  }

  return (
    <section className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-stone-200 pb-5">
        <div>
          <p className="text-[10px] uppercase tracking-luxury text-stone-500">ZIVAAD Admin</p>
          <h1 className="mt-2 font-serif text-4xl text-stone-950 sm:text-5xl">
            {mode === 'create' ? 'Add New Product' : 'Edit Product'}
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            Configure variants, color swatches, media, and rich description content from one screen.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin"
            className="border border-stone-300 px-4 py-2 text-[10px] uppercase tracking-luxury text-stone-700"
          >
            Back to Admin
          </Link>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !adminCanWrite}
            className="bg-stone-950 px-5 py-2 text-[10px] uppercase tracking-luxury text-white disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </div>

      <div
        className={`mb-5 border p-3 text-sm ${
          adminCanWrite ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-200 bg-amber-50 text-amber-900'
        }`}
      >
        {adminWriteNotice}
      </div>

      {status ? <p className="mb-4 text-sm text-stone-700">{status}</p> : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <article className="min-w-0 space-y-5 border border-stone-200 bg-white p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-luxury text-stone-500">Product ID</label>
              <input
                value={product.id}
                onChange={(event) => setField('id', event.target.value)}
                className="w-full border border-stone-300 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-luxury text-stone-500">Product Name</label>
              <input
                value={product.name}
                onChange={(event) => setField('name', event.target.value)}
                className="w-full border border-stone-300 bg-white px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-luxury text-stone-500">Price</label>
              <input
                type="number"
                value={product.price}
                onChange={(event) => setField('price', Number(event.target.value) || 0)}
                className="w-full border border-stone-300 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-luxury text-stone-500">Compare Price</label>
              <input
                type="number"
                value={product.compare_price}
                onChange={(event) => setField('compare_price', Number(event.target.value) || 0)}
                className="w-full border border-stone-300 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-luxury text-stone-500">Stock</label>
              <input
                type="number"
                value={product.stock}
                onChange={(event) => setField('stock', Number(event.target.value) || 0)}
                disabled={variants.length > 0}
                className="w-full border border-stone-300 bg-white px-3 py-2 text-sm disabled:bg-stone-50"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-luxury text-stone-500">Customer Rating</label>
              <input
                type="number"
                min={0}
                max={5}
                step="0.1"
                value={product.rating ?? 4.8}
                onChange={(event) => setField('rating', Number(event.target.value) || 0)}
                className="w-full border border-stone-300 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-luxury text-stone-500">Rating Count</label>
              <input
                type="number"
                min={0}
                value={product.rating_count ?? 0}
                onChange={(event) => setField('rating_count', Math.max(0, Number(event.target.value) || 0))}
                className="w-full border border-stone-300 bg-white px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-luxury text-stone-500">Category</label>
              <select
                value={product.category}
                onChange={(event) => setField('category', event.target.value as ProductCategory)}
                className="w-full border border-stone-300 bg-white px-3 py-2 text-sm"
              >
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-luxury text-stone-500">Badge</label>
              <select
                value={product.badge}
                onChange={(event) => setField('badge', event.target.value)}
                className="w-full border border-stone-300 bg-white px-3 py-2 text-sm"
              >
                {badgeOptions.map((badge) => (
                  <option key={badge} value={badge}>
                    {badge}
                  </option>
                ))}
              </select>
            </div>
            <label className="space-y-2 block">
              <span className="text-[10px] uppercase tracking-luxury text-stone-500">Sale Tag</span>
              <span className="flex h-[42px] items-center gap-2 border border-stone-300 px-3">
                <input
                  type="checkbox"
                  checked={Boolean(product.sale_tag_enabled)}
                  onChange={(event) => setField('sale_tag_enabled', event.target.checked)}
                  className="h-4 w-4 border border-stone-300"
                />
                <span className="text-xs text-stone-700">Show `Sale` on product page</span>
              </span>
            </label>
            <label className="space-y-2 block">
              <span className="text-[10px] uppercase tracking-luxury text-stone-500">ZIVAAD Choice</span>
              <span className="flex h-[42px] items-center gap-2 border border-stone-300 px-3">
                <input
                  type="checkbox"
                  checked={Boolean(product.zivaad_choice)}
                  onChange={(event) => setField('zivaad_choice', event.target.checked)}
                  className="h-4 w-4 border border-stone-300"
                />
                <span className="text-xs text-stone-700">Show first in Most Loved Pieces</span>
              </span>
            </label>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-luxury text-stone-500">Product Description (Rich Text)</label>
            <RichTextEditor
              value={product.description}
              onChange={(nextDescription) => setField('description', nextDescription)}
            />
          </div>

          <div className="space-y-3 border border-stone-200 p-4">
            <p className="text-[10px] uppercase tracking-luxury text-stone-500">Media</p>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-2 block">
                <span className="text-[10px] uppercase tracking-luxury text-stone-500">Primary Image URL</span>
                <MediaPicker
                  value={product.primary_image_url || ''}
                  onChange={(nextValue) => setField('primary_image_url', nextValue)}
                  options={mediaPickerOptions}
                  placeholder="Select from Gallery URLs"
                  emptyLabel="None"
                />
                {product.primary_image_url ? (
                  <p className="break-all font-mono text-[11px] text-stone-500">{product.primary_image_url}</p>
                ) : null}
              </label>

              <label className="space-y-2 block">
                <span className="text-[10px] uppercase tracking-luxury text-stone-500">Secondary Image URL</span>
                <MediaPicker
                  value={product.secondary_image_url || ''}
                  onChange={(nextValue) => setField('secondary_image_url', nextValue)}
                  options={mediaPickerOptions}
                  placeholder="Select from Gallery URLs"
                  emptyLabel="None"
                />
                {product.secondary_image_url ? (
                  <p className="break-all font-mono text-[11px] text-stone-500">{product.secondary_image_url}</p>
                ) : null}
              </label>

              <label className="space-y-2 block sm:col-span-2">
                <span className="text-[10px] uppercase tracking-luxury text-stone-500">Video URL</span>
                <input
                  value={product.video_url}
                  onChange={(event) => setField('video_url', event.target.value)}
                  className="w-full border border-stone-300 bg-white px-3 py-2 font-mono text-xs"
                />
              </label>

              <label className="space-y-2 block sm:col-span-2">
                <span className="text-[10px] uppercase tracking-luxury text-stone-500">
                  Gallery URLs (line or comma separated)
                </span>
                <textarea
                  rows={5}
                  value={galleryDraft}
                  onChange={(event) => updateGallery(event.target.value)}
                  className="w-full resize-y border border-stone-300 bg-white px-3 py-2 font-mono text-xs leading-relaxed"
                />
                {mediaOptions.length > 0 ? (
                  <p className="text-[11px] text-stone-500">
                    {mediaOptions.length} media option{mediaOptions.length === 1 ? '' : 's'} available for dropdowns.
                  </p>
                ) : (
                  <p className="text-[11px] text-stone-500">
                    Add image URLs here to populate Primary, Secondary, and Variant image dropdowns.
                  </p>
                )}
              </label>

              <label className="space-y-2 block sm:col-span-2">
                <span className="text-[10px] uppercase tracking-luxury text-stone-500">
                  Supplier URLs (line or comma separated)
                </span>
                <textarea
                  rows={4}
                  value={supplierDraft}
                  onChange={(event) => updateSupplierUrls(event.target.value)}
                  className="w-full resize-y border border-stone-300 bg-white px-3 py-2 font-mono text-xs leading-relaxed"
                />
                {(product.supplier_urls || []).length > 0 ? (
                  <p className="text-[11px] text-stone-500">
                    {(product.supplier_urls || []).length} supplier link
                    {(product.supplier_urls || []).length === 1 ? '' : 's'} saved for this product.
                  </p>
                ) : (
                  <p className="text-[11px] text-stone-500">
                    Save supplier links here so you can quickly source this item after receiving orders.
                  </p>
                )}
              </label>
            </div>
          </div>

          <div className="space-y-3 border border-stone-200 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] uppercase tracking-luxury text-stone-500">Options</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={addColorSizeSet}
                  className="border border-stone-950 px-3 py-1 text-[10px] uppercase tracking-luxury text-stone-950"
                >
                  Add Color + Size
                </button>
                <button
                  type="button"
                  onClick={addOption}
                  className="border border-stone-300 px-3 py-1 text-[10px] uppercase tracking-luxury text-stone-700"
                >
                  Add Option
                </button>
              </div>
            </div>

            {options.length === 0 ? (
              <p className="text-sm text-stone-500">Add options like Color, Size, Material, etc.</p>
            ) : (
              <div className="space-y-4">
                {options.map((option, optionIndex) => (
                  <div key={`${option.name}-${optionIndex}`} className="border border-stone-200 p-3">
                    <div className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
                      <input
                        value={option.name}
                        onChange={(event) => updateOptionName(optionIndex, event.target.value)}
                        className="w-full border border-stone-300 bg-white px-3 py-2 text-sm"
                        placeholder="Option name (e.g. Color)"
                      />
                      <input
                        value={optionValueDrafts[optionIndex] ?? formatOptionValues(option)}
                        onFocus={() =>
                          setOptionValueDrafts((prev) =>
                            prev[optionIndex] !== undefined
                              ? prev
                              : { ...prev, [optionIndex]: formatOptionValues(option) }
                          )
                        }
                        onChange={(event) =>
                          setOptionValueDrafts((prev) => ({ ...prev, [optionIndex]: event.target.value }))
                        }
                        onBlur={() => commitOptionValuesDraft(optionIndex)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            (event.currentTarget as HTMLInputElement).blur();
                          }
                        }}
                        className="w-full border border-stone-300 bg-white px-3 py-2 text-sm"
                        placeholder="Comma or new line separated values"
                      />
                      <button
                        type="button"
                        onClick={() => removeOption(optionIndex)}
                        className="border border-stone-300 px-3 py-2 text-[10px] uppercase tracking-luxury text-stone-700"
                      >
                        Delete
                      </button>
                    </div>

                    {isColorOption(option.name) && option.values.length > 0 ? (
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {option.values.map((colorValue) => {
                          const swatch = product.option_swatches?.[option.name]?.[colorValue] || getFallbackSwatch(colorValue);
                          return (
                            <div key={`${option.name}-${colorValue}`} className="grid grid-cols-[1fr_56px_92px] items-center gap-2">
                              <span className="truncate text-xs text-stone-700">{colorValue}</span>
                              <input
                                type="color"
                                value={swatch}
                                onChange={(event) => setSwatch(option.name, colorValue, event.target.value)}
                                className="h-9 w-14 border border-stone-300 bg-white p-1"
                              />
                              <input
                                value={swatch}
                                onChange={(event) => setSwatch(option.name, colorValue, event.target.value)}
                                className="w-full border border-stone-300 bg-white px-2 py-2 text-xs uppercase"
                              />
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3 border border-stone-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[10px] uppercase tracking-luxury text-stone-500">Variants</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={regenerateVariants}
                  className="border border-stone-950 px-3 py-1 text-[10px] uppercase tracking-luxury text-stone-950"
                >
                  Generate / Refresh
                </button>
                <button
                  type="button"
                  onClick={addManualVariant}
                  className="border border-stone-300 px-3 py-1 text-[10px] uppercase tracking-luxury text-stone-700"
                >
                  Add Manual
                </button>
              </div>
            </div>

            {options.length > 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-2 border border-stone-200 bg-stone-50 px-3 py-2">
                <p className="text-xs text-stone-700">{combinationCount} possible combinations.</p>
                <p className="text-[10px] uppercase tracking-luxury text-stone-500">Generate after changing options.</p>
              </div>
            ) : null}

            {variants.length === 0 ? (
              <p className="text-sm text-stone-500">No variants yet.</p>
            ) : (
              <div className="overflow-x-auto border border-stone-200">
                <table className="min-w-[1100px] w-full border-collapse">
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
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((variant, variantIndex) => {
                      const signature = buildVariantSignature(options, variant.option_values);
                      const isDuplicate = duplicateVariantSignatures.has(signature);
                      const label = buildVariantLabel(options, variant.option_values);

                      return (
                        <tr key={`${variant.id}-${variantIndex}`}>
                          <td className="border-b border-stone-200 px-3 py-2 align-top">
                            <p className="text-sm text-stone-900">{label || variant.title || 'Variant'}</p>
                            <p className="mt-1 text-[10px] uppercase tracking-luxury text-stone-500">{variant.id}</p>
                            {isDuplicate ? (
                              <p className="mt-1 text-[10px] uppercase tracking-luxury text-red-700">
                                Duplicate combination
                              </p>
                            ) : null}
                            <div className="mt-2 space-y-1.5">
                              {options.map((option) => (
                                <label key={`${variant.id}-${option.name}`} className="grid grid-cols-[74px_minmax(0,1fr)] items-center gap-2">
                                  <span className="truncate text-[10px] uppercase tracking-luxury text-stone-500">{option.name}</span>
                                  <select
                                    value={variant.option_values[option.name] || option.values[0] || ''}
                                    onChange={(event) => updateVariantOption(variantIndex, option.name, event.target.value)}
                                    className="border border-stone-300 bg-white px-2 py-1.5 text-xs"
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
                          <td className="border-b border-stone-200 px-3 py-2 align-top">
                            <input
                              value={variant.sku || ''}
                              onChange={(event) => updateVariantField(variantIndex, 'sku', event.target.value)}
                              className="w-[150px] border border-stone-300 bg-white px-2 py-1.5 text-xs"
                              placeholder="SKU"
                            />
                          </td>
                          <td className="border-b border-stone-200 px-3 py-2 align-top">
                            <input
                              type="number"
                              value={variant.price ?? ''}
                              onChange={(event) =>
                                updateVariantField(
                                  variantIndex,
                                  'price',
                                  event.target.value ? Number(event.target.value) : undefined
                                )
                              }
                              className="w-[110px] border border-stone-300 bg-white px-2 py-1.5 text-xs"
                            />
                          </td>
                          <td className="border-b border-stone-200 px-3 py-2 align-top">
                            <input
                              type="number"
                              value={variant.compare_price ?? ''}
                              onChange={(event) =>
                                updateVariantField(
                                  variantIndex,
                                  'compare_price',
                                  event.target.value ? Number(event.target.value) : undefined
                                )
                              }
                              className="w-[110px] border border-stone-300 bg-white px-2 py-1.5 text-xs"
                            />
                          </td>
                          <td className="border-b border-stone-200 px-3 py-2 align-top">
                            <input
                              type="number"
                              value={variant.stock}
                              onChange={(event) => updateVariantField(variantIndex, 'stock', Number(event.target.value) || 0)}
                              className="w-[90px] border border-stone-300 bg-white px-2 py-1.5 text-xs"
                            />
                          </td>
                          <td className="border-b border-stone-200 px-3 py-2 align-top">
                            <MediaPicker
                              value={variant.image_url || ''}
                              onChange={(nextValue) => updateVariantField(variantIndex, 'image_url', nextValue || undefined)}
                              options={mediaPickerOptions}
                              placeholder="Select variant image"
                              emptyLabel="Use Primary Image"
                              className="w-[240px]"
                            />
                            {variant.image_url ? (
                              <p className="mt-1 max-w-[220px] break-all font-mono text-[10px] text-stone-500">
                                {variant.image_url}
                              </p>
                            ) : null}
                          </td>
                          <td className="border-b border-stone-200 px-3 py-2 align-top">
                            <button
                              type="button"
                              onClick={() => removeVariant(variantIndex)}
                              className="border border-stone-300 px-3 py-1 text-[10px] uppercase tracking-luxury text-stone-700"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {/* Customer Reviews */}
          <div className="space-y-3 border border-stone-200 p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <p className="text-[10px] uppercase tracking-luxury text-stone-500">Customer Reviews</p>
                <span className="inline-flex h-5 min-w-[20px] items-center justify-center bg-stone-100 px-1.5 text-[10px] font-medium text-stone-700">
                  {(product.reviews || []).length}
                </span>
              </div>
              <button
                type="button"
                onClick={startAddReview}
                className="border border-stone-950 px-3 py-1 text-[10px] uppercase tracking-luxury text-stone-950"
              >
                Add Review
              </button>
            </div>

            {editingReviewIndex !== null ? (
              <div className="space-y-3 border border-stone-200 bg-stone-50 p-3">
                <p className="text-[10px] uppercase tracking-luxury text-stone-500">
                  {editingReviewIndex === -1 ? 'New Review' : 'Edit Review'}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-luxury text-stone-500">Customer Name</p>
                    <input
                      type="text"
                      value={reviewDraft.name}
                      onChange={(e) => { setReviewDraft({ ...reviewDraft, name: e.target.value }); setProfileSearch(e.target.value); }}
                      placeholder="Type to search profiles or enter name..."
                      className="mt-1 w-full border border-stone-300 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-stone-950"
                    />
                    {profileSearch.length >= 2 && (
                      <div className="mt-1 max-h-40 overflow-y-auto border border-stone-200 bg-white">
                        {profiles
                          .filter((p) => p.name.toLowerCase().includes(profileSearch.toLowerCase()))
                          .slice(0, 10)
                          .map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => { setReviewDraft({ ...reviewDraft, name: p.name }); setProfileSearch(''); }}
                              className="block w-full px-3 py-2 text-left text-sm text-stone-700 hover:bg-stone-100"
                            >
                              {p.name}
                            </button>
                          ))}
                        {profiles.filter((p) => p.name.toLowerCase().includes(profileSearch.toLowerCase())).length === 0 && (
                          <p className="px-3 py-2 text-xs text-stone-400">No profiles found. Name will be used as-is.</p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-luxury text-stone-500">Rating</label>
                    <select
                      value={reviewDraft.rating}
                      onChange={(event) => setReviewDraft((prev) => ({ ...prev, rating: Number(event.target.value) }))}
                      className="w-full border border-stone-300 bg-white px-3 py-2 text-sm"
                    >
                      {[5, 4, 3, 2, 1].map((value) => (
                        <option key={value} value={value}>
                          {value} Star{value !== 1 ? 's' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-luxury text-stone-500">Review Text</label>
                  <textarea
                    rows={3}
                    value={reviewDraft.text}
                    onChange={(event) => setReviewDraft((prev) => ({ ...prev, text: event.target.value }))}
                    className="w-full resize-y border border-stone-300 bg-white px-3 py-2 text-sm leading-relaxed"
                    placeholder="Write the review text..."
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-luxury text-stone-500">Date</label>
                    <input
                      type="date"
                      value={reviewDraft.date}
                      onChange={(event) => setReviewDraft((prev) => ({ ...prev, date: event.target.value }))}
                      className="w-full border border-stone-300 bg-white px-3 py-2 text-sm"
                    />
                  </div>
                  <label className="space-y-2 block">
                    <span className="text-[10px] uppercase tracking-luxury text-stone-500">Verified Purchase</span>
                    <span className="flex h-[42px] items-center gap-2 border border-stone-300 bg-white px-3">
                      <input
                        type="checkbox"
                        checked={reviewDraft.verified}
                        onChange={(event) => setReviewDraft((prev) => ({ ...prev, verified: event.target.checked }))}
                        className="h-4 w-4 border border-stone-300"
                      />
                      <span className="text-xs text-stone-700">Verified purchase</span>
                    </span>
                  </label>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={saveReviewDraft}
                    className="bg-stone-950 px-4 py-1.5 text-[10px] uppercase tracking-luxury text-white"
                  >
                    Save Review
                  </button>
                  <button
                    type="button"
                    onClick={cancelReviewEdit}
                    className="border border-stone-300 px-4 py-1.5 text-[10px] uppercase tracking-luxury text-stone-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}

            {(product.reviews || []).length === 0 && editingReviewIndex === null ? (
              <p className="text-sm text-stone-500">No reviews yet. Add customer reviews to display on the product page.</p>
            ) : null}

            {(product.reviews || []).length > 0 ? (
              <div className="space-y-3">
                {(product.reviews || []).map((review, reviewIndex) => (
                  <div key={review.id} className="border border-stone-200 bg-white p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm text-amber-500">
                          {Array.from({ length: 5 }, (_, i) => (
                            <span key={i} style={{ color: i < review.rating ? '#c9a24a' : '#d6d3d1' }}>
                              {'\u2605'}
                            </span>
                          ))}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-stone-900">{review.name}</span>
                          <span className="text-xs text-stone-500">{review.date}</span>
                          {review.verified ? (
                            <span className="bg-emerald-50 px-1.5 py-0.5 text-[10px] uppercase tracking-luxury text-emerald-700">
                              Verified
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-stone-700">{review.text}</p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => startEditReview(reviewIndex)}
                          className="border border-stone-300 px-2 py-1 text-[10px] uppercase tracking-luxury text-stone-700"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteReview(reviewIndex)}
                          className="border border-stone-300 px-2 py-1 text-[10px] uppercase tracking-luxury text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </article>

        <aside className="min-w-0 space-y-5">

          <article className="space-y-3 border border-stone-200 bg-white p-4 sm:p-5">
            <p className="text-[10px] uppercase tracking-luxury text-stone-500">Preview</p>
            <div className="relative aspect-[4/5] overflow-hidden border border-stone-200 bg-stone-100">
              <Image
                src={product.primary_image_url || product.images[0] || fallbackImage}
                alt={product.name || 'Preview image'}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 380px"
              />
            </div>
            {(product.gallery_images || []).length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {(product.gallery_images || []).slice(0, 6).map((url, index) => (
                  <div key={`${url}-${index}`} className="relative aspect-square overflow-hidden border border-stone-200 bg-stone-100">
                    <Image
                      src={url}
                      alt={`Gallery preview ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="120px"
                    />
                  </div>
                ))}
              </div>
            ) : null}
            <p className="text-xs text-stone-600">
              {variants.length > 0 ? `${variants.length} variants · ${product.stock} total stock` : `${product.stock} stock units`}
            </p>
          </article>
        </aside>
      </div>
    </section>
  );
}
