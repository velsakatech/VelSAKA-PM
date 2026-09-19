import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Loader2 } from "lucide-react";

import AdminSidebar from "./AdminSideBar";
import { useAuth } from "../../context/AuthContext";

const AdminLayout = ({ children, title, subtitle }) => {
  const navigate = useNavigate();
  const { user, authLoading } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    if (user.accessRole !== "admin") {
      navigate("/user/dashboard", { replace: true });
    }
  }, [authLoading, user, navigate]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <Loader2 size={20} className="animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  if (user.accessRole !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="lg:ml-64 min-h-screen">
        <header className="h-20 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600"
              aria-label="Open sidebar"
            >
              <Menu size={22} />
            </button>

            <div>
              <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {subtitle || "VELSAKA Project Management"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-slate-800">
                {user.name}
              </p>
              <p className="text-xs text-slate-400">
                {user.jobRole || "Administrator"}
              </p>
            </div>

            <div className="h-10 w-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-semibold">
              {user.name?.charAt(0)?.toUpperCase() || "A"}
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;