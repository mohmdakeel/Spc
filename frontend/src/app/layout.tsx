// frontend/src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '../../components/ThemeProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'State Printing Co-operation ERP',
  description: 'HR Management',
  icons: { icon: [{ url: '/spclogopic.png', type: 'image/png' }] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} hod-shell`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
