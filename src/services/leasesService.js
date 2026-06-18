import api from "./api";

const leasesService = {
  getAll: (params) => api.get("/leases", { params }),

  getById: (id) => api.get(`/leases/${id}`),

  create: (data) => api.post("/leases", data),

  update: (id, data) => api.put(`/leases/${id}`, data),

  end: (id) => api.patch(`/leases/${id}/end`),

  changeRepresentative: (id, data) =>
    api.patch(`/leases/${id}/representative`, data),

  delete: (id) => api.delete(`/leases/${id}`),
};

export default leasesService;