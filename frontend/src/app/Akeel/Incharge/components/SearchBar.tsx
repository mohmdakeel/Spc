'use client';

import React, { useId } from 'react';
import { Search, X } from 'lucide-react';

type Props = {
  value: string;
  onChange: (s: string) => void;
  placeholder?: string;
  className?: string;
  name?: string;
  disabled?: boolean;
};

// Compact search bar for In-Charge pages (keeps layout tidy above tables)
export default function InchargeSearchBar({
  value,
  onChange,
  placeholder = 'Search…',
  className = '',
  name,
  disabled = false,
}: Props) {
  const clear = () => onChange('');
  const uid = useId();
  const inputName = name || `incharge-search-${uid}`;
  const inputId = `incharge-search-${uid}`;

  return (
    <div className={`relative w-full ${className}`}>
      <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none text-orange-500">
        <Search size={16} />
      </div>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search"
        name={inputName}
        id={inputId}
        autoComplete="new-password"
        data-lpignore="true"
        data-1p-ignore="true"
        data-form-type="other"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        disabled={disabled}
        className={`w-full h-9 rounded-lg border border-orange-200 bg-white/90 pl-8 pr-8 text-sm text-orange-900 placeholder-orange-400/70 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-shadow ${
          disabled ? 'opacity-70 cursor-not-allowed' : ''
        }`}
      />
      {value && !disabled && (
        <button
          type="button"
          onClick={clear}
          className="absolute inset-y-0 right-2 flex items-center text-orange-500 hover:text-orange-700"
          aria-label="Clear search"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
