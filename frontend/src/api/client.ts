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
  if (!res.ok) throw new Error((await res.json()).detail || `Request failed: ${res.status}`);
  return res.json();
}
