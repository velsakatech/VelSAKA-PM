import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Check,
  Menu,
  Loader2,
  X,
} from "lucide-react";

import UserSidebar from "./UserSidebar";
import { useAuth } from "../../context/AuthContext";

const API_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
  "http://localhost:5000/api";

const UserLayout = ({ children, title, subtitle }) => {
  const navigate = useNavigate();
  const { user, authLoading } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [notification, setNotification] = useState(null);
  const [notificationVisible, setNotificationVisible] = useState(false);

  const knownNotificationIds = useRef(new Set());
  const initializedNotifications = useRef(false);
  const audioContextRef = useRef(null);

  const userId = user?._id || user?.id || user?.uid;

  /*
   * Create notification sound using Web Audio API.
   * No external sound file is required.
   */
  const playNotificationSound = useCallback(() => {
    try {
      const AudioContext =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContext) return;

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      const audioContext = audioContextRef.current;

      if (audioContext.state === "suspended") {
        audioContext.resume();
      }

      const now = audioContext.currentTime;

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = "sine";

      oscillator.frequency.setValueAtTime(880, now);
      oscillator.frequency.setValueAtTime(1174, now + 0.12);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.18, now + 0.02);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.35);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start(now);
      oscillator.stop(now + 0.35);
    } catch (error) {
      console.error("Notification sound error:", error);
    }
  }, []);

  /*
   * Fetch notifications
   */
  const checkNotifications = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch(
        `${API_URL}/notifications/${userId}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch notifications"
        );
      }

      const notifications = data.notifications || [];

      /*
       * First API call:
       * Just remember existing notifications.
       *
       * This prevents old notifications from producing
       * an alert when the user initially opens the app.
       */
      if (!initializedNotifications.current) {
        notifications.forEach((item) => {
          knownNotificationIds.current.add(item._id);
        });

        initializedNotifications.current = true;
        return;
      }

      /*
       * Find genuinely new notifications.
       */
      const newNotifications = notifications.filter(
        (item) =>
          !knownNotificationIds.current.has(item._id)
      );

      /*
       * Remember all current notifications.
       */
      notifications.forEach((item) => {
        knownNotificationIds.current.add(item._id);
      });

      /*
       * Nothing new
       */
      if (newNotifications.length === 0) {
        return;
      }

      /*
       * Show latest new notification
       */
      const latestNotification =
        newNotifications[0];

      setNotification(latestNotification);
      setNotificationVisible(true);

      /*
       * Play sound
       */
      playNotificationSound();
    } catch (error) {
      console.error(
        "Notification check error:",
        error
      );
    }
  }, [userId, playNotificationSound]);

  /*
   * Start notification monitoring
   */
  useEffect(() => {
    if (!userId) return;

    initializedNotifications.current = false;
    knownNotificationIds.current.clear();

    checkNotifications();

    const interval = setInterval(() => {
      checkNotifications();
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [userId, checkNotifications]);

  /*
   * Close notification alert
   */
  const closeNotification = () => {
    setNotificationVisible(false);

    setTimeout(() => {
      setNotification(null);
    }, 200);
  };

  /*
   * Open notification/project
   */
  const handleNotificationClick = async () => {
  if (!notification) return;

  try {
    await fetch(
      `${API_URL}/notifications/${notification._id}/read`,
      {
        method: "PATCH",
      }
    );
  } catch (error) {
    console.error(
      "Mark notification as read error:",
      error
    );
  }

  closeNotification();

  // Always go to My Projects page
  navigate("/user/dashboard/projects");
};

  /*
   * Authentication protection
   */
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    if (
      user.accessRole !== "user" &&
      user.accessRole !== "admin"
    ) {
      navigate("/login", { replace: true });
    }
  }, [authLoading, user, navigate]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <Loader2 size={20} className="animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <UserSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* =========================================
          NOTIFICATION ALERT
      ========================================= */}
      {notification && (
        <div
          className={`
            fixed
            top-5
            right-5
            z-[9999]
            w-[380px]
            max-w-[calc(100vw-2rem)]
            transition-all
            duration-300
            ${
              notificationVisible
                ? "translate-y-0 opacity-100"
                : "-translate-y-3 opacity-0"
            }
          `}
        >
          <div
            className="
              bg-white
              border
              border-slate-200
              rounded-2xl
              shadow-2xl
              overflow-hidden
            "
          >
            {/* Alert header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <Bell size={19} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    New Notification
                  </p>

                  <p className="text-xs text-slate-400">
                    VELSAKA Project Management
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeNotification}
                className="
                  p-1.5
                  rounded-lg
                  text-slate-400
                  hover:text-slate-700
                  hover:bg-slate-100
                  transition
                "
                aria-label="Close notification"
              >
                <X size={18} />
              </button>
            </div>

            {/* Alert content */}
            <div className="p-5">
              <h3 className="text-base font-semibold text-slate-900">
                {notification.title}
              </h3>

              <p className="text-sm text-slate-500 leading-6 mt-2">
                {notification.message}
              </p>

              {notification.projectName && (
                <div className="mt-4 px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[11px] uppercase tracking-wide font-semibold text-slate-400">
                    Project
                  </p>

                  <p className="text-sm font-semibold text-slate-800 mt-1">
                    {notification.projectName}
                  </p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center gap-2 mt-5">
                <button
                  type="button"
                  onClick={handleNotificationClick}
                  className="
                    flex-1
                    inline-flex
                    items-center
                    justify-center
                    gap-2
                    px-4
                    py-2.5
                    rounded-xl
                    bg-slate-900
                    text-white
                    text-sm
                    font-medium
                    hover:bg-slate-800
                    transition
                  "
                >
                  <Check size={16} />
                  View Notification
                </button>

                <button
                  type="button"
                  onClick={closeNotification}
                  className="
                    px-4
                    py-2.5
                    rounded-xl
                    border
                    border-slate-200
                    text-slate-600
                    text-sm
                    font-medium
                    hover:bg-slate-50
                    transition
                  "
                >
                  Close
                </button>
              </div>
            </div>

            {/* Bottom indicator */}
            <div className="h-1 bg-slate-900" />
          </div>
        </div>
      )}

      <main className="lg:ml-64 min-h-screen">
        <header className="h-20 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600"
              aria-label="Open sidebar"
            >
              <Menu size={22} />
            </button>

            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {title}
              </h2>

              <p className="text-xs text-slate-400 mt-0.5">
                {subtitle ||
                  "VELSAKA Project Management"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-slate-800">
                {user.name}
              </p>

              <p className="text-xs text-slate-400">
                {user.jobRole || "Team Member"}
              </p>
            </div>

            <div className="h-10 w-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-semibold">
              {user.name
                ?.charAt(0)
                ?.toUpperCase() || "U"}
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default UserLayout;