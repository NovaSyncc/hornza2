'use client';

import { useState, useMemo, useCallback } from 'react';

// --- Price options by service type ---

const RENTAL_PRICES = [
  { value: 'all', label: 'Any Price' },
  { value: '0-15000', label: 'Up to 15K' },
  { value: '15000-30000', label: '15K - 30K' },
  { value: '30000-50000', label: '30K - 50K' },
  { value: '50000-100000', label: '50K - 100K' },
  { value: '100000', label: '100K+' },
];

const FURNISHED_PRICES = [
  { value: 'all', label: 'Any Price' },
  { value: '0-3000', label: 'Up to 3K/night' },
  { value: '3000-5000', label: '3K - 5K' },
  { value: '5000-10000', label: '5K - 10K' },
  { value: '10000', label: '10K+' },
];

const SALE_PRICES = [
  { value: 'all', label: 'Any Price' },
  { value: '0-5000000', label: 'Up to 5M' },
  { value: '5000000-10000000', label: '5M - 10M' },
  { value: '10000000-20000000', label: '10M - 20M' },
  { value: '20000000-50000000', label: '20M - 50M' },
  { value: '50000000', label: '50M+' },
];

// --- Location lists (kept for future autocomplete) ---

const RENTAL_LOCATIONS = [
  'Section 1', 'Section 2', 'Section 3', 'Section 7',
  'California', 'Jam Street', 'Eastleigh South', 'Eastleigh North',
  'South C', 'Pangani',
];

const SALE_LOCATIONS = [
  'Parklands', 'Westlands', 'Kilimani', 'Eastleigh',
  'South C', 'Pangani', 'Kileleshwa', 'Konza',
  'Malindi', 'Mombasa', 'Muthaiga', 'Nyali',
];

// --- Sort options ---

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'bedrooms_desc', label: 'Most Bedrooms' },
];

// --- Default filter state ---

const DEFAULT_FILTERS = {
  location: '',
  priceRange: 'all',
  bedrooms: 'all',
  bathrooms: 'all',
  propertyType: 'all',
  sortBy: 'newest',
};

// --- Shared styles ---

const inputBase =
  'w-full bg-white border border-gray-300 rounded-lg py-2.5 px-3 text-sm text-gray-900 ' +
  'focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-colors';

const selectClass = `${inputBase} appearance-none cursor-pointer`;

const labelClass = 'block text-xs text-gray-500 font-medium uppercase tracking-wide mb-1.5';

// --- Component ---

const SearchFilter = ({ onFilterChange, serviceType = 'rental', resultCount }) => {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const priceOptions = useMemo(() => {
    if (serviceType === 'sale') return SALE_PRICES;
    if (serviceType === 'furnished') return FURNISHED_PRICES;
    return RENTAL_PRICES;
  }, [serviceType]);

  const propertyTypes = useMemo(() => {
    const base = [
      { value: 'all', label: 'All Types' },
      { value: 'apartment', label: 'Apartment' },
      { value: 'bedsitter', label: 'Bedsitter' },
      { value: 'studio', label: 'Studio' },
      { value: 'house', label: 'House' },
    ];
    if (serviceType === 'sale') {
      base.push({ value: 'land', label: 'Land' });
      base.push({ value: 'commercial', label: 'Commercial' });
    }
    return base;
  }, [serviceType]);

  const handleFilterUpdate = useCallback(
    (key, value) => {
      setFilters((prev) => {
        const next = { ...prev, [key]: value };
        onFilterChange(next);
        return next;
      });
    },
    [onFilterChange]
  );

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    onFilterChange(DEFAULT_FILTERS);
  }, [onFilterChange]);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.location !== DEFAULT_FILTERS.location ||
      filters.priceRange !== DEFAULT_FILTERS.priceRange ||
      filters.bedrooms !== DEFAULT_FILTERS.bedrooms ||
      filters.bathrooms !== DEFAULT_FILTERS.bathrooms ||
      filters.propertyType !== DEFAULT_FILTERS.propertyType ||
      filters.sortBy !== DEFAULT_FILTERS.sortBy
    );
  }, [filters]);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 lg:p-6 mb-6 max-w-6xl mx-auto shadow-sm">
      {/* Row 1: Filter inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Location (text input) */}
        <div>
          <label className={labelClass}>Location</label>
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search location..."
              value={filters.location}
              onChange={(e) => handleFilterUpdate('location', e.target.value)}
              className={`${inputBase} pl-9`}
            />
          </div>
        </div>

        {/* Bedrooms */}
        <div>
          <label className={labelClass}>Bedrooms</label>
          <select
            value={filters.bedrooms}
            onChange={(e) => handleFilterUpdate('bedrooms', e.target.value)}
            className={selectClass}
          >
            <option value="all">Any</option>
            <option value="0">Bedsitter</option>
            <option value="1">1 BR</option>
            <option value="2">2 BR</option>
            <option value="3">3 BR</option>
            <option value="4">4+ BR</option>
          </select>
        </div>

        {/* Bathrooms */}
        <div>
          <label className={labelClass}>Bathrooms</label>
          <select
            value={filters.bathrooms}
            onChange={(e) => handleFilterUpdate('bathrooms', e.target.value)}
            className={selectClass}
          >
            <option value="all">Any</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
          </select>
        </div>

        {/* Price Range */}
        <div>
          <label className={labelClass}>Price Range</label>
          <select
            value={filters.priceRange}
            onChange={(e) => handleFilterUpdate('priceRange', e.target.value)}
            className={selectClass}
          >
            {priceOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Property Type */}
        <div>
          <label className={labelClass}>Property Type</label>
          <select
            value={filters.propertyType}
            onChange={(e) => handleFilterUpdate('propertyType', e.target.value)}
            className={selectClass}
          >
            {propertyTypes.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 2: Sort + result count + clear */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Sort */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 font-medium uppercase tracking-wide whitespace-nowrap">
            Sort by
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterUpdate('sortBy', e.target.value)}
            className={`${selectClass} w-auto min-w-[160px]`}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Result count + Clear (pushed right) */}
        <div className="flex items-center gap-4 sm:ml-auto">
          {resultCount != null && (
            <span className="text-sm text-gray-500">
              Showing{' '}
              <span className="font-medium text-gray-700">{resultCount}</span>{' '}
              {resultCount === 1 ? 'property' : 'properties'}
            </span>
          )}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-emerald-600 underline transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchFilter;
