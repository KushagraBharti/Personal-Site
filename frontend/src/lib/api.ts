import axios from "axios";

const baseURL = (() => {
  const url = import.meta.env.VITE_API_BASE_URL ?? "";
  return url.endsWith("/") ? url.slice(0, -1) : url;
})();

export const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error("API error:", error);
    }
    return Promise.reject(error);
  },
);

export const getApiBaseUrl = () => baseURL;
