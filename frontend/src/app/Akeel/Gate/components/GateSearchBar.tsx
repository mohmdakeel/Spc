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
    <SearchBar
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`h-8 min-w-[220px] ${className || ''}`}
    />
  );
}
