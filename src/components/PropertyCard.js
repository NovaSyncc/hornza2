'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { useState, useEffect } from 'react';

const SERVICE_LABELS = {
  rental: { label: 'Rent', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  furnished: { label: 'Furnished', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  sale: { label: 'Sale', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
};

const PropertyCard = ({ property, isLegacy = false }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [saved, setSaved] = useState(false);

  // Support both legacy (apartments) and new (listings) data shapes
  const id = property.id;
  const serviceType = property.service_type || 'rental';
  const serviceInfo = SERVICE_LABELS[serviceType] || SERVICE_LABELS.rental;
  const title = property.title || property.building?.name || 'Property';
  const location = property.address || property.location || property.building?.address || property.building?.location || 'Eastleigh';
  const bedrooms = property.bedrooms;
  const bathrooms = property.bathrooms || 1;
  const propertyType = property.property_type || property.type || 'Apartment';
  const hasVideo = property.instagram_url;
  const isScraped = property.is_scraped;
  const photoCount = property.images?.length || 0;

  // Determine the link path
  const linkHref = isLegacy ? `/property/${id}` : `/listing/${id}`;

  useEffect(() => {
    const loadImage = async () => {
      if (property.images && property.images.length > 0) {
        const firstImage = property.images[0];
        // If it's a full URL already (scraped), use directly
        if (firstImage.startsWith('http')) {
          setImageUrl(firstImage);
          return;
        }
        const { data } = supabase.storage
          .from('property-images')
          .getPublicUrl(firstImage);
        if (data) setImageUrl(data.publicUrl);
      }
    };
    loadImage();
  }, [property.images]);

  const displayImage = imageUrl || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop';

  const handleSave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setSaved((prev) => !prev);
  };

  // Price display based on service type
  const renderPrice = () => {
    if (serviceType === 'sale') {
      const price = property.sale_price && parseFloat(property.sale_price) > 0
        ? parseFloat(property.sale_price)
        : null;
      return (
        <div className="text-lg sm:text-xl font-bold text-gray-900">
          {price ? `KES ${price.toLocaleString()}` : 'Price on Request'}
        </div>
      );
    }

    if (serviceType === 'furnished') {
      const nightRate = parseFloat(property.daily_rate || 0);
      return (
        <div className="text-lg sm:text-xl font-bold text-gray-900">
          KES {nightRate.toLocaleString()}<span className="text-sm font-normal text-gray-500">/night</span>
        </div>
      );
    }

    // Default: rental
    const rent = parseFloat(property.rent_amount || 0);
    const deposit = parseFloat(property.deposit_amount || 0);
    return (
      <div>
        <div className="text-lg sm:text-xl font-bold text-gray-900">
          KES {rent.toLocaleString()}<span className="text-sm font-normal text-gray-500">/mo</span>
        </div>
        {deposit > 0 && (
          <div className="text-xs text-gray-500">Deposit: KES {deposit.toLocaleString()}</div>
        )}
      </div>
    );
  };

  return (
    <Link href={linkHref}>
      <motion.div
        className="group bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-gray-300 transition-all duration-300 h-full"
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        {/* Image Section */}
        <div className="relative overflow-hidden aspect-[16/10]">
          <motion.img
            src={displayImage}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500"
            initial={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop';
            }}
          />

          {/* Top-left: Service type badge */}
          <div className="absolute top-3 left-3">
            <div className={`${serviceInfo.bg} ${serviceInfo.text} ${serviceInfo.border} border px-2 py-0.5 rounded-full`}>
              <span className="text-[11px] font-semibold">{serviceInfo.label}</span>
            </div>
          </div>

          {/* Top-right: Save/heart button */}
          <div className="absolute top-3 right-3">
            <button
              onClick={handleSave}
              className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow duration-200"
              aria-label={saved ? 'Unsave property' : 'Save property'}
            >
              {saved ? (
                <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                </svg>
              )}
            </button>
          </div>

          {/* Bottom-left: Photo count badge */}
          {photoCount > 1 && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/60 text-white px-2 py-1 rounded-full">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-[11px] font-medium">{photoCount} photos</span>
            </div>
          )}

          {/* Bottom-right: Verified badge */}
          {!isScraped && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-emerald-500 text-white px-2 py-1 rounded-full">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-[11px] font-semibold">Verified</span>
            </div>
          )}

          {/* Center: Video play icon overlay */}
          {hasVideo && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4 sm:p-5">
          {/* Price — loudest element */}
          <div className="mb-2">
            {renderPrice()}
          </div>

          {/* Specs row */}
          <div className="text-sm sm:text-base text-gray-600 mb-1.5">
            {bedrooms} bd &bull; {bathrooms} ba &bull; {propertyType}
          </div>

          {/* Title */}
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 line-clamp-1 group-hover:text-emerald-600 transition-colors duration-200">
            {title}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1.5">
            <svg className="w-4 h-4 flex-shrink-0 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span className="line-clamp-1">{location}</span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default PropertyCard;
