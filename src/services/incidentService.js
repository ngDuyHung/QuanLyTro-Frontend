import api from "./api";

const incidentService = {
  // Lấy danh sách sự cố (kèm bộ lọc phân trang)
  getAll: (params) => api.get("/incidents", { params }),

  // Xem chi tiết sự cố
  getById: (id) => api.get(`/incidents/${id}`),

  // Tạo mới sự cố (Gửi FormData vì có kèm ảnh)
  create: (data) => api.post("/incidents", data),

  // Cập nhật thông tin nhẹ
  update: (id, data) => api.put(`/incidents/${id}`, data),

  // Chuyển trạng thái sang "Đang xử lý"
  process: (id) => api.patch(`/incidents/${id}/process`),

  // Chốt sự cố (Gửi FormData vì có khoản tiền và ảnh nghiệm thu)
  resolve: (id, data) => api.post(`/incidents/${id}/resolve`, data),

  // Hủy sự cố
  cancel: (id) => api.patch(`/incidents/${id}/cancel`),

  // Xóa cứng sự cố (Chỉ cho phép khi ở trạng thái pending)
  delete: (id) => api.delete(`/incidents/${id}`),
};

export default incidentService;
