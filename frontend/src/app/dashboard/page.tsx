// app/dashboard/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import Topbar from '../../../components/Topbar';
import Sidebar from '../../../components/Sidebar';
import { useAuth } from '../../../hooks/useAuth';
import api from '../../../lib/api';

import {
  Users,
  User,
  History as HistoryIcon,
  Activity,
} from 'lucide-react';

import { AuditLog } from '../../../types';

export default function Dashboard() {
  const { user } = useAuth();

  // ========================
  // STATE
  // ========================
  const [stats, setStats] = useState({
    employees: 0,
    users: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState('');

  const [isOpenSidebar, setIsOpenSidebar] = useState(false);

  // ========================
  // HELPERS
  // ========================
  const isAdmin = useMemo(() => {
    return (
      !!user?.roles?.includes('ADMIN') ||
      !!user?.permissions?.includes('AUDIT_ALL')
    );
  }, [user]);

  const toggleSidebar = () => setIsOpenSidebar(!isOpenSidebar);

  // ========================
  // FETCH STATS (employees / users)
  // ========================
  useEffect(() => {
    if (!user) return;

    setStatsLoading(true);
    Promise.all([
      api
        .get('/registrations')
        .then((res) =>
          setStats((prev) => ({
            ...prev,
            employees: Array.isArray(res.data) ? res.data.length : 0,
          })),
        ),
      api
        .get('/users')
        .then((res) =>
          setStats((prev) => ({
            ...prev,
            users: Array.isArray(res.data) ? res.data.length : 0,
          })),
        ),
    ])
      .catch((err) => {
        console.error('Failed to load stats', err);
        setStats({ employees: 0, users: 0 });
      })
      .finally(() => {
        setStatsLoading(false);
      });
  }, [user]);

  // ========================
  // FETCH RECENT ACTIVITY (audit logs)
  // show latest few logs, real data only
  // ========================
  useEffect(() => {
    if (!user) return;

    const endpoint = isAdmin
      ? '/users/history' // admin: can see all
      : '/users/history/me'; // non-admin: only own

    setLogsLoading(true);
    setLogsError('');
    api
      .get<AuditLog[]>(endpoint)
      .then((res) => {
        const allLogs = Array.isArray(res.data) ? res.data : [];
        // just take the latest 5 (or fewer)
        const latest = allLogs
          .slice() // copy
          .sort(
            (a, b) =>
              new Date(b.atTime).getTime() - new Date(a.atTime).getTime(),
          )
          .slice(0, 5);
        setRecentLogs(latest);
      })
      .catch((err) => {
        console.error('Failed to load recent logs', err);
        setRecentLogs([]);
        setLogsError(
          err?.response?.data?.message || 'Failed to load recent activity',
        );
      })
      .finally(() => {
        setLogsLoading(false);
      });
  }, [user, isAdmin]);

  // ========================
  // QUICK LINKS CONFIG
  // ========================
  const quickLinks = [
    {
      title: 'Manage Employees',
      description: 'Add, edit, and manage employee records',
      href: '/employees',
      icon: Users,
      color: 'bg-orange-500 hover:bg-orange-600',
      iconColor: 'text-white',
    },
    {
      title: 'Manage Users',
      description: 'Manage system users and access',
      href: '/users',
      icon: User,
      color: 'bg-blue-500 hover:bg-blue-600',
      iconColor: 'text-white',
    },
    {
      title: 'View History',
      description: 'Access system activity logs',
      href: '/admin/history', // <- align with your history route
      icon: HistoryIcon,
      color: 'bg-purple-500 hover:bg-purple-600',
      iconColor: 'text-white',
    },
  ];

  // ========================
  // RENDER
  // ========================
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      {/* Sidebar */}
      <Sidebar user={user} isOpen={isOpenSidebar} onClose={toggleSidebar} />

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar user={user} />

        <main className="flex-1 overflow-y-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Dashboard Overview
            </h1>
            <p className="text-gray-600">
              Welcome back, {user.username ?? user.email}.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Employees */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-orange-200 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
                {statsLoading ? (
                  <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Activity className="w-5 h-5 text-green-500" />
                )}
              </div>

              <h3 className="text-sm font-medium text-gray-600 mb-2">
                Total Employees
              </h3>

              {statsLoading ? (
                <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <p className="text-3xl font-bold text-gray-900">
                  {stats.employees}
                </p>
              )}
            </div>

            {/* Users */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-200 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                {statsLoading ? (
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Activity className="w-5 h-5 text-blue-500" />
                )}
              </div>

              <h3 className="text-sm font-medium text-gray-600 mb-2">
                System Users
              </h3>

              {statsLoading ? (
                <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <p className="text-3xl font-bold text-gray-900">
                  {stats.users}
                </p>
              )}
            </div>

            {/* System Status */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div className="w-3 h-3 bg-green-300 rounded-full animate-pulse"></div>
              </div>

              <h3 className="text-sm font-medium text-orange-100 mb-2">
                System Status
              </h3>

              <div className="flex items-baseline justify-between">
                <p className="text-3xl font-bold">Operational</p>
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full font-medium">
                  Online
                </span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-orange-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
              <p className="text-sm text-gray-600">
                Frequently accessed sections
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickLinks.map((link) => (
                <a
                  key={link.title}
                  href={link.href}
                  className="group p-4 rounded-xl border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all duration-200 flex items-center gap-4"
                >
                  <div
                    className={`w-12 h-12 ${link.color} rounded-xl flex items-center justify-center shadow-sm group-hover:shadow transition-all`}
                  >
                    <link.icon
                      className={`w-6 h-6 ${link.iconColor}`}
                    />
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-orange-700 transition-colors">
                      {link.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {link.description}
                    </p>
                  </div>

                  <HistoryIcon className="w-5 h-5 text-gray-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
                </a>
              ))}
            </div>
          </div>

          {/* Recent Activity (REAL DATA) */}
          <div className="mt-8 bg-white rounded-2xl shadow-lg p-6 border border-orange-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <HistoryIcon className="w-5 h-5 text-orange-600" />
                Recent Activity
              </h2>

              {isAdmin ? (
                <span className="text-xs bg-gray-900 text-white px-2 py-1 rounded-full">
                  Admin View
                </span>
              ) : (
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                  My Activity
                </span>
              )}
            </div>

            {logsError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded border border-red-200 text-sm">
                {logsError}
              </div>
            )}

            {logsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-3 rounded-lg border border-gray-100"
                  >
                    <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-1/3 animate-pulse" />
                      <div className="h-3 bg-gray-100 rounded w-1/4 animate-pulse" />
                    </div>
                    <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : recentLogs.length === 0 ? (
              <p className="text-sm text-gray-500">No recent activity.</p>
            ) : (
              <div className="space-y-4">
                {recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:bg-orange-50 transition-colors"
                  >
                    {/* Left icon */}
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <Activity className="w-4 h-4 text-orange-600" />
                    </div>

                    {/* Middle text */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {log.actor} {log.action} {log.entityType}
                        {log.entityId ? ` (#${log.entityId})` : ''}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {new Date(log.atTime).toLocaleString()}
                      </p>
                    </div>

                    {/* Right badge */}
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full whitespace-nowrap">
                      {log.entityType || 'Activity'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mobile Sidebar Button */}
          <button
            className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-orange-600 text-white rounded-full shadow-lg hover:bg-orange-700 transition-all flex items-center justify-center z-40"
            onClick={toggleSidebar}
          >
            <span className="text-lg font-bold">☰</span>
          </button>
        </main>
      </div>
    </div>
  );
}
