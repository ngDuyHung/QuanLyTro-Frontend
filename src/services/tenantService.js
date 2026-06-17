import api from "./api";

const tenantService = {
  getAll: (params) => api.get("/tenants", { params }),

  getById: (id) => api.get(`/tenants/${id}`),

  create: (data) => api.post("/tenants", data),

  update: (id, data) => api.post(`/tenants/${id}`, data),

  delete: (id) => api.delete(`/tenants/${id}`),

  leave: (id, data) => api.patch(`/tenants/${id}/leave`, data),
};

export default tenantService;