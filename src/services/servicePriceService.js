import api from "./api";

const servicePriceService = {
    // Lấy bảng giá áp dụng cho 1 khu cụ thể (Đã merge giá riêng và toàn hệ thống)
    getByProperty: (propertyId, params) => api.get(`/properties/${propertyId}/service-prices`, { params }),

    // Lấy danh sách giá dịch vụ mặc định hệ thống (Global)
    getGlobal: (params) => api.get("/service-prices/global", { params }),

    // Tạo mới một cấu hình giá
    create: (data) => api.post("/service-prices", data),

    // Cập nhật giá dịch vụ (Tự động sinh lịch sử biến động ở backend)
    update: (id, data) => api.put(`/service-prices/${id}`, data),

    // Xóa cấu hình giá dịch vụ
    delete: (id) => api.delete(`/service-prices/${id}`),
};

export default servicePriceService;