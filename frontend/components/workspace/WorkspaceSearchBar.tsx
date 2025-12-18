'use client';

import { Search, X } from 'lucide-react';

interface WorkspaceSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function WorkspaceSearchBar({
  value,
  onChange,
  placeholder = 'Search…',
  className = '',
}: WorkspaceSearchBarProps) {
  return (
    <div className={`w-full ${className}`.trim()}>
      <div className="relative flex items-center">
        <Search
          size={16}
          className="absolute left-3 text-orange-500 pointer-events-none"
          aria-hidden="true"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="hod-search-input w-full rounded-xl border border-orange-200 bg-white py-2.5 pl-9 pr-8 text-sm text-orange-900 placeholder:text-orange-400/70 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-2 flex h-6 w-6 items-center justify-center rounded-full text-orange-500 hover:bg-orange-100"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
