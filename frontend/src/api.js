import axios from "axios";
import { useAuth } from "./context/AuthContext.jsx";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

export const createApiClient = (token) => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
  });

  instance.interceptors.request.use((config) => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return instance;
};

// Optional hook wrapper
export const useApi = () => {
  const { token } = useAuth();
  return createApiClient(token);
};

