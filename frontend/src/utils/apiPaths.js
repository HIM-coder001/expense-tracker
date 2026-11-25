export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const API = {
  AUTH: {
    REGISTER:        "/api/v1/auth/register",
    LOGIN:           "/api/v1/auth/login",
    LOGOUT:          "/api/v1/auth/logout",
    REFRESH:         "/api/v1/auth/refresh",
    GET_USER:        "/api/v1/auth/getUser",
    UPLOAD_IMAGE:    "/api/v1/auth/upload-image",
    PROFILE_IMAGE:   "/api/v1/auth/profile-image",
    FORGOT_PASSWORD: "/api/v1/auth/forgot-password",
    RESET_PASSWORD:  (token) => `/api/v1/auth/reset-password/${token}`,
  },
  INCOME: {
    GET:            "/api/v1/income/get",
    ADD:            "/api/v1/income/add",
    DELETE:         (id) => `/api/v1/income/${id}`,
    DOWNLOAD_EXCEL: "/api/v1/income/downloadexcel",
  },
  EXPENSE: {
    GET:            "/api/v1/expense/get",
    ADD:            "/api/v1/expense/add",
    DELETE:         (id) => `/api/v1/expense/${id}`,
    DOWNLOAD_EXCEL: "/api/v1/expense/downloadexcel",
  },
  DASHBOARD:        "/api/v1/dashboard",
  CATEGORIES:       "/api/v1/categories",
  HEALTH:           "/api/v1/health",
};
