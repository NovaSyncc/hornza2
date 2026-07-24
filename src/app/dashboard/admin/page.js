import AdminDashboardClient from './AdminDashboardClient';

export const metadata = {
  title: 'Admin Dashboard',
  robots: { index: false },
};

export default function AdminDashboardPage() {
  return <AdminDashboardClient />;
}
