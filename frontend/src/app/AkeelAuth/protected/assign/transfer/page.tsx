// src/app/AkeelAuth/(protected)/assign/transfer/page.tsx
"use client";

import { useState, useEffect } from "react";

type User = { id: number; username: string };

export default function TransferPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [fromUserId, setFromUserId] = useState<number | "">("");
  const [toUserId, setToUserId] = useState<number | "">("");
  const [includeRolePerms, setIncludeRolePerms] = useState(true);
  const [clearFromUser, setClearFromUser] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    // fetch users via your Next API (server side adds cookie token)
    fetch("/AkeelAuth/api/users")
      .then(r => r.json())
      .then(setUsers)
      .catch(() => setMsg("Failed to load users"));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const res = await fetch("/AkeelAuth/api/assign/transfer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromUserId,
        toUserId,
        includeRolePermissions: includeRolePerms,
        clearFromUser,
      }),
    });

    setMsg(res.ok ? "Permissions transferred." : (await res.text()) || "Failed");
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Transfer permissions</h1>

      {msg && <div className="mb-4 rounded bg-blue-50 px-3 py-2 text-blue-700">{msg}</div>}

      <form onSubmit={onSubmit} className="grid gap-3 max-w-lg">
        <select
          className="rounded border px-3 py-2"
          value={fromUserId}
          onChange={(e) => setFromUserId(Number(e.target.value))}
        >
          <option value="">From user…</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
        </select>

        <select
          className="rounded border px-3 py-2"
          value={toUserId}
          onChange={(e) => setToUserId(Number(e.target.value))}
        >
          <option value="">To user…</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
        </select>

        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={includeRolePerms} onChange={(e) => setIncludeRolePerms(e.target.checked)} />
          Include role permissions
        </label>

        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={clearFromUser} onChange={(e) => setClearFromUser(e.target.checked)} />
          Clear from source user
        </label>

        <button className="rounded bg-blue-600 text-white px-4 py-2">Transfer</button>
      </form>
    </div>
  );
}
