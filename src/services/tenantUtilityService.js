import api from "./api";

const tenantUtilityService = {
  // Lấy danh sách lịch sử chốt số của khách
  getAll: (params) => api.get("/tenant/utilities", { params }),

  // Lấy chỉ số cũ gần nhất để hiện ra form cho khách dễ bề nhập liệu
  getCurrentReadings: () => api.get("/tenant/utilities/current-readings"),

  // Xem chi tiết 1 bản ghi
  getById: (id) => api.get(`/tenant/utilities/${id}`),

  // Submit chốt số (Gộp điện & nước + Ảnh)
  submitBatch: (formData) =>
    api.post("/tenant/utilities/submit-batch", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  scanMeter: (formData) =>
    api.post("/ocr/scan-meter", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

export default tenantUtilityService;
