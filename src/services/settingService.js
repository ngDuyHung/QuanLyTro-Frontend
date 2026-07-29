import api from "./api";

const settingService = {
  // Lấy mẫu hợp đồng
  getContractTemplate: () => api.get("/settings/contract-template"),

  // Lưu mẫu hợp đồng
  saveContractTemplate: (data) => api.post("/settings/contract-template", data),

  // Xuất file PDF (Cần responseType: 'blob' để tải file)
  exportLeasePdf: (leaseId) =>
    api.get(`/leases/${leaseId}/export-pdf`, {
      responseType: "blob",
    }),

  // Lấy mẫu Hóa đơn
  getInvoiceTemplate: () => api.get("/settings/invoice-template"),

  // Lưu mẫu Hóa đơn
  saveInvoiceTemplate: (data) => api.post("/settings/invoice-template", data),

  // Xuất file PDF Sổ kế toán
  exportLedgerPdf: (id) =>
    api.get(`/ledgers/${id}/export-pdf`, { responseType: "blob" }),

  // Lấy trạng thái Bật/Tắt tự động nhắc nhở điện nước
  getAutoRemindSetting: () => api.get("/settings/auto-remind"),

  // Bật/Tắt tự động nhắc nhở điện nước
  toggleAutoRemind: (data) => api.post("/settings/auto-remind", data),

  // Test gửi Push Notification đến thiết bị chủ trọ
  testPushNotification: () => api.post("/settings/test-push"),
};

export default settingService;
