'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

const inputStyle = { border: '2px solid #e8e8e4', background: 'white', color: '#1A1A1A' };
const focusBorder = '#059669';
const defaultBorder = '#e8e8e4';

const ROLE_OPTIONS = [
  { value: 'tenant', label: 'Tenant / Buyer — Looking for property' },
  { value: 'property_manager', label: 'Landlord — List your properties' },
  { value: 'broker', label: 'Broker — List on behalf of owners' },
  { value: 'furnished_operator', label: 'Furnished Operator — Airbnb-style listings' },
  { value: 'secretary', label: 'Secretary — Lead & commission tracking' },
];

// Generate a random temporary password for the initial signUp call
function tempPassword() {
  const arr = new Uint8Array(12);
  crypto.getRandomValues(arr);
  return 'Tmp!' + Array.from(arr, (b) => b.toString(36)).join('');
}

// ── OTP Code Input ────────────────────────────────────────────────────────
function OtpInput({ length = 6, value, onChange }) {
  const inputRefs = useRef([]);

  function handleChange(idx, char) {
    if (char && !/^\d$/.test(char)) return;
    const arr = value.split('');
    arr[idx] = char;
    const next = arr.join('').slice(0, length);
    onChange(next);
    if (char && idx < length - 1) {
      inputRefs.current[idx + 1]?.focus();
    }
  }

  function handleKeyDown(idx, e) {
    if (e.key === 'Backspace' && !value[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  }

  function handlePaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pasted) {
      onChange(pasted);
      const focusIdx = Math.min(pasted.length, length - 1);
      inputRefs.current[focusIdx]?.focus();
    }
  }

  return (
    <div className="flex gap-1.5 sm:gap-2">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={value[i] ?? ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          className="w-9 h-10 sm:w-10 sm:h-11 text-center text-lg font-bold rounded-lg focus:outline-none transition-all"
          style={{
            border: `2px solid ${value[i] ? focusBorder : defaultBorder}`,
            background: 'white',
            color: '#1A1A1A',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = focusBorder; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(5,150,105,0.1)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = value[i] ? focusBorder : defaultBorder; e.currentTarget.style.boxShadow = 'none'; }}
        />
      ))}
    </div>
  );
}

// ── Main Signup Form ─────────────────────────────────────────────────────
const RegisterPageClient = () => {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState('tenant');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Email verification state
  const [emailSending, setEmailSending] = useState(false);
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // ── Send verification code ──────────────────────────────────────────────
  async function handleGetCode() {
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    if (!fullName.trim()) {
      setError('Please enter your name first.');
      return;
    }

    setEmailSending(true);
    setError(null);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password: tempPassword(),
      options: {
        data: {
          full_name: fullName,
          user_type: userType,
          phone: phone || undefined,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setEmailSending(false);
      return;
    }

    if (data.user && data.user.confirmed_at) {
      setEmailVerified(true);
    } else {
      setEmailCodeSent(true);
      setResendCooldown(60);
    }
    setEmailSending(false);
  }

  // ── Verify OTP code ─────────────────────────────────────────────────────
  async function handleVerifyOtp() {
    if (otpCode.length !== 6) {
      setError('Please enter the full 6-digit code.');
      return;
    }

    setVerifying(true);
    setError(null);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otpCode,
      type: 'signup',
    });

    if (verifyError) {
      setError(verifyError.message);
      setVerifying(false);
      return;
    }

    setEmailVerified(true);
    setEmailCodeSent(false);
    setVerifying(false);
  }

  // Auto-verify when 6 digits entered
  useEffect(() => {
    if (otpCode.length === 6 && emailCodeSent && !verifying) {
      handleVerifyOtp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otpCode]);

  // ── Resend code ─────────────────────────────────────────────────────────
  async function handleResend() {
    if (resendCooldown > 0) return;
    setError(null);

    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email,
    });

    if (resendError) {
      setError(resendError.message);
    } else {
      setResendCooldown(60);
      setOtpCode('');
    }
  }

  // ── Submit form (after email verified) ──────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();

    if (!emailVerified) {
      setError('Please verify your email first.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);

    // Update password and metadata on the already-verified account
    const { error: updateError } = await supabase.auth.updateUser({
      password,
      data: {
        full_name: fullName,
        user_type: userType,
        phone: phone || undefined,
      },
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    // Update the users profile table
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('users')
        .update({
          full_name: fullName,
          phone: phone || null,
          user_type: userType,
        })
        .eq('id', user.id);
    }

    // Role-based redirect
    const routes = {
      property_manager: '/dashboard/manager',
      broker: '/dashboard/broker',
      furnished_operator: '/dashboard/operator',
      secretary: '/dashboard/secretary',
      admin: '/dashboard/admin',
    };
    router.push(routes[userType] || '/dashboard/tenant');
    router.refresh();
  }

  const bgStyle = {
    background: '#062e21',
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23059669' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12" style={bgStyle}>
      <div
        className="w-full max-w-[480px] rounded-[24px] p-6 sm:p-10 relative"
        style={{ background: '#fafaf8', boxShadow: '0 12px 48px rgba(0,0,0,0.45)', animation: 'fadeUp 0.4s ease both' }}
      >
        {/* Close button */}
        <Link
          href="/"
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full transition-colors hover:bg-black/5"
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M12 4L4 12M4 4l8 8" stroke="#6B6B6B" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </Link>

        {/* Brand */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-block mx-auto mb-3">
            <span className="text-2xl sm:text-3xl font-bold" style={{ color: '#059669' }}>Hornza</span>
          </Link>
          <p className="text-xs tracking-[3px] uppercase text-[#9CA3AF]">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Role selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[1px] mb-1.5" style={{ color: '#059669' }}>I am a</label>
            <select
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
              className="w-full px-3.5 py-3 rounded-xl text-sm sm:text-[15px] focus:outline-none transition-colors appearance-none"
              style={{ ...inputStyle, color: '#1A1A1A' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = focusBorder; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = defaultBorder; }}
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[1px] mb-1.5" style={{ color: '#059669' }}>Full Name</label>
            <input
              type="text"
              required
              autoFocus
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full px-3.5 py-3 rounded-xl text-sm sm:text-[15px] focus:outline-none transition-colors"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = focusBorder; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = defaultBorder; }}
            />
          </div>

          {/* Email + Get Code */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[1px] mb-1.5" style={{ color: '#059669' }}>Email</label>
            <div className="flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (emailVerified) { setEmailVerified(false); setEmailCodeSent(false); setOtpCode(''); } }}
                placeholder="Enter your email address"
                disabled={emailCodeSent || emailVerified}
                className="flex-1 min-w-0 px-3.5 py-3 rounded-xl text-sm sm:text-[15px] focus:outline-none transition-colors"
                style={{
                  ...inputStyle,
                  ...(emailVerified ? { borderColor: '#22C55E', background: '#F0FDF4' } : {}),
                  ...(emailCodeSent || emailVerified ? { opacity: 0.7 } : {}),
                }}
                onFocus={(e) => { if (!emailVerified) e.currentTarget.style.borderColor = focusBorder; }}
                onBlur={(e) => { if (!emailVerified) e.currentTarget.style.borderColor = defaultBorder; }}
              />
              {emailVerified ? (
                <div className="flex items-center gap-1.5 px-3 rounded-xl text-xs font-semibold text-[#22C55E] shrink-0" style={{ background: '#F0FDF4', border: '2px solid #22C55E' }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 4" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  Verified
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleGetCode}
                  disabled={emailSending || emailCodeSent}
                  className="px-4 py-3 rounded-xl text-xs sm:text-sm font-bold shrink-0 transition-all"
                  style={{
                    background: emailSending || emailCodeSent ? 'rgba(5,150,105,0.4)' : '#059669',
                    color: '#fff',
                    cursor: emailSending || emailCodeSent ? 'not-allowed' : 'pointer',
                  }}
                >
                  {emailSending ? 'Sending\u2026' : emailCodeSent ? 'Sent' : 'Get Code'}
                </button>
              )}
            </div>

            {/* Inline OTP verification */}
            {emailCodeSent && !emailVerified && (
              <div className="mt-3 p-3.5 rounded-xl" style={{ background: 'rgba(5,150,105,0.04)', border: '1px solid rgba(5,150,105,0.12)' }}>
                <p className="text-xs text-[#6B6B6B] mb-2.5">
                  Enter the 6-digit code sent to <span className="font-semibold text-[#1A1A1A]">{email}</span>
                </p>
                <OtpInput value={otpCode} onChange={setOtpCode} />
                <div className="flex items-center justify-between mt-2.5">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCooldown > 0}
                    className="text-xs font-semibold transition-colors"
                    style={{ color: resendCooldown > 0 ? '#9CA3AF' : '#059669', cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer' }}
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                  </button>
                  {verifying && <span className="text-xs text-[#6B6B6B]">Verifying\u2026</span>}
                </div>
              </div>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[1px] mb-1.5" style={{ color: '#059669' }}>Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0712345678"
              className="w-full px-3.5 py-3 rounded-xl text-sm sm:text-[15px] focus:outline-none transition-colors"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = focusBorder; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = defaultBorder; }}
            />
          </div>

          {/* Password row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[1px] mb-1.5" style={{ color: '#059669' }}>Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="w-full px-3.5 py-3 rounded-xl text-sm sm:text-[15px] focus:outline-none transition-colors"
                style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = focusBorder; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = defaultBorder; }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[1px] mb-1.5" style={{ color: '#059669' }}>Confirm</label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full px-3.5 py-3 rounded-xl text-sm sm:text-[15px] focus:outline-none transition-colors"
                style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = focusBorder; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = defaultBorder; }}
              />
            </div>
          </div>

          {error && (
            <div className="px-3.5 py-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.08)', color: '#DC2626', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !emailVerified}
            className="w-full py-3.5 sm:py-4 rounded-xl text-[15px] sm:text-base font-bold mt-1 transition-all"
            style={{
              background: loading || !emailVerified ? 'rgba(5,150,105,0.35)' : '#059669',
              color: '#fff',
              cursor: loading || !emailVerified ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => { if (!loading && emailVerified) e.currentTarget.style.background = '#047857'; }}
            onMouseLeave={(e) => { if (!loading && emailVerified) e.currentTarget.style.background = '#059669'; }}
          >
            {loading ? 'Creating account\u2026' : !emailVerified ? 'Verify email to continue' : 'Create Account \u2192'}
          </button>
        </form>

        <p className="text-center text-xs sm:text-sm mt-5 text-[#6B6B6B]">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-semibold hover:underline underline-offset-4"
            style={{ color: '#059669' }}
          >
            Sign in
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

export default RegisterPageClient;
