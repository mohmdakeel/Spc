'use client';

import { useEffect, useState } from 'react';
import { Bell, ShieldCheck, Sun, Moon, Save } from 'lucide-react';

type Prefs = {
  notifyEmail: boolean;
  notifySms: boolean;
  gateAlerts: boolean;
  enforcePin: boolean;
  twoFactor: boolean;
  theme: 'light' | 'dark';
};

const STORAGE_KEY = 'incharge-settings';

const Toggle = ({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) => (
  <button
    type="button"
    onClick={() => !disabled && onChange(!checked)}
    className={`w-11 h-6 rounded-full border transition ${checked ? 'bg-orange-500 border-orange-500' : 'bg-gray-200 border-gray-300'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    aria-pressed={checked}
  >
    <span
      className={`block w-5 h-5 bg-white rounded-full shadow transform transition ${checked ? 'translate-x-5' : 'translate-x-0.5'}`}
    />
  </button>
);

export default function InchargeSettingsPage() {
  const [prefs, setPrefs] = useState<Prefs>({
    notifyEmail: true,
    notifySms: false,
    gateAlerts: true,
    enforcePin: false,
    twoFactor: false,
    theme: 'light',
  });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as Prefs;
        setPrefs((prev) => ({ ...prev, ...parsed }));
        applyTheme(parsed.theme);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const applyTheme = (mode: 'light' | 'dark') => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (mode === 'dark') root.classList.add('hod-dark');
    else root.classList.remove('hod-dark');
  };

  const updatePref = (patch: Partial<Prefs>) => {
    setPrefs((prev) => ({ ...prev, ...patch }));
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
      applyTheme(prefs.theme);
      setStatus('Preferences saved locally.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <header>
        <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Preferences</p>
        <h1 className="text-2xl font-bold text-orange-900">Incharge Settings</h1>
        <p className="text-sm text-gray-600">Alerts, security, and appearance for the vehicle in-charge workspace.</p>
      </header>

      {status ? (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg text-sm">
          {status}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="bg-white rounded-2xl border border-orange-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="text-orange-500" size={18} />
            <h2 className="text-lg font-semibold text-orange-900">Notifications</h2>
          </div>
          <div className="space-y-4 text-sm text-gray-700">
            <label className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-gray-900">Email assignment alerts</p>
                <p className="text-xs text-gray-500">When a request is approved and awaits your assignment.</p>
              </div>
              <Toggle checked={prefs.notifyEmail} onChange={(v) => updatePref({ notifyEmail: v })} disabled={saving} />
            </label>
            <label className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-gray-900">SMS for urgent trips</p>
                <p className="text-xs text-gray-500">Notify if pickup is within 6 hours.</p>
              </div>
              <Toggle checked={prefs.notifySms} onChange={(v) => updatePref({ notifySms: v })} disabled={saving} />
            </label>
            <label className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-gray-900">Gate/dispatch alerts</p>
                <p className="text-xs text-gray-500">Notify when a scheduled vehicle exits or returns.</p>
              </div>
              <Toggle checked={prefs.gateAlerts} onChange={(v) => updatePref({ gateAlerts: v })} disabled={saving} />
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
                <p className="font-medium text-gray-900">Require dispatch PIN</p>
                <p className="text-xs text-gray-500">Confirm before marking gate exit/entry.</p>
              </div>
              <Toggle checked={prefs.enforcePin} onChange={(v) => updatePref({ enforcePin: v })} disabled={saving} />
            </label>
            <label className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-gray-900">Two-factor for assignments</p>
                <p className="text-xs text-gray-500">Ask for OTP when assigning drivers/vehicles.</p>
              </div>
              <Toggle checked={prefs.twoFactor} onChange={(v) => updatePref({ twoFactor: v })} disabled={saving} />
            </label>
          </div>
        </section>
      </div>

      <section className="bg-white rounded-2xl border border-orange-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2">
          {prefs.theme === 'dark' ? <Moon className="text-orange-500" size={18} /> : <Sun className="text-orange-500" size={18} />}
          <h2 className="text-lg font-semibold text-orange-900">Appearance</h2>
        </div>
        <p className="text-sm text-gray-600">Switch between light and dark themes. Preference is stored on this device and applies to Incharge pages.</p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => { updatePref({ theme: 'light' }); applyTheme('light'); }}
            className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${prefs.theme === 'light' ? 'bg-orange-600 text-white border-orange-600 shadow' : 'border-orange-200 text-orange-800 hover:bg-orange-50'}`}
          >
            Light
          </button>
          <button
            type="button"
            onClick={() => { updatePref({ theme: 'dark' }); applyTheme('dark'); }}
            className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${prefs.theme === 'dark' ? 'bg-orange-600 text-white border-orange-600 shadow' : 'border-orange-200 text-orange-800 hover:bg-orange-50'}`}
          >
            Dark
          </button>
          <button
            type="button"
            onClick={() => { const next = prefs.theme === 'dark' ? 'light' : 'dark'; updatePref({ theme: next }); applyTheme(next); }}
            className="rounded-lg border border-orange-200 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50"
          >
            Toggle
          </button>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-orange-600 text-white px-4 py-2 font-semibold hover:bg-orange-700 disabled:opacity-60"
        >
          <Save size={16} />
          {saving ? 'Saving...' : 'Save preferences'}
        </button>
      </div>
    </div>
  );
}
