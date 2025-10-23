// // components/ActorBar.tsx
// 'use client';
// import React, { useEffect, useState } from 'react';
// const ROLES = ['DEPT','HOD','MGMT','INCHARGE','GATE','ADMIN'];
// export default function ActorBar() {
//   const [actor, setActor] = useState('');
//   const [role, setRole] = useState('');
//   useEffect(() => {
//     setActor(localStorage.getItem('actor') || 'web');
//     setRole(localStorage.getItem('role') || 'ADMIN');
//   }, []);
//   const save = (a: string, r: string) => {
//     localStorage.setItem('actor', a); localStorage.setItem('role', r);
//     setActor(a); setRole(r);
//   };
//   return (
//     <div className="w-full bg-orange-50 border-b border-orange-200 px-3 py-2 flex items-center gap-3">
//       <span className="text-xs text-orange-800/80">Acting as:</span>
//       <input className="text-sm border rounded px-2 py-1" value={actor} onChange={e=>save(e.target.value, role)} />
//       <select className="text-sm border rounded px-2 py-1" value={role} onChange={e=>save(actor, e.target.value)}>
//         {ROLES.map(r=><option key={r} value={r}>{r}</option>)}
//       </select>
//       <span className="ml-auto text-xs text-orange-800/60">Headers: X-Actor={actor} · X-Role={role}</span>
//     </div>
//   );
// }