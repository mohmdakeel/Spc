// src/app/Akeel/Transport/layout.tsx
'use client';

import React from 'react';
import Sidebar from './components/SideBar';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function TransportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // App frame: fill viewport, never let children overflow horizontally
    <div className="flex h-screen bg-orange-50 overflow-hidden">
      {/* Left nav decides its own width */}
      <Sidebar />

      {/* Main column (no horizontal overflow) */}
      <main className="flex-1 min-w-0 min-h-0 flex">
        {/* Inner scroller: all pages scroll inside here */}
        <div className="w-full h-full overflow-auto">
          {/* Content clamp: center + max width so tables stay inside */}
          <div className="mx-auto w-full max-w-[1400px] px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
            {children}
          </div>
        </div>
      </main>

      {/* Toasts above everything */}
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
