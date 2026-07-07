import api from "./api";

const sepayConfigService = {
  // Lấy cấu hình SePay hiện tại (Token đã được mask dạng ••••)
  getConfig: () => api.get("/settings/sepay"),

  // Lưu/Cập nhật cấu hình SePay
  saveConfig: (data) => api.post("/settings/sepay", data),

  // Ngắt kết nối (Xóa sạch cấu hình SePay của user này)
  disconnect: () => api.delete("/settings/sepay"),

  // Gọi API chạy thử kết nối Token lên SePay
  testConnection: () => api.post("/settings/sepay/test"),

  // API lấy nhanh trạng thái để Polling realtime
  checkPaymentStatus: (id) => api.get(`/invoices/${id}/payment-status`),
};

export default sepayConfigService;
