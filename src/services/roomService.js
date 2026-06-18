import api from "./api";

const roomService = {
  getAll: (params) => api.get("/rooms", { params }),
  getByProperty: (propertyId, params) =>
    api.get(`/properties/${propertyId}/rooms`, { params }),

  getActiveLeaseRoomsByProperty: (propertyId, params = {}) =>
    api.get(`/properties/${propertyId}/rooms`, {
      params: {
        ...params,
        status: "occupied",
        has_active_lease: 1,
      },
    }),

  create: (propertyId, data) =>
    api.post(`/properties/${propertyId}/rooms`, data),

  getById: (id) => api.get(`/rooms/${id}`),

  update: (id, data) => api.post(`/rooms/${id}`, data),

  delete: (id) => api.delete(`/rooms/${id}`),

  updateStatus: (id, data) => api.patch(`/rooms/${id}/status`, data),
};

export default roomService;
