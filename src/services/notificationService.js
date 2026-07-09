import api from "./api";

const notificationService = {
  // Lấy danh sách thông báo (có phân trang, search, filter)
  getAll: (params) => api.get("/notifications", { params }),

  // Lấy chi tiết 1 thông báo
  getById: (id) => api.get(`/notifications/${id}`),

  // Tạo thông báo mới
  create: (data) => api.post("/notifications", data),

  // Cập nhật thông báo
  update: (id, data) => api.put(`/notifications/${id}`, data),

  // Xóa thông báo
  delete: (id) => api.delete(`/notifications/${id}`),
};

export default notificationService;