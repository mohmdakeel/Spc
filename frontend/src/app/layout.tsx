import './globals.css'; // ✅ MUST be imported here
import { ReactNode } from 'react';

export const metadata = {
  title: 'SPC Dashboard',
  description: 'State Printing Corporation',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900">
        {children}
      </body>
    </html>
  );
}
