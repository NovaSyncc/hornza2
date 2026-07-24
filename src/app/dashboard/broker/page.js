import BrokerDashboardClient from './BrokerDashboardClient';

export const metadata = {
  title: 'Broker Dashboard | Hornza',
  description: 'Manage your property listings across rentals, furnished stays, and properties for sale.',
  robots: { index: false },
};

export default function BrokerDashboardPage() {
  return <BrokerDashboardClient />;
}
