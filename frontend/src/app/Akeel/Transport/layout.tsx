'use client';

import React from 'react';
import Sidebar from '../Transport/components/SideBar';      // <— correct casing: Sidebar.tsx
// import ActorBar from './components/ActorBar';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

/**
 * App frame for Transport area.
 * - Left: Sidebar controls its own width
 * - Right: scrolls inside (no horizontal overflow)
 * - Toasts mounted at top-right
 */
export default function TransportLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-orange-50 overflow-hidden">
      {/* Left nav */}
      <Sidebar />

      {/* Main column */}
      <main className="flex-1 min-w-0 min-h-0 flex flex-col">
        {/* Top bar (role/actor switch, etc.) */}
        {/* <ActorBar /> */}

        {/* Scrollable content area */}
        <div className="w-full h-full overflow-auto">
          <div className="mx-auto w-full max-w-[1400px] px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
            {children}
          </div>
        </div>
      </main>

      {/* Toasts */}
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
  );
}
