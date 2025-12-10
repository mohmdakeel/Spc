'use client';

import { useEffect, useState } from 'react';
import { Bell, Save, Sun, Moon } from 'lucide-react';

const PREFS_KEY = 'applicant-settings';
const THEME_KEY = 'workspace-theme';

type Prefs = {
  notifyEmail: boolean;
  notifySms: boolean;
};

export default function ApplicantSettingsPage() {
  const [prefs, setPrefs] = useState<Prefs>({ notifyEmail: true, notifySms: false });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PREFS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPrefs({
          notifyEmail: !!parsed.notifyEmail,
          notifySms: !!parsed.notifySms,
        });
      }
    } catch {}
    const storedTheme = (localStorage.getItem(THEME_KEY) as 'light' | 'dark') || 'light';
    setTheme(storedTheme);
    applyTheme(storedTheme);
  }, []);

  const toggle = (key: keyof Prefs) =>
    setPrefs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));

  const applyTheme = (mode: 'light' | 'dark') => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (mode === 'dark') {
      root.classList.add('hod-dark');
    } else {
      root.classList.remove('hod-dark');
    }
  };

  const setThemeMode = (mode: 'light' | 'dark') => {
    setTheme(mode);
    localStorage.setItem(THEME_KEY, mode);
    applyTheme(mode);
    setStatus(`Appearance set to ${mode === 'dark' ? 'Dark' : 'Light'} mode.`);
  };

  const handleSave = () => {
    setSaving(true);
    setStatus(null);
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
      setStatus('Preferences saved.');
    } catch {
      setStatus('Unable to save preferences right now.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <header>
        <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Preferences</p>
        <h1 className="text-2xl font-bold text-orange-900">Applicant Settings</h1>
        <p className="text-sm text-gray-600">
          Control notification channels and appearance for this workspace.
        </p>
      </header>

      {status && (
        <div className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-2 rounded-lg text-sm">
          {status}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="bg-white rounded-2xl border border-orange-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="text-orange-500" size={18} />
            <h2 className="text-lg font-semibold text-orange-900">Notifications</h2>
          </div>
          <div className="space-y-4 text-sm text-gray-700">
            <ToggleRow
              title="Email updates"
              description="Get a summary when your requests move to the next stage."
              checked={prefs.notifyEmail}
              onChange={() => toggle('notifyEmail')}
            />
            <ToggleRow
              title="SMS alerts"
              description="Urgent reminders for pickups scheduled within 12 hours."
              checked={prefs.notifySms}
              onChange={() => toggle('notifySms')}
            />
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-orange-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2">
            {theme === 'dark' ? <Moon className="text-orange-500" size={18} /> : <Sun className="text-orange-500" size={18} />}
            <h2 className="text-lg font-semibold text-orange-900">Appearance</h2>
          </div>
          <p className="text-sm text-gray-600">Switch between light and dark modes for the entire workspace.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => setThemeMode('light')}
              className={`flex-1 rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                theme === 'light'
                  ? 'bg-orange-600 text-white border-orange-600 shadow'
                  : 'border-orange-200 text-orange-800 hover:bg-orange-50'
              }`}
            >
              Light
            </button>
            <button
              type="button"
              onClick={() => setThemeMode('dark')}
              className={`flex-1 rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                theme === 'dark'
                  ? 'bg-orange-600 text-white border-orange-600 shadow'
                  : 'border-orange-200 text-orange-800 hover:bg-orange-50'
              }`}
            >
              Dark
            </button>
          </div>
        </section>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-orange-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-orange-700 disabled:bg-orange-400"
        >
          <Save size={16} />
          {saving ? 'Saving…' : 'Save preferences'}
        </button>
      </div>
    </div>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4">
      <div>
        <p className="font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={[
          'w-12 h-6 rounded-full border transition-all duration-200 flex items-center',
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
    </label>
  );
}
