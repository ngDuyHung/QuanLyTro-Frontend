import api from "./api";

const utilityService = {
  getAll: (params) => api.get("/utilities", { params }),

  getById: (id) => api.get(`/utilities/${id}`),

  create: (data) => api.post("/utilities", data),

  // Sử dụng POST vì có thể gửi file ảnh, kèm _method=PUT ở form-data
  update: (id, data) => api.post(`/utilities/${id}`, data),

  delete: (id) => api.delete(`/utilities/${id}`),

  getAnalysis: (params) => api.get("/utilities/analysis", { params }),
};

export default utilityService;