import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  Check,
  Loader2,
  Calendar,
  Users,
  Flag,
  FolderKanban,
  X,
  RefreshCw,
} from "lucide-react";

import UserLayout from "./UserLayout";
import { useAuth } from "../../context/AuthContext";

// Vite exposes client-side environment variables with the VITE_ prefix.
// Keep API_URL as a fallback for projects that already expose it.
const API_URL = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.API_URL ||
  ""
).replace(/\/+$/, "");

const getErrorMessage = (data, fallback) =>
  data?.message || data?.error || fallback;

const readJsonResponse = async (response) => {
  const text = await response.text();

  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("The server returned an invalid response.");
  }
};

const Notifications = () => {
  const { user } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState("");

  const [selectedProject, setSelectedProject] = useState(null);
  const [projectLoading, setProjectLoading] = useState(false);
  const [projectError, setProjectError] = useState("");

  const userId = user?._id || user?.id || user?.uid;

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications],
  );

  // Only render actual user objects. Never display raw MongoDB IDs.
  const assignedMembers = useMemo(() => {
    if (Array.isArray(selectedProject?.memberDetails)) {
      return selectedProject.memberDetails.filter(
        (member) =>
          member &&
          typeof member === "object" &&
          (member.name || member.email),
      );
    }

    if (Array.isArray(selectedProject?.members)) {
      return selectedProject.members.filter(
        (member) =>
          member &&
          typeof member === "object" &&
          (member.name || member.email),
      );
    }

    return [];
  }, [selectedProject]);

  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

            if (!API_URL) {
        throw new Error(
          "API URL is not configured. Add VITE_API_URL to your frontend environment variables.",
        );
      }

      const response = await fetch(`${API_URL}/notifications/${userId}`);
      const data = await readJsonResponse(response);



      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Failed to load notifications."),
        );
      }

      setNotifications(
        Array.isArray(data.notifications) ? data.notifications : [],
      );
    } catch (err) {
      console.error("Fetch notifications error:", err);
      setError(err.message || "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (notificationId) => {
    if (!notificationId) return;

    try {
      const response = await fetch(
        `${API_URL}/notifications/${notificationId}/read`,
        { method: "PATCH" },
      );

      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Failed to mark notification as read."),
        );
      }

      setNotifications((current) =>
        current.map((notification) =>
          notification._id === notificationId
            ? { ...notification, isRead: true }
            : notification,
        ),
      );
    } catch (err) {
      console.error("Mark notification as read error:", err);
      setError(err.message || "Could not update the notification.");
    }
  };

  const markAllAsRead = async () => {
    if (!userId || unreadCount === 0) return;

    try {
      setMarkingAll(true);
      setError("");

      const response = await fetch(
        `${API_URL}/notifications/${userId}/read-all`,
        { method: "PATCH" },
      );

      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Failed to mark all notifications as read."),
        );
      }

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
        })),
      );
    } catch (err) {
      console.error("Mark all notifications error:", err);
      setError(err.message || "Could not update notifications.");
    } finally {
      setMarkingAll(false);
    }
  };

  const fetchProjectDetails = async (projectId) => {
    const resolvedProjectId =
      typeof projectId === "object"
        ? projectId?._id || projectId?.id
        : projectId;

    if (!resolvedProjectId) {
      setSelectedProject(null);
      setProjectError("This notification is not linked to a valid project.");
      return;
    }

    try {
      setProjectLoading(true);
      setProjectError("");
      setSelectedProject(null);

      const response = await fetch(
        `${API_URL}/projects/${resolvedProjectId}`,
      );

      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Failed to load project details."),
        );
      }

      const project = data.project || data.data?.project || data;

      if (!project || typeof project !== "object") {
        throw new Error("The server did not return valid project details.");
      }

      setSelectedProject(project);
    } catch (err) {
      console.error("Fetch project details error:", err);
      setProjectError(err.message || "Failed to load project details.");
      setSelectedProject(null);
    } finally {
      setProjectLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification) return;

    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    if (!notification.projectId) {
      setSelectedProject(null);
      setProjectError("");
      return;
    }

    await fetchProjectDetails(notification.projectId);
  };

  const handleNotificationKeyDown = (event, notification) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleNotificationClick(notification);
    }
  };

  return (
    <UserLayout
      title="Notifications"
      subtitle="Updates and notifications"
    >
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Notifications
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Stay updated with your projects and tasks.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllAsRead}
            disabled={markingAll}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {markingAll ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Check size={16} />
            )}
            Mark all as read
          </button>
        )}
      </div>

      {/* Notifications list */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <div>
            <h3 className="font-semibold text-slate-900">
              Notifications
            </h3>

            {unreadCount > 0 && (
              <p className="mt-1 text-xs text-slate-400">
                {unreadCount} unread notification
                {unreadCount !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
            <Bell size={18} className="text-slate-600" />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2
              size={28}
              className="animate-spin text-slate-400"
            />
            <p className="mt-3 text-sm text-slate-400">
              Loading notifications...
            </p>
          </div>
        ) : error && notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <Bell size={26} className="text-red-400" />
            </div>

            <h4 className="font-medium text-slate-800">
              Unable to load notifications
            </h4>

            <p className="mt-1 text-sm text-slate-400">
              {error}
            </p>

            <button
              type="button"
              onClick={fetchNotifications}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              <RefreshCw size={15} />
              Try again
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <Bell size={26} className="text-slate-400" />
            </div>

            <h4 className="font-medium text-slate-800">
              No notifications
            </h4>

            <p className="mt-1 text-sm text-slate-400">
              New notifications will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((notification) => {
              const hasProject = Boolean(notification.projectId);

              return (
                <div
                  key={notification._id}
                  role={hasProject ? "button" : undefined}
                  tabIndex={hasProject ? 0 : undefined}
                  onClick={() => handleNotificationClick(notification)}
                  onKeyDown={(event) =>
                    handleNotificationKeyDown(event, notification)
                  }
                  className={`flex items-start gap-4 p-5 transition ${
                    hasProject ? "cursor-pointer hover:bg-slate-50" : ""
                  } ${
                    !notification.isRead ? "bg-blue-50/40" : "bg-white"
                  }`}
                >
                  <div
                    className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${
                      notification.isRead
                        ? "bg-slate-100 text-slate-500"
                        : "bg-slate-900 text-white"
                    }`}
                  >
                    <Bell size={19} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900">
                          {notification.title || "Notification"}
                        </h4>

                        <p className="mt-1 text-sm text-slate-500">
                          {notification.message || ""}
                        </p>
                      </div>

                      {!notification.isRead && (
                        <span className="mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-blue-600" />
                      )}
                    </div>

                    <div className="mt-3 flex items-center gap-3">
                      <p className="text-xs text-slate-400">
                        {notification.createdAt
                          ? new Date(notification.createdAt).toLocaleString()
                          : ""}
                      </p>

                      {!notification.isRead && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            markAsRead(notification._id);
                          }}
                          className="text-xs font-medium text-slate-600 hover:text-slate-900"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Inline action error */}
      {error && notifications.length > 0 && (
        <p className="mt-3 text-sm text-red-500" role="alert">
          {error}
        </p>
      )}

      {/* Same-page project details */}
      {(projectLoading || projectError || selectedProject) && (
        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                <FolderKanban size={19} />
              </div>

              <div>
                <h3 className="font-semibold text-slate-900">
                  Project Details
                </h3>

                <p className="mt-0.5 text-xs text-slate-400">
                  Notification project information
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedProject(null);
                setProjectError("");
              }}
              aria-label="Close project details"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200"
            >
              <X size={17} />
            </button>
          </div>

          {projectLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2
                size={26}
                className="animate-spin text-slate-400"
              />
              <p className="mt-3 text-sm text-slate-400">
                Loading project details...
              </p>
            </div>
          ) : projectError ? (
            <div className="px-6 py-16 text-center">
              <p className="text-sm text-red-500" role="alert">
                {projectError}
              </p>
            </div>
          ) : selectedProject ? (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900">
                  {selectedProject.name || "Untitled Project"}
                </h2>

                {selectedProject.description && (
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {selectedProject.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-slate-400">
                    <Flag size={15} />
                    <span className="text-xs">Priority</span>
                  </div>

                  <p className="text-sm font-semibold capitalize text-slate-800">
                    {selectedProject.priority || "—"}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-slate-400">
                    <FolderKanban size={15} />
                    <span className="text-xs">Status</span>
                  </div>

                  <p className="text-sm font-semibold capitalize text-slate-800">
                    {selectedProject.status || "—"}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-slate-400">
                    <Calendar size={15} />
                    <span className="text-xs">Start Date</span>
                  </div>

                  <p className="text-sm font-semibold text-slate-800">
                    {selectedProject.startDate
                      ? new Date(selectedProject.startDate).toLocaleDateString()
                      : "—"}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-slate-400">
                    <Calendar size={15} />
                    <span className="text-xs">Due Date</span>
                  </div>

                  <p className="text-sm font-semibold text-slate-800">
                    {selectedProject.dueDate
                      ? new Date(selectedProject.dueDate).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
              </div>

              {/* Assigned Members: use backend memberDetails, not raw IDs. */}
              {assignedMembers.length > 0 ? (
                <div className="mt-6 border-t border-slate-100 pt-6">
                  <div className="mb-3 flex items-center gap-2">
                    <Users size={17} className="text-slate-500" />
                    <h4 className="text-sm font-semibold text-slate-800">
                      Assigned Members
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {assignedMembers.map((member, index) => {
                      const displayName =
                        member.name || member.email || "Unknown Member";

                      return (
                        <div
                          key={member._id || member.id || `${displayName}-${index}`}
                          className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3"
                        >
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                            {displayName.trim().charAt(0).toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-800">
                              {member.name || "Unknown Member"}
                            </p>

                            <p className="truncate text-xs text-slate-500">
                              {member.email || "Email unavailable"}
                            </p>

                            {member.jobRole && (
                              <p className="mt-1 truncate text-xs text-slate-400">
                                {member.jobRole}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                Array.isArray(selectedProject.members) &&
                selectedProject.members.length > 0 && (
                  <div className="mt-6 border-t border-slate-100 pt-6">
                    <div className="mb-3 flex items-center gap-2">
                      <Users size={17} className="text-slate-500" />
                      <h4 className="text-sm font-semibold text-slate-800">
                        Assigned Members
                      </h4>
                    </div>

                    <p className="text-sm text-slate-500">
                      Member details are not available from the server. Please
                      check that the project API returns{" "}
                      <code className="rounded bg-slate-100 px-1 py-0.5">
                        memberDetails
                      </code>
                      .
                    </p>
                  </div>
                )
              )}
            </div>
          ) : null}
        </section>
      )}
    </UserLayout>
  );
};

export default Notifications;
