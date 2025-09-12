'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { X, Clock, RefreshCw, Trash2, Plus, FileDiff, ChevronRight, Info } from 'lucide-react';
import { toast } from 'react-toastify';

import PreviousDataModal from './PreviousDataModal';
import type { ChangeHistory } from '../services/types';
import { fetchDriverById } from '../services/driverService';
import { fetchVehicleById } from '../services/VehicleService';

// ---- utils ----
const safeParse = (data: any): Record<string, any> => {
  if (!data) return {};
  if (typeof data === 'object') return data as Record<string, any>;
  try { return JSON.parse(data); } catch { return {}; }
};

const prettyVal = (v: any) => {
  if (v == null) return '—';
  if (typeof v === 'string') return v;
  try { return JSON.stringify(v, null, 2); } catch { return String(v); }
};

type Props = { item: ChangeHistory; onClose: () => void };

export default function HistoryModal({ item, onClose }: Props) {
  const [prevOpen, setPrevOpen] = useState(false);
  const [currentData, setCurrentData] = useState<Record<string, any> | null>(null);
  const [loadingCompare, setLoadingCompare] = useState(false);

  const prevData = useMemo(() => safeParse(item.previousData), [item.previousData]);

  const actionStyle =
    item.action === 'Deleted' ? 'bg-red-100 text-red-800 border-red-200'
    : item.action === 'Updated' ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
    : item.action === 'Created' ? 'bg-green-100 text-green-800 border-green-200'
    : 'bg-gray-100 text-gray-800 border-gray-200';

  const actionIcon =
    item.action === 'Deleted' ? <Trash2 size={18} />
    : item.action === 'Updated' ? <RefreshCw size={18} />
    : item.action === 'Created' ? <Plus size={18} />
    : <FileDiff size={18} />;

  const canCompare = item.action === 'Updated' && Object.keys(prevData).length > 0;

  // Close on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleShowPrev = async () => {
    if (!canCompare) return;
    try {
      setLoadingCompare(true);
      const current =
        item.entityType === 'Driver'
          ? await fetchDriverById(String(item.entityId))
          : await fetchVehicleById(String(item.entityId));
      setCurrentData(current as any);
      setPrevOpen(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to fetch current entity data');
    } finally {
      setLoadingCompare(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
        onClick={handleBackdrop}
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-modal-title"
      >
        <div className="bg-orange-50 rounded-xl shadow-xl w-full max-w-4xl overflow-hidden border border-orange-200">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-orange-200 bg-orange-100">
            <div className="flex items-center gap-3">
              <FileDiff size={22} className="text-orange-700" />
              <h2 id="history-modal-title" className="text-xl font-bold text-orange-900">
                Change History • {item.entityType} #{String(item.entityId)}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-orange-200 text-orange-700 transition-all"
              aria-label="Close"
              title="Close"
            >
              <X size={22} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 bg-white">
            {/* Action badge and timestamp */}
            <div className="flex items-center justify-between mb-6">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${actionStyle}`}>
                {actionIcon}
                <span className="font-semibold">
                  {item.action} by {item.performedBy || 'Unknown'}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-orange-700">
                <Clock size={18} />
                <span className="font-medium">{new Date(item.timestamp).toLocaleString()}</span>
              </div>
            </div>

            {/* Previous data table */}
            <div className="mb-6">
              <h3 className="font-semibold text-orange-800 mb-3 flex items-center gap-2 text-lg">
                <ChevronRight size={20} className="text-orange-600" /> Previous Version Snapshot
              </h3>

              <div className="border border-orange-200 rounded-lg overflow-hidden bg-orange-50">
                <div className="overflow-auto max-h-80">
                  <table className="w-full">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-orange-100 text-orange-800">
                        <th className="px-5 py-3 text-left font-semibold w-1/3 min-w-[180px] border-b border-orange-200">Field</th>
                        <th className="px-5 py-3 text-left font-semibold border-b border-orange-200">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(prevData).length === 0 ? (
                        <tr>
                          <td colSpan={2} className="text-center p-6 text-orange-600">
                            No previous data available
                          </td>
                        </tr>
                      ) : (
                        Object.entries(prevData).map(([k, v], index) => (
                          <tr key={k} className={`align-top ${index % 2 === 0 ? 'bg-orange-50' : 'bg-orange-100/30'}`}>
                            <td className="px-5 py-3 font-semibold text-orange-700 whitespace-nowrap border-b border-orange-200/50">
                              {k}
                            </td>
                            <td className="px-5 py-3 text-orange-900 border-b border-orange-200/50">
                              <pre className="max-h-24 overflow-auto whitespace-pre-wrap break-words text-sm leading-6 font-medium">
                                {prettyVal(v)}
                              </pre>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer actions */}
            {canCompare ? (
              <button
                type="button"
                onClick={handleShowPrev}
                disabled={loadingCompare}
                className="w-full flex items-center justify-center gap-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-5 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
              >
                {loadingCompare ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" /> Loading current version…
                  </>
                ) : (
                  <>
                    <FileDiff size={18} /> Compare With Current Version
                  </>
                )}
              </button>
            ) : item.action === 'Deleted' ? (
              <div className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-orange-100 text-orange-700 border border-orange-200">
                <Info size={18} /> Deleted — compare unavailable
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {prevOpen && currentData && (
        <PreviousDataModal
          prevData={prevData}
          currentData={currentData}
          onClose={() => setPrevOpen(false)}
          title="Full Field Comparison"
          action={item.action}
          timestamp={item.timestamp}
        />
      )}
    </>
  );
}
