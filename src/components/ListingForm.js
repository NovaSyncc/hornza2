'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

const SERVICE_CONFIG = {
  rental: {
    label: 'Rental Listing',
    priceFields: ['rent_amount', 'deposit_amount'],
  },
  furnished: {
    label: 'Furnished Stay',
    priceFields: ['daily_rate', 'weekly_rate', 'monthly_rate', 'minimum_stay_days', 'max_guests'],
  },
  sale: {
    label: 'Property for Sale',
    priceFields: ['sale_price', 'broker_fee_percentage'],
  },
};

const PROPERTY_TYPES = [
  'apartment', 'bedsitter', 'studio', '1br', '2br', '3br',
  'house', 'villa', 'land', 'commercial',
];

const LOCATIONS = [
  'Eastleigh', 'California', 'Jam Street', 'Eastleigh South',
  'Eastleigh North', 'South C', 'Pangani', 'Majengo',
];

const AMENITY_OPTIONS = [
  'WiFi', 'Parking', 'Security', 'Water 24/7', 'Backup Generator',
  'CCTV', 'Elevator', 'Gym', 'Swimming Pool', 'Garden',
  'Air Conditioning', 'Furnished', 'Balcony', 'Rooftop Access',
];

const FEATURE_OPTIONS = [
  'Master Ensuite', 'Walk-in Closet', 'Open Kitchen', 'DSQ',
  'Tiled Floors', 'Hot Water', 'Built-in Wardrobes',
];

const ListingForm = ({ onClose, onSubmit, serviceType = 'rental', listerType = 'property_manager' }) => {
  const config = SERVICE_CONFIG[serviceType];

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    property_type: 'apartment',
    location: 'Eastleigh',
    address: '',
    bedrooms: 1,
    bathrooms: 1,
    square_feet: '',
    rent_amount: '',
    deposit_amount: '',
    daily_rate: '',
    weekly_rate: '',
    monthly_rate: '',
    minimum_stay_days: 1,
    max_guests: 2,
    sale_price: '',
    broker_fee_percentage: '',
    owner_name: '',
    owner_phone: '',
    contact_phone: '',
    contact_whatsapp: '',
    features: [],
    amenities: [],
  });

  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleItem = (field, item) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item],
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 10) {
      setError('Maximum 10 images allowed');
      return;
    }
    setImages(prev => [...prev, ...files]);
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (listingId) => {
    const paths = [];
    for (let i = 0; i < images.length; i++) {
      const file = images[i];
      const ext = file.name.split('.').pop();
      const fileName = `${listingId}_${Date.now()}_${i}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (!uploadError) {
        paths.push(fileName);
      }
    }
    return paths;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const listingData = {
        service_type: serviceType,
        lister_type: listerType,
        title: formData.title,
        description: formData.description,
        property_type: formData.property_type,
        location: formData.location,
        address: formData.address,
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseInt(formData.bathrooms),
        square_feet: formData.square_feet ? parseInt(formData.square_feet) : null,
        features: formData.features,
        amenities: formData.amenities,
        contact_phone: formData.contact_phone,
        contact_whatsapp: formData.contact_whatsapp || formData.contact_phone,
      };

      // Service-specific fields
      if (serviceType === 'rental') {
        listingData.rent_amount = parseFloat(formData.rent_amount);
        listingData.deposit_amount = formData.deposit_amount ? parseFloat(formData.deposit_amount) : null;
      } else if (serviceType === 'furnished') {
        listingData.daily_rate = formData.daily_rate ? parseFloat(formData.daily_rate) : null;
        listingData.weekly_rate = formData.weekly_rate ? parseFloat(formData.weekly_rate) : null;
        listingData.monthly_rate = formData.monthly_rate ? parseFloat(formData.monthly_rate) : null;
        listingData.minimum_stay_days = parseInt(formData.minimum_stay_days) || 1;
        listingData.max_guests = parseInt(formData.max_guests) || 2;
      } else if (serviceType === 'sale') {
        listingData.sale_price = parseFloat(formData.sale_price);
        listingData.broker_fee_percentage = formData.broker_fee_percentage ? parseFloat(formData.broker_fee_percentage) : null;
      }

      // Broker-specific fields
      if (listerType === 'broker') {
        listingData.owner_name = formData.owner_name || null;
        listingData.owner_phone = formData.owner_phone || null;
      }

      const listing = await onSubmit(listingData);

      // Upload images after listing is created
      if (images.length > 0 && listing?.id) {
        const imagePaths = await uploadImages(listing.id);
        if (imagePaths.length > 0) {
          await supabase
            .from('listings')
            .update({ images: imagePaths })
            .eq('id', listing.id);
        }
      }

      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create listing');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses = "w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white border border-gray-200 rounded-t-xl sm:rounded-xl shadow-xl w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center z-10">
          <h2 className="text-lg font-bold text-gray-900">New {config.label}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm text-gray-700 font-medium mb-1">Listing Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className={inputClasses}
              placeholder="e.g. Modern 2BR Apartment in Eastleigh"
              required
            />
          </div>

          {/* Property Type + Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-700 font-medium mb-1">Property Type</label>
              <select
                value={formData.property_type}
                onChange={(e) => handleChange('property_type', e.target.value)}
                className={inputClasses}
              >
                {PROPERTY_TYPES.map(type => (
                  <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 font-medium mb-1">Location</label>
              <select
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                className={inputClasses}
              >
                {LOCATIONS.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm text-gray-700 font-medium mb-1">Full Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className={inputClasses}
              placeholder="Building name, street, area"
              required
            />
          </div>

          {/* Bedrooms, Bathrooms, Sq Ft */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-gray-700 font-medium mb-1">Bedrooms</label>
              <input
                type="number"
                min="0"
                max="10"
                value={formData.bedrooms}
                onChange={(e) => handleChange('bedrooms', e.target.value)}
                className={inputClasses}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 font-medium mb-1">Bathrooms</label>
              <input
                type="number"
                min="0"
                max="10"
                value={formData.bathrooms}
                onChange={(e) => handleChange('bathrooms', e.target.value)}
                className={inputClasses}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 font-medium mb-1">Sq Ft</label>
              <input
                type="number"
                value={formData.square_feet}
                onChange={(e) => handleChange('square_feet', e.target.value)}
                className={inputClasses}
                placeholder="Optional"
              />
            </div>
          </div>

          {/* Pricing — Rental */}
          {serviceType === 'rental' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-700 font-medium mb-1">Monthly Rent (KES)</label>
                <input
                  type="number"
                  value={formData.rent_amount}
                  onChange={(e) => handleChange('rent_amount', e.target.value)}
                  className={inputClasses}
                  placeholder="e.g. 25000"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 font-medium mb-1">Deposit (KES)</label>
                <input
                  type="number"
                  value={formData.deposit_amount}
                  onChange={(e) => handleChange('deposit_amount', e.target.value)}
                  className={inputClasses}
                  placeholder="Optional"
                />
              </div>
            </div>
          )}

          {/* Pricing — Furnished */}
          {serviceType === 'furnished' && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 font-medium mb-1">Daily Rate (KES)</label>
                  <input
                    type="number"
                    value={formData.daily_rate}
                    onChange={(e) => handleChange('daily_rate', e.target.value)}
                    className={inputClasses}
                    placeholder="e.g. 3500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 font-medium mb-1">Weekly Rate (KES)</label>
                  <input
                    type="number"
                    value={formData.weekly_rate}
                    onChange={(e) => handleChange('weekly_rate', e.target.value)}
                    className={inputClasses}
                    placeholder="e.g. 20000"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 font-medium mb-1">Monthly Rate (KES)</label>
                  <input
                    type="number"
                    value={formData.monthly_rate}
                    onChange={(e) => handleChange('monthly_rate', e.target.value)}
                    className={inputClasses}
                    placeholder="e.g. 70000"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 font-medium mb-1">Min Stay (days)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minimum_stay_days}
                    onChange={(e) => handleChange('minimum_stay_days', e.target.value)}
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 font-medium mb-1">Max Guests</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_guests}
                    onChange={(e) => handleChange('max_guests', e.target.value)}
                    className={inputClasses}
                  />
                </div>
              </div>
            </>
          )}

          {/* Pricing — Sale */}
          {serviceType === 'sale' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-700 font-medium mb-1">Sale Price (KES)</label>
                <input
                  type="number"
                  value={formData.sale_price}
                  onChange={(e) => handleChange('sale_price', e.target.value)}
                  className={inputClasses}
                  placeholder="e.g. 5000000"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 font-medium mb-1">Broker Fee %</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  value={formData.broker_fee_percentage}
                  onChange={(e) => handleChange('broker_fee_percentage', e.target.value)}
                  className={inputClasses}
                  placeholder="e.g. 5"
                />
              </div>
            </div>
          )}

          {/* Broker-only: Owner details */}
          {listerType === 'broker' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-700 font-medium mb-1">Owner Name</label>
                <input
                  type="text"
                  value={formData.owner_name}
                  onChange={(e) => handleChange('owner_name', e.target.value)}
                  className={inputClasses}
                  placeholder="Property owner name"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 font-medium mb-1">Owner Phone</label>
                <input
                  type="tel"
                  value={formData.owner_phone}
                  onChange={(e) => handleChange('owner_phone', e.target.value)}
                  className={inputClasses}
                  placeholder="0712345678"
                />
              </div>
            </div>
          )}

          {/* Contact Details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-700 font-medium mb-1">Contact Phone</label>
              <input
                type="tel"
                value={formData.contact_phone}
                onChange={(e) => handleChange('contact_phone', e.target.value)}
                className={inputClasses}
                placeholder="0712345678"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 font-medium mb-1">WhatsApp Number</label>
              <input
                type="tel"
                value={formData.contact_whatsapp}
                onChange={(e) => handleChange('contact_whatsapp', e.target.value)}
                className={inputClasses}
                placeholder="Same as phone if blank"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-gray-700 font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className={`${inputClasses} h-24 resize-none`}
              placeholder="Describe the property..."
              required
            />
          </div>

          {/* Features */}
          <div>
            <label className="block text-sm text-gray-700 font-medium mb-2">Features</label>
            <div className="flex flex-wrap gap-2">
              {FEATURE_OPTIONS.map(feature => (
                <button
                  key={feature}
                  type="button"
                  onClick={() => toggleItem('features', feature)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    formData.features.includes(feature)
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                      : 'bg-gray-100 text-gray-600 border border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {feature}
                </button>
              ))}
            </div>
          </div>

          {/* Amenities */}
          <div>
            <label className="block text-sm text-gray-700 font-medium mb-2">Amenities</label>
            <div className="flex flex-wrap gap-2">
              {AMENITY_OPTIONS.map(amenity => (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => toggleItem('amenities', amenity)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    formData.amenities.includes(amenity)
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-gray-100 text-gray-600 border border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {amenity}
                </button>
              ))}
            </div>
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm text-gray-700 font-medium mb-2">Photos (max 10)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
            />
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {images.map((file, i) => (
                  <div key={i} className="relative group">
                    <div className="w-16 h-16 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center text-xs text-gray-400 overflow-hidden">
                      <img
                        src={URL.createObjectURL(file)}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating Listing...' : `Create ${config.label}`}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default ListingForm;
