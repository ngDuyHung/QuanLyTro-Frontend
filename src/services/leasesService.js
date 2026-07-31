import api from "./api";

const leasesService = {
  getAll: (params) => api.get("/leases", { params }),

  getById: (id) => api.get(`/leases/${id}`),

  create: (data) => api.post("/leases", data),

  update: (id, data) => api.put(`/leases/${id}`, data),

  end: (id, data) => api.patch(`/leases/${id}/end`, data),

  changeRepresentative: (id, data) =>
    api.patch(`/leases/${id}/representative`, data),

  delete: (id) => api.delete(`/leases/${id}`),

  getPreviewHtml: (id) => api.get(`/leases/${id}/preview`),
  exportPdf: (id) =>
    api.get(`/leases/${id}/export-pdf`, { responseType: "blob" }),
};

export default leasesService;
