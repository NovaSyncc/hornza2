'use client';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export const useApartments = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createApartment = async (buildingId, apartmentData) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('apartments')
        .insert([{
          building_id: buildingId,
          unit_number: apartmentData.unitNumber,
          bedrooms: apartmentData.bedrooms,
          rent_amount: parseFloat(apartmentData.rent),
          deposit_amount: parseFloat(apartmentData.deposit),
          description: apartmentData.description || '',
          amenities: apartmentData.amenities || [],
          verification_status: 'unverified',
          availability_status: 'available'
        }])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      setError(err.message);
      return { data: null, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createApartment
  };
};
