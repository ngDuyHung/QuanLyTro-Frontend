import api from "./api";

const tenantService = {
  getAll: (params) => api.get("/tenants", { params }),

  create: (data) => api.post("/tenants", data),

};

export default tenantService;
