'use client';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { ArrowLeft, FileDiff, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchRecentHistory, fetchTimeline } from '../services/historyService';
import type { ChangeHistory } from '../services/types';
import HistoryModal from '../components/HistoryModal';

type Mode = 'all' | 'entity';
const ITEMS_PER_PAGE = 10;

const CELL_PAD_Y = 'py-[10px]';
const CELL_PAD_X = 'px-3';
const CELL_TEXT = 'text-[13px]';
const HEAD_TEXT = 'text-[13px]';
const HEAD_PAD_Y = 'py-[10px]';

export default function HistoryPage() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>('all');
  const [allHistory, setAllHistory] = useState<ChangeHistory[]>([]);
  const [entityHistory, setEntityHistory] = useState<ChangeHistory[]>([]);
  const [selectedType, setSelectedType] = useState<'Driver' | 'Vehicle' | null>(null);
  const [selectedId, setSelectedId] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<ChangeHistory | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const getActionStyle = (action: string) => {
    switch (action) {
      case 'Deleted': return 'bg-red-100 text-red-800';
      case 'Updated': return 'bg-yellow-100 text-yellow-800';
      case 'Created': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const loadAll = async () => {
    try {
      const data = await fetchRecentHistory(200);
      const historyData = Array.isArray(data) ? data : [];
      setAllHistory(historyData);
      setTotalPages(Math.ceil(historyData.length / ITEMS_PER_PAGE));
      setCurrentPage(1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load history');
      setAllHistory([]);
      setTotalPages(1);
      setCurrentPage(1);
    }
  };

  const list = mode === 'all' ? allHistory : entityHistory;

  const getCurrentItems = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return list.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  const openEntityById = async (type: 'Driver' | 'Vehicle', id: string) => {
    setSelectedType(type);
    setSelectedId(id);
    setMode('entity');
    setCurrentPage(1);
    try {
      const tl = await fetchTimeline(type, id);
      const entityData = Array.isArray(tl) ? tl : [];
      setEntityHistory(entityData);
      setTotalPages(Math.ceil(entityData.length / ITEMS_PER_PAGE));
    } catch (e) {
      const fallback = (allHistory || []).filter(h => h.entityType === type && String(h.entityId) === id);
      setEntityHistory(fallback);
      setTotalPages(Math.ceil(fallback.length / ITEMS_PER_PAGE));
      toast.error(e instanceof Error ? e.message : 'Failed to load entity history (showing cached data)');
    }
  };

  const openEntityTimeline = (item: ChangeHistory) => {
    const type: 'Driver' | 'Vehicle' = item.entityType === 'Driver' ? 'Driver' : 'Vehicle';
    openEntityById(type, String(item.entityId));
  };

  const backToAll = () => {
    setMode('all');
    setEntityHistory([]);
    setSelectedType(null);
    setSelectedId('');
    setCurrentPage(1);
    setTotalPages(Math.ceil(allHistory.length / ITEMS_PER_PAGE));
  };

  const goToPage = (p: number) => {
    if (p >= 1 && p <= totalPages) setCurrentPage(p);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const nums: number[] = [];
    const windowSize = 5;
    const first = 1;
    const last = totalPages;
    const start = Math.max(first, currentPage - Math.floor(windowSize / 2));
    const end = Math.min(last, start + windowSize - 1);
    for (let i = start; i <= end; i++) nums.push(i);
    return (
      <div className="flex items-center justify-between mt-4 px-4 py-3 bg-orange-50 rounded-lg border border-orange-100">
        <div className="text-[13px] text-orange-800">
          Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
          {Math.min(currentPage * ITEMS_PER_PAGE, list.length)} of {list.length} records
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className={`p-2 rounded-md ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-orange-600 hover:bg-orange-100'}`}
          >
            <ChevronLeft size={16} />
          </button>
          {nums.map(n => (
            <button
              key={n}
              onClick={() => goToPage(n)}
              className={`px-3 py-1 rounded-md text-[13px] ${currentPage === n ? 'bg-orange-600 text-white' : 'text-orange-600 hover:bg-orange-100'}`}
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`p-2 rounded-md ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-orange-600 hover:bg-orange-100'}`}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  useEffect(() => { loadAll(); }, []);
  useEffect(() => {
    const type = searchParams.get('type');
    const id = searchParams.get('id');
    if ((type === 'Driver' || type === 'Vehicle') && id) {
      openEntityById(type as 'Driver' | 'Vehicle', id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const renderRows = (rows: ChangeHistory[], clickableRows: boolean) => (
    <tbody className="divide-y divide-orange-100">
      {rows.map((item, i) => (
        <tr
          key={String(item.id)}
          className={`${clickableRows ? 'cursor-pointer hover:bg-orange-50' : 'hover:bg-orange-50'}`}
          onClick={() => clickableRows ? openEntityTimeline(item) : undefined}
        >
          <td className={`${CELL_PAD_X} ${CELL_PAD_Y} ${CELL_TEXT}`}>{(currentPage - 1) * ITEMS_PER_PAGE + i + 1}</td>
          <td className={`${CELL_PAD_X} ${CELL_PAD_Y} ${CELL_TEXT}`}>{item.entityType}</td>
          <td className={`${CELL_PAD_X} ${CELL_PAD_Y} ${CELL_TEXT} w-24 truncate`}>{String(item.entityId)}</td>
          <td className={`${CELL_PAD_X} ${CELL_PAD_Y} ${CELL_TEXT} w-28`}>
            <span className={`px-2 py-1 rounded ${getActionStyle(item.action)}`}>{item.action}</span>
          </td>
          <td className={`${CELL_PAD_X} ${CELL_PAD_Y} ${CELL_TEXT} w-44 truncate`}>{item.performedBy || 'Unknown'}</td>
          <td className={`${CELL_PAD_X} ${CELL_PAD_Y} ${CELL_TEXT} w-48 truncate`}>{new Date(item.timestamp).toLocaleString()}</td>
          <td className={`${CELL_PAD_X} ${CELL_PAD_Y} text-right w-20`}>
            <button
              className="inline-flex items-center gap-1 text-orange-600 hover:bg-orange-100 px-2 py-1 rounded text-[12px]"
              onClick={(e) => { e.stopPropagation(); setSelectedItem(item); }}
            >
              <FileDiff size={14} /> View
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  );

  return (
    <div className="flex min-h-screen bg-orange-50">
      <div className="flex-1 p-4 md:p-6 overflow-auto">
        <div className="bg-white rounded-xl shadow-md p-4 md:p-6 min-h-full flex flex-col">
          {mode === 'all' ? (
            <div className="mb-4">
              <h1 className="text-[20px] md:text-[22px] font-bold text-gray-800">Change History</h1>
              <p className="text-[13px] text-orange-600">Showing recent changes across Drivers & Vehicles</p>
            </div>
          ) : (
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h1 className="text-[20px] md:text-[22px] font-bold text-gray-800">
                  {selectedType} • {selectedId}
                </h1>
                <p className="text-[13px] text-orange-600">Timeline (Created / Updated / Deleted)</p>
              </div>
              <button
                className="inline-flex items-center gap-2 px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-[13px]"
                onClick={backToAll}
              >
                <ArrowLeft size={16} /> Back
              </button>
            </div>
          )}

          <div className="flex-1 flex flex-col">
            <div className="rounded-lg border border-orange-100 flex-1">
              <table className="w-full table-fixed">
                <thead className="bg-orange-50 sticky top-0 z-10">
                  <tr>
                    <th className={`text-left font-semibold text-orange-800 w-10 ${CELL_PAD_X} ${HEAD_PAD_Y} ${HEAD_TEXT}`}>#</th>
                    <th className={`text-left font-semibold text-orange-800 w-28 ${CELL_PAD_X} ${HEAD_PAD_Y} ${HEAD_TEXT}`}>Entity Type</th>
                    <th className={`text-left font-semibold text-orange-800 w-24 ${CELL_PAD_X} ${HEAD_PAD_Y} ${HEAD_TEXT}`}>Entity ID</th>
                    <th className={`text-left font-semibold text-orange-800 w-28 ${CELL_PAD_X} ${HEAD_PAD_Y} ${HEAD_TEXT}`}>Action</th>
                    <th className={`text-left font-semibold text-orange-800 w-44 ${CELL_PAD_X} ${HEAD_PAD_Y} ${HEAD_TEXT}`}>Performed By</th>
                    <th className={`text-left font-semibold text-orange-800 w-48 ${CELL_PAD_X} ${HEAD_PAD_Y} ${HEAD_TEXT}`}>Timestamp</th>
                    <th className={`text-right font-semibold text-orange-800 w-20 ${CELL_PAD_X} ${HEAD_PAD_Y} ${HEAD_TEXT}`}>Details</th>
                  </tr>
                </thead>
                {getCurrentItems().length
                  ? renderRows(getCurrentItems(), mode === 'all')
                  : (
                    <tbody>
                      <tr>
                        <td className="px-4 py-12 text-center text-gray-500" colSpan={7}>
                          {mode === 'all' ? 'No history records found.' : 'No history found for this entity.'}
                        </td>
                      </tr>
                    </tbody>
                  )}
              </table>
            </div>
            {renderPagination()}
          </div>
        </div>
      </div>

      {selectedItem && <HistoryModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
    </div>
  );
}
