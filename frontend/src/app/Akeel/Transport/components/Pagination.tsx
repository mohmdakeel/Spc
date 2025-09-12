'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({
  current, total, pageSize, totalItems, onPrev, onNext,
}: {
  current: number;
  total: number;
  pageSize: number;
  totalItems: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const start = (current - 1) * pageSize + 1;
  const end = Math.min(start + pageSize - 1, totalItems);
  
  return (
    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 p-5 bg-orange-50 rounded-lg border border-orange-200 mt-6">
      {/* Previous Button */}
      <button
        type="button"
        onClick={onPrev}
        disabled={current === 1}
        className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-all ${
          current === 1 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-orange-600 text-white hover:bg-orange-700 shadow-md hover:shadow-lg'
        }`}
      >
        <ChevronLeft size={18} /> 
        <span>Previous</span>
      </button>

      {/* Page Info */}
      <div className="text-sm text-orange-800 text-center flex flex-col sm:flex-row items-center gap-2">
        <span className="font-medium bg-orange-100 px-3 py-1 rounded-full">
          Page <span className="text-orange-900">{current}</span> of <span className="text-orange-900">{total}</span>
        </span>
        <span className="hidden sm:block">•</span>
        <span className="font-medium">
          Showing <span className="text-orange-900">{start}-{end}</span> of{' '}
          <span className="text-orange-900">{totalItems}</span> items
        </span>
      </div>

      {/* Next Button */}
      <button
        type="button"
        onClick={onNext}
        disabled={current === total}
        className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-all ${
          current === total 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-orange-600 text-white hover:bg-orange-700 shadow-md hover:shadow-lg'
        }`}
      >
        <span>Next</span>
        <ChevronRight size={18} />
      </button>
    </div>
  );
}