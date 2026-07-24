'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import AnimatedSection from '../../../components/AnimatedSection';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { useRealtimeSync } from '../../../hooks/useRealtimeSync';

const TABS = [
  { key: 'verifications', label: 'Verifications' },
  { key: 'listings', label: 'All Listings' },
  { key: 'users', label: 'Users' },
  { key: 'contacts', label: 'Messages' },
];

const STATUS_STYLES = {
  verified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  unverified: 'bg-gray-100 text-gray-500 border-gray-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
};

const USER_TYPE_BADGES = {
  admin: 'bg-red-50 text-red-700 border-red-200',
  property_manager: 'bg-blue-50 text-blue-700 border-blue-200',
  broker: 'bg-purple-50 text-purple-700 border-purple-200',
  furnished_operator: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  tenant: 'bg-gray-100 text-gray-600 border-gray-200',
  secretary: 'bg-amber-50 text-amber-700 border-amber-200',
};

const USER_TYPE_LABELS = {
  admin: 'Admin',
  property_manager: 'Manager',
  broker: 'Broker',
  furnished_operator: 'Operator',
  tenant: 'Tenant',
  secretary: 'Secretary',
};

const AdminDashboardClient = () => {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('verifications');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [verificationRequests, setVerificationRequests] = useState([]);
  const [allListings, setAllListings] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [contactMessages, setContactMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [expandedMessage, setExpandedMessage] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProperties: 0,
    totalListings: 0,
    verifiedCount: 0,
    pendingVerifications: 0,
    totalLeads: 0,
    totalRevenue: 0,
    rentalCount: 0,
    furnishedCount: 0,
    saleCount: 0,
  });
  const [instagramUrl, setInstagramUrl] = useState('');
  const [filter, setFilter] = useState('pending');
  const [listingFilter, setListingFilter] = useState('all');
  const [userSearch, setUserSearch] = useState('');

  // ====== FETCH FUNCTIONS ======

  const fetchVerificationRequests = useCallback(async () => {
    try {
      let apartmentQuery = supabase
        .from('verification_requests')
        .select(`
          *,
          apartment:apartments!verification_requests_apartment_id_fkey (
            id,
            house_number,
            bedrooms,
            bathrooms,
            rent_amount,
            deposit_amount,
            verification_status,
            building:buildings (
              id,
              name,
              address
            )
          ),
          manager:users!verification_requests_manager_id_fkey (
            id,
            full_name,
            phone
          )
        `)
        .not('apartment_id', 'is', null)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        apartmentQuery = apartmentQuery.eq('status', filter);
      }

      const { data: apartmentRequests, error: aptError } = await apartmentQuery;
      if (aptError) console.error('Error fetching apartment verifications:', aptError);

      let listingQuery = supabase
        .from('verification_requests')
        .select(`
          *,
          listing:listings!verification_requests_listing_id_fkey (
            id,
            title,
            service_type,
            location,
            address,
            bedrooms,
            bathrooms,
            rent_amount,
            daily_rate,
            monthly_rate,
            sale_price,
            verification_status,
            lister_type,
            owner_name
          ),
          manager:users!verification_requests_manager_id_fkey (
            id,
            full_name,
            phone
          )
        `)
        .not('listing_id', 'is', null)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        listingQuery = listingQuery.eq('status', filter);
      }

      const { data: listingRequests, error: listError } = await listingQuery;
      if (listError) console.error('Error fetching listing verifications:', listError);

      const combined = [
        ...(apartmentRequests || []).map(r => ({ ...r, source: 'apartment' })),
        ...(listingRequests || []).map(r => ({ ...r, source: 'listing' })),
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setVerificationRequests(combined);
    } catch (error) {
      console.error('Unexpected error fetching requests:', error);
    }
  }, [filter]);

  const fetchAllListings = useCallback(async () => {
    try {
      let query = supabase
        .from('listings')
        .select(`
          *,
          lister:users!listings_lister_id_fkey (
            id,
            full_name,
            phone,
            user_type
          )
        `)
        .order('created_at', { ascending: false });

      if (listingFilter !== 'all') {
        query = query.eq('service_type', listingFilter);
      }

      const { data, error } = await query;
      if (error) console.error('Error fetching listings:', error);
      setAllListings(data || []);
    } catch (error) {
      console.error('Unexpected error fetching listings:', error);
    }
  }, [listingFilter]);

  const fetchAllUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) console.error('Error fetching users:', error);
      setAllUsers(data || []);
    } catch (error) {
      console.error('Unexpected error fetching users:', error);
    }
  }, []);

  const fetchContactMessages = useCallback(async () => {
    try {
      setContactsLoading(true);
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching contact messages:', error);
        setContactMessages([]);
      } else {
        setContactMessages(data || []);
      }
    } catch (error) {
      console.error('Unexpected error fetching contact messages:', error);
      setContactMessages([]);
    } finally {
      setContactsLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const [
        { count: userCount },
        { count: propertyCount },
        { count: listingCount },
        { count: verifiedApartments },
        { count: verifiedListings },
        { count: pendingCount },
        { count: leadCount },
        { count: rentalCount },
        { count: furnishedCount },
        { count: saleCount },
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('apartments').select('*', { count: 'exact', head: true }),
        supabase.from('listings').select('*', { count: 'exact', head: true }),
        supabase.from('apartments').select('*', { count: 'exact', head: true }).eq('verification_status', 'verified'),
        supabase.from('listings').select('*', { count: 'exact', head: true }).eq('verification_status', 'verified'),
        supabase.from('verification_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('leads').select('*', { count: 'exact', head: true }),
        supabase.from('listings').select('*', { count: 'exact', head: true }).eq('service_type', 'rental'),
        supabase.from('listings').select('*', { count: 'exact', head: true }).eq('service_type', 'furnished'),
        supabase.from('listings').select('*', { count: 'exact', head: true }).eq('service_type', 'sale'),
      ]);

      const totalVerified = (verifiedApartments || 0) + (verifiedListings || 0);

      setStats({
        totalUsers: userCount || 0,
        totalProperties: propertyCount || 0,
        totalListings: listingCount || 0,
        verifiedCount: totalVerified,
        pendingVerifications: pendingCount || 0,
        totalLeads: leadCount || 0,
        totalRevenue: totalVerified * 1000,
        rentalCount: rentalCount || 0,
        furnishedCount: furnishedCount || 0,
        saleCount: saleCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  // ====== REAL-TIME SYNC ======

  const handleBuildingsChange = useCallback(() => {
    fetchStats();
  }, [fetchStats]);

  const handleApartmentsChange = useCallback(() => {
    fetchVerificationRequests();
    fetchStats();
    fetchAllListings();
  }, [fetchVerificationRequests, fetchStats, fetchAllListings]);

  const handleVerificationRequestsChange = useCallback(() => {
    fetchVerificationRequests();
    fetchStats();
  }, [fetchVerificationRequests, fetchStats]);

  useRealtimeSync({
    onBuildingsChange: handleBuildingsChange,
    onApartmentsChange: handleApartmentsChange,
    onVerificationRequestsChange: handleVerificationRequestsChange,
  });

  useEffect(() => {
    const channel = supabase
      .channel('admin_listings_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'listings' }, () => {
        fetchAllListings();
        fetchStats();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchAllListings, fetchStats]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([
        fetchVerificationRequests(),
        fetchStats(),
        fetchAllListings(),
        fetchAllUsers(),
        fetchContactMessages(),
      ]);
      setLoading(false);
    };
    load();
  }, [fetchVerificationRequests, fetchStats, fetchAllListings, fetchAllUsers, fetchContactMessages]);

  useEffect(() => {
    fetchAllListings();
  }, [fetchAllListings]);

  // ====== VERIFICATION ACTIONS ======

  const handleVerifyApartment = async (request) => {
    if (!instagramUrl.trim()) {
      alert('Please enter Instagram URL');
      return;
    }

    try {
      const { data, error } = await supabase.rpc('admin_verify_single_apartment', {
        p_apartment_id: request.apartment_id,
        p_instagram_url: instagramUrl,
      });

      if (error) {
        alert('Failed to verify apartment: ' + error.message);
        return;
      }

      const result = data[0];
      if (!result.success) {
        alert('Verification failed: ' + result.error_message);
        return;
      }

      await supabase
        .from('verification_requests')
        .update({ status: 'verified', processed_at: new Date().toISOString() })
        .eq('id', request.id);

      alert('Unit verified successfully!');
      setSelectedRequest(null);
      setInstagramUrl('');
    } catch (error) {
      alert('An error occurred: ' + error.message);
    }
  };

  const handleVerifyListing = async (request) => {
    if (!instagramUrl.trim()) {
      alert('Please enter Instagram URL');
      return;
    }

    try {
      const { error: listingError } = await supabase
        .from('listings')
        .update({
          verification_status: 'verified',
          instagram_url: instagramUrl,
          verified_at: new Date().toISOString(),
        })
        .eq('id', request.listing_id);

      if (listingError) {
        alert('Failed to verify listing: ' + listingError.message);
        return;
      }

      const { error: reqError } = await supabase
        .from('verification_requests')
        .update({ status: 'verified', processed_at: new Date().toISOString() })
        .eq('id', request.id);

      if (reqError) {
        alert('Listing verified but failed to update request status');
        return;
      }

      alert('Listing verified successfully!');
      setSelectedRequest(null);
      setInstagramUrl('');
    } catch (error) {
      alert('An error occurred: ' + error.message);
    }
  };

  const handleReject = async (request) => {
    if (!window.confirm('Reject this verification request?')) return;

    try {
      await supabase
        .from('verification_requests')
        .update({ status: 'rejected', processed_at: new Date().toISOString() })
        .eq('id', request.id);

      if (request.source === 'listing' && request.listing_id) {
        await supabase
          .from('listings')
          .update({ verification_status: 'rejected' })
          .eq('id', request.listing_id);
      } else if (request.source === 'apartment' && request.apartment_id) {
        await supabase
          .from('apartments')
          .update({ verification_status: 'rejected' })
          .eq('id', request.apartment_id);
      }

      alert('Request rejected');
      setSelectedRequest(null);
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleRemoveVerification = async (request) => {
    if (!window.confirm('Remove verification from this property?')) return;

    try {
      if (request.source === 'listing' && request.listing_id) {
        await supabase
          .from('listings')
          .update({ verification_status: 'unverified', instagram_url: null, verified_at: null })
          .eq('id', request.listing_id);
      } else if (request.source === 'apartment' && request.apartment_id) {
        await supabase
          .from('apartments')
          .update({ verification_status: 'unverified', instagram_url: null, verified_at: null })
          .eq('id', request.apartment_id);
      }

      await supabase
        .from('verification_requests')
        .delete()
        .eq('id', request.id);

      alert('Verification removed');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  // ====== LISTING ACTIONS ======

  const handleDeleteListing = async (listing) => {
    if (!window.confirm(`Delete "${listing.title}"? This cannot be undone.`)) return;
    try {
      const { error } = await supabase.from('listings').delete().eq('id', listing.id);
      if (error) throw error;
      setAllListings(prev => prev.filter(l => l.id !== listing.id));
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  };

  const handleToggleAvailability = async (listing) => {
    try {
      const { error } = await supabase
        .from('listings')
        .update({ is_available: !listing.is_available })
        .eq('id', listing.id);
      if (error) throw error;
      setAllListings(prev => prev.map(l => l.id === listing.id ? { ...l, is_available: !l.is_available } : l));
    } catch (err) {
      alert('Failed to update: ' + err.message);
    }
  };

  // ====== CONTACT MESSAGE ACTIONS ======

  const handleMarkAsRead = async (messageId) => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ is_read: true })
        .eq('id', messageId);

      if (error) throw error;
      setContactMessages(prev =>
        prev.map(m => m.id === messageId ? { ...m, is_read: true } : m)
      );
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleMarkAsUnread = async (messageId) => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ is_read: false })
        .eq('id', messageId);

      if (error) throw error;
      setContactMessages(prev =>
        prev.map(m => m.id === messageId ? { ...m, is_read: false } : m)
      );
    } catch (err) {
      console.error('Failed to mark as unread:', err);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Delete this message? This cannot be undone.')) return;
    try {
      const { error } = await supabase
        .from('contact_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
      setContactMessages(prev => prev.filter(m => m.id !== messageId));
      if (expandedMessage === messageId) setExpandedMessage(null);
    } catch (err) {
      alert('Failed to delete message: ' + err.message);
    }
  };

  // ====== HELPERS ======

  const renderPrice = (listing) => {
    if (listing.service_type === 'rental') {
      return listing.rent_amount ? `KES ${parseFloat(listing.rent_amount).toLocaleString()}/mo` : '-';
    } else if (listing.service_type === 'furnished') {
      if (listing.daily_rate) return `KES ${parseFloat(listing.daily_rate).toLocaleString()}/night`;
      if (listing.monthly_rate) return `KES ${parseFloat(listing.monthly_rate).toLocaleString()}/mo`;
      return 'Price on request';
    } else {
      return listing.sale_price ? `KES ${parseFloat(listing.sale_price).toLocaleString()}` : '-';
    }
  };

  const filteredUsers = allUsers.filter(u =>
    !userSearch ||
    u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.phone?.includes(userSearch) ||
    u.user_type?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const pendingCount = verificationRequests.filter(r => r.status === 'pending').length;
  const unreadCount = contactMessages.filter(m => !m.is_read).length;

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
        {/* Header + Stats */}
        <AnimatedSection>
          <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-4 mb-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Control Panel</h1>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span>Live Updates Active</span>
                  {userProfile?.full_name && (
                    <span className="ml-2 text-gray-400">|  {userProfile.full_name}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
              <StatCard label="Users" value={stats.totalUsers} color="blue" />
              <StatCard label="Listings" value={stats.totalListings} color="purple" />
              <StatCard label="Pending" value={stats.pendingVerifications} color="amber" />
              <StatCard label="Leads" value={stats.totalLeads} color="indigo" />
              <StatCard label="Verified" value={stats.verifiedCount} color="emerald" />
              <StatCard label="Rentals" value={stats.rentalCount} color="blue" />
              <StatCard label="Furnished" value={stats.furnishedCount} color="purple" />
              <StatCard label="For Sale" value={stats.saleCount} color="emerald" />
            </div>
          </div>
        </AnimatedSection>

        {/* Revenue Bar */}
        <AnimatedSection delay={0.05}>
          <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-4 mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Estimated Revenue (KES 1,000 per verification)</p>
              <p className="text-2xl font-bold text-gray-900">KES {stats.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Verification Rate</p>
              <p className="text-2xl font-bold text-emerald-600">
                {(stats.totalProperties + stats.totalListings) > 0
                  ? Math.round((stats.verifiedCount / (stats.totalProperties + stats.totalListings)) * 100)
                  : 0}%
              </p>
            </div>
          </div>
        </AnimatedSection>

        {/* Tab Navigation */}
        <AnimatedSection delay={0.1}>
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab.label}
                {tab.key === 'verifications' && pendingCount > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {pendingCount}
                  </span>
                )}
                {tab.key === 'contacts' && unreadCount > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </AnimatedSection>

        {/* === VERIFICATIONS TAB === */}
        {activeTab === 'verifications' && (
          <AnimatedSection delay={0.15}>
            <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-4">
              {/* Filter buttons */}
              <div className="flex gap-2 mb-4">
                {['pending', 'verified', 'rejected', 'all'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      filter === f
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>

              {verificationRequests.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg">No {filter !== 'all' ? filter : ''} verification requests</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {verificationRequests.map((request, index) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:border-emerald-300 hover:shadow-sm transition-all"
                    >
                      <div className="flex flex-col lg:flex-row justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          {/* Source badge */}
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                              request.source === 'apartment'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-purple-50 text-purple-700'
                            }`}>
                              {request.source === 'apartment' ? 'APARTMENT' : 'LISTING'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_STYLES[request.status]}`}>
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </span>
                            {request.source === 'listing' && request.listing?.service_type && (
                              <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                                {request.listing.service_type}
                              </span>
                            )}
                          </div>

                          {/* Details */}
                          {request.source === 'apartment' ? (
                            <>
                              <h3 className="font-semibold text-gray-900">
                                {request.apartment?.building?.name || 'Unknown Building'} — Unit {request.apartment?.house_number || 'N/A'}
                              </h3>
                              <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                                <p>{request.apartment?.building?.address || 'No address'}</p>
                                <p>
                                  {request.apartment?.bedrooms || 0} BR / {request.apartment?.bathrooms || 0} BA —
                                  <span className="text-emerald-600 font-medium ml-1">KES {parseFloat(request.apartment?.rent_amount || 0).toLocaleString()}/mo</span>
                                </p>
                                <p>Manager: {request.manager?.full_name || 'Unknown'} ({request.manager?.phone || '-'})</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <h3 className="font-semibold text-gray-900">
                                {request.listing?.title || 'Unknown Listing'}
                              </h3>
                              <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                                <p>{request.listing?.location} — {request.listing?.address || ''}</p>
                                <p>
                                  {request.listing?.bedrooms || 0} BR / {request.listing?.bathrooms || 0} BA —
                                  <span className="text-emerald-600 font-medium ml-1">{request.listing ? renderPrice(request.listing) : '-'}</span>
                                </p>
                                <p>
                                  Listed by: {request.manager?.full_name || 'Unknown'} ({request.listing?.lister_type || '-'})
                                  {request.listing?.owner_name && <span> | Owner: {request.listing.owner_name}</span>}
                                </p>
                              </div>
                            </>
                          )}

                          <p className="text-xs text-gray-400 mt-1">
                            Requested: {new Date(request.created_at).toLocaleDateString()} {new Date(request.created_at).toLocaleTimeString()}
                            {request.processed_at && (
                              <span className="ml-3">Processed: {new Date(request.processed_at).toLocaleDateString()}</span>
                            )}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {request.status === 'pending' && (
                            <>
                              <button
                                onClick={() => setSelectedRequest(request)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors"
                              >
                                Verify
                              </button>
                              <button
                                onClick={() => handleReject(request)}
                                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {request.status === 'verified' && (
                            <button
                              onClick={() => handleRemoveVerification(request)}
                              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-lg transition-colors border border-red-200"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </AnimatedSection>
        )}

        {/* === ALL LISTINGS TAB === */}
        {activeTab === 'listings' && (
          <AnimatedSection delay={0.15}>
            <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-4">
              {/* Filter buttons */}
              <div className="flex gap-2 mb-4">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'rental', label: 'Rentals' },
                  { key: 'furnished', label: 'Furnished' },
                  { key: 'sale', label: 'For Sale' },
                ].map(f => (
                  <button
                    key={f.key}
                    onClick={() => setListingFilter(f.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      listingFilter === f.key
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {allListings.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg">No listings found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Table header */}
                  <div className="hidden md:grid grid-cols-12 gap-2 px-3 py-2 text-xs text-gray-500 font-semibold uppercase border-b border-gray-200 bg-gray-50 rounded-t-lg">
                    <div className="col-span-3">Title</div>
                    <div className="col-span-2">Location</div>
                    <div className="col-span-1">Type</div>
                    <div className="col-span-1">Service</div>
                    <div className="col-span-2">Price</div>
                    <div className="col-span-1">Status</div>
                    <div className="col-span-2">Actions</div>
                  </div>

                  {allListings.map((listing, index) => (
                    <motion.div
                      key={listing.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="grid grid-cols-1 md:grid-cols-12 gap-2 bg-white border border-gray-200 rounded-lg px-3 py-3 hover:bg-gray-50 transition-all items-center"
                    >
                      <div className="col-span-3 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{listing.title}</p>
                        <p className="text-xs text-gray-500">
                          by {listing.lister?.full_name || 'Unknown'} ({listing.lister_type})
                        </p>
                      </div>
                      <div className="col-span-2 text-xs text-gray-600">{listing.location}</div>
                      <div className="col-span-1 text-xs text-gray-600">{listing.property_type}</div>
                      <div className="col-span-1">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                          listing.service_type === 'rental' ? 'bg-blue-50 text-blue-700' :
                          listing.service_type === 'furnished' ? 'bg-purple-50 text-purple-700' :
                          'bg-emerald-50 text-emerald-700'
                        }`}>
                          {listing.service_type}
                        </span>
                      </div>
                      <div className="col-span-2 text-xs text-gray-900 font-semibold">{renderPrice(listing)}</div>
                      <div className="col-span-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_STYLES[listing.verification_status] || STATUS_STYLES.unverified}`}>
                          {listing.verification_status || 'unverified'}
                        </span>
                      </div>
                      <div className="col-span-2 flex items-center gap-1">
                        <button
                          onClick={() => handleToggleAvailability(listing)}
                          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                            listing.is_available
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-red-50 text-red-700 hover:bg-red-100'
                          }`}
                        >
                          {listing.is_available ? 'Live' : 'Hidden'}
                        </button>
                        <button
                          onClick={() => handleDeleteListing(listing)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              <div className="mt-3 text-xs text-gray-500 text-right">
                Showing {allListings.length} listing{allListings.length !== 1 ? 's' : ''}
              </div>
            </div>
          </AnimatedSection>
        )}

        {/* === USERS TAB === */}
        {activeTab === 'users' && (
          <AnimatedSection delay={0.15}>
            <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-4">
              {/* Search */}
              <div className="mb-4">
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search by name, email, phone, or role..."
                  className="w-full md:w-80 bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {filteredUsers.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg">No users found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Table header */}
                  <div className="hidden md:grid grid-cols-12 gap-2 px-3 py-2 text-xs text-gray-500 font-semibold uppercase border-b border-gray-200 bg-gray-50 rounded-t-lg">
                    <div className="col-span-3">Name</div>
                    <div className="col-span-3">Email</div>
                    <div className="col-span-2">Role</div>
                    <div className="col-span-2">Joined</div>
                    <div className="col-span-2">Phone</div>
                  </div>

                  {filteredUsers.map((user, index) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="grid grid-cols-1 md:grid-cols-12 gap-2 bg-white border border-gray-200 rounded-lg px-3 py-3 hover:bg-gray-50 transition-all items-center"
                    >
                      <div className="col-span-3 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{user.full_name || 'No name'}</p>
                        {user.company_name && (
                          <p className="text-xs text-gray-400 truncate">{user.company_name}</p>
                        )}
                      </div>
                      <div className="col-span-3 text-xs text-gray-600 truncate">{user.email || '-'}</div>
                      <div className="col-span-2">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border ${USER_TYPE_BADGES[user.user_type] || USER_TYPE_BADGES.tenant}`}>
                          {USER_TYPE_LABELS[user.user_type] || user.user_type || 'Tenant'}
                        </span>
                      </div>
                      <div className="col-span-2 text-xs text-gray-500">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                      </div>
                      <div className="col-span-2 text-xs text-gray-600">{user.phone || '-'}</div>
                    </motion.div>
                  ))}
                </div>
              )}

              <div className="mt-3 text-xs text-gray-500 text-right">
                Showing {filteredUsers.length} of {allUsers.length} users
              </div>
            </div>
          </AnimatedSection>
        )}

        {/* === CONTACT MESSAGES TAB === */}
        {activeTab === 'contacts' && (
          <AnimatedSection delay={0.15}>
            <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Contact Messages
                  {unreadCount > 0 && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({unreadCount} unread)
                    </span>
                  )}
                </h2>
                <button
                  onClick={fetchContactMessages}
                  disabled={contactsLoading}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all disabled:opacity-50"
                >
                  {contactsLoading ? 'Loading...' : 'Refresh'}
                </button>
              </div>

              {contactsLoading && contactMessages.length === 0 ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : contactMessages.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <p className="text-lg">No contact messages yet</p>
                  <p className="text-sm text-gray-400 mt-1">Messages from the contact form will appear here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Table header */}
                  <div className="hidden md:grid grid-cols-12 gap-2 px-3 py-2 text-xs text-gray-500 font-semibold uppercase border-b border-gray-200 bg-gray-50 rounded-t-lg">
                    <div className="col-span-2">Name</div>
                    <div className="col-span-2">Email</div>
                    <div className="col-span-2">Subject</div>
                    <div className="col-span-3">Message</div>
                    <div className="col-span-1">Date</div>
                    <div className="col-span-2">Actions</div>
                  </div>

                  {contactMessages.map((msg, index) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className={`border rounded-lg transition-all ${
                        !msg.is_read
                          ? 'bg-emerald-50/30 border-emerald-200 hover:border-emerald-300'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 px-3 py-3 items-center">
                        <div className="col-span-2 min-w-0">
                          <div className="flex items-center gap-1.5">
                            {!msg.is_read && (
                              <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0"></div>
                            )}
                            <p className={`text-sm truncate ${!msg.is_read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                              {msg.name}
                            </p>
                          </div>
                          {msg.phone && (
                            <p className="text-xs text-gray-400 truncate mt-0.5">{msg.phone}</p>
                          )}
                        </div>
                        <div className="col-span-2 text-xs text-gray-600 truncate">{msg.email}</div>
                        <div className="col-span-2">
                          <p className={`text-xs truncate ${!msg.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                            {msg.subject}
                          </p>
                        </div>
                        <div className="col-span-3 min-w-0">
                          <p className="text-xs text-gray-500 truncate">
                            {msg.message?.length > 80 ? msg.message.slice(0, 80) + '...' : msg.message}
                          </p>
                        </div>
                        <div className="col-span-1 text-xs text-gray-400">
                          {msg.created_at ? new Date(msg.created_at).toLocaleDateString() : '-'}
                        </div>
                        <div className="col-span-2 flex items-center gap-1">
                          <button
                            onClick={() => setExpandedMessage(expandedMessage === msg.id ? null : msg.id)}
                            className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                          >
                            {expandedMessage === msg.id ? 'Close' : 'View'}
                          </button>
                          {msg.is_read ? (
                            <button
                              onClick={() => handleMarkAsUnread(msg.id)}
                              className="px-2 py-1 rounded text-xs font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                              title="Mark as unread"
                            >
                              Unread
                            </button>
                          ) : (
                            <button
                              onClick={() => handleMarkAsRead(msg.id)}
                              className="px-2 py-1 rounded text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                              title="Mark as read"
                            >
                              Read
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                            title="Delete message"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Expanded message view */}
                      <AnimatePresence>
                        {expandedMessage === msg.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 pt-1 border-t border-gray-100">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                <div>
                                  <p className="text-xs text-gray-400 mb-0.5">From</p>
                                  <p className="text-sm text-gray-900 font-medium">{msg.name}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-400 mb-0.5">Email</p>
                                  <a href={`mailto:${msg.email}`} className="text-sm text-emerald-600 hover:underline">{msg.email}</a>
                                </div>
                                {msg.phone && (
                                  <div>
                                    <p className="text-xs text-gray-400 mb-0.5">Phone</p>
                                    <p className="text-sm text-gray-900">{msg.phone}</p>
                                  </div>
                                )}
                                <div>
                                  <p className="text-xs text-gray-400 mb-0.5">Received</p>
                                  <p className="text-sm text-gray-900">
                                    {msg.created_at
                                      ? new Date(msg.created_at).toLocaleDateString() + ' at ' + new Date(msg.created_at).toLocaleTimeString()
                                      : '-'}
                                  </p>
                                </div>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400 mb-1">Subject</p>
                                <p className="text-sm font-semibold text-gray-900 mb-2">{msg.subject}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400 mb-1">Message</p>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3 border border-gray-100">
                                  {msg.message}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              )}

              <div className="mt-3 text-xs text-gray-500 text-right">
                {contactMessages.length} message{contactMessages.length !== 1 ? 's' : ''} total
              </div>
            </div>
          </AnimatedSection>
        )}
      </div>

      {/* === VERIFY MODAL === */}
      <AnimatePresence>
        {selectedRequest && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white border border-gray-200 shadow-xl rounded-2xl p-6 max-w-lg w-full"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Verify {selectedRequest.source === 'apartment' ? 'Apartment' : 'Listing'}
              </h2>

              <div className="space-y-2 mb-6 text-sm text-gray-700">
                {selectedRequest.source === 'apartment' ? (
                  <>
                    <p><span className="text-gray-500">Building:</span> {selectedRequest.apartment?.building?.name}</p>
                    <p><span className="text-gray-500">Unit:</span> {selectedRequest.apartment?.house_number}</p>
                    <p><span className="text-gray-500">Address:</span> {selectedRequest.apartment?.building?.address}</p>
                    <p><span className="text-gray-500">Details:</span> {selectedRequest.apartment?.bedrooms} BR — KES {parseFloat(selectedRequest.apartment?.rent_amount || 0).toLocaleString()}/mo</p>
                  </>
                ) : (
                  <>
                    <p><span className="text-gray-500">Title:</span> {selectedRequest.listing?.title}</p>
                    <p><span className="text-gray-500">Type:</span> {selectedRequest.listing?.service_type} ({selectedRequest.listing?.lister_type})</p>
                    <p><span className="text-gray-500">Location:</span> {selectedRequest.listing?.location}</p>
                    <p><span className="text-gray-500">Price:</span> {selectedRequest.listing ? renderPrice(selectedRequest.listing) : '-'}</p>
                    {selectedRequest.listing?.owner_name && (
                      <p><span className="text-gray-500">Owner:</span> {selectedRequest.listing.owner_name}</p>
                    )}
                  </>
                )}
                <p><span className="text-gray-500">Requested by:</span> {selectedRequest.manager?.full_name} ({selectedRequest.manager?.phone})</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm text-gray-500 mb-2">Instagram Video URL</label>
                <input
                  type="url"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="https://www.instagram.com/reel/..."
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (selectedRequest.source === 'apartment') {
                      handleVerifyApartment(selectedRequest);
                    } else {
                      handleVerifyListing(selectedRequest);
                    }
                  }}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Verify
                </button>
                <button
                  onClick={() => { setSelectedRequest(null); setInstagramUrl(''); }}
                  className="flex-1 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ====== STAT CARD COMPONENT ======

const StatCard = ({ label, value, color }) => {
  const colorMap = {
    amber: 'text-amber-700 bg-amber-50 border-amber-200',
    blue: 'text-blue-700 bg-blue-50 border-blue-200',
    purple: 'text-purple-700 bg-purple-50 border-purple-200',
    emerald: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    indigo: 'text-indigo-700 bg-indigo-50 border-indigo-200',
    green: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    red: 'text-red-700 bg-red-50 border-red-200',
    yellow: 'text-amber-700 bg-amber-50 border-amber-200',
  };

  const style = colorMap[color] || colorMap.blue;
  const textColor = style.split(' ')[0];

  return (
    <div className={`rounded-lg px-3 py-2 text-center border ${style}`}>
      <div className={`text-lg font-bold ${textColor}`}>{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
};

export default AdminDashboardClient;
