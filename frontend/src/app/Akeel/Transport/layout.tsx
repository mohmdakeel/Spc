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
      <div className="auth-shell">
        {/* Left nav */}
        <Sidebar />

        {/* Main column */}
        <div className="auth-shell__main overflow-hidden">
          {/* Top bar shows the same user */}
          <Topbar
            user={user}
            appName="SPC Transport"
            workspace="Transport Operations"
            profileTag="Transport Suite"
            profileHref="/Akeel/Transport/Profile"
            settingsHref="/Akeel/Transport/Settings"
          />

          {/* Scrollable content area */}
          <main className="auth-shell__content">
            <div className="mx-auto w-full max-w-[1400px] space-y-6">
              {children}
            </div>
          </main>
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
