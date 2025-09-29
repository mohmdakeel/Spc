"use client";
import { useRouter } from "next/navigation";

export default function Topbar() {
  const router = useRouter();
  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/AkeelAuth/login");
  };
  return (
    <header className="sticky top-0 z-10 bg-white border-b px-6 py-3 flex items-center justify-between">
      <div className="font-medium">AkeelAuth</div>
      <button onClick={logout} className="rounded bg-gray-900 text-white text-sm px-3 py-1.5 hover:opacity-90">
        Logout
      </button>
    </header>
  );
}
