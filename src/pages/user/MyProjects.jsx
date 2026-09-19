import { useEffect, useState } from "react";

import {
  FolderKanban,
  Loader2,
  AlertCircle,
  Calendar,
  Users,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock3,
  User,
  Flag,
  CircleDot,
  FileText,
  FileSpreadsheet,
  FileImage,
  FileArchive,
  File,
  Download,
  ExternalLink,
  Paperclip,
  Edit3,
  X,
  Save,
} from "lucide-react";

import UserLayout from "./UserLayout";
import { useAuth } from "../../context/AuthContext";

const API_URL = import.meta.env.API_URL;

const SERVER_URL = API_URL.replace(/\/api$/, "");

// =========================================================
// STATUS CONFIG
// =========================================================

const STATUS_CONFIG = {
  planning: {
    label: "Planning",
    className: "border-slate-200 bg-slate-50 text-slate-600",
    icon: Clock3,
  },

  active: {
    label: "Active",
    className: "border-blue-200 bg-blue-50 text-blue-700",
    icon: CircleDot,
  },

  completed: {
    label: "Completed",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: CheckCircle2,
  },

  "on-hold": {
    label: "On Hold",
    className:
      "border-amber-200 bg-amber-50 text-amber-700",
    icon: Clock3,
  },
};

// =========================================================
// PRIORITY CONFIG
// =========================================================

const PRIORITY_CONFIG = {
  low: {
    label: "Low",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
  },

  medium: {
    label: "Medium",
    className:
      "border-amber-200 bg-amber-50 text-amber-700",
  },

  high: {
    label: "High",
    className:
      "border-red-200 bg-red-50 text-red-700",
  },
};

// =========================================================
// DATE FORMAT
// =========================================================

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

// =========================================================
// DATE INPUT FORMAT
// =========================================================

const formatDateForInput = (date) => {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  const year = parsedDate.getFullYear();
  const month = String(
    parsedDate.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    parsedDate.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// =========================================================
// FILE SIZE
// =========================================================

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

// =========================================================
// FILE ICON
// =========================================================

const getFileIcon = (fileName) => {
  const extension = fileName
    ?.substring(
      fileName.lastIndexOf(".")
    )
    .toLowerCase();

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
    [
      ".xls",
      ".xlsx",
      ".csv",
    ].includes(extension)
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
// DOCUMENT URL
// =========================================================

const getDocumentUrl = (document) => {
  if (!document) return "#";

  const fileUrl =
    document.fileUrl ||
    document.url ||
    "";

  if (!fileUrl) {
    return "#";
  }

  if (
    fileUrl.startsWith("http://") ||
    fileUrl.startsWith("https://")
  ) {
    return fileUrl;
  }

  return `${SERVER_URL}${
    fileUrl.startsWith("/")
      ? ""
      : "/"
  }${fileUrl}`;
};

// =========================================================
// STATUS BADGE
// =========================================================

const StatusBadge = ({ status }) => {
  const config =
    STATUS_CONFIG[status] ||
    STATUS_CONFIG.planning;

  const Icon = config.icon;

  return (
    <span
      className={`
        inline-flex
        items-center
        gap-1.5
        rounded-lg
        border
        px-2.5
        py-1
        text-xs
        font-medium
        ${config.className}
      `}
    >
      <Icon size={13} />

      {config.label}
    </span>
  );
};

// =========================================================
// PRIORITY BADGE
// =========================================================

const PriorityBadge = ({ priority }) => {
  const config =
    PRIORITY_CONFIG[priority] || {
      label: priority || "Not set",
      className:
        "border-slate-200 bg-slate-50 text-slate-600",
    };

  return (
    <span
      className={`
        inline-flex
        items-center
        gap-1.5
        rounded-lg
        border
        px-2.5
        py-1
        text-xs
        font-medium
        ${config.className}
      `}
    >
      <Flag size={12} />

      {config.label}
    </span>
  );
};

// =========================================================
// INFO ITEM
// =========================================================

const InfoItem = ({
  icon: Icon,
  label,
  value,
}) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          <Icon size={15} />
        </div>

        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>
      </div>

      <p className="mt-3 text-sm font-semibold text-slate-800">
        {value || "Not set"}
      </p>
    </div>
  );
};

// =========================================================
// PROJECT DOCUMENTS
// =========================================================

const ProjectDocuments = ({
  projectId,
  token,
}) => {
  const [documents, setDocuments] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!projectId) {
        setDocuments([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/project-documents/project/${projectId}`,
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
            "Invalid document server response."
          );
        }

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to load project documents."
          );
        }

        setDocuments(
          Array.isArray(
            data.documents
          )
            ? data.documents
            : []
        );
      } catch (err) {
        console.error(
          "Fetch project documents error:",
          err
        );

        setError(
          err.message ||
            "Unable to load documents."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [projectId, token]);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-3">
          <Loader2
            size={18}
            className="animate-spin text-slate-400"
          />

          <p className="text-sm text-slate-400">
            Loading project documents...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle
            size={17}
            className="mt-0.5 shrink-0 text-red-500"
          />

          <div>
            <p className="text-sm font-medium text-red-700">
              Unable to load documents
            </p>

            <p className="mt-1 text-xs text-red-600">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white px-5 py-8 text-center">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
          <Paperclip
            size={19}
            className="text-slate-400"
          />
        </div>

        <p className="text-sm font-medium text-slate-600">
          No documents
        </p>

        <p className="mt-1 text-xs text-slate-400">
          No documents have been uploaded for this project.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paperclip
            size={16}
            className="text-slate-500"
          />

          <p className="text-sm font-semibold text-slate-800">
            Project Documents
          </p>
        </div>

        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
          {documents.length}{" "}
          {documents.length === 1
            ? "file"
            : "files"}
        </span>
      </div>

      <div className="space-y-2">
        {documents.map((document) => {
          const FileIcon =
            getFileIcon(
              document.originalName ||
                document.fileName ||
                ""
            );

          const documentUrl =
            getDocumentUrl(
              document
            );

          const fileName =
            document.originalName ||
            document.fileName ||
            "Document";

          return (
            <div
              key={
                document._id ||
                document.id ||
                fileName
              }
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 transition hover:bg-slate-100"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                <FileIcon
                  size={18}
                  className="text-slate-500"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-sm font-medium text-slate-700"
                  title={fileName}
                >
                  {fileName}
                </p>

                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                  <span>
                    {formatFileSize(
                      document.size
                    )}
                  </span>

                  {document.uploadedByName && (
                    <>
                      <span>•</span>

                      <span>
                        Uploaded by{" "}
                        {
                          document.uploadedByName
                        }
                      </span>
                    </>
                  )}

                  {document.createdAt && (
                    <>
                      <span>•</span>

                      <span>
                        {formatDate(
                          document.createdAt
                        )}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <a
                  href={documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white hover:text-slate-700"
                  title="Open document"
                >
                  <ExternalLink
                    size={15}
                  />
                </a>

                <a
                  href={documentUrl}
                  download={
                    document.originalName ||
                    document.fileName
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white hover:text-slate-700"
                  title="Download document"
                >
                  <Download
                    size={15}
                  />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// =========================================================
// EDIT PROJECT MODAL
// =========================================================

const EditProjectModal = ({
  project,
  token,
  onClose,
  onUpdated,
}) => {
  const [formData, setFormData] =
    useState({
      name: project?.name || "",
      description:
        project?.description || "",
      status:
        project?.status || "planning",
      priority:
        project?.priority || "medium",
      startDate:
        formatDateForInput(
          project?.startDate
        ),
      dueDate:
        formatDateForInput(
          project?.dueDate
        ),
    });

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const handleChange = (event) => {
    const { name, value } =
      event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.name.trim()) {
      setError(
        "Project name is required."
      );
      return;
    }

    if (
      formData.startDate &&
      formData.dueDate &&
      formData.dueDate <
        formData.startDate
    ) {
      setError(
        "Due date cannot be before start date."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `${API_URL}/projects/${project._id}`,
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
            name: formData.name.trim(),
            description:
              formData.description.trim(),
            status: formData.status,
            priority: formData.priority,
            startDate:
              formData.startDate ||
              null,
            dueDate:
              formData.dueDate ||
              null,
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
          "Invalid server response."
        );
      }

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update project."
        );
      }

      if (!data.project) {
        throw new Error(
          "Project was updated but the server did not return project data."
        );
      }

      onUpdated(data.project);
    } catch (err) {
      console.error(
        "Update project error:",
        err
      );

      setError(
        err.message ||
          "Unable to update project."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          if (!saving) {
            onClose();
          }
        }
      }}
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Header */}

        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Project
            </p>

            <h3 className="mt-1 text-lg font-semibold text-slate-900">
              Edit Project
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close"
          >
            <X size={19} />
          </button>
        </div>

        {/* Form */}

        <form
          onSubmit={handleSubmit}
          className="p-5"
        >
          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0 text-red-500"
              />

              <div>
                <p className="text-sm font-medium text-red-700">
                  Unable to update project
                </p>

                <p className="mt-1 text-xs text-red-600">
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* Project Name */}

          <div className="mb-5">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Project Name
            </label>

            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={saving}
              placeholder="Enter project name"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50"
            />
          </div>

          {/* Description */}

          <div className="mb-5">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Description
            </label>

            <textarea
              name="description"
              value={
                formData.description
              }
              onChange={handleChange}
              disabled={saving}
              rows={5}
              placeholder="Describe the project..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50"
            />
          </div>

          {/* Status + Priority */}

          <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </label>

              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled={saving}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50"
              >
                <option value="planning">
                  Planning
                </option>

                <option value="active">
                  Active
                </option>

                <option value="completed">
                  Completed
                </option>

                <option value="on-hold">
                  On Hold
                </option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Priority
              </label>

              <select
                name="priority"
                value={
                  formData.priority
                }
                onChange={handleChange}
                disabled={saving}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50"
              >
                <option value="low">
                  Low
                </option>

                <option value="medium">
                  Medium
                </option>

                <option value="high">
                  High
                </option>
              </select>
            </div>
          </div>

          {/* Dates */}

          <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Start Date
              </label>

              <input
                type="date"
                name="startDate"
                value={
                  formData.startDate
                }
                onChange={handleChange}
                disabled={saving}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Due Date
              </label>

              <input
                type="date"
                name="dueDate"
                value={
                  formData.dueDate
                }
                min={
                  formData.startDate ||
                  undefined
                }
                onChange={handleChange}
                disabled={saving}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50"
              />
            </div>
          </div>

          {/* Member information */}

          <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-start gap-3">
              <Users
                size={17}
                className="mt-0.5 shrink-0 text-slate-400"
              />

              <div>
                <p className="text-xs font-semibold text-slate-700">
                  Assigned members
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Project members are managed by the administrator and cannot be changed from your account.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X size={16} />
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />

                  Updating...
                </>
              ) : (
                <>
                  <Save size={16} />

                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =========================================================
// PROJECT DETAILS
// =========================================================

const ProjectDetails = ({
  project,
  onClose,
  token,
  onEdit,
}) => {
  const memberDetails =
    Array.isArray(
      project.memberDetails
    )
      ? project.memberDetails
      : [];

  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
      {/* Details Header */}

      <div className="flex flex-col gap-3 border-b border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Project Details
          </p>

          <h5 className="mt-1 text-base font-semibold text-slate-900">
            {project.name}
          </h5>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Edit */}

          <button
            type="button"
            onClick={onEdit}
            className="
              inline-flex
              items-center
              justify-center
              gap-1.5
              rounded-lg
              border
              border-slate-200
              bg-slate-900
              px-3
              py-2
              text-xs
              font-medium
              text-white
              transition
              hover:bg-slate-800
            "
          >
            <Edit3 size={14} />
            Edit Project
          </button>

          {/* Close */}

          <button
            type="button"
            onClick={onClose}
            className="
              inline-flex
              items-center
              justify-center
              gap-1.5
              rounded-lg
              border
              border-slate-200
              bg-white
              px-3
              py-2
              text-xs
              font-medium
              text-slate-600
              transition
              hover:bg-slate-100
            "
          >
            <ChevronUp size={14} />
            Close Details
          </button>
        </div>
      </div>

      {/* Details Content */}

      <div className="space-y-5 p-5">
        {/* Description */}

        <section>
          <div className="mb-2 flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-slate-900" />

            <h6 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Description
            </h6>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {project.description ||
                "No description has been provided for this project."}
            </p>
          </div>
        </section>

        {/* Project Information */}

        <section>
          <div className="mb-3 flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-slate-900" />

            <h6 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Project Information
            </h6>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <InfoItem
              icon={CircleDot}
              label="Status"
              value={
                STATUS_CONFIG[
                  project.status
                ]?.label ||
                project.status ||
                "Not set"
              }
            />

            <InfoItem
              icon={Flag}
              label="Priority"
              value={
                PRIORITY_CONFIG[
                  project.priority
                ]?.label ||
                project.priority ||
                "Not set"
              }
            />

            <InfoItem
              icon={Calendar}
              label="Start Date"
              value={formatDate(
                project.startDate
              )}
            />

            <InfoItem
              icon={Calendar}
              label="Due Date"
              value={formatDate(
                project.dueDate
              )}
            />
          </div>
        </section>

        {/* TEAM MEMBERS */}

        <section>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-slate-900" />

              <h6 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Assigned Members
              </h6>
            </div>

            <span className="rounded-lg bg-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600">
              {memberDetails.length}{" "}
              {memberDetails.length ===
              1
                ? "member"
                : "members"}
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            {memberDetails.length >
            0 ? (
              <div className="flex flex-wrap gap-3">
                {memberDetails.map(
                  (member) => {
                    const memberName =
                      member.name ||
                      "Unknown User";

                    const initial =
                      memberName
                        .charAt(0)
                        .toUpperCase();

                    return (
                      <div
                        key={
                          member._id
                        }
                        className="
                          inline-flex
                          items-center
                          gap-3
                          rounded-xl
                          border
                          border-slate-200
                          bg-slate-50
                          px-3
                          py-2.5
                        "
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                          {initial}
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800">
                            {memberName}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-400">
                            {member.jobRole ||
                              "Team Member"}
                          </p>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 py-3">
                <Users
                  size={18}
                  className="text-slate-400"
                />

                <p className="text-sm text-slate-400">
                  No members assigned to
                  this project.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* PROJECT DOCUMENTS */}

        <section>
          <div className="mb-3 flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-slate-900" />

            <h6 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Project Documents
            </h6>
          </div>

          <ProjectDocuments
            projectId={project._id}
            token={token}
          />
        </section>

        {/* Created Information */}

        <section>
          <div className="mb-3 flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-slate-900" />

            <h6 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Created Information
            </h6>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InfoItem
              icon={User}
              label="Created By"
              value={
                project.createdByName ||
                project.createdBy ||
                "Not available"
              }
            />

            <InfoItem
              icon={Calendar}
              label="Created On"
              value={formatDate(
                project.createdAt
              )}
            />
          </div>
        </section>
      </div>
    </div>
  );
};

// =========================================================
// PROJECT CARD
// =========================================================

const ProjectCard = ({
  project,
  expanded,
  onToggle,
  token,
  onEdit,
}) => {
  return (
    <li
      id={`project-${project._id}`}
      className={`
        p-5
        transition
        ${
          expanded
            ? "bg-slate-50/50"
            : "hover:bg-slate-50/60"
        }
      `}
    >
      {/* Clickable Project Header */}

      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {/* Left */}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
                <FolderKanban size={17} />
              </div>

              <div className="min-w-0">
                <h4 className="truncate text-sm font-semibold text-slate-900">
                  {project.name}
                </h4>

                <p className="mt-0.5 text-xs text-slate-400">
                  Click to{" "}
                  {expanded
                    ? "collapse"
                    : "view details"}
                </p>
              </div>
            </div>

            {project.description && (
              <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500 sm:ml-11">
                {project.description}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2 sm:ml-11">
              {project.priority && (
                <PriorityBadge
                  priority={
                    project.priority
                  }
                />
              )}

              {project.dueDate && (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-500">
                  <Calendar size={12} />

                  Due{" "}
                  {formatDate(
                    project.dueDate
                  )}
                </span>
              )}

              {Array.isArray(
                project.memberDetails
              ) &&
                project.memberDetails
                  .length > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-500">
                    <Users size={12} />

                    {
                      project
                        .memberDetails
                        .length
                    }{" "}
                    {project
                      .memberDetails
                      .length === 1
                      ? "member"
                      : "members"}
                  </span>
                )}
            </div>
          </div>

          {/* Right */}

          <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
            {project.status && (
              <StatusBadge
                status={
                  project.status
                }
              />
            )}

            <div
              className={`
                flex h-8 w-8 items-center justify-center rounded-lg
                border border-slate-200 bg-white
                text-slate-400
                transition
                ${
                  expanded
                    ? "bg-slate-900 text-white"
                    : "hover:bg-slate-100"
                }
              `}
            >
              {expanded ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </div>
          </div>
        </div>
      </button>

      {/* Expanded Details */}

      {expanded && (
        <ProjectDetails
          project={project}
          onClose={onToggle}
          token={token}
          onEdit={() =>
            onEdit(project)
          }
        />
      )}
    </li>
  );
};

// =========================================================
// MAIN
// =========================================================

const MyProjects = () => {
  const {
    user,
    token,
    authLoading,
  } = useAuth();

  const [projects, setProjects] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    expandedProjectId,
    setExpandedProjectId,
  ] = useState(null);

  const [
    editingProject,
    setEditingProject,
  ] = useState(null);

  const [
    updateSuccess,
    setUpdateSuccess,
  ] = useState("");

  // =======================================================
  // LOAD PROJECTS
  // =======================================================

  const loadProjects = async () => {
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

      const response =
        await fetch(
          `${API_URL}/projects/user/${userId}`,
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
          "Invalid project server response."
        );
      }

      const data =
        await response.json();

      if (
        !response.ok ||
        data.success === false
      ) {
        throw new Error(
          data.message ||
            "Failed to load projects"
        );
      }

      setProjects(
        data.projects || []
      );
    } catch (err) {
      console.error(
        "Load projects error:",
        err
      );

      setError(
        err.message ||
          "Unable to load projects"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadProjects();
    }
  }, [
    authLoading,
    user?._id,
    user?.id,
    user?.uid,
    token,
  ]);

  // =======================================================
  // PROJECT UPDATED
  // =======================================================

  const handleProjectUpdated = (
    updatedProject
  ) => {
    setProjects((current) =>
      current.map((project) =>
        String(project._id) ===
        String(updatedProject._id)
          ? {
              ...project,
              ...updatedProject,
            }
          : project
      )
    );

    setEditingProject(null);

    setUpdateSuccess(
      "Project updated successfully."
    );

    setTimeout(() => {
      setUpdateSuccess("");
    }, 3000);
  };

  // =======================================================
  // OPEN PROJECT FROM QUERY PARAM
  // =======================================================

  useEffect(() => {
    if (!projects.length) return;

    const params =
      new URLSearchParams(
        window.location.search
      );

    const projectId =
      params.get("project");

    if (!projectId) return;

    const projectExists =
      projects.some(
        (project) =>
          String(project._id) ===
          String(projectId)
      );

    if (projectExists) {
      setExpandedProjectId(
        projectId
      );

      setTimeout(() => {
        const element =
          document.getElementById(
            `project-${projectId}`
          );

        element?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 150);
    }
  }, [projects]);

  // =======================================================
  // TOGGLE PROJECT
  // =======================================================

  const handleProjectClick = (
    projectId
  ) => {
    setExpandedProjectId(
      (currentId) =>
        currentId === projectId
          ? null
          : projectId
    );
  };

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <>
      <UserLayout
        title="My Projects"
        subtitle="Projects assigned to you"
      >
        <div className="mx-auto max-w-7xl">
          {/* SUCCESS MESSAGE */}

          {updateSuccess && (
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CheckCircle2
                size={18}
              />

              <span>
                {updateSuccess}
              </span>
            </div>
          )}

          {/* PAGE HEADER */}

          <div className="mb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
                    <FolderKanban size={18} />
                  </div>

                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Workspace
                  </span>
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  My Projects
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  View and manage the projects assigned
                  to you.
                </p>
              </div>

              {!loading &&
                !error && (
                  <div className="flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5">
                    <FolderKanban
                      size={16}
                      className="text-slate-400"
                    />

                    <span className="text-sm font-semibold text-slate-800">
                      {projects.length}
                    </span>

                    <span className="text-xs text-slate-400">
                      {projects.length ===
                      1
                        ? "Project"
                        : "Projects"}
                    </span>
                  </div>
                )}
            </div>
          </div>

          {/* ERROR */}

          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0"
              />

              <div>
                <p className="font-medium">
                  Unable to load projects
                </p>

                <p className="mt-0.5 text-xs text-red-600">
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* MAIN CARD */}

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* CARD HEADER */}

            <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">
                  Assigned Projects
                </h3>

                <p className="mt-1 text-xs text-slate-400">
                  Click a project to view complete
                  details, documents and edit options.
                </p>
              </div>

              {projects.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />

                  Your assigned projects
                </div>
              )}
            </div>

            {/* LOADING */}

            {loading || authLoading ? (
              <div className="flex min-h-[350px] items-center justify-center">
                <div className="flex flex-col items-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                    <Loader2
                      size={22}
                      className="animate-spin text-slate-500"
                    />
                  </div>

                  <p className="text-sm font-medium text-slate-600">
                    Loading projects...
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Please wait
                  </p>
                </div>
              </div>
            ) : !user ? (
              <div className="flex min-h-[350px] flex-col items-center justify-center px-5 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                  <AlertCircle
                    size={26}
                    className="text-slate-400"
                  />
                </div>

                <h4 className="font-medium text-slate-800">
                  Not logged in
                </h4>

                <p className="mt-1 text-sm text-slate-400">
                  Please log in to view your projects.
                </p>
              </div>
            ) : projects.length ===
              0 ? (
              <div className="flex min-h-[350px] flex-col items-center justify-center px-5 text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                  <FolderKanban
                    size={28}
                    className="text-slate-400"
                  />
                </div>

                <h4 className="font-semibold text-slate-800">
                  No projects assigned
                </h4>

                <p className="mt-1 max-w-sm text-sm leading-6 text-slate-400">
                  Projects assigned to you by an
                  administrator will appear here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {projects.map(
                  (project) => (
                    <ProjectCard
                      key={
                        project._id
                      }
                      project={project}
                      expanded={
                        expandedProjectId ===
                        project._id
                      }
                      onToggle={() =>
                        handleProjectClick(
                          project._id
                        )
                      }
                      token={token}
                      onEdit={
                        setEditingProject
                      }
                    />
                  )
                )}
              </ul>
            )}
          </div>
        </div>
      </UserLayout>

      {/* ===================================================
          EDIT PROJECT MODAL
      =================================================== */}

      {editingProject && (
        <EditProjectModal
          project={editingProject}
          token={token}
          onClose={() =>
            setEditingProject(null)
          }
          onUpdated={
            handleProjectUpdated
          }
        />
      )}
    </>
  );
};

export default MyProjects;