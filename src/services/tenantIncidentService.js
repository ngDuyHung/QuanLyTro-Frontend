import api from "./api";

const tenantIncidentService = {
    getAll: (params) => api.get("/tenant/incidents", { params }),
    getById: (id) => api.get(`/tenant/incidents/${id}`),
    
    // Gửi Form Data vì có upload nhiều ảnh
    create: (data) => api.post("/tenant/incidents", data, {
        headers: { "Content-Type": "multipart/form-data" }
    }),
    
    // Cập nhật thông tin nhẹ (Title, Desc, Category, Priority) dạng JSON
    update: (id, data) => api.put(`/tenant/incidents/${id}`, data),
    
    // Hủy sự cố
    cancel: (id) => api.patch(`/tenant/incidents/${id}/cancel`),
};

export default tenantIncidentService;