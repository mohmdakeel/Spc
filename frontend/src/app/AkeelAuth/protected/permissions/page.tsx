"use client";

import { useEffect, useState } from "react";

type Perm = { id: number; code: string; description?: string };

export default function PermissionsPage() {
  const [perms, setPerms] = useState<Perm[]>([]);
  const [code, setCode] = useState("");
  const [desc, setDesc] = useState("");

  async function load() {
    const res = await fetch("/api/permissions", { cache: "no-store" });
    const data = await res.json();
    setPerms(data);
  }
  useEffect(() => { load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/permissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, description: desc }),
    });
    if (res.ok) {
      setCode(""); setDesc("");
      load();
    } else {
      alert("Failed to create permission");
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <h2 className="font-semibold mb-2">All Permissions</h2>
        <ul className="space-y-1">
          {perms.map(p => <li key={p.id} className="border rounded px-3 py-2">{p.code} <span className="text-gray-500">{p.description}</span></li>)}
        </ul>
      </div>
      <form onSubmit={create} className="space-y-3 bg-white p-4 rounded shadow">
        <h2 className="font-semibold">Create Permission</h2>
        <input className="w-full border rounded px-3 py-2" placeholder="CODE (e.g., USER_READ)" value={code} onChange={e=>setCode(e.target.value)} required />
        <input className="w-full border rounded px-3 py-2" placeholder="Description (optional)" value={desc} onChange={e=>setDesc(e.target.value)} />
        <button className="bg-black text-white rounded px-4 py-2">Create</button>
      </form>
    </div>
  );
}
