import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import {
  LayoutDashboard,
  ClipboardList,
  FolderKanban,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Building2,
  UserCircle,
} from "lucide-react";

const navigation = [
  {
    label: "Dashboard",
    path: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Tasks",
    path: "/admin/tasks",
    icon: ClipboardList,
  },
  {
    label: "Projects",
    path: "/admin/projects",
    icon: FolderKanban,
  },
  {
    label: "Users",
    path: "/admin/users",
    icon: Users,
  },
];

const secondaryNavigation = [
  {
    label: "Settings",
    path: "/admin/settings",
    icon: Settings,
  },
];

export default function AdminSidebar() {
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    // Add Firebase/Auth logout here later.
    navigate("/login");
  };

  const closeMobileSidebar = () => {
    setMobileOpen(false);
  };

  return (
    <>
      {/* =====================================================
          MOBILE TOP BAR
      ===================================================== */}

      <div className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
            <Building2 size={18} />
          </div>

          <div>
            <p className="text-sm font-bold tracking-tight text-slate-900">
              VELSAKA
            </p>

            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
              Project Management
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* =====================================================
          MOBILE OVERLAY
      ===================================================== */}

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={closeMobileSidebar}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px] lg:hidden"
        />
      )}

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className={`
          fixed left-0 top-0 z-50 flex h-screen flex-col
          border-r border-slate-200 bg-white
          transition-all duration-300 ease-in-out

          ${
            collapsed
              ? "w-[76px]"
              : "w-[250px]"
          }

          ${
            mobileOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        {/* =================================================
            BRAND
        ================================================= */}

        <div
          className={`
            flex h-20 shrink-0 items-center border-b border-slate-100
            ${
              collapsed
                ? "justify-center px-3"
                : "justify-between px-5"
            }
          `}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
              <Building2 size={19} />
            </div>

            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-bold tracking-tight text-slate-900">
                  VELSAKA
                </p>

                <p className="truncate text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">
                  Project Management
                </p>
              </div>
            )}
          </div>

          {/* Mobile Close */}

          <button
            type="button"
            onClick={closeMobileSidebar}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 lg:hidden"
            aria-label="Close navigation"
          >
            <X size={19} />
          </button>
        </div>

        {/* =================================================
            WORKSPACE LABEL
        ================================================= */}

        {!collapsed && (
          <div className="px-5 pb-2 pt-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
              Workspace
            </p>
          </div>
        )}

        {/* =================================================
            PRIMARY NAVIGATION
        ================================================= */}

        <nav className="flex-1 overflow-y-auto px-3 py-2">
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/admin"}
                  onClick={closeMobileSidebar}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `
                    group relative flex h-11 items-center rounded-xl
                    text-sm font-medium transition-all duration-200

                    ${
                      collapsed
                        ? "justify-center px-2"
                        : "gap-3 px-3"
                    }

                    ${
                      isActive
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }
                    `
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        size={19}
                        strokeWidth={isActive ? 2.2 : 1.9}
                        className="shrink-0"
                      />

                      {!collapsed && (
                        <span className="truncate">
                          {item.label}
                        </span>
                      )}

                      {/* Active indicator */}

                      {isActive && !collapsed && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* =================================================
              SECONDARY
          ================================================= */}

          <div className="my-5 border-t border-slate-100" />

          {!collapsed && (
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
              System
            </p>
          )}

          <div className="space-y-1">
            {secondaryNavigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={closeMobileSidebar}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `
                    flex h-11 items-center rounded-xl
                    text-sm font-medium transition-all duration-200

                    ${
                      collapsed
                        ? "justify-center px-2"
                        : "gap-3 px-3"
                    }

                    ${
                      isActive
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }
                    `
                  }
                >
                  <Icon size={19} />

                  {!collapsed && (
                    <span>{item.label}</span>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* =================================================
            USER AREA
        ================================================= */}

        <div className="border-t border-slate-100 p-3">
          <div
            className={`
              mb-2 flex items-center rounded-xl bg-slate-50
              ${
                collapsed
                  ? "justify-center p-2"
                  : "gap-3 px-3 py-2.5"
              }
            `}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white">
              <UserCircle size={19} />
            </div>

            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-slate-800">
                  Company Admin
                </p>

                <p className="truncate text-[10px] text-slate-400">
                  Administrator
                </p>
              </div>
            )}
          </div>

          {/* Logout */}

          <button
            type="button"
            onClick={handleLogout}
            title={collapsed ? "Logout" : undefined}
            className={`
              flex h-10 w-full items-center rounded-xl
              text-sm font-medium text-slate-500
              transition hover:bg-red-50 hover:text-red-600

              ${
                collapsed
                  ? "justify-center"
                  : "gap-3 px-3"
              }
            `}
          >
            <LogOut size={18} />

            {!collapsed && <span>Logout</span>}
          </button>
        </div>

        {/* =================================================
            COLLAPSE BUTTON
        ================================================= */}

        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="absolute -right-3 top-[72px] hidden h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 lg:flex"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight size={15} />
          ) : (
            <ChevronLeft size={15} />
          )}
        </button>
      </aside>

      {/* =====================================================
          DESKTOP CONTENT SPACER

          This ensures page content does not sit underneath
          the fixed sidebar.
      ===================================================== */}

      <div
        className={`
          hidden shrink-0 transition-all duration-300 lg:block
          ${
            collapsed
              ? "w-[76px]"
              : "w-[250px]"
          }
        `}
      />
    </>
  );
}