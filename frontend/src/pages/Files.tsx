import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Link } from "react-router-dom";

type CSV = { id: number; filename: string; uploaded_at: string };

export default function Files() {
  const [files, setFiles] = useState<CSV[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api("/files").then(setFiles).catch(e => setErr(e.message));
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">CSV Files</h1>
      {err && <p className="text-red-600 mb-3">{err}</p>}
      <ul className="divide-y">
        {files.map(f => (
          <li key={f.id} className="py-3 flex items-center justify-between">
            <div>
              <p className="font-medium">{f.filename}</p>
              <p className="text-sm text-gray-500">{new Date(f.uploaded_at).toLocaleString()}</p>
            </div>
            <Link to={`/files/${f.id}`} className="underline">Open</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
