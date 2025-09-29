"use client";

import { useState } from "react";

export default function AssignPage() {
  const [userId, setUser] = useState("");
  const [roleId, setRole] = useState("");
  const [assign, setAssign] = useState(true);

  async function submitAssign(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/assign-role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: Number(userId), roleId: Number(roleId), assign }),
    });
    if (res.ok) alert("Done");
    else alert("Failed");
  }

  const [fromUserId, setFrom] = useState("");
  const [toUserId, setTo] = useState("");
  const [includeRolePermissions, setInc] = useState(true);
  const [clearFromUser, setClr] = useState(true);

  async function submitTransfer(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/transfer-permissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromUserId: Number(fromUserId),
        toUserId: Number(toUserId),
        includeRolePermissions,
        clearFromUser
      }),
    });
    if (res.ok) alert("Transferred");
    else alert("Failed to transfer");
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <form onSubmit={submitAssign} className="space-y-3 bg-white p-4 rounded shadow">
        <h2 className="font-semibold">Assign / Remove Role</h2>
        <input className="w-full border rounded px-3 py-2" placeholder="User ID" value={userId} onChange={e=>setUser(e.target.value)} required />
        <input className="w-full border rounded px-3 py-2" placeholder="Role ID" value={roleId} onChange={e=>setRole(e.target.value)} required />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={assign} onChange={e=>setAssign(e.target.checked)} />
          Assign (uncheck to remove)
        </label>
        <button className="bg-black text-white rounded px-4 py-2">Submit</button>
      </form>

      <form onSubmit={submitTransfer} className="space-y-3 bg-white p-4 rounded shadow">
        <h2 className="font-semibold">Transfer Permissions</h2>
        <input className="w-full border rounded px-3 py-2" placeholder="From User ID" value={fromUserId} onChange={e=>setFrom(e.target.value)} required />
        <input className="w-full border rounded px-3 py-2" placeholder="To User ID" value={toUserId} onChange={e=>setTo(e.target.value)} required />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={includeRolePermissions} onChange={e=>setInc(e.target.checked)} />
          Include Role Permissions
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={clearFromUser} onChange={e=>setClr(e.target.checked)} />
          Clear From User
        </label>
        <button className="bg-black text-white rounded px-4 py-2">Transfer</button>
      </form>
    </div>
  );
}
