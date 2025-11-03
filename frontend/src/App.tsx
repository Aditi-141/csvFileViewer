import { Link } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";

export default function App() {
  const { user } = useAuth();
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold">CSV Files</h1>
      <nav className="flex gap-4">
        {user ? (
          <>
            <Link className="underline" to="/files">Files</Link>
            {user.is_admin && <Link className="underline" to="/admin/upload">Admin Upload</Link>}
            {user.is_admin && <Link className="underline" to="/admin/users">Admin Users</Link>}
          </>
        ) : (
          <>
            <Link className="underline" to="/login">Login</Link>
            <Link className="underline" to="/signup">Signup</Link>
          </>
        )}
      </nav>
    </div>
  );
}
