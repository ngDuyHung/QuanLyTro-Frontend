// src/services/importService.js
import api from "./api";

const importService = {
  downloadTemplate: () => {
    return api.get("/imports/master-data/template", {
      responseType: "blob",
      hideErrorToast: true, // Chặn toast lỗi mặc định
    });
  },

  importMasterData: (file) => {
    const formData = new FormData();
    formData.append("file", file);

    return api.post("/imports/master-data", formData, {
      hideErrorToast: true, // Chặn toast lỗi mặc định để tự vẽ UI báo lỗi
    });
  },
};

export default importService;