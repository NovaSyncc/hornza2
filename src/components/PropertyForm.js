'use client';

import { motion } from 'framer-motion';
import { useState, useRef } from 'react';

const PropertyForm = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    buildingName: '',
    address: '',
    houseNumber: '',
    bedrooms: 1,
    rent: '',
    deposit: '',
    amenities: [],
    description: '',
    images: []
  });

  const [dragActive, setDragActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const amenityOptions = [
    'Parking', 'Security', 'Water 24/7', 'Backup Generator',
    'CCTV', 'Gym', 'Swimming Pool', 'Balcony', 'Garden'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Extract only the File objects for upload (remove preview URLs)
    const imageFiles = formData.images.map(img => img.file);

    const propertyData = {
      buildingName: formData.buildingName,
      address: formData.address,
      location: 'Eastleigh',
      amenities: formData.amenities,
      houseNumber: formData.houseNumber,
      bedrooms: formData.bedrooms,
      rent: formData.rent,
      deposit: formData.deposit,
      description: formData.description,
      images: imageFiles // Pass only File objects, not preview data
    };

    await onSubmit(propertyData);
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
            file: file, // Store actual File object
            preview: e.target.result, // Store preview URL separately
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

  const inputClasses = "w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 max-w-4xl w-full max-h-screen overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Add New Property</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 mb-1 text-sm font-medium">Building Name</label>
              <input
                type="text"
                required
                value={formData.buildingName}
                onChange={(e) => setFormData(prev => ({...prev, buildingName: e.target.value}))}
                className={inputClasses}
                placeholder="e.g., GreyRock"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1 text-sm font-medium">House Number</label>
              <input
                type="text"
                required
                value={formData.houseNumber}
                onChange={(e) => setFormData(prev => ({...prev, houseNumber: e.target.value}))}
                className={inputClasses}
                placeholder="e.g., GRG3"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-1 text-sm font-medium">Address</label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData(prev => ({...prev, address: e.target.value}))}
              className={inputClasses}
              placeholder="Section 7, Eastleigh, Nairobi"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="block text-gray-700 mb-1 text-sm font-medium">Bedrooms</label>
              <select
                value={formData.bedrooms}
                onChange={(e) => setFormData(prev => ({...prev, bedrooms: parseInt(e.target.value)}))}
                className={inputClasses}
              >
                <option value={1}>1 Bedroom</option>
                <option value={2}>2 Bedrooms</option>
                <option value={3}>3 Bedrooms</option>
                <option value={4}>4+ Bedrooms</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 mb-1 text-sm font-medium">Monthly Rent (KES)</label>
              <input
                type="number"
                required
                value={formData.rent}
                onChange={(e) => setFormData(prev => ({...prev, rent: e.target.value}))}
                className={inputClasses}
                placeholder="45000"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1 text-sm font-medium">Deposit (KES)</label>
              <input
                type="number"
                required
                value={formData.deposit}
                onChange={(e) => setFormData(prev => ({...prev, deposit: e.target.value}))}
                className={inputClasses}
                placeholder="45000"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-1 text-sm font-medium">Property Images (Max 8)</label>
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
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
              <div className="space-y-2">
                <svg className="w-10 h-10 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-600">Drag & drop images here or</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all"
                >
                  Browse Files
                </button>
                <p className="text-sm text-gray-500">PNG, JPG, JPEG up to 5MB each</p>
              </div>
            </div>

            {formData.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {formData.images.map((image) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={image.preview}
                      alt={image.name}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(image.id)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-gray-700 mb-1 text-sm font-medium">Amenities</label>
            <div className="grid grid-cols-3 gap-3">
              {amenityOptions.map(amenity => (
                <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.amenities.includes(amenity)}
                    onChange={() => toggleAmenity(amenity)}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-gray-700 text-sm">{amenity}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-1 text-sm font-medium">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
              rows={3}
              className={`${inputClasses} resize-none`}
              placeholder="Describe your property..."
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-gray-700 text-sm">
              <strong className="text-blue-700">Note:</strong> Your property will go live immediately as "Unverified".
              Use the "Request Verification" button to get verified status and Instagram video showcase.
            </p>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Add Property'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default PropertyForm;
