import axios from "axios";

const rawUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:6600";
const cleanRoot = rawUrl.replace(/\/+$/, "");
export const API_BASE_URL = cleanRoot.endsWith("/api") ? `${cleanRoot}/` : `${cleanRoot}/api/`;

const axiosInstance = axios.create();

axiosInstance.defaults.baseURL = API_BASE_URL;

export default axiosInstance;
