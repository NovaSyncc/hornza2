'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import AnimatedSection from '../../../components/AnimatedSection';
import ListingForm from '../../../components/ListingForm';
import { useMyListings } from '../../../hooks/useMyListings';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';

const SERVICE_TABS = [
  { key: 'rental', label: 'Rentals', color: 'blue' },
  { key: 'furnished', label: 'Furnished', color: 'purple' },
  { key: 'sale', label: 'For Sale', color: 'emerald' },
];

const STATUS_STYLES = {
  verified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  unverified: 'bg-gray-100 text-gray-500 border-gray-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
};

const BrokerDashboardClient = () => {
  const [activeTab, setActiveTab] = useState('rental');
  const [showForm, setShowForm] = useState(false);
  const [formServiceType, setFormServiceType] = useState('rental');

  const { listings, loading, fetchMyListings, createListing, deleteListing } = useMyListings();
  const { userProfile } = useAuth();

  useEffect(() => {
    fetchMyListings();
  }, [fetchMyListings]);

  const filteredListings = listings.filter(l => l.service_type === activeTab);

  const stats = {
    total: listings.length,
    rental: listings.filter(l => l.service_type === 'rental').length,
    furnished: listings.filter(l => l.service_type === 'furnished').length,
    sale: listings.filter(l => l.service_type === 'sale').length,
    verified: listings.filter(l => l.verification_status === 'verified').length,
  };

  const handleCreateListing = async (listingData) => {
    return await createListing(listingData);
  };

  const handleDeleteListing = async (listing) => {
    if (!window.confirm(`Delete "${listing.title}"? This cannot be undone.`)) return;
    try {
      await deleteListing(listing.id);
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  };

  const handleRequestVerification = async (listing) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: existing } = await supabase
        .from('verification_requests')
        .select('id, status')
        .eq('listing_id', listing.id)
        .single();

      if (existing) {
        alert(`A ${existing.status} verification request already exists.`);
        return;
      }

      await supabase
        .from('verification_requests')
        .insert([{ listing_id: listing.id, manager_id: user.id, status: 'pending' }]);

      await supabase
        .from('listings')
        .update({ verification_status: 'pending' })
        .eq('id', listing.id);

      const message = `Hi Hornza! I want to verify this listing:
Title: ${listing.title}
Type: ${listing.service_type}
Location: ${listing.location}
Broker: ${userProfile?.full_name || 'Broker'}
Phone: ${userProfile?.phone || ''}

I will:
1. Send KES 1,000 to your M-Pesa
2. Share the M-Pesa confirmation screenshot
3. Send a video walkthrough

Please confirm the M-Pesa number.`;

      window.open(`https://wa.me/254790958286?text=${encodeURIComponent(message)}`, '_blank');
      fetchMyListings();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const openFormForType = (type) => {
    setFormServiceType(type);
    setShowForm(true);
  };

  const renderPrice = (listing) => {
    if (listing.service_type === 'rental') {
      return `KES ${parseFloat(listing.rent_amount).toLocaleString()}/mo`;
    } else if (listing.service_type === 'furnished') {
      if (listing.daily_rate) return `KES ${parseFloat(listing.daily_rate).toLocaleString()}/night`;
      if (listing.monthly_rate) return `KES ${parseFloat(listing.monthly_rate).toLocaleString()}/mo`;
      return 'Price on request';
    } else {
      return `KES ${parseFloat(listing.sale_price).toLocaleString()}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
        <div className="space-y-3 w-64">
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 py-6 relative z-10 max-w-7xl">
        {/* Header */}
        <AnimatedSection>
          <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-4 mb-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Broker Dashboard</h1>
                <p className="text-xs text-gray-500">
                  {userProfile?.full_name || 'Broker'} — List properties on behalf of owners
                </p>
              </div>

              <div className="flex gap-3 w-full md:w-auto">
                <StatCard label="Total" value={stats.total} color="gray" />
                <StatCard label="Rentals" value={stats.rental} color="blue" />
                <StatCard label="Furnished" value={stats.furnished} color="purple" />
                <StatCard label="For Sale" value={stats.sale} color="emerald" />
                <StatCard label="Verified" value={stats.verified} color="emerald" />
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Service Tabs + Add Button */}
        <AnimatedSection delay={0.1}>
          <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <div className="flex gap-2">
                {SERVICE_TABS.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      activeTab === tab.key
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {tab.label} ({stats[tab.key]})
                  </button>
                ))}
              </div>

              <div className="relative group">
                <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-all">
                  + New Listing
                </button>
                <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 shadow-lg rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                  <button onClick={() => openFormForType('rental')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg">
                    Rental Listing
                  </button>
                  <button onClick={() => openFormForType('furnished')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    Furnished Stay
                  </button>
                  <button onClick={() => openFormForType('sale')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-b-lg">
                    Property for Sale
                  </button>
                </div>
              </div>
            </div>

            {/* Listings Table */}
            {filteredListings.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg mb-2">No {activeTab} listings yet</p>
                <p className="text-sm">Click &quot;+ New Listing&quot; to add your first {activeTab} property.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredListings.map((listing, index) => (
                  <motion.div
                    key={listing.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="bg-white border border-gray-200 rounded-lg p-3 hover:border-emerald-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Link
                            href={`/listing/${listing.id}`}
                            className="font-semibold text-gray-900 hover:text-emerald-600 transition-colors truncate"
                          >
                            {listing.title}
                          </Link>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_STYLES[listing.verification_status] || STATUS_STYLES.unverified}`}>
                            {listing.verification_status === 'verified' ? 'Verified' :
                             listing.verification_status === 'pending' ? 'Pending' :
                             'Unverified'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>{listing.location}</span>
                          <span>{listing.bedrooms}BR / {listing.bathrooms}BA</span>
                          <span className="text-gray-900 font-semibold">{renderPrice(listing)}</span>
                          {listing.owner_name && (
                            <span className="text-gray-400">Owner: {listing.owner_name}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {listing.verification_status === 'unverified' && (
                          <button
                            onClick={() => handleRequestVerification(listing)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded transition-colors"
                          >
                            Verify
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteListing(listing)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </AnimatedSection>
      </div>

      <AnimatePresence>
        {showForm && (
          <ListingForm
            serviceType={formServiceType}
            listerType="broker"
            onClose={() => setShowForm(false)}
            onSubmit={handleCreateListing}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const StatCard = ({ label, value, color }) => {
  const colorMap = {
    gray: 'text-gray-900 bg-gray-50 border-gray-200',
    blue: 'text-blue-700 bg-blue-50 border-blue-200',
    purple: 'text-purple-700 bg-purple-50 border-purple-200',
    emerald: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  };
  const style = colorMap[color] || colorMap.gray;
  const textColor = style.split(' ')[0];

  return (
    <div className={`rounded-lg px-3 py-2 flex-1 md:flex-none text-center border ${style}`}>
      <div className={`text-lg font-bold ${textColor}`}>{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
};

export default BrokerDashboardClient;
