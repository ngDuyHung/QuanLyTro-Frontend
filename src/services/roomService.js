import api from "./api";

const roomService = {
  getByProperty: (propertyId, params) =>
    api.get(`/properties/${propertyId}/rooms`, { params }),

  create: (propertyId, data) =>
    api.post(`/properties/${propertyId}/rooms`, data),

  getById: (id) => api.get(`/rooms/${id}`),

  update: (id, data) => api.put(`/rooms/${id}`, data),

  delete: (id) => api.delete(`/rooms/${id}`),

  updateStatus: (id, data) => api.patch(`/rooms/${id}/status`, data),
};

export default roomService;