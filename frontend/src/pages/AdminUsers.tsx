// src/pages/AdminUsers.tsx
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

function fmt(ts?: string | null) {
  if (!ts) return "—";
  const d = new Date(ts);
  return isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

export default function AdminUsers() {
  const [users, setUsers] = useState<U[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      setErr(null);            // clear any old “Not Found” banner
      const data = await api("/admin/users");
      setUsers(data as U[]);
    } catch (e: any) {
      setErr(e.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  async function del(id: number) {
    if (!confirm(`Delete user #${id}?`)) return;
    try {
      setErr(null);            // clear old error before attempting delete
      await api(`/admin/users/${id}`, { method: "DELETE" });
      await refresh();         // re-fetch from DB so list is correct
    } catch (e: any) {
      setErr(e.message || "Delete failed");
    }
  }

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Users</h1>
      {err && <p className="text-red-600 mb-3">{err}</p>}
      {users.length === 0 ? (
        <p className="text-gray-600">No users.</p>
      ) : (
        <ul className="divide-y">
          {users.map((u) => (
            <li key={u.id} className="py-3 flex items-center justify-between">
              <div>
                <p className="font-medium">
                  #{u.id} {u.username}{" "}
                  {u.is_admin && (
                    <span className="text-xs bg-gray-200 px-2 py-0.5 rounded ml-2">admin</span>
                  )}
                </p>
                <p className="text-sm text-gray-500">{fmt(u.created_at ?? u.created_on)}</p>
              </div>
              {!u.is_admin && (
                <button onClick={() => del(u.id)} className="text-red-600 underline">
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
