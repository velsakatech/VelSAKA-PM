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

const API_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
  "http://localhost:5000/api";

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

const UserSidebar = ({ open, onClose }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [unreadCount, setUnreadCount] = useState(0);

  const userId = user?._id || user?.id || user?.uid;

  const fetchUnreadCount = useCallback(async () => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/notifications/${userId}/unread-count`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch notification count"
        );
      }

      setUnreadCount(data.count || 0);
    } catch (error) {
      console.error(
        "Fetch notification count error:",
        error
      );
    }
  }, [userId]);

  useEffect(() => {
    fetchUnreadCount();

    // Refresh notification count every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen w-64 bg-white border-r border-slate-200
          flex flex-col
          transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        {/* Header */}
        <div className="h-20 flex items-center justify-between px-5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
              V
            </div>

            <div>
              <p className="text-sm font-bold text-slate-900">
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
            className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
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
                    flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                    transition
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
                      min-w-[20px] h-5 px-1.5
                      rounded-full
                      bg-red-500
                      text-white
                      text-[10px]
                      font-bold
                      flex items-center justify-center
                    "
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="border-t border-slate-200 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-semibold">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {user?.name || "User"}
              </p>

              <p className="text-xs text-slate-400 truncate">
                {user?.email || ""}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="
              w-full flex items-center gap-3
              px-3 py-2.5 rounded-xl
              text-sm font-medium
              text-red-600
              hover:bg-red-50
              transition
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