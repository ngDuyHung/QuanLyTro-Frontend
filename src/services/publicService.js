import api from "./api";

const publicService = {
  // Gọi API lấy danh sách phòng công khai
  getRooms: (params) =>
    api.get("/public/rooms", { params, hideErrorToast: true }),

  // Lấy chi tiết 1 phòng (Dự phòng cho trang Chi tiết sau này)
  getRoomDetail: (id) =>
    api.get(`/public/rooms/${id}`, { hideErrorToast: true }),
};

export default publicService;
