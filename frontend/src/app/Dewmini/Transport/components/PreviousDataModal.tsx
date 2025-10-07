'use client';

import React from 'react';
import { X, Clock, RefreshCw, FileDiff } from 'lucide-react';

const prettyLabel = (s: string) =>
  s.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()).replace(/_/g, ' ').trim();

export default function PreviousDataModal({
  prevData, currentData, onClose, title, action, timestamp,
}: {
  prevData: Record<string, any>;
  currentData?: Record<string, any>;
  onClose: () => void;
  title?: string;
  action?: string;
  timestamp?: string | number;
}) {
  const allFields = Array.from(new Set([...(Object.keys(prevData || {})), ...(Object.keys(currentData || {}))]));
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-orange-50 rounded-xl shadow-xl w-full max-w-5xl overflow-hidden border border-orange-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-orange-200 bg-orange-100">
          <div className="flex items-center gap-3">
            <FileDiff size={22} className="text-orange-700" />
            <h2 className="text-xl font-bold text-orange-900">{title || 'Data Comparison'}</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-lg hover:bg-orange-200 text-orange-700 transition-all"
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </div>

        {/* Action and Timestamp */}
        {(action || timestamp) && (
          <div className="px-6 py-4 bg-orange-75 border-b border-orange-200">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-orange-700">
              {action && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 rounded-lg">
                  <RefreshCw size={16} className="text-orange-600" />
                  <span className="font-medium">Action:</span>
                  <span className="font-semibold text-orange-800">{action}</span>
                </div>
              )}
              {timestamp && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 rounded-lg">
                  <Clock size={16} className="text-orange-600" />
                  <span className="font-medium">When:</span>
                  <span className="font-semibold text-orange-800">{new Date(timestamp).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Comparison Table */}
        <div className="p-6 bg-white overflow-auto max-h-[65vh]">
          <div className="border border-orange-200 rounded-lg overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-orange-100 text-orange-800">
                  <th className="px-5 py-3 text-left font-semibold border-b border-orange-200">Field</th>
                  <th className="px-5 py-3 text-left font-semibold border-b border-orange-200">Previous Value</th>
                  <th className="px-5 py-3 text-left font-semibold border-b border-orange-200">Current Value</th>
                </tr>
              </thead>
              <tbody>
                {allFields.map((field, index) => {
                  const prevVal = prevData?.[field] ?? '-';
                  const curVal = currentData?.[field] ?? '-';
                  const changed = prevVal !== curVal;
                  return (
                    <tr key={field} className={`${index % 2 === 0 ? 'bg-orange-50' : 'bg-orange-100/30'} ${changed ? '!bg-yellow-50' : ''}`}>
                      <td className="px-5 py-3 font-semibold text-orange-700 border-b border-orange-200/50">{prettyLabel(field)}</td>
                      <td className={`px-5 py-3 border-b border-orange-200/50 ${changed ? 'text-red-600 line-through font-medium' : 'text-orange-900'}`}>
                        {String(prevVal)}
                      </td>
                      <td className={`px-5 py-3 border-b border-orange-200/50 ${changed ? 'text-green-600 font-semibold' : 'text-orange-900'}`}>
                        {String(curVal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex justify-end border-t border-orange-200 bg-orange-100">
          <button 
            onClick={onClose} 
            className="px-5 py-2.5 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-all font-semibold shadow-md hover:shadow-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}