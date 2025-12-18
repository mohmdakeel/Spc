// app/maindashboard/page.tsx - FIXED VERSION
'use client';
import RequireRole from '../../../components/guards/RequireRole';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { me } from '../../../lib/auth';
import { hasServiceAccess } from '../../../lib/authz';
import { Users, Car, Shield, ArrowRight, User, Home } from 'lucide-react';

export default function MainDashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => { 
    me().then(setUser).catch(() => {}).finally(() => setLoading(false)); 
  }, []);

  const services = [
    {
      id: 'auth',
      title: 'Auth Service',
      description: 'Users, Roles & Permissions Management',
      href: '/dashboard',
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      iconColor: 'text-blue-100',
    },
    {
      id: 'transport',
      title: 'Transport Service',
      description: 'Vehicles, Maintenance & Transport Requests',
      href: '/Akeel/Transport',
      icon: Car,
      color: 'from-orange-500 to-orange-600',
      iconColor: 'text-orange-100',
    }
  ];

  // Get available services for the current user
  const availableServices = services.filter(service => 
    user && hasServiceAccess(user, service.id as 'auth' | 'transport')
  );

  // Allow access to users who have either auth or transport service access
  const allowedRoles = [
    'ADMIN', 'HR', 'HRD', 'HOD', 'GM', 'CHAIRMAN',
    'TRANSPORT_ADMIN', 'TRANSPORT', 'VEHICLE_INCHARGE', 'GATE_SECURITY'
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <RequireRole roles={allowedRoles}>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-orange-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">SPC ERP System Portal</h1>
                {user && (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center border-2 border-orange-200">
                        <User className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-gray-800">
                          Welcome, {user.fullName || user.username}!
                        </p>
                        <p className="text-sm text-gray-600">
                          Roles: <span className="font-medium">{user.roles?.join(', ')}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Access to {availableServices.length} service{availableServices.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-4 lg:mt-0">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Home className="w-4 h-4" />
                  <span>Service Hub</span>
                </div>
              </div>
            </div>
          </div>

          {/* Available Services */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Available Services</h2>
                <p className="text-gray-600 mt-1">Choose a service to manage</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">
                  {availableServices.length} of {services.length} services
                </p>
              </div>
            </div>
            
            {availableServices.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {availableServices.map((service) => (
                  <Link
                    key={service.id}
                    href={service.href}
                    className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-orange-300 overflow-hidden transform hover:-translate-y-1"
                  >
                    <div className="p-8">
                      <div className="flex items-start justify-between mb-6">
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${service.color} flex items-center justify-center shadow-md group-hover:shadow-lg transition-all`}>
                          <service.icon className={`w-8 h-8 ${service.iconColor}`} />
                        </div>
                        <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-orange-600 group-hover:translate-x-2 transition-all duration-300" />
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-orange-700 transition-colors">
                        {service.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed mb-4">
                        {service.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-green-500" />
                          <span className="text-xs font-medium text-green-600">Access Granted</span>
                        </div>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          Click to enter
                        </span>
                      </div>
                    </div>
                    
                    <div className={`h-1 bg-gradient-to-r ${service.color} group-hover:h-2 transition-all duration-300`} />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-orange-200">
                <Shield className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">No Services Available</h3>
                <p className="text-gray-600 max-w-md mx-auto mb-6">
                  You don&apos;t currently have access to any services. Please contact your system administrator to request access.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                  >
                    Refresh Access
                  </button>
                  <button
                    onClick={() => window.history.back()}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          {availableServices.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">Available Services</p>
                    <p className="text-2xl font-bold mt-1">{availableServices.length}</p>
                  </div>
                  <Shield className="w-8 h-8 text-orange-200" />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Your Roles</p>
                    <p className="text-xl font-bold mt-1 capitalize">
                      {user?.roles?.length || 0}
                    </p>
                  </div>
                  <User className="w-8 h-8 text-blue-200" />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">System Status</p>
                    <p className="text-xl font-bold mt-1">Active</p>
                  </div>
                  <div className="w-3 h-3 bg-green-300 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </RequireRole>
  );
}
