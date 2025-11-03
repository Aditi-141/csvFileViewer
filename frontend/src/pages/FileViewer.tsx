import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useParams, useNavigate, Link } from "react-router-dom";

function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-auto border rounded">
      <table className="min-w-full">
        <thead>
          <tr>{headers.map((h,i)=>(<th key={i} className="text-left p-2 border-b">{h}</th>))}</tr>
        </thead>
        <tbody>
          {rows.map((r,ri)=>(
            <tr key={ri} className={ri%2?"bg-gray-50":""}>
              {r.map((c,ci)=>(<td key={ci} className="p-2 border-b whitespace-nowrap">{c}</td>))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function FileViewer() {
  const { id } = useParams();
  const nav = useNavigate();
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(()=>{
    api(`/files/${id}`)
      .then(d => { setHeaders(d.headers); setRows(d.rows); })
      .catch(e => setErr(e.message));
  }, [id]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => nav(-1)}
            className="px-3 py-1.5 border rounded hover:bg-gray-50"
            title="Go back"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold">CSV Preview</h1>
        </div>

        {/* handy: direct download link */}
        <Link
          to={`/files/${id}/download`}
          className="underline"
          target="_blank"
          rel="noreferrer"
        >
          Download CSV
        </Link>
      </div>

      {err && <p className="text-red-600">{err}</p>}
      <DataTable headers={headers} rows={rows} />
    </div>
  );
}
