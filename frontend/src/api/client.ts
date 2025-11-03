// FINAL – includes named export getToken
const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export type LoginResp = {
  access_token: string;
  token_type: string;
  username: string;
  is_admin: boolean;
};

function setToken(t: string) {
  localStorage.setItem("token", t);
}
export function getToken() {
  return localStorage.getItem("token");
}
export function clearToken() {
  localStorage.removeItem("token");
}

export async function login(username: string, password: string): Promise<LoginResp> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error((await res.json()).detail || "Login failed");
  const data = (await res.json()) as LoginResp;
  setToken(data.access_token);
  return data;
}

export async function signup(username: string, password: string): Promise<LoginResp> {
  const res = await fetch(`${BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error((await res.json()).detail || "Signup failed");
  const data = (await res.json()) as LoginResp;
  setToken(data.access_token);
  return data;
}

export async function api(path: string, init: RequestInit = {}) {
  const token = getToken();
  const headers = { ...(init.headers || {}), Authorization: token ? `Bearer ${token}` : "" } as any;
  const res = await fetch(`${BASE}${path}`, { ...init, headers });

  if (res.status === 401) {
    // token bad/expired → logout and bounce to login
    clearToken();
    // optional: keep the current path so user returns after login
    const after = encodeURIComponent(location.pathname + location.search);
    location.href = `/login?next=${after}`;
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    let msg = `Request failed: ${res.status}`;
    try { msg = (await res.json()).detail || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}
