'use client';

import { useEffect, useMemo, useState } from 'react';
import Topbar from '../../../components/Topbar';
import Sidebar from '../../../components/Sidebar';
import Modal from '../../../components/Modal';
import api from '../../../lib/api';
import { useAuth } from '../../../hooks/useAuth';
import { AuditLog } from '../../../types';
import { readCache, writeCache } from '../../../lib/cache';
import {
  History as HistoryIcon,
  User,
  Shield,
  Calendar,
  FileText,
  Search,
  Info,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

type ViewMode = 'mine' | 'all';

function parseDetails(raw?: string): Record<string, any> | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return { raw };
  }
}

// build friendly fields for display
function describeLogRow(log: AuditLog) {
  const details = parseDetails(log.details);

  let target = '';
  if (log.entityType === 'Registration') {
    const epf =
      (details && (details as any).epf) ||
      (details && (details as any).EPF) ||
      '';
    target = epf ? `Employee ${epf}` : `Employee Record`;
  } else if (log.entityType === 'User') {
    const epf = details && (details as any).epf;
    const role = details && (details as any).role;
    if (epf && role) {
      target = `User for EPF ${epf} (role ${role})`;
    } else if (epf) {
      target = `User for EPF ${epf}`;
    } else {
      target = `System User`;
    }
  } else {
    target = log.entityType || 'Entity';
  }

  return {
    actor: log.actor,
    action: log.action,
    target,
    whenDate: new Date(log.atTime).toLocaleDateString(),
    whenTime: new Date(log.atTime).toLocaleTimeString(),
  };
}

function getActionColor(action: string) {
  const a = action.toLowerCase();
  if (a.includes('create') || a.includes('add')) {
    return 'bg-green-100 text-green-800';
  }
  if (a.includes('update') || a.includes('modify')) {
    return 'bg-blue-100 text-blue-800';
  }
  if (a.includes('delete') || a.includes('remove')) {
    return 'bg-red-100 text-red-800';
  }
  if (a.includes('read') || a.includes('view')) {
    return 'bg-gray-100 text-gray-800';
  }
  if (a.includes('transfer') || a.includes('assign')) {
    return 'bg-purple-100 text-purple-800';
  }
  return 'bg-orange-100 text-orange-800';
}

export default function HistoryPage() {
  const { user } = useAuth();

  // backend data
  const cachedLogs = readCache<AuditLog[]>('cache:auth:audit') || [];
  const [logs, setLogs] = useState<AuditLog[]>(cachedLogs);
  const [view, setView] = useState<ViewMode>('mine');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // modal state
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // ui state
  const [isOpenSidebar, setIsOpenSidebar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // pagination state
  const [pageSize, setPageSize] = useState<number>(10); // 10 or 15
  const [currentPage, setCurrentPage] = useState<number>(1); // starts at page 1

  // who can see "all"
  const isAdmin =
    !!user?.roles?.includes('ADMIN') ||
    !!user?.permissions?.includes('AUDIT_ALL');

  // force back to "mine" if not admin
  useEffect(() => {
    if (!isAdmin && view === 'all') setView('mine');
  }, [isAdmin, view]);

  // fetch logs when user or view changes
  useEffect(() => {
    if (!user) {
      setLogs([]);
      return;
    }
    fetchLogs({ silent: !!cachedLogs.length });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, view]);

  async function fetchLogs(opts?: { silent?: boolean }) {
    if (!user) return;
    const endpoint = view === 'mine' ? '/users/history/me' : '/users/history';

    if (view === 'all' && !isAdmin) {
      setLogs([]);
      return;
    }

    if (opts?.silent) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setErrorMessage('');
    try {
      const { data } = await api.get<AuditLog[]>(endpoint);
      const list = Array.isArray(data) ? data : [];
      setLogs(list);
      writeCache('cache:auth:audit', list);
      setCurrentPage(1); // reset to first page whenever data reloads
    } catch (e: any) {
      setErrorMessage(
        e?.response?.data?.message || 'Failed to fetch audit logs'
      );
      if (!logs.length) setLogs([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }

  // decorate rows for display
  const friendlyRows = useMemo(() => {
    return logs.map((log) => {
      const desc = describeLogRow(log);
      return { ...log, ...desc };
    });
  }, [logs]);

  // filter by search text
  const filteredLogs = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return friendlyRows;

    return friendlyRows.filter(
      (row) =>
        row.actor?.toLowerCase().includes(term) ||
        row.action?.toLowerCase().includes(term) ||
        row.target?.toLowerCase().includes(term)
    );
  }, [friendlyRows, searchTerm]);

  // whenever searchTerm changes, go back to page 1
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  // pagination math
  const totalRows = filteredLogs.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));

  // make sure currentPage not > totalPages (ex: after filter shrinks list)
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndexExclusive = startIndex + pageSize;
  const pageRows = filteredLogs.slice(startIndex, endIndexExclusive);

  // click row -> open modal
  function handleRowClick(logRow: AuditLog) {
    setSelectedLog(logRow);
    setShowDetails(true);
  }

  const showSkeleton = loading && logs.length === 0;

  // guard loading user
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center border border-orange-200">
          <Shield className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h2>
          <p className="text-gray-600">Please wait while we load your data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <Sidebar
        user={user}
        isOpen={isOpenSidebar}
        onClose={() => setIsOpenSidebar(false)}
      />

      <div className="auth-shell__main overflow-hidden">
        <Topbar user={user} />

        <main className="auth-shell__content">
          {/* HEADER */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <HistoryIcon className="w-8 h-8 text-orange-600" />
              <h1 className="text-3xl font-bold text-gray-900">Audit History</h1>
            </div>
            <p className="text-gray-600">See who did what in the system</p>
          </div>

          {/* ERROR MESSAGE */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <Shield className="mr-2 text-red-600" />
              <span className="text-red-800">{errorMessage}</span>
            </div>
          )}

          <div className="space-y-8">
            {/* MAIN TABLE CARD */}
            <div className="w-full">
              <div className="bg-white rounded-2xl shadow-lg border border-orange-200 overflow-hidden">
                {/* CARD HEADER */}
                <div className="p-6 border-b border-orange-200 bg-orange-50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-orange-600" />
                        {view === 'mine'
                          ? 'My Activity History'
                          : 'All System History'}
                      </h2>

                      {!isAdmin && (
                        <p className="text-sm text-gray-600 mt-2">
                          You are viewing only your own activity.
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                      {/* SEARCH BOX */}
                      <div className="relative">
                        <label htmlFor="historySearch" className="sr-only">
                          Search history entries
                        </label>
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          id="historySearch"
                          name="historySearch"
                          type="text"
                          placeholder="Search user / action / target..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                        />
                      </div>

                      {/* PAGE SIZE SELECT (10 / 15) */}
                      <div className="flex flex-col">
                        <label htmlFor="historyPageSize" className="sr-only">
                          Rows per page
                        </label>
                        <select
                          id="historyPageSize"
                          name="historyPageSize"
                          value={pageSize}
                          onChange={(e) =>
                            setPageSize(parseInt(e.target.value, 10))
                          }
                          className="py-2 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                        >
                          <option value={10}>10 rows</option>
                          <option value={15}>15 rows</option>
                        </select>
                      </div>

                      {isRefreshing && (
                        <div className="flex items-center gap-2 text-xs text-orange-700">
                          <div className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                          Updating
                        </div>
                      )}

                      {/* TOGGLE MY / ALL (ADMIN ONLY) */}
                      {isAdmin && (
                        <button
                          onClick={() =>
                            setView(view === 'mine' ? 'all' : 'mine')
                          }
                          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                        >
                          {view === 'mine'
                            ? 'View All History'
                            : 'View My History'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* TABLE WRAPPER */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-orange-50">
                      <tr>
                        <th className="p-3 text-left text-sm font-semibold text-gray-700">
                          User
                        </th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-700">
                          Action
                        </th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-700">
                          Target
                        </th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-700">
                          When
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200">
                      {showSkeleton ? (
                        <tr>
                          <td colSpan={4} className="p-6">
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-gray-600 text-sm">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                                Loading audit logs...
                              </div>
                              <div className="h-10 bg-orange-100/70 rounded animate-pulse" />
                              <div className="h-10 bg-orange-100/70 rounded animate-pulse" />
                              <div className="h-10 bg-orange-100/70 rounded animate-pulse" />
                            </div>
                          </td>
                        </tr>
                      ) : pageRows.length > 0 ? (
                        pageRows.map((row) => (
                          <tr
                            key={row.id}
                            className="cursor-pointer border-b hover:bg-orange-50 transition-colors"
                            onClick={() => handleRowClick(row)}
                          >
                            {/* USER */}
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-400" />
                                <span className="font-medium text-gray-900">
                                  {row.actor}
                                </span>
                              </div>
                            </td>

                            {/* ACTION */}
                            <td className="p-3">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(
                                  row.action
                                )}`}
                              >
                                {row.action}
                              </span>
                            </td>

                            {/* TARGET */}
                            <td className="p-3 text-gray-700 text-sm">
                              {row.target}
                            </td>

                            {/* WHEN */}
                            <td className="p-3 text-sm">
                              <div className="text-gray-900">
                                {row.whenDate}
                              </div>
                              <div className="text-gray-500">
                                {row.whenTime}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={4}
                            className="p-6 text-center text-gray-500"
                          >
                            <div className="flex flex-col items-center gap-2">
                              <FileText className="w-8 h-8 text-gray-400" />
                              {searchTerm
                                ? 'No matching audit logs found'
                                : 'No audit logs available'}
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* PAGINATION FOOTER */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border-t border-gray-200 bg-white">
                  <div className="text-sm text-gray-600">
                    Showing{' '}
                    <span className="font-semibold text-gray-900">
                      {totalRows === 0 ? 0 : startIndex + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-semibold text-gray-900">
                      {Math.min(endIndexExclusive, totalRows)}
                    </span>{' '}
                    of{' '}
                    <span className="font-semibold text-gray-900">
                      {totalRows}
                    </span>{' '}
                    entries
                  </div>

                  <div className="flex items-center gap-4">
                    <button
                      className="flex items-center px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 text-sm font-medium transition-colors"
                      onClick={() =>
                        setCurrentPage((p) => Math.max(1, p - 1))
                      }
                      disabled={currentPage <= 1}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </button>

                    <div className="text-sm text-gray-700 font-medium">
                      Page {currentPage}{' '}
                      <span className="text-gray-400">/ {totalPages}</span>
                    </div>

                    <button
                      className="flex items-center px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 text-sm font-medium transition-colors"
                      onClick={() =>
                        setCurrentPage((p) =>
                          Math.min(totalPages, p + 1)
                        )
                      }
                      disabled={currentPage >= totalPages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* DETAILS MODAL (row click) */}
          <Modal
            isOpen={showDetails}
            onClose={() => setShowDetails(false)}
            title="Activity Details"
            size="lg"
            showFooter={false}
          >
            {selectedLog &&
              (() => {
                const parsed = parseDetails(selectedLog.details);
                const desc = describeLogRow(selectedLog);

                return (
                  <div className="space-y-6 max-h-[70vh] overflow-y-auto">
                    {/* summary */}
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-orange-600 flex-shrink-0" />
                        <div>
                          <p className="text-gray-900 text-sm">
                            <span className="font-semibold">{desc.actor}</span>{' '}
                            performed{' '}
                            <span className="font-semibold">
                              {selectedLog.action}
                            </span>{' '}
                            on{' '}
                            <span className="font-semibold">{desc.target}</span>
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {new Date(
                              selectedLog.atTime
                            ).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* core fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          User
                        </label>
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900">
                            {selectedLog.actor}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Action
                        </label>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getActionColor(
                            selectedLog.action
                          )}`}
                        >
                          {selectedLog.action}
                        </span>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Affected
                        </label>
                        <div className="p-2 bg-gray-50 rounded-lg text-gray-900">
                          {desc.target}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          When
                        </label>
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900">
                            {new Date(
                              selectedLog.atTime
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* raw JSON info */}
                    {parsed && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Additional Info
                        </label>
                        <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-3 rounded-lg border border-gray-200 overflow-x-auto text-gray-800">
                          {JSON.stringify(parsed, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })()}
          </Modal>

          {/* mobile sidebar button */}
          <button
            onClick={() => setIsOpenSidebar(true)}
            className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-orange-600 text-white rounded-full shadow-lg hover:bg-orange-700 transition-all flex items-center justify-center z-40"
          >
            <span className="text-lg font-bold">☰</span>
          </button>
        </main>
      </div>
    </div>
  );
}
