"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/AkeelAuth/dashboard", label: "Dashboard" },
  { href: "/AkeelAuth/employees", label: "Employees" },
  { href: "/AkeelAuth/users", label: "Users" },
  { href: "/AkeelAuth/permissions", label: "Permissions" },
  { href: "/AkeelAuth/assign", label: "Assign Role" },
  { href: "/AkeelAuth/transfer", label: "Transfer Perms" }
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="bg-white border-r p-4">
      <div className="mb-4 font-semibold">SPC Admin</div>
      <nav className="space-y-1">
        {items.map(i => {
          const active = path.startsWith(i.href);
          return (
            <Link
              key={i.href}
              href={i.href}
              className={`block rounded px-3 py-2 text-sm ${active ? "bg-gray-100 font-medium" : "hover:bg-gray-50"}`}
            >
              {i.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
