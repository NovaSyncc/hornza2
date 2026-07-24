'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useBuildings = () => {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // Fetch manager's buildings
  const fetchBuildings = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('buildings')
        .select(`
          *,
          apartments (
            id,
            house_number,
            bedrooms,
            rent_amount,
            verification_status,
            availability_status,
            images
          )
        `)
        .eq('manager_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBuildings(data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching buildings:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create new building (shell only, no apartments)
  const createBuilding = async (buildingData) => {
    try {
      const { data, error } = await supabase
        .from('buildings')
        .insert([{
          manager_id: user.id,
          ...buildingData
        }])
        .select()
        .single();

      if (error) throw error;

      // Refresh buildings list
      await fetchBuildings();
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  };

  // Create apartment in existing building
  const createApartment = async (buildingId, apartmentData) => {
    try {
      console.log('Creating apartment in building:', buildingId);

      const { data: apartment, error: apartmentError } = await supabase
        .from('apartments')
        .insert([{
          building_id: buildingId,
          house_number: apartmentData.house_number,
          bedrooms: apartmentData.bedrooms,
          bathrooms: apartmentData.bathrooms || 1,
          rent_amount: parseFloat(apartmentData.rent_amount),
          deposit_amount: parseFloat(apartmentData.deposit_amount),
          square_feet: apartmentData.square_feet || null,
          description: apartmentData.description || '',
          features: apartmentData.features || [],
          availability_status: 'available',
          verification_status: 'unverified'
        }])
        .select()
        .single();

      if (apartmentError) {
        console.error('Apartment creation failed:', apartmentError);
        throw new Error('Failed to create apartment: ' + apartmentError.message);
      }

      console.log('Apartment created successfully:', apartment.id);

      // Refresh buildings list
      await fetchBuildings();

      return {
        apartment,
        error: null
      };

    } catch (err) {
      console.error('Error in createApartment:', err);
      return {
        apartment: null,
        error: err.message
      };
    }
  };

  // Transaction: Create building + apartment together (legacy, for backward compatibility)
  const createBuildingWithApartment = async (buildingData, apartmentData) => {
    let createdBuilding = null;

    try {
      // Step 1: Create building
      console.log('Transaction Step 1: Creating building...', buildingData);
      const { data: building, error: buildingError } = await supabase
        .from('buildings')
        .insert([{
          manager_id: user.id,
          name: buildingData.name,
          location: buildingData.location,
          address: buildingData.address,
          amenities: buildingData.amenities || [],
          contact_phone: buildingData.contact_phone || ''
        }])
        .select()
        .single();

      if (buildingError) {
        console.error('Building creation failed:', buildingError);
        throw new Error('Failed to create building: ' + buildingError.message);
      }

      createdBuilding = building; // eslint-disable-line no-unused-vars
      console.log('Transaction Step 1 SUCCESS: Building created', building.id);

      // Step 2: Create apartment in that building
      console.log('Transaction Step 2: Creating apartment...', apartmentData);
      const { data: apartment, error: apartmentError } = await supabase
        .from('apartments')
        .insert([{
          building_id: building.id,
          house_number: apartmentData.house_number,
          bedrooms: apartmentData.bedrooms,
          bathrooms: apartmentData.bathrooms || 1,
          rent_amount: parseFloat(apartmentData.rent_amount),
          deposit_amount: parseFloat(apartmentData.deposit_amount),
          square_feet: apartmentData.square_feet || null,
          description: apartmentData.description || '',
          features: apartmentData.features || [],
          availability_status: 'available',
          verification_status: 'unverified'
        }])
        .select()
        .single();

      if (apartmentError) {
        console.error('Apartment creation failed:', apartmentError);
        // ROLLBACK: Delete the building we just created
        console.log('ROLLBACK: Deleting building', building.id);
        await supabase
          .from('buildings')
          .delete()
          .eq('id', building.id);

        throw new Error('Failed to create apartment: ' + apartmentError.message);
      }

      console.log('Transaction Step 2 SUCCESS: Apartment created', apartment.id);
      console.log('✅ TRANSACTION COMPLETE');

      // Refresh buildings list
      await fetchBuildings();

      return {
        building,
        apartment,
        error: null
      };

    } catch (err) {
      console.error('❌ TRANSACTION FAILED:', err.message);
      return {
        building: null,
        apartment: null,
        error: err.message
      };
    }
  };

  useEffect(() => {
    fetchBuildings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return {
    buildings,
    loading,
    error,
    createBuilding,
    createApartment,
    createBuildingWithApartment, // Keep for backward compatibility
    refreshBuildings: fetchBuildings
  };
};
