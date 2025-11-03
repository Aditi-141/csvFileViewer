// src/auth/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from "react";
import { api, getToken } from "../api/client";

export type User = { id: number; username: string; is_admin: boolean; created_at: string };

const Ctx = createContext<{ user: User | null; setUser: (u: User | null) => void; loading: boolean; }>(
  { user: null, setUser: () => {}, loading: true }
);
export const useAuth = () => useContext(Ctx);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) { setLoading(false); return; }
    api("/auth/me")
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return <Ctx.Provider value={{ user, setUser, loading }}>{children}</Ctx.Provider>;
}
