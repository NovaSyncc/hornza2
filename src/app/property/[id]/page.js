import PropertyDetailClient from './PropertyDetailClient';

export const metadata = {
  title: 'Property Details - Hornza Verified Rentals',
  description: 'View verified property details including video walkthrough, pricing, amenities, and direct contact with the property manager.',
};

export default async function PropertyDetailPage({ params }) {
  const { id } = await params;
  return <PropertyDetailClient id={id} />;
}
