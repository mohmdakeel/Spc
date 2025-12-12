'use client';

import React from 'react';
import SearchBar from '../../Transport/components/SearchBar';

type Props = {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
};

/**
 * Gate-wide search bar wrapper to keep a consistent size across pages.
 */
export default function GateSearchBar({ value, onChange, placeholder, className }: Props) {
  return (
    <div className={`w-full sm:w-72 ${className || ''}`}>
      <SearchBar
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full h-9"
      />
    </div>
  );
}
