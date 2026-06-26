import api from "./api";

const sepayTransactionService = {
    // Lấy danh sách giao dịch (có phân trang và bộ lọc)
    getAll: (params) => api.get("/sepay-transactions", { params }),

    // Thử xử lý lại (dành cho giao dịch bị lỗi hoặc chờ duyệt)
    retry: (id) => api.post(`/sepay-transactions/${id}/retry`),

    // Ghép nối thủ công vào một hóa đơn
    // data: { invoice_id: 123 }
    match: (id, data) => api.post(`/sepay-transactions/${id}/match`, data),

    // Bỏ qua giao dịch (không liên quan đến tiền trọ)
    // data: { reason: "Giao dịch test" }
    ignore: (id, data) => api.post(`/sepay-transactions/${id}/ignore`, data),
};

export default sepayTransactionService;