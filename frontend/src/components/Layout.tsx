import { Link, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { clearToken } from "../api/client";

export default function Layout() {
  const { user, setUser } = useAuth();
  const nav = useNavigate();

  function logout() {
    clearToken();
    setUser(null);
    nav("/login");
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">CSV Dashboard</h1>
        <nav className="flex gap-4 items-center">
          {user ? (
            <>
              <Link className="underline" to="/files">Files</Link>
              {user.is_admin && <Link className="underline" to="/admin/upload">Admin Upload</Link>}
              {user.is_admin && <Link className="underline" to="/admin/users">Manage Users</Link>}
              <span className="text-sm text-gray-600">Hi, {user.username}</span>
              <button className="underline" onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <Link className="underline" to="/login">Login</Link>
              <Link className="underline" to="/signup">Signup</Link>
            </>
          )}
        </nav>
      </header>

      {/* Child routes render here */}
      <Outlet />
    </div>
  );
}
