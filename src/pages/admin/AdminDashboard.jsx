import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Users,
  FolderKanban,
  ListTodo,
  CheckCircle2,
  ArrowUpRight,
  RefreshCw,
  Plus,
  Clock3,
  CalendarDays,
  UserRound,
  AlertCircle,
  X,
} from "lucide-react";

import AdminSidebar from "./AdminSideBar";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const apiRequest = async (endpoint, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data?.message || `Request failed: ${response.status}`
    );
  }

  return data;
};

const getId = (value) => {
  if (!value) return "";

  if (typeof value === "string") {
    return value;
  }

  return value._id || value.id || value.uid || "";
};

const formatDate = (date) => {
  if (!date) return "";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getInitial = (name) => {
  return name?.trim()?.charAt(0)?.toUpperCase() || "U";
};

const statusStyles = {
  planning: "bg-slate-100 text-slate-600",
  active: "bg-blue-50 text-blue-600",
  completed: "bg-emerald-50 text-emerald-600",
  "on-hold": "bg-orange-50 text-orange-600",
};

const statusLabels = {
  planning: "Planning",
  active: "Active",
  completed: "Completed",
  "on-hold": "On Hold",
};

const priorityStyles = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-blue-50 text-blue-600",
  high: "bg-orange-50 text-orange-600",
  urgent: "bg-red-50 text-red-600",
};

const taskStatusStyles = {
  todo: "bg-slate-100 text-slate-600",
  "in-progress": "bg-blue-50 text-blue-600",
  review: "bg-purple-50 text-purple-600",
  completed: "bg-emerald-50 text-emerald-600",
};

const taskStatusLabels = {
  todo: "To Do",
  "in-progress": "In Progress",
  review: "Review",
  completed: "Completed",
};

function AdminDashboard() {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [statsData, setStatsData] = useState({
    totalUsers: 0,
    totalProjects: 0,
    activeTasks: 0,
    completedTasks: 0,
  });

  const [recentProjects, setRecentProjects] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);

  // =========================================================
  // LOAD DASHBOARD
  // =========================================================

  const loadDashboard = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [
        statsResponse,
        projectsResponse,
        tasksResponse,
      ] = await Promise.all([
        apiRequest("/admin/dashboard/stats"),
        apiRequest("/projects"),
        apiRequest("/tasks"),
      ]);

      // =========================
      // STATS
      // =========================

      if (statsResponse?.success === false) {
        throw new Error(
          statsResponse.message ||
            "Failed to load dashboard statistics."
        );
      }

      const stats = statsResponse?.stats || {};

      setStatsData({
        totalUsers: stats.totalUsers || 0,
        totalProjects: stats.totalProjects || 0,
        activeTasks: stats.activeTasks || 0,
        completedTasks: stats.completedTasks || 0,
      });

      // =========================
      // PROJECTS
      // =========================

      const projects =
        projectsResponse?.projects ||
        (Array.isArray(projectsResponse)
          ? projectsResponse
          : []);

      const sortedProjects = [...projects]
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0) -
            new Date(a.createdAt || 0)
        )
        .slice(0, 5);

      setRecentProjects(sortedProjects);

      // =========================
      // TASKS
      // =========================

      const tasks =
        tasksResponse?.tasks ||
        (Array.isArray(tasksResponse)
          ? tasksResponse
          : []);

      const sortedTasks = [...tasks]
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0) -
            new Date(a.createdAt || 0)
        )
        .slice(0, 5);

      setRecentTasks(sortedTasks);
    } catch (err) {
      console.error("Dashboard error:", err);

      setError(
        err.message ||
          "Unable to load dashboard information."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // =========================================================
  // STATS
  // =========================================================

  const stats = [
    {
      title: "Total Users",
      value: statsData.totalUsers,
      icon: Users,
      path: "/admin/users",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      title: "Total Projects",
      value: statsData.totalProjects,
      icon: FolderKanban,
      path: "/admin/projects",
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-600",
    },
    {
      title: "Active Tasks",
      value: statsData.activeTasks,
      icon: ListTodo,
      path: "/admin/tasks",
      iconBg: "bg-orange-50",
      iconColor: "text-orange-600",
    },
    {
      title: "Completed Tasks",
      value: statsData.completedTasks,
      icon: CheckCircle2,
      path: "/admin/tasks",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
  ];

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="min-h-screen bg-[#f7f8fc]">
      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="min-w-0 pt-16 lg:ml-64 lg:pt-0">
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">

          {/* =================================================
              MOBILE HEADER
          ================================================= */}

          <div className="mb-6 flex items-center justify-between lg:hidden">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-600">
                VELSAKA
              </p>

              <h2 className="mt-0.5 text-base font-bold text-slate-900">
                Project Management
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Menu
            </button>
          </div>

          {/* =================================================
              PAGE HEADER
          ================================================= */}

          <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-400">
                <span>Workspace</span>
                <span>/</span>
                <span className="font-semibold text-slate-600">
                  Dashboard
                </span>
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Admin Dashboard
              </h1>

              <p className="mt-1.5 text-sm text-slate-500">
                Monitor your VELSAKA project workspace.
              </p>
            </div>

            <div className="flex items-center gap-2">

              <button
                type="button"
                onClick={() => navigate("/admin/projects")}
                className="hidden h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 sm:inline-flex"
              >
                <Plus size={16} />
                New Project
              </button>

              <button
                type="button"
                onClick={() => loadDashboard(true)}
                disabled={refreshing}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  size={15}
                  className={
                    refreshing
                      ? "animate-spin"
                      : ""
                  }
                />

                <span className="hidden sm:inline">
                  {refreshing
                    ? "Refreshing..."
                    : "Refresh"}
                </span>
              </button>
            </div>
          </div>

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div className="mb-6 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-red-500">
                  <AlertCircle size={18} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-red-800">
                    Unable to load dashboard
                  </p>

                  <p className="mt-1 text-xs leading-5 text-red-600">
                    {error}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => loadDashboard()}
                className="w-fit rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
              >
                Try again
              </button>
            </div>
          )}

          {/* =================================================
              STATISTICS
          ================================================= */}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <button
                  key={stat.title}
                  type="button"
                  onClick={() =>
                    navigate(stat.path)
                  }
                  className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">

                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-500">
                        {stat.title}
                      </p>

                      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                        {loading ? (
                          <span className="inline-block h-9 w-14 animate-pulse rounded-md bg-slate-200" />
                        ) : (
                          stat.value
                        )}
                      </p>
                    </div>

                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${stat.iconBg} transition duration-200 group-hover:bg-slate-900`}
                    >
                      <Icon
                        size={21}
                        strokeWidth={2}
                        className={`${stat.iconColor} transition group-hover:text-white`}
                      />
                    </div>
                  </div>

                  <div className="mt-5 flex items-center gap-1 text-xs font-semibold text-slate-400 transition group-hover:text-slate-700">
                    View details
                    <ArrowUpRight size={13} />
                  </div>
                </button>
              );
            })}
          </div>

          {/* =================================================
              RECENT CONTENT
          ================================================= */}

          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">

            {/* =================================================
                RECENT PROJECTS
            ================================================= */}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">
                      Recent Projects
                    </h2>

                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">
                      {recentProjects.length}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    Latest projects in your workspace.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/admin/projects")
                  }
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 transition hover:text-slate-900"
                >
                  View all
                  <ArrowUpRight size={13} />
                </button>
              </div>

              {recentProjects.length === 0 ? (
                <div className="px-5 py-14 text-center sm:px-6">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                    <FolderKanban size={22} />
                  </div>

                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    No projects yet
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Create your first project.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      navigate("/admin/projects")
                    }
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                  >
                    <Plus size={14} />
                    Create Project
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">

                  {recentProjects.map((project) => {
                    const status =
                      project.status || "planning";

                    return (
                      <button
                        type="button"
                        key={getId(project)}
                        onClick={() =>
                          navigate(
                            `/admin/projects`
                          )
                        }
                        className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-slate-50 sm:px-6"
                      >

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                          <FolderKanban size={18} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {project.name ||
                              "Untitled Project"}
                          </p>

                          <div className="mt-1 flex items-center gap-2">
                            <span
                              className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                                statusStyles[
                                  status
                                ] ||
                                statusStyles.planning
                              }`}
                            >
                              {statusLabels[
                                status
                              ] || status}
                            </span>

                            {project.createdAt && (
                              <span className="text-[10px] text-slate-400">
                                {formatDate(
                                  project.createdAt
                                )}
                              </span>
                            )}
                          </div>
                        </div>

                        <ArrowUpRight
                          size={16}
                          className="shrink-0 text-slate-300 transition group-hover:text-slate-500"
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {/* =================================================
                RECENT TASKS
            ================================================= */}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">
                      Recent Tasks
                    </h2>

                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">
                      {recentTasks.length}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    Latest task activity.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/admin/tasks")
                  }
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 transition hover:text-slate-900"
                >
                  View all
                  <ArrowUpRight size={13} />
                </button>
              </div>

              {recentTasks.length === 0 ? (
                <div className="px-5 py-14 text-center sm:px-6">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                    <ListTodo size={22} />
                  </div>

                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    No tasks yet
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Assign your first task to a team member.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      navigate("/admin/tasks")
                    }
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                  >
                    <Plus size={14} />
                    Create Task
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">

                  {recentTasks.map((task) => {
                    const status =
                      task.status || "todo";

                    const priority =
                      task.priority || "medium";

                    const assignedUser =
                      task.assignedTo?.name ||
                      task.assignedTo?.email ||
                      "Unassigned";

                    return (
                      <button
                        type="button"
                        key={getId(task)}
                        onClick={() =>
                          navigate("/admin/tasks")
                        }
                        className="flex w-full items-start gap-3 px-5 py-4 text-left transition hover:bg-slate-50 sm:px-6"
                      >

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                          <ListTodo size={18} />
                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold text-slate-800">
                              {task.title ||
                                "Untitled Task"}
                            </p>

                            <span
                              className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                                priorityStyles[
                                  priority
                                ] ||
                                priorityStyles.medium
                              }`}
                            >
                              {priority}
                            </span>
                          </div>

                          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">

                            <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                              <FolderKanban
                                size={11}
                              />

                              {task.projectId
                                ?.name ||
                                "Unknown Project"}
                            </span>

                            <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                              <UserRound
                                size={11}
                              />

                              {assignedUser}
                            </span>
                          </div>

                          <div className="mt-2 flex items-center gap-2">

                            <span
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                                taskStatusStyles[
                                  status
                                ] ||
                                taskStatusStyles.todo
                              }`}
                            >
                              {status ===
                              "completed" ? (
                                <CheckCircle2
                                  size={10}
                                />
                              ) : (
                                <Clock3
                                  size={10}
                                />
                              )}

                              {taskStatusLabels[
                                status
                              ] || "To Do"}
                            </span>

                            {task.dueDate && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                                <CalendarDays
                                  size={10}
                                />
                                {formatDate(
                                  task.dueDate
                                )}
                              </span>
                            )}
                          </div>
                        </div>

                        <ArrowUpRight
                          size={16}
                          className="mt-1 shrink-0 text-slate-300"
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* =================================================
              QUICK ACTIONS
          ================================================= */}

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

            <div className="mb-5">
              <h2 className="text-base font-bold text-slate-900">
                Quick Actions
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Quickly access the main workspace sections.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

              <button
                type="button"
                onClick={() =>
                  navigate("/admin/users")
                }
                className="group flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition hover:border-blue-200 hover:bg-blue-50/50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Users size={18} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800">
                    Manage Users
                  </p>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Create and manage team members
                  </p>
                </div>

                <ArrowUpRight
                  size={16}
                  className="text-slate-300 transition group-hover:text-blue-500"
                />
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate("/admin/projects")
                }
                className="group flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition hover:border-indigo-200 hover:bg-indigo-50/50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <FolderKanban size={18} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800">
                    Manage Projects
                  </p>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Create and assign projects
                  </p>
                </div>

                <ArrowUpRight
                  size={16}
                  className="text-slate-300 transition group-hover:text-indigo-500"
                />
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate("/admin/tasks")
                }
                className="group flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition hover:border-orange-200 hover:bg-orange-50/50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  <ListTodo size={18} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800">
                    Manage Tasks
                  </p>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Assign and track team tasks
                  </p>
                </div>

                <ArrowUpRight
                  size={16}
                  className="text-slate-300 transition group-hover:text-orange-500"
                />
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;