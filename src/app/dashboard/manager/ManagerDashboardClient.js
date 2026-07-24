'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback } from 'react';
import AnimatedSection from '../../../components/AnimatedSection';
import BuildingForm from '../../../components/BuildingForm';
import ApartmentForm from '../../../components/ApartmentForm';
import { useBuildings } from '../../../hooks/useBuildings';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { useRealtimeSync } from '../../../hooks/useRealtimeSync';

const ManagerDashboardClient = () => {
  const [showBuildingForm, setShowBuildingForm] = useState(false);
  const [showApartmentForm, setShowApartmentForm] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [expandedBuildings, setExpandedBuildings] = useState({});

  const { buildings, loading, createBuilding, createApartment, refreshBuildings } = useBuildings();
  const { userProfile } = useAuth();

  const handleBuildingsChange = useCallback((payload) => {
    refreshBuildings();
  }, [refreshBuildings]);

  const handleApartmentsChange = useCallback((payload) => {
    refreshBuildings();
  }, [refreshBuildings]);

  const handleVerificationRequestsChange = useCallback((payload) => {
    refreshBuildings();
  }, [refreshBuildings]);

  useRealtimeSync({
    onBuildingsChange: handleBuildingsChange,
    onApartmentsChange: handleApartmentsChange,
    onVerificationRequestsChange: handleVerificationRequestsChange
  });

  const handleAddBuilding = async (buildingData) => {
    try {
      const { error } = await createBuilding(buildingData);
      if (error) {
        alert('Failed to create building: ' + error);
        return;
      }
      alert('Building created! Now add apartment units to it.');
      setShowBuildingForm(false);
    } catch (error) {
      alert('An error occurred: ' + error.message);
    }
  };

  const handleAddApartment = async (apartmentData) => {
    try {
      const { apartment, error } = await createApartment(
        apartmentData.buildingId,
        {
          house_number: apartmentData.houseNumber,
          bedrooms: apartmentData.bedrooms,
          bathrooms: apartmentData.bathrooms,
          rent_amount: apartmentData.rent,
          deposit_amount: apartmentData.deposit,
          square_feet: apartmentData.squareFeet,
          description: apartmentData.description,
          features: apartmentData.features
        }
      );

      if (error) {
        alert('Failed to create apartment: ' + error);
        return;
      }

      const uploadedImagePaths = [];
      if (apartmentData.images && apartmentData.images.length > 0) {
        for (let i = 0; i < apartmentData.images.length; i++) {
          const file = apartmentData.images[i];
          const timestamp = Date.now();
          const fileExt = file.name.split('.').pop();
          const fileName = `${apartment.id}_${timestamp}_${i}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('property-images')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (!uploadError) {
            uploadedImagePaths.push(fileName);
          }
        }

        if (uploadedImagePaths.length > 0) {
          await supabase
            .from('apartments')
            .update({ images: uploadedImagePaths })
            .eq('id', apartment.id);
        }
      }

      alert(`Unit added successfully! ${uploadedImagePaths.length} images uploaded.`);
      setShowApartmentForm(false);
      setSelectedBuilding(null);

    } catch (error) {
      alert('An error occurred: ' + error.message);
    }
  };

  const handleRequestUnitVerification = async (building, unit) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('You must be logged in to request verification');
        return;
      }

      const { data: existingRequest } = await supabase
        .from('verification_requests')
        .select('id, status')
        .eq('apartment_id', unit.id)
        .single();

      if (existingRequest) {
        alert(`A ${existingRequest.status} verification request already exists for this unit.`);
        return;
      }

      const { error } = await supabase
        .from('verification_requests')
        .insert([{
          apartment_id: unit.id,
          building_id: building.id,
          manager_id: user.id,
          status: 'pending'
        }]);

      if (error) {
        alert('Failed to submit verification request.');
        return;
      }

      await supabase
        .from('apartments')
        .update({ verification_status: 'pending' })
        .eq('id', unit.id);

  const message = `Hi Hornza! I want to verify this apartment unit:
Building: ${building.name}
Unit: ${unit.house_number}
Address: ${building.address}
Bedrooms: ${unit.bedrooms} BR
Rent: KES ${parseFloat(unit.rent_amount).toLocaleString()}/month
Manager: ${userProfile?.full_name || 'Property Manager'} (${userProfile?.phone || '0712345678'})

To verify this unit, I will:
1. Send KES 1,000 to your M-Pesa number
2. Share the M-Pesa confirmation screenshot
3. Send a clear video walkthrough of the apartment

Please confirm the M-Pesa number.`;

  const whatsappLink = `https://wa.me/254790958286?text=${encodeURIComponent(message)}`;
      window.open(whatsappLink, '_blank');

      alert('Verification request submitted for this unit! Check WhatsApp for next steps.');

    } catch (error) {
      alert('An error occurred: ' + error.message);
    }
  };

  const handleDeleteBuilding = async (building) => {
    if (!window.confirm(`Delete ${building.name}? This will also delete all ${building.apartments?.length || 0} apartments in this building.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('buildings')
        .delete()
        .eq('id', building.id);

      if (error) throw error;
      alert('Building deleted successfully');
    } catch (error) {
      alert('Failed to delete: ' + error.message);
    }
  };

  const toggleBuildingExpansion = (buildingId) => {
    setExpandedBuildings(prev => ({
      ...prev,
      [buildingId]: !prev[buildingId]
    }));
  };

  const totalBuildings = buildings.length;
  const totalUnits = buildings.reduce((sum, b) => sum + (b.apartments?.length || 0), 0);
  const verifiedCount = buildings.reduce((sum, b) =>
    sum + (b.apartments?.filter(a => a.verification_status === 'verified').length || 0), 0
  );
  const pendingCount = buildings.reduce((sum, b) =>
    sum + (b.apartments?.filter(a => a.verification_status === 'pending').length || 0), 0
  );

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
        {/* Compact Header with Stats */}
        <AnimatedSection>
          <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-4 mb-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Property Dashboard</h1>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span>Live Updates Active</span>
                </div>
              </div>

              <div className="flex gap-3 w-full md:w-auto">
                <div className="bg-blue-50 rounded-lg px-3 py-2 flex-1 md:flex-none text-center border border-blue-200">
                  <div className="text-lg font-bold text-blue-700">{totalBuildings}</div>
                  <div className="text-xs text-gray-500">Buildings</div>
                </div>
                <div className="bg-indigo-50 rounded-lg px-3 py-2 flex-1 md:flex-none text-center border border-indigo-200">
                  <div className="text-lg font-bold text-indigo-700">{totalUnits}</div>
                  <div className="text-xs text-gray-500">Units</div>
                </div>
                <div className="bg-emerald-50 rounded-lg px-3 py-2 flex-1 md:flex-none text-center border border-emerald-200">
                  <div className="text-lg font-bold text-emerald-700">{verifiedCount}</div>
                  <div className="text-xs text-gray-500">Verified</div>
                </div>
                <div className="bg-amber-50 rounded-lg px-3 py-2 flex-1 md:flex-none text-center border border-amber-200">
                  <div className="text-lg font-bold text-amber-700">{pendingCount}</div>
                  <div className="text-xs text-gray-500">Pending</div>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Buildings Section */}
        <AnimatedSection delay={0.1}>
          <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">My Buildings</h2>
              <button
                onClick={() => setShowBuildingForm(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={totalBuildings >= 5}
              >
                {totalBuildings >= 5 ? 'Max 5 Buildings' : '+ Add Building'}
              </button>
            </div>

            {buildings.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                <p>No buildings yet. Create your first building to get started!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {buildings.map((building, index) => (
                  <motion.div
                    key={building.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-emerald-300 hover:shadow-sm transition-all"
                  >
                    {/* Building Header - Compact */}
                    <div className="p-3">
                      <div className="flex justify-between items-center">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-gray-900 truncate">{building.name}</h3>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500 truncate">{building.address}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          {/* Inline Stats */}
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-gray-500">{building.apartments?.length || 0} units</span>
                            <span className="text-gray-300">|</span>
                            <span className="text-emerald-600">{building.apartments?.filter(a => a.verification_status === 'verified').length || 0} verified</span>
                            <span className="text-gray-300">|</span>
                            <span className="text-amber-600">{building.apartments?.filter(a => a.verification_status === 'pending').length || 0} pending</span>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedBuilding(building);
                              setShowApartmentForm(true);
                            }}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded transition-colors"
                          >
                            + Unit
                          </button>

                          <button
                            onClick={() => toggleBuildingExpansion(building.id)}
                            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                          >
                            <svg className={`w-4 h-4 transition-transform ${expandedBuildings[building.id] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          <button
                            onClick={() => handleDeleteBuilding(building)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Units Table */}
                    <AnimatePresence>
                      {expandedBuildings[building.id] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t border-gray-200 bg-gray-50"
                        >
                          <div className="p-3">
                            {building.apartments && building.apartments.length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="text-left text-xs text-gray-500 uppercase border-b border-gray-200">
                                      <th className="pb-2 font-semibold">Unit</th>
                                      <th className="pb-2 font-semibold">BR/BA</th>
                                      <th className="pb-2 font-semibold">Rent</th>
                                      <th className="pb-2 font-semibold">Status</th>
                                      <th className="pb-2 font-semibold">Images</th>
                                      <th className="pb-2 font-semibold text-right">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {building.apartments.map((unit) => (
                                      <tr key={unit.id} className="border-b border-gray-100 hover:bg-gray-100 transition-colors">
                                        <td className="py-2 font-semibold text-gray-900">{unit.house_number}</td>
                                        <td className="py-2 text-gray-600">{unit.bedrooms}BR • {unit.bathrooms}BA</td>
                                        <td className="py-2 text-gray-900 font-semibold">KES {parseFloat(unit.rent_amount).toLocaleString()}</td>
                                        <td className="py-2">
                                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                                            unit.verification_status === 'verified' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                            unit.verification_status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                            'bg-gray-100 text-gray-500 border-gray-200'
                                          }`}>
                                            {unit.verification_status === 'verified' ? 'Verified' :
                                             unit.verification_status === 'pending' ? 'Pending' :
                                             'Unverified'}
                                          </span>
                                        </td>
                                        <td className="py-2 text-gray-500 text-xs">
                                          {unit.images && unit.images.length > 0 ? `${unit.images.length} photos` : 'No photos'}
                                        </td>
                                        <td className="py-2 text-right">
                                          {unit.verification_status === 'unverified' ? (
                                            <button
                                              onClick={() => handleRequestUnitVerification(building, unit)}
                                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded transition-colors"
                                            >
                                              Request Verify
                                            </button>
                                          ) : unit.verification_status === 'verified' && unit.instagram_url ? (
                                            <a
                                              href={unit.instagram_url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded hover:bg-emerald-100 transition-colors inline-block border border-emerald-200"
                                            >
                                              View Video
                                            </a>
                                          ) : unit.verification_status === 'pending' ? (
                                            <span className="text-xs text-gray-400">In Review</span>
                                          ) : null}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <p className="text-center text-gray-500 py-4 text-sm">
                                No units yet. Click &quot;+ Unit&quot; to add your first apartment.
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </AnimatedSection>
      </div>

      <AnimatePresence>
        {showBuildingForm && (
          <BuildingForm
            onClose={() => setShowBuildingForm(false)}
            onSubmit={handleAddBuilding}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showApartmentForm && selectedBuilding && (
          <ApartmentForm
            building={selectedBuilding}
            onClose={() => {
              setShowApartmentForm(false);
              setSelectedBuilding(null);
            }}
            onSubmit={handleAddApartment}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManagerDashboardClient;
