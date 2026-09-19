import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock3,
  CheckCircle2,
  ListTodo,
  FolderKanban,
  CircleAlert,
} from "lucide-react";

import UserLayout from "./UserLayout";
import { useAuth } from "../../context/AuthContext";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

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

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getDateKey = (date) => {
  if (!date) return "";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const isSameDay = (date1, date2) => {
  return getDateKey(date1) === getDateKey(date2);
};

const getMonthName = (date) => {
  return date.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

const getStatusLabel = (status) => {
  const labels = {
    todo: "To Do",
    "in-progress": "In Progress",
    review: "Review",
    completed: "Completed",
  };

  return labels[status] || status || "To Do";
};

const getStatusClass = (status) => {
  const styles = {
    todo: "bg-slate-100 text-slate-600",
    "in-progress": "bg-blue-50 text-blue-600",
    review: "bg-purple-50 text-purple-600",
    completed: "bg-emerald-50 text-emerald-600",
  };

  return styles[status] || styles.todo;
};

const getPriorityClass = (priority) => {
  const styles = {
    low: "bg-slate-100 text-slate-500",
    medium: "bg-blue-50 text-blue-600",
    high: "bg-orange-50 text-orange-600",
    urgent: "bg-red-50 text-red-600",
  };

  return styles[priority] || styles.medium;
};

/* =========================================================
   API
========================================================= */

const fetchTasks = async (userId) => {
  const response = await fetch(
    `${API_BASE_URL}/tasks/user/${userId}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message || "Failed to load tasks"
    );
  }

  return data?.tasks || [];
};

/* =========================================================
   COMPONENT
========================================================= */

function Calendar() {
  const navigate = useNavigate();

  const { user, authLoading } = useAuth();

  const mongoUserId = user?._id || user?.id;

  const [currentDate, setCurrentDate] = useState(
    new Date()
  );

  const [selectedDate, setSelectedDate] = useState(
    new Date()
  );

  const [tasks, setTasks] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  /* =========================================================
     LOAD TASKS
  ========================================================= */

  useEffect(() => {
    const loadTasks = async () => {
      if (authLoading) return;

      if (!mongoUserId) {
        setLoading(false);
        setError("User information is unavailable.");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const data = await fetchTasks(mongoUserId);

        setTasks(data);
      } catch (err) {
        console.error("Calendar tasks error:", err);

        setError(
          err?.message ||
            "Unable to load calendar tasks."
        );

        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [authLoading, mongoUserId]);

  /* =========================================================
     CALENDAR DAYS
  ========================================================= */

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();

    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);

    const lastDay = new Date(year, month + 1, 0);

    /*
     * Sunday = 0
     */
    const startDay = firstDay.getDay();

    const totalDays = lastDay.getDate();

    const days = [];

    /*
     * Previous month empty slots
     */
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    /*
     * Current month
     */
    for (let day = 1; day <= totalDays; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  }, [currentDate]);

  /* =========================================================
     TASKS BY DATE
  ========================================================= */

  const tasksByDate = useMemo(() => {
    const map = {};

    tasks.forEach((task) => {
      if (!task.dueDate) return;

      const key = getDateKey(task.dueDate);

      if (!key) return;

      if (!map[key]) {
        map[key] = [];
      }

      map[key].push(task);
    });

    return map;
  }, [tasks]);

  /* =========================================================
     SELECTED DAY TASKS
  ========================================================= */

  const selectedTasks = useMemo(() => {
    const key = getDateKey(selectedDate);

    return tasksByDate[key] || [];
  }, [selectedDate, tasksByDate]);

  /* =========================================================
     MONTH NAVIGATION
  ========================================================= */

  const goPreviousMonth = () => {
    setCurrentDate(
      new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - 1,
        1
      )
    );
  };

  const goNextMonth = () => {
    setCurrentDate(
      new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        1
      )
    );
  };

  const goToday = () => {
    const today = new Date();

    setCurrentDate(today);
    setSelectedDate(today);
  };

  /* =========================================================
     MONTH TASK COUNT
  ========================================================= */

  const currentMonthTasks = tasks.filter((task) => {
    if (!task.dueDate) return false;

    const date = new Date(task.dueDate);

    return (
      date.getMonth() === currentDate.getMonth() &&
      date.getFullYear() === currentDate.getFullYear()
    );
  });

  /* =========================================================
     TODAY
  ========================================================= */

  const today = new Date();

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

          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-400">
                <span>Workspace</span>
                <span>/</span>
                <span className="font-semibold text-slate-600">
                  Calendar
                </span>
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Calendar
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                View your tasks and upcoming deadlines.
              </p>
            </div>

            <button
              type="button"
              onClick={goToday}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
            >
              <CalendarDays size={16} />
              Today
            </button>
          </div>

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <CircleAlert
                size={18}
                className="shrink-0 text-red-500"
              />

              <p className="text-sm text-red-600">
                {error}
              </p>
            </div>
          )}

          {/* =================================================
              CALENDAR + DAY DETAILS
          ================================================= */}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">

            {/* =================================================
                CALENDAR
            ================================================= */}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

              {/* Calendar Header */}

              <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <CalendarDays size={19} />
                  </div>

                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      {getMonthName(currentDate)}
                    </h2>

                    <p className="text-xs text-slate-400">
                      {currentMonthTasks.length}{" "}
                      task
                      {currentMonthTasks.length !== 1
                        ? "s"
                        : ""}{" "}
                      this month
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={goPreviousMonth}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                  >
                    <ChevronLeft size={17} />
                  </button>

                  <button
                    type="button"
                    onClick={goNextMonth}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                  >
                    <ChevronRight size={17} />
                  </button>
                </div>
              </div>

              {/* Week Days */}

              <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/70">
                {[
                  "Sun",
                  "Mon",
                  "Tue",
                  "Wed",
                  "Thu",
                  "Fri",
                  "Sat",
                ].map((day) => (
                  <div
                    key={day}
                    className="py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-xs"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}

              <div className="grid grid-cols-7">
                {calendarDays.map((date, index) => {
                  if (!date) {
                    return (
                      <div
                        key={`empty-${index}`}
                        className="min-h-[80px] border-b border-r border-slate-100 bg-slate-50/30 sm:min-h-[105px]"
                      />
                    );
                  }

                  const dateKey = getDateKey(date);

                  const dayTasks =
                    tasksByDate[dateKey] || [];

                  const selected = isSameDay(
                    date,
                    selectedDate
                  );

                  const isToday = isSameDay(
                    date,
                    today
                  );

                  return (
                    <button
                      type="button"
                      key={dateKey}
                      onClick={() =>
                        setSelectedDate(date)
                      }
                      className={`group relative min-h-[80px] border-b border-r border-slate-100 p-2 text-left transition sm:min-h-[105px] sm:p-3 ${
                        selected
                          ? "bg-indigo-50/70"
                          : "bg-white hover:bg-slate-50"
                      }`}
                    >
                      {/* Day Number */}

                      <div className="flex justify-end">
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                            isToday
                              ? "bg-indigo-600 text-white"
                              : selected
                              ? "bg-indigo-100 text-indigo-700"
                              : "text-slate-600"
                          }`}
                        >
                          {date.getDate()}
                        </span>
                      </div>

                      {/* Task indicators */}

                      <div className="mt-2 space-y-1">
                        {dayTasks
                          .slice(0, 2)
                          .map((task) => (
                            <div
                              key={getId(task)}
                              className={`truncate rounded-md px-1.5 py-1 text-[9px] font-semibold sm:text-[10px] ${getStatusClass(
                                task.status
                              )}`}
                            >
                              {task.title}
                            </div>
                          ))}

                        {dayTasks.length > 2 && (
                          <p className="px-1 text-[9px] font-semibold text-slate-400">
                            +{dayTasks.length - 2} more
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* =================================================
                SELECTED DAY
            ================================================= */}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="border-b border-slate-100 p-5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                  Selected Day
                </p>

                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  {selectedDate.toLocaleDateString(
                    "en-IN",
                    {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    }
                  )}
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  {selectedTasks.length} task
                  {selectedTasks.length !== 1
                    ? "s"
                    : ""}
                </p>
              </div>

              {loading ? (
                <div className="space-y-3 p-5">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="animate-pulse rounded-xl border border-slate-100 p-4"
                    >
                      <div className="h-4 w-3/4 rounded bg-slate-200" />

                      <div className="mt-3 h-3 w-1/2 rounded bg-slate-100" />

                      <div className="mt-3 h-6 w-20 rounded bg-slate-100" />
                    </div>
                  ))}
                </div>
              ) : selectedTasks.length === 0 ? (
                <div className="px-5 py-14 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                    <CheckCircle2 size={22} />
                  </div>

                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    No tasks for this day
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    There are no task deadlines
                    scheduled for this date.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {selectedTasks.map((task) => (
                    <button
                      type="button"
                      key={getId(task)}
                      onClick={() =>
                        navigate(
                          "/user/dashboard/tasks"
                        )
                      }
                      className="w-full p-5 text-left transition hover:bg-slate-50"
                    >
                      <div className="flex gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                          <ListTodo size={17} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-800">
                            {task.title ||
                              "Untitled Task"}
                          </p>

                          <div className="mt-2 flex flex-wrap gap-2">
                            <span
                              className={`rounded-md px-2 py-1 text-[10px] font-semibold ${getStatusClass(
                                task.status
                              )}`}
                            >
                              {getStatusLabel(
                                task.status
                              )}
                            </span>

                            <span
                              className={`rounded-md px-2 py-1 text-[10px] font-semibold ${getPriorityClass(
                                task.priority
                              )}`}
                            >
                              {task.priority ||
                                "medium"}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-col gap-1.5">
                            <span className="inline-flex items-center gap-1.5 text-[10px] text-slate-400">
                              <FolderKanban size={11} />

                              {task.projectId?.name ||
                                "Unknown Project"}
                            </span>

                            {task.dueDate && (
                              <span className="inline-flex items-center gap-1.5 text-[10px] text-slate-400">
                                <Clock3 size={11} />

                                {formatDate(
                                  task.dueDate
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* =================================================
              CALENDAR SUMMARY
          ================================================= */}

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <ListTodo size={18} />
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Total Tasks
                  </p>

                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {tasks.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  <Clock3 size={18} />
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Pending Tasks
                  </p>

                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {
                      tasks.filter(
                        (task) =>
                          task.status !==
                          "completed"
                      ).length
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 size={18} />
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Completed
                  </p>

                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {
                      tasks.filter(
                        (task) =>
                          task.status ===
                          "completed"
                      ).length
                    }
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </UserLayout>
  );
}

export default Calendar;