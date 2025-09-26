"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/AkeelAuth/dashboard", label: "Dashboard" },
  { href: "/AkeelAuth/users", label: "Users" },
  { href: "/AkeelAuth/permissions", label: "Permissions" },
  { href: "/AkeelAuth/roles", label: "Roles" },
  { href: "/AkeelAuth/assign/role", label: "Assign Role" },
  { href: "/AkeelAuth/assign/transfer", label: "Transfer Perms" },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  async function logout() {
    await fetch("/AkeelAuth/api/logout", { method: "POST" });
    location.href = "/AkeelAuth/login";
  }

  return (
    <div className="min-h-dvh flex">
      <aside className="w-60 bg-white border-r p-4">
        <div className="mb-6 font-bold">SPC Admin</div>
        <nav className="space-y-2">
          {nav.map((n) => {
            const active = pathname?.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`block rounded px-3 py-2 text-sm ${active ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50"}`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <button onClick={logout} className="mt-6 w-full rounded bg-red-600 px-3 py-2 text-white text-sm">
          Logout
        </button>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
