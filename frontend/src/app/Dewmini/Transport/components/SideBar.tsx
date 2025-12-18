'use client';

import React, { useCallback, useMemo, useState, PropsWithChildren } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  ChevronDown,
  ChevronUp,
  Home,
  Car,
  Wrench,
  FileText,
  Shield,
  PieChart,
  Settings,
  ClipboardList,
  User,
  Link as LinkIcon,
  MapPin,
  Droplet,
  CalendarCheck,
  FileDigit,
  CalendarClock,
  Truck,
  Users,
  Building,
  LogOut,
} from 'lucide-react';

// SidebarItemProps and SidebarItem component remain the same for brevity

// --- (SidebarItem component code remains the same) ---

type SidebarItemProps = {
    label: string;
    icon: React.ReactNode;
    children?: React.ReactNode;
    collapsed?: boolean;
    active?: boolean;
    onClick?: () => void;
};

const SidebarItem: React.FC<SidebarItemProps> = ({
    label,
    icon,
    children,
    collapsed = false,
    active = false,
    onClick,
}) => {
    const [open, setOpen] = useState(active); // open group if active on load

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
// --- (SidebarItem component code remains the same) ---


const Sidebar: React.FC<PropsWithChildren> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const collapsed = false;

  const go = (path: string) => router.push(path);
  const isActive = useCallback(
    (path: string) => pathname === path || pathname?.startsWith(path + '/'),
    [pathname]
  );

  // Group active detection (Logic remains the same)
  const vehicleMgmtActive = useMemo(
    () =>
      [
        '/Akeel/Transport/Vehicle',
        '/Akeel/Transport/Driver',
        '/Akeel/Transport/AssignVehicle',
        '/Akeel/Transport/GPSTracking',
        '/Akeel/Transport/Fuel',
      ].some(isActive),
    [isActive]
  );

  const vehicleMaintActive = useMemo(
    () =>
      [
        '/Dewmini/Transport/Admin/DriverServiceRequests', // <- Updated route
        '/Akeel/Transport/Maintenance/Schedule',
        '/Akeel/Transport/Maintenance/Log',
        '/Akeel/Transport/Maintenance/SupplierBills',
      ].some(isActive),
    [isActive]
  );

  const usageReqActive = useMemo(
    () =>
      [
        '/Akeel/Transport/Usage/Department',
        '/Akeel/Transport/Usage/Approved',
        '/Akeel/Transport/Usage/Scheduling',
        '/Akeel/Transport/Usage/Dispatch',
        '/Akeel/Transport/Usage/Receive',
      ].some(isActive),
    [isActive]
  );

  const gateSecActive = useMemo(
    () =>
      [
        '/Akeel/Transport/Gate/Scheduled',
        '/Akeel/Transport/Gate/Visitors',
        '/Akeel/Transport/Gate/Company',
      ].some(isActive),
    [isActive]
  );

  const handleLogout = () => {
    // TODO: wire up your logout
    console.log('Logging out…');
    // router.push('/login');
  };

  return (
    // 1. Ensure this outer div spans the full height of the viewport
    <div className="flex min-h-screen"> 
      <aside
        // CRITICAL FIX: Removed h-full and overflow-y-auto from <aside>.
        // Added 'flex flex-col' to enable children (Brand/Groups/Footer) to use flex sizing.
        className="hod-sidebar bg-orange-100 border-r border-orange-200 min-h-screen w-64 min-w-64 p-4 transition-all duration-300 ease-in-out flex flex-col shadow-[4px_0_20px_rgba(0,0,0,0.1)] sticky top-0"
      >
        
        {/* Brand (Fixed Top) */}
        <div className="mb-6 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl border border-orange-200 bg-white/80 flex items-center justify-center shadow-sm">
            <Image
              src="/spclogopic.png"
              alt="State Printing Corporation logo"
              width={36}
              height={36}
              className="object-contain"
              priority
            />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-sm text-orange-900 leading-tight truncate">
              State Printing Corporation
            </h1>
            <p className="text-xs text-orange-700/70 truncate">Transport Service</p>
          </div>
        </div>

        {/* Dashboard (Fixed Top) */}
        <button
          type="button"
          onClick={() => go('/Akeel/Transport')}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg mb-4 transition-all ${
            isActive('/Akeel/Transport')
              ? 'bg-orange-600 text-white'
              : 'bg-orange-200 text-black hover:bg-orange-500 hover:text-white'
          }`}
        >
          <Home size={20} />
          <span>Dashboard</span>
        </button>

        {/* CRITICAL FIX: Menu Groups Area (Scrollable Middle) */}
        {/* Added overflow-y-auto here. flex-1 ensures it takes all vertical space available between top and footer. */}
        <div className="space-y-1 flex-1 overflow-y-auto pb-4 pr-1"> 
          <SidebarItem label="Vehicle Management" icon={<Car size={20} />} collapsed={collapsed} active={vehicleMgmtActive}>
            <button
              type="button"
              onClick={() => go('/Akeel/Transport/Vehicle')}
              className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg transition-all ${
                isActive('/Akeel/Transport/Vehicle') ? 'bg-orange-600 text-white' : 'text-black hover:text-white hover:bg-orange-500'
              }`}
            >
              <ClipboardList size={16} /> Vehicle Register
            </button>
            <button
              type="button"
              onClick={() => go('/Akeel/Transport/Driver')}
              className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg transition-all ${
                isActive('/Akeel/Transport/Driver') ? 'bg-orange-600 text-white' : 'text-black hover:text-white hover:bg-orange-500'
              }`}
            >
              <User size={16} /> Driver Register
            </button>
            <button
              type="button"
              onClick={() => go('/Akeel/Transport/Usage/AssignVehicle')}
              className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg transition-all ${
                isActive('/Akeel/Transport/AssignVehicle') ? 'bg-orange-600 text-white' : 'text-black hover:text-white hover:bg-orange-500'
              }`}
            >
              <LinkIcon size={16} /> Assign Vehicle
            </button>
            <button
              type="button"
              onClick={() => go('/Akeel/Transport/GPSTracking')}
              className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg transition-all ${
                isActive('/Akeel/Transport/GPSTracking') ? 'bg-orange-600 text-white' : 'text-black hover:text-white hover:bg-orange-500'
              }`}
            >
              <MapPin size={16} /> GPS Tracking
            </button>
            <button
              type="button"
              onClick={() => go('/Akeel/Transport/Fuel')}
              className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg transition-all ${
                isActive('/Akeel/Transport/Fuel') ? 'bg-orange-600 text-white' : 'text-black hover:text-white hover:bg-orange-500'
              }`}
            >
              <Droplet size={16} /> Fuel Consumption
            </button>
          </SidebarItem>

          <SidebarItem
            label="Vehicle Maintenance"
            icon={<Wrench size={20} />}
            collapsed={collapsed}
            active={vehicleMaintActive}
          >
            {/* FIX: Corrected navigation link for Service Requests */}
            <button
              type="button"
              onClick={() => go('/Dewmini/Transport/Admin/DriverServiceRequests')} 
              className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg transition-all ${
                isActive('/Dewmini/Transport/Admin/DriverServiceRequests')
                  ? 'bg-orange-600 text-white'
                  : 'text-black hover:text-white hover:bg-orange-500'
              }`}
            >
              <FileDigit size={16} /> Service Requests
            </button>
            <button
              type="button"
              onClick={() => go('/Dewmini/Transport/Admin/DriverServiceRequests')}
              className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg transition-all ${
                isActive('/Akeel/Transport/Maintenance/Schedule')
                  ? 'bg-orange-600 text-white'
                  : 'text-black hover:text-white hover:bg-orange-500'
              }`}
            >
              <CalendarCheck size={16} /> Service Candidates
            </button>
            <button
              type="button"
              onClick={() => go('/Dewmini/Transport/Admin/ServiceCandidates')}
              className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg transition-all ${
                isActive('/Dewmini/Transport/Admin/ServiceCandidates')
                  ? 'bg-orange-600 text-white'
                  : 'text-black hover:text-white hover:bg-orange-500'
              }`}
            >
              <FileText size={16} /> Maintenance Log
            </button>
            <button
              type="button"
              onClick={() => go('/Akeel/Transport/Maintenance/SupplierBills')}
              className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg transition-all ${
                isActive('/Akeel/Transport/Maintenance/SupplierBills')
                  ? 'bg-orange-600 text-white'
                  : 'text-black hover:text-white hover:bg-orange-500'
              }`}
            >
              <ClipboardList size={16} /> Supplier Bills
            </button>
          </SidebarItem>

          <SidebarItem label="Usage Requests" icon={<FileText size={20} />} collapsed={collapsed} active={usageReqActive}>
            <button
              type="button"
              onClick={() => go('/Akeel/Transport/Usage/Department')}
              className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg transition-all ${
                isActive('/Akeel/Transport/Usage/Department')
                  ? 'bg-orange-600 text-white'
                  : 'text-black hover:text-white hover:bg-orange-500'
              }`}
            >
              <Building size={16} /> Department Requests
            </button>
            <button
              type="button"
              onClick={() => go('/Akeel/Transport/Usage/Approved')}
              className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg transition-all ${
                isActive('/Akeel/Transport/Usage/Approved')
                  ? 'bg-orange-600 text-white'
                  : 'text-black hover:text-white hover:bg-orange-500'
              }`}
            >
              <CalendarCheck size={16} /> Approved Requests
            </button>
            <button
              type="button"
              onClick={() => go('/Akeel/Transport/Usage/Scheduling')}
              className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg transition-all ${
                isActive('/Akeel/Transport/Usage/Scheduling')
                  ? 'bg-orange-600 text-white'
                  : 'text-black hover:text-white hover:bg-orange-500'
              }`}
            >
              <CalendarClock size={16} /> Vehicle Scheduling
            </button>
            <button
              type="button"
              onClick={() => go('/Akeel/Transport/Usage/Dispatch')}
              className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg transition-all ${
                isActive('/Akeel/Transport/Usage/Dispatch')
                  ? 'bg-orange-600 text-white'
                  : 'text-black hover:text-white hover:bg-orange-500'
              }`}
            >
              <Truck size={16} /> Dispatch Logs
            </button>
            <button
              type="button"
              onClick={() => go('/Akeel/Transport/Usage/Receive')}
              className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg transition-all ${
                isActive('/Akeel/Transport/Usage/Receive')
                  ? 'bg-orange-600 text-white'
                  : 'text-black hover:text-white hover:bg-orange-500'
              }`}
            >
              <Truck size={16} /> Receive Logs
            </button>
          </SidebarItem>

          <SidebarItem label="Gate Security" icon={<Shield size={20} />} collapsed={collapsed} active={gateSecActive}>
            <button
              type="button"
              onClick={() => go('/Akeel/Transport/Gate/Scheduled')}
              className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg transition-all ${
                isActive('/Akeel/Transport/Gate/Scheduled')
                  ? 'bg-orange-600 text-white'
                  : 'text-black hover:text-white hover:bg-orange-500'
              }`}
            >
              <Truck size={16} /> Scheduled Vehicles
            </button>
            <button
              type="button"
              onClick={() => go('/Akeel/Transport/Gate/Visitors')}
              className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg transition-all ${
                isActive('/Akeel/Transport/Gate/Visitors')
                  ? 'bg-orange-600 text-white'
                  : 'text-black hover:text-white hover:bg-orange-500'
              }`}
            >
              <Users size={16} /> Visitor Vehicles
            </button>
            <button
              type="button"
              onClick={() => go('/Akeel/Transport/Gate/Company')}
              className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg transition-all ${
                isActive('/Akeel/Transport/Gate/Company')
                  ? 'bg-orange-600 text-white'
                  : 'text-black hover:text-white hover:bg-orange-500'
              }`}
            >
              <Building size={16} /> Company Vehicles
            </button>
          </SidebarItem>
        </div>

        {/* Footer buttons (Fixed Bottom) */}
        <div className="pt-4 border-t border-orange-300 mt-auto space-y-1">
          <button
            type="button"
            onClick={() => go('/Akeel/Transport/Profile')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full transition-all ${isActive('/Akeel/Transport/Profile') ? 'bg-orange-600 text-white' : 'text-black hover:bg-orange-500 hover:text-white'} ${collapsed ? 'justify-center px-2' : ''}`}
          >
            <User size={18} />
            {!collapsed && <span className="text-sm font-medium">Profile</span>}
          </button>

          <button
            type="button"
            onClick={() => go('/Akeel/Transport/Reports')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full transition-all ${isActive('/Akeel/Transport/Reports') ? 'bg-orange-600 text-white' : 'text-black hover:bg-orange-500 hover:text-white'} ${collapsed ? 'justify-center px-2' : ''}`}
          >
            <PieChart size={18} />
            {!collapsed && <span className="text-sm font-medium">Reports</span>}
          </button>

          <button
            type="button"
            onClick={() => go('/Akeel/Transport/History')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full transition-all ${isActive('/Akeel/Transport/History') ? 'bg-orange-600 text-white' : 'text-black hover:bg-orange-500 hover:text-white'} ${collapsed ? 'justify-center px-2' : ''}`}
          >
            <FileText size={18} />
            {!collapsed && <span className="text-sm font-medium">History</span>}
          </button>

          <button
            type="button"
            onClick={() => go('/Akeel/Transport/Settings')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full transition-all ${isActive('/Akeel/Transport/Settings') ? 'bg-orange-600 text-white' : 'text-black hover:bg-orange-500 hover:text-white'} ${collapsed ? 'justify-center px-2' : ''}`}
          >
            <Settings size={18} />
            {!collapsed && <span className="text-sm font-medium">Settings</span>}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full transition-all text-black hover:bg-orange-500 hover:text-white ${collapsed ? 'justify-center px-2' : ''}`}
          >
            <LogOut size={18} />
            {!collapsed && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default Sidebar;
