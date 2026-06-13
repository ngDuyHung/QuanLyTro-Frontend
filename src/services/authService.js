import api from "./api";

const authService = {
  // Thêm { hideErrorToast: true } để ta tự bắt lỗi sai mật khẩu ở màn Login,
  // không để api.js tự động bắn toast báo chung chung.
  login: (data) => api.post("/auth/login", data, { hideErrorToast: true }),
  register: (data) =>
    api.post("/auth/register", data, { hideErrorToast: true }),
  zaloLogin: (data) =>
    api.post("/auth/zalo/login", data, { hideErrorToast: true }),
  logout: () => api.post("/auth/logout"),
};

export default authService;
