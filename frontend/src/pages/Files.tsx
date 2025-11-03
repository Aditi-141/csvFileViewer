import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, getToken } from "../api/client";

type CsvItem = {
  id: number;
  filename: string;
  uploaded_at: string;
};

function getIsAdminFromJWT(): boolean {
  try {
    const token = getToken();
    if (!token) return false;
    const payload = JSON.parse(atob(token.split(".")[1] || ""));
    // support either "role":"admin" or "is_admin":true
    return payload?.role === "admin" || payload?.is_admin === true;
  } catch {
    return false;
  }
}

export default function Files() {
  const [files, setFiles] = useState<CsvItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const isAdmin = getIsAdminFromJWT();

  useEffect(() => {
    (async () => {
      try {
        const data = await api("/files"); // returns [{id, filename, uploaded_at}]
        setFiles(data);
      } catch (e: any) {
        setErr(e.message || "Failed to load files");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this CSV? This cannot be undone.")) return;

    // optimistic UI update
    const prev = files;
    setFiles(prev.filter(f => f.id !== id));

    try {
      await api(`/admin/files/${id}`, { method: "DELETE" });
      // success: nothing else to do
    } catch (e: any) {
      alert(e.message || "Failed to delete file.");
      setFiles(prev); // rollback
    }
  };

  if (loading) return <div className="p-6">Loading…</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">CSV Files</h1>
      {files.length === 0 ? (
        <p className="text-gray-600">No files yet.</p>
      ) : (
        <ul className="space-y-6">
          {files.map((f) => (
            <li key={f.id} className="border-b pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{f.filename}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(f.uploaded_at).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Link className="underline" to={`/files/${f.id}`}>
                    Open
                  </Link>
                  {isAdmin && (
                    <button
                      className="text-red-600 hover:underline"
                      onClick={() => handleDelete(f.id)}
                      title="Delete CSV"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
