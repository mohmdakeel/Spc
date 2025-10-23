// app/dashboard/page.tsx
'use client';
import { useState, useEffect } from 'react';
import Topbar from '../../../components/Topbar';
import Sidebar from '../../../components/Sidebar';
import { useAuth } from '../../../hooks/useAuth';
import api from '../../../lib/api';
import { Users, User, History, ArrowRight, Plus, TrendingUp, Activity } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ employees: 0, users: 0 });
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (user) {
      Promise.all([
        api.get('/registrations').then(res => setStats(prev => ({ ...prev, employees: res.data.length }))),
        api.get('/users').then(res => setStats(prev => ({ ...prev, users: res.data.length })))
      ]).finally(() => setLoading(false));
    }
  }, [user]);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const quickLinks = [
    {
      title: 'Manage Employees',
      description: 'Add, edit, and manage employee records',
      href: '/employees',
      icon: Users,
      color: 'bg-orange-500 hover:bg-orange-600',
      iconColor: 'text-white'
    },
    {
      title: 'Manage Users',
      description: 'Manage system users and access',
      href: '/users',
      icon: User,
      color: 'bg-blue-500 hover:bg-blue-600',
      iconColor: 'text-white'
    },
    {
      title: 'View History',
      description: 'Access system activity logs',
      href: '/history',
      icon: History,
      color: 'bg-purple-500 hover:bg-purple-600',
      iconColor: 'text-white'
    }
  ];

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
      <Sidebar user={user} isOpen={isOpen} onClose={toggleSidebar} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar user={user} />
        <main className="flex-1 overflow-y-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
            <p className="text-gray-600">Welcome back! Here's what's happening today.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Employees Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-orange-200 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
                {loading ? (
                  <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <TrendingUp className="w-5 h-5 text-green-500" />
                )}
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Total Employees</h3>
              <div className="flex items-baseline justify-between">
                {loading ? (
                  <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  <p className="text-3xl font-bold text-gray-900">{stats.employees}</p>
                )}
                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full font-medium">
                  +12%
                </span>
              </div>
            </div>

            {/* Users Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-200 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                {loading ? (
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Activity className="w-5 h-5 text-blue-500" />
                )}
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">System Users</h3>
              <div className="flex items-baseline justify-between">
                {loading ? (
                  <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  <p className="text-3xl font-bold text-gray-900">{stats.users}</p>
                )}
                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full font-medium">
                  +5%
                </span>
              </div>
            </div>

            {/* System Status Card */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div className="w-3 h-3 bg-green-300 rounded-full animate-pulse"></div>
              </div>
              <h3 className="text-sm font-medium text-orange-100 mb-2">System Status</h3>
              <div className="flex items-baseline justify-between">
                <p className="text-3xl font-bold">Operational</p>
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full font-medium">
                  All Systems Go
                </span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-orange-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
              <p className="text-sm text-gray-600">Frequently accessed sections</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickLinks.map((link, index) => (
                <a
                  key={link.title}
                  href={link.href}
                  className="group p-4 rounded-xl border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all duration-200 flex items-center gap-4"
                >
                  <div className={`w-12 h-12 ${link.color} rounded-xl flex items-center justify-center shadow-sm group-hover:shadow transition-all`}>
                    <link.icon className={`w-6 h-6 ${link.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-orange-700 transition-colors">
                      {link.title}
                    </h3>
                    <p className="text-sm text-gray-600">{link.description}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
                </a>
              ))}
            </div>
          </div>

          {/* Recent Activity Section */}
          <div className="mt-8 bg-white rounded-2xl shadow-lg p-6 border border-orange-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h2>
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:bg-orange-50 transition-colors">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <Plus className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      New employee registered
                    </p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                    Employee
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Menu Button */}
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