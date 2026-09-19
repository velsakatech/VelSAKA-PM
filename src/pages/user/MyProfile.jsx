import { useContext, useEffect, useState } from "react";
import UserLayout from "./UserLayout";
import AuthContext from "../../context/AuthContext";

// =========================================================
// GITHUB ICON (inline SVG)
// =========================================================

const GithubIcon = ({ size = 16 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

// =========================================================
// GITHUB HELPERS
// =========================================================

const extractGithubUsername = (input) => {
  if (!input) return "";

  const value = String(input).trim();

  if (value.startsWith("http")) {
    const parts = value.replace(/\/+$/, "").split("/");
    return parts[parts.length - 1];
  }

  return value.replace(/^@/, "");
};

// =========================================================
// COMPONENT
// =========================================================

const MyProfile = () => {
  const auth = useContext(AuthContext);

  const authUser =
    auth?.user || auth?.currentUser || auth?.loggedInUser || null;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================================
  // API URL
  // =========================================================

  const API_URL = import.meta.env.API_URL;

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        setError("");

        if (!API_URL) {
          throw new Error(
            "API URL is not configured. Please check the frontend environment variables.",
          );
        }

        let loggedInUser = authUser;

        if (!loggedInUser) {
          const storedUser = localStorage.getItem("user");

          if (storedUser) {
            try {
              loggedInUser = JSON.parse(storedUser);
            } catch (parseError) {
              console.error("Invalid user data:", parseError);
            }
          }
        }

        if (!loggedInUser) {
          throw new Error("User session not found. Please login again.");
        }

        const email =
          loggedInUser?.email ||
          loggedInUser?.user?.email ||
          loggedInUser?.providerData?.[0]?.email;

        if (!email) {
          console.error("Authenticated user:", loggedInUser);
          throw new Error("User email not found. Please login again.");
        }

        const normalizedEmail = email.toLowerCase().trim();

        const profileUrl =
          `${API_URL}/users/profile/${encodeURIComponent(normalizedEmail)}`;

        console.log("USER PROFILE API:", profileUrl);

        const response = await fetch(profileUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message || "Failed to fetch user profile",
          );
        }

        if (!data?.user) {
          throw new Error("User profile data was not returned");
        }

        setUser(data.user);

        localStorage.setItem(
          "user",
          JSON.stringify(data.user),
        );
      } catch (error) {
        console.error("Fetch profile error:", error);

        setError(
          error?.message || "Failed to load user profile",
        );
      } finally {
        setLoading(false);
      }
    };

    if (
      auth?.loading === true ||
      auth?.authLoading === true
    ) {
      return;
    }

    fetchUserProfile();
  }, [
    authUser,
    auth?.loading,
    auth?.authLoading,
    API_URL,
  ]);

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <UserLayout
        title="My Profile"
        subtitle="Manage your account information"
      >
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />

            <p className="text-sm text-slate-500">
              Loading profile...
            </p>
          </div>
        </div>
      </UserLayout>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error) {
    return (
      <UserLayout
        title="My Profile"
        subtitle="Manage your account information"
      >
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h2 className="font-semibold text-red-700">
            Unable to load profile
          </h2>

          <p className="mt-1 text-sm text-red-600">
            {error}
          </p>
        </div>
      </UserLayout>
    );
  }

  // =========================================================
  // EMPTY
  // =========================================================

  if (!user) {
    return (
      <UserLayout
        title="My Profile"
        subtitle="Manage your account information"
      >
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-500">
            No profile information available.
          </p>
        </div>
      </UserLayout>
    );
  }

  const githubUrl = user?.githubUsername || "";
  const githubUsername = extractGithubUsername(githubUrl);

  // =========================================================
  // PROFILE UI
  // =========================================================

  return (
    <UserLayout
      title="My Profile"
      subtitle="Manage your account information"
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          My Profile
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          View your account information.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center gap-5 border-b border-slate-200 p-6">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xl font-bold text-white">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-slate-900">
              {user?.name || "-"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {user?.jobRole || "-"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
          <ProfileField
            label="Full Name"
            value={user?.name}
          />

          <ProfileField
            label="Email"
            value={user?.email}
          />

          <ProfileField
            label="Access Role"
            value={user?.accessRole}
          />

          <ProfileField
            label="Job Role"
            value={user?.jobRole}
          />

          <ProfileField
            label="Department"
            value={user?.department}
          />

          <ProfileField
            label="Status"
            value={user?.status}
          />

          {/* GitHub */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              GitHub Username
            </p>

            <div className="mt-2 flex items-center gap-2">
              {githubUrl ? (
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  title={githubUrl}
                  aria-label="Open GitHub profile"
                  className="group inline-flex items-center gap-2"
                >
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition group-hover:border-slate-900 group-hover:bg-slate-900 group-hover:text-white">
                    <GithubIcon size={14} />
                  </span>

                  <span className="text-sm font-medium text-slate-800 underline-offset-2 transition group-hover:text-slate-900 group-hover:underline">
                    {githubUsername}
                  </span>
                </a>
              ) : (
                <p className="text-sm font-medium text-slate-800">
                  -
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
};

// =========================================================
// PROFILE FIELD
// =========================================================

const ProfileField = ({ label, value }) => {
  const isStatus = label === "Status";
  const isActive =
    String(value || "").toLowerCase() === "active";

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <div className="mt-2 flex items-center gap-2">
        {isStatus && (
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              isActive ? "bg-green-500" : "bg-red-500"
            }`}
          />
        )}

        <p className="text-sm font-medium text-slate-800">
          {value || "-"}
        </p>
      </div>
    </div>
  );
};

export default MyProfile;