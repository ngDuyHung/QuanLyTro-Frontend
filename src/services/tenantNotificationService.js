import api from "./api";

const tenantNotificationService = {
  getAll: (params) => api.get("/tenant/notifications", { params }),
  getById: (id) => api.get(`/tenant/notifications/${id}`),
};

export default tenantNotificationService;