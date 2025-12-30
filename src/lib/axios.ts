import axios, { type AxiosError } from "axios";

/**
 * Base axios instance for API calls
 */
const apiClient = axios.create({
  baseURL: "/api",
  timeout: 30000,
  withCredentials: true, // Equivalent to credentials: 'include'
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Response interceptor for consistent error handling
 */
apiClient.interceptors.response.use(
  (response) => response, // Pass through successful responses
  (error: AxiosError<any>) => {
    const message =
      error.response?.data?.error?.message ||
      error.message ||
      "An unexpected error occurred";

    throw new Error(message);
  }
);

export default apiClient;
