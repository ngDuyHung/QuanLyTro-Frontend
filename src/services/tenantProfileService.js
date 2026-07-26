import api from "./api";

const tenantProfileService = {
  getProfile: () => api.get("/tenant/profile"),
};

export default tenantProfileService;