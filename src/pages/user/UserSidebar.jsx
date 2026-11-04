
import { useCallback, useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  CalendarDays,
  Bell,
  User,
  LogOut,
  X,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

// =====================================================
// API CONFIGURATION
// =====================================================

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:5000/api"
    : "https://velsaka-pm-server.onrender.com/api")
)
  .trim()
  .replace(/\/+$/, "");

const NOTIFICATIONS_API = `${API_BASE_URL}/notifications`;

// Logo stored inside the public directory
const VELSAKA_LOGO = "/VelSAKA_Logo.jpeg";

// =====================================================
// NAVIGATION ITEMS
// =====================================================

const NAV_ITEMS = [
  {
    label: "Dashboard",
    to: "/user/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "My Projects",
    to: "/user/dashboard/projects",
    icon: FolderKanban,
  },
  {
    label: "My Tasks",
    to: "/user/dashboard/tasks",
    icon: CheckSquare,
  },
  {
    label: "Calendar",
    to: "/user/dashboard/calendar",
    icon: CalendarDays,
  },
  {
    label: "Notifications",
    to: "/user/dashboard/notifications",
    icon: Bell,
  },
  {
    label: "My Profile",
    to: "/user/dashboard/profile",
    icon: User,
  },
];

// =====================================================
// USER SIDEBAR
// =====================================================

const UserSidebar = ({ open, onClose }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [unreadCount, setUnreadCount] = useState(0);

  const userId = user?._id || user?.id || user?.uid;

  // ===================================================
  // FETCH UNREAD NOTIFICATION COUNT
  // ===================================================

  const fetchUnreadCount = useCallback(async () => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await fetch(
        `${NOTIFICATIONS_API}/${userId}/unread-count`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch notification count"
        );
      }

      setUnreadCount(Number(data.count) || 0);
    } catch (error) {
      console.error("Fetch notification count error:", error);
    }
  }, [userId]);

  // ===================================================
  // AUTO REFRESH
  // ===================================================

  useEffect(() => {
    fetchUnreadCount();

    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // ===================================================
  // LOGOUT
  // ===================================================

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  // ===================================================
  // UI
  // ===================================================

  return (
    <>
      {/* Mobile Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50
          flex h-screen w-64 flex-col
          border-r border-slate-200 bg-white
          transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        {/* Header / Brand */}
        <div className="flex h-20 items-center justify-between border-b border-slate-200 px-5">
          <div className="flex items-center gap-3">
            <img
              src={VELSAKA_LOGO}
              alt="VELSAKA Logo"
              className="h-10 w-10 rounded-xl object-contain"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />

            <div>
              <p className="text-sm font-bold tracking-wide text-slate-900">
                VELSAKA
              </p>

              <p className="text-[11px] text-slate-400">
                Project Management
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;

            const isNotificationItem =
              item.label === "Notifications";

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/user/dashboard"}
                onClick={onClose}
                className={({ isActive }) =>
                  `
                    flex items-center gap-3
                    rounded-xl px-3 py-2.5
                    text-sm font-medium transition
                    ${
                      isActive
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }
                  `
                }
              >
                <Icon size={18} />

                <span className="flex-1">
                  {item.label}
                </span>

                {isNotificationItem && unreadCount > 0 && (
                  <span
                    className="
                      flex h-5 min-w-[20px] items-center justify-center
                      rounded-full bg-red-500 px-1.5
                      text-[10px] font-bold text-white
                    "
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="border-t border-slate-200 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {user?.name || "User"}
              </p>

              <p className="truncate text-xs text-slate-400">
                {user?.email || ""}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="
              flex w-full items-center gap-3
              rounded-xl px-3 py-2.5
              text-sm font-medium text-red-600
              transition hover:bg-red-50
            "
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default UserSidebar;
