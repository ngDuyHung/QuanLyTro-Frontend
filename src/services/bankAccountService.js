import api from "./api";

const bankAccountService = {
  // Lấy danh sách tài khoản ngân hàng của chủ trọ (kèm chuỗi template sinh QR Code)
  getAll: () => api.get("/bank-accounts"),

  // Mở rộng sau này nếu bạn làm trang Cài đặt Ngân hàng
  getById: (id) => api.get(`/bank-accounts/${id}`),
  create: (data) => api.post("/bank-accounts", data),
  update: (id, data) => api.put(`/bank-accounts/${id}`, data),
  delete: (id) => api.delete(`/bank-accounts/${id}`),
};

export default bankAccountService;