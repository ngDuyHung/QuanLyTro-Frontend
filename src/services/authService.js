import api from "./api";

const authService = {
  login: (data) => api.post("/auth/login", data, { hideErrorToast: true }),

  register: (data) =>
    api.post("/auth/register", data, { hideErrorToast: true }),

  zaloLogin: (data) =>
    api.post("/auth/zalo/login", data, { hideErrorToast: true }),

  me: () => api.get("/auth/me"),

  logout: () => api.post("/auth/logout"),

  updateProfile: (data) => api.put("/auth/profile", data),
  changePassword: (data) => api.put("/auth/password", data),
};

export default authService;