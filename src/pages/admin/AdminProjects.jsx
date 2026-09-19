import { useEffect, useMemo, useState } from "react";

import {
  Search,
  Plus,
  Edit3,
  Trash2,
  X,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  FolderKanban,
  Loader2,
  Users,
  Check,
  ChevronDown,
  FileText,
  FileSpreadsheet,
  FileImage,
  FileArchive,
  File,
  Upload,
  Trash,
  Paperclip,
} from "lucide-react";

import AdminLayout from "./AdminLayout";
import ProjectDocuments from "./ProjectDocuments";

// =========================================================
// PRODUCTION API
// =========================================================

const API_BASE_URL = import.meta.env.API_URL?.trim().replace(/\/+$/, "");

if (!API_BASE_URL) {
  throw new Error("API_URL is not configured.");
}

const PROJECTS_API = `${API_BASE_URL}/api/projects`;
const USERS_API = `${API_BASE_URL}/api/users`;
const PROJECT_DOCUMENTS_API = `${API_BASE_URL}/api/project-documents`;

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".txt",
  ".csv",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".zip",
];

const INITIAL_FORM = {
  name: "",
  description: "",
  status: "planning",
  priority: "medium",
  startDate: "",
  dueDate: "",
  members: [],
};

const STATUS_OPTIONS = [
  {
    value: "planning",
    label: "Planning",
  },
  {
    value: "active",
    label: "Active",
  },
  {
    value: "completed",
    label: "Completed",
  },
  {
    value: "on-hold",
    label: "On Hold",
  },
];

const PRIORITY_OPTIONS = [
  {
    value: "low",
    label: "Low",
  },
  {
    value: "medium",
    label: "Medium",
  },
  {
    value: "high",
    label: "High",
  },
];

// =========================================================
// HELPERS
// =========================================================

const getUserId = (user) => {
  return user?._id || user?.id || user?.firebaseUid || "";
};

const getUserInitial = (user) => {
  const name = user?.name || user?.email || "U";

  return name.charAt(0).toUpperCase();
};

const formatDate = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatStatus = (status) => {
  switch (status) {
    case "active":
      return "Active";

    case "completed":
      return "Completed";

    case "on-hold":
      return "On Hold";

    case "planning":
    default:
      return "Planning";
  }
};

const formatPriority = (priority) => {
  if (!priority) return "Medium";

  return (
    priority.charAt(0).toUpperCase() +
    priority.slice(1)
  );
};

const formatFileSize = (bytes) => {
  if (!bytes) return "0 Bytes";

  const sizes = [
    "Bytes",
    "KB",
    "MB",
    "GB",
  ];

  const index = Math.floor(
    Math.log(bytes) / Math.log(1024)
  );

  return `${parseFloat(
    (
      bytes /
      Math.pow(1024, index)
    ).toFixed(2)
  )} ${sizes[index]}`;
};

const getFileExtension = (fileName) => {
  const lastDot =
    fileName.lastIndexOf(".");

  if (lastDot === -1) {
    return "";
  }

  return fileName
    .slice(lastDot)
    .toLowerCase();
};

const getFileIcon = (fileName) => {
  const extension =
    getFileExtension(fileName);

  if (
    [
      ".jpg",
      ".jpeg",
      ".png",
      ".webp",
      ".gif",
    ].includes(extension)
  ) {
    return FileImage;
  }

  if (
    [".xls", ".xlsx", ".csv"].includes(
      extension
    )
  ) {
    return FileSpreadsheet;
  }

  if (extension === ".zip") {
    return FileArchive;
  }

  if (
    [
      ".pdf",
      ".doc",
      ".docx",
      ".ppt",
      ".pptx",
      ".txt",
    ].includes(extension)
  ) {
    return FileText;
  }

  return File;
};

// =========================================================
// ADMIN PROJECTS
// =========================================================

const AdminProjects = () => {
  // =======================================================
  // PROJECT STATE
  // =======================================================

  const [projects, setProjects] = useState([]);

  // =======================================================
  // USER STATE
  // =======================================================

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] =
    useState(false);

  const [currentUser, setCurrentUser] =
    useState(null);

  // =======================================================
  // PAGE STATE
  // =======================================================

  const [search, setSearch] = useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [
    deletingProjectId,
    setDeletingProjectId,
  ] = useState(null);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // =======================================================
  // MODAL STATE
  // =======================================================

  const [showModal, setShowModal] =
    useState(false);

  const [
    editingProjectId,
    setEditingProjectId,
  ] = useState(null);

  const [formData, setFormData] =
    useState(INITIAL_FORM);

  // =======================================================
  // USER SEARCH
  // =======================================================

  const [userSearch, setUserSearch] =
    useState("");

  // =======================================================
  // NEW PROJECT DOCUMENTS
  // =======================================================

  const [
    selectedFiles,
    setSelectedFiles,
  ] = useState([]);

  const [
    documentError,
    setDocumentError,
  ] = useState("");

  const [
    uploadingDocuments,
    setUploadingDocuments,
  ] = useState(false);

  const [
    uploadProgress,
    setUploadProgress,
  ] = useState(0);

  // =======================================================
  // LOAD PROJECTS
  // =======================================================

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await fetch(PROJECTS_API);

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
          "Projects API returned an invalid response."
        );
      }

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load projects."
        );
      }

      setProjects(
        data.projects || []
      );
    } catch (error) {
      console.error(
        "Load projects error:",
        error
      );

      setError(
        error.message ||
          "Unable to load projects."
      );
    } finally {
      setLoading(false);
    }
  };

  // =======================================================
  // LOAD USERS
  // =======================================================

  const loadUsers = async () => {
    try {
      setUsersLoading(true);

      const response =
        await fetch(USERS_API);

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
          "Users API returned an invalid response."
        );
      }

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load users."
        );
      }

      setUsers(
        data.users || []
      );
    } catch (error) {
      console.error(
        "Load users error:",
        error
      );

      setError(
        error.message ||
          "Unable to load users."
      );
    } finally {
      setUsersLoading(false);
    }
  };

  // =======================================================
  // LOAD CURRENT USER
  // =======================================================

  const loadCurrentUser = () => {
    try {
      const storedUser =
        localStorage.getItem("user");

      if (
        !storedUser ||
        storedUser === "undefined"
      ) {
        setCurrentUser(null);
        return;
      }

      setCurrentUser(
        JSON.parse(storedUser)
      );
    } catch (error) {
      console.error(
        "Load current user error:",
        error
      );

      setCurrentUser(null);
    }
  };

  // =======================================================
  // INITIAL LOAD
  // =======================================================

  useEffect(() => {
    loadProjects();
    loadUsers();
    loadCurrentUser();
  }, []);

  // =======================================================
  // FORM CHANGE
  // =======================================================

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =======================================================
  // OPEN CREATE MODAL
  // =======================================================

  const openCreateModal = () => {
    setEditingProjectId(null);

    setFormData({
      ...INITIAL_FORM,
      members: [],
    });

    setSelectedFiles([]);

    setDocumentError("");

    setUploadProgress(0);

    setUserSearch("");

    setError("");

    setSuccess("");

    setShowModal(true);
  };

  // =======================================================
  // OPEN EDIT MODAL
  // =======================================================

  const openEditModal = (project) => {
    setEditingProjectId(
      project._id
    );

    setFormData({
      name: project.name || "",

      description:
        project.description || "",

      status:
        project.status ||
        "planning",

      priority:
        project.priority ||
        "medium",

      startDate:
        project.startDate
          ? String(
              project.startDate
            ).substring(0, 10)
          : "",

      dueDate:
        project.dueDate
          ? String(
              project.dueDate
            ).substring(0, 10)
          : "",

      members:
        Array.isArray(
          project.members
        )
          ? project.members.map(
              (member) =>
                String(
                  typeof member ===
                    "object"
                    ? member._id ||
                        member.id
                    : member
                )
            )
          : [],
    });

    setSelectedFiles([]);

    setDocumentError("");

    setUploadProgress(0);

    setUserSearch("");

    setError("");

    setSuccess("");

    setShowModal(true);
  };

  // =======================================================
  // CLOSE MODAL
  // =======================================================

  const closeModal = () => {
    if (
      saving ||
      uploadingDocuments
    ) {
      return;
    }

    setShowModal(false);

    setEditingProjectId(null);

    setFormData({
      ...INITIAL_FORM,
      members: [],
    });

    setSelectedFiles([]);

    setDocumentError("");

    setUploadProgress(0);

    setUserSearch("");

    setError("");
  };

  // =======================================================
  // TOGGLE USER
  // =======================================================

  const toggleUser = (userId) => {
    const normalizedUserId =
      String(userId);

    setFormData((previous) => {
      const currentMembers =
        Array.isArray(
          previous.members
        )
          ? previous.members
          : [];

      const alreadySelected =
        currentMembers.includes(
          normalizedUserId
        );

      if (alreadySelected) {
        return {
          ...previous,
          members:
            currentMembers.filter(
              (id) =>
                String(id) !==
                normalizedUserId
            ),
        };
      }

      return {
        ...previous,
        members: [
          ...currentMembers,
          normalizedUserId,
        ],
      };
    });
  };

  // =======================================================
  // REMOVE SELECTED USER
  // =======================================================

  const removeUser = (userId) => {
    const normalizedUserId =
      String(userId);

    setFormData((previous) => ({
      ...previous,

      members:
        previous.members.filter(
          (id) =>
            String(id) !==
            normalizedUserId
        ),
    }));
  };

  // =======================================================
  // ADD DOCUMENTS
  // =======================================================

  const handleDocumentSelection = (
    event
  ) => {
    const files = Array.from(
      event.target.files || []
    );

    setDocumentError("");

    if (files.length === 0) {
      return;
    }

    const validFiles = [];
    const errors = [];

    files.forEach((file) => {
      const extension =
        getFileExtension(
          file.name
        );

      if (
        !ALLOWED_EXTENSIONS.includes(
          extension
        )
      ) {
        errors.push(
          `${file.name}: unsupported file type`
        );
        return;
      }

      if (
        file.size > MAX_FILE_SIZE
      ) {
        errors.push(
          `${file.name}: file must be 10 MB or less`
        );
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      setDocumentError(
        errors.join(" • ")
      );
    }

    setSelectedFiles(
      (previous) => {
        const existingNames =
          new Set(
            previous.map(
              (file) =>
                `${file.name}-${file.size}`
            )
          );

        const newFiles =
          validFiles.filter(
            (file) =>
              !existingNames.has(
                `${file.name}-${file.size}`
              )
          );

        return [
          ...previous,
          ...newFiles,
        ];
      }
    );

    event.target.value = "";
  };

  // =======================================================
  // REMOVE SELECTED DOCUMENT
  // =======================================================

  const removeSelectedFile = (
    index
  ) => {
    setSelectedFiles(
      (previous) =>
        previous.filter(
          (_, fileIndex) =>
            fileIndex !== index
        )
    );
  };

  // =======================================================
  // UPLOAD NEW PROJECT DOCUMENTS
  // =======================================================

  const uploadNewProjectDocuments =
    async (projectId) => {
      if (
        !projectId ||
        selectedFiles.length === 0
      ) {
        return;
      }

      setUploadingDocuments(true);
      setUploadProgress(0);

      try {
        for (
          let index = 0;
          index <
          selectedFiles.length;
          index++
        ) {
          const file =
            selectedFiles[index];

          const formData =
            new FormData();

          formData.append(
            "document",
            file
          );

          formData.append(
            "uploadedBy",
            currentUser?.firebaseUid ||
              currentUser?._id ||
              currentUser?.id ||
              ""
          );

          formData.append(
            "uploadedByName",
            currentUser?.name ||
              currentUser?.email ||
              ""
          );

          const response =
            await fetch(
              `${PROJECT_DOCUMENTS_API}/project/${projectId}`,
              {
                method: "POST",
                body: formData,
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
              `Invalid response while uploading ${file.name}.`
            );
          }

          const data =
            await response.json();

          if (!response.ok) {
            throw new Error(
              data.message ||
                `Failed to upload ${file.name}.`
            );
          }

          const progress = Math.round(
            ((index + 1) /
              selectedFiles.length) *
              100
          );

          setUploadProgress(
            progress
          );
        }

        return true;
      } catch (error) {
        console.error(
          "Upload project documents error:",
          error
        );

        throw error;
      } finally {
        setUploadingDocuments(
          false
        );
      }
    };

  // =======================================================
  // CREATE / UPDATE PROJECT
  // =======================================================

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");
    setDocumentError("");

    const projectName =
      formData.name.trim();

    if (!projectName) {
      setError(
        "Project name is required."
      );
      return;
    }

    if (projectName.length < 2) {
      setError(
        "Project name must contain at least 2 characters."
      );
      return;
    }

    try {
      setSaving(true);

      const isEditing =
        Boolean(editingProjectId);

      const url = isEditing
        ? `${PROJECTS_API}/${editingProjectId}`
        : PROJECTS_API;

      const method = isEditing
        ? "PUT"
        : "POST";

      const commonProjectData = {
        name: projectName,

        description:
          formData.description.trim(),

        status:
          formData.status,

        priority:
          formData.priority,

        startDate:
          formData.startDate || null,

        dueDate:
          formData.dueDate || null,

        members:
          Array.isArray(
            formData.members
          )
            ? formData.members
            : [],
      };

      const body = isEditing
        ? commonProjectData
        : {
            ...commonProjectData,

            createdBy:
              currentUser?.firebaseUid ||
              currentUser?._id ||
              currentUser?.id ||
              "",

            createdByName:
              currentUser?.name ||
              "",
          };

      console.log(
        "PROJECT PAYLOAD:",
        body
      );

      const response =
        await fetch(url, {
          method,

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(body),
        });

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
          "Server returned an invalid response."
        );
      }

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Failed to ${
              isEditing
                ? "update"
                : "create"
            } project.`
        );
      }

      // ===================================================
      // UPDATE PROJECT STATE
      // ===================================================

      if (isEditing) {
        setProjects(
          (previous) =>
            previous.map(
              (project) =>
                project._id ===
                editingProjectId
                  ? data.project
                  : project
            )
        );
      } else {
        setProjects(
          (previous) => [
            data.project,
            ...previous,
          ]
        );
      }

      // ===================================================
      // UPLOAD DOCUMENTS AFTER PROJECT CREATION
      // ===================================================

      if (
        !isEditing &&
        selectedFiles.length > 0
      ) {
        try {
          await uploadNewProjectDocuments(
            data.project._id
          );
        } catch (uploadError) {
          console.error(
            "Project created but document upload failed:",
            uploadError
          );

          setSuccess(
            "Project created, but some documents could not be uploaded."
          );

          setShowModal(false);
          setEditingProjectId(null);
          setSelectedFiles([]);

          setFormData({
            ...INITIAL_FORM,
            members: [],
          });

          setUserSearch("");

          return;
        }
      }

      // ===================================================
      // SUCCESS
      // ===================================================

      setSuccess(
        isEditing
          ? "Project updated successfully."
          : selectedFiles.length > 0
          ? "Project and documents created successfully."
          : "Project created successfully."
      );

      // ===================================================
      // CLOSE
      // ===================================================

      setShowModal(false);

      setEditingProjectId(null);

      setFormData({
        ...INITIAL_FORM,
        members: [],
      });

      setSelectedFiles([]);

      setDocumentError("");

      setUploadProgress(0);

      setUserSearch("");

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (error) {
      console.error(
        "Save project error:",
        error
      );

      setError(
        error.message ||
          "Failed to save project."
      );
    } finally {
      setSaving(false);
    }
  };

  // =======================================================
  // DELETE PROJECT
  // =======================================================

  const handleDelete = async (
    project
  ) => {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${project.name}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingProjectId(
        project._id
      );

      setError("");

      const response =
        await fetch(
          `${PROJECTS_API}/${project._id}`,
          {
            method: "DELETE",
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
          "Server returned an invalid response."
        );
      }

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to delete project."
        );
      }

      setProjects(
        (previous) =>
          previous.filter(
            (item) =>
              item._id !==
              project._id
          )
      );

      setSuccess(
        "Project deleted successfully."
      );

      setTimeout(() => {
        setSuccess("");
      }, 2500);
    } catch (error) {
      console.error(
        "Delete project error:",
        error
      );

      setError(
        error.message ||
          "Failed to delete project."
      );
    } finally {
      setDeletingProjectId(null);
    }
  };

  // =======================================================
  // FILTER PROJECTS
  // =======================================================

  const filteredProjects =
    useMemo(() => {
      const value =
        search
          .trim()
          .toLowerCase();

      if (!value) {
        return projects;
      }

      return projects.filter(
        (project) =>
          [
            project.name,
            project.description,
            project.status,
            project.priority,
          ]
            .filter(Boolean)
            .some((field) =>
              String(field)
                .toLowerCase()
                .includes(value)
            )
      );
    }, [projects, search]);

  // =======================================================
  // AVAILABLE USERS
  // =======================================================

  const availableUsers =
    useMemo(() => {
      const value =
        userSearch
          .trim()
          .toLowerCase();

      return users
        .filter(
          (user) =>
            user.status !==
              "inactive" &&
            user.accessRole !==
              "admin"
        )
        .filter((user) => {
          if (!value) {
            return true;
          }

          return [
            user.name,
            user.email,
            user.jobRole,
            user.department,
          ]
            .filter(Boolean)
            .some((field) =>
              String(field)
                .toLowerCase()
                .includes(value)
            );
        });
    }, [users, userSearch]);

  // =======================================================
  // SELECTED USER OBJECTS
  // =======================================================

  const selectedUsers =
    useMemo(() => {
      const selectedIds =
        new Set(
          (
            formData.members ||
            []
          ).map((id) =>
            String(id)
          )
        );

      return users.filter(
        (user) =>
          selectedIds.has(
            String(
              getUserId(user)
            )
          )
      );
    }, [
      users,
      formData.members,
    ]);

  // =======================================================
  // PROJECT MEMBERS
  // =======================================================

  const getProjectMembers = (
    project
  ) => {
    if (
      !Array.isArray(
        project?.members
      )
    ) {
      return [];
    }

    const memberIds =
      project.members.map(
        (member) =>
          String(
            typeof member ===
              "object"
              ? member._id ||
                  member.id
              : member
          )
      );

    return users.filter(
      (user) =>
        memberIds.includes(
          String(
            getUserId(user)
          )
        )
    );
  };

  // =======================================================
  // STATUS STYLE
  // =======================================================

  const getStatusClass = (
    status
  ) => {
    switch (status) {
      case "active":
        return "border-blue-200 bg-blue-50 text-blue-700";

      case "completed":
        return "border-emerald-200 bg-emerald-50 text-emerald-700";

      case "on-hold":
        return "border-amber-200 bg-amber-50 text-amber-700";

      case "planning":
      default:
        return "border-slate-200 bg-slate-50 text-slate-600";
    }
  };

  // =======================================================
  // PRIORITY STYLE
  // =======================================================

  const getPriorityClass = (
    priority
  ) => {
    switch (priority) {
      case "high":
        return "border-red-200 bg-red-50 text-red-700";

      case "low":
        return "border-emerald-200 bg-emerald-50 text-emerald-700";

      case "medium":
      default:
        return "border-amber-200 bg-amber-50 text-amber-700";
    }
  };

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <AdminLayout
      title="Projects"
      subtitle="Create and manage all projects"
    >
      <div className="min-h-screen bg-[#f7f8fa] p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1600px]">

          {/* HEADER */}

          <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
                <span>
                  Workspace
                </span>

                <span>/</span>

                <span className="text-slate-800">
                  Projects
                </span>
              </div>

              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                Projects
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Create projects and assign
                them to your team members.
              </p>
            </div>

            <button
              type="button"
              onClick={
                openCreateModal
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.98]"
            >
              <Plus size={18} />

              Create Project
            </button>
          </div>

          {/* SUCCESS */}

          {success && (
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CheckCircle2
                size={18}
                className="shrink-0"
              />

              <span>
                {success}
              </span>
            </div>
          )}

          {/* ERROR */}

          {error && (
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle
                size={18}
                className="shrink-0"
              />

              <span>
                {error}
              </span>

              <button
                type="button"
                onClick={() =>
                  setError("")
                }
                className="ml-auto text-red-500 hover:text-red-700"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* SEARCH */}

          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="relative max-w-md">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search projects..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
              />
            </div>
          </div>

          {/* PROJECTS */}

          {loading ? (
            <div className="flex min-h-[350px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
              <div className="flex flex-col items-center gap-3">
                <Loader2
                  size={28}
                  className="animate-spin text-slate-500"
                />

                <p className="text-sm text-slate-400">
                  Loading projects...
                </p>
              </div>
            </div>
          ) : filteredProjects.length ===
            0 ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <FolderKanban
                  size={26}
                  className="text-slate-400"
                />
              </div>

              <h3 className="text-base font-semibold text-slate-800">
                {search
                  ? "No projects found"
                  : "No projects yet"}
              </h3>

              <p className="mt-1 max-w-md text-sm text-slate-400">
                {search
                  ? "Try changing your search."
                  : "Create your first project and assign it to your team."}
              </p>

              {!search && (
                <button
                  type="button"
                  onClick={
                    openCreateModal
                  }
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  <Plus size={16} />

                  Create Project
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
              {filteredProjects.map(
                (project) => {
                  const projectMembers =
                    getProjectMembers(
                      project
                    );

                  return (
                    <div
                      key={
                        project._id
                      }
                      className="group flex min-h-[310px] flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      {/* CARD HEADER */}

                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                            <FolderKanban
                              size={20}
                              className="text-slate-600"
                            />
                          </div>

                          <div className="min-w-0">
                            <h3 className="truncate text-base font-semibold text-slate-900">
                              {
                                project.name
                              }
                            </h3>

                            <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-400">
                              {project.description ||
                                "No description added."}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(
                                project
                              )
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-800"
                            title="Edit project"
                          >
                            <Edit3
                              size={16}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                project
                              )
                            }
                            disabled={
                              deletingProjectId ===
                              project._id
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                            title="Delete project"
                          >
                            {deletingProjectId ===
                            project._id ? (
                              <Loader2
                                size={16}
                                className="animate-spin"
                              />
                            ) : (
                              <Trash2
                                size={16}
                              />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* STATUS / PRIORITY */}

                      <div className="mt-5 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${getStatusClass(
                            project.status
                          )}`}
                        >
                          {formatStatus(
                            project.status
                          )}
                        </span>

                        <span
                          className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${getPriorityClass(
                            project.priority
                          )}`}
                        >
                          {formatPriority(
                            project.priority
                          )}
                        </span>
                      </div>

                      {/* ASSIGNED USERS */}

                      <div className="mt-5">
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users
                              size={14}
                              className="text-slate-400"
                            />

                            <span className="text-xs font-medium text-slate-500">
                              Assigned users
                            </span>
                          </div>

                          <span className="text-xs font-medium text-slate-400">
                            {
                              projectMembers.length
                            }
                          </span>
                        </div>

                        {projectMembers.length ===
                        0 ? (
                          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3">
                            <p className="text-xs text-slate-400">
                              No users assigned
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {projectMembers
                              .slice(0, 4)
                              .map(
                                (
                                  member
                                ) => (
                                  <div
                                    key={getUserId(
                                      member
                                    )}
                                    className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5"
                                  >
                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[10px] font-semibold text-white">
                                      {getUserInitial(
                                        member
                                      )}
                                    </div>

                                    <span className="max-w-[110px] truncate text-xs font-medium text-slate-600">
                                      {member.name ||
                                        member.email ||
                                        "User"}
                                    </span>
                                  </div>
                                )
                              )}

                            {projectMembers.length >
                              4 && (
                              <div className="flex h-8 items-center rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-400">
                                +
                                {projectMembers.length -
                                  4}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* DATES */}

                      <div className="mt-auto border-t border-slate-100 pt-4">
                        <div className="flex items-center justify-between gap-4 text-xs text-slate-400">
                          <div className="flex min-w-0 items-center gap-1.5">
                            <CalendarDays
                              size={14}
                            />

                            <span className="truncate">
                              {project.startDate
                                ? formatDate(
                                    project.startDate
                                  )
                                : "No start date"}
                            </span>
                          </div>

                          <div className="truncate">
                            {project.dueDate
                              ? `Due ${formatDate(
                                  project.dueDate
                                )}`
                              : "No due date"}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}

          {/* CREATE / EDIT MODAL */}

          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
              <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

                {/* MODAL HEADER */}

                <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-5">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      {editingProjectId
                        ? "Edit Project"
                        : "Create Project"}
                    </h2>

                    <p className="mt-1 text-xs text-slate-400">
                      {editingProjectId
                        ? "Update project details, team assignment and documents."
                        : "Create a project, assign team members and upload documents."}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      closeModal
                    }
                    disabled={
                      saving ||
                      uploadingDocuments
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                  >
                    <X size={19} />
                  </button>
                </div>

                {/* FORM */}

                <form
                  onSubmit={
                    handleSubmit
                  }
                  className="flex min-h-0 flex-1 flex-col"
                >
                  <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-6">

                    {/* FORM ERROR */}

                    {error && (
                      <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        <AlertCircle
                          size={17}
                          className="mt-0.5 shrink-0"
                        />

                        <span>
                          {error}
                        </span>
                      </div>
                    )}

                    {/* PROJECT NAME */}

                    <div>
                      <label
                        htmlFor="project-name"
                        className="mb-2 block text-sm font-medium text-slate-700"
                      >
                        Project Name
                        <span className="ml-1 text-red-500">
                          *
                        </span>
                      </label>

                      <input
                        id="project-name"
                        type="text"
                        name="name"
                        value={
                          formData.name
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="e.g. VELSAKA PM"
                        maxLength={100}
                        disabled={
                          saving
                        }
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50"
                      />
                    </div>

                    {/* DESCRIPTION */}

                    <div>
                      <label
                        htmlFor="project-description"
                        className="mb-2 block text-sm font-medium text-slate-700"
                      >
                        Description
                      </label>

                      <textarea
                        id="project-description"
                        name="description"
                        value={
                          formData.description
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Briefly describe the project..."
                        rows={4}
                        maxLength={1000}
                        disabled={
                          saving
                        }
                        className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50"
                      />
                    </div>

                    {/* STATUS + PRIORITY */}

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                      <div>
                        <label
                          htmlFor="project-status"
                          className="mb-2 block text-sm font-medium text-slate-700"
                        >
                          Status
                        </label>

                        <div className="relative">
                          <select
                            id="project-status"
                            name="status"
                            value={
                              formData.status
                            }
                            onChange={
                              handleChange
                            }
                            disabled={
                              saving
                            }
                            className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 pr-10 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                          >
                            {STATUS_OPTIONS.map(
                              (
                                option
                              ) => (
                                <option
                                  key={
                                    option.value
                                  }
                                  value={
                                    option.value
                                  }
                                >
                                  {
                                    option.label
                                  }
                                </option>
                              )
                            )}
                          </select>

                          <ChevronDown
                            size={16}
                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="project-priority"
                          className="mb-2 block text-sm font-medium text-slate-700"
                        >
                          Priority
                        </label>

                        <div className="relative">
                          <select
                            id="project-priority"
                            name="priority"
                            value={
                              formData.priority
                            }
                            onChange={
                              handleChange
                            }
                            disabled={
                              saving
                            }
                            className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 pr-10 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                          >
                            {PRIORITY_OPTIONS.map(
                              (
                                option
                              ) => (
                                <option
                                  key={
                                    option.value
                                  }
                                  value={
                                    option.value
                                  }
                                >
                                  {
                                    option.label
                                  }
                                </option>
                              )
                            )}
                          </select>

                          <ChevronDown
                            size={16}
                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                          />
                        </div>
                      </div>
                    </div>

                    {/* DATES */}

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                      <div>
                        <label
                          htmlFor="project-start-date"
                          className="mb-2 block text-sm font-medium text-slate-700"
                        >
                          Start Date
                        </label>

                        <input
                          id="project-start-date"
                          type="date"
                          name="startDate"
                          value={
                            formData.startDate
                          }
                          onChange={
                            handleChange
                          }
                          disabled={
                            saving
                          }
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="project-due-date"
                          className="mb-2 block text-sm font-medium text-slate-700"
                        >
                          Due Date
                        </label>

                        <input
                          id="project-due-date"
                          type="date"
                          name="dueDate"
                          value={
                            formData.dueDate
                          }
                          onChange={
                            handleChange
                          }
                          disabled={
                            saving
                          }
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                        />
                      </div>
                    </div>

                    {/* ASSIGN USERS */}

                    <div>
                      <div className="mb-3 flex items-start justify-between gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700">
                            Assign Users
                          </label>

                          <p className="mt-1 text-xs text-slate-400">
                            Select the team members who should have access to this project.
                          </p>
                        </div>

                        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          {
                            formData
                              .members
                              .length
                          }{" "}
                          selected
                        </span>
                      </div>

                      {/* SELECTED USERS */}

                      {selectedUsers.length >
                        0 && (
                        <div className="mb-3 flex flex-wrap gap-2">
                          {selectedUsers.map(
                            (
                              user
                            ) => {
                              const userId =
                                getUserId(
                                  user
                                );

                              return (
                                <div
                                  key={
                                    userId
                                  }
                                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-1.5 pr-2"
                                >
                                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[10px] font-semibold text-white">
                                    {getUserInitial(
                                      user
                                    )}
                                  </div>

                                  <span className="max-w-[140px] truncate text-xs font-medium text-slate-700">
                                    {
                                      user.name ||
                                      user.email
                                    }
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeUser(
                                        userId
                                      )
                                    }
                                    disabled={
                                      saving
                                    }
                                    className="flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                                  >
                                    <X
                                      size={
                                        13
                                      }
                                    />
                                  </button>
                                </div>
                              );
                            }
                          )}
                        </div>
                      )}

                      {/* USER LIST */}

                      <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/50">

                        <div className="border-b border-slate-200 bg-white p-3">
                          <div className="relative">
                            <Search
                              size={15}
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                              type="text"
                              value={
                                userSearch
                              }
                              onChange={(
                                event
                              ) =>
                                setUserSearch(
                                  event
                                    .target
                                    .value
                                )
                              }
                              placeholder="Search users..."
                              disabled={
                                saving ||
                                usersLoading
                              }
                              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
                            />
                          </div>
                        </div>

                        {usersLoading ? (
                          <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
                            <Loader2
                              size={17}
                              className="animate-spin"
                            />

                            Loading users...
                          </div>
                        ) : users.length ===
                          0 ? (
                          <div className="px-5 py-10 text-center">
                            <Users
                              size={25}
                              className="mx-auto mb-2 text-slate-300"
                            />

                            <p className="text-sm font-medium text-slate-600">
                              No users available
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              Create users first from the Users page.
                            </p>
                          </div>
                        ) : availableUsers.length ===
                          0 ? (
                          <div className="px-5 py-8 text-center">
                            <p className="text-sm font-medium text-slate-600">
                              No matching users
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              Try another search.
                            </p>
                          </div>
                        ) : (
                          <div className="max-h-64 overflow-y-auto p-2">
                            {availableUsers.map(
                              (
                                user
                              ) => {
                                const userId =
                                  getUserId(
                                    user
                                  );

                                const selected =
                                  formData.members.some(
                                    (
                                      id
                                    ) =>
                                      String(
                                        id
                                      ) ===
                                      String(
                                        userId
                                      )
                                  );

                                return (
                                  <button
                                    key={
                                      userId
                                    }
                                    type="button"
                                    onClick={() =>
                                      toggleUser(
                                        userId
                                      )
                                    }
                                    disabled={
                                      saving
                                    }
                                    className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${
                                      selected
                                        ? "border-slate-300 bg-white shadow-sm"
                                        : "border-transparent hover:bg-white"
                                    }`}
                                  >
                                    <div
                                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                                        selected
                                          ? "bg-slate-900 text-white"
                                          : "bg-slate-200 text-slate-600"
                                      }`}
                                    >
                                      {getUserInitial(
                                        user
                                      )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-sm font-medium text-slate-800">
                                        {user.name ||
                                          "Unnamed User"}
                                      </p>

                                      <p className="truncate text-xs text-slate-400">
                                        {
                                          user.email
                                        }
                                      </p>

                                      {user.jobRole && (
                                        <p className="mt-0.5 truncate text-[11px] text-slate-400">
                                          {
                                            user.jobRole
                                          }
                                        </p>
                                      )}
                                    </div>

                                    <div
                                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                                        selected
                                          ? "border-slate-900 bg-slate-900 text-white"
                                          : "border-slate-300 bg-white text-transparent"
                                      }`}
                                    >
                                      <Check
                                        size={
                                          13
                                        }
                                      />
                                    </div>
                                  </button>
                                );
                              }
                            )}
                          </div>
                        )}
                      </div>

                      <p className="mt-2 text-[11px] text-slate-400">
                        Admin accounts are excluded from this list. Project access is assigned to regular users.
                      </p>
                    </div>

                    {/* CREATE MODE - DOCUMENT UPLOAD */}

                    {!editingProjectId && (
                      <div className="border-t border-slate-200 pt-6">

                        <div className="mb-4 flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <Paperclip
                                size={17}
                                className="text-slate-500"
                              />

                              <h3 className="text-sm font-semibold text-slate-800">
                                Project Documents
                              </h3>
                            </div>

                            <p className="mt-1 text-xs text-slate-400">
                              Upload documents while creating this project.
                            </p>
                          </div>

                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                            {
                              selectedFiles.length
                            }{" "}
                            files
                          </span>
                        </div>

                        {/* UPLOAD AREA */}

                        <label
                          htmlFor="new-project-documents"
                          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-7 text-center transition hover:border-slate-400 hover:bg-slate-100"
                        >
                          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm">
                            <Upload
                              size={20}
                              className="text-slate-500"
                            />
                          </div>

                          <p className="text-sm font-medium text-slate-700">
                            Click to upload documents
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            PDF, Word, Excel, PowerPoint, TXT, CSV, Images or ZIP
                          </p>

                          <p className="mt-1 text-[11px] text-slate-400">
                            Maximum 10 MB per file
                          </p>

                          <input
                            id="new-project-documents"
                            type="file"
                            multiple
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.webp,.gif,.zip"
                            onChange={
                              handleDocumentSelection
                            }
                            disabled={
                              saving ||
                              uploadingDocuments
                            }
                            className="hidden"
                          />
                        </label>

                        {/* DOCUMENT ERROR */}

                        {documentError && (
                          <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-600">
                            <AlertCircle
                              size={15}
                              className="mt-0.5 shrink-0"
                            />

                            <span>
                              {
                                documentError
                              }
                            </span>
                          </div>
                        )}

                        {/* SELECTED FILES */}

                        {selectedFiles.length >
                          0 && (
                          <div className="mt-4 space-y-2">
                            {selectedFiles.map(
                              (
                                file,
                                index
                              ) => {
                                const FileIcon =
                                  getFileIcon(
                                    file.name
                                  );

                                return (
                                  <div
                                    key={`${file.name}-${file.size}-${index}`}
                                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3"
                                  >
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                                      <FileIcon
                                        size={
                                          17
                                        }
                                        className="text-slate-500"
                                      />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-sm font-medium text-slate-700">
                                        {
                                          file.name
                                        }
                                      </p>

                                      <p className="mt-0.5 text-[11px] text-slate-400">
                                        {formatFileSize(
                                          file.size
                                        )}
                                      </p>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeSelectedFile(
                                          index
                                        )
                                      }
                                      disabled={
                                        saving ||
                                        uploadingDocuments
                                      }
                                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                      title="Remove file"
                                    >
                                      <Trash
                                        size={
                                          15
                                        }
                                      />
                                    </button>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        )}

                        {/* UPLOAD PROGRESS */}

                        {uploadingDocuments && (
                          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <div className="mb-2 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Loader2
                                  size={
                                    15
                                  }
                                  className="animate-spin text-slate-500"
                                />

                                <span className="text-xs font-medium text-slate-600">
                                  Uploading documents...
                                </span>
                              </div>

                              <span className="text-xs font-medium text-slate-500">
                                {
                                  uploadProgress
                                }
                                %
                              </span>
                            </div>

                            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                              <div
                                className="h-full rounded-full bg-slate-900 transition-all"
                                style={{
                                  width: `${uploadProgress}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* EDIT MODE - EXISTING DOCUMENTS */}

                    {editingProjectId && (
                      <div className="border-t border-slate-200 pt-6">

                        <div className="mb-4">
                          <div className="flex items-center gap-2">
                            <Paperclip
                              size={17}
                              className="text-slate-500"
                            />

                            <h3 className="text-sm font-semibold text-slate-800">
                              Project Documents
                            </h3>
                          </div>

                          <p className="mt-1 text-xs text-slate-400">
                            Manage documents already attached to this project.
                          </p>
                        </div>

                        <ProjectDocuments
                          projectId={
                            editingProjectId
                          }
                          currentUser={
                            currentUser
                          }
                        />
                      </div>
                    )}
                  </div>

                  {/* FOOTER */}

                  <div className="flex shrink-0 justify-end gap-3 border-t border-slate-100 bg-white px-6 py-4">
                    <button
                      type="button"
                      onClick={
                        closeModal
                      }
                      disabled={
                        saving ||
                        uploadingDocuments
                      }
                      className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={
                        saving ||
                        uploadingDocuments
                      }
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving && (
                        <Loader2
                          size={16}
                          className="animate-spin"
                        />
                      )}

                      {uploadingDocuments ? (
                        <>
                          <Loader2
                            size={16}
                            className="animate-spin"
                          />

                          Uploading...
                        </>
                      ) : saving ? (
                        editingProjectId
                          ? "Updating..."
                          : "Creating..."
                      ) : editingProjectId ? (
                        "Update Project"
                      ) : (
                        "Create Project"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminProjects;