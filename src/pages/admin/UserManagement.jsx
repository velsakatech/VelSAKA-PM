import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
  Eye,
  EyeOff,
  UserPlus,
  Users as UsersIcon,
  ShieldCheck,
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  MessageCircle,
} from "lucide-react";

import AdminLayout from "./AdminLayout";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api/users";

const ACCESS_ROLES = [
  { value: "admin", label: "Admin" },
  { value: "user", label: "User" },
];

const JOB_ROLES = [
  "Company Admin",
  "Software Developer",
  "Senior Software Developer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "UI/UX Designer",
  "QA Engineer",
  "Project Manager",
  "Business Analyst",
  "DevOps Engineer",
  "HR",
  "Accountant",
  "Marketing Executive",
];

const DEPARTMENTS = [
  "Management",
  "Development",
  "Design",
  "Marketing",
  "Operations",
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const INITIAL_FORM = {
  name: "",
  email: "",
  password: "",
  accessRole: "user",
  jobRole: "",
  department: "",
  githubUsername: "",
  status: "active",
};

// =========================================================
// GITHUB ICON
// =========================================================

const GithubIcon = ({ size = 17 }) => (
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

const UserManagement = () => {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);

  const [showPassword, setShowPassword] = useState(true);

  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loading, setLoading] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState(INITIAL_FORM);

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // =========================================================
  // LOAD USERS
  // =========================================================

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      setError("");

      const response = await fetch(API_URL);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load users");
      }

      setUsers(data.users || []);
    } catch (error) {
      console.error("Load users error:", error);
      setError(error.message || "Unable to connect to the server");
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // =========================================================
  // FORM CHANGE
  // =========================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =========================================================
  // OPEN CREATE MODAL
  // =========================================================

  const handleOpenCreateModal = () => {
    setEditingUserId(null);
    setFormData({ ...INITIAL_FORM });
    setShowPassword(true);
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  // =========================================================
  // OPEN EDIT MODAL
  // =========================================================

  const handleOpenEditModal = (user) => {
    setEditingUserId(user._id);

    setFormData({
      name: user.name || "",
      email: user.email || "",
      password: "",
      accessRole: user.accessRole || "user",
      jobRole: user.jobRole || "",
      department: user.department || "",
      githubUsername: user.githubUsername || "",
      status: user.status || "active",
    });

    setShowPassword(false);
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  // =========================================================
  // CLOSE MODAL
  // =========================================================

  const handleCloseModal = () => {
    if (loading || savingEdit) {
      return;
    }

    setShowModal(false);
    setEditingUserId(null);
    setFormData({ ...INITIAL_FORM });
    setError("");
    setSuccess("");
  };

  // =========================================================
  // OPEN CHAT
  // =========================================================

  const handleOpenChat = (user) => {
    navigate(`/admin/chat/${user._id}`);
  };

  // =========================================================
  // CREATE USER
  // =========================================================

  const handleCreateUser = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.password ||
      !formData.accessRole ||
      !formData.jobRole ||
      !formData.department
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          accessRole: formData.accessRole,
          jobRole: formData.jobRole,
          department: formData.department,
          githubUsername: formData.githubUsername.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create user");
      }

      setSuccess("User created successfully.");

      setFormData({ ...INITIAL_FORM });

      await loadUsers();

      setTimeout(() => {
        setShowModal(false);
        setSuccess("");
      }, 800);
    } catch (error) {
      console.error("Create user error:", error);
      setError(error.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // UPDATE USER
  // =========================================================

  const handleUpdateUser = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.accessRole ||
      !formData.jobRole ||
      !formData.department ||
      !formData.status
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!editingUserId) {
      setError("Invalid user selected.");
      return;
    }

    try {
      setSavingEdit(true);

      const response = await fetch(`${API_URL}/${editingUserId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          accessRole: formData.accessRole,
          jobRole: formData.jobRole,
          department: formData.department,
          githubUsername: formData.githubUsername.trim(),
          status: formData.status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update user");
      }

      setSuccess("User updated successfully.");

      await loadUsers();

      setTimeout(() => {
        setShowModal(false);
        setEditingUserId(null);
        setSuccess("");
      }, 800);
    } catch (error) {
      console.error("Update user error:", error);
      setError(error.message || "Failed to update user");
    } finally {
      setSavingEdit(false);
    }
  };

  // =========================================================
  // DELETE USER
  // =========================================================

  const handleDeleteUser = async (user) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${user.name}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingUserId(user._id);
      setError("");
      setSuccess("");

      const response = await fetch(`${API_URL}/${user._id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete user");
      }

      setSuccess("User deleted successfully.");

      await loadUsers();

      setTimeout(() => {
        setSuccess("");
      }, 2500);
    } catch (error) {
      console.error("Delete user error:", error);
      setError(error.message || "Failed to delete user");
    } finally {
      setDeletingUserId(null);
    }
  };

  // =========================================================
  // FILTER USERS
  // =========================================================

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const search = searchTerm.toLowerCase().trim();

      const matchesSearch =
        !search ||
        user.name?.toLowerCase().includes(search) ||
        user.email?.toLowerCase().includes(search) ||
        user.jobRole?.toLowerCase().includes(search) ||
        user.department?.toLowerCase().includes(search) ||
        user.githubUsername?.toLowerCase().includes(search);

      const matchesRole =
        roleFilter === "all" || user.accessRole === roleFilter;

      const matchesDepartment =
        departmentFilter === "all" || user.department === departmentFilter;

      const matchesStatus =
        statusFilter === "all" || user.status === statusFilter;

      return (
        matchesSearch &&
        matchesRole &&
        matchesDepartment &&
        matchesStatus
      );
    });
  }, [
    users,
    searchTerm,
    roleFilter,
    departmentFilter,
    statusFilter,
  ]);

  // =========================================================
  // COUNTS
  // =========================================================

  const totalUsers = users.length;

  const activeUsers = users.filter(
    (user) => user.status === "active"
  ).length;

  const adminUsers = users.filter(
    (user) => user.accessRole === "admin"
  ).length;

  const departmentsCount = new Set(
    users
      .map((user) => user.department)
      .filter(Boolean)
  ).size;

  // =========================================================
  // HELPERS
  // =========================================================

  const getRoleLabel = (role) => {
    return role === "admin" ? "Admin" : "User";
  };

  const getStatusClass = (status) => {
    if (status === "active") {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }

    return "bg-gray-100 text-gray-600 border-gray-200";
  };

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <AdminLayout
      title="Users & Team"
      subtitle="Manage team members, roles and access"
    >
      <div className="min-h-screen bg-[#f7f8fa] p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1600px]">

          {/* PAGE HEADER */}

          <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
                <span>Settings</span>
                <span>/</span>
                <span className="text-gray-800">Users</span>
              </div>

              <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
                Users & Team
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Manage your VELSAKA TECH team members, roles and access.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 text-sm font-medium text-white shadow-sm transition hover:bg-gray-800 active:scale-[0.98]"
            >
              <Plus size={18} />
              Add User
            </button>
          </div>

          {/* SUCCESS */}

          {success && !showModal && (
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CheckCircle2 size={18} />
              <span>{success}</span>
            </div>
          )}

          {/* ERROR */}

          {error && !showModal && (
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* STATS */}

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">
                    Total Users
                  </p>

                  <p className="mt-2 text-2xl font-semibold text-gray-900">
                    {totalUsers}
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Team members
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <UsersIcon size={20} />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">
                    Active Users
                  </p>

                  <p className="mt-2 text-2xl font-semibold text-gray-900">
                    {activeUsers}
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Currently active
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 size={20} />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">
                    Administrators
                  </p>

                  <p className="mt-2 text-2xl font-semibold text-gray-900">
                    {adminUsers}
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Admin access
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <ShieldCheck size={20} />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">
                    Departments
                  </p>

                  <p className="mt-2 text-2xl font-semibold text-gray-900">
                    {departmentsCount}
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Active departments
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  <Building2 size={20} />
                </div>
              </div>
            </div>

          </div>

          {/* USERS CARD */}

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

            {/* TOOLBAR */}

            <div className="border-b border-gray-200 p-4 sm:p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

                <div className="relative w-full xl:max-w-md">
                  <Search
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) =>
                      setSearchTerm(event.target.value)
                    }
                    placeholder="Search users..."
                    className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-100"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:flex">

                  {/* ROLE */}

                  <div className="relative">
                    <select
                      value={roleFilter}
                      onChange={(event) =>
                        setRoleFilter(event.target.value)
                      }
                      className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 pr-10 text-sm text-gray-700 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 xl:min-w-[145px]"
                    >
                      <option value="all">
                        All Roles
                      </option>

                      {ACCESS_ROLES.map((role) => (
                        <option
                          key={role.value}
                          value={role.value}
                        >
                          {role.label}
                        </option>
                      ))}
                    </select>

                    <ChevronDown
                      size={16}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                  </div>

                  {/* DEPARTMENT */}

                  <div className="relative">
                    <select
                      value={departmentFilter}
                      onChange={(event) =>
                        setDepartmentFilter(event.target.value)
                      }
                      className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 pr-10 text-sm text-gray-700 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 xl:min-w-[160px]"
                    >
                      <option value="all">
                        All Departments
                      </option>

                      {DEPARTMENTS.map((department) => (
                        <option
                          key={department}
                          value={department}
                        >
                          {department}
                        </option>
                      ))}
                    </select>

                    <ChevronDown
                      size={16}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                  </div>

                  {/* STATUS */}

                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={(event) =>
                        setStatusFilter(event.target.value)
                      }
                      className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 pr-10 text-sm text-gray-700 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 xl:min-w-[140px]"
                    >
                      <option value="all">
                        All Status
                      </option>

                      {STATUS_OPTIONS.map((status) => (
                        <option
                          key={status.value}
                          value={status.value}
                        >
                          {status.label}
                        </option>
                      ))}
                    </select>

                    <ChevronDown
                      size={16}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                  </div>

                </div>
              </div>
            </div>

            {/* TABLE */}

            <div className="overflow-x-auto">

              {loadingUsers ? (
                <div className="flex min-h-[350px] items-center justify-center">
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <Loader2
                      size={20}
                      className="animate-spin"
                    />
                    Loading users...
                  </div>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex min-h-[350px] flex-col items-center justify-center px-6 text-center">

                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-500">
                    <UsersIcon size={25} />
                  </div>

                  <h3 className="text-sm font-semibold text-gray-900">
                    No users found
                  </h3>

                  <p className="mt-1 max-w-sm text-sm text-gray-500">
                    {users.length === 0
                      ? "Create your first team member to get started."
                      : "Try changing your search or filter options."}
                  </p>

                  {users.length === 0 && (
                    <button
                      type="button"
                      onClick={handleOpenCreateModal}
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
                    >
                      <UserPlus size={17} />
                      Add User
                    </button>
                  )}

                </div>
              ) : (
                <table className="min-w-[1100px] w-full">

                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/70">

                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        User
                      </th>

                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Access
                      </th>

                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Job Role
                      </th>

                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Department
                      </th>

                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        GitHub
                      </th>

                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Status
                      </th>

                      <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Actions
                      </th>

                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">

                    {filteredUsers.map((user) => (
                      <tr
                        key={user._id}
                        className="transition hover:bg-gray-50/70"
                      >

                        {/* USER */}

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white">
                              {user.name
                                ?.charAt(0)
                                ?.toUpperCase() || "U"}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-gray-900">
                                {user.name}
                              </p>

                              <p className="truncate text-xs text-gray-500">
                                {user.email}
                              </p>
                            </div>

                          </div>
                        </td>

                        {/* ACCESS */}

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-medium ${
                              user.accessRole === "admin"
                                ? "border-violet-200 bg-violet-50 text-violet-700"
                                : "border-gray-200 bg-gray-50 text-gray-600"
                            }`}
                          >
                            {getRoleLabel(user.accessRole)}
                          </span>
                        </td>

                        {/* JOB ROLE */}

                        <td className="px-5 py-4">
                          <p className="text-sm text-gray-700">
                            {user.jobRole || "—"}
                          </p>
                        </td>

                        {/* DEPARTMENT */}

                        <td className="px-5 py-4">
                          <span className="text-sm text-gray-700">
                            {user.department || "—"}
                          </span>
                        </td>

                        {/* GITHUB */}

                        <td className="px-5 py-4">
                          {user.githubUsername ? (
                            <a
                              href={`https://github.com/${user.githubUsername}`}
                              target="_blank"
                              rel="noreferrer"
                              title={`@${user.githubUsername}`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 transition hover:border-gray-900 hover:bg-gray-900 hover:text-white"
                            >
                              <GithubIcon size={17} />
                            </a>
                          ) : (
                            <span className="text-sm text-gray-300">
                              —
                            </span>
                          )}
                        </td>

                        {/* STATUS */}

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${getStatusClass(
                              user.status
                            )}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                user.status === "active"
                                  ? "bg-emerald-500"
                                  : "bg-gray-400"
                              }`}
                            />

                            {user.status === "active"
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>

                        {/* ACTIONS */}

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1">

                            {/* CHAT */}

                            <button
                              type="button"
                              onClick={() => handleOpenChat(user)}
                              disabled={
                                deletingUserId === user._id
                              }
                              title={`Chat with ${user.name}`}
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <MessageCircle size={17} />
                            </button>

                            {/* EDIT */}

                            <button
                              type="button"
                              onClick={() =>
                                handleOpenEditModal(user)
                              }
                              disabled={
                                deletingUserId === user._id
                              }
                              title="Edit user"
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Pencil size={17} />
                            </button>

                            {/* DELETE */}

                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteUser(user)
                              }
                              disabled={
                                deletingUserId === user._id
                              }
                              title="Delete user"
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {deletingUserId === user._id ? (
                                <Loader2
                                  size={17}
                                  className="animate-spin"
                                />
                              ) : (
                                <Trash2 size={17} />
                              )}
                            </button>

                            {/* MORE */}

                            <button
                              type="button"
                              title="More options"
                              className="hidden h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                            >
                              <MoreHorizontal size={17} />
                            </button>

                          </div>
                        </td>

                      </tr>
                    ))}

                  </tbody>
                </table>
              )}

            </div>

            {/* FOOTER */}

            {!loadingUsers && filteredUsers.length > 0 && (
              <div className="border-t border-gray-200 bg-gray-50/50 px-5 py-3.5">
                <p className="text-xs text-gray-500">
                  Showing{" "}
                  <span className="font-medium text-gray-700">
                    {filteredUsers.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-gray-700">
                    {users.length}
                  </span>{" "}
                  users
                </p>
              </div>
            )}

          </div>
        </div>

        {/* CREATE / EDIT MODAL */}

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">

            <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

              {/* MODAL HEADER */}

              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 sm:px-6">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-white">
                    {editingUserId ? (
                      <Pencil size={18} />
                    ) : (
                      <UserPlus size={18} />
                    )}
                  </div>

                  <div>
                    <h2 className="text-base font-semibold text-gray-900">
                      {editingUserId
                        ? "Edit User"
                        : "Create User"}
                    </h2>

                    <p className="mt-0.5 text-xs text-gray-500">
                      {editingUserId
                        ? "Update team member information."
                        : "Add a new VELSAKA team member."}
                    </p>
                  </div>

                </div>

                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={loading || savingEdit}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <X size={19} />
                </button>

              </div>

              {/* MODAL CONTENT */}

              <div className="overflow-y-auto px-5 py-5 sm:px-6">

                {error && (
                  <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertCircle
                      size={18}
                      className="mt-0.5 shrink-0"
                    />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    <CheckCircle2
                      size={18}
                      className="mt-0.5 shrink-0"
                    />
                    <span>{success}</span>
                  </div>
                )}

                <form
                  onSubmit={
                    editingUserId
                      ? handleUpdateUser
                      : handleCreateUser
                  }
                  id="user-form"
                >

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                    {/* NAME */}

                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Full Name
                        <span className="ml-1 text-red-500">
                          *
                        </span>
                      </label>

                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter full name"
                        disabled={loading || savingEdit}
                        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-100 disabled:bg-gray-50"
                      />
                    </div>

                    {/* EMAIL */}

                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Email Address
                        <span className="ml-1 text-red-500">
                          *
                        </span>
                      </label>

                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="name@velsaka.com"
                        disabled={loading || savingEdit}
                        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-100 disabled:bg-gray-50"
                      />
                    </div>

                    {/* PASSWORD */}

                    {!editingUserId && (
                      <div className="sm:col-span-2">

                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                          Password
                          <span className="ml-1 text-red-500">
                            *
                          </span>
                        </label>

                        <div className="relative">

                          <input
                            type={
                              showPassword
                                ? "text"
                                : "password"
                            }
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Minimum 6 characters"
                            disabled={loading}
                            className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 pr-11 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-100 disabled:bg-gray-50"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              setShowPassword(
                                (value) => !value
                              )
                            }
                            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                          >
                            {showPassword ? (
                              <EyeOff size={17} />
                            ) : (
                              <Eye size={17} />
                            )}
                          </button>

                        </div>

                        <p className="mt-1.5 text-xs text-gray-400">
                          This password will be used for Firebase
                          login.
                        </p>

                      </div>
                    )}

                    {/* GITHUB USERNAME */}

                    <div className="sm:col-span-2">

                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        GitHub Username
                      </label>

                      <input
                        type="text"
                        name="githubUsername"
                        value={formData.githubUsername}
                        onChange={handleChange}
                        placeholder="e.g. octocat"
                        disabled={loading || savingEdit}
                        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-100 disabled:bg-gray-50"
                      />

                      <p className="mt-1.5 text-xs text-gray-400">
                        Used for GitHub repository collaboration.
                      </p>

                    </div>

                    {/* ACCESS ROLE */}

                    <div>

                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Access Role
                        <span className="ml-1 text-red-500">
                          *
                        </span>
                      </label>

                      <div className="relative">

                        <select
                          name="accessRole"
                          value={formData.accessRole}
                          onChange={handleChange}
                          disabled={loading || savingEdit}
                          className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-white px-3.5 pr-10 text-sm text-gray-900 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 disabled:bg-gray-50"
                        >
                          {ACCESS_ROLES.map((role) => (
                            <option
                              key={role.value}
                              value={role.value}
                            >
                              {role.label}
                            </option>
                          ))}
                        </select>

                        <ChevronDown
                          size={16}
                          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />

                      </div>
                    </div>

                    {/* JOB ROLE */}

                    <div>

                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Job Role
                        <span className="ml-1 text-red-500">
                          *
                        </span>
                      </label>

                      <div className="relative">

                        <select
                          name="jobRole"
                          value={formData.jobRole}
                          onChange={handleChange}
                          disabled={loading || savingEdit}
                          className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-white px-3.5 pr-10 text-sm text-gray-900 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 disabled:bg-gray-50"
                        >
                          <option value="">
                            Select job role
                          </option>

                          {JOB_ROLES.map((jobRole) => (
                            <option
                              key={jobRole}
                              value={jobRole}
                            >
                              {jobRole}
                            </option>
                          ))}
                        </select>

                        <ChevronDown
                          size={16}
                          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />

                      </div>
                    </div>

                    {/* DEPARTMENT */}

                    <div>

                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Department
                        <span className="ml-1 text-red-500">
                          *
                        </span>
                      </label>

                      <div className="relative">

                        <select
                          name="department"
                          value={formData.department}
                          onChange={handleChange}
                          disabled={loading || savingEdit}
                          className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-white px-3.5 pr-10 text-sm text-gray-900 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 disabled:bg-gray-50"
                        >
                          <option value="">
                            Select department
                          </option>

                          {DEPARTMENTS.map((department) => (
                            <option
                              key={department}
                              value={department}
                            >
                              {department}
                            </option>
                          ))}
                        </select>

                        <ChevronDown
                          size={16}
                          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />

                      </div>
                    </div>

                    {/* STATUS */}

                    {editingUserId && (
                      <div>

                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                          Status
                          <span className="ml-1 text-red-500">
                            *
                          </span>
                        </label>

                        <div className="relative">

                          <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            disabled={savingEdit}
                            className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-white px-3.5 pr-10 text-sm text-gray-900 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 disabled:bg-gray-50"
                          >
                            {STATUS_OPTIONS.map((status) => (
                              <option
                                key={status.value}
                                value={status.value}
                              >
                                {status.label}
                              </option>
                            ))}
                          </select>

                          <ChevronDown
                            size={16}
                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                          />

                        </div>
                      </div>
                    )}

                  </div>

                  {/* EDIT INFO */}

                  {editingUserId && (
                    <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                      <p className="text-xs leading-5 text-blue-700">
                        Password is not changed from this screen.
                        The existing Firebase password remains
                        unchanged.
                      </p>
                    </div>
                  )}

                </form>
              </div>

              {/* MODAL FOOTER */}

              <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50/50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">

                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={loading || savingEdit}
                  className="h-11 rounded-xl border border-gray-200 bg-white px-5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  form="user-form"
                  disabled={loading || savingEdit}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 text-sm font-medium text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading || savingEdit ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />

                      {editingUserId
                        ? "Updating..."
                        : "Creating..."}
                    </>
                  ) : (
                    <>
                      {editingUserId ? (
                        <Pencil size={17} />
                      ) : (
                        <UserPlus size={17} />
                      )}

                      {editingUserId
                        ? "Update User"
                        : "Create User"}
                    </>
                  )}
                </button>

              </div>

            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};

export default UserManagement;