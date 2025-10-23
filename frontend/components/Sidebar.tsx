// components/Sidebar.tsx
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { 
  Home, 
  Users, 
  User, 
  Shield, 
  Settings, 
  History, 
  UserCircle,
  ChevronDown,
  ChevronUp,
  Car,
  LogOut
} from 'lucide-react';
import { logout } from '../lib/auth'; // Import the same logout function

interface SidebarProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
}

const SidebarItem: React.FC<{
  label: string;
  icon: React.ReactNode;
  children?: React.ReactNode;
  collapsed?: boolean;
  active?: boolean;
  onClick?: () => void;
}> = ({ label, icon, children, collapsed = false, active = false, onClick }) => {
  const [open, setOpen] = useState(active);

  const handleClick = () => {
    if (children) setOpen((s) => !s);
    onClick?.();
  };

  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={handleClick}
        aria-expanded={!collapsed && !!children ? open : undefined}
        className={`flex items-center justify-between w-full px-4 py-3 ${
          active ? 'bg-orange-600 text-white' : 'text-black hover:bg-orange-500 hover:text-white'
        } text-left transition-all rounded-lg group ${collapsed ? 'justify-center px-2' : ''}`}
      >
        <div className={`flex items-center gap-3 ${collapsed ? 'flex-col' : ''}`}>
          <span className="flex-shrink-0">{icon}</span>
          {!collapsed && (
            <span
              className={`text-sm font-medium truncate ${
                active ? 'text-white' : 'text-black group-hover:text-white'
              }`}
            >
              {label}
            </span>
          )}
        </div>
        {!collapsed && children && (
          <span className={active ? 'text-white' : 'text-black group-hover:text-white'}>
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        )}
      </button>

      {!collapsed && open && children && (
        <div className="ml-2 pl-6 mt-1 space-y-1 text-sm border-l-2 border-orange-300">{children}</div>
      )}
    </div>
  );
};

export default function Sidebar({ user, isOpen, onClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { text: 'Dashboard', icon: Home, path: '/dashboard', roles: ['ADMIN', 'HR', 'HOD', 'GM', 'TRANSPORT'] },
    { text: 'Employees', icon: Users, path: '/employees', roles: ['ADMIN', 'HR', 'HOD', 'GM', 'TRANSPORT'] },
    { text: 'Users', icon: User, path: '/users', roles: ['ADMIN', 'HR', 'HOD', 'GM', 'TRANSPORT'] },
    { text: 'Roles', icon: Shield, path: '/roles', roles: ['ADMIN'] },
    { text: 'Permissions', icon: Settings, path: '/permissions', roles: ['ADMIN', 'HR'] },
    { text: 'History', icon: History, path: '/history', roles: ['ADMIN', 'HR', 'HOD', 'GM', 'TRANSPORT'] },
    { text: 'Profile', icon: UserCircle, path: '/profile', roles: ['ADMIN', 'HR', 'HOD', 'GM', 'TRANSPORT'] },
  ];

  const filteredItems = menuItems.filter(item => 
    item.roles.some(role => user.roles.includes(role))
  );

  const handleLogout = async () => {
    try {
      await logout();
      // Redirect to login page immediately after logout
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
      // Still redirect to login even if there's an error
      window.location.href = '/login';
    }
  };

  return (
    <div className={`fixed inset-y-0 left-0 z-50 bg-orange-100 h-screen ${
      collapsed ? 'w-20' : 'w-64'
    } p-4 overflow-y-auto transition-all duration-300 ease-in-out flex flex-col shadow-[4px_0_20px_rgba(0,0,0,0.1)] ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    } md:relative md:translate-x-0`}>
      
      {/* Brand */}
      <div className="mb-6 flex flex-col items-center">
        {!collapsed ? (
          <>
            <div className="flex items-center gap-2 mb-2">
              <Car size={28} className="text-orange-600" />
              <h1 className="text-xl font-bold text-black truncate">SPC Transport</h1>
            </div>
            <p className="text-xs text-orange-800/80 truncate">Admin System</p>
          </>
        ) : (
          <Car size={28} className="text-orange-600" />
        )}
      </div>

      {/* Collapse toggle */}
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        aria-pressed={collapsed}
        className="hidden md:flex items-center justify-center p-2 mb-4 bg-orange-200 rounded-lg hover:bg-orange-300 transition-all text-black hover:text-white"
        title={collapsed ? 'Expand' : 'Collapse'}
      >
        {collapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
      </button>

      {/* Close button for mobile */}
      <button
        type="button"
        onClick={onClose}
        className="md:hidden absolute top-4 right-4 p-2 bg-orange-200 rounded-lg hover:bg-orange-300 transition-all text-black"
      >
        ×
      </button>

      {/* Dashboard */}
      <Link
        href="/dashboard"
        onClick={onClose}
        className={`flex items-center gap-2 px-4 py-3 rounded-lg mb-4 transition-all ${
          typeof window !== 'undefined' && window.location.pathname === '/dashboard'
            ? 'bg-orange-600 text-white'
            : 'bg-orange-200 text-black hover:bg-orange-500 hover:text-white'
        }`}
      >
        <Home size={20} />
        {!collapsed && <span>Dashboard</span>}
      </Link>

      {/* Menu Items */}
      <div className="space-y-1 flex-1">
        {filteredItems.filter(item => item.text !== 'Dashboard' && item.text !== 'Profile').map((item) => (
          <Link
            key={item.text}
            href={item.path}
            onClick={onClose}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              typeof window !== 'undefined' && window.location.pathname === item.path
                ? 'bg-orange-600 text-white'
                : 'text-black hover:bg-orange-500 hover:text-white'
            } ${collapsed ? 'justify-center px-2' : ''}`}
          >
            <item.icon size={20} />
            {!collapsed && <span className="text-sm font-medium">{item.text}</span>}
          </Link>
        ))}
      </div>

      {/* Footer buttons */}
      <div className="pt-4 border-t border-orange-300 mt-auto space-y-1">
        {/* Profile */}
        <Link
          href="/profile"
          onClick={onClose}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
            typeof window !== 'undefined' && window.location.pathname === '/profile'
              ? 'bg-orange-600 text-white'
              : 'text-black hover:bg-orange-500 hover:text-white'
          } ${collapsed ? 'justify-center px-2' : ''}`}
        >
          <UserCircle size={18} />
          {!collapsed && <span className="text-sm font-medium">Profile</span>}
        </Link>

        {/* Settings */}
        <Link
          href="/settings"
          onClick={onClose}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
            typeof window !== 'undefined' && window.location.pathname === '/settings'
              ? 'bg-orange-600 text-white'
              : 'text-black hover:bg-orange-500 hover:text-white'
          } ${collapsed ? 'justify-center px-2' : ''}`}
        >
          <Settings size={18} />
          {!collapsed && <span className="text-sm font-medium">Settings</span>}
        </Link>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full transition-all text-black hover:bg-red-500 hover:text-white ${
            collapsed ? 'justify-center px-2' : ''
          }`}
        >
          <LogOut size={18} />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );
}