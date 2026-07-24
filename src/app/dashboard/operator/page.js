import FurnishedOperatorDashboardClient from './FurnishedOperatorDashboardClient';

export const metadata = {
  title: 'Furnished Stays Dashboard | Hornza',
  description: 'Manage your furnished apartment listings and short-term stays.',
  robots: { index: false },
};

export default function FurnishedOperatorDashboardPage() {
  return <FurnishedOperatorDashboardClient />;
}
