import { useEffect, useState } from "react";
import { api } from "../api/client";

type U = {
  id: number;
  username: string;
  is_admin: boolean;
  created_at?: string | null;
  created_on?: string | null;
  last_login?: string | null;
};


export default function AdminUsers() {
  const [users, setUsers] = useState<U[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const refresh = () => api("/admin/users").then(setUsers).catch(e => setErr(e.message));
  useEffect(() => { refresh(); }, []);

  async function del(id: number) {
    try { await api(`/admin/users/${id}`, { method: "DELETE" }); refresh(); }
    catch (e: any) { setErr(e.message); }
  }
  function fmt(ts?: string | null) {
  if (!ts) return "—";
  const d = new Date(ts);
  return isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Users</h1>
      {err && <p className="text-red-600 mb-3">{err}</p>}
      <ul className="divide-y">
        {users.map(u => (
          <li key={u.id} className="py-3 flex items-center justify-between">
            <div>
              <p className="font-medium">
                {u.username} {u.is_admin && <span className="text-xs bg-gray-200 px-2 py-0.5 rounded ml-2">admin</span>}
              </p>
              <p className="text-sm text-gray-500">{fmt(u.created_at ?? u.created_on)}</p>
            </div>
            {!u.is_admin && (
              <button onClick={() => del(u.id)} className="text-red-600 underline">Delete</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
