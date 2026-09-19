import { useEffect, useMemo, useState } from "react";
import {
  CheckSquare,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle2,
  Circle,
  Calendar,
  Flag,
  Inbox,
  Eye,
  FolderKanban,
  User,
  ChevronDown,
  Timer,
  CircleDot,
} from "lucide-react";

import UserLayout from "./UserLayout";
import { useAuth } from "../../context/AuthContext";

const API_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
  "http://localhost:5000/api";

// =========================================================
// CONSTANTS
// =========================================================

const STATUS_OPTIONS = [
  {
    value: "todo",
    label: "Pending",
    shortLabel: "Pending",
    icon: Circle,
  },
  {
    value: "in-progress",
    label: "In Progress",
    shortLabel: "In Progress",
    icon: Clock,
  },
  {
    value: "review",
    label: "In Review",
    shortLabel: "Review",
    icon: Eye,
  },
  {
    value: "completed",
    label: "Completed",
    shortLabel: "Completed",
    icon: CheckCircle2,
  },
];

// =========================================================
// HELPERS
// =========================================================

const getPriorityClass = (priority) => {
  switch (priority) {
    case "urgent":
      return "border-red-200 bg-red-50 text-red-700";

    case "high":
      return "border-orange-200 bg-orange-50 text-orange-700";

    case "medium":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "low":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
};

const getPriorityLabel = (priority) => {
  if (!priority) return "Not set";

  return (
    priority.charAt(0).toUpperCase() +
    priority.slice(1)
  );
};

const getPriorityIconClass = (priority) => {
  switch (priority) {
    case "urgent":
      return "text-red-600";

    case "high":
      return "text-orange-600";

    case "medium":
      return "text-amber-600";

    case "low":
      return "text-emerald-600";

    default:
      return "text-slate-500";
  }
};

const getStatusClass = (status) => {
  switch (status) {
    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "in-progress":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "review":
      return "border-violet-200 bg-violet-50 text-violet-700";

    case "todo":
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case "completed":
      return <CheckCircle2 size={14} />;

    case "in-progress":
      return <Clock size={14} />;

    case "review":
      return <Eye size={14} />;

    case "todo":
    default:
      return <Circle size={14} />;
  }
};

const getStatusLabel = (status) => {
  const found = STATUS_OPTIONS.find(
    (item) => item.value === status
  );

  return found ? found.label : status || "Unknown";
};

const formatDate = (date) => {
  if (!date) return "Not set";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not set";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (date) => {
  if (!date) return "Not available";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not available";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const isOverdue = (dueDate, status) => {
  if (!dueDate || status === "completed") {
    return false;
  }

  const today = new Date();
  const due = new Date(dueDate);

  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  return due < today;
};

const getDaysText = (dueDate, status) => {
  if (!dueDate || status === "completed") {
    return null;
  }

  const today = new Date();
  const due = new Date(dueDate);

  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const difference =
    due.getTime() - today.getTime();

  const days = Math.ceil(
    difference / (1000 * 60 * 60 * 24)
  );

  if (days < 0) {
    return `${Math.abs(days)} day${
      Math.abs(days) === 1 ? "" : "s"
    } overdue`;
  }

  if (days === 0) {
    return "Due today";
  }

  if (days === 1) {
    return "Due tomorrow";
  }

  return `${days} days remaining`;
};

// =========================================================
// STAT CARD
// =========================================================

const StatCard = ({
  label,
  value,
  icon,
  accent,
  description,
}) => {
  const accentClasses = {
    slate: "bg-slate-100 text-slate-700",
    amber: "bg-amber-50 text-amber-600",
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-1.5 text-2xl font-bold text-slate-900">
            {value}
          </p>

          {description && (
            <p className="mt-1 text-[11px] text-slate-400">
              {description}
            </p>
          )}
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            accentClasses[accent] ||
            accentClasses.slate
          }`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

// =========================================================
// EMPTY STATE
// =========================================================

const EmptyState = ({
  icon,
  title,
  description,
}) => {
  return (
    <div className="flex min-h-[350px] flex-col items-center justify-center px-5 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
        {icon}
      </div>

      <h4 className="font-semibold text-slate-800">
        {title}
      </h4>

      <p className="mt-1 max-w-sm text-sm leading-6 text-slate-400">
        {description}
      </p>
    </div>
  );
};

// =========================================================
// INFO ITEM
// =========================================================

const TaskInfo = ({
  icon: Icon,
  label,
  value,
  danger = false,
}) => {
  return (
    <div className="flex min-w-0 items-start gap-2.5">
      <div
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          danger
            ? "bg-red-50 text-red-500"
            : "bg-slate-100 text-slate-500"
        }`}
      >
        <Icon size={14} />
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>

        <p
          className={`mt-0.5 truncate text-xs font-medium ${
            danger
              ? "text-red-600"
              : "text-slate-700"
          }`}
          title={value}
        >
          {value || "Not set"}
        </p>
      </div>
    </div>
  );
};

// =========================================================
// TASK CARD
// =========================================================

const TaskCard = ({
  task,
  index,
  updatingId,
  onStatusChange,
}) => {
  const isUpdating =
    updatingId === task._id;

  const isCompleted =
    task.status === "completed";

  const overdue = isOverdue(
    task.dueDate,
    task.status
  );

  const daysText = getDaysText(
    task.dueDate,
    task.status
  );

  const assignedUser =
    task.assignedTo?.name ||
    task.assignedTo?.email ||
    "You";

  const projectName =
    task.projectId?.name ||
    "No project";

  const statusConfig =
    STATUS_OPTIONS.find(
      (item) => item.value === task.status
    ) || STATUS_OPTIONS[0];

  const StatusIcon = statusConfig.icon;

  return (
    <li
      className={`
        group
        border-b
        border-slate-100
        p-5
        last:border-b-0
        sm:p-6
        ${
          isCompleted
            ? "bg-emerald-50/20"
            : "bg-white"
        }
        transition
        hover:bg-slate-50/60
      `}
    >
      {/* =====================================================
          TOP ROW
      ===================================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        {/* LEFT CONTENT */}

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            {/* TASK NUMBER */}

            <div
              className={`
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-xl
                text-xs
                font-bold
                ${
                  isCompleted
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-900 text-white"
                }
              `}
            >
              #{index + 1}
            </div>

            {/* TITLE */}

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4
                  className={`
                    text-base
                    font-semibold
                    ${
                      isCompleted
                        ? "text-slate-400 line-through"
                        : "text-slate-900"
                    }
                  `}
                >
                  {task.title}
                </h4>

                {/* PRIORITY */}

                {task.priority && (
                  <span
                    className={`
                      inline-flex
                      items-center
                      gap-1.5
                      rounded-lg
                      border
                      px-2.5
                      py-1
                      text-[11px]
                      font-semibold
                      ${getPriorityClass(
                        task.priority
                      )}
                    `}
                  >
                    <Flag
                      size={11}
                      className={getPriorityIconClass(
                        task.priority
                      )}
                    />

                    {getPriorityLabel(
                      task.priority
                    )}
                  </span>
                )}
              </div>

              {/* PROJECT */}

              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <FolderKanban
                    size={13}
                    className="text-slate-400"
                  />

                  {projectName}
                </span>

                <span className="hidden text-slate-300 sm:inline">
                  •
                </span>

                <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                  <User size={13} />

                  Assigned to {assignedUser}
                </span>
              </div>
            </div>
          </div>

          {/* DESCRIPTION */}

          {task.description && (
            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Description
              </p>

              <p
                className={`
                  mt-1.5
                  whitespace-pre-wrap
                  text-sm
                  leading-6
                  ${
                    isCompleted
                      ? "text-slate-400"
                      : "text-slate-600"
                  }
                `}
              >
                {task.description}
              </p>
            </div>
          )}
        </div>

        {/* =====================================================
            STATUS AREA
        ===================================================== */}

        <div className="flex shrink-0 flex-col gap-2 lg:w-44">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 lg:text-right">
            Current Status
          </p>

          <div
            className={`
              flex
              items-center
              justify-center
              gap-2
              rounded-xl
              border
              px-3
              py-2.5
              text-xs
              font-semibold
              ${getStatusClass(
                task.status
              )}
            `}
          >
            {getStatusIcon(task.status)}

            {getStatusLabel(task.status)}
          </div>

          <div className="relative">
            <select
              value={task.status || "todo"}
              onChange={(e) =>
                onStatusChange(
                  task._id,
                  e.target.value
                )
              }
              disabled={isUpdating}
              className="
                h-10
                w-full
                cursor-pointer
                appearance-none
                rounded-xl
                border
                border-slate-200
                bg-white
                px-3
                pr-9
                text-xs
                font-medium
                text-slate-700
                outline-none
                transition
                hover:border-slate-300
                focus:border-slate-400
                focus:ring-2
                focus:ring-slate-100
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              {STATUS_OPTIONS.map(
                (option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                )
              )}
            </select>

            {isUpdating ? (
              <Loader2
                size={14}
                className="
                  pointer-events-none
                  absolute
                  right-3
                  top-1/2
                  -translate-y-1/2
                  animate-spin
                  text-slate-400
                "
              />
            ) : (
              <ChevronDown
                size={15}
                className="
                  pointer-events-none
                  absolute
                  right-3
                  top-1/2
                  -translate-y-1/2
                  text-slate-400
                "
              />
            )}
          </div>
        </div>
      </div>

      {/* =====================================================
          TASK INFORMATION
      ===================================================== */}

      <div className="mt-5 grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* PROJECT */}

        <TaskInfo
          icon={FolderKanban}
          label="Project"
          value={projectName}
        />

        {/* ASSIGNED TO */}

        <TaskInfo
          icon={User}
          label="Assigned To"
          value={assignedUser}
        />

        {/* DUE DATE */}

        <TaskInfo
          icon={Calendar}
          label="Due Date"
          value={
            task.dueDate
              ? formatDate(task.dueDate)
              : "No due date"
          }
          danger={overdue}
        />

        {/* CREATED */}

        <TaskInfo
          icon={Clock}
          label="Created"
          value={formatDateTime(
            task.createdAt
          )}
        />
      </div>

      {/* =====================================================
          DUE DATE STATUS
      ===================================================== */}

      {daysText && (
        <div className="mt-3">
          <div
            className={`
              inline-flex
              items-center
              gap-2
              rounded-lg
              px-3
              py-1.5
              text-[11px]
              font-semibold
              ${
                overdue
                  ? "bg-red-50 text-red-600"
                  : daysText ===
                    "Due today"
                  ? "bg-amber-50 text-amber-700"
                  : "bg-slate-100 text-slate-500"
              }
            `}
          >
            {overdue ? (
              <AlertCircle size={13} />
            ) : (
              <Timer size={13} />
            )}

            {daysText}
          </div>
        </div>
      )}

      {/* =====================================================
          COMPLETED INDICATOR
      ===================================================== */}

      {isCompleted && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2.5">
          <CheckCircle2
            size={15}
            className="text-emerald-600"
          />

          <p className="text-xs font-medium text-emerald-700">
            This task has been completed.
          </p>
        </div>
      )}
    </li>
  );
};

// =========================================================
// MAIN
// =========================================================

const MyTasks = () => {
  const {
    user,
    token,
    authLoading,
  } = useAuth();

  const [tasks, setTasks] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [updatingId, setUpdatingId] =
    useState(null);

  // =======================================================
  // LOAD TASKS
  // =======================================================

  useEffect(() => {
    const loadTasks = async () => {
      const userId =
        user?._id ||
        user?.id ||
        user?.uid;

      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/tasks/user/${userId}`,
          {
            headers: {
              "Content-Type":
                "application/json",

              ...(token && {
                Authorization: `Bearer ${token}`,
              }),
            },
          }
        );

        const contentType =
          response.headers.get(
            "content-type"
          ) || "";

        if (
          !contentType.includes(
            "application/json"
          )
        ) {
          throw new Error(
            "Invalid task server response."
          );
        }

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to load tasks"
          );
        }

        setTasks(data.tasks || []);
      } catch (err) {
        console.error(
          "Load tasks error:",
          err
        );

        setError(
          err.message ||
            "Unable to load tasks"
        );
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      loadTasks();
    }
  }, [
    authLoading,
    user?._id,
    user?.id,
    user?.uid,
    token,
  ]);

  // =======================================================
  // UPDATE STATUS
  // =======================================================

  const handleStatusChange = async (
    taskId,
    newStatus
  ) => {
    try {
      setUpdatingId(taskId);
      setError("");

      const response = await fetch(
        `${API_URL}/tasks/${taskId}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",

            ...(token && {
              Authorization: `Bearer ${token}`,
            }),
          },

          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const contentType =
        response.headers.get(
          "content-type"
        ) || "";

      if (
        !contentType.includes(
          "application/json"
        )
      ) {
        throw new Error(
          "Invalid task server response."
        );
      }

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update task"
        );
      }

      setTasks((prev) =>
        prev.map((task) =>
          task._id === taskId
            ? {
                ...task,
                status: newStatus,
              }
            : task
        )
      );
    } catch (err) {
      console.error(
        "Update task error:",
        err
      );

      setError(
        err.message ||
          "Failed to update task"
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // =======================================================
  // COUNTS
  // =======================================================

  const stats = useMemo(() => {
    const total = tasks.length;

    const pending = tasks.filter(
      (task) => task.status === "todo"
    ).length;

    const inProgress = tasks.filter(
      (task) =>
        task.status === "in-progress"
    ).length;

    const review = tasks.filter(
      (task) => task.status === "review"
    ).length;

    const completed = tasks.filter(
      (task) =>
        task.status === "completed"
    ).length;

    const overdue = tasks.filter(
      (task) =>
        isOverdue(
          task.dueDate,
          task.status
        )
    ).length;

    const completionPercent =
      total === 0
        ? 0
        : Math.round(
            (completed / total) * 100
          );

    return {
      total,
      pending,
      inProgress,
      review,
      completed,
      overdue,
      completionPercent,
    };
  }, [tasks]);

  // =======================================================
  // PAGE
  // =======================================================

  return (
    <UserLayout
      title="My Tasks"
      subtitle="Tasks assigned to you"
    >
      <div className="mx-auto max-w-7xl">
        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <div className="mb-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <CheckSquare size={18} />
                </div>

                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Workspace
                </span>
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                My Tasks
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Track your assigned work,
                update progress, and monitor
                deadlines.
              </p>
            </div>

            {/* TOTAL */}

            {!loading &&
              !error && (
                <div className="flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
                  <CheckSquare
                    size={16}
                    className="text-slate-400"
                  />

                  <span className="text-sm font-semibold text-slate-800">
                    {stats.total}
                  </span>

                  <span className="text-xs text-slate-400">
                    {stats.total === 1
                      ? "Task"
                      : "Tasks"}
                  </span>
                </div>
              )}
          </div>
        </div>

        {/* =================================================
            STATS
        ================================================= */}

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard
            label="Total"
            value={stats.total}
            icon={
              <CheckSquare size={18} />
            }
            accent="slate"
          />

          <StatCard
            label="Pending"
            value={stats.pending}
            icon={<Circle size={18} />}
            accent="amber"
          />

          <StatCard
            label="In Progress"
            value={stats.inProgress}
            icon={<Clock size={18} />}
            accent="blue"
          />

          <StatCard
            label="Review"
            value={stats.review}
            icon={<Eye size={18} />}
            accent="violet"
          />

          <StatCard
            label="Completed"
            value={stats.completed}
            icon={
              <CheckCircle2 size={18} />
            }
            accent="emerald"
          />

          <StatCard
            label="Overdue"
            value={stats.overdue}
            icon={
              <AlertCircle size={18} />
            }
            accent="red"
          />
        </div>

        {/* =================================================
            PROGRESS
        ================================================= */}

        {stats.total > 0 && (
          <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CircleDot
                      size={16}
                      className="text-slate-500"
                    />

                    <p className="text-sm font-semibold text-slate-800">
                      Overall Progress
                    </p>
                  </div>

                  <p className="mt-1 text-xs text-slate-400">
                    {stats.completed} of{" "}
                    {stats.total} tasks
                    completed
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <p className="text-2xl font-bold text-slate-900">
                    {stats.completionPercent}%
                  </p>

                  <p className="text-[11px] text-slate-400">
                    completion
                  </p>
                </div>
              </div>

              <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{
                    width: `${stats.completionPercent}%`,
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 border-t border-slate-100 sm:grid-cols-4">
              <ProgressItem
                label="Pending"
                value={stats.pending}
              />

              <ProgressItem
                label="In Progress"
                value={stats.inProgress}
              />

              <ProgressItem
                label="Review"
                value={stats.review}
              />

              <ProgressItem
                label="Completed"
                value={stats.completed}
              />
            </div>
          </div>
        )}

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0"
            />

            <div>
              <p className="font-medium">
                Unable to process request
              </p>

              <p className="mt-0.5 text-xs text-red-600">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* =================================================
            TASK LIST
        ================================================= */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* HEADER */}

          <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900">
                    Assigned Tasks
                  </h3>

                  {!loading &&
                    tasks.length > 0 && (
                      <span className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-500">
                        {tasks.length}
                      </span>
                    )}
                </div>

                <p className="mt-1 text-xs text-slate-400">
                  All tasks assigned to your
                  account.
                </p>
              </div>

              {tasks.length > 0 && (
                <div className="inline-flex w-fit items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                  <CircleDot
                    size={12}
                    className="text-emerald-500"
                  />

                  Update status directly
                </div>
              )}
            </div>
          </div>

          {/* LOADING */}

          {loading || authLoading ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                  <Loader2
                    size={22}
                    className="animate-spin text-slate-500"
                  />
                </div>

                <p className="text-sm font-medium text-slate-600">
                  Loading tasks...
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Please wait
                </p>
              </div>
            </div>
          ) : !user ? (
            <EmptyState
              icon={
                <AlertCircle
                  size={26}
                  className="text-slate-400"
                />
              }
              title="Not logged in"
              description="Please log in to view your tasks."
            />
          ) : tasks.length === 0 ? (
            <EmptyState
              icon={
                <Inbox
                  size={26}
                  className="text-slate-400"
                />
              }
              title="No tasks assigned"
              description="Tasks assigned to you by an administrator will appear here."
            />
          ) : (
            <ul>
              {tasks.map(
                (task, index) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    index={index}
                    updatingId={
                      updatingId
                    }
                    onStatusChange={
                      handleStatusChange
                    }
                  />
                )
              )}
            </ul>
          )}
        </div>
      </div>
    </UserLayout>
  );
};

// =========================================================
// PROGRESS ITEM
// =========================================================

const ProgressItem = ({
  label,
  value,
}) => {
  return (
    <div className="border-r border-slate-100 px-4 py-3 last:border-r-0">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-slate-800">
        {value}
      </p>
    </div>
  );
};

export default MyTasks;