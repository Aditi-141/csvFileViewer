import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthProvider, { useAuth } from "./auth/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Files from "./pages/Files";
import FileViewer from "./pages/FileViewer";
import AdminUpload from "./pages/AdminUpload";
import AdminUsers from "./pages/AdminUsers";
import "./index.css";

function Protected({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return null;               // or a spinner component
  if (user === null) return <Navigate to="/login" replace />;
  return children;
}

function AdminOnly({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user?.is_admin) return <Navigate to="/files" replace />;
  return children;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* All app pages share the Layout with <Outlet/> */}
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/files" replace />} />

            {/* Public */}
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />

            {/* Authed */}
            <Route path="files" element={<Protected><Files /></Protected>} />
            <Route path="files/:id" element={<Protected><FileViewer /></Protected>} />

            {/* Admin */}
            <Route path="admin/upload" element={<AdminOnly><AdminUpload /></AdminOnly>} />
            <Route path="admin/users" element={<AdminOnly><AdminUsers /></AdminOnly>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
