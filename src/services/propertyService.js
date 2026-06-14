import api from "./api";

const propertyService = {
  getAll: (params) => api.get("/properties", { params }),

  getById: (id) => api.get(`/properties/${id}`),

  create: (data) => api.post("/properties", data),

  update: (id, data) => api.post(`/properties/${id}`, data),

  delete: (id) => api.delete(`/properties/${id}`),
};

export default propertyService;