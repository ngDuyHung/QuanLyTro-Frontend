import api from "./api";

const financialTransactionService = {
  // Lấy danh sách phiếu thu chi (params: property_id, direction, category, date_from, date_to...)
  getAll: (params) => api.get("/financial-transactions", { params }),

  // Xem chi tiết một phiếu
  getById: (id) => api.get(`/financial-transactions/${id}`),

  // Tạo mới phiếu thu/chi thủ công
  create: (data) => api.post("/financial-transactions", data),

  // Hủy phiếu (data: { cancel_reason })
  cancel: (id, data) => api.post(`/financial-transactions/${id}/cancel`, data),
};

export default financialTransactionService;