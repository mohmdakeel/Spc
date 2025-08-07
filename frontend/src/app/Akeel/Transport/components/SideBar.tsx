'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  Link,
  MapPin,
  Droplet,
  CalendarCheck,
  FileDigit,
  CalendarClock,
  Truck,
  Users,
  Building,
  LogOut
} from 'lucide-react';

type SidebarItemProps = {
  label: string;
  icon: React.ReactNode;
  children?: React.ReactNode;
  collapsed?: boolean;
  active?: boolean;
  path?: string;
  onClick?: () => void;
};

const SidebarItem: React.FC<SidebarItemProps> = ({
  label,
  icon,
  children,
  collapsed = false,
  active = false,
  path,
  onClick
}) => {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleClick = () => {
    if (children) {
      setOpen(!open);
    } else if (path) {
      router.push(path);
    }
    onClick?.();
  };

  return (
    <div className="mb-1">
      <button
        onClick={handleClick}
        className={`flex items-center justify-between w-full px-4 py-3 ${
          active ? 'bg-orange-600 text-white' : 'text-black hover:bg-orange-500 hover:text-white'
        } text-left transition-all rounded-lg group ${
          collapsed ? 'justify-center px-2' : ''
        } cursor-pointer`}
      >
        <div className={`flex items-center gap-3 ${collapsed ? 'flex-col' : ''}`}>
          <span className="flex-shrink-0">
            {icon}
          </span>
          {!collapsed && (
            <span className={`text-sm font-medium truncate ${
              active ? 'text-white' : 'text-black group-hover:text-white'
            }`}>
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
        <div className="ml-2 pl-6 mt-1 space-y-1 text-sm border-l-2 border-orange-300">
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child as React.ReactElement<any>, {
                className: `flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg transition-all 
                  ${active ? 'text-white bg-orange-600' : 'text-black hover:text-white hover:bg-orange-500'}
                  cursor-pointer`
              });
            }
            return child;
          })}
        </div>
      )}
    </div>
  );
};

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState('');
  const router = useRouter();

  const handleNavigation = (path: string, itemName: string) => {
    setActiveItem(itemName);
    router.push(path);
  };

  const handleLogout = () => {
    // Implement your logout logic here
    console.log('Logging out...');
    // router.push('/login');
  };

  return (
    <div
      className={`bg-orange-100 h-screen ${
        collapsed ? 'w-20' : 'w-64'
      } p-4 overflow-y-auto transition-all duration-300 ease-in-out flex flex-col 
      shadow-[4px_0_20px_rgba(0,0,0,0.1)]`}
    >
      <div className="mb-6 flex flex-col items-center">
        {!collapsed ? (
          <>
            <div className="flex items-center gap-2 mb-2">
              <Car size={28} className="text-orange-600" />
              <h1 className="text-xl font-bold text-black truncate">
                SPC Transport
              </h1>
            </div>
            <p className="text-xs text-orange-800/80 truncate">Admin System</p>
          </>
        ) : (
          <Car size={28} className="text-orange-600" />
        )}
      </div>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden md:flex items-center justify-center p-2 mb-4 bg-orange-200 rounded-lg 
        hover:bg-orange-300 transition-all text-black hover:text-white cursor-pointer"
      >
        {collapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
      </button>

      <button
        onClick={() => handleNavigation('/dashboard', 'dashboard')}
        className={`flex items-center gap-2 px-4 py-3 rounded-lg mb-4 transition-all
        ${activeItem === 'dashboard' ? 'bg-orange-600 text-white' : 'bg-orange-200 text-black hover:bg-orange-500 hover:text-white'}
        cursor-pointer`}
      >
        <Home size={20} />
        {!collapsed && <span>Dashboard</span>}
      </button>

      <div className="space-y-1 flex-1">
        <SidebarItem 
          label="Vehicle Management" 
          icon={<Car size={20} />} 
          collapsed={collapsed}
          active={activeItem === 'vehicle-management'}
          onClick={() => setActiveItem('vehicle-management')}
        >
          <div 
            onClick={() => handleNavigation('/Akeel/Transport/Vehicle', 'vehicle-register')} 
            className="flex items-center gap-2"
          >
            <ClipboardList size={16} /> Vehicle Register
          </div>
          <div 
            onClick={() => handleNavigation('/Akeel/Transport/Driver', 'driver-register')} 
            className="flex items-center gap-2"
          >
            <User size={16} /> Driver Register
          </div>
          <div 
            onClick={() => handleNavigation('/assign-vehicle', 'assign-vehicle')} 
            className="flex items-center gap-2"
          >
            <Link size={16} /> Assign Vehicle
          </div>
          <div 
            onClick={() => handleNavigation('/gps-tracking', 'gps-tracking')} 
            className="flex items-center gap-2"
          >
            <MapPin size={16} /> GPS Tracking
          </div>
          <div 
            onClick={() => handleNavigation('/fuel-consumption', 'fuel-consumption')} 
            className="flex items-center gap-2"
          >
            <Droplet size={16} /> Fuel Consumption
          </div>
        </SidebarItem>

        <SidebarItem 
          label="Vehicle Maintenance" 
          icon={<Wrench size={20} />} 
          collapsed={collapsed}
          active={activeItem === 'vehicle-maintenance'}
          onClick={() => setActiveItem('vehicle-maintenance')}
        >
          <div 
            onClick={() => handleNavigation('/service-requests', 'service-requests')} 
            className="flex items-center gap-2"
          >
            <FileDigit size={16} /> Service Requests
          </div>
          <div 
            onClick={() => handleNavigation('/maintenance-schedule', 'maintenance-schedule')} 
            className="flex items-center gap-2"
          >
            <CalendarCheck size={16} /> Maintenance Schedule
          </div>
          <div 
            onClick={() => handleNavigation('/maintenance-log', 'maintenance-log')} 
            className="flex items-center gap-2"
          >
            <FileText size={16} /> Maintenance Log
          </div>
          <div 
            onClick={() => handleNavigation('/supplier-bills', 'supplier-bills')} 
            className="flex items-center gap-2"
          >
            <ClipboardList size={16} /> Supplier Bills
          </div>
        </SidebarItem>

        <SidebarItem 
          label="Usage Requests" 
          icon={<FileText size={20} />} 
          collapsed={collapsed}
          active={activeItem === 'usage-requests'}
          onClick={() => setActiveItem('usage-requests')}
        >
          <div 
            onClick={() => handleNavigation('/department-requests', 'department-requests')} 
            className="flex items-center gap-2"
          >
            <Building size={16} /> Department Requests
          </div>
          <div 
            onClick={() => handleNavigation('/approved-requests', 'approved-requests')} 
            className="flex items-center gap-2"
          >
            <CalendarCheck size={16} /> Approved Requests
          </div>
          <div 
            onClick={() => handleNavigation('/vehicle-scheduling', 'vehicle-scheduling')} 
            className="flex items-center gap-2"
          >
            <CalendarClock size={16} /> Vehicle Scheduling
          </div>
          <div 
            onClick={() => handleNavigation('/dispatch-logs', 'dispatch-logs')} 
            className="flex items-center gap-2"
          >
            <Truck size={16} /> Dispatch Logs
          </div>
          <div 
            onClick={() => handleNavigation('/receive-logs', 'receive-logs')} 
            className="flex items-center gap-2"
          >
            <Truck size={16} /> Receive Logs
          </div>
        </SidebarItem>

        <SidebarItem 
          label="Gate Security" 
          icon={<Shield size={20} />} 
          collapsed={collapsed}
          active={activeItem === 'gate-security'}
          onClick={() => setActiveItem('gate-security')}
        >
          <div 
            onClick={() => handleNavigation('/scheduled-vehicles', 'scheduled-vehicles')} 
            className="flex items-center gap-2"
          >
            <Truck size={16} /> Scheduled Vehicles
          </div>
          <div 
            onClick={() => handleNavigation('/visitor-vehicles', 'visitor-vehicles')} 
            className="flex items-center gap-2"
          >
            <Users size={16} /> Visitor Vehicles
          </div>
          <div 
            onClick={() => handleNavigation('/company-vehicles', 'company-vehicles')} 
            className="flex items-center gap-2"
          >
            <Building size={16} /> Company Vehicles
          </div>
        </SidebarItem>
      </div>

      <div className="pt-4 border-t border-orange-300 mt-auto space-y-1">
        <button
          onClick={() => handleNavigation('/reports', 'reports')}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full transition-all
          ${activeItem === 'reports' ? 'bg-orange-600 text-white' : 'text-black hover:bg-orange-500 hover:text-white'}
          ${collapsed ? 'justify-center px-2' : ''} cursor-pointer`}
        >
          <PieChart size={18} />
          {!collapsed && <span className="text-sm font-medium">Reports</span>}
        </button>
        
        <button
          onClick={() => handleNavigation('/Akeel/Transport/History', 'history')}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full transition-all
          ${activeItem === 'history' ? 'bg-orange-600 text-white' : 'text-black hover:bg-orange-500 hover:text-white'}
          ${collapsed ? 'justify-center px-2' : ''} cursor-pointer`}
        >
          <FileText size={18} />
          {!collapsed && <span className="text-sm font-medium">History</span>}
        </button>
        
        <button
          onClick={() => handleNavigation('/settings', 'settings')}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full transition-all
          ${activeItem === 'settings' ? 'bg-orange-600 text-white' : 'text-black hover:bg-orange-500 hover:text-white'}
          ${collapsed ? 'justify-center px-2' : ''} cursor-pointer`}
        >
          <Settings size={18} />
          {!collapsed && <span className="text-sm font-medium">Settings</span>}
        </button>
        
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full transition-all
          text-black hover:bg-orange-500 hover:text-white
          ${collapsed ? 'justify-center px-2' : ''} cursor-pointer`}
        >
          <LogOut size={18} />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;