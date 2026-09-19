import { useCallback, useEffect, useState } from "react";
import { Bell, Check, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import UserLayout from "./UserLayout";
import { useAuth } from "../../context/AuthContext";

const API_URL = import.meta.env.API_URL;

const Notifications = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState("");

  const userId = user?._id || user?.id || user?.uid;

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/notifications/${userId}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load notifications");
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
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to mark notification");
      }

      setNotifications((current) =>
        current.map((notification) =>
          notification._id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
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
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to mark all notifications");
      }

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );
    } catch (err) {
      console.error("Mark all notifications error:", err);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    if (notification.projectId) {
      navigate(`/user/dashboard/projects/${notification.projectId}`);
    }
  };

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
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
                onClick={() => handleNotificationClick(notification)}
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
                        notification.createdAt
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
    </UserLayout>
  );
};

export default Notifications;