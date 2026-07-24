'use client';

import React, { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

// Fallback components
const PropertyCardFallback = ({ property }) => (
  <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
    <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
      <span className="text-gray-400">Image</span>
    </div>
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-1 text-gray-900">{property.title || 'Property Title'}</h3>
      <p className="text-gray-500 text-sm mb-2">{property.location || 'Location'}</p>
      <p className="text-emerald-600 font-bold text-lg">
        KES {property.price?.toLocaleString() || 'N/A'}{property.period ? `/${property.period}` : '/mo'}
      </p>
      {property.verified && (
        <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded text-xs mt-2">
          Verified
        </span>
      )}
    </div>
  </div>
);

// Mock data fallback
const mockPropertiesFallback = [
  {
    id: 1,
    title: "Modern 2BR in Eastleigh Sec 7",
    location: "Section 7, Eastleigh",
    price: 45000,
    period: "mo",
    verified: true,
    bedrooms: 2,
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop"
  },
  {
    id: 2,
    title: "Executive 1BR Studio",
    location: "Section 1, Eastleigh",
    price: 35000,
    period: "mo",
    verified: true,
    bedrooms: 1,
    image: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&h=400&fit=crop"
  },
  {
    id: 3,
    title: "Spacious 3BR Family Unit",
    location: "Section 3, Eastleigh",
    price: 65000,
    period: "mo",
    verified: true,
    bedrooms: 3,
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop"
  },
  {
    id: 4,
    title: "Cozy Bedsitter in California",
    location: "California, Eastleigh",
    price: 12000,
    period: "mo",
    verified: true,
    bedrooms: 0,
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop"
  }
];

// Component imports with fallbacks
let PropertyCard, mockProperties;

try {
  PropertyCard = require('../components/PropertyCard').default;
} catch (error) {
  PropertyCard = PropertyCardFallback;
}

try {
  mockProperties = require('../utils/mockData').mockProperties;
} catch (error) {
  mockProperties = mockPropertiesFallback;
}

// Price range options per tab
const PRICE_RANGES = {
  rent: [
    { label: 'Any Price', value: '' },
    { label: 'Up to 15K', value: '0-15000' },
    { label: '15K - 30K', value: '15000-30000' },
    { label: '30K - 50K', value: '30000-50000' },
    { label: '50K - 100K', value: '50000-100000' },
    { label: '100K+', value: '100000-' },
  ],
  buy: [
    { label: 'Any Price', value: '' },
    { label: 'Up to 5M', value: '0-5000000' },
    { label: '5M - 10M', value: '5000000-10000000' },
    { label: '10M - 20M', value: '10000000-20000000' },
    { label: '20M - 50M', value: '20000000-50000000' },
    { label: '50M+', value: '50000000-' },
  ],
  furnished: [
    { label: 'Any Price', value: '' },
    { label: 'Up to 3K/night', value: '0-3000' },
    { label: '3K - 5K', value: '3000-5000' },
    { label: '5K - 10K', value: '5000-10000' },
    { label: '10K+', value: '10000-' },
  ],
};

const BEDROOM_OPTIONS = [
  { label: 'Bedrooms', value: '' },
  { label: 'Bedsitter', value: 'bedsitter' },
  { label: '1 Bedroom', value: '1' },
  { label: '2 Bedrooms', value: '2' },
  { label: '3 Bedrooms', value: '3' },
  { label: '4+ Bedrooms', value: '4' },
];

const TABS = [
  { key: 'rent', label: 'Rent' },
  { key: 'buy', label: 'Buy' },
  { key: 'furnished', label: 'Furnished' },
];

const NEIGHBORHOODS = [
  {
    name: 'Eastleigh Section 1',
    slug: 'eastleigh-section-1',
    count: 48,
    priceFrom: '8,000',
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80',
  },
  {
    name: 'Eastleigh Section 2',
    slug: 'eastleigh-section-2',
    count: 35,
    priceFrom: '10,000',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80',
  },
  {
    name: 'Eastleigh Section 3',
    slug: 'eastleigh-section-3',
    count: 62,
    priceFrom: '12,000',
    image: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&q=80',
  },
  {
    name: 'Section 7',
    slug: 'eastleigh-section-7',
    count: 41,
    priceFrom: '10,000',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80',
  },
  {
    name: 'California',
    slug: 'california-eastleigh',
    count: 29,
    priceFrom: '15,000',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80',
  },
  {
    name: 'Jam Street',
    slug: 'jam-street',
    count: 37,
    priceFrom: '12,000',
    image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=80',
  },
  {
    name: 'South C',
    slug: 'south-c',
    count: 54,
    priceFrom: '25,000',
    image: 'https://images.unsplash.com/photo-1494526585095-c41746248156?w=600&q=80',
  },
  {
    name: 'Pangani',
    slug: 'pangani',
    count: 22,
    priceFrom: '18,000',
    image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&q=80',
  },
];

const PROPERTY_TYPES = [
  {
    title: 'Rentals',
    subtitle: 'Unfurnished apartments and houses for monthly rent',
    count: 1200,
    type: 'rental',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
  },
  {
    title: 'Furnished Stays',
    subtitle: 'Fully furnished short-term and long-term stays',
    count: 340,
    type: 'furnished',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
  },
  {
    title: 'For Sale',
    subtitle: 'Apartments, houses, plots, and commercial property',
    count: 480,
    type: 'sale',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
  },
];

// Search icon SVG
const SearchIcon = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

// Chevron down icon for dropdowns
const ChevronDownIcon = () => (
  <svg className="w-4 h-4 text-gray-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

const HomePageClient = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('rent');
  const [searchInput, setSearchInput] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [priceRange, setPriceRange] = useState('');

  const recentProperties = useMemo(() => {
    try {
      const props = Array.isArray(mockProperties) ? mockProperties : mockPropertiesFallback;
      // Get up to 4 properties for the grid
      return props.slice(0, 4).map((p) => ({
        ...p,
        // Ensure fallback fields exist
        period: p.period || 'mo',
        verified: p.verified !== undefined ? p.verified : true,
      }));
    } catch (error) {
      console.warn('Error loading properties:', error);
      return mockPropertiesFallback;
    }
  }, []);

  const currentPriceRanges = PRICE_RANGES[activeTab] || PRICE_RANGES.rent;

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (activeTab) params.set('type', activeTab === 'buy' ? 'sale' : activeTab);
    if (searchInput.trim()) params.set('location', searchInput.trim());
    if (bedrooms) params.set('bedrooms', bedrooms);
    if (priceRange) params.set('price', priceRange);

    const queryString = params.toString();
    router.push(`/properties${queryString ? `?${queryString}` : ''}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  // Reset price when switching tabs since ranges differ
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPriceRange('');
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src="/herobcg.png"
            alt="Beautiful home exterior"
            className="w-full h-full object-cover"
          />
          {/* Dark overlay — solid base + gradient for depth */}
          <div className="absolute inset-0 bg-black/70" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/30" />
        </div>

        {/* Hero content */}
        <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 text-center">
          {/* Tagline */}
          <p className="text-white/90 text-sm sm:text-base font-medium tracking-wide mb-3" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}>
            East Africa&#39;s Trusted Property Platform
          </p>

          {/* Main headline */}
          <h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-8 leading-tight tracking-tight"
            style={{ textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}
          >
            Find Your Perfect Home
          </h1>

          {/* Tab bar */}
          <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full p-1 mb-6">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`px-5 sm:px-7 py-2 sm:py-2.5 rounded-full text-sm sm:text-base font-medium transition-all duration-200 ${
                  activeTab === tab.key
                    ? 'bg-white text-gray-900 shadow-md font-semibold'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="bg-white rounded-xl shadow-2xl shadow-black/20 p-2 sm:p-3">
            {/* Desktop: single row */}
            <div className="hidden md:flex items-center gap-2">
              {/* Location input */}
              <div className="flex-1 relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <SearchIcon />
                </div>
                <input
                  type="text"
                  placeholder="Search by location, neighborhood..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-10 pr-4 py-3 text-gray-900 placeholder-gray-400 text-sm bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {/* Bedrooms dropdown */}
              <div className="relative w-40">
                <select
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                  className="w-full appearance-none pl-3 pr-8 py-3 text-sm text-gray-700 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent cursor-pointer"
                >
                  {BEDROOM_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDownIcon />
              </div>

              {/* Price dropdown */}
              <div className="relative w-40">
                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="w-full appearance-none pl-3 pr-8 py-3 text-sm text-gray-700 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent cursor-pointer"
                >
                  {currentPriceRanges.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDownIcon />
              </div>

              {/* Search button */}
              <button
                onClick={handleSearch}
                className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-sm rounded-lg transition-all duration-200 whitespace-nowrap shadow-md shadow-emerald-600/25 hover:shadow-lg hover:shadow-emerald-600/30"
              >
                Search
              </button>
            </div>

            {/* Mobile: stacked inputs */}
            <div className="flex flex-col gap-2 md:hidden">
              {/* Location input */}
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <SearchIcon />
                </div>
                <input
                  type="text"
                  placeholder="Search by location, neighborhood..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-10 pr-4 py-3 text-gray-900 placeholder-gray-400 text-sm bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-2">
                {/* Bedrooms dropdown */}
                <div className="relative flex-1">
                  <select
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    className="w-full appearance-none pl-3 pr-8 py-3 text-sm text-gray-700 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent cursor-pointer"
                  >
                    {BEDROOM_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <ChevronDownIcon />
                </div>

                {/* Price dropdown */}
                <div className="relative flex-1">
                  <select
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value)}
                    className="w-full appearance-none pl-3 pr-8 py-3 text-sm text-gray-700 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent cursor-pointer"
                  >
                    {currentPriceRanges.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <ChevronDownIcon />
                </div>
              </div>

              {/* Search button */}
              <button
                onClick={handleSearch}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-sm rounded-lg transition-all duration-200 shadow-md shadow-emerald-600/25"
              >
                Search
              </button>
            </div>
          </div>

          {/* Trust bar */}
          <p className="mt-6 text-white/60 text-xs sm:text-sm font-medium tracking-wide">
            2,000+ Properties&nbsp;&nbsp;&bull;&nbsp;&nbsp;Video Verified&nbsp;&nbsp;&bull;&nbsp;&nbsp;Zero Broker Fees
          </p>
        </div>
      </section>

      {/* ===== RECENTLY ADDED ===== */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight"
            >
              Recently Added
            </motion.h2>
            <Link
              href="/properties"
              className="text-gray-600 hover:text-emerald-600 text-sm font-medium transition-colors flex items-center gap-1 group"
            >
              View All
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentProperties.map((property, index) => (
              <motion.div
                key={property?.id || index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Suspense fallback={<PropertyCardFallback property={property} />}>
                  <PropertyCard property={property} />
                </Suspense>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== EXPLORE NEIGHBORHOODS ===== */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight mb-8"
          >
            Explore Neighborhoods
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {NEIGHBORHOODS.map((hood, index) => (
              <motion.div
                key={hood.slug}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <Link
                  href={`/properties?location=${hood.slug}`}
                  className="group block relative h-56 rounded-2xl overflow-hidden border border-gray-200 hover:border-emerald-300 shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  <img
                    src={hood.image}
                    alt={hood.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 group-hover:from-black/85 group-hover:via-black/35 transition-all duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="text-white font-bold text-lg leading-tight mb-1">{hood.name}</h3>
                    <div className="flex items-center justify-between">
                      <p className="text-white/70 text-sm">{hood.count} properties</p>
                      <p className="text-emerald-400 text-sm font-medium">From KES {hood.priceFrom}/mo</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PROPERTY TYPES ===== */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight mb-8"
          >
            Browse by Type
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PROPERTY_TYPES.map((pt, index) => (
              <motion.div
                key={pt.type}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Link
                  href={`/properties?type=${pt.type}`}
                  className="group block relative h-64 md:h-72 rounded-2xl overflow-hidden border border-gray-200 hover:border-emerald-300 shadow-sm hover:shadow-2xl transition-all duration-300"
                >
                  <img
                    src={pt.image}
                    alt={pt.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 group-hover:from-black/85 transition-all duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-white font-bold text-xl mb-1.5">{pt.title}</h3>
                    <p className="text-white/70 text-sm leading-relaxed mb-3">{pt.subtitle}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-white/50 text-sm">{pt.count.toLocaleString()} properties</p>
                      <span className="text-emerald-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1">
                        Browse
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== LIST YOUR PROPERTY CTA ===== */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-gray-900 rounded-2xl px-6 py-12 md:px-12 md:py-16 text-center relative overflow-hidden"
          >
            {/* Subtle gradient accent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 tracking-tight">
                Own a property?
              </h2>
              <p className="text-gray-400 text-base md:text-lg max-w-xl mx-auto mb-8 leading-relaxed">
                List it on Hornza and reach thousands of verified tenants
              </p>
              <Link href="/register">
                <button className="px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-emerald-600/25 hover:shadow-xl hover:shadow-emerald-600/30">
                  List Your Property
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePageClient;
