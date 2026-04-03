import type { Product, ProductOption, ProductVariant } from '@/lib/types';

type VariantSource = Pick<Partial<Product>, 'product_options' | 'product_variants'>;

export type VariantSelection = Record<string, string>;

export interface ProductVariantData {
  options: ProductOption[];
  variants: ProductVariant[];
}

const fallbackImage =
  'https://res.cloudinary.com/demo/image/upload/v1690000000/samples/ecommerce/accessories-bag.jpg';

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeOptionName(value: unknown): string {
  return normalizeString(value);
}

function normalizeOptionValue(value: unknown): string {
  return normalizeString(value);
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function toNonNegativeNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(0, parsed);
}

function toOptionalPositiveNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return Math.max(0, parsed);
}

function findOptionNameByCaseInsensitiveMatch(options: ProductOption[], rawKey: string): string | undefined {
  const normalizedKey = rawKey.trim().toLowerCase();
  if (!normalizedKey) {
    return undefined;
  }

  if (options.length === 0) {
    return rawKey;
  }

  const matched = options.find((option) => option.name.toLowerCase() === normalizedKey);
  return matched?.name;
}

export function normalizeProductOptionDefinitions(rawOptions: unknown): ProductOption[] {
  if (!Array.isArray(rawOptions)) {
    return [];
  }

  const normalized: ProductOption[] = [];
  const seenNames = new Set<string>();

  for (const rawOption of rawOptions) {
    if (!rawOption || typeof rawOption !== 'object') {
      continue;
    }

    const option = rawOption as Partial<ProductOption>;
    const name = normalizeOptionName(option.name);
    if (!name) {
      continue;
    }

    const key = name.toLowerCase();
    if (seenNames.has(key)) {
      continue;
    }

    const rawValues = Array.isArray(option.values) ? option.values : [];
    const values = uniqueStrings(rawValues.map((value) => normalizeOptionValue(value)));
    if (values.length === 0) {
      continue;
    }

    seenNames.add(key);
    normalized.push({ name, values });
  }

  return normalized;
}

function deriveOptionsFromVariants(rawVariants: unknown): ProductOption[] {
  if (!Array.isArray(rawVariants)) {
    return [];
  }

  const valuesByName = new Map<string, string[]>();

  for (const rawVariant of rawVariants) {
    if (!rawVariant || typeof rawVariant !== 'object') {
      continue;
    }

    const variant = rawVariant as Partial<ProductVariant>;
    const optionValues = variant.option_values;
    if (!optionValues || typeof optionValues !== 'object') {
      continue;
    }

    for (const [rawKey, rawValue] of Object.entries(optionValues)) {
      const name = normalizeOptionName(rawKey);
      const value = normalizeOptionValue(rawValue);
      if (!name || !value) {
        continue;
      }

      const existing = valuesByName.get(name) ?? [];
      if (!existing.includes(value)) {
        existing.push(value);
      }
      valuesByName.set(name, existing);
    }
  }

  return Array.from(valuesByName.entries())
    .map(([name, values]) => ({ name, values }))
    .filter((option) => option.values.length > 0);
}

export function normalizeProductVariantDefinitions(rawVariants: unknown, options: ProductOption[]): ProductVariant[] {
  if (!Array.isArray(rawVariants)) {
    return [];
  }

  const normalized: ProductVariant[] = [];
  const seenIds = new Set<string>();

  rawVariants.forEach((rawVariant, index) => {
    if (!rawVariant || typeof rawVariant !== 'object') {
      return;
    }

    const variant = rawVariant as Partial<ProductVariant>;
    const rawId = normalizeString(variant.id);
    const rawSku = normalizeString(variant.sku);
    const idSeed = rawId || rawSku || `variant-${index + 1}`;
    let id = idSeed;

    if (seenIds.has(id)) {
      id = `${id}-${index + 1}`;
    }
    seenIds.add(id);

    const rawOptionValues = variant.option_values && typeof variant.option_values === 'object' ? variant.option_values : {};
    const optionValues: Record<string, string> = {};

    for (const [rawKey, rawValue] of Object.entries(rawOptionValues)) {
      const key = normalizeOptionName(rawKey);
      const value = normalizeOptionValue(rawValue);
      if (!key || !value) {
        continue;
      }
      const optionName = findOptionNameByCaseInsensitiveMatch(options, key);
      if (!optionName) {
        continue;
      }
      optionValues[optionName] = value;
    }

    for (const option of options) {
      if (!optionValues[option.name] && option.values[0]) {
        optionValues[option.name] = option.values[0];
      }
    }

    normalized.push({
      id,
      sku: rawSku || undefined,
      title: normalizeString(variant.title) || undefined,
      option_values: optionValues,
      price: toOptionalPositiveNumber(variant.price),
      compare_price: toOptionalPositiveNumber(variant.compare_price),
      stock: toNonNegativeNumber(variant.stock, 0),
      image_url: normalizeString(variant.image_url) || undefined
    });
  });

  return normalized;
}

export function getProductVariantData(source: VariantSource): ProductVariantData {
  const baseOptions = normalizeProductOptionDefinitions(source.product_options);
  const derivedOptions = baseOptions.length > 0 ? baseOptions : deriveOptionsFromVariants(source.product_variants);
  const options = normalizeProductOptionDefinitions(derivedOptions);
  const variants = normalizeProductVariantDefinitions(source.product_variants, options);

  return { options, variants };
}

function normalizeSelection(selection: VariantSelection | undefined): VariantSelection {
  if (!selection || typeof selection !== 'object') {
    return {};
  }

  const normalized: VariantSelection = {};
  Object.entries(selection).forEach(([key, value]) => {
    const optionName = normalizeOptionName(key);
    const optionValue = normalizeOptionValue(value);
    if (!optionName || !optionValue) {
      return;
    }
    normalized[optionName] = optionValue;
  });

  return normalized;
}

export function buildInitialVariantSelection(product: Product): VariantSelection {
  const { options, variants } = getProductVariantData(product);
  if (options.length === 0 || variants.length === 0) {
    return {};
  }

  const seed = variants.find((variant) => variant.stock > 0) || variants[0];
  const selection: VariantSelection = {};

  options.forEach((option) => {
    const seededValue = normalizeOptionValue(seed.option_values[option.name]);
    const fallbackValue = option.values[0];
    const value = seededValue || fallbackValue;
    if (value) {
      selection[option.name] = value;
    }
  });

  return selection;
}

function valueEquals(left: string | undefined, right: string | undefined): boolean {
  return normalizeOptionValue(left).toLowerCase() === normalizeOptionValue(right).toLowerCase();
}

export function findMatchingVariant(product: Product, selection: VariantSelection): ProductVariant | undefined {
  const { options, variants } = getProductVariantData(product);
  if (options.length === 0 || variants.length === 0) {
    return undefined;
  }

  const normalizedSelection = normalizeSelection(selection);
  const hasCompleteSelection = options.every((option) => Boolean(normalizedSelection[option.name]));
  if (!hasCompleteSelection) {
    return undefined;
  }

  return variants.find((variant) =>
    options.every((option) => valueEquals(variant.option_values[option.name], normalizedSelection[option.name]))
  );
}

export function getDefaultVariant(product: Product): ProductVariant | undefined {
  const { variants } = getProductVariantData(product);
  return variants.find((variant) => variant.stock > 0) || variants[0];
}

export function getOptionValueAvailability(
  product: Product,
  selection: VariantSelection,
  optionName: string
): Record<string, boolean> {
  const { options, variants } = getProductVariantData(product);
  const option = options.find((item) => item.name === optionName);
  if (!option || variants.length === 0) {
    return {};
  }

  const normalizedSelection = normalizeSelection(selection);
  const availability: Record<string, boolean> = {};

  option.values.forEach((value) => {
    const isAvailable = variants.some((variant) => {
      if (!valueEquals(variant.option_values[optionName], value)) {
        return false;
      }

      for (const sibling of options) {
        if (sibling.name === optionName) {
          continue;
        }

        const selectedValue = normalizedSelection[sibling.name];
        if (!selectedValue) {
          continue;
        }

        if (!valueEquals(variant.option_values[sibling.name], selectedValue)) {
          return false;
        }
      }

      return variant.stock > 0;
    });

    availability[value] = isAvailable;
  });

  return availability;
}

export function formatSelectedOptions(selectedOptions: VariantSelection | undefined): string {
  const normalized = normalizeSelection(selectedOptions);
  const entries = Object.entries(normalized);
  if (entries.length === 0) {
    return '';
  }

  return entries.map(([key, value]) => `${key}: ${value}`).join(' · ');
}

export function buildCartLineId(
  productId: string,
  variant: ProductVariant | undefined,
  selectedOptions: VariantSelection | undefined
): string {
  if (variant?.id) {
    return `${productId}::${variant.id}`;
  }

  const normalized = normalizeSelection(selectedOptions);
  const optionsPart = Object.keys(normalized)
    .sort((a, b) => a.localeCompare(b))
    .map((key) => `${key.toLowerCase()}=${normalized[key].toLowerCase()}`)
    .join('|');

  return optionsPart ? `${productId}::${optionsPart}` : productId;
}

export function getEffectiveProductState(product: Product, variant?: ProductVariant) {
  const price = variant?.price ?? product.price;
  const comparePrice = variant?.compare_price ?? product.compare_price;
  const stock = typeof variant?.stock === 'number' ? variant.stock : product.stock;
  const image =
    variant?.image_url?.trim() ||
    product.primary_image_url ||
    product.images?.[0] ||
    fallbackImage;

  return {
    price,
    comparePrice,
    stock,
    image
  };
}
