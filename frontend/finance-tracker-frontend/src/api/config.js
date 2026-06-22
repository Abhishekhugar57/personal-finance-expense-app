/**
 * Resolves API paths for local dev (Vite proxy), Vercel rewrites, or direct Render URL.
 * - Default: relative `/api/...` (works with Vite proxy + Vercel rewrites)
 * - Optional: set VITE_API_URL=https://your-backend.onrender.com for direct backend calls
 */
export function resolveApiPath(path) {
  let normalized = path.startsWith("/") ? path : `/${path}`;
  if (!normalized.startsWith("/api")) {
    normalized = `/api${normalized}`;
  }

  const backendUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, "");
  if (!backendUrl) {
    return normalized;
  }

  return `${backendUrl}${normalized.replace(/^\/api/, "")}`;
}

export const API_BASE_URL = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, "") || "";
