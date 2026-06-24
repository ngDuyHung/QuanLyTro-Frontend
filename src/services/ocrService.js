import api from "./api";

const ocrService = {
  // Gửi FormData chứa ảnh lên API scan-id-card
  scanIdCard: (formData) => api.post("/ocr/scan-id-card", formData),
};

export default ocrService;
