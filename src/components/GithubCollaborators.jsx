import { useEffect, useState } from "react";
import {
  Loader2,
  AlertCircle,
  UserPlus,
  Trash2,
  Users,
  RefreshCw,
  CheckCircle2,
  Search,
  Clock,
} from "lucide-react";

const API_URL = "http://localhost:5000/api/github";
const USERS_API = "http://localhost:5000/api/users";

const PERMISSION_OPTIONS = [
  { value: "pull", label: "Read" },
  { value: "triage", label: "Triage" },
  { value: "push", label: "Write" },
  { value: "maintain", label: "Maintain" },
  { value: "admin", label: "Admin" },
];

const PERMISSION_BADGE = {
  pull: "bg-slate-100 text-slate-700",
  triage: "bg-amber-100 text-amber-700",
  push: "bg-blue-100 text-blue-700",
  maintain: "bg-violet-100 text-violet-700",
  admin: "bg-red-100 text-red-700",
  unknown: "bg-slate-100 text-slate-500",
};

// =========================================================
// CLEAN GITHUB USERNAME
// =========================================================

const cleanGithubUsername = (input) => {
  if (!input) return "";

  let value = String(input).trim();
  value = value.replace(/\/+$/, "");

  if (value.startsWith("http")) {
    const parts = value.split("/").filter(Boolean);
    return parts[parts.length - 1] || "";
  }

  return value.replace(/^@/, "");
};

const GithubCollaborators = ({ repoUrl }) => {
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [removingLogin, setRemovingLogin] = useState(null);

  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selected, setSelected] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [defaultPermission, setDefaultPermission] = useState("push");
  const [adding, setAdding] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  // ───────────────────────────────────────────────────────
  // LOAD COLLABORATORS
  // ───────────────────────────────────────────────────────

  const loadCollaborators = async () => {
    if (!repoUrl) return;

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/collaborators?url=${encodeURIComponent(repoUrl)}`
      );

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        throw new Error(`Backend error ${response.status}`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load collaborators");
      }

      setCollaborators(data.collaborators || []);
    } catch (err) {
      console.error("Load collaborators error:", err);
      setError(err.message || "Failed to load");
      setCollaborators([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);

      const response = await fetch(USERS_API);
      const data = await response.json();

      if (response.ok) {
        const withGithub = (data.users || []).filter(
          (u) => u.githubUsername && u.githubUsername.trim() !== ""
        );

        setAllUsers(withGithub);
      }
    } catch (err) {
      console.error("Load users error:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (repoUrl) {
      loadCollaborators();
      loadUsers();
    }
  }, [repoUrl]);

  // ───────────────────────────────────────────────────────
  // FILTER (skip both accepted AND pending)
  // ───────────────────────────────────────────────────────

  const filteredUsers = allUsers.filter((u) => {
    const gh = cleanGithubUsername(u.githubUsername);
    if (!gh) return false;

    const isCollab = collaborators.some(
      (c) =>
        c.login.toLowerCase() === gh.toLowerCase() &&
        c.status !== "removed"
    );
    if (isCollab) return false;

    if (!userSearch.trim()) return true;

    const q = userSearch.toLowerCase().trim();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      gh.toLowerCase().includes(q)
    );
  });

  const toggleUser = (username) => {
    setSelected((prev) =>
      prev.includes(username)
        ? prev.filter((u) => u !== username)
        : [...prev, username]
    );
  };

  // ───────────────────────────────────────────────────────
  // ADD SELECTED
  // ───────────────────────────────────────────────────────

  const handleAddSelected = async () => {
    if (selected.length === 0) {
      setError("Select at least one user");
      return;
    }

    try {
      setAdding(true);
      setError("");
      setSuccess("");

      const response = await fetch(`${API_URL}/collaborators/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: repoUrl,
          collaborators: selected.map((username) => ({
            username,
            permission: defaultPermission,
          })),
        }),
      });

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error(`Backend error ${response.status}`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to add collaborators");
      }

      setSuccess(data.message || "Invitations sent!");
      setSelected([]);
      setShowPicker(false);

      setTimeout(() => {
        loadCollaborators();
        setSuccess("");
      }, 1500);
    } catch (err) {
      console.error("Add collaborators error:", err);
      setError(err.message || "Failed to add");
    } finally {
      setAdding(false);
    }
  };

  // ───────────────────────────────────────────────────────
  // REMOVE
  // ───────────────────────────────────────────────────────

  const handleRemove = async (login) => {
    const confirmed = window.confirm(
      `Remove @${login} from collaborators?`
    );
    if (!confirmed) return;

    try {
      setRemovingLogin(login);
      setError("");
      setSuccess("");

      const response = await fetch(`${API_URL}/collaborators`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: repoUrl, username: login }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to remove");
      }

      setSuccess(data.message || "Removed");
      setCollaborators((prev) =>
        prev.filter((c) => c.login !== login)
      );

      setTimeout(() => setSuccess(""), 2500);
    } catch (err) {
      console.error("Remove collaborator error:", err);
      setError(err.message || "Failed to remove");
    } finally {
      setRemovingLogin(null);
    }
  };

  if (!repoUrl) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center text-xs text-slate-400">
        Add a GitHub repo URL first
      </div>
    );
  }

  // Counts
  const acceptedCount = collaborators.filter(
    (c) => c.status === "accepted"
  ).length;
  const pendingCount = collaborators.filter(
    (c) => c.status === "pending"
  ).length;

  return (
    <div className="space-y-3">
      {/* HEADER */}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-slate-700" />
          <p className="text-sm font-medium text-slate-700">
            GitHub Collaborators
          </p>

          {acceptedCount > 0 && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
              {acceptedCount} active
            </span>
          )}

          {pendingCount > 0 && (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
              {pendingCount} pending
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={loadCollaborators}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            size={12}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* ERROR / SUCCESS */}

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* ADD BUTTON / PICKER */}

      {!showPicker ? (
        <button
          type="button"
          onClick={() => setShowPicker(true)}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
        >
          <UserPlus size={15} />
          Add Team Members as Collaborators
        </button>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-700">
              Select users
            </p>
            <button
              type="button"
              onClick={() => {
                setShowPicker(false);
                setSelected([]);
                setUserSearch("");
              }}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Cancel
            </button>
          </div>

          <div className="relative mb-2">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search users..."
              className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs outline-none focus:border-slate-400"
            />
          </div>

          <div className="mb-2 flex items-center gap-2">
            <label className="text-[11px] font-medium text-slate-600">
              Permission:
            </label>
            <select
              value={defaultPermission}
              onChange={(e) => setDefaultPermission(e.target.value)}
              className="h-7 rounded-lg border border-slate-200 bg-white px-2 text-xs outline-none focus:border-slate-400"
            >
              {PERMISSION_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-2 max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white">
            {loadingUsers ? (
              <div className="flex items-center justify-center gap-2 py-6 text-xs text-slate-400">
                <Loader2 size={14} className="animate-spin" />
                Loading users...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                {allUsers.length === 0
                  ? "No users with GitHub username in your team"
                  : userSearch
                  ? "No matching users"
                  : "All users already added"}
              </div>
            ) : (
              filteredUsers.map((user) => {
                const gh = cleanGithubUsername(user.githubUsername);
                const isChecked = selected.includes(gh);

                return (
                  <label
                    key={user._id}
                    className="flex cursor-pointer items-center gap-3 border-b border-slate-100 px-3 py-2 last:border-b-0 hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleUser(gh)}
                      className="h-4 w-4 rounded border-slate-300"
                    />

                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                      {user.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-slate-800">
                        {user.name}
                      </p>
                      <p className="truncate text-[11px] text-slate-400">
                        @{gh}
                      </p>
                    </div>
                  </label>
                );
              })
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-slate-500">
              {selected.length} selected
            </p>

            <button
              type="button"
              onClick={handleAddSelected}
              disabled={adding || selected.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {adding ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <UserPlus size={12} />
              )}
              Add Selected
            </button>
          </div>
        </div>
      )}

      {/* COLLABORATORS LIST with PENDING/ACTIVE status */}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-6 text-xs text-slate-400">
          <Loader2 size={14} className="animate-spin" />
          Loading collaborators...
        </div>
      ) : collaborators.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-xs text-slate-400">
          No collaborators yet
        </div>
      ) : (
        <ul className="space-y-2">
          {collaborators.map((c) => {
            const isPending = c.status === "pending";

            return (
              <li
                key={c.login}
                className={`flex items-center justify-between gap-3 rounded-xl border p-2.5 transition ${
                  isPending
                    ? "border-amber-200 bg-amber-50/40"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  {c.avatar ? (
                    <img
                      src={c.avatar}
                      alt={c.login}
                      className="h-8 w-8 shrink-0 rounded-full border border-slate-200"
                    />
                  ) : (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                      {c.login.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate text-sm font-medium text-slate-900 hover:underline"
                      >
                        @{c.login}
                      </a>

                      {/* Status badge */}
                      {isPending ? (
                        <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                          <Clock size={9} />
                          PENDING
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                          <CheckCircle2 size={9} />
                          ACTIVE
                        </span>
                      )}
                    </div>

                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span
                        className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                          PERMISSION_BADGE[c.permission] ||
                          PERMISSION_BADGE.unknown
                        }`}
                      >
                        {c.permission}
                      </span>

                      {isPending && (
                        <span className="text-[10px] text-amber-700">
                          Waiting for acceptance
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemove(c.login)}
                  disabled={removingLogin === c.login}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                  title={
                    isPending ? "Cancel invitation" : "Remove collaborator"
                  }
                >
                  {removingLogin === c.login ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default GithubCollaborators;