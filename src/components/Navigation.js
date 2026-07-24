'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, userProfile, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Only use transparent nav on the homepage
  const isHomepage = pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // On non-homepage routes, always show the solid nav
  const useTransparent = isHomepage && !isScrolled;

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/');
      setIsOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getDashboardLink = () => {
    if (!userProfile) return '/login';
    switch (userProfile.user_type) {
      case 'admin':
        return '/dashboard/admin';
      case 'property_manager':
        return '/dashboard/manager';
      case 'broker':
        return '/dashboard/broker';
      case 'furnished_operator':
        return '/dashboard/operator';
      case 'tenant':
        return '/dashboard/tenant';
      case 'secretary':
        return '/dashboard/secretary';
      default:
        return '/';
    }
  };

  const navLinks = [
    { label: 'Rent', href: '/properties?type=rental' },
    { label: 'Buy', href: '/properties?type=sale' },
    { label: 'Furnished', href: '/properties?type=furnished' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        useTransparent
          ? 'bg-transparent border-b border-transparent'
          : 'bg-white border-b border-gray-200 shadow-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition-all duration-300 ${
              useTransparent
                ? 'bg-white text-emerald-700'
                : 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white'
            }`}>
              H
            </div>
            <span
              className={`text-xl font-bold tracking-tight transition-colors duration-300 ${
                useTransparent ? 'text-white' : 'text-gray-900'
              }`}
            >
              Hornza
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`text-sm px-3 py-2 rounded-md transition-colors duration-300 ${
                  useTransparent
                    ? 'text-white/80 hover:text-white'
                    : 'text-gray-700 hover:text-emerald-600'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link
                  href={getDashboardLink()}
                  className={`text-sm transition-colors duration-300 ${
                    useTransparent
                      ? 'text-white/80 hover:text-white'
                      : 'text-gray-700 hover:text-emerald-600'
                  }`}
                >
                  Dashboard
                </Link>
                <div className="relative group">
                  <button
                    className={`text-sm flex items-center gap-1.5 transition-colors duration-300 ${
                      useTransparent
                        ? 'text-white/80 hover:text-white'
                        : 'text-gray-700 hover:text-emerald-600'
                    }`}
                  >
                    <span className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-medium">
                      {userProfile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                    <span className="hidden lg:inline">
                      {userProfile?.full_name || 'Account'}
                    </span>
                    <svg
                      className="w-3.5 h-3.5 transition-transform group-hover:rotate-180"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-1">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {userProfile?.full_name}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {userProfile?.user_type?.replace('_', ' ')}
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:text-emerald-600 hover:bg-gray-50 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className={`text-sm font-medium transition-colors duration-300 ${
                    useTransparent
                      ? 'text-white/80 hover:text-white'
                      : 'text-gray-700 hover:text-emerald-600'
                  }`}
                >
                  Sign In
                </Link>
                <Link
                  href="/listing/new"
                  className={`text-sm font-medium px-4 py-2 rounded-lg transition-all duration-300 ${
                    useTransparent
                      ? 'border border-white text-white hover:bg-white/10'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  List Property
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`md:hidden p-2 rounded-md transition-colors duration-300 ${
              useTransparent
                ? 'text-white hover:text-white/80'
                : 'text-gray-700 hover:text-emerald-600'
            }`}
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="md:hidden bg-white border-t border-gray-100 shadow-lg"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="block text-sm text-gray-700 hover:text-emerald-600 hover:bg-gray-50 px-3 py-2.5 rounded-md transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

              <div className="border-t border-gray-100 my-2 pt-2">
                {user ? (
                  <>
                    <Link
                      href={getDashboardLink()}
                      className="block text-sm text-gray-700 hover:text-emerald-600 hover:bg-gray-50 px-3 py-2.5 rounded-md transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <div className="px-3 py-2 mt-1">
                      <p className="text-sm font-medium text-gray-900">
                        {userProfile?.full_name}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {userProfile?.user_type?.replace('_', ' ')}
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left text-sm text-gray-700 hover:text-emerald-600 hover:bg-gray-50 px-3 py-2.5 rounded-md transition-colors"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="block text-sm text-gray-700 hover:text-emerald-600 hover:bg-gray-50 px-3 py-2.5 rounded-md transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/listing/new"
                      className="block text-sm text-center font-medium bg-emerald-600 text-white hover:bg-emerald-700 px-4 py-2.5 rounded-lg mt-2 transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      List Property
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navigation;
