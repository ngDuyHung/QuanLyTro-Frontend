import api from "./api";

const tenantInvoiceService = {
  // Lấy danh sách hóa đơn của khách thuê (kèm bộ lọc)
  getAll: (params) => api.get("/tenant/invoices", { params }),

  // Xem chi tiết 1 hóa đơn
  getById: (id) => api.get(`/tenant/invoices/${id}`),

  // Lấy thông tin tài khoản ngân hàng & cấu hình QR của chủ trọ để thanh toán
  getPaymentConfig: (id) => api.get(`/tenant/invoices/${id}/payment-config`),

  // Xem trước bản in điện tử HTML (chỉ gọi khi hóa đơn đã paid)
  getPreviewHtml: (id) => api.get(`/tenant/invoices/${id}/preview-html`),
  checkPaymentStatus: (id) => api.get(`/tenant/invoices/${id}/payment-status`),
};

export default tenantInvoiceService;
