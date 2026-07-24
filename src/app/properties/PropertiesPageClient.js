'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import PropertyCard from '../../components/PropertyCard';
import SearchFilter from '../../components/SearchFilter';
import { useListings } from '../../hooks/useListings';
import { usePublicProperties } from '../../hooks/usePublicProperties';
import { useRealtimeSync } from '../../hooks/useRealtimeSync';

const SERVICE_TABS = [
  { key: 'rental', label: 'Rent', description: 'Unfurnished apartments & houses' },
  { key: 'furnished', label: 'Furnished', description: 'Short-term furnished stays' },
  { key: 'sale', label: 'Buy', description: 'Properties for purchase' },
];

const SALE_SUBTABS = [
  { key: 'all', label: 'All' },
  { key: 'apartment', label: 'Apartments' },
  { key: 'land', label: 'Plots & Land' },
];

const PropertiesPageClient = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const initialTab = searchParams.get('type') || 'rental';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [saleSubTab, setSaleSubTab] = useState('all');

  // Fetch from new listings table
  const { listings, loading: listingsLoading, refreshListings } = useListings(activeTab);
  // Also fetch legacy apartments (only on rental tab)
  const { properties: legacyProperties, loading: legacyLoading, refreshProperties } = usePublicProperties(activeTab === 'rental');

  const [filteredItems, setFilteredItems] = useState([]);

  // Combine listings and legacy properties for the rental tab
  const allItems = activeTab === 'rental'
    ? [...listings, ...legacyProperties.map(p => ({ ...p, _isLegacy: true }))]
    : listings;

  const loading = listingsLoading || (activeTab === 'rental' && legacyLoading);

  useEffect(() => {
    if (activeTab === 'sale' && saleSubTab !== 'all') {
      setFilteredItems(allItems.filter(item => (item.property_type || 'apartment') === saleSubTab));
    } else {
      setFilteredItems(allItems);
    }
  }, [listings, legacyProperties, activeTab, saleSubTab]);

  // Update URL when tab changes
  useEffect(() => {
    router.replace(`${pathname}?type=${activeTab}`, { scroll: false });
  }, [activeTab, router, pathname]);

  const handleRefresh = useCallback(() => {
    refreshListings();
    refreshProperties();
  }, [refreshListings, refreshProperties]);

  useRealtimeSync({
    onApartmentsChange: handleRefresh
  });

  const handleFilterChange = (filters) => {
    let filtered = activeTab === 'sale' && saleSubTab !== 'all'
      ? allItems.filter(item => (item.property_type || 'apartment') === saleSubTab)
      : allItems;

    if (filters.location && filters.location !== 'all') {
      filtered = filtered.filter(item => {
        const loc = (item.location || item.building?.location || item.address || item.building?.address || '').toLowerCase();
        return loc.includes(filters.location.toLowerCase());
      });
    }

    if (filters.priceRange && filters.priceRange !== 'all') {
      const [min, max] = filters.priceRange.split('-').map(Number);
      filtered = filtered.filter(item => {
        let price;
        if (activeTab === 'sale') price = parseFloat(item.sale_price || 0);
        else if (activeTab === 'furnished') price = parseFloat(item.daily_rate || 0);
        else price = parseFloat(item.rent_amount || 0);

        if (max) return price >= min && price <= max;
        return price >= min;
      });
    }

    if (filters.bedrooms && filters.bedrooms !== 'all') {
      const bedrooms = parseInt(filters.bedrooms);
      if (filters.bedrooms === '4') {
        filtered = filtered.filter(item => (item.bedrooms || 0) >= 4);
      } else {
        filtered = filtered.filter(item => item.bedrooms === bedrooms);
      }
    }

    if (filters.bathrooms && filters.bathrooms !== 'all') {
      const minBaths = parseInt(filters.bathrooms);
      filtered = filtered.filter(item => (item.bathrooms || 1) >= minBaths);
    }

    if (filters.propertyType && filters.propertyType !== 'all') {
      filtered = filtered.filter(item =>
        (item.property_type || 'apartment') === filters.propertyType
      );
    }

    if (filters.sortBy) {
      const sorted = [...filtered];
      switch (filters.sortBy) {
        case 'price_asc':
          sorted.sort((a, b) => {
            const priceA = parseFloat(a.rent_amount || a.daily_rate || a.sale_price || 0);
            const priceB = parseFloat(b.rent_amount || b.daily_rate || b.sale_price || 0);
            return priceA - priceB;
          });
          break;
        case 'price_desc':
          sorted.sort((a, b) => {
            const priceA = parseFloat(a.rent_amount || a.daily_rate || a.sale_price || 0);
            const priceB = parseFloat(b.rent_amount || b.daily_rate || b.sale_price || 0);
            return priceB - priceA;
          });
          break;
        case 'bedrooms_desc':
          sorted.sort((a, b) => (b.bedrooms || 0) - (a.bedrooms || 0));
          break;
        default: // newest
          break;
      }
      filtered = sorted;
    }

    setFilteredItems(filtered);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSaleSubTab('all');
    setFilteredItems([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-24 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 text-base">Loading properties...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-20 md:pt-24">
      <div className="container mx-auto px-4 sm:px-6 py-6 md:py-8">

        {/* Compact header with tabs inline */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Properties
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {filteredItems.length} verified {filteredItems.length === 1 ? 'property' : 'properties'} available
            </p>
          </div>

          {/* Service type tabs */}
          <div className="inline-flex bg-gray-100 rounded-lg p-1 gap-0.5">
            {SERVICE_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`px-5 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                  activeTab === tab.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sale sub-tabs */}
        {activeTab === 'sale' && (
          <div className="flex gap-2 mb-5">
            {SALE_SUBTABS.map((sub) => (
              <button
                key={sub.key}
                onClick={() => setSaleSubTab(sub.key)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  saleSubTab === sub.key
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>
        )}

        {/* Search Filters */}
        <div className="mb-6">
          <SearchFilter
            onFilterChange={handleFilterChange}
            serviceType={activeTab}
            resultCount={filteredItems.length}
          />
        </div>

        {/* Property Grid — 3 columns max for readable card sizes */}
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.03, 0.3), duration: 0.3 }}
              >
                <PropertyCard property={item} isLegacy={item._isLegacy} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 md:py-24">
            <div className="text-4xl mb-4">
              {activeTab === 'furnished' ? '🛋️' : activeTab === 'sale' ? '🏷️' : '🏠'}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No {SERVICE_TABS.find(t => t.key === activeTab)?.label} properties found
            </h3>
            <p className="text-gray-500 text-base max-w-md mx-auto">
              {activeTab === 'rental'
                ? 'Try adjusting your filters or check back later for new listings.'
                : `We're adding ${SERVICE_TABS.find(t => t.key === activeTab)?.label.toLowerCase()} listings soon.`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertiesPageClient;
