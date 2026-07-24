'use client';
import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useMyListings = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchMyListings = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('lister_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setListings(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createListing = useCallback(async (listingData) => {
    if (!user) throw new Error('Must be logged in');
    const { data, error } = await supabase
      .from('listings')
      .insert({ ...listingData, lister_id: user.id })
      .select()
      .single();

    if (error) throw error;
    setListings(prev => [data, ...prev]);
    return data;
  }, [user]);

  const updateListing = useCallback(async (id, updates) => {
    const { data, error } = await supabase
      .from('listings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    setListings(prev => prev.map(l => l.id === id ? data : l));
    return data;
  }, []);

  const deleteListing = useCallback(async (id) => {
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', id);

    if (error) throw error;
    setListings(prev => prev.filter(l => l.id !== id));
  }, []);

  return {
    listings,
    loading,
    error,
    fetchMyListings,
    createListing,
    updateListing,
    deleteListing
  };
};