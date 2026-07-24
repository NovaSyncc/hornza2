'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import AnimatedSection from '../../../components/AnimatedSection';
import ListingForm from '../../../components/ListingForm';
import { useMyListings } from '../../../hooks/useMyListings';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';

const STATUS_STYLES = {
  verified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  unverified: 'bg-gray-100 text-gray-500 border-gray-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
};

const FurnishedOperatorDashboardClient = () => {
  const [showForm, setShowForm] = useState(false);

  const { listings, loading, fetchMyListings, createListing, deleteListing } = useMyListings();
  const { userProfile } = useAuth();

  useEffect(() => {
    fetchMyListings();
  }, [fetchMyListings]);

  const furnishedListings = listings.filter(l => l.service_type === 'furnished');

  const stats = {
    total: furnishedListings.length,
    verified: furnishedListings.filter(l => l.verification_status === 'verified').length,
    pending: furnishedListings.filter(l => l.verification_status === 'pending').length,
    available: furnishedListings.filter(l => l.is_available).length,
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

  const handleToggleAvailability = async (listing) => {
    try {
      await supabase
        .from('listings')
        .update({ is_available: !listing.is_available })
        .eq('id', listing.id);
      fetchMyListings();
    } catch (err) {
      alert('Error: ' + err.message);
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

      const rateText = listing.daily_rate
        ? `KES ${parseFloat(listing.daily_rate).toLocaleString()}/night`
        : listing.monthly_rate
        ? `KES ${parseFloat(listing.monthly_rate).toLocaleString()}/month`
        : 'Rates on request';

      const message = `Hi Hornza! I want to verify my furnished listing:
Title: ${listing.title}
Location: ${listing.location}
Rate: ${rateText}
Max Guests: ${listing.max_guests || 'N/A'}
Operator: ${userProfile?.full_name || 'Operator'}
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

  const renderRate = (listing) => {
    const rates = [];
    if (listing.daily_rate) rates.push(`KES ${parseFloat(listing.daily_rate).toLocaleString()}/night`);
    if (listing.weekly_rate) rates.push(`KES ${parseFloat(listing.weekly_rate).toLocaleString()}/week`);
    if (listing.monthly_rate) rates.push(`KES ${parseFloat(listing.monthly_rate).toLocaleString()}/mo`);
    return rates.length > 0 ? rates[0] : 'Set rates';
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
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Furnished Stays Dashboard</h1>
                <p className="text-xs text-gray-500">
                  {userProfile?.full_name || 'Operator'} — Manage your short-term furnished properties
                </p>
              </div>

              <div className="flex gap-3 w-full md:w-auto">
                <div className="bg-purple-50 rounded-lg px-3 py-2 flex-1 md:flex-none text-center border border-purple-200">
                  <div className="text-lg font-bold text-purple-700">{stats.total}</div>
                  <div className="text-xs text-gray-500">Listings</div>
                </div>
                <div className="bg-emerald-50 rounded-lg px-3 py-2 flex-1 md:flex-none text-center border border-emerald-200">
                  <div className="text-lg font-bold text-emerald-700">{stats.verified}</div>
                  <div className="text-xs text-gray-500">Verified</div>
                </div>
                <div className="bg-amber-50 rounded-lg px-3 py-2 flex-1 md:flex-none text-center border border-amber-200">
                  <div className="text-lg font-bold text-amber-700">{stats.pending}</div>
                  <div className="text-xs text-gray-500">Pending</div>
                </div>
                <div className="bg-blue-50 rounded-lg px-3 py-2 flex-1 md:flex-none text-center border border-blue-200">
                  <div className="text-lg font-bold text-blue-700">{stats.available}</div>
                  <div className="text-xs text-gray-500">Available</div>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Listings */}
        <AnimatedSection delay={0.1}>
          <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">My Furnished Properties</h2>
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-all"
              >
                + Add Property
              </button>
            </div>

            {furnishedListings.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg mb-2">No furnished listings yet</p>
                <p className="text-sm">Add your first Airbnb-style property to start getting bookings via WhatsApp.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {furnishedListings.map((listing, index) => (
                  <motion.div
                    key={listing.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-emerald-300 hover:shadow-sm transition-all"
                  >
                    {/* Image preview */}
                    {listing.images && listing.images.length > 0 ? (
                      <div className="h-32 bg-gray-100 overflow-hidden">
                        <img
                          src={listing.images[0].startsWith('http')
                            ? listing.images[0]
                            : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-images/${listing.images[0]}`
                          }
                          alt={listing.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-32 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                        No photos
                      </div>
                    )}

                    <div className="p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Link
                          href={`/listing/${listing.id}`}
                          className="font-semibold text-gray-900 hover:text-emerald-600 transition-colors truncate flex-1"
                        >
                          {listing.title}
                        </Link>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_STYLES[listing.verification_status] || STATUS_STYLES.unverified}`}>
                          {listing.verification_status === 'verified' ? 'Verified' :
                           listing.verification_status === 'pending' ? 'Pending' : 'Unverified'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                        <span>{listing.location}</span>
                        <span>{listing.bedrooms}BR / {listing.bathrooms}BA</span>
                        {listing.max_guests && <span>{listing.max_guests} guests</span>}
                      </div>

                      <div className="text-sm text-gray-900 font-semibold mb-3">
                        {renderRate(listing)}
                        {listing.minimum_stay_days > 1 && (
                          <span className="text-xs text-gray-400 ml-2">min {listing.minimum_stay_days} days</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleAvailability(listing)}
                          className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                            listing.is_available
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-red-50 text-red-700 hover:bg-red-100'
                          }`}
                        >
                          {listing.is_available ? 'Available' : 'Unavailable'}
                        </button>

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
                          className="ml-auto p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
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
            serviceType="furnished"
            listerType="furnished_operator"
            onClose={() => setShowForm(false)}
            onSubmit={handleCreateListing}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default FurnishedOperatorDashboardClient;
