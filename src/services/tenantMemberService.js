import api from "./api";

const tenantMemberService = {
  // Lấy danh sách thành viên đang ở
  getAll: () => api.get("/tenant/members"),

  // Thêm mới thành viên
  create: (formData) =>
    api.post("/tenant/members", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // Cập nhật thành viên (Dùng POST kèm _method=PUT trong formData)
  update: (id, formData) =>
    api.post(`/tenant/members/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // Rời phòng / Xóa
  remove: (id) => api.delete(`/tenant/members/${id}`),

  // Gọi AI quét thẻ CCCD
  scanIdCard: (file) => {
    const formData = new FormData();
    formData.append("image", file);
    return api.post("/ocr/scan-id-card", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export default tenantMemberService;
