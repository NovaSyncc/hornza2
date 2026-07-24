/**
 * Insert new scraped listings (Wafi Investment + Afrimac)
 * Run: node scripts/insert-new-listings.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function loadEnv() {
  const envPath = resolve(process.cwd(), '.env.local');
  const envContent = readFileSync(envPath, 'utf-8');
  const vars = {};
  for (const line of envContent.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const [k, ...v] = t.split('=');
    vars[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
  }
  return vars;
}

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const newListings = [
  // WAFI INVESTMENT
  {
    service_type: 'sale', lister_type: 'broker',
    title: 'Lumen — 1 & 2BR Apartments, 6th Parklands',
    description: 'Where Light Meets The City & Forest. Contemporary apartments overlooking Karura Forest on Limuru Road, 6th Parklands. 1BR from $60K, 2BR from $95K.',
    location: 'Parklands', address: 'Limuru Road, 6th Parklands, Nairobi',
    property_type: 'apartment', bedrooms: 2, bathrooms: 2, square_feet: 1184,
    sale_price: 12350000,
    features: ['1-2 Bedroom Options', 'Forest Facing', 'City Facing', '70-120 sqm'],
    amenities: ['Rooftop pool', 'Rooftop restaurant', 'Yoga studio', 'Co-working space', 'Fully fitted gym', 'Kids play area', 'Solar panels', 'High-speed lifts', 'CCTV surveillance', 'Borehole', 'Full backup power', 'Intercom system', 'Concierge'],
    images: ['https://static.wixstatic.com/media/1d50a8_7759dd3b2ff44a5c89b16b8d7bdf3494~mv2.jpg'],
    contact_phone: '+254720000082', contact_whatsapp: '+254720000082',
    verification_status: 'verified', is_available: true, is_scraped: true,
    scraped_source: 'Wafi Investment', scraped_url: 'https://www.wafiinvestment.com/lumen'
  },
  {
    service_type: 'sale', lister_type: 'broker',
    title: 'Westridge — 2-5BR + DSQ Apartments, Westlands',
    description: 'Refined residential development along Waiyaki Way, Westlands. 2BR from $95K, 3BR $145K, 4BR $165K, 5BR Duplex from $190K.',
    location: 'Westlands', address: 'Waiyaki Way, Westlands, Nairobi',
    property_type: 'apartment', bedrooms: 3, bathrooms: 3, square_feet: 2099,
    sale_price: 18850000,
    features: ['2-5 Bedroom + DSQ', '130-325 sqm', 'Duplex Available'],
    amenities: ['Rooftop pool', 'Rooftop garden', 'Fully fitted gym', 'Kids play area', 'Commercial area', 'Residents lounge', 'Courtyard', 'High-speed lifts', 'Borehole', 'Manned entrances'],
    images: [],
    contact_phone: '+254720000082', contact_whatsapp: '+254720000082',
    verification_status: 'verified', is_available: true, is_scraped: true,
    scraped_source: 'Wafi Investment', scraped_url: 'https://www.wafiinvestment.com/westridge'
  },
  {
    service_type: 'sale', lister_type: 'broker',
    title: 'Wafi Square — 2-5BR + DSQ Mixed-Use, 2nd Parklands',
    description: 'Contemporary mixed-use residential in 2nd Parklands Avenue. 2BR from $70K, 3BR $100K, 4BR $135K, 5BR Duplex $200K.',
    location: 'Parklands', address: '2nd Parklands Avenue, Nairobi',
    property_type: 'apartment', bedrooms: 3, bathrooms: 3, square_feet: 1722,
    sale_price: 13000000,
    features: ['2-5 Bedroom + DSQ', '130-317 sqm', 'Mixed-Use', 'Duplex Available'],
    amenities: ['Rooftop pool', 'Prayer area', 'Commercial space', 'Residents lounge', 'Video intercom', 'Fully fitted gym', 'CCTV surveillance', 'High-speed lifts', 'Kids play area', 'Borehole', 'Manned entrances'],
    images: [],
    contact_phone: '+254720000082', contact_whatsapp: '+254720000082',
    verification_status: 'verified', is_available: true, is_scraped: true,
    scraped_source: 'Wafi Investment', scraped_url: 'https://www.wafiinvestment.com/wafi-square'
  },
  {
    service_type: 'sale', lister_type: 'broker',
    title: 'Wafi Residence — 2-5BR + DSQ, 1st Parklands',
    description: 'A Calm Address in the City. Gated community in Batu Batu estate, 1st Avenue Parklands. 2BR from $70K, 3BR $115K, 4BR $135K, 5BR $330K.',
    location: 'Parklands', address: 'Batu Batu Estate, 1st Avenue Parklands, Nairobi',
    property_type: 'apartment', bedrooms: 3, bathrooms: 3, square_feet: 1938,
    sale_price: 14950000,
    features: ['2-5 Bedroom + DSQ', '128-330 sqm', 'Gated Community'],
    amenities: ['Rooftop terrace', 'Club house', 'Fully fitted gym', 'Kids play area', 'Solar panels', 'High-speed lifts', 'CCTV surveillance', 'Borehole', 'Full backup power', 'Intercom system', 'Ample parking'],
    images: [],
    contact_phone: '+254720000082', contact_whatsapp: '+254720000082',
    verification_status: 'verified', is_available: true, is_scraped: true,
    scraped_source: 'Wafi Investment', scraped_url: 'https://www.wafiinvestment.com/wafi-residence'
  },

  // AFRIMAC INTERNATIONAL
  {
    service_type: 'sale', lister_type: 'broker',
    title: '3BR Apartment — Jalaram Road, Westlands',
    description: 'Premium 3-bedroom apartment with staff quarter on Jalaram Road, Westlands. 152 sqm with heated rooftop infinity pool and sky lounge.',
    location: 'Westlands', address: 'Jalaram Road, Westlands, Nairobi',
    property_type: 'apartment', bedrooms: 3, bathrooms: 4, square_feet: 1636,
    sale_price: 19500000,
    features: ['152 sqm', 'DSQ', 'Private Balcony'],
    amenities: ['Heated infinity pool', 'Sky lounge', 'Fully equipped gym', 'Spa & sauna', 'Yoga deck', 'Landscaped gardens', 'Kids play area', 'Co-working space', 'High-speed lifts', 'Backup generator', 'Borehole', 'CCTV', 'Ample parking'],
    images: ['https://afrimacinternational.com/wp-content/uploads/2026/07/amani-kitchen-669x564.jpeg', 'https://afrimacinternational.com/wp-content/uploads/2026/07/amani-residence-787-758x564.jpeg', 'https://afrimacinternational.com/wp-content/uploads/2026/07/amani-residence-living-and-dining-45-758x564.jpeg', 'https://afrimacinternational.com/wp-content/uploads/2026/07/amani-776-758x564.jpeg', 'https://afrimacinternational.com/wp-content/uploads/2026/07/amani-residence-living-65-758x564.jpeg', 'https://afrimacinternational.com/wp-content/uploads/2026/07/amani-residence-balcony-view-758x564.jpeg'],
    contact_phone: '+254721939689', contact_whatsapp: '+254721939689',
    verification_status: 'verified', is_available: true, is_scraped: true,
    scraped_source: 'Afrimac', scraped_url: 'https://afrimacinternational.com/property/3-bedroom-apartment-for-sale-jalaram-road-westlands/'
  },
  {
    service_type: 'sale', lister_type: 'broker',
    title: '2BR Apartment — Pangani',
    description: 'Affordable 2-bedroom apartment in Pangani off Thika Road. 100 sqm with modern finishes and full amenities. $70K.',
    location: 'Pangani', address: 'Thika Road, Pangani, Nairobi',
    property_type: 'apartment', bedrooms: 2, bathrooms: 2, square_feet: 1076,
    sale_price: 9100000,
    features: ['100 sqm', 'Modern Fitted Kitchen'],
    amenities: ['Borehole', '24/7 security', 'High-speed lifts', 'Backup generator', 'Fully equipped gym', 'Kids playground', 'Solar panels', 'Intercom system', 'Ample parking'],
    images: ['https://afrimacinternational.com/wp-content/uploads/2026/06/apartment-for-sale-in-pangani-787-487x564.jpeg', 'https://afrimacinternational.com/wp-content/uploads/2026/06/apartment-for-sale-in-pangani-78756-487x564.jpeg', 'https://afrimacinternational.com/wp-content/uploads/2026/06/apartment-for-sale-in-pangani-785-483x564.jpeg'],
    contact_phone: '+254721939689', contact_whatsapp: '+254721939689',
    verification_status: 'verified', is_available: true, is_scraped: true,
    scraped_source: 'Afrimac', scraped_url: 'https://afrimacinternational.com/property/affordable-2-bedroom-apartment-for-sale-in-pangani/'
  },
  {
    service_type: 'sale', lister_type: 'broker',
    title: '4BR Penthouse — General Mathenge, Westlands',
    description: 'Luxury 4-bedroom penthouse on General Mathenge Road. 316 sqm with covered infinity pool, riverside garden, and spa.',
    location: 'Westlands', address: 'General Mathenge Road, Westlands, Nairobi',
    property_type: 'apartment', bedrooms: 4, bathrooms: 5, square_feet: 3400,
    sale_price: 55000000,
    features: ['316 sqm', 'DSQ', 'Penthouse', '3 Parking Spaces'],
    amenities: ['Covered infinity pool', 'Fully equipped gym', 'Riverside garden', 'BBQ area', 'Sauna', 'Backup generator', 'Borehole', 'Video intercom', 'Basement parking'],
    images: ['https://afrimacinternational.com/wp-content/uploads/2026/06/WhatsApp-Image-2025-01-16-at-22.06.08-2-758x564.jpeg', 'https://afrimacinternational.com/wp-content/uploads/2026/06/WhatsApp-Image-2025-01-16-at-22.06.08-3-758x564.jpeg', 'https://afrimacinternational.com/wp-content/uploads/2026/06/WhatsApp-Image-2025-01-16-at-22.06.08-758x564.jpeg', 'https://afrimacinternational.com/wp-content/uploads/2026/06/WhatsApp-Image-2025-01-16-at-22.06.09-1-758x564.jpeg', 'https://afrimacinternational.com/wp-content/uploads/2026/06/WhatsApp-Image-2025-01-16-at-22.06.09-2-758x564.jpeg', 'https://afrimacinternational.com/wp-content/uploads/2026/06/WhatsApp-Image-2025-01-16-at-22.06.10-2-758x564.jpeg'],
    contact_phone: '+254721939689', contact_whatsapp: '+254721939689',
    verification_status: 'verified', is_available: true, is_scraped: true,
    scraped_source: 'Afrimac', scraped_url: 'https://afrimacinternational.com/property/4-bedroom-penthouse-for-sale-general-mathenge-westlands/'
  },
  {
    service_type: 'sale', lister_type: 'broker',
    title: '5BR Duplex + DSQ — 3rd Parklands (320 sqm)',
    description: 'Exclusive 5-bedroom duplex with DSQ in 3rd Parklands. 320 sqm with swimming pool and rooftop facilities. From $220K.',
    location: 'Parklands', address: '3rd Parklands, Nairobi',
    property_type: 'apartment', bedrooms: 5, bathrooms: 5, square_feet: 3445,
    sale_price: 28600000,
    features: ['320 sqm', 'DSQ', 'Duplex', 'Under Construction'],
    amenities: ['Swimming pool', 'Fully equipped gym', 'Kids play area', 'Backup generator', 'Borehole', 'Solar water heating', '24hr security', 'Ample parking', 'Restaurant', 'Retail facilities'],
    images: ['https://afrimacinternational.com/wp-content/uploads/2026/06/New-Picture-25.png', 'https://afrimacinternational.com/wp-content/uploads/2026/06/bedroom-1st-parklands.jpeg', 'https://afrimacinternational.com/wp-content/uploads/2026/06/New-Picture-3.png', 'https://afrimacinternational.com/wp-content/uploads/2026/06/New-Picture-1.png'],
    contact_phone: '+254721939689', contact_whatsapp: '+254721939689',
    verification_status: 'verified', is_available: true, is_scraped: true,
    scraped_source: 'Afrimac', scraped_url: 'https://afrimacinternational.com/property/exclusive-5-bedroom-duplex-dsq-for-sale-in-parklands-320-sqm/'
  },
  {
    service_type: 'sale', lister_type: 'broker',
    title: '3BR Apartment — Kilimani',
    description: 'Spacious 3-bedroom apartment in Kilimani. 140 sqm with heated pool, jogging track, and landscaped gardens. From $115K.',
    location: 'Kilimani', address: 'Kilimani, Nairobi',
    property_type: 'apartment', bedrooms: 3, bathrooms: 2, square_feet: 1507,
    sale_price: 14950000,
    features: ['140 sqm', 'Modern Finishes'],
    amenities: ['Heated pool', 'Gym', 'Jogging track', 'BBQ area', 'Kids play area', 'Landscaped gardens', 'Backup generator', 'Borehole'],
    images: ['https://afrimacinternational.com/wp-content/uploads/2026/06/kilimani-full-view.jpeg', 'https://afrimacinternational.com/wp-content/uploads/2026/06/kilimani-living-room.jpeg', 'https://afrimacinternational.com/wp-content/uploads/2026/06/kilimani-shower.jpeg', 'https://afrimacinternational.com/wp-content/uploads/2026/06/kilimani-bedroom-1.jpeg', 'https://afrimacinternational.com/wp-content/uploads/2026/06/bedroom-kilimani-apartment-1.jpeg'],
    contact_phone: '+254721939689', contact_whatsapp: '+254721939689',
    verification_status: 'verified', is_available: true, is_scraped: true,
    scraped_source: 'Afrimac', scraped_url: 'https://afrimacinternational.com/property/for-sale-three-bedroom-apartment-in-kilimani/'
  },
  {
    service_type: 'sale', lister_type: 'broker',
    title: '2BR + DSQ Apartment — Parklands',
    description: 'Modern 2-bedroom with DSQ in Parklands. 108 sqm with rooftop terrace, prayer room, and spa. $77K.',
    location: 'Parklands', address: 'Parklands, Nairobi',
    property_type: 'apartment', bedrooms: 2, bathrooms: 2, square_feet: 1163,
    sale_price: 10010000,
    features: ['108 sqm', 'DSQ', 'Master Ensuite with Balcony'],
    amenities: ['Rooftop terrace', 'Fully equipped gym', 'Spa & sauna', 'Kids play area', 'High-speed lifts', 'Backup generator', 'Borehole', 'CCTV', 'BBQ area', 'Prayer room', 'Ample parking'],
    images: ['https://afrimacinternational.com/wp-content/uploads/2026/06/bedrooom-1st-parklands.jpeg', 'https://afrimacinternational.com/wp-content/uploads/2026/06/1st-Parklands-bed.jpeg', 'https://afrimacinternational.com/wp-content/uploads/2026/06/living-1st-parklands.jpeg', 'https://afrimacinternational.com/wp-content/uploads/2026/06/dining-1st-Parklands.jpeg', 'https://afrimacinternational.com/wp-content/uploads/2026/06/kids-play-area-1st-parklands.jpeg', 'https://afrimacinternational.com/wp-content/uploads/2026/06/gym-1st-parklands.jpeg', 'https://afrimacinternational.com/wp-content/uploads/2026/06/rooftop-1st-parklands.jpeg'],
    contact_phone: '+254721939689', contact_whatsapp: '+254721939689',
    verification_status: 'verified', is_available: true, is_scraped: true,
    scraped_source: 'Afrimac', scraped_url: 'https://afrimacinternational.com/property/2-bedroom-dsq-apartment-for-sale-parklands-nairobi/'
  },
  {
    service_type: 'sale', lister_type: 'broker',
    title: '5BR Duplex — Parklands (245 sqm)',
    description: 'Elegant 5-bedroom duplex in Parklands. 245 sqm near Westlands and Expressway. From KES 25M.',
    location: 'Parklands', address: 'Parklands, Nairobi',
    property_type: 'apartment', bedrooms: 5, bathrooms: 4, square_feet: 2637,
    sale_price: 25000000,
    features: ['245 sqm', 'DSQ', 'Duplex'],
    amenities: ['Swimming pool', 'Gym', 'Kids play area', '2 high-speed lifts', 'Ample parking', 'CCTV & intercom', 'Backup generator', 'Borehole'],
    images: ['https://afrimacinternational.com/wp-content/uploads/2026/06/Untitled-design-20.png', 'https://afrimacinternational.com/wp-content/uploads/2026/06/Untitled-design-19.png', 'https://afrimacinternational.com/wp-content/uploads/2026/06/Untitled-design-16.png', 'https://afrimacinternational.com/wp-content/uploads/2026/06/Untitled-design-9.png', 'https://afrimacinternational.com/wp-content/uploads/2026/06/Untitled-design-5.png'],
    contact_phone: '+254721939689', contact_whatsapp: '+254721939689',
    verification_status: 'verified', is_available: true, is_scraped: true,
    scraped_source: 'Afrimac', scraped_url: 'https://afrimacinternational.com/property/elegant-5-bedroom-duplex-for-sale-in-parklands/'
  },
];

async function main() {
  console.log(`Inserting ${newListings.length} new listings...\n`);

  const { data, error } = await supabase
    .from('listings')
    .insert(newListings)
    .select('id, title');

  if (error) {
    console.error('INSERT ERROR:', error.message);
    process.exit(1);
  }

  console.log(`Successfully inserted ${data.length} listings:`);
  data.forEach(l => console.log(`  - ${l.title}`));

  // Now scrape images for Wafi listings that have empty images
  console.log('\nNow scraping images for Wafi listings...');
}

main().catch(console.error);
