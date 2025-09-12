// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SPC Dashboard',
  description: 'State Printing Corporation',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <ToastContainer 
          position="top-right" 
          autoClose={3000} 
          newestOnTop 
          pauseOnHover 
          theme="light"
        />
      </body>
    </html>
  );
}