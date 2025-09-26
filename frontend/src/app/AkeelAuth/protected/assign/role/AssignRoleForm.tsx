// src/app/AkeelAuth/(protected)/assign/role/AssignRoleForm.tsx
"use client";

import { useState } from "react";

export default function AssignRoleForm({
  users,
  roles,
}: {
  users: any[];
  roles: any[];
}) {
  const [userId, setUserId] = useState<number | "">("");
  const [roleId, setRoleId] = useState<number | "">("");
  const [assign, setAssign] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setSubmitting(true);

    const res = await fetch("/AkeelAuth/api/assign/role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: Number(userId),
        roleId: Number(roleId),
        assign,
      }),
    });

    setSubmitting(false);
    if (res.ok) {
      setMsg(assign ? "Role assigned successfully." : "Role removed successfully.");
    } else {
      const text = await res.text();
      setMsg(text || "Operation failed.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 max-w-xl">
      {msg && (
        <div className="rounded bg-blue-50 px-3 py-2 text-blue-700">{msg}</div>
      )}

      <select
        className="w-full rounded border px-3 py-2"
        value={userId}
        onChange={(e) =>
          setUserId(e.target.value ? Number(e.target.value) : "")
        }
        required
      >
        <option value="">Select user</option>
        {users.map((u: any) => (
          <option key={u.id} value={u.id}>
            {u.username} ({u.email})
          </option>
        ))}
      </select>

      <select
        className="w-full rounded border px-3 py-2"
        value={roleId}
        onChange={(e) =>
          setRoleId(e.target.value ? Number(e.target.value) : "")
        }
        required
      >
        <option value="">Select role</option>
        {roles.map((r: any) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-6">
        <label className="inline-flex items-center gap-2">
          <input
            type="radio"
            checked={assign}
            onChange={() => setAssign(true)}
          />
          Assign
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="radio"
            checked={!assign}
            onChange={() => setAssign(false)}
          />
          Remove
        </label>
      </div>

      <button
        disabled={submitting}
        className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
      >
        {submitting ? "Applying..." : "Apply"}
      </button>
    </form>
  );
}
