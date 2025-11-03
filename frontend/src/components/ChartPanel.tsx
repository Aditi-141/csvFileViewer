// src/components/ChartPanel.tsx
import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

type Props = {
  headers: string[];
  rows: string[][];
};

type ChartKind = "line" | "bar";

const isNumericCell = (s: string) =>
  s != null && s.trim() !== "" && !isNaN(Number(s));
const ratioNumeric = (vals: string[]) =>
  vals.length ? vals.filter(isNumericCell).length / vals.length : 0;

export default function ChartPanel({ headers, rows }: Props) {
  const [xCol, setXCol] = useState<string>("");
  const [yCol, setYCol] = useState<string>("");
  const [chart, setChart] = useState<ChartKind>("line");

  // choose defaults when data arrives
  useEffect(() => {
    if (!headers.length || !rows.length) return;

    // default X = first column
    setXCol(prev => prev || headers[0]);

    // default Y = first mostly-numeric column, else 2nd, else 1st
    const numericFirst = headers.find((_, idx) => {
      const sample = rows.slice(0, 100).map(r => r[idx]);
      return ratioNumeric(sample) >= 0.7;
    });
    setYCol(prev => prev || numericFirst || headers[1] || headers[0]);
  }, [headers, rows]);

  const xi = useMemo(() => headers.indexOf(xCol), [headers, xCol]);
  const yi = useMemo(() => headers.indexOf(yCol), [headers, yCol]);

  const yIsNumeric = useMemo(() => {
    if (yi < 0) return false;
    const sample = rows.slice(0, 200).map(r => r[yi]);
    return ratioNumeric(sample) >= 0.7;
  }, [rows, yi]);

  // numeric series
  const numericData = useMemo(() => {
    if (xi < 0 || yi < 0) return [];
    return rows
      .map(r => {
        const y = Number(r[yi]);
        return { x: r[xi], y: Number.isFinite(y) ? y : undefined };
      })
      .filter(d => d.y !== undefined)
      .slice(0, 1000);
  }, [rows, xi, yi]);

  // categorical Y: value counts (top 25 + "Other")
  const categoricalData = useMemo(() => {
    if (yi < 0) return [];
    const freq = new Map<string, number>();
    for (const r of rows) {
      const key = (r[yi] ?? "").toString() || "(blank)";
      freq.set(key, (freq.get(key) ?? 0) + 1);
    }
    const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1]);
    const top = sorted.slice(0, 25);
    const other = sorted.slice(25).reduce((s, [, v]) => s + v, 0);
    const data = top.map(([k, v]) => ({ label: k, count: v }));
    if (other > 0) data.push({ label: "Other", count: other });
    return data;
  }, [rows, yi]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 border rounded p-3">
        <label className="text-sm">X:</label>
        <select className="border p-2" value={xCol} onChange={e => setXCol(e.target.value)}>
          {headers.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <label className="text-sm">Y:</label>
        <select className="border p-2" value={yCol} onChange={e => setYCol(e.target.value)}>
          {headers.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {yIsNumeric ? (
          <>
            <label className="text-sm">Chart:</label>
            <select className="border p-2" value={chart} onChange={e => setChart(e.target.value as ChartKind)}>
              <option value="line">Line</option>
              <option value="bar">Bar</option>
            </select>
          </>
        ) : (
          <span className="text-xs text-gray-600">Y is categorical — showing value counts</span>
        )}
      </div>

      <div className="border rounded p-4 h-[380px]">
        {!rows.length ? (
          <p className="text-sm text-gray-500">Loading data…</p>
        ) : yIsNumeric ? (
          numericData.length === 0 ? (
            <p className="text-sm text-red-500">
              No plottable numeric rows for Y = “{yCol}”. Try another column.
            </p>
          ) : chart === "line" ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={numericData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="y" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={numericData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="y" />
              </BarChart>
            </ResponsiveContainer>
          )
        ) : categoricalData.length === 0 ? (
          <p className="text-sm text-red-500">No categorical values found for Y = “{yCol}”.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoricalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
