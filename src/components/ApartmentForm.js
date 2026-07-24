'use client';

import { motion } from 'framer-motion';
import { useState, useRef } from 'react';

const ApartmentForm = ({ building, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    buildingId: building.id,
    houseNumber: '',
    bedrooms: 1,
    bathrooms: 1,
    rent: '',
    deposit: '',
    squareFeet: '',
    features: [],
    images: []
  });

  const [dragActive, setDragActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const imageFiles = formData.images.map(img => img.file);

    const apartmentData = {
      ...formData,
      images: imageFiles
    };

    await onSubmit(apartmentData);
    setIsSubmitting(false);
  };

  const toggleFeature = (feature) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = [...e.dataTransfer.files];
    handleFiles(files);
  };

  const handleFileInput = (e) => {
    const files = [...e.target.files];
    handleFiles(files);
  };

  const handleFiles = (files) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    imageFiles.forEach(file => {
      if (formData.images.length < 8) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageData = {
            id: Date.now() + Math.random(),
            file: file,
            preview: e.target.result,
            name: file.name
          };
          setFormData(prev => ({
            ...prev,
            images: [...prev.images, imageData]
          }));
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeImage = (imageId) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img.id !== imageId)
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
        className="bg-white border-t sm:border border-gray-200 sm:rounded-xl shadow-xl w-full sm:max-w-4xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto"
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
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Add Apartment Unit</h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Building: <span className="text-emerald-600 font-medium">{building.name}</span>
              </p>
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
          {/* Unit Number */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Unit Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.houseNumber}
              onChange={(e) => setFormData(prev => ({...prev, houseNumber: e.target.value}))}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all text-base"
              placeholder="e.g., A101 or GRG3"
            />
          </div>

          {/* Bedrooms & Bathrooms */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">
                Bedrooms <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.bedrooms}
                onChange={(e) => setFormData(prev => ({...prev, bedrooms: parseInt(e.target.value)}))}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all text-base appearance-none cursor-pointer"
              >
                <option value={1}>1 BR</option>
                <option value={2}>2 BR</option>
                <option value={3}>3 BR</option>
                <option value={4}>4+ BR</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">
                Bathrooms <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.bathrooms}
                onChange={(e) => setFormData(prev => ({...prev, bathrooms: parseInt(e.target.value)}))}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all text-base appearance-none cursor-pointer"
              >
                <option value={1}>1 BA</option>
                <option value={2}>2 BA</option>
                <option value={3}>3 BA</option>
              </select>
            </div>
          </div>

          {/* Rent & Deposit */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">
                Monthly Rent (KES) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                value={formData.rent}
                onChange={(e) => setFormData(prev => ({...prev, rent: e.target.value}))}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all text-base"
                placeholder="45000"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">
                Deposit (KES) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                value={formData.deposit}
                onChange={(e) => setFormData(prev => ({...prev, deposit: e.target.value}))}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all text-base"
                placeholder="45000"
              />
            </div>
          </div>

          {/* Features */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-3">
              Unit Features
            </label>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center space-x-2.5 cursor-pointer bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-emerald-300 rounded-lg px-4 py-3 transition-all flex-1 min-w-[140px]">
                <input
                  type="checkbox"
                  checked={formData.features.includes('Balcony')}
                  onChange={() => toggleFeature('Balcony')}
                  className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-0 focus:ring-2"
                />
                <span className="text-gray-700 text-sm">Has Balcony</span>
              </label>
              <label className="flex items-center space-x-2.5 cursor-pointer bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-emerald-300 rounded-lg px-4 py-3 transition-all flex-1 min-w-[140px]">
                <input
                  type="checkbox"
                  checked={formData.features.includes('Furnished')}
                  onChange={() => toggleFeature('Furnished')}
                  className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-0 focus:ring-2"
                />
                <span className="text-gray-700 text-sm">Furnished</span>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-2">Building amenities are inherited</p>
          </div>

          {/* Images Upload */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-3">
              Property Images (Max 8)
            </label>
            <div
              className={`relative border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition-all ${
                dragActive
                  ? 'border-emerald-400 bg-emerald-50'
                  : 'border-gray-300 hover:border-emerald-400 bg-gray-50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
              />
              <div className="space-y-3">
                <svg className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-600 text-sm sm:text-base">Drag & drop images or</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl active:scale-[0.98] transition-all text-base"
                >
                  Browse Files
                </button>
                <p className="text-xs text-gray-500">PNG, JPG up to 5MB each</p>
              </div>
            </div>

            {formData.images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3 mt-4">
                {formData.images.map((image) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={image.preview}
                      alt={image.name}
                      className="w-full aspect-square object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(image.id)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-base hover:bg-red-600 active:bg-red-700 transition-colors shadow-lg"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-blue-700 font-semibold text-sm mb-1">Verification Process</p>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Unit will be "Unverified" initially. Use "Request Verification" to get verified status with Instagram video.
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
                  Adding...
                </span>
              ) : (
                'Add Unit'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default ApartmentForm;
