import SecretaryDashboardClient from './SecretaryDashboardClient';

export const metadata = {
  title: 'Secretary Dashboard | Hornza',
  description: 'Track leads, manage pipeline, and generate property resources.',
  robots: { index: false },
};

export default function SecretaryDashboardPage() {
  return <SecretaryDashboardClient />;
}
