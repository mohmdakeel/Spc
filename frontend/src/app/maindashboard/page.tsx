// app/maindashboard/page.tsx - Enhanced version
'use client';
import RequireRole from '../../../components/guards/RequireRole';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { me } from '../../../lib/auth';
import { hasServiceAccess } from '../../../lib/authz';
import { Users, Car, Shield, ArrowRight, User } from 'lucide-react';

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
      requiredRoles: ['ADMIN', 'HR', 'HOD', 'GM', 'MANAGER']
    },
    {
      id: 'transport',
      title: 'Transport Service',
      description: 'Vehicles, Maintenance & Transport Requests',
      href: '/Akeel/Transport',
      icon: Car,
      color: 'from-orange-500 to-orange-600',
      iconColor: 'text-orange-100',
      requiredRoles: ['ADMIN', 'TRANSPORT_MANAGER', 'TRANSPORT_SUPERVISOR', 'TRANSPORT_STAFF', 'DRIVER']
    }
  ];

  const availableServices = services.filter(service => 
    user && hasServiceAccess(user, service.id as 'auth' | 'transport')
  );

  return (
    <RequireRole roles={['ADMIN']}>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-orange-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">SPC ERP System</h1>
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
                          Role: <span className="font-medium">{user.roles?.join(', ')}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Available Services */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Available Services</h2>
              <p className="text-sm text-gray-600">Choose a service to access</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {availableServices.map((service) => (
                <Link
                  key={service.id}
                  href={service.href}
                  className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-orange-300 overflow-hidden"
                >
                  <div className="p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${service.color} flex items-center justify-center shadow-md`}>
                        <service.icon className={`w-8 h-8 ${service.iconColor}`} />
                      </div>
                      <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-orange-700 transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed mb-4">
                      {service.description}
                    </p>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">Access granted</span>
                      <Shield className="w-4 h-4 text-green-500" />
                    </div>
                  </div>
                  
                  <div className={`h-1 bg-gradient-to-r ${service.color} group-hover:h-2 transition-all`} />
                </Link>
              ))}
            </div>

            {availableServices.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl shadow-lg border border-orange-200">
                <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Services Available</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  You don't have access to any services yet. Please contact your administrator.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </RequireRole>
  );
}