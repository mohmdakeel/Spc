// frontend/src/app/Akeel/Transport/layout.tsx
'use client';

import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Topbar from '../../../../components/Topbar';      // path from this file
import Sidebar from './components/SideBar';           // adjust if your SideBar lives elsewhere
import { useAuth } from '../../../../hooks/useAuth';
import RequireRole from '../../../../components/guards/RequireRole';

export default function TransportLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth(); // ← get the real logged-in user

  return (
    <RequireRole roles={['ADMIN', 'TRANSPORT_ADMIN', 'TRANSPORT']}>
      <div className="flex h-screen bg-orange-50 overflow-hidden">
      {/* Left nav */}
      <Sidebar />

      {/* Main column */}
      <div className="flex-1 min-w-0 min-h-0 flex flex-col">
        {/* Top bar shows the same user */}
        <Topbar user={user} />

        {/* Scrollable content area */}
        <div className="flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-[1400px] px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
            {children}
          </div>
        </div>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        style={{ zIndex: 10000 }}
      />
    </div>
    </RequireRole>
  );
}
