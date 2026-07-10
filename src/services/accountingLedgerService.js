import api from "./api";

const accountingLedgerService = {
  // Lấy danh sách lịch sử chốt sổ
  getAll: (params) => api.get("/accounting-ledgers", { params }),

  // Xem chi tiết một sổ đã chốt (Kèm details)
  getById: (id) => api.get(`/accounting-ledgers/${id}`),

  // Xem trước dữ liệu chốt sổ (Dữ liệu động)
  preview: (data) => api.post("/accounting-ledgers/preview", data),

  // Thực hiện chốt sổ và lưu
  lock: (data) => api.post("/accounting-ledgers", data),

  // Hủy/Xóa sổ đã chốt
  delete: (id) => api.delete(`/accounting-ledgers/${id}`),

  //Xem trước dữ liệu chốt sổ (Dữ liệu HTML)
  getPreviewHtml: (id) => api.get(`/accounting-ledgers/${id}/preview-html`),
};

export default accountingLedgerService;
