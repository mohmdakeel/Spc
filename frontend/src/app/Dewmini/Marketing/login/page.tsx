'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

type AuthResponse = {
  token: string;
};

const API_LOGIN = 'http://localhost:8080/api/users/login';

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!username.trim() || !password) {
      setErrorMsg('Please enter both username and password.');
      return;
    }

    // ✅ Hardcoded admin shortcut
    if (username === 'admin' && password === 'admin123') {
      const fakeToken = 'hardcoded-dev-token';
      localStorage.setItem('spc_auth_token', fakeToken);
      router.push('/Dewmini/Marketing/Dashboard');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(API_LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        let message = 'Invalid username or password.';
        try {
          const data = await res.json();
          if (data?.message) message = data.message;
      } catch {}
        throw new Error(message);
      }

      const data = (await res.json()) as AuthResponse;
      if (!data?.token) throw new Error('Login response did not include a token.');

      localStorage.setItem('spc_auth_token', data.token);
      router.push('/Dewmini/Marketing/Dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-white grid grid-cols-1 md:grid-cols-2">
      {/* LEFT — Brand panel */}
      <div className="relative p-8 md:p-10 flex flex-col items-center justify-center bg-[#fff7f2]">
        <div className="w-56 h-56 relative">
          <Image src="/spclogopic.png" alt="SPC" fill className="object-contain" priority />
        </div>
        <div className="mt-6 text-center">
          <p className="text-gray-700">All Printing Solutions !</p>
          <p className="text-gray-600 text-sm">Sri Lanka&apos;s Largest Printing Company</p>
        </div>
        <div className="hidden md:block absolute top-6 right-0 h-[calc(100%-3rem)] w-[2px] bg-orange-100 rounded-full" />
      </div>

      {/* RIGHT — Form panel */}
      <div className="p-6 md:p-10 flex flex-col justify-center">
        <div className="mt-20">
          <h2 className="text-3xl font-semibold text-gray-900 mb-8 text-center">Sign In</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block mb-1 text-sm text-gray-900 font-semibold">Username</label>
              <input
                type="text"
                placeholder="Enter Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-md border border-orange-300
                           focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/30
                           px-4 py-2.5 outline-none
                           placeholder-gray-600 text-gray-900 font-medium"
                autoComplete="username"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block mb-1 text-sm text-gray-900 font-semibold">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Enter Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-orange-300
                             focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/30
                             px-4 py-2.5 pr-12 outline-none
                             placeholder-gray-600 text-gray-900 font-medium"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="absolute inset-y-0 right-0 px-3 text-gray-600 hover:text-gray-800"
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                >
                  {showPwd ? (
                    // eye-off
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 3l18 18" />
                      <path d="M10.58 10.58a2 2 0 102.83 2.83" />
                      <path d="M16.13 16.13A10.94 10.94 0 0112 18c-5 0-9.27-3.11-10.5-7.5a11.33 11.33 0 012.81-4.62" />
                      <path d="M9.88 4.24A10.88 10.88 0 0112 4.5c5 0 9.27 3.11 10.5 7.5a11.38 11.38 0 01-2.05 3.36" />
                    </svg>
                  ) : (
                    // eye
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {errorMsg && (
              <div className="rounded-md border border-red-300 bg-red-50 text-red-800 px-3 py-2 text-sm">
                {errorMsg}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF6B35] hover:bg-[#ff743f] disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-md shadow-sm transition"
            >
              {loading ? 'Signing in…' : 'SIGN IN'}
            </button>
          </form>
          
        </div>
      </div>
    </div>
  );
}
