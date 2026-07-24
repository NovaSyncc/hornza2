'use client';

import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import AnimatedSection from '../../../components/AnimatedSection';
import { supabase } from '../../../lib/supabase';

const PropertyDetailClient = () => {
  const params = useParams();
  const id = params.id;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProperty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchProperty = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('apartments')
        .select(`
          *,
          building:buildings (
            id,
            name,
            address,
            location,
            contact_phone,
            manager_whatsapp,
            amenities,
            manager:users (
              id,
              full_name,
              phone
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setProperty(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '/placeholder-property.jpg';
    const { data } = supabase.storage
      .from('property-images')
      .getPublicUrl(imagePath);
    return data.publicUrl;
  };

  const generateWhatsAppLink = () => {
    const whatsappNumber = property?.building?.manager_whatsapp ||
                          property?.building?.manager?.phone ||
                          property?.building?.contact_phone;

    if (!whatsappNumber) return '#';

    const message = `Hi! I'm interested in ${property.building.name} - Unit ${property.house_number} at ${property.building.address} for KES ${property.rent_amount.toLocaleString()}/month. Can we arrange a viewing?`;
    const phone = whatsappNumber.replace(/^0/, '254').replace(/\D/g, '');
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  const getInstagramEmbedId = (url) => {
    if (!url) return null;
    const match = url.match(/\/p\/([^/]+)/);
    return match ? match[1] : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-gray-500 text-lg">Loading property details...</div>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-900">Property Not Found</h1>
          <p className="text-gray-500 mb-6">{error || 'This property does not exist'}</p>
          <Link href="/properties" className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-all inline-block">
            Back to Properties
          </Link>
        </div>
      </div>
    );
  }

  const images = property.images || [];
  const hasImages = images.length > 0;
  const instagramEmbedId = getInstagramEmbedId(property.instagram_url);

  return (
    <div className="min-h-screen bg-gray-50 pt-16 md:pt-20 relative overflow-hidden">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-8 relative z-10 max-w-7xl">
        <AnimatedSection>
          <Link href="/properties" className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors mb-6 group text-sm md:text-base">
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Properties
          </Link>
        </AnimatedSection>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <AnimatedSection>
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden p-4 shadow-sm">
                <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 mb-4">
                  {hasImages ? (
                    <img
                      src={getImageUrl(images[currentImageIndex])}
                      alt={`${property.building.name} - Unit ${property.house_number}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}

                  <div className="absolute top-4 right-4 bg-emerald-500 px-4 py-2 rounded-xl shadow-lg">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-white text-sm font-bold">VERIFIED</span>
                    </div>
                  </div>
                </div>

                {hasImages && images.length > 1 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                          currentImageIndex === index
                            ? 'border-emerald-500 scale-95'
                            : 'border-gray-200 hover:border-emerald-300 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={getImageUrl(image)}
                          alt={`View ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </AnimatedSection>

            {instagramEmbedId && (
              <AnimatedSection delay={0.2}>
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Video Walkthrough</h3>
                      <p className="text-sm text-gray-500">Verified property tour</p>
                    </div>
                  </div>
                  <div className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                    <iframe
                      title="Instagram property video tour"
                      src={`https://www.instagram.com/p/${instagramEmbedId}/embed/captioned`}
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      scrolling="no"
                      allowTransparency="true"
                    ></iframe>
                  </div>
                </div>
              </AnimatedSection>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="space-y-4 lg:sticky lg:top-20">
              <AnimatedSection delay={0.1}>
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <h1 className="text-2xl md:text-3xl font-bold mb-3 text-gray-900">
                    {property.building.name}
                  </h1>
                  <p className="text-emerald-600 font-semibold mb-4">Unit {property.house_number}</p>
                  <div className="flex items-start gap-2 text-gray-500 text-sm">
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span>{property.building.address}</span>
                  </div>
                </div>
              </AnimatedSection>

              <AnimatedSection delay={0.15}>
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Monthly Rent</div>
                      <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                        {parseFloat(property.rent_amount).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-400">KES</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Deposit</div>
                      <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                        {parseFloat(property.deposit_amount).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-400">KES</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <div className="text-xl font-bold text-gray-900">{property.bedrooms}</div>
                      <div className="text-xs text-gray-500">Bedrooms</div>
                    </div>
                    <div className="text-center bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <div className="text-xl font-bold text-gray-900">{property.bathrooms || 1}</div>
                      <div className="text-xs text-gray-500">Bathrooms</div>
                    </div>
                    {property.square_feet && (
                      <div className="text-center bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <div className="text-xl font-bold text-gray-900">{property.square_feet}</div>
                        <div className="text-xs text-gray-500">Sq Ft</div>
                      </div>
                    )}
                  </div>
                </div>
              </AnimatedSection>

              {property.features && property.features.length > 0 && (
                <AnimatedSection delay={0.2}>
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-sm font-bold mb-4 text-gray-500 uppercase tracking-wide">Unit Features</h3>
                    <div className="flex flex-wrap gap-2">
                      {property.features.map((feature, index) => (
                        <span key={index} className="bg-gray-50 rounded-lg px-3 py-1.5 text-gray-700 text-sm">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </AnimatedSection>
              )}

              {property.building.amenities && property.building.amenities.length > 0 && (
                <AnimatedSection delay={0.25}>
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-sm font-bold mb-4 text-gray-500 uppercase tracking-wide">Building Amenities</h3>
                    <div className="space-y-2">
                      {property.building.amenities.map((amenity, index) => (
                        <div key={index} className="flex items-center gap-3 text-sm">
                          <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-gray-600">{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </AnimatedSection>
              )}

              <AnimatedSection delay={0.3}>
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-sm font-bold mb-3 text-gray-500 uppercase tracking-wide">Property Manager</h3>
                  <p className="text-gray-900 font-semibold text-lg mb-1">
                    {property.building.manager?.full_name || 'Property Manager'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {property.building.manager_whatsapp || property.building.contact_phone || property.building.manager?.phone || 'Available via WhatsApp'}
                  </p>
                </div>
              </AnimatedSection>

              <AnimatedSection delay={0.35}>
                <motion.a
                  href={generateWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-4 bg-emerald-600 text-white font-bold rounded-xl text-center hover:bg-emerald-700 transition-all duration-300 shadow-md"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="flex items-center justify-center gap-3">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    <span className="text-lg">Chat with Manager on WhatsApp</span>
                  </span>
                </motion.a>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailClient;
