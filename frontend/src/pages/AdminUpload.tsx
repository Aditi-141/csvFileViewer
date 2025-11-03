import { useState } from "react";
import { api } from "../api/client";

export default function AdminUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    try {
      await api("/admin/upload", { method: "POST", body: form });
      setMsg("Uploaded!");
      setFile(null);
    } catch (e: any) { setMsg(e.message); }
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-3">
      <h1 className="text-2xl font-bold">Admin Upload</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input type="file" accept=".csv" onChange={e => setFile(e.target.files?.[0] || null)} />
        <button className="bg-black text-white px-4 py-2 rounded" type="submit">Upload</button>
      </form>
      {msg && <p>{msg}</p>}
    </div>
  );
}
