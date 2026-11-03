import axios from "axios";

// In browser production (e.g. Vercel), default to the deployed Render backend if no env var is baked in
const defaultUrl =
  typeof window !== "undefined" &&
  window.location.hostname !== "localhost" &&
  window.location.hostname !== "127.0.0.1"
    ? "https://pastebox-api.onrender.com"
    : "http://localhost:6600";

const rawUrl = import.meta.env.VITE_API_BASE_URL || defaultUrl;
const cleanRoot = rawUrl.replace(/\/+$/, "");
export const API_BASE_URL = cleanRoot.endsWith("/api") ? `${cleanRoot}/` : `${cleanRoot}/api/`;

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

axiosInstance.defaults.baseURL = API_BASE_URL;
axiosInstance.defaults.withCredentials = true;

export default axiosInstance;
