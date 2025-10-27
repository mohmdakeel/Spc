// app/admin/history/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Topbar from '../../../components/Topbar';
import Sidebar from '../../../components/Sidebar';
import Modal from '../../../components/Modal';
import api from '../../../lib/api';
import { useAuth } from '../../../hooks/useAuth';
import { AuditLog } from '../../../types';
import {
  History as HistoryIcon,
  Eye,
  User,
  Shield,
  Calendar,
  FileText,
  Search
} from 'lucide-react';

type ViewMode = 'mine' | 'all';

export default function HistoryPage() {
  const { user } = useAuth();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [view, setView] = useState<ViewMode>('mine');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isOpenSidebar, setIsOpenSidebar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const isAdmin =
    !!user?.roles?.includes('ADMIN') ||
    !!user?.permissions?.includes('AUDIT_ALL');

  // Filter logs based on search term
  const filteredLogs = useMemo(() => {
    if (!searchTerm) return logs;
    
    const term = searchTerm.toLowerCase();
    return logs.filter(log => 
      log.actor?.toLowerCase().includes(term) ||
      log.action?.toLowerCase().includes(term) ||
      log.entityType?.toLowerCase().includes(term) ||
      log.entityId?.toString().includes(term) ||
      log.details?.toLowerCase().includes(term)
    );
  }, [logs, searchTerm]);

  // If a non-admin somehow ends up in 'all', snap back to 'mine'
  useEffect(() => {
    if (!isAdmin && view === 'all') setView('mine');
  }, [isAdmin, view]);

  useEffect(() => {
    if (!user) {
      setLogs([]);
      return;
    }
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, view]);

  const fetchLogs = async () => {
    if (!user) return;
    const endpoint = view === 'mine' ? '/users/history/me' : '/users/history';

    // Guard: non-admins never hit the all-history endpoint
    if (view === 'all' && !isAdmin) {
      setLogs([]);
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      const { data } = await api.get<AuditLog[]>(endpoint);
      setLogs(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error('Failed to fetch logs:', e);
      setErrorMessage(e?.response?.data?.message || 'Failed to fetch audit logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDetails(true);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString()
    };
  };

  const getActionColor = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('create') || actionLower.includes('add')) {
      return 'bg-green-100 text-green-800';
    }
    if (actionLower.includes('update') || actionLower.includes('modify')) {
      return 'bg-blue-100 text-blue-800';
    }
    if (actionLower.includes('delete') || actionLower.includes('remove')) {
      return 'bg-red-100 text-red-800';
    }
    if (actionLower.includes('read') || actionLower.includes('view')) {
      return 'bg-gray-100 text-gray-800';
    }
    return 'bg-orange-100 text-orange-800';
  };

  const detailsNode = useMemo(() => {
    if (!selectedLog?.details) return null;
    
    const raw = selectedLog.details;
    try {
      const obj = JSON.parse(raw);
      return (
        <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded-lg border border-gray-200 overflow-x-auto">
          {JSON.stringify(obj, null, 2)}
        </pre>
      );
    } catch {
      return (
        <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded-lg border border-gray-200">
          {raw}
        </pre>
      );
    }
  }, [selectedLog]);

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
    <div className="flex h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <Sidebar
        user={user}
        isOpen={isOpenSidebar}
        onClose={() => setIsOpenSidebar(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar user={user} />

        <main className="flex-1 overflow-y-auto p-6">
          {/* HEADER */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <HistoryIcon className="w-8 h-8 text-orange-600" />
              <h1 className="text-3xl font-bold text-gray-900">Audit History</h1>
            </div>
            <p className="text-gray-600">Track system activities and user actions</p>
          </div>

          {/* ERROR MESSAGE */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <Shield className="mr-2 text-red-600" /> 
              <span className="text-red-800">{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            {/* MAIN CONTENT - AUDIT LOGS TABLE */}
            <div className="xl:col-span-3">
              <div className="bg-white rounded-2xl shadow-lg border border-orange-200 overflow-hidden">
                <div className="p-6 border-b border-orange-200 bg-orange-50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-orange-600" />
                      {view === 'mine' ? 'My Activity History' : 'All System History'}
                    </h2>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      {/* Search Box */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Search logs..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                        />
                      </div>

                      {/* View Toggle - Only for admins */}
                      {isAdmin && (
                        <button
                          onClick={() => setView(view === 'mine' ? 'all' : 'mine')}
                          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                        >
                          {view === 'mine' ? 'View All History' : 'View My History'}
                        </button>
                      )}
                    </div>
                  </div>

                  {!isAdmin && (
                    <p className="text-sm text-gray-600 mt-2">
                      You are viewing your own activity history.
                    </p>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-orange-50">
                      <tr>
                        <th className="p-3 text-left text-sm font-semibold text-gray-700">Actor</th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-700">Action</th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-700">Entity</th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-700">ID</th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-700">Time</th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-gray-500">
                            <div className="flex items-center justify-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                              Loading audit logs...
                            </div>
                          </td>
                        </tr>
                      ) : filteredLogs.length > 0 ? (
                        filteredLogs.map((log) => {
                          const { date, time } = formatDateTime(log.atTime);
                          return (
                            <tr 
                              key={log.id} 
                              className="border-b hover:bg-orange-50 transition-colors cursor-pointer"
                              onClick={() => handleRowClick(log)}
                            >
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-gray-400" />
                                  <span className="font-medium text-gray-900">{log.actor}</span>
                                </div>
                              </td>
                              <td className="p-3">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                                  {log.action}
                                </span>
                              </td>
                              <td className="p-3 text-gray-600">{log.entityType}</td>
                              <td className="p-3">
                                <code className="text-sm bg-gray-100 px-2 py-1 rounded">{log.entityId}</code>
                              </td>
                              <td className="p-3">
                                <div className="text-sm">
                                  <div className="text-gray-900">{date}</div>
                                  <div className="text-gray-500">{time}</div>
                                </div>
                              </td>
                              <td className="p-3">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRowClick(log);
                                  }}
                                  className="flex items-center px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  View
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-gray-500">
                            <div className="flex flex-col items-center gap-2">
                              <FileText className="w-8 h-8 text-gray-400" />
                              {searchTerm ? 'No matching audit logs found' : 'No audit logs available'}
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN - INFO & STATS */}
            <div className="space-y-6">
              {/* QUICK STATS */}
              <div className="bg-white rounded-2xl shadow-lg border border-orange-200 overflow-hidden">
                <div className="p-6 border-b border-orange-200 bg-orange-50">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-orange-600" />
                    Quick Stats
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Logs</span>
                    <span className="text-2xl font-bold text-orange-600">{logs.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Filtered</span>
                    <span className="text-2xl font-bold text-blue-600">{filteredLogs.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Viewing</span>
                    <span className="text-lg font-semibold text-gray-800 capitalize">{view}</span>
                  </div>
                </div>
              </div>

              {/* VIEW INFORMATION */}
              <div className="bg-white rounded-2xl shadow-lg border border-orange-200 overflow-hidden">
                <div className="p-6 border-b border-orange-200 bg-orange-50">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-orange-600" />
                    View Information
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <h3 className="font-semibold text-blue-800 text-sm mb-1">My History</h3>
                      <p className="text-blue-700 text-xs">Shows only your own activities and actions</p>
                    </div>
                    
                    {isAdmin && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <h3 className="font-semibold text-green-800 text-sm mb-1">All History</h3>
                        <p className="text-green-700 text-xs">Complete system audit trail (Admin only)</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* DETAILS MODAL */}
          <Modal 
            isOpen={showDetails} 
            onClose={() => setShowDetails(false)} 
            title="Audit Log Details"
            size="lg"
            showFooter={false}
          >
            {selectedLog && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Actor</label>
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{selectedLog.actor}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getActionColor(selectedLog.action)}`}>
                      {selectedLog.action}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
                    <p className="p-2 bg-gray-50 rounded-lg text-gray-900">{selectedLog.entityType}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Entity ID</label>
                    <code className="block p-2 bg-gray-50 rounded-lg text-gray-900 font-mono text-sm">
                      {selectedLog.entityId}
                    </code>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Timestamp</label>
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">
                        {new Date(selectedLog.atTime).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedLog.details && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Details</label>
                    {detailsNode}
                  </div>
                )}
              </div>
            )}
          </Modal>

          {/* Mobile Menu Button */}
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