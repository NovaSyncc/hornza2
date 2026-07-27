'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

const LoginPageClient = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError('Incorrect email or password.');
      setLoading(false);
      return;
    }

    const userId = data.user?.id;
    let destination = '/dashboard/tenant';

    if (userId) {
      const { data: profile } = await supabase
        .from('users')
        .select('user_type')
        .eq('id', userId)
        .single();

      const routes = {
        admin: '/dashboard/admin',
        property_manager: '/dashboard/manager',
        broker: '/dashboard/broker',
        furnished_operator: '/dashboard/operator',
        secretary: '/dashboard/secretary',
      };
      destination = routes[profile?.user_type] || '/dashboard/tenant';
    }

    router.push(destination);
    router.refresh();
  }

  const bgStyle = {
    background: '#062e21',
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23059669' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
  };

  const inputStyle = { border: '2px solid #e8e8e4', background: 'white', color: '#1A1A1A' };
  const focusBorder = '#059669';
  const defaultBorder = '#e8e8e4';

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 sm:px-6"
      style={bgStyle}
    >
      <div
        className="w-full max-w-[480px] rounded-[24px] p-8 sm:p-12 relative"
        style={{
          background: '#fafaf8',
          boxShadow: '0 12px 48px rgba(0,0,0,0.45)',
          animation: 'fadeUp 0.4s ease both',
        }}
      >
        {/* Close button */}
        <Link
          href="/"
          className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center rounded-full transition-colors hover:bg-black/5"
          aria-label="Close"
        >
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
            <path d="M12 4L4 12M4 4l8 8" stroke="#6B6B6B" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </Link>

        {/* Brand */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-block mx-auto mb-5">
            <span className="text-2xl sm:text-3xl font-bold" style={{ color: '#059669' }}>Hornza</span>
          </Link>
          <p className="text-xs sm:text-[13px] tracking-[3px] uppercase text-[#9CA3AF]">
            Welcome back
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[13px] sm:text-sm font-semibold uppercase tracking-[1px] mb-2" style={{ color: '#059669' }}>
              Email
            </label>
            <input
              type="email"
              required
              autoFocus
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="w-full px-4 py-3.5 sm:py-4 rounded-xl text-[15px] sm:text-base focus:outline-none transition-colors"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = focusBorder; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = defaultBorder; }}
            />
          </div>

          <div>
            <label className="block text-[13px] sm:text-sm font-semibold uppercase tracking-[1px] mb-2" style={{ color: '#059669' }}>
              Password
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-3.5 sm:py-4 rounded-xl text-[15px] sm:text-base focus:outline-none transition-colors"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = focusBorder; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = defaultBorder; }}
            />
          </div>

          {error && (
            <div className="px-4 py-3.5 rounded-xl text-[15px]" style={{ background: 'rgba(239,68,68,0.08)', color: '#DC2626', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 sm:py-[18px] rounded-xl text-[16px] sm:text-[17px] font-bold mt-3 transition-all"
            style={{
              background: loading ? 'rgba(5,150,105,0.5)' : '#059669',
              color: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#047857'; }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = '#059669'; }}
          >
            {loading ? 'Signing in\u2026' : 'Sign In \u2192'}
          </button>
        </form>

        <p className="text-center text-[13px] sm:text-sm mt-7 text-[#6B6B6B]">
          No account?{' '}
          <Link
            href="/register"
            className="font-semibold hover:underline underline-offset-4"
            style={{ color: '#059669' }}
          >
            Create one
          </Link>
        </p>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
};

export default LoginPageClient;
