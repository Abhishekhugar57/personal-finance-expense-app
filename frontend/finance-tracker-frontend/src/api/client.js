import axios from "axios";
import { resolveApiPath } from "./config";

const api = axios.create({
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (config.url) {
    config.url = resolveApiPath(config.url);
  }
  return config;
});

export default api;
