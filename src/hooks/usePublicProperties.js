'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export const usePublicProperties = (enabled = true) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProperties = useCallback(async () => {
    if (!enabled) return;
    try {
      setLoading(true);
      const { data, error: queryError } = await supabase
        .from('apartments')
        .select(`
          *,
          building:buildings (
            id,
            name,
            address,
            location,
            contact_phone,
            manager_whatsapp
          )
        `)
        .eq('verification_status', 'verified')
        .order('created_at', { ascending: false });

      if (queryError) throw new Error(queryError.message || JSON.stringify(queryError));
      setProperties(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  return {
    properties,
    loading,
    error,
    refreshProperties: fetchProperties
  };
};
