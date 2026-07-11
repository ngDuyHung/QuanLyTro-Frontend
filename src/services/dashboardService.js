import api from "./api";

const dashboardService = {
  // Lấy toàn bộ dữ liệu thống kê cho Dashboard
  getDashboardData: () => api.get("/dashboard"),
};

export default dashboardService;
