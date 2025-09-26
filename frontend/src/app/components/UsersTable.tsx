"use client";

import { useEffect, useState } from "react";

type Page<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

type User = {
  id: number;
  username: string;
  email: string;
  active: boolean;
  fullName?: string;
  department?: string;
  designation?: string;
  contactNo?: string;
  company?: string;
};

export default function UsersTable() {
  const [page, setPage] = useState<Page<User> | null>(null);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [size, setSize] = useState(10);

  async function load(p = 0) {
    setLoading(true);
    const res = await fetch(`/api/users?page=${p}&size=${size}&q=${encodeURIComponent(q)}`, { cache: "no-store" });
    const data = await res.json();
    setPage(data);
    setLoading(false);
  }

  useEffect(() => { load(0); }, [size]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center">
        <input className="border rounded px-3 py-2" placeholder="Search..." value={q} onChange={e=>setQ(e.target.value)} />
        <button className="bg-black text-white rounded px-3 py-2" onClick={() => load(0)}>Search</button>
        <select className="border rounded px-2 py-2" value={size} onChange={e=>setSize(Number(e.target.value))}>
          {[10,20,50].map(n => <option key={n} value={n}>{n}/page</option>)}
        </select>
      </div>

      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">ID</th>
              <th className="p-2 text-left">Username</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Active</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td className="p-3" colSpan={4}>Loading…</td></tr>
            )}
            {!loading && page?.content?.map(u => (
              <tr key={u.id} className="border-t">
                <td className="p-2">{u.id}</td>
                <td className="p-2">{u.username}</td>
                <td className="p-2">{u.email}</td>
                <td className="p-2">{u.active ? "Yes" : "No"}</td>
              </tr>
            ))}
            {!loading && page && page.content.length === 0 && (
              <tr><td className="p-3" colSpan={4}>No users</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {page && (
        <div className="flex items-center gap-2">
          <button disabled={page.number===0} onClick={() => load(page.number-1)} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
          <span>Page {page.number+1} / {page.totalPages || 1}</span>
          <button disabled={page.number+1>=page.totalPages} onClick={() => load(page.number+1)} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  );
}
