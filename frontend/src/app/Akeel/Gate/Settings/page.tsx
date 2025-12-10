'use client';

import { useEffect, useState } from 'react';
import { Bell, ShieldCheck, Save, Sun, Moon } from 'lucide-react';

const STORAGE_KEY = 'gate_settings_pref';

type Prefs = {
  notifyEmail: boolean;
  notifySms: boolean;
  autoEscalate: boolean;
  twoFactor: boolean;
  updatedAt?: string | null;
  theme: 'light' | 'dark';
};

const defaults: Prefs = {
  notifyEmail: true,
  notifySms: false,
  autoEscalate: true,
  twoFactor: false,
  updatedAt: null,
  theme: 'light',
};

export default function GateSettingsPage() {
  const [notifyEmail, setNotifyEmail] = useState(defaults.notifyEmail);
  const [notifySms, setNotifySms] = useState(defaults.notifySms);
  const [autoEscalate, setAutoEscalate] = useState(defaults.autoEscalate);
  const [twoFactor, setTwoFactor] = useState(defaults.twoFactor);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const savedTheme = (localStorage.getItem('workspace-theme') as 'light' | 'dark') || undefined;
      if (stored) {
        const data = JSON.parse(stored) as Prefs;
        setNotifyEmail(!!data.notifyEmail);
        setNotifySms(!!data.notifySms);
        setAutoEscalate(!!data.autoEscalate);
        setTwoFactor(!!data.twoFactor);
        setTheme(savedTheme || data.theme || 'light');
        setUpdatedAt(data.updatedAt ? new Date(data.updatedAt).toLocaleString() : null);
        applyTheme(savedTheme || data.theme || 'light');
      } else {
        const fallback = savedTheme || 'light';
        setTheme(fallback);
        applyTheme(fallback);
      }
    } catch {
      setError('Failed to load saved preferences.');
    } finally {
      setLoading(false);
    }
  }, []);

  const applyTheme = (mode: 'light' | 'dark') => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    // remove other workspace themes (hod-dark)
    root.classList.remove('hod-dark');
    if (mode === 'dark') {
      root.classList.add('gate-dark');
    } else {
      root.classList.remove('gate-dark');
    }
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('workspace-theme', next);
    applyTheme(next);
  };

  const handleSave = () => {
    setSaving(true);
    setStatus(null);
    setError(null);
    try {
      const payload: Prefs = {
        notifyEmail,
        notifySms,
        autoEscalate,
        twoFactor,
        theme,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      setUpdatedAt(new Date(payload.updatedAt).toLocaleString());
      setStatus('Preferences saved to this device.');
    } catch {
      setError('Failed to store preferences locally.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <header>
        <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Preferences</p>
        <h1 className="text-2xl font-bold text-orange-900">Gate Settings</h1>
        <p className="text-sm text-gray-600">
          Control how you receive gate notifications and manage appearance for the Gate workspace.
        </p>
      </header>

      {loading ? (
        <div className="bg-white rounded-2xl border border-orange-200 shadow-sm p-6 text-sm text-gray-500">
          Loading preferences...
        </div>
      ) : (
        <>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}
          {status && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg text-sm">
              {status}
            </div>
          )}
          {updatedAt && (
            <p className="text-xs text-gray-500">
              Last updated: <span className="font-medium text-orange-800">{updatedAt}</span>
            </p>
          )}
        </>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="bg-white rounded-2xl border border-orange-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="text-orange-500" size={18} />
            <h2 className="text-lg font-semibold text-orange-900">Notifications</h2>
          </div>

          <div className="space-y-4 text-sm text-gray-700">
            <label className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-gray-900">Email alerts</p>
                <p className="text-xs text-gray-500">Daily summary of gate activity</p>
              </div>
              <Toggle checked={notifyEmail} onChange={setNotifyEmail} disabled={saving || loading} />
            </label>
            <label className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-gray-900">SMS for urgent incidents</p>
                <p className="text-xs text-gray-500">Only when flagged as high priority</p>
              </div>
              <Toggle checked={notifySms} onChange={setNotifySms} disabled={saving || loading} />
            </label>
            <label className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-gray-900">Auto escalate if idle</p>
                <p className="text-xs text-gray-500">Escalate to supervisor if pending more than 24h</p>
              </div>
              <Toggle checked={autoEscalate} onChange={setAutoEscalate} disabled={saving || loading} />
            </label>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-orange-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-orange-500" size={18} />
            <h2 className="text-lg font-semibold text-orange-900">Security</h2>
          </div>
          <div className="space-y-4 text-sm text-gray-700">
            <label className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-gray-900">Two-factor approvals</p>
                <p className="text-xs text-gray-500">Require OTP before confirming exits</p>
              </div>
              <Toggle checked={twoFactor} onChange={setTwoFactor} disabled={saving || loading} />
            </label>
            <button
              type="button"
              className="w-full border border-orange-300 text-orange-700 rounded-lg py-2 text-sm font-medium hover:bg-orange-50 transition"
            >
              Update security PIN
            </button>
          </div>
        </section>
      </div>

      <section className="bg-white rounded-2xl border border-orange-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2">
          {theme === 'dark' ? <Moon className="text-orange-500" size={18} /> : <Sun className="text-orange-500" size={18} />}
          <h2 className="text-lg font-semibold text-orange-900">Appearance</h2>
        </div>
        <p className="text-sm text-gray-600">Toggle the Gate workspace between light and dark. Stored on this device.</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => { setTheme('light'); localStorage.setItem('workspace-theme', 'light'); applyTheme('light'); }}
            className={`flex-1 rounded-lg border px-4 py-2 text-sm font-semibold transition ${theme === 'light' ? 'bg-orange-600 text-white border-orange-600 shadow' : 'border-orange-200 text-orange-800 hover:bg-orange-50'}`}
          >
            Light
          </button>
          <button
            type="button"
            onClick={() => { setTheme('dark'); localStorage.setItem('workspace-theme', 'dark'); applyTheme('dark'); }}
            className={`flex-1 rounded-lg border px-4 py-2 text-sm font-semibold transition ${theme === 'dark' ? 'bg-orange-600 text-white border-orange-600 shadow' : 'border-orange-200 text-orange-800 hover:bg-orange-50'}`}
          >
            Dark
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-lg border border-orange-200 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50"
          >
            Toggle
          </button>
        </div>
      </section>

      <div className="pt-2 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || loading}
          className="inline-flex items-center gap-2 bg-orange-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-orange-700 disabled:bg-orange-400"
        >
          <Save size={16} />
          {saving ? 'Saving…' : 'Save preferences'}
        </button>
      </div>
    </div>
  );
}

function Toggle({ checked, onChange, disabled = false }: { checked: boolean; onChange: (value: boolean) => void; disabled?: boolean; }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={[
        'w-12 h-6 rounded-full border transition-all duration-200 flex items-center',
        disabled ? 'opacity-50 cursor-not-allowed' : '',
        checked ? 'bg-orange-500 border-orange-500' : 'bg-gray-200 border-gray-300',
      ].join(' ')}
    >
      <span
        className={[
          'inline-block w-5 h-5 rounded-full bg-white shadow transform transition-all duration-200',
          checked ? 'translate-x-6' : 'translate-x-1',
        ].join(' ')}
      />
    </button>
  );
}
