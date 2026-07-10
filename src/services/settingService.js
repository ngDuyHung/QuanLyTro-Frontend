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
};

export default settingService;
