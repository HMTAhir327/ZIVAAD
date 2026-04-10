'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import type { Product, ProductCategory } from '@/lib/types';

import { ProductCard } from './product-card';

type FilterCategory = ProductCategory | 'all';
type AvailabilityFilter = 'all' | 'in-stock' | 'low-stock' | 'sold-out';
type PriceFilter = 'all' | 'under-2500' | '2500-5000' | 'over-5000';
type SortOption = 'featured' | 'best-selling' | 'az' | 'za' | 'price-low-high' | 'price-high-low' | 'new-old' | 'old-new';

interface ProductGridProps {
  products: Product[];
  initialCategory?: FilterCategory;
  initialQuery?: string;
  shuffleOnInitialLoad?: boolean;
}

interface FilterOption<T extends string> {
  label: string;
  value: T;
}

function formatCategoryLabel(category: string): string {
  return category
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');
}

function extractNumericId(value: string): number {
  const match = value.match(/\d+/g);
  if (!match || match.length === 0) {
    return 0;
  }

  return Number(match.join('')) || 0;
}

function hashString(input: string): number {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function ProductGrid({
  products,
  initialCategory = 'all',
  initialQuery = '',
  shuffleOnInitialLoad = true
}: ProductGridProps) {
  const [category, setCategory] = useState<FilterCategory>(initialCategory);
  const [query, setQuery] = useState(initialQuery);
  const [availability, setAvailability] = useState<AvailabilityFilter>('all');
  const [priceQuick, setPriceQuick] = useState<PriceFilter>('all');
  const [minPriceInput, setMinPriceInput] = useState('');
  const [maxPriceInput, setMaxPriceInput] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isMobileFilterSidebarOpen, setIsMobileFilterSidebarOpen] = useState(false);
  const [activeFilterColumn, setActiveFilterColumn] = useState<'category' | 'availability' | 'price'>('category');
  const [shuffleSeed] = useState(() => Math.random().toString(36).slice(2));
  const [hasUserAppliedFilters, setHasUserAppliedFilters] = useState(
    initialCategory !== 'all' || Boolean(initialQuery.trim())
  );
  const filterPanelRef = useRef<HTMLDivElement>(null);

  const categoryOptions = useMemo(() => {
    const categories = Array.from(new Set(products.map((product) => product.category).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b)
    );
    return [{ label: 'All', value: 'all' as const }, ...categories.map((value) => ({ label: formatCategoryLabel(value), value }))];
  }, [products]);

  const availabilityOptions: FilterOption<AvailabilityFilter>[] = [
    { label: 'All', value: 'all' },
    { label: 'In stock', value: 'in-stock' },
    { label: 'Low stock (<5)', value: 'low-stock' },
    { label: 'Sold out', value: 'sold-out' }
  ];

  const priceOptions: FilterOption<PriceFilter>[] = [
    { label: 'All', value: 'all' },
    { label: 'Under 2,500 PKR', value: 'under-2500' },
    { label: '2,500 - 5,000 PKR', value: '2500-5000' },
    { label: 'Over 5,000 PKR', value: 'over-5000' }
  ];

  const sortOptions: FilterOption<SortOption>[] = [
    { label: 'Featured', value: 'featured' },
    { label: 'Best selling', value: 'best-selling' },
    { label: 'Alphabetically, A-Z', value: 'az' },
    { label: 'Alphabetically, Z-A', value: 'za' },
    { label: 'Price, low to high', value: 'price-low-high' },
    { label: 'Price, high to low', value: 'price-high-low' },
    { label: 'Date, old to new', value: 'old-new' },
    { label: 'Date, new to old', value: 'new-old' }
  ];

  useEffect(() => {
    setCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (!isFilterPanelOpen) {
      return;
    }

    function onPointerDown(event: PointerEvent) {
      if (!filterPanelRef.current) {
        return;
      }
      if (event.target instanceof Node && !filterPanelRef.current.contains(event.target)) {
        setIsFilterPanelOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsFilterPanelOpen(false);
      }
    }

    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isFilterPanelOpen]);

  useEffect(() => {
    if (!isMobileFilterSidebarOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsMobileFilterSidebarOpen(false);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isMobileFilterSidebarOpen]);

  const parsedMinPrice = Number(minPriceInput);
  const parsedMaxPrice = Number(maxPriceInput);
  const minPrice = Number.isFinite(parsedMinPrice) && parsedMinPrice > 0 ? parsedMinPrice : null;
  const maxPrice = Number.isFinite(parsedMaxPrice) && parsedMaxPrice > 0 ? parsedMaxPrice : null;
  const hasActiveFilters =
    category !== 'all' || availability !== 'all' || priceQuick !== 'all' || minPrice !== null || maxPrice !== null || Boolean(query.trim());

  useEffect(() => {
    if (hasActiveFilters) {
      setHasUserAppliedFilters(true);
    }
  }, [hasActiveFilters]);

  const highestPrice = useMemo(() => {
    if (products.length === 0) {
      return 0;
    }

    return products.reduce((highest, product) => Math.max(highest, product.price), 0);
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return products
      .map((product, index) => ({
        product,
        index,
        numericId: extractNumericId(product.id),
        shuffleRank: hashString(`${shuffleSeed}:${product.id}`)
      }))
      .filter(({ product }) => {
      const categoryMatch = category === 'all' || product.category === category;
      if (!categoryMatch) {
        return false;
      }

        const availabilityMatch =
          availability === 'all' ||
          (availability === 'in-stock' && product.stock > 0) ||
          (availability === 'low-stock' && product.stock > 0 && product.stock < 5) ||
          (availability === 'sold-out' && product.stock <= 0);
        if (!availabilityMatch) {
          return false;
        }

        const quickPriceMatch =
          priceQuick === 'all' ||
          (priceQuick === 'under-2500' && product.price < 2500) ||
          (priceQuick === '2500-5000' && product.price >= 2500 && product.price <= 5000) ||
          (priceQuick === 'over-5000' && product.price > 5000);
        if (!quickPriceMatch) {
          return false;
        }

        const minMatch = minPrice === null || product.price >= minPrice;
        const maxMatch = maxPrice === null || product.price <= maxPrice;
        if (!minMatch || !maxMatch) {
          return false;
        }

      if (!normalizedQuery) {
        return true;
      }

      const searchContent = [
        product.id,
        product.name,
        product.description,
        product.category,
        product.badge
      ]
        .join(' ')
        .toLowerCase();

      return searchContent.includes(normalizedQuery);
      })
      .sort((a, b) => {
        const shouldUseShuffle =
          shuffleOnInitialLoad && sortBy === 'featured' && !hasUserAppliedFilters && !hasActiveFilters;
        if (shouldUseShuffle) {
          return a.shuffleRank - b.shuffleRank;
        }

        if (sortBy === 'featured') {
          return a.index - b.index;
        }

        if (sortBy === 'best-selling') {
          const scoreA =
            (a.product.badge.trim().toUpperCase() === 'BESTSELLER' ? 3 : 0) +
            (a.product.stock > 0 && a.product.stock < 5 ? 1 : 0);
          const scoreB =
            (b.product.badge.trim().toUpperCase() === 'BESTSELLER' ? 3 : 0) +
            (b.product.stock > 0 && b.product.stock < 5 ? 1 : 0);

          if (scoreA !== scoreB) {
            return scoreB - scoreA;
          }

          return a.index - b.index;
        }

        if (sortBy === 'az') {
          return a.product.name.localeCompare(b.product.name);
        }

        if (sortBy === 'za') {
          return b.product.name.localeCompare(a.product.name);
        }

        if (sortBy === 'price-low-high') {
          return a.product.price - b.product.price;
        }

        if (sortBy === 'price-high-low') {
          return b.product.price - a.product.price;
        }

        if (sortBy === 'new-old') {
          if (a.numericId !== b.numericId) {
            return b.numericId - a.numericId;
          }
          return b.index - a.index;
        }

        if (sortBy === 'old-new') {
          if (a.numericId !== b.numericId) {
            return a.numericId - b.numericId;
          }
          return a.index - b.index;
        }

        return a.index - b.index;
      })
      .map((entry) => entry.product);
  }, [
    products,
    category,
    query,
    availability,
    priceQuick,
    minPrice,
    maxPrice,
    sortBy,
    shuffleSeed,
    hasUserAppliedFilters,
    hasActiveFilters,
    shuffleOnInitialLoad
  ]);

  const selectedCategoryLabel = categoryOptions.find((option) => option.value === category)?.label || 'All';
  const selectedAvailabilityLabel = availabilityOptions.find((option) => option.value === availability)?.label || 'All';
  const selectedPriceLabel = priceOptions.find((option) => option.value === priceQuick)?.label || 'All';
  const activeFilterCount = [
    hasActiveFilters && category !== 'all',
    hasActiveFilters && availability !== 'all',
    hasActiveFilters && priceQuick !== 'all',
    hasActiveFilters && minPrice !== null,
    hasActiveFilters && maxPrice !== null,
    hasActiveFilters && Boolean(query.trim())
  ].filter(Boolean).length;

  function openFilterPanel(column: 'category' | 'availability' | 'price') {
    if (isFilterPanelOpen && activeFilterColumn === column) {
      setIsFilterPanelOpen(false);
      return;
    }

    setActiveFilterColumn(column);
    setIsFilterPanelOpen(true);
  }

  function resetFilters() {
    setCategory('all');
    setAvailability('all');
    setPriceQuick('all');
    setMinPriceInput('');
    setMaxPriceInput('');
    setQuery('');
    setIsFilterPanelOpen(false);
    setIsMobileFilterSidebarOpen(false);
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="relative border-b border-stone-200 pb-4 sm:pb-5">
        <div className="hidden items-center justify-between gap-4 lg:flex">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-stone-700">
            <span className="text-[15px] font-medium text-stone-900">Filter:</span>
            <button
              type="button"
              onClick={() => openFilterPanel('category')}
              className="flex items-center gap-1.5 text-[15px] text-stone-700 transition-colors hover:text-stone-950"
            >
              Category
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => openFilterPanel('availability')}
              className="flex items-center gap-1.5 text-[15px] text-stone-700 transition-colors hover:text-stone-950"
            >
              Availability
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => openFilterPanel('price')}
              className="flex items-center gap-1.5 text-[15px] text-stone-700 transition-colors hover:text-stone-950"
            >
              Price
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {activeFilterCount > 0 ? (
              <button
                type="button"
                onClick={resetFilters}
                className="text-[12px] uppercase tracking-luxury text-stone-500 underline underline-offset-2 hover:text-stone-900"
              >
                Reset
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-stone-700 sm:gap-3">
            <label htmlFor="shop-sort" className="text-[15px] font-medium text-stone-900">
              Sort by:
            </label>
            <select
              id="shop-sort"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortOption)}
              className="border border-stone-300 bg-white px-3 py-2 text-[15px] text-stone-800 outline-none transition-colors focus:border-stone-950"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="text-[15px] text-stone-500">{filteredProducts.length} products</span>
          </div>
        </div>

        <div className="space-y-3 lg:hidden">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setIsFilterPanelOpen(false);
                setIsMobileFilterSidebarOpen(true);
              }}
              className="inline-flex items-center gap-2 border border-stone-300 bg-white px-3 py-2 text-[13px] uppercase tracking-luxury text-stone-800"
            >
              Filters
              {activeFilterCount > 0 ? (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-stone-300 px-1 text-[10px]">
                  {activeFilterCount}
                </span>
              ) : null}
            </button>

            <div className="flex items-center gap-2 text-stone-700">
              <label htmlFor="shop-sort-mobile" className="text-[13px] uppercase tracking-luxury text-stone-600">
                Sort
              </label>
              <select
                id="shop-sort-mobile"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as SortOption)}
                className="border border-stone-300 bg-white px-2.5 py-2 text-[13px] text-stone-800 outline-none transition-colors focus:border-stone-950"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-[13px] text-stone-500">{filteredProducts.length} products</p>
        </div>

        {isFilterPanelOpen ? (
          <div
            ref={filterPanelRef}
            className={`absolute left-0 top-full z-40 mt-3 hidden border border-stone-200 bg-[#f8f8f7] shadow-[0_10px_24px_rgba(17,17,17,0.1)] lg:block ${
              activeFilterColumn === 'price' ? 'w-[min(100%,390px)]' : 'w-[min(100%,280px)]'
            }`}
          >
            {activeFilterColumn === 'category' ? (
              <div className="p-2">
                {categoryOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setCategory(option.value)}
                    className={`flex w-full items-center justify-between px-2.5 py-1.5 text-left text-[15px] leading-6 ${
                      category === option.value ? 'bg-[#06080b] text-white' : 'text-stone-700 hover:bg-white'
                    }`}
                  >
                    <span>{option.label}</span>
                    {category === option.value ? <span>✓</span> : null}
                  </button>
                ))}
              </div>
            ) : null}

            {activeFilterColumn === 'availability' ? (
              <div className="p-2">
                {availabilityOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setAvailability(option.value)}
                    className={`flex w-full items-center justify-between px-2.5 py-1.5 text-left text-[15px] leading-6 ${
                      availability === option.value ? 'bg-[#06080b] text-white' : 'text-stone-700 hover:bg-white'
                    }`}
                  >
                    <span>{option.label}</span>
                    {availability === option.value ? <span>✓</span> : null}
                  </button>
                ))}
              </div>
            ) : null}

            {activeFilterColumn === 'price' ? (
              <>
                <div className="flex flex-wrap items-center justify-between border-b border-stone-200 px-4 py-2.5 text-[14px] text-stone-700">
                  <p>The highest price is PKR {highestPrice.toLocaleString()}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setPriceQuick('all');
                      setMinPriceInput('');
                      setMaxPriceInput('');
                    }}
                    className="text-[11px] uppercase tracking-luxury underline underline-offset-2 hover:text-stone-950"
                  >
                    Reset
                  </button>
                </div>
                <div className="p-2">
                  {priceOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setPriceQuick(option.value)}
                      className={`flex w-full items-center justify-between px-2.5 py-1.5 text-left text-[15px] leading-6 ${
                        priceQuick === option.value ? 'bg-[#06080b] text-white' : 'text-stone-700 hover:bg-white'
                      }`}
                    >
                      <span>{option.label}</span>
                      {priceQuick === option.value ? <span>✓</span> : null}
                    </button>
                  ))}

                  <div className="mt-2.5 border-t border-stone-200 px-1 pt-2.5">
                    <p className="mb-2 text-[10px] uppercase tracking-luxury text-stone-500">Custom Range</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <label className="flex items-center gap-2 border border-stone-300 bg-white px-2.5 py-1.5 text-[14px] text-stone-700">
                        <span className="text-stone-500">Rs</span>
                        <input
                          value={minPriceInput}
                          onChange={(event) => setMinPriceInput(event.target.value.replace(/[^\d]/g, ''))}
                          placeholder="From"
                          inputMode="numeric"
                          className="w-full bg-transparent outline-none"
                        />
                      </label>
                      <label className="flex items-center gap-2 border border-stone-300 bg-white px-2.5 py-1.5 text-[14px] text-stone-700">
                        <span className="text-stone-500">Rs</span>
                        <input
                          value={maxPriceInput}
                          onChange={(event) => setMaxPriceInput(event.target.value.replace(/[^\d]/g, ''))}
                          placeholder="To"
                          inputMode="numeric"
                          className="w-full bg-transparent outline-none"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        ) : null}

        {isMobileFilterSidebarOpen ? (
          <>
            <button
              type="button"
              aria-label="Close filters"
              onClick={() => setIsMobileFilterSidebarOpen(false)}
              className="fixed inset-0 z-[220] bg-stone-950/45 backdrop-blur-[2px] lg:hidden"
            />
            <aside className="fixed inset-y-0 left-0 z-[230] w-[min(88vw,360px)] border-r border-stone-200 bg-[#f8f8f7] shadow-[0_30px_80px_rgba(17,17,17,0.28)] lg:hidden">
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
                  <p className="text-[12px] uppercase tracking-luxury text-stone-700">Filters</p>
                  <button
                    type="button"
                    onClick={() => setIsMobileFilterSidebarOpen(false)}
                    className="inline-flex h-9 w-9 items-center justify-center border border-stone-300 text-stone-700"
                    aria-label="Close filters sidebar"
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M6 6l12 12" />
                      <path d="M18 6L6 18" />
                    </svg>
                  </button>
                </div>

                <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
                  <section className="space-y-2">
                    <p className="text-[10px] uppercase tracking-luxury text-stone-500">Category</p>
                    <div className="space-y-1">
                      {categoryOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setCategory(option.value)}
                          className={`flex w-full items-center justify-between px-3 py-2 text-left text-[14px] ${
                            category === option.value ? 'bg-[#06080b] text-white' : 'bg-white text-stone-700'
                          }`}
                        >
                          <span>{option.label}</span>
                          {category === option.value ? <span>✓</span> : null}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-2">
                    <p className="text-[10px] uppercase tracking-luxury text-stone-500">Availability</p>
                    <div className="space-y-1">
                      {availabilityOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setAvailability(option.value)}
                          className={`flex w-full items-center justify-between px-3 py-2 text-left text-[14px] ${
                            availability === option.value ? 'bg-[#06080b] text-white' : 'bg-white text-stone-700'
                          }`}
                        >
                          <span>{option.label}</span>
                          {availability === option.value ? <span>✓</span> : null}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] uppercase tracking-luxury text-stone-500">Price</p>
                      <button
                        type="button"
                        onClick={() => {
                          setPriceQuick('all');
                          setMinPriceInput('');
                          setMaxPriceInput('');
                        }}
                        className="text-[10px] uppercase tracking-luxury text-stone-500 underline underline-offset-2"
                      >
                        Reset
                      </button>
                    </div>

                    <p className="text-[13px] text-stone-600">Highest price: PKR {highestPrice.toLocaleString()}</p>

                    <div className="space-y-1">
                      {priceOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setPriceQuick(option.value)}
                          className={`flex w-full items-center justify-between px-3 py-2 text-left text-[14px] ${
                            priceQuick === option.value ? 'bg-[#06080b] text-white' : 'bg-white text-stone-700'
                          }`}
                        >
                          <span>{option.label}</span>
                          {priceQuick === option.value ? <span>✓</span> : null}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <label className="flex items-center gap-2 border border-stone-300 bg-white px-2.5 py-2 text-[13px] text-stone-700">
                        <span className="text-stone-500">Rs</span>
                        <input
                          value={minPriceInput}
                          onChange={(event) => setMinPriceInput(event.target.value.replace(/[^\d]/g, ''))}
                          placeholder="From"
                          inputMode="numeric"
                          className="w-full bg-transparent outline-none"
                        />
                      </label>
                      <label className="flex items-center gap-2 border border-stone-300 bg-white px-2.5 py-2 text-[13px] text-stone-700">
                        <span className="text-stone-500">Rs</span>
                        <input
                          value={maxPriceInput}
                          onChange={(event) => setMaxPriceInput(event.target.value.replace(/[^\d]/g, ''))}
                          placeholder="To"
                          inputMode="numeric"
                          className="w-full bg-transparent outline-none"
                        />
                      </label>
                    </div>
                  </section>
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-stone-200 px-4 py-3">
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="border border-stone-300 bg-white px-3 py-2 text-[11px] uppercase tracking-luxury text-stone-700"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMobileFilterSidebarOpen(false)}
                    className="bg-stone-950 px-3 py-2 text-[11px] uppercase tracking-luxury text-white"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </aside>
          </>
        ) : null}

        {query.trim() ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-stone-600">
            <span>Search:</span>
            <span className="font-medium text-stone-900">&quot;{query}&quot;</span>
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-[11px] uppercase tracking-luxury text-stone-500 underline underline-offset-2 hover:text-stone-900"
            >
              Clear
            </button>
          </div>
        ) : null}

        {(category !== 'all' || availability !== 'all' || priceQuick !== 'all' || minPrice !== null || maxPrice !== null) ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-luxury text-stone-500">
            <span>Active:</span>
            {category !== 'all' ? <span className="border border-stone-300 px-2 py-1">{selectedCategoryLabel}</span> : null}
            {availability !== 'all' ? <span className="border border-stone-300 px-2 py-1">{selectedAvailabilityLabel}</span> : null}
            {priceQuick !== 'all' ? <span className="border border-stone-300 px-2 py-1">{selectedPriceLabel}</span> : null}
            {minPrice !== null ? <span className="border border-stone-300 px-2 py-1">From {minPrice.toLocaleString()} PKR</span> : null}
            {maxPrice !== null ? <span className="border border-stone-300 px-2 py-1">To {maxPrice.toLocaleString()} PKR</span> : null}
          </div>
        ) : null}
      </div>

      {filteredProducts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white/70 p-8 text-center text-sm text-stone-600 sm:rounded-3xl sm:p-10">
          No products match the current filters.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} disableRevealAnimation />
          ))}
        </div>
      )}
    </div>
  );
}
