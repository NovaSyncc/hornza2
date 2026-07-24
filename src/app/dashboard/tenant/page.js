import TenantDashboardClient from './TenantDashboardClient';

export const metadata = {
  title: 'Tenant Dashboard',
  robots: { index: false },
};

export default function TenantDashboardPage() {
  return <TenantDashboardClient />;
}
