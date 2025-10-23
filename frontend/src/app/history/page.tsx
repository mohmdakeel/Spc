// app/admin/history/page.tsx (or your existing file path)
'use client';

import { useEffect, useMemo, useState } from 'react';
import Topbar from '../../../components/Topbar';
import Sidebar from '../../../components/Sidebar';
import api from '../../../lib/api';
import { useAuth } from '../../../hooks/useAuth';
import { AuditLog } from '../../../types';
import { History as HistoryIcon } from 'lucide-react';

type ViewMode = 'mine' | 'all';

export default function HistoryPage() {
  const { user } = useAuth();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [view, setView] = useState<ViewMode>('mine');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isOpenSidebar, setIsOpenSidebar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>('');

  const isAdmin =
    !!user?.roles?.includes('ADMIN') ||
    !!user?.permissions?.includes('AUDIT_ALL'); // optional: support a permission flag

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
    setErr('');
    try {
      const { data } = await api.get<AuditLog[]>(endpoint);
      setLogs(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error('Failed to fetch logs:', e);
      setErr(e?.response?.data?.message || 'Failed to fetch logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDetails(true);
  };

  const toggleSidebar = () => setIsOpenSidebar(!isOpenSidebar);

  const detailsNode = useMemo(() => {
    if (!selectedLog) return null;
    const raw = selectedLog.details ?? '';
    try {
      const obj = JSON.parse(raw);
      return (
        <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-2 rounded overflow-x-auto">
          {JSON.stringify(obj, null, 2)}
        </pre>
      );
    } catch {
      return <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-2 rounded">{raw}</pre>;
    }
  }, [selectedLog]);

  if (!user) return <div className="p-6">Loading...</div>;

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar user={user} isOpen={isOpenSidebar} onClose={toggleSidebar} />
      <div className="flex-1 flex flex-col">
        <Topbar user={user} />
        <main className="flex-1 p-6 overflow-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <HistoryIcon className="w-6 h-6" />
              Audit History
            </h1>
            {/* Only admins get the toggle */}
            {isAdmin && (
              <button
                onClick={() => setView(view === 'mine' ? 'all' : 'mine')}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                {view === 'mine' ? 'View All History' : 'View My History'}
              </button>
            )}
          </div>

          {!isAdmin && (
            <p className="mb-3 text-sm text-gray-600">
              You are viewing your own history.
            </p>
          )}

          {err && (
            <div className="mb-3 p-3 bg-red-50 text-red-700 rounded border border-red-200">
              {err}
            </div>
          )}

          <div className="w-full bg-white rounded shadow">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2 text-left">Actor</th>
                  <th className="p-2 text-left">Action</th>
                  <th className="p-2 text-left">Entity</th>
                  <th className="p-2 text-left">ID</th>
                  <th className="p-2 text-left">Details</th>
                  <th className="p-2 text-left">Time</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center">
                      Loading...
                    </td>
                  </tr>
                ) : logs.length > 0 ? (
                  logs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleRowClick(log)}
                    >
                      <td className="p-2">{log.actor}</td>
                      <td className="p-2">{log.action}</td>
                      <td className="p-2">{log.entityType}</td>
                      <td className="p-2">{log.entityId}</td>
                      <td className="p-2 truncate max-w-xs">{log.details}</td>
                      <td className="p-2">{new Date(log.atTime).toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-gray-500">
                      No history available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Details modal */}
          {showDetails && selectedLog && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded max-w-lg w-full m-4 overflow-y-auto max-h-[80vh]">
                <h2 className="text-xl font-bold mb-4">Log Details</h2>
                <div className="space-y-2 text-sm">
                  <p><strong>Actor:</strong> {selectedLog.actor}</p>
                  <p><strong>Action:</strong> {selectedLog.action}</p>
                  <p><strong>Entity Type:</strong> {selectedLog.entityType}</p>
                  <p><strong>Entity ID:</strong> {selectedLog.entityId}</p>
                  <div>
                    <p className="font-semibold mb-1">Details:</p>
                    {detailsNode}
                  </div>
                  <p><strong>Time:</strong> {new Date(selectedLog.atTime).toLocaleString()}</p>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setShowDetails(false)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={toggleSidebar}
            className="md:hidden fixed top-4 left-4 p-2 bg-gray-200 rounded"
          >
            Menu
          </button>
        </main>
      </div>
    </div>
  );
}
