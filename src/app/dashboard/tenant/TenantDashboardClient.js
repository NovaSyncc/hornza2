'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import AnimatedSection from '../../../components/AnimatedSection';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';

const STAGE_COLORS = {
  inquiry: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Inquiry' },
  site_visit: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Site Visit' },
  negotiation: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: 'Negotiation' },
  closed_won: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Closed (Won)' },
  closed_lost: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Closed (Lost)' },
};

const StageBadge = ({ stage }) => {
  const style = STAGE_COLORS[stage] || STAGE_COLORS.inquiry;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text} ${style.border} border`}>
      {style.label}
    </span>
  );
};

const EmptyState = ({ icon, title, description, ctaText, ctaHref }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="text-4xl mb-4">{icon}</div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-500 mb-6 max-w-sm">{description}</p>
    <Link
      href={ctaHref}
      className="inline-flex items-center px-5 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
    >
      {ctaText}
    </Link>
  </div>
);

const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-12">
    <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
  </div>
);

const TenantDashboardClient = () => {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [inquiries, setInquiries] = useState([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(true);
  const [inquiriesError, setInquiriesError] = useState(null);

  useEffect(() => {
    if (!authLoading && userProfile) {
      fetchInquiries();
    } else if (!authLoading && !userProfile) {
      setInquiriesLoading(false);
    }
  }, [authLoading, userProfile]);

  const fetchInquiries = async () => {
    try {
      setInquiriesLoading(true);
      setInquiriesError(null);

      const email = userProfile?.email || user?.email;
      const phone = userProfile?.phone;

      // Build an OR filter: match by email or phone
      const filters = [];
      if (email) filters.push(`client_email.eq.${email}`);
      if (phone) filters.push(`client_phone.eq.${phone}`);

      if (filters.length === 0) {
        setInquiries([]);
        return;
      }

      const { data, error } = await supabase
        .from('leads')
        .select(`
          id,
          stage,
          client_name,
          notes,
          created_at,
          updated_at,
          inquiry_at,
          site_visit_at,
          negotiation_at,
          closed_at,
          listing:listings (
            id,
            title,
            location
          )
        `)
        .or(filters.join(','))
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInquiries(data || []);
    } catch (err) {
      console.error('Error fetching inquiries:', err);
      setInquiriesError(err.message);
    } finally {
      setInquiriesLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-KE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const memberSince = user?.created_at
    ? formatDate(user.created_at)
    : '-';

  const displayName = userProfile?.full_name || user?.user_metadata?.full_name || 'Tenant';
  const displayEmail = userProfile?.email || user?.email || '-';
  const displayPhone = userProfile?.phone || user?.user_metadata?.phone || '-';

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 py-12 relative z-10 space-y-8">

        {/* Profile Header */}
        <AnimatedSection>
          <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-2xl font-bold shrink-0">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
                  <p className="text-gray-500 text-sm">{displayEmail}</p>
                  {displayPhone !== '-' && (
                    <p className="text-gray-500 text-sm">{displayPhone}</p>
                  )}
                  <p className="text-gray-400 text-xs mt-1">Member since {memberSince}</p>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Quick Actions */}
        <AnimatedSection delay={0.1}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/properties"
              className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 hover:border-emerald-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Browse Properties</h3>
                  <p className="text-sm text-gray-500">Find your next home</p>
                </div>
              </div>
            </Link>

            <Link
              href="/contact"
              className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Contact Us</h3>
                  <p className="text-sm text-gray-500">Get help or support</p>
                </div>
              </div>
            </Link>

            <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">My Profile</h3>
                  <p className="text-sm text-gray-500">{displayEmail}</p>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Stats Summary */}
        <AnimatedSection delay={0.2}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 text-center">
              <h3 className="text-2xl font-bold text-emerald-700">0</h3>
              <p className="text-gray-500 text-sm">Saved Properties</p>
            </div>
            <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 text-center">
              <h3 className="text-2xl font-bold text-blue-700">
                {inquiriesLoading ? '-' : inquiries.length}
              </h3>
              <p className="text-gray-500 text-sm">My Inquiries</p>
            </div>
            <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 text-center">
              <h3 className="text-2xl font-bold text-purple-700">0</h3>
              <p className="text-gray-500 text-sm">Recent Searches</p>
            </div>
          </div>
        </AnimatedSection>

        {/* My Inquiries */}
        <AnimatedSection delay={0.3}>
          <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">My Inquiries</h2>

            {inquiriesLoading ? (
              <LoadingSpinner />
            ) : inquiriesError ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <p className="text-red-700 font-medium mb-2">Failed to load inquiries</p>
                <p className="text-red-500 text-sm mb-4">{inquiriesError}</p>
                <button
                  onClick={fetchInquiries}
                  className="inline-flex items-center px-4 py-2 bg-red-100 text-red-700 font-medium rounded-lg hover:bg-red-200 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : inquiries.length === 0 ? (
              <EmptyState
                icon={<svg className="w-12 h-12 text-gray-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>}
                title="No inquiries yet"
                description="When you inquire about a property, your inquiries will appear here so you can track their progress."
                ctaText="Browse Properties"
                ctaHref="/properties"
              />
            ) : (
              <div className="space-y-4">
                {inquiries.map((inquiry, index) => (
                  <motion.div
                    key={inquiry.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-gray-50 border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-semibold text-gray-900 truncate">
                            {inquiry.listing?.title || 'Property Inquiry'}
                          </h4>
                          <StageBadge stage={inquiry.stage} />
                        </div>
                        {inquiry.listing?.location && (
                          <p className="text-gray-500 text-sm">{inquiry.listing.location}</p>
                        )}
                        {inquiry.notes && (
                          <p className="text-gray-400 text-sm mt-1 line-clamp-2">{inquiry.notes}</p>
                        )}
                      </div>
                      <div className="text-right text-sm text-gray-400 shrink-0">
                        <p>Submitted {formatDate(inquiry.created_at)}</p>
                        {inquiry.updated_at !== inquiry.created_at && (
                          <p>Updated {formatDate(inquiry.updated_at)}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </AnimatedSection>

        {/* Saved Properties */}
        <AnimatedSection delay={0.4}>
          <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Saved Properties</h2>
            <EmptyState
              icon={<svg className="w-12 h-12 text-gray-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" /></svg>}
              title="No saved properties"
              description="Save properties you like to compare them later and get notified about price changes."
              ctaText="Browse Properties"
              ctaHref="/properties"
            />
          </div>
        </AnimatedSection>

        {/* Recent Searches */}
        <AnimatedSection delay={0.5}>
          <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Searches</h2>
            <EmptyState
              icon={<svg className="w-12 h-12 text-gray-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              title="No recent searches"
              description="Your recent property searches will appear here for quick access."
              ctaText="Start Searching"
              ctaHref="/properties"
            />
          </div>
        </AnimatedSection>

      </div>
    </div>
  );
};

export default TenantDashboardClient;
