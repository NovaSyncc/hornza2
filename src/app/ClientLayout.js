'use client';

import { AuthProvider } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

export default function ClientLayout({ children }) {
  return (
    <AuthProvider>
      <Navigation />
      <main className="flex-grow">{children}</main>
      <Footer />
    </AuthProvider>
  );
}
