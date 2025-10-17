'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { ArrowLeft } from 'lucide-react';
import Sidebar from '../../components/SideBar';
import { fetchTimeline } from '../../services/historyService';
import type { ChangeHistory } from '../../services/types';

export default function ServiceCandidateHistoryPage() {
  const router = useRouter();
  const params = useSearchParams();

  const candidateId = params.get('id');
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<ChangeHistory[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    if (!candidateId) return;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchTimeline('ServiceCandidate', candidateId);
        setRecords(data);
      } catch (err: any) {
        toast.error(err?.message ?? 'Failed to load candidate history');
      } finally {
        setLoading(false);
      }
    })();
  }, [candidateId]);

  const toggleExpand = (id: number) => {
    setExpanded(expanded === id ? null : id);
  };

  return (
    <Sidebar>
      <div className="w-full min-h-screen bg-gray-50 p-4">
        <div className="bg-white shadow-md rounded-xl p-4">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-orange-600 hover:text-orange-800 p-2 rounded-lg hover:bg-orange-50"
              >
                <ArrowLeft size={20} />
                Back
              </button>
              <h1 className="text-lg sm:text-xl font-bold text-gray-800">
                Service Candidate History #{candidateId}
              </h1>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="text-center py-10 text-gray-700">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mb-3"></div>
              Loading history…
            </div>
          ) : records.length === 0 ? (
            <p className="text-center text-gray-600 py-10">No history found for this candidate.</p>
          ) : (
            <div className="overflow-x-auto border border-orange-100 rounded-lg shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead className="bg-orange-50">
                  <tr>
                    <th className="border px-3 py-1 text-xs font-semibold text-orange-800">#</th>
                    <th className="border px-3 py-1 text-xs font-semibold text-orange-800">Action</th>
                    <th className="border px-3 py-1 text-xs font-semibold text-orange-800">Performed By</th>
                    <th className="border px-3 py-1 text-xs font-semibold text-orange-800">Timestamp</th>
                    <th className="border px-3 py-1 text-xs font-semibold text-orange-800 text-center">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => (
                    <React.Fragment key={r.id}>
                      <tr
                        className={`text-gray-900 hover:bg-orange-50 transition-colors ${
                          expanded === r.id ? 'bg-orange-50' : ''
                        }`}
                      >
                        <td className="border px-3 py-1 text-xs text-center">{i + 1}</td>
                        <td className="border px-3 py-1 text-xs font-medium text-orange-800">{r.action}</td>
                        <td className="border px-3 py-1 text-xs">{r.performedBy || '-'}</td>
                        <td className="border px-3 py-1 text-xs">
                          {new Date(r.timestamp).toLocaleString()}
                        </td>
                        <td className="border px-3 py-1 text-xs text-center">
                          <button
                            onClick={() => toggleExpand(Number(r.id))}
                            className="text-orange-600 hover:text-orange-800 underline text-xs"
                          >
                            {expanded === r.id ? 'Hide JSON' : 'View JSON'}
                          </button>
                        </td>
                      </tr>
                      {expanded === r.id && (
                        <tr className="bg-white">
                          <td colSpan={5} className="border-t border-orange-100 px-3 py-2">
                            <div className="grid md:grid-cols-2 gap-3">
                              <div>
                                <h3 className="font-semibold text-sm text-gray-800 mb-1">Previous Data</h3>
                                <pre className="text-xs bg-gray-50 border border-gray-200 rounded-md p-2 overflow-x-auto whitespace-pre-wrap">
                                  {r.previousData
                                    ? JSON.stringify(r.previousData, null, 2)
                                    : '—'}
                                </pre>
                              </div>
                              <div>
                                <h3 className="font-semibold text-sm text-gray-800 mb-1">New Data</h3>
                                <pre className="text-xs bg-gray-50 border border-gray-200 rounded-md p-2 overflow-x-auto whitespace-pre-wrap">
                                  {r.newData
                                    ? JSON.stringify(r.newData, null, 2)
                                    : '—'}
                                </pre>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Sidebar>
  );
}
