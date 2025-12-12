'use client';

import { useEffect, useMemo, useState } from 'react';
import Topbar from '../../../components/Topbar';
import Sidebar from '../../../components/Sidebar';
import { useAuth } from '../../../hooks/useAuth';
import api from '../../../lib/api';
import { User as UserType, Registration } from '../../../types';
import { printDocument, escapeHtml } from '../../../lib/print';
import { readCache, writeCache } from '../../../lib/cache';
import {
  BarChart3,
  Users,
  ClipboardList,
  Search,
  Printer,
  FileText,
} from 'lucide-react';

const formatPrintValue = (value?: string | number | null) => {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return escapeHtml(trimmed.length ? trimmed : '—');
  }
  return escapeHtml(String(value));
};

export default function ReportsPage() {
  const { user } = useAuth();
  const [isOpenSidebar, setIsOpenSidebar] = useState(false);
  const cachedUsers = readCache<UserType[]>('cache:auth:reports:users') || [];
  const cachedEmployees = readCache<Registration[]>('cache:auth:reports:employees') || [];
  const [usersList, setUsersList] = useState<UserType[]>(cachedUsers);
  const [employees, setEmployees] = useState<Registration[]>(cachedEmployees);
  const [loading, setLoading] = useState(!cachedUsers.length && !cachedEmployees.length);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [tab, setTab] = useState<'users' | 'employees'>('users');

  useEffect(() => {
    if (!user) return;
    const silent = !!cachedUsers.length || !!cachedEmployees.length;
    if (silent) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    Promise.all([api.get('/users'), api.get('/registrations')])
      .then(([usersRes, regRes]) => {
        const usersData = Array.isArray(usersRes.data) ? usersRes.data : [];
        const regsData = Array.isArray(regRes.data) ? regRes.data : [];
        setUsersList(usersData);
        setEmployees(regsData);
        writeCache('cache:auth:reports:users', usersData);
        writeCache('cache:auth:reports:employees', regsData);
      })
      .catch(() => {
        setUsersList((prev) => prev || []);
        setEmployees((prev) => prev || []);
      })
      .finally(() => {
        setLoading(false);
        setIsRefreshing(false);
      });
  }, [user]);

  const filteredUsers = useMemo(() => {
    const term = userSearch.trim().toLowerCase();
    if (!term) return usersList;
    return usersList.filter(
      (u) =>
        u.username?.toLowerCase().includes(term) ||
        u.fullName?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term)
    );
  }, [usersList, userSearch]);

  const filteredEmployees = useMemo(() => {
    const term = employeeSearch.trim().toLowerCase();
    if (!term) return employees;
    return employees.filter(
      (r) =>
        r.epfNo?.toLowerCase().includes(term) ||
        r.fullName?.toLowerCase().includes(term) ||
        r.department?.toLowerCase().includes(term)
    );
  }, [employees, employeeSearch]);

  const handlePrintUsersReport = () => {
    const rows = filteredUsers;
    const tableRows = rows
      .map(
        (u, index) => `
        <tr>
          <td>${formatPrintValue(index + 1)}</td>
          <td>${formatPrintValue(u.username)}</td>
          <td>${formatPrintValue(u.fullName)}</td>
          <td>${formatPrintValue(u.email)}</td>
          <td>${formatPrintValue(u.department)}</td>
          <td>${formatPrintValue((u.roles || []).join(', '))}</td>
        </tr>
      `
      )
      .join('');

    const tableHtml = rows.length
      ? `<table class="spc-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Username</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Roles</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>`
      : '<div class="spc-empty">No user records match the current filters.</div>';

    printDocument({
      title: 'User Report',
      subtitle: rows.length ? `Visible users: ${rows.length}` : undefined,
      contentHtml: tableHtml,
      printedBy: user?.fullName?.trim() || user?.username || undefined,
    });
  };

  const handlePrintEmployeesReport = () => {
    const rows = filteredEmployees;
    const tableRows = rows
      .map(
        (emp, index) => `
        <tr>
          <td>${formatPrintValue(index + 1)}</td>
          <td>${formatPrintValue(emp.epfNo)}</td>
          <td>${formatPrintValue(emp.fullName)}</td>
          <td>${formatPrintValue(emp.department)}</td>
          <td>${formatPrintValue(emp.mobileNo)}</td>
          <td>${formatPrintValue(emp.workingStatus)}</td>
        </tr>
      `
      )
      .join('');

    const tableHtml = rows.length
      ? `<table class="spc-table">
          <thead>
            <tr>
              <th>#</th>
              <th>EPF No</th>
              <th>Full Name</th>
              <th>Department</th>
              <th>Mobile</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>`
      : '<div class="spc-empty">No employee records match the current filters.</div>';

    printDocument({
      title: 'Employee Report',
      subtitle: rows.length ? `Visible employees: ${rows.length}` : undefined,
      contentHtml: tableHtml,
      printedBy: user?.fullName?.trim() || user?.username || undefined,
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <Sidebar user={user} isOpen={isOpenSidebar} onClose={() => setIsOpenSidebar(false)} />
      <div className="auth-shell__main overflow-hidden">
        <Topbar user={user} />
        <main className="auth-shell__content">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-8 h-8 text-orange-600" />
              <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
            </div>
            <p className="text-gray-600">Overview of key user and employee metrics</p>
            {isRefreshing && (
              <div className="mt-2 text-xs text-orange-700 flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                Updating data…
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl border border-orange-200 p-6 shadow">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900">{usersList.length}</p>
                </div>
                <Users className="w-10 h-10 text-orange-600" />
              </div>
              <p className="text-xs text-gray-500">
                Includes every account stored in the Auth Service.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-orange-200 p-6 shadow">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500">Employees</p>
                  <p className="text-3xl font-bold text-gray-900">{employees.length}</p>
                </div>
                <ClipboardList className="w-10 h-10 text-orange-600" />
              </div>
              <p className="text-xs text-gray-500">
                Active records pulled from the employee registry.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-orange-200 p-6 shadow">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500">Reports Generated</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {filteredUsers.length + filteredEmployees.length}
                  </p>
                </div>
                <FileText className="w-10 h-10 text-orange-600" />
              </div>
              <p className="text-xs text-gray-500">
                Combined count of visible rows below.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-orange-200 shadow">
              <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-gray-600">Loading reports...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setTab('users')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border ${
                    tab === 'users'
                      ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                      : 'bg-white text-orange-900 border-orange-200 hover:bg-orange-50'
                  }`}
                >
                  User Report
                </button>
                <button
                  type="button"
                  onClick={() => setTab('employees')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border ${
                    tab === 'employees'
                      ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                      : 'bg-white text-orange-900 border-orange-200 hover:bg-orange-50'
                  }`}
                >
                  Employee Report
                </button>
              </div>

              {tab === 'users' ? (
                <section className="bg-white rounded-2xl border border-orange-200 shadow overflow-hidden">
                  <div className="p-6 border-b border-orange-200 bg-orange-50 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <Users className="w-5 h-5 text-orange-600" />
                      User Report
                    </h2>
                    <div className="flex gap-3">
                      <div className="relative">
                        <label htmlFor="userReportSearch" className="sr-only">
                          Search users in report
                        </label>
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          id="userReportSearch"
                          name="userReportSearch"
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          placeholder="Search users..."
                          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                        />
                      </div>
                      <button
                        onClick={handlePrintUsersReport}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm flex items-center gap-2 hover:bg-gray-700 transition-colors"
                      >
                        <Printer className="w-4 h-4" />
                        Print
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full table-auto">
                      <thead className="bg-orange-50">
                        <tr>
                          <th className="p-3 text-left text-sm text-gray-700 font-semibold">Username</th>
                          <th className="p-3 text-left text-sm text-gray-700 font-semibold">Full Name</th>
                          <th className="p-3 text-left text-sm text-gray-700 font-semibold">Email</th>
                          <th className="p-3 text-left text-sm text-gray-700 font-semibold">Department</th>
                          <th className="p-3 text-left text-sm text-gray-700 font-semibold">Roles</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredUsers.map((u) => (
                          <tr key={u.id ?? u.username}>
                            <td className="p-3 text-gray-900">{u.username}</td>
                            <td className="p-3 text-gray-600">{u.fullName || '—'}</td>
                            <td className="p-3 text-gray-600">{u.email || '—'}</td>
                            <td className="p-3 text-gray-600">{u.department || '—'}</td>
                            <td className="p-3 text-gray-600">
                              {(u.roles || []).length ? u.roles.join(', ') : '—'}
                            </td>
                          </tr>
                        ))}
                        {!filteredUsers.length && (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-gray-500">
                              No users match your filter.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              ) : (
                <section className="bg-white rounded-2xl border border-orange-200 shadow overflow-hidden">
                  <div className="p-6 border-b border-orange-200 bg-orange-50 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-orange-600" />
                      Employee Report
                    </h2>
                    <div className="flex gap-3">
                      <div className="relative">
                        <label htmlFor="employeeReportSearch" className="sr-only">
                          Search employees in report
                        </label>
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          id="employeeReportSearch"
                          name="employeeReportSearch"
                          value={employeeSearch}
                          onChange={(e) => setEmployeeSearch(e.target.value)}
                          placeholder="Search employees..."
                          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                        />
                      </div>
                      <button
                        onClick={handlePrintEmployeesReport}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm flex items-center gap-2 hover:bg-gray-700 transition-colors"
                      >
                        <Printer className="w-4 h-4" />
                        Print
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full table-auto">
                      <thead className="bg-orange-50">
                        <tr>
                          <th className="p-3 text-left text-sm text-gray-700 font-semibold">EPF No</th>
                          <th className="p-3 text-left text-sm text-gray-700 font-semibold">Full Name</th>
                          <th className="p-3 text-left text-sm text-gray-700 font-semibold">Department</th>
                          <th className="p-3 text-left text-sm text-gray-700 font-semibold">Mobile</th>
                          <th className="p-3 text-left text-sm text-gray-700 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredEmployees.map((emp) => (
                          <tr key={emp.id ?? emp.epfNo}>
                            <td className="p-3 text-gray-900">{emp.epfNo}</td>
                            <td className="p-3 text-gray-600">{emp.fullName}</td>
                            <td className="p-3 text-gray-600">{emp.department || '—'}</td>
                            <td className="p-3 text-gray-600">{emp.mobileNo || '—'}</td>
                            <td className="p-3 text-gray-600">{emp.workingStatus || '—'}</td>
                          </tr>
                        ))}
                        {!filteredEmployees.length && (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-gray-500">
                              No employees match your filter.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </div>
          )}

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
