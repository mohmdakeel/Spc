// app/login/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { login, me, prewarmAuthCaches } from '../../../lib/auth';
import { pickHomeFor } from '../../../lib/authz';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Car, Shield, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setP] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useSearchParams();

  // Preload likely landing pages so navigation feels instant
  useEffect(() => {
    router.prefetch('/dashboard');
    router.prefetch('/maindashboard');
  }, [router]);

  const hardNavigate = (dest: string) => {
    if (typeof window !== 'undefined') {
      window.location.href = dest;
    } else {
      router.push(dest);
    }
  };

  const redirectAfterLogin = async (next: string | null) => {
    // If caller explicitly asked for a path, honor it immediately.
    if (next) {
      hardNavigate(next);
      return;
    }

    // Otherwise pick the right home based on the user profile.
    try {
      const profile = await me();
      const preferred = profile ? pickHomeFor(profile) : null;
      const target = preferred && preferred !== '/login' ? preferred : '/dashboard';

      hardNavigate(target);
    } catch {
      hardNavigate('/dashboard');
    }
  };

  // If already authenticated (cookie present), skip the form and go where you should
  useEffect(() => {
    (async () => {
      try {
        const profile = await me();
        if (profile) {
          // prime caches in background to keep navigation snappy
          prewarmAuthCaches().catch(() => {});
          redirectAfterLogin(params.get('next'));
        }
      } catch {
        // ignore and let user log in
      }
    })();
  }, [params]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    
    try {
      await login({ username: identifier, password });
      // kick off background prefetch for fast first navigation
      prewarmAuthCaches().catch(() => {});
      redirectAfterLogin(params.get('next'));
    } catch (e: any) {
      setErr(e?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-100 p-6 overflow-hidden">
      <div
        className="absolute inset-0 opacity-10 bg-[url('/spclogopic.png')] bg-center bg-no-repeat bg-contain pointer-events-none"
        aria-hidden
      />
      <div className="w-full max-w-md relative">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white rounded-xl border border-orange-200 flex items-center justify-center shadow-lg overflow-hidden">
              <Image
                src="/spclogopic.png"
                alt="State Printing Corporation logo"
                width={48}
                height={48}
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">State Printing Corporation</h1>
          </div>
          <p className="text-orange-800/70 text-sm">ERP System Portal</p>
        </div>

        {/* Login Form */}
        <form onSubmit={onSubmit} className="bg-white p-8 rounded-2xl shadow-xl space-y-6 border border-orange-200">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-600 text-sm">Sign in to your account</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username or Email
              </label>
              <input
                id="username"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="Enter your username or email"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setP(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 disabled:bg-orange-400 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>

          {/* Service Information */}
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <h3 className="font-semibold text-orange-800 text-sm mb-2">Available Services:</h3>
            <div className="space-y-2 text-xs text-orange-700">
              <div className="flex items-center gap-2">
                <Shield className="w-3 h-3" />
                <span>Auth Service - User & Role Management</span>
              </div>
              <div className="flex items-center gap-2">
                <Car className="w-3 h-3" />
                <span>Transport Service - Vehicle Management</span>
              </div>
            </div>
          </div>

          {/* Help Text */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Contact administrator if you forgot your credentials
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} SPC ERP System. All rights reserved.
          </p>
        </div>
      </div>
    </main>
  );
}
