import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  Check,
  Loader2,
  Calendar,
  Users,
  Flag,
  FolderKanban,
  X,
} from "lucide-react";

import UserLayout from "./UserLayout";
import { useAuth } from "../../context/AuthContext";

const API_URL = import.meta.env.API_URL;

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

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/notifications/${userId}`,
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load notifications",
        );
      }

      setNotifications(data.notifications || []);
    } catch (err) {
      console.error("Fetch notifications error:", err);
      setError(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(
        `${API_URL}/notifications/${notificationId}/read`,
        {
          method: "PATCH",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to mark notification",
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
      console.error("Mark notification error:", err);
    }
  };

  const markAllAsRead = async () => {
    if (!userId) return;

    try {
      setMarkingAll(true);

      const response = await fetch(
        `${API_URL}/notifications/${userId}/read-all`,
        {
          method: "PATCH",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to mark all notifications",
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
    } finally {
      setMarkingAll(false);
    }
  };

  // Load project details on the same page
  const fetchProjectDetails = async (projectId) => {
    if (!projectId) return;

    try {
      setProjectLoading(true);
      setProjectError("");

      const response = await fetch(
        `${API_URL}/projects/${projectId}`,
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load project details",
        );
      }

      setSelectedProject(data.project || data);
    } catch (err) {
      console.error("Fetch project details error:", err);
      setProjectError(
        err.message || "Failed to load project details",
      );
      setSelectedProject(null);
    } finally {
      setProjectLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark unread notification as read
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    // No project → nothing else to display
    if (!notification.projectId) {
      setSelectedProject(null);
      return;
    }

    // Same page project details
    await fetchProjectDetails(notification.projectId);
  };

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead,
  ).length;

  return (
    <UserLayout
      title="Notifications"
      subtitle="Updates and notifications"
    >
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Notifications
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Stay updated with your projects and tasks.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllAsRead}
            disabled={markingAll}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
              bg-slate-900 text-white text-sm font-medium
              hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed
              transition"
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

      {/* Notifications */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">
              Notifications
            </h3>

            {unreadCount > 0 && (
              <p className="text-xs text-slate-400 mt-1">
                {unreadCount} unread notification
                {unreadCount !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center">
            <Bell size={18} className="text-slate-600" />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2
              size={28}
              className="text-slate-400 animate-spin"
            />

            <p className="text-sm text-slate-400 mt-3">
              Loading notifications...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="h-14 w-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <Bell size={26} className="text-red-400" />
            </div>

            <h4 className="font-medium text-slate-800">
              Unable to load notifications
            </h4>

            <p className="text-sm text-slate-400 mt-1">
              {error}
            </p>

            <button
              type="button"
              onClick={fetchNotifications}
              className="mt-4 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition"
            >
              Try again
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Bell size={26} className="text-slate-400" />
            </div>

            <h4 className="font-medium text-slate-800">
              No notifications
            </h4>

            <p className="text-sm text-slate-400 mt-1">
              New notifications will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                onClick={() =>
                  handleNotificationClick(notification)
                }
                className={`
                  p-5 flex items-start gap-4 transition
                  ${
                    notification.projectId
                      ? "cursor-pointer hover:bg-slate-50"
                      : ""
                  }
                  ${
                    !notification.isRead
                      ? "bg-blue-50/40"
                      : "bg-white"
                  }
                `}
              >
                <div
                  className={`
                    h-11 w-11 rounded-xl flex-shrink-0
                    flex items-center justify-center
                    ${
                      notification.isRead
                        ? "bg-slate-100 text-slate-500"
                        : "bg-slate-900 text-white"
                    }
                  `}
                >
                  <Bell size={19} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">
                        {notification.title}
                      </h4>

                      <p className="text-sm text-slate-500 mt-1">
                        {notification.message}
                      </p>
                    </div>

                    {!notification.isRead && (
                      <span className="h-2.5 w-2.5 rounded-full bg-blue-600 flex-shrink-0 mt-1.5" />
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-3">
                    <p className="text-xs text-slate-400">
                      {new Date(
                        notification.createdAt,
                      ).toLocaleString()}
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
            ))}
          </div>
        )}
      </div>

      {/* Same-page project details */}
      {(projectLoading || projectError || selectedProject) && (
        <div className="mt-6 bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                <FolderKanban size={19} />
              </div>

              <div>
                <h3 className="font-semibold text-slate-900">
                  Project Details
                </h3>

                <p className="text-xs text-slate-400 mt-0.5">
                  Notification project information
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedProject(null)}
              className="h-9 w-9 rounded-xl bg-slate-100 hover:bg-slate-200
                flex items-center justify-center text-slate-500 transition"
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

              <p className="text-sm text-slate-400 mt-3">
                Loading project details...
              </p>
            </div>
          ) : projectError ? (
            <div className="py-16 text-center px-6">
              <p className="text-sm text-red-500">
                {projectError}
              </p>
            </div>
          ) : (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900">
                  {selectedProject.name}
                </h2>

                {selectedProject.description && (
                  <p className="text-sm text-slate-500 mt-2 leading-6">
                    {selectedProject.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                  <div className="flex items-center gap-2 text-slate-400 mb-2">
                    <Flag size={15} />
                    <span className="text-xs">
                      Priority
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-slate-800 capitalize">
                    {selectedProject.priority || "—"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                  <div className="flex items-center gap-2 text-slate-400 mb-2">
                    <FolderKanban size={15} />
                    <span className="text-xs">
                      Status
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-slate-800 capitalize">
                    {selectedProject.status || "—"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                  <div className="flex items-center gap-2 text-slate-400 mb-2">
                    <Calendar size={15} />
                    <span className="text-xs">
                      Start Date
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-slate-800">
                    {selectedProject.startDate
                      ? new Date(
                          selectedProject.startDate,
                        ).toLocaleDateString()
                      : "—"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                  <div className="flex items-center gap-2 text-slate-400 mb-2">
                    <Calendar size={15} />
                    <span className="text-xs">
                      Due Date
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-slate-800">
                    {selectedProject.dueDate
                      ? new Date(
                          selectedProject.dueDate,
                        ).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
              </div>

              {Array.isArray(selectedProject.members) &&
                selectedProject.members.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <div className="flex items-center gap-2 mb-3">
                      <Users
                        size={17}
                        className="text-slate-500"
                      />

                      <h4 className="text-sm font-semibold text-slate-800">
                        Assigned Members
                      </h4>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {selectedProject.members.map(
                        (member, index) => (
                          <span
                            key={member?._id || member || index}
                            className="px-3 py-1.5 rounded-lg bg-slate-100
                              text-xs font-medium text-slate-600"
                          >
                            {typeof member === "object"
                              ? member.name ||
                                member.email ||
                                "Member"
                              : member}
                          </span>
                        ),
                      )}
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>
      )}
    </UserLayout>
  );
};

export default Notifications;
