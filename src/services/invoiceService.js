import api from "./api";

const invoiceService = {
  // Lấy danh sách hóa đơn (kèm bộ lọc phân trang)
  getAll: (params) => api.get("/invoices", { params }),

  // Xem chi tiết một hóa đơn (kèm items và allocations)
  getById: (id) => api.get(`/invoices/${id}`),

  // API Tính toán trước số liệu (Gợi ý tiền phòng, điện nước chưa chốt, nợ cũ)
  // params gồm: { lease_id, period_to }
  prepareData: (params) => api.get("/invoices/prepare", { params }),

  // Tạo mới hóa đơn nháp (Gửi lên dữ liệu mảng items dạng JSON)
  create: (data) => api.post("/invoices", data),

  // Cập nhật hóa đơn nháp (Chỉ áp dụng khi trạng thái là draft)
  update: (id, data) => api.put(`/invoices/${id}`, data),

  // Phát hành hóa đơn (Chuyển sang issued, chính thức ghi nhận công nợ)
  issue: (id) => api.post(`/invoices/${id}/issue`),

  // Hủy hóa đơn đã phát hành (Yêu cầu truyền body: { cancel_reason })
  cancel: (id, data) => api.post(`/invoices/${id}/cancel`, data),

  // Xóa cứng hóa đơn (Chỉ áp dụng cho hóa đơn nháp draft)
  delete: (id) => api.delete(`/invoices/${id}`),

  // Thu tiền hóa đơn thủ công (Tiền mặt / Chuyển khoản thủ công)
  // data gồm: { amount, method, transaction_date, note }
  receivePayment: (id, data) =>
    api.post(`/invoices/${id}/receive-payment`, data),

  // Xuất file PDF Hóa đơn (Lưu ý config responseType là blob để nhận file tải về)
  exportPdf: (id) =>
    api.get(`/invoices/${id}/export-pdf`, { responseType: "blob" }),
};

export default invoiceService;
