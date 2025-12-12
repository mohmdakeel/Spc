'use client';
import React from 'react';
import { Search, X } from 'lucide-react';

export default function SearchBar({
  value, onChange, placeholder = 'Search…', className = '',
}: { value: string; onChange: (s: string) => void; placeholder?: string; className?: string; }) {
  const clearSearch = () => onChange('');
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search size={18} className="text-orange-500" />
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full border border-orange-200 rounded-xl px-10 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 text-sm bg-white placeholder-orange-400/70 text-orange-900 font-medium transition-all duration-200 shadow-sm hover:shadow-md"
      />
      {value && (
        <button onClick={clearSearch} className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-orange-100 rounded-r-xl transition-colors" aria-label="Clear search">
          <X size={18} className="text-orange-500 hover:text-orange-700" />
        </button>
      )}
    </div>
  );
}
