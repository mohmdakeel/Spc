"use client";

import { useEffect, useState } from "react";

type Role = { id: number; name: string; description?: string };

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  async function load() {
    const res = await fetch("/api/roles", { cache: "no-store" });
    const data = await res.json();
    setRoles(data);
  }
  useEffect(() => { load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: desc }),
    });
    if (res.ok) {
      setName(""); setDesc("");
      load();
    } else {
      alert("Failed to create role");
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <h2 className="font-semibold mb-2">All Roles</h2>
        <ul className="space-y-1">
          {roles.map(r => <li key={r.id} className="border rounded px-3 py-2">{r.name} <span className="text-gray-500">{r.description}</span></li>)}
        </ul>
      </div>
      <form onSubmit={create} className="space-y-3 bg-white p-4 rounded shadow">
        <h2 className="font-semibold">Create Role</h2>
        <input className="w-full border rounded px-3 py-2" placeholder="Role name" value={name} onChange={e=>setName(e.target.value)} required />
        <input className="w-full border rounded px-3 py-2" placeholder="Description (optional)" value={desc} onChange={e=>setDesc(e.target.value)} />
        <button className="bg-black text-white rounded px-4 py-2">Create</button>
      </form>
    </div>
  );
}
