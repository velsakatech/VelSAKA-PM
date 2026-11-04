// src/lib/api.js

const RAW_BASE =
  import.meta.env.VITE_API_URL || "";

const API_BASE_URL = RAW_BASE
  .trim()
  .replace(/\/+$/, "")
  .replace(/\/api$/i, "");

export const apiRequest = async (endpoint, options = {}) => {
  if (!API_BASE_URL) {
    throw new Error(
      "VITE_API_URL is not set. Add it in Vercel → Settings → Environment Variables."
    );
  }

  let clean = `/${String(endpoint).replace(/^\/+/, "")}`;
  clean = clean.replace(/^\/api\/api(?=\/|$)/i, "/api");
  if (!clean.toLowerCase().startsWith("/api/")) {
    clean = `/api${clean}`;
  }

  const url = `${API_BASE_URL}${clean}`;

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
  } catch (networkError) {
    console.error("Network error:", url, networkError);
    throw new Error(
      "Network error — cannot reach the server. Check VITE_API_URL and CORS."
    );
  }

  const text = await response.text();
  const contentType = response.headers.get("content-type") || "";
  let data = {};

  if (text && contentType.includes("application/json")) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Server returned invalid JSON.");
    }
  }

  if (!response.ok) {
    const err = new Error(
      data?.message ||
        data?.error ||
        `Request failed (${response.status})`
    );
    err.status = response.status;
    err.endpoint = url;
    throw err;
  }

  return data;
};