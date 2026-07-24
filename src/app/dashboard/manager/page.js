import ManagerDashboardClient from './ManagerDashboardClient';

export const metadata = {
  title: 'Manager Dashboard',
  robots: { index: false },
};

export default function ManagerDashboardPage() {
  return <ManagerDashboardClient />;
}
