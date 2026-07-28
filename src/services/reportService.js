import api from "./api";

const reportService = {
  // 1. Báo cáo tài chính
  getFinancialReport: (params) => api.get("/reports/financial", { params }),

  // 2. Báo cáo sổ quỹ
  getLedgerReport: (params) => api.get("/reports/ledger", { params }),

  // 3. Báo cáo công nợ (Không cần date range)
  getDebtReport: (params) => api.get("/reports/debt", { params }),

  // 4. Báo cáo vận hành
  getOccupancyReport: (params) => api.get("/reports/occupancy", { params }),

  // 5. Xuất Excel sổ quỹ (Quan trọng: responseType = 'blob' để tải file)
  exportLedgerExcel: (params) => 
    api.get("/reports/ledger/export/excel", { 
      params, 
      responseType: 'blob' 
    }),
};

export default reportService;