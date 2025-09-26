import { redirect } from "next/navigation";
import { getAuthToken } from "../api/_lib/cookies";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const token = getAuthToken();
  if (!token) redirect("/login"); // ✅ "/(public)/login" இல்லை

  return (
    <div className="min-h-screen">
      <nav className="bg-gray-900 text-white px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <span className="font-semibold">AkeelAuth</span>
          <a href="/dashboard" className="hover:underline">Dashboard</a>
          <a href="/users" className="hover:underline">Users</a>
          <a href="/role" className="hover:underline">Roles</a>
          <a href="/permissions" className="hover:underline">Permissions</a>
          <a href="/assign" className="hover:underline">Assign</a>
          <form className="ml-auto" action="/api/logout" method="post">
            <button className="bg-white text-black rounded px-3 py-1">Logout</button>
          </form>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto p-6">{children}</main>
    </div>
  );
}
