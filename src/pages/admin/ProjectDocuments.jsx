import { useEffect, useRef, useState } from "react";

import {
  FileText,
  FileSpreadsheet,
  FileImage,
  FileArchive,
  File,
  Upload,
  Download,
  Trash2,
  Loader2,
  FolderOpen,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
  "http://localhost:5000/api";

const SERVER_URL = API_URL.replace(/\/api$/, "");

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = [
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

const formatFileSize = (bytes) => {
  if (!bytes) return "0 Bytes";

  const sizes = ["Bytes", "KB", "MB", "GB"];

  const index = Math.floor(
    Math.log(bytes) / Math.log(1024)
  );

  return `${(
    bytes / Math.pow(1024, index)
  ).toFixed(index === 0 ? 0 : 1)} ${sizes[index]}`;
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

const getFileIcon = (mimeType, fileName) => {
  const extension =
    fileName?.split(".").pop()?.toLowerCase() || "";

  if (
    mimeType?.includes("image") ||
    ["jpg", "jpeg", "png", "webp", "gif"].includes(
      extension
    )
  ) {
    return FileImage;
  }

  if (
    mimeType?.includes("spreadsheet") ||
    mimeType?.includes("excel") ||
    ["xls", "xlsx", "csv"].includes(extension)
  ) {
    return FileSpreadsheet;
  }

  if (
    mimeType?.includes("pdf") ||
    extension === "pdf"
  ) {
    return FileText;
  }

  if (
    mimeType?.includes("zip") ||
    extension === "zip"
  ) {
    return FileArchive;
  }

  return File;
};

const ProjectDocuments = ({
  projectId,
  currentUser,
}) => {
  const fileInputRef = useRef(null);

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =====================================================
  // LOAD DOCUMENTS
  // =====================================================

  const loadDocuments = async () => {
    if (!projectId) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/project-documents/project/${projectId}`
      );

      const contentType =
        response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        throw new Error(
          "Documents API returned an invalid response."
        );
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load project documents."
        );
      }

      setDocuments(
        Array.isArray(data.documents)
          ? data.documents
          : []
      );
    } catch (error) {
      console.error(
        "Load project documents error:",
        error
      );

      setError(
        error.message ||
          "Unable to load project documents."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [projectId]);

  // =====================================================
  // UPLOAD DOCUMENT
  // =====================================================

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    setError("");
    setSuccess("");

    if (!projectId) {
      setError("Project ID is missing.");
      return;
    }

    // ---------------------------------------------------
    // SIZE
    // ---------------------------------------------------

    if (file.size > MAX_FILE_SIZE) {
      setError(
        "File size must be 10 MB or less."
      );
      return;
    }

    // ---------------------------------------------------
    // EXTENSION
    // ---------------------------------------------------

    const extension = `.${
      file.name.split(".").pop()?.toLowerCase() || ""
    }`;

    if (!ALLOWED_TYPES.includes(extension)) {
      setError(
        "This file type is not supported."
      );
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();

      formData.append(
        "document",
        file
      );

      const uploadedBy =
        currentUser?._id ||
        currentUser?.id ||
        currentUser?.firebaseUid ||
        "";

      const uploadedByName =
        currentUser?.name ||
        currentUser?.email ||
        "User";

      formData.append(
        "uploadedBy",
        String(uploadedBy)
      );

      formData.append(
        "uploadedByName",
        uploadedByName
      );

      const response = await fetch(
        `${API_URL}/project-documents/project/${projectId}`,
        {
          method: "POST",
          body: formData,
        }
      );

      const contentType =
        response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        throw new Error(
          "Server returned an invalid response."
        );
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to upload document."
        );
      }

      if (data.document) {
        setDocuments((previous) => [
          data.document,
          ...previous,
        ]);
      } else {
        await loadDocuments();
      }

      setSuccess(
        "Document uploaded successfully."
      );

      setTimeout(() => {
        setSuccess("");
      }, 2500);
    } catch (error) {
      console.error(
        "Upload document error:",
        error
      );

      setError(
        error.message ||
          "Failed to upload document."
      );
    } finally {
      setUploading(false);
    }
  };

  // =====================================================
  // DELETE DOCUMENT
  // =====================================================

  const handleDelete = async (document) => {
    const confirmed = window.confirm(
      `Delete "${document.originalName}"?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(document._id);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/project-documents/${document._id}`,
        {
          method: "DELETE",
        }
      );

      const contentType =
        response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        throw new Error(
          "Server returned an invalid response."
        );
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to delete document."
        );
      }

      setDocuments((previous) =>
        previous.filter(
          (item) =>
            item._id !== document._id
        )
      );

      setSuccess(
        "Document deleted successfully."
      );

      setTimeout(() => {
        setSuccess("");
      }, 2500);
    } catch (error) {
      console.error(
        "Delete document error:",
        error
      );

      setError(
        error.message ||
          "Failed to delete document."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // =====================================================
  // DOCUMENT URL
  // =====================================================

  const getDocumentUrl = (document) => {
    if (!document?.fileUrl) {
      return "";
    }

    if (
      document.fileUrl.startsWith("http://") ||
      document.fileUrl.startsWith("https://")
    ) {
      return document.fileUrl;
    }

    return `${SERVER_URL}${document.fileUrl}`;
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div>
      {/* HEADER */}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FolderOpen
              size={17}
              className="text-slate-500"
            />

            <h3 className="text-sm font-semibold text-slate-800">
              Project Documents
            </h3>

            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
              {documents.length}
            </span>
          </div>

          <p className="mt-1 text-xs text-slate-400">
            Upload project files, documents and
            reference materials.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            fileInputRef.current?.click()
          }
          disabled={
            uploading || !projectId
          }
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? (
            <Loader2
              size={15}
              className="animate-spin"
            />
          ) : (
            <Upload size={15} />
          )}

          {uploading
            ? "Uploading..."
            : "Upload Document"}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={ALLOWED_TYPES.join(",")}
          onChange={handleFileChange}
          disabled={uploading}
        />
      </div>

      {/* INFO */}

      <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
        <p className="text-[11px] leading-5 text-slate-500">
          Supported: PDF, Word, Excel, PowerPoint,
          TXT, CSV, images and ZIP.
          Maximum file size:{" "}
          <strong>10 MB</strong>.
        </p>
      </div>

      {/* SUCCESS */}

      {success && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-xs text-emerald-700">
          <CheckCircle2
            size={15}
            className="shrink-0"
          />

          <span>{success}</span>
        </div>
      )}

      {/* ERROR */}

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-xs text-red-700">
          <AlertCircle
            size={15}
            className="mt-0.5 shrink-0"
          />

          <span>{error}</span>
        </div>
      )}

      {/* LOADING */}

      {loading ? (
        <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white py-10">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Loader2
              size={17}
              className="animate-spin"
            />

            Loading documents...
          </div>
        </div>
      ) : documents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm">
            <FolderOpen
              size={20}
              className="text-slate-400"
            />
          </div>

          <p className="text-sm font-medium text-slate-600">
            No documents yet
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Upload the first document for this
            project.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((document) => {
            const Icon = getFileIcon(
              document.mimeType,
              document.originalName
            );

            const documentUrl =
              getDocumentUrl(document);

            return (
              <div
                key={document._id}
                className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-slate-300 sm:flex-row sm:items-center"
              >
                {/* ICON */}

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                  <Icon
                    size={19}
                    className="text-slate-500"
                  />
                </div>

                {/* INFO */}

                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-sm font-medium text-slate-700"
                    title={
                      document.originalName
                    }
                  >
                    {document.originalName}
                  </p>

                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-400">
                    <span>
                      {formatFileSize(
                        document.size
                      )}
                    </span>

                    <span>•</span>

                    <span>
                      {formatDate(
                        document.createdAt
                      )}
                    </span>

                    {document.uploadedByName && (
                      <>
                        <span>•</span>

                        <span>
                          {
                            document.uploadedByName
                          }
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* ACTIONS */}

                <div className="flex shrink-0 items-center gap-1">
                  {documentUrl && (
                    <a
                      href={documentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-800"
                      title="Open document"
                    >
                      <Download size={16} />
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      handleDelete(document)
                    }
                    disabled={
                      deletingId ===
                      document._id
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                    title="Delete document"
                  >
                    {deletingId ===
                    document._id ? (
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProjectDocuments;