import { Suspense } from 'react';
import PropertiesPageClient from './PropertiesPageClient';

export const metadata = {
  title: 'Browse Verified Properties | Rent, Buy & Furnished Stays',
  description: 'Search video-verified apartments, houses, and furnished stays across East Africa. Filter by location, price, bedrooms, and property type. All listings verified — no broker fees.',
};

export default function PropertiesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <PropertiesPageClient />
    </Suspense>
  );
}
