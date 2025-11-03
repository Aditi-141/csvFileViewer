import { useState } from "react";
import { login, api } from "../api/client";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const nav = useNavigate();
  const { setUser } = useAuth();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      await login(username, password);
      const me = await api("/auth/me");
      setUser(me);
      nav("/files");
    } catch (e: any) {
      setErr(e.message ?? "Login failed");
    }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      {err && <p className="text-red-600 mb-3">{err}</p>}
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="border p-2 w-full" placeholder="Username" value={username} onChange={e=>setUsername(e.target.value)} />
        <input className="border p-2 w-full" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="bg-black text-white px-4 py-2 rounded" type="submit">Login</button>
      </form>
      <p className="mt-3 text-sm">No account? <Link className="underline" to="/signup">Sign up</Link></p>
    </div>
  );
}
