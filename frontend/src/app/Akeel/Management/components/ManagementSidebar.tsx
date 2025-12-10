'use client';

import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Home, ListChecks, CheckCircle2, XCircle, Search, FolderHeart } from 'lucide-react';

const MENU = [
  { label: 'Dashboard', icon: Home, to: '/Akeel/Management' },
  { label: 'Pending', icon: ListChecks, to: '/Akeel/Management/Pending' },
  { label: 'Approved', icon: CheckCircle2, to: '/Akeel/Management/Approved' },
  { label: 'Rejected', icon: XCircle, to: '/Akeel/Management/Rejected' },
  { label: 'Track Request', icon: Search, to: '/Akeel/Management/Track' },
];

export default function ManagementSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (to: string) => pathname === to || pathname.startsWith(`${to}/`);

  return (
    <aside className="hod-sidebar w-[260px] shrink-0 h-screen sticky top-0 bg-orange-100 border-r border-orange-200 flex flex-col p-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-2xl border border-orange-200 bg-white flex items-center justify-center shadow-sm">
          <Image src="/spclogopic.png" width={32} height={32} alt="SPC" className="object-contain" priority />
        </div>
        <div className="min-w-0">
          <h1 className="font-bold text-sm text-orange-900 leading-tight truncate">SPC Management</h1>
          <p className="text-xs text-orange-700/70 truncate">Transport Oversight</p>
        </div>
      </div>

      <nav className="space-y-1 flex-1">
        {MENU.map(({ label, icon: Icon, to }) => (
          <button
            key={label}
            onClick={() => router.push(to)}
            className={`w-full px-3 py-2 rounded flex items-center gap-2 text-sm transition ${
              isActive(to) ? 'bg-orange-600 text-white shadow' : 'text-orange-900 hover:bg-orange-200'
            }`}
          >
            <Icon size={18} />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </nav>

      <div className="pt-4 mt-6 border-t border-orange-200 space-y-2 text-xs text-orange-700/80">
        <p className="flex items-center gap-2">
          <FolderHeart size={14} />
        </p>
      </div>
    </aside>
  );
}
