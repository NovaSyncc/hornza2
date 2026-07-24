'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export const useListings = (serviceType = 'rental') => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('listings')
        .select('*')
        .eq('verification_status', 'verified')
        .eq('is_available', true)
        .order('created_at', { ascending: false });

      if (serviceType && serviceType !== 'all') {
        query = query.eq('service_type', serviceType);
      }

      const { data, error } = await query;

      if (error) throw error;
      setListings(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [serviceType]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  return {
    listings,
    loading,
    error,
    refreshListings: fetchListings
  };
};