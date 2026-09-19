import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FolderKanban,
  ListTodo,
  CheckCircle2,
  Clock3,
  CalendarDays,
  ArrowUpRight,
  RefreshCw,
  AlertCircle,
  UserRound,
  BriefcaseBusiness,
  Mail,
} from "lucide-react";

import UserLayout from "./UserLayout";
import { useAuth } from "../../context/AuthContext";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

/* =========================================================
   API REQUEST
========================================================= */

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

/* =========================================================
   HELPERS
========================================================= */

const getId = (value) => {
  if (!value) return "";

  if (typeof value === "string") {
    return value;
  }

  return value._id || value.id || value.uid || "";
};

const formatDate = (date) => {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getFirstName = (name) => {
  if (!name) return "User";

  return name.trim().split(" ")[0];
};

/* FIXED: this function was missing */
const getInitial = (name) => {
  return name?.trim()?.charAt(0)?.toUpperCase() || "U";
};

/* =========================================================
   PROJECT STYLES
========================================================= */

const projectStatusStyles = {
  planning: "bg-slate-100 text-slate-600",
  active: "bg-blue-50 text-blue-600",
  completed: "bg-emerald-50 text-emerald-600",
  "on-hold": "bg-orange-50 text-orange-600",
};

const projectStatusLabels = {
  planning: "Planning",
  active: "Active",
  completed: "Completed",
  "on-hold": "On Hold",
};

/* =========================================================
   TASK STYLES
========================================================= */

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

const priorityStyles = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-blue-50 text-blue-600",
  high: "bg-orange-50 text-orange-600",
  urgent: "bg-red-50 text-red-600",
};

/* =========================================================
   COMPONENT
========================================================= */

function UserDashboard() {
  const navigate = useNavigate();

  const { user, authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);

  /*
   * IMPORTANT
   * Backend expects MongoDB User _id.
   */
  const mongoUserId = user?._id || user?.id;

  /* =========================================================
     LOAD DASHBOARD
  ========================================================= */

  const loadDashboard = async (isRefresh = false) => {
    if (!mongoUserId) {
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [projectsResponse, tasksResponse] =
        await Promise.all([
          apiRequest(`/projects/user/${mongoUserId}`),
          apiRequest(`/tasks/user/${mongoUserId}`),
        ]);

      /* ---------------- PROJECTS ---------------- */

      const fetchedProjects =
        projectsResponse?.projects ||
        (Array.isArray(projectsResponse)
          ? projectsResponse
          : []);

      const sortedProjects = [...fetchedProjects].sort(
        (a, b) =>
          new Date(b.createdAt || 0) -
          new Date(a.createdAt || 0)
      );

      setProjects(sortedProjects);

      /* ---------------- TASKS ---------------- */

      const fetchedTasks =
        tasksResponse?.tasks ||
        (Array.isArray(tasksResponse)
          ? tasksResponse
          : []);

      const sortedTasks = [...fetchedTasks].sort(
        (a, b) =>
          new Date(b.createdAt || 0) -
          new Date(a.createdAt || 0)
      );

      setTasks(sortedTasks);

      console.log("User Dashboard ID:", mongoUserId);
      console.log("User Projects:", sortedProjects);
      console.log("User Tasks:", sortedTasks);
    } catch (err) {
      console.error("User dashboard error:", err);

      setError(
        err?.message ||
          "Unable to load dashboard information."
      );

      if (!isRefresh) {
        setProjects([]);
        setTasks([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!mongoUserId) {
      setLoading(false);

      setError(
        "User information is unavailable. Please login again."
      );

      return;
    }

    loadDashboard();
  }, [authLoading, mongoUserId]);

  /* =========================================================
     DASHBOARD COUNTS
  ========================================================= */

  const totalProjects = projects.length;

  const pendingTasks = tasks.filter(
    (task) => task.status !== "completed"
  ).length;

  const completedTasks = tasks.filter(
    (task) => task.status === "completed"
  ).length;

  const upcomingTasks = tasks.filter((task) => {
    if (
      !task.dueDate ||
      task.status === "completed"
    ) {
      return false;
    }

    const dueDate = new Date(task.dueDate);

    return dueDate >= new Date();
  }).length;

  /* =========================================================
     RECENT / UPCOMING DATA
  ========================================================= */

  const recentTasks = tasks.slice(0, 5);

  const upcomingTaskList = [...tasks]
    .filter((task) => {
      if (
        !task.dueDate ||
        task.status === "completed"
      ) {
        return false;
      }

      return (
        new Date(task.dueDate) >= new Date()
      );
    })
    .sort(
      (a, b) =>
        new Date(a.dueDate) -
        new Date(b.dueDate)
    )
    .slice(0, 5);

  /* =========================================================
     STATS
  ========================================================= */

  const stats = [
    {
      title: "My Projects",
      value: totalProjects,
      icon: FolderKanban,
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-600",
    },
    {
      title: "Pending Tasks",
      value: pendingTasks,
      icon: ListTodo,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-600",
    },
    {
      title: "Completed",
      value: completedTasks,
      icon: CheckCircle2,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      title: "Upcoming",
      value: upcomingTasks,
      icon: CalendarDays,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
  ];

  /* =========================================================
     USER INFORMATION
  ========================================================= */

  const userName = user?.name || "User";

  const userEmail = user?.email || "";

  const userJobRole =
    user?.jobRole || "Team Member";

  const userDepartment =
    user?.department || "—";

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <UserLayout>
      <div className="min-h-screen bg-[#f7f8fc]">
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">

          {/* =================================================
              HEADER
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
                Welcome, {getFirstName(userName)}
              </h1>

              <p className="mt-1.5 text-sm text-slate-500">
                Here is your project and task overview.
              </p>
            </div>

            <button
              type="button"
              onClick={() => loadDashboard(true)}
              disabled={refreshing || loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={15}
                className={
                  refreshing ? "animate-spin" : ""
                }
              />

              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </button>
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
              STATS
          ================================================= */}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.title}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
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
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${stat.iconBg}`}
                    >
                      <Icon
                        size={21}
                        className={stat.iconColor}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* =================================================
              PROJECTS + TASKS
          ================================================= */}

          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">

            {/* ================= PROJECTS ================= */}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">
                      My Projects
                    </h2>

                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">
                      {projects.length}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    Projects assigned to you.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/user/dashboard/projects"
                    )
                  }
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 transition hover:text-slate-900"
                >
                  View all
                  <ArrowUpRight size={13} />
                </button>
              </div>

              {!loading && projects.length === 0 ? (
                <div className="px-5 py-14 text-center sm:px-6">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                    <FolderKanban size={22} />
                  </div>

                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    No projects assigned
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Projects assigned to you will
                    appear here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {loading ? (
                    <>
                      {[1, 2, 3].map((item) => (
                        <div
                          key={item}
                          className="flex items-center gap-3 px-5 py-4 sm:px-6"
                        >
                          <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-200" />

                          <div className="flex-1">
                            <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />

                            <div className="mt-2 h-3 w-24 animate-pulse rounded bg-slate-100" />
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    projects.slice(0, 5).map((project) => {
                      const status =
                        project.status || "planning";

                      return (
                        <button
                          type="button"
                          key={getId(project)}
                          onClick={() =>
                            navigate(
                              `/user/dashboard/projects?project=${getId(
                                project
                              )}`
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

                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                                  projectStatusStyles[
                                    status
                                  ] ||
                                  projectStatusStyles.planning
                                }`}
                              >
                                {projectStatusLabels[
                                  status
                                ] || status}
                              </span>

                              {project.dueDate && (
                                <span className="text-[10px] text-slate-400">
                                  Due{" "}
                                  {formatDate(
                                    project.dueDate
                                  )}
                                </span>
                              )}
                            </div>
                          </div>

                          <ArrowUpRight
                            size={16}
                            className="shrink-0 text-slate-300"
                          />
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </section>

            {/* ================= TASKS ================= */}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">
                      My Tasks
                    </h2>

                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">
                      {tasks.length}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    Tasks assigned to you.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/user/dashboard/tasks"
                    )
                  }
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 transition hover:text-slate-900"
                >
                  View all
                  <ArrowUpRight size={13} />
                </button>
              </div>

              {!loading && recentTasks.length === 0 ? (
                <div className="px-5 py-14 text-center sm:px-6">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                    <ListTodo size={22} />
                  </div>

                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    No tasks assigned
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Tasks assigned to you will
                    appear here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {loading ? (
                    <>
                      {[1, 2, 3].map((item) => (
                        <div
                          key={item}
                          className="flex items-start gap-3 px-5 py-4 sm:px-6"
                        >
                          <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-200" />

                          <div className="flex-1">
                            <div className="h-4 w-48 animate-pulse rounded bg-slate-200" />

                            <div className="mt-2 h-3 w-32 animate-pulse rounded bg-slate-100" />

                            <div className="mt-2 h-3 w-24 animate-pulse rounded bg-slate-100" />
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    recentTasks.map((task) => {
                      const status =
                        task.status || "todo";

                      const priority =
                        task.priority || "medium";

                      return (
                        <button
                          type="button"
                          key={getId(task)}
                          onClick={() =>
                            navigate(
                              "/user/dashboard/tasks"
                            )
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
                                <FolderKanban size={11} />

                                {task.projectId?.name ||
                                  "Unknown Project"}
                              </span>
                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                                  taskStatusStyles[
                                    status
                                  ] ||
                                  taskStatusStyles.todo
                                }`}
                              >
                                {status === "completed" ? (
                                  <CheckCircle2 size={10} />
                                ) : (
                                  <Clock3 size={10} />
                                )}

                                {taskStatusLabels[
                                  status
                                ] || "To Do"}
                              </span>

                              {task.dueDate && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                                  <CalendarDays size={10} />

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
                    })
                  )}
                </div>
              )}
            </section>
          </div>

          {/* =================================================
              UPCOMING TASKS
          ================================================= */}

          <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Upcoming Tasks
                </h2>

                <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-600">
                  {upcomingTasks}
                </span>
              </div>

              <p className="mt-1 text-xs text-slate-500">
                Your upcoming deadlines.
              </p>
            </div>

            {upcomingTaskList.length === 0 ? (
              <div className="px-5 py-12 text-center sm:px-6">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                  <CalendarDays size={22} />
                </div>

                <p className="mt-3 text-sm font-semibold text-slate-700">
                  No upcoming deadlines
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  You are all caught up.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {upcomingTaskList.map((task) => (
                  <button
                    type="button"
                    key={getId(task)}
                    onClick={() =>
                      navigate(
                        "/user/dashboard/tasks"
                      )
                    }
                    className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-slate-50 sm:px-6"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <CalendarDays size={18} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {task.title || "Untitled Task"}
                      </p>

                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="text-[10px] text-slate-400">
                          {task.projectId?.name ||
                            "Unknown Project"}
                        </span>

                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                            priorityStyles[
                              task.priority
                            ] ||
                            priorityStyles.medium
                          }`}
                        >
                          {task.priority || "medium"}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-xs font-semibold text-slate-700">
                        {formatDate(task.dueDate)}
                      </p>

                      <p className="mt-1 text-[10px] text-slate-400">
                        Due date
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* =================================================
              MY INFORMATION
          ================================================= */}

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h2 className="text-base font-bold text-slate-900">
                My Information
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Your current account information.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

              {/* NAME */}

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">
                    {getInitial(userName)}
                  </div>

                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Name
                    </p>

                    <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                      {userName}
                    </p>
                  </div>
                </div>
              </div>

              {/* EMAIL */}

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                    <Mail size={18} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Email
                    </p>

                    <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                      {userEmail || "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* JOB ROLE */}

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                    <BriefcaseBusiness size={18} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Job Role
                    </p>

                    <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                      {userJobRole}
                    </p>
                  </div>
                </div>
              </div>

              {/* DEPARTMENT */}

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                    <UserRound size={18} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Department
                    </p>

                    <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                      {userDepartment}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </section>

        </div>
      </div>
    </UserLayout>
  );
}

export default UserDashboard;