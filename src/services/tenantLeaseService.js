import api from "./api";

const tenantLeaseService = {
  // Lấy danh sách hợp đồng (người này đứng tên hoặc ở ghép)
  getAll: (params) => api.get("/tenant/leases", { params }),

  // Xem chi tiết 1 hợp đồng
  getById: (id) => api.get(`/tenant/leases/${id}`),

  // Lấy bản HTML của hợp đồng để hiển thị/in ấn
  getPreviewHtml: (id) => api.get(`/tenant/leases/${id}/preview-html`),

  registerCheckout: (id, data) => api.post(`/tenant/leases/${id}/checkout`, data),
};

export default tenantLeaseService;
