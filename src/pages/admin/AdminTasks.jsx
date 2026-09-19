import React, { useEffect, useState } from "react";
import {
  Plus,
  ClipboardList,
  User,
  FolderKanban,
  CalendarDays,
  Trash2,
  Edit3,
  X,
  Check,
  RefreshCw,
  Flag,
  Search,
  Clock3,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
} from "lucide-react";

import AdminSidebar from "./AdminSidebar";

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

const initialForm = {
  projectId: "",
  title: "",
  description: "",
  assignedTo: "",
  priority: "medium",
  dueDate: "",
};

const priorityStyles = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-blue-50 text-blue-600",
  high: "bg-orange-50 text-orange-600",
  urgent: "bg-red-50 text-red-600",
};

const statusStyles = {
  todo: "bg-slate-100 text-slate-600",
  "in-progress": "bg-blue-50 text-blue-600",
  review: "bg-purple-50 text-purple-600",
  completed: "bg-emerald-50 text-emerald-600",
};

const statusLabels = {
  todo: "To Do",
  "in-progress": "In Progress",
  review: "Review",
  completed: "Completed",
};

export default function AdminTasks() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const [formData, setFormData] = useState(initialForm);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  // =========================================================
  // LOAD
  // =========================================================

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        tasksResponse,
        projectsResponse,
        usersResponse,
      ] = await Promise.all([
        apiRequest("/tasks"),
        apiRequest("/projects"),
        apiRequest("/users"),
      ]);

      setTasks(tasksResponse.tasks || []);
      setProjects(projectsResponse.projects || []);
      setUsers(usersResponse.users || []);
    } catch (error) {
      console.error(error);
      setError(error.message || "Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // =========================================================
  // FORM
  // =========================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const openCreate = () => {
    setEditingTask(null);
    setFormData(initialForm);
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const openEdit = (task) => {
    setEditingTask(task);

    setFormData({
      projectId: getId(task.projectId),
      title: task.title || "",
      description: task.description || "",
      assignedTo: getId(task.assignedTo),
      priority: task.priority || "medium",
      dueDate: task.dueDate
        ? new Date(task.dueDate)
            .toISOString()
            .split("T")[0]
        : "",
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingTask(null);
    setFormData(initialForm);
    setError("");
  };

  // =========================================================
  // CREATE / UPDATE
  // =========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!formData.projectId) {
      setError("Please select a project.");
      return;
    }

    if (!formData.title.trim()) {
      setError("Please enter a task.");
      return;
    }

    if (!formData.assignedTo) {
      setError("Please select a user.");
      return;
    }

    try {
      setSaving(true);

      const taskData = {
        projectId: formData.projectId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        assignedTo: formData.assignedTo,
        priority: formData.priority,
        dueDate: formData.dueDate || null,
      };

      if (editingTask) {
        const response = await apiRequest(
          `/tasks/${getId(editingTask)}`,
          {
            method: "PUT",
            body: JSON.stringify(taskData),
          }
        );

        setTasks((previous) =>
          previous.map((task) =>
            getId(task) === getId(editingTask)
              ? response.task
              : task
          )
        );
      } else {
        const response = await apiRequest("/tasks", {
          method: "POST",
          body: JSON.stringify(taskData),
        });

        setTasks((previous) => [
          response.task,
          ...previous,
        ]);
      }

      setShowModal(false);
      setEditingTask(null);
      setFormData(initialForm);

      setSuccess(
        editingTask
          ? "Task updated successfully."
          : "Task assigned successfully."
      );
    } catch (error) {
      console.error(error);
      setError(error.message || "Failed to save task.");
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // DELETE
  // =========================================================

  const deleteTask = async (task) => {
    const taskId = getId(task);

    const confirmed = window.confirm(
      `Delete task "${task.title}"?`
    );

    if (!confirmed) return;

    try {
      await apiRequest(`/tasks/${taskId}`, {
        method: "DELETE",
      });

      setTasks((previous) =>
        previous.filter(
          (item) => getId(item) !== taskId
        )
      );

      setSuccess("Task deleted successfully.");
    } catch (error) {
      setError(
        error.message || "Failed to delete task."
      );
    }
  };

  // =========================================================
  // SEARCH
  // =========================================================

  const filteredTasks = tasks.filter((task) => {
    const query = search.toLowerCase().trim();

    if (!query) return true;

    const title = task.title?.toLowerCase() || "";
    const description =
      task.description?.toLowerCase() || "";
    const project =
      task.projectId?.name?.toLowerCase() || "";
    const user =
      task.assignedTo?.name?.toLowerCase() || "";

    return (
      title.includes(query) ||
      description.includes(query) ||
      project.includes(query) ||
      user.includes(query)
    );
  });

  // =========================================================
  // HELPERS
  // =========================================================

  const formatDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const getInitial = (name) => {
    return (
      name?.trim()?.charAt(0)?.toUpperCase() || "U"
    );
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f8fc]">
        <AdminSidebar />

        <main className="pt-16 lg:pl-[250px] lg:pt-0">
          <div className="mx-auto max-w-7xl p-5 sm:p-7">
            <div className="animate-pulse">
              <div className="h-9 w-52 rounded-lg bg-slate-200" />

              <div className="mt-3 h-4 w-80 rounded bg-slate-200" />

              <div className="mt-8 h-[500px] rounded-2xl bg-white" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="min-h-screen bg-[#f7f8fc]">
      <AdminSidebar />

      <main className="pt-16 lg:pl-[250px] lg:pt-0">
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">

          {/* =================================================
              HEADER
          ================================================= */}

          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-indigo-600">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
                  <ClipboardList size={16} />
                </div>

                Task Management
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Tasks
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Create and assign work to your project members.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreate}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.98] sm:w-auto"
            >
              <Plus size={18} />
              New Task
            </button>
          </div>

          {/* =================================================
              ALERTS
          ================================================= */}

          {error && !showModal && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0"
              />

              <span className="flex-1">
                {error}
              </span>

              <button
                type="button"
                onClick={() => setError("")}
              >
                <X size={17} />
              </button>
            </div>
          )}

          {success && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CheckCircle2
                size={18}
                className="mt-0.5 shrink-0"
              />

              <span className="flex-1">
                {success}
              </span>

              <button
                type="button"
                onClick={() => setSuccess("")}
              >
                <X size={17} />
              </button>
            </div>
          )}

          {/* =================================================
              TASK CARD
          ================================================= */}

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            {/* LIST HEADER */}

            <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:px-6 md:flex-row md:items-center md:justify-between">

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">
                    All Tasks
                  </h2>

                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                    {tasks.length}
                  </span>
                </div>

                <p className="mt-1 text-xs text-slate-500">
                  Manage tasks assigned to your team.
                </p>
              </div>

              {/* SEARCH */}

              <div className="relative w-full md:w-72">
                <Search
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search tasks..."
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>
            </div>

            {/* EMPTY */}

            {filteredTasks.length === 0 ? (
              <div className="px-6 py-20 text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <ClipboardList size={27} />
                </div>

                <h3 className="mt-5 text-base font-bold text-slate-900">
                  {search
                    ? "No tasks found"
                    : "No tasks yet"}
                </h3>

                <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-slate-500">
                  {search
                    ? "Try another search term."
                    : "Create your first task and assign it to a project member."}
                </p>

                {!search && (
                  <button
                    type="button"
                    onClick={openCreate}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                  >
                    <Plus size={16} />
                    Create Task
                  </button>
                )}
              </div>
            ) : (

              /* =================================================
                 TASK LIST
              ================================================= */

              <div className="divide-y divide-slate-100">

                {filteredTasks.map((task) => {
                  const priority =
                    task.priority || "medium";

                  const status =
                    task.status || "todo";

                  const userName =
                    task.assignedTo?.name ||
                    task.assignedTo?.email ||
                    "Unknown User";

                  return (
                    <div
                      key={getId(task)}
                      className="group p-5 transition hover:bg-slate-50 sm:p-6"
                    >

                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                        {/* LEFT */}

                        <div className="min-w-0 flex-1">

                          {/* TITLE */}

                          <div className="flex flex-wrap items-start gap-2">
                            <h3 className="min-w-0 text-sm font-bold text-slate-900 sm:text-base">
                              {task.title}
                            </h3>

                            <span
                              className={`rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                                priorityStyles[
                                  priority
                                ] ||
                                priorityStyles.medium
                              }`}
                            >
                              {priority}
                            </span>
                          </div>

                          {/* DESCRIPTION */}

                          {task.description && (
                            <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-500">
                              {task.description}
                            </p>
                          )}

                          {/* META */}

                          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">

                            {/* PROJECT */}

                            <div className="flex min-w-0 items-center gap-2">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                                <FolderKanban size={15} />
                              </div>

                              <div className="min-w-0">
                                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                                  Project
                                </p>

                                <p className="max-w-[180px] truncate text-xs font-semibold text-slate-700">
                                  {task.projectId?.name ||
                                    "Unknown Project"}
                                </p>
                              </div>
                            </div>

                            {/* USER */}

                            <div className="flex min-w-0 items-center gap-2">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                                {getInitial(userName)}
                              </div>

                              <div className="min-w-0">
                                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                                  Assigned To
                                </p>

                                <p className="max-w-[180px] truncate text-xs font-semibold text-slate-700">
                                  {userName}
                                </p>
                              </div>
                            </div>

                            {/* DATE */}

                            {task.dueDate && (
                              <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                  <CalendarDays size={15} />
                                </div>

                                <div>
                                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                                    Due Date
                                  </p>

                                  <p className="text-xs font-semibold text-slate-700">
                                    {formatDate(
                                      task.dueDate
                                    )}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* STATUS */}

                          <div className="mt-4">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
                                statusStyles[
                                  status
                                ] ||
                                statusStyles.todo
                              }`}
                            >
                              {status ===
                              "completed" ? (
                                <CheckCircle2
                                  size={13}
                                />
                              ) : (
                                <Clock3
                                  size={13}
                                />
                              )}

                              {statusLabels[
                                status
                              ] || "To Do"}
                            </span>
                          </div>
                        </div>

                        {/* ACTIONS */}

                        <div className="flex shrink-0 items-center gap-2 lg:pt-1">

                          <button
                            type="button"
                            onClick={() =>
                              openEdit(task)
                            }
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                          >
                            <Edit3 size={14} />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              deleteTask(task)
                            }
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* =====================================================
          CREATE / EDIT MODAL
      ===================================================== */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-[2px] sm:p-5">

          <div className="flex max-h-[calc(100vh-24px)] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[calc(100vh-40px)]">

            {/* MODAL HEADER */}

            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">

              <div className="flex min-w-0 items-center gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  {editingTask ? (
                    <Edit3 size={18} />
                  ) : (
                    <Plus size={19} />
                  )}
                </div>

                <div className="min-w-0">
                  <h2 className="truncate text-base font-bold text-slate-900 sm:text-lg">
                    {editingTask
                      ? "Edit Task"
                      : "Assign New Task"}
                  </h2>

                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    Select a project, write the task and assign it.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
              >
                <X size={19} />
              </button>
            </div>

            {/* MODAL BODY */}

            <form
              onSubmit={handleSubmit}
              className="min-h-0 overflow-y-auto"
            >
              <div className="space-y-5 p-5 sm:p-6">

                {/* MODAL ERROR */}

                {error && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-xs font-medium text-red-700">
                    <AlertCircle
                      size={16}
                      className="mt-0.5 shrink-0"
                    />

                    <span>{error}</span>
                  </div>
                )}

                {/* PROJECT */}

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600">
                    Project
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <div className="relative">
                    <FolderKanban
                      size={17}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <select
                      name="projectId"
                      value={formData.projectId}
                      onChange={handleChange}
                      className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                    >
                      <option value="">
                        Select Project
                      </option>

                      {projects.map((project) => (
                        <option
                          key={getId(project)}
                          value={getId(project)}
                        >
                          {project.name}
                        </option>
                      ))}
                    </select>

                    <ChevronDown
                      size={17}
                      className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                </div>

                {/* TASK TITLE */}

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600">
                    Task
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <div className="relative">
                    <ClipboardList
                      size={17}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="Enter task title"
                      maxLength={150}
                      className="h-12 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm font-medium text-slate-800 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                    />
                  </div>
                </div>

                {/* DESCRIPTION */}

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wide text-slate-600">
                      Description
                    </label>

                    <span className="text-[11px] text-slate-400">
                      Optional
                    </span>
                  </div>

                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Describe what needs to be completed..."
                    className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>

                {/* ASSIGN USER */}

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600">
                    Assign To
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <div className="relative">
                    <User
                      size={17}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <select
                      name="assignedTo"
                      value={formData.assignedTo}
                      onChange={handleChange}
                      className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                    >
                      <option value="">
                        Select User
                      </option>

                      {users
                        .filter(
                          (user) =>
                            user.accessRole !==
                              "admin" &&
                            user.status !==
                              "inactive"
                        )
                        .map((user) => (
                          <option
                            key={getId(user)}
                            value={getId(user)}
                          >
                            {user.name ||
                              user.email}
                          </option>
                        ))}
                    </select>

                    <ChevronDown
                      size={17}
                      className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                </div>

                {/* PRIORITY + DATE */}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                  {/* PRIORITY */}

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600">
                      Priority
                    </label>

                    <div className="relative">
                      <Flag
                        size={16}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <select
                        name="priority"
                        value={formData.priority}
                        onChange={handleChange}
                        className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-9 text-sm font-medium text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                      >
                        <option value="low">
                          Low
                        </option>

                        <option value="medium">
                          Medium
                        </option>

                        <option value="high">
                          High
                        </option>

                        <option value="urgent">
                          Urgent
                        </option>
                      </select>

                      <ChevronDown
                        size={16}
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                    </div>
                  </div>

                  {/* DATE */}

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600">
                      Due Date
                    </label>

                    <div className="relative">
                      <CalendarDays
                        size={16}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type="date"
                        name="dueDate"
                        value={formData.dueDate}
                        onChange={handleChange}
                        className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm font-medium text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* MODAL FOOTER */}

              <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-slate-100 bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-6">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <RefreshCw
                        size={16}
                        className="animate-spin"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={16} />

                      {editingTask
                        ? "Update Task"
                        : "Assign Task"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}