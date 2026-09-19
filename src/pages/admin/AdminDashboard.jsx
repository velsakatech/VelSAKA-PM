import React, { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock3,
  FolderKanban,
  ListTodo,
  RefreshCw,
  Users,
  ArrowRight,
  Plus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";

/*
|--------------------------------------------------------------------------
| Production API Configuration
|--------------------------------------------------------------------------
| Vercel Environment Variable:
|
| API_URL=https://velsaka-pm-server.onrender.com
|
| API paths are added inside apiRequest() calls.
|--------------------------------------------------------------------------
*/

const API_BASE_URL = import.meta.env.API_URL
  ? import.meta.env.API_URL.trim().replace(/\/+$/, "")
  : "";

const apiRequest = async (endpoint, options = {}) => {
  if (!API_BASE_URL) {
    throw new Error(
      "API_URL environment variable is not configured."
    );
  }

  const cleanEndpoint = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;

  const url = `${API_BASE_URL}${cleanEndpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        `Request failed with status ${response.status}`
    );
  }

  return data;
};

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const formatDate = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getProjectStatusClass = (status) => {
  switch (status) {
    case "active":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "completed":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "on-hold":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "planning":
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
};

const getTaskStatusClass = (status) => {
  switch (status) {
    case "completed":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "in-progress":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "review":
      return "bg-purple-50 text-purple-700 border-purple-200";

    case "todo":
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
};

const getPriorityClass = (priority) => {
  switch (priority) {
    case "urgent":
      return "bg-red-50 text-red-700 border-red-200";

    case "high":
      return "bg-orange-50 text-orange-700 border-orange-200";

    case "medium":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "low":
    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
};

/*
|--------------------------------------------------------------------------
| Stat Card
|--------------------------------------------------------------------------
*/

const StatCard = ({
  title,
  value,
  icon: Icon,
  description,
  loading,
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          {loading ? (
            <div className="mt-3 h-8 w-20 animate-pulse rounded-lg bg-slate-200" />
          ) : (
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              {value}
            </p>
          )}

          <p className="mt-2 text-xs text-slate-500">
            {description}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100">
          <Icon
            size={21}
            className="text-slate-700"
          />
        </div>
      </div>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| Empty State
|--------------------------------------------------------------------------
*/

const EmptyState = ({ message }) => {
  return (
    <div className="flex min-h-[180px] items-center justify-center px-6 text-center">
      <div>
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
          <FolderKanban
            size={20}
            className="text-slate-500"
          />
        </div>

        <p className="mt-3 text-sm font-medium text-slate-700">
          {message}
        </p>
      </div>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| Admin Dashboard
|--------------------------------------------------------------------------
*/

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [statsData, setStatsData] = useState({
    totalUsers: 0,
    totalProjects: 0,
    activeTasks: 0,
    completedTasks: 0,
  });

  const [recentProjects, setRecentProjects] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Load Dashboard
  |--------------------------------------------------------------------------
  */

  const loadDashboard = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        /*
        |--------------------------------------------------------------------------
        | Dashboard Statistics
        |--------------------------------------------------------------------------
        | Backend:
        | /api/admin/dashboard/stats
        |--------------------------------------------------------------------------
        */

        const statsResponse = await apiRequest(
          "/api/admin/dashboard/stats"
        );

        if (statsResponse?.success === false) {
          throw new Error(
            statsResponse.message ||
              "Failed to load dashboard statistics."
          );
        }

        const stats = statsResponse?.stats || {};

        setStatsData({
          totalUsers:
            Number(stats.totalUsers) || 0,

          totalProjects:
            Number(stats.totalProjects) || 0,

          activeTasks:
            Number(stats.activeTasks) || 0,

          completedTasks:
            Number(stats.completedTasks) || 0,
        });

        /*
        |--------------------------------------------------------------------------
        | Recent Projects
        |--------------------------------------------------------------------------
        | Backend:
        | /api/projects
        |--------------------------------------------------------------------------
        */

        try {
          const projectsResponse =
            await apiRequest("/api/projects");

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
        } catch (projectsError) {
          console.error(
            "Recent projects error:",
            projectsError
          );

          setRecentProjects([]);
        }

        /*
        |--------------------------------------------------------------------------
        | Recent Tasks
        |--------------------------------------------------------------------------
        | Backend:
        | /api/tasks
        |--------------------------------------------------------------------------
        */

        try {
          const tasksResponse =
            await apiRequest("/api/tasks");

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
        } catch (tasksError) {
          console.error(
            "Recent tasks error:",
            tasksError
          );

          setRecentTasks([]);
        }
      } catch (dashboardError) {
        console.error(
          "Dashboard loading error:",
          dashboardError
        );

        setError(
          dashboardError?.message ||
            "Unable to load dashboard information."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | Initial Load
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  /*
  |--------------------------------------------------------------------------
  | Navigation
  |--------------------------------------------------------------------------
  */

  const handleCreateProject = () => {
    navigate("/admin/projects");
  };

  const handleManageUsers = () => {
    navigate("/admin/users");
  };

  const handleViewProjects = () => {
    navigate("/admin/projects");
  };

  const handleViewTasks = () => {
    navigate("/admin/tasks");
  };

  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminSidebar />

      <main className="ml-0 min-h-screen lg:ml-64">
        <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">

          {/* Header */}

          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Admin Panel
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Dashboard
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Monitor your team, projects and tasks.
              </p>
            </div>

            <button
              type="button"
              onClick={() => loadDashboard(true)}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />

              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </button>
          </div>

          {/* Error */}

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
              <AlertCircle
                size={20}
                className="mt-0.5 shrink-0 text-red-600"
              />

              <div className="min-w-0">
                <p className="text-sm font-semibold text-red-800">
                  Dashboard could not be loaded
                </p>

                <p className="mt-1 text-sm text-red-700">
                  {error}
                </p>
              </div>

              <button
                type="button"
                onClick={() => loadDashboard()}
                className="ml-auto shrink-0 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          )}

          {/* Statistics */}

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Users"
              value={statsData.totalUsers}
              icon={Users}
              description="Registered team members"
              loading={loading}
            />

            <StatCard
              title="Total Projects"
              value={statsData.totalProjects}
              icon={FolderKanban}
              description="Projects in the system"
              loading={loading}
            />

            <StatCard
              title="Active Tasks"
              value={statsData.activeTasks}
              icon={Activity}
              description="Tasks currently in progress"
              loading={loading}
            />

            <StatCard
              title="Completed Tasks"
              value={statsData.completedTasks}
              icon={CheckCircle2}
              description="Successfully completed tasks"
              loading={loading}
            />
          </section>

          {/* Main Content */}

          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">

            {/* Recent Projects */}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Recent Projects
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Latest projects created by your team
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleViewProjects}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700 transition hover:text-slate-950"
                >
                  View all
                  <ArrowRight size={15} />
                </button>
              </div>

              {loading ? (
                <div className="space-y-3 p-5">
                  {[1, 2, 3, 4, 5].map(
                    (item) => (
                      <div
                        key={item}
                        className="h-14 animate-pulse rounded-xl bg-slate-100"
                      />
                    )
                  )}
                </div>
              ) : recentProjects.length === 0 ? (
                <EmptyState message="No projects available." />
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentProjects.map(
                    (project) => (
                      <div
                        key={
                          project._id ||
                          project.id
                        }
                        className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-slate-50"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {project.name ||
                              "Untitled Project"}
                          </p>

                          <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                            <Clock3 size={13} />

                            {formatDate(
                              project.createdAt
                            )}
                          </div>
                        </div>

                        <span
                          className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${getProjectStatusClass(
                            project.status
                          )}`}
                        >
                          {project.status ||
                            "planning"}
                        </span>
                      </div>
                    )
                  )}
                </div>
              )}
            </section>

            {/* Recent Tasks */}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Recent Tasks
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Latest tasks created in your workspace
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleViewTasks}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700 transition hover:text-slate-950"
                >
                  View all
                  <ArrowRight size={15} />
                </button>
              </div>

              {loading ? (
                <div className="space-y-3 p-5">
                  {[1, 2, 3, 4, 5].map(
                    (item) => (
                      <div
                        key={item}
                        className="h-14 animate-pulse rounded-xl bg-slate-100"
                      />
                    )
                  )}
                </div>
              ) : recentTasks.length === 0 ? (
                <EmptyState message="No tasks available." />
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentTasks.map(
                    (task) => (
                      <div
                        key={
                          task._id ||
                          task.id
                        }
                        className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-slate-50"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {task.title ||
                              "Untitled Task"}
                          </p>

                          <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                            <ListTodo size={13} />

                            <span className="truncate">
                              {task.projectId
                                ?.name ||
                                task.project
                                  ?.name ||
                                "Project"}
                            </span>
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-1.5">
                          <span
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${getTaskStatusClass(
                              task.status
                            )}`}
                          >
                            {task.status ||
                              "todo"}
                          </span>

                          {task.priority && (
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${getPriorityClass(
                                task.priority
                              )}`}
                            >
                              {task.priority}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </section>
          </div>

          {/* Quick Actions */}

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="text-base font-bold text-slate-900">
                Quick Actions
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Common administrative actions
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">

              {/* Create Project */}

              <button
                type="button"
                onClick={handleCreateProject}
                className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-slate-300 hover:bg-slate-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <Plus size={18} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Create Project
                  </p>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Start a new project
                  </p>
                </div>
              </button>

              {/* Manage Users */}

              <button
                type="button"
                onClick={handleManageUsers}
                className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-slate-300 hover:bg-slate-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <Users size={18} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Manage Users
                  </p>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Manage team members
                  </p>
                </div>
              </button>

              {/* Manage Tasks */}

              <button
                type="button"
                onClick={handleViewTasks}
                className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-slate-300 hover:bg-slate-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <ListTodo size={18} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Manage Tasks
                  </p>

                  <p className="mt-0.5 text-xs text-slate-500">
                    View and manage tasks
                  </p>
                </div>
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;