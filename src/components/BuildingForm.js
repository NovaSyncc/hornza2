'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

const BuildingForm = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    buildingName: '',
    address: '',
    managerWhatsApp: '',
    amenities: []
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const amenityOptions = [
    'Parking', 'Security', 'Water 24/7', 'Backup Generator',
    'CCTV', 'Elevator', 'Gym', 'Swimming Pool', 'Garden'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const buildingData = {
      name: formData.buildingName,
      location: 'Eastleigh',
      address: formData.address,
      manager_whatsapp: formData.managerWhatsApp,
      amenities: formData.amenities
    };

    await onSubmit(buildingData);
    setIsSubmitting(false);
  };

  const toggleAmenity = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white border-t sm:border border-gray-200 sm:rounded-xl shadow-xl w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto"
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Sticky */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Add New Building</h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Create building, then add units</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 w-10 h-10 rounded-lg flex items-center justify-center transition-all flex-shrink-0"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Building Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.buildingName}
              onChange={(e) => setFormData(prev => ({...prev, buildingName: e.target.value}))}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all text-base"
              placeholder="e.g., Ibgaaro Building"
            />
            <p className="text-xs text-gray-500 mt-1.5">Main building name</p>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Building Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData(prev => ({...prev, address: e.target.value}))}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all text-base"
              placeholder="Section 7, Eastleigh, Nairobi"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Your WhatsApp Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={formData.managerWhatsApp}
              onChange={(e) => setFormData(prev => ({...prev, managerWhatsApp: e.target.value}))}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all text-base"
              placeholder="254712345678"
            />
            <p className="text-xs text-gray-500 mt-1.5">Tenants contact you here (format: 254XXXXXXXXX)</p>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-3">
              Building Amenities
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {amenityOptions.map(amenity => (
                <label
                  key={amenity}
                  className="flex items-center space-x-2.5 cursor-pointer bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-emerald-300 rounded-lg px-3 py-3 transition-all group"
                >
                  <input
                    type="checkbox"
                    checked={formData.amenities.includes(amenity)}
                    onChange={() => toggleAmenity(amenity)}
                    className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-0 focus:ring-2"
                  />
                  <span className="text-gray-700 text-sm group-hover:text-gray-900 transition-colors">{amenity}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">Shared amenities for all units</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-blue-700 font-semibold text-sm mb-1">Next Step</p>
                <p className="text-gray-700 text-sm leading-relaxed">
                  After creating the building, add apartment units with details, images, and pricing.
                </p>
              </div>
            </div>
          </div>

          {/* Sticky Bottom Actions */}
          <div className="sticky bottom-0 -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 bg-white border-t border-gray-200 p-4 sm:p-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3.5 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 text-base"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-base"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </span>
              ) : (
                'Create Building'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default BuildingForm;
