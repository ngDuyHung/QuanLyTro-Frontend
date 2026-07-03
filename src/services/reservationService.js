import api from "./api";

const reservationService = {
  create: (data) => api.post("/room-reservations", data),
  cancel: (reservationId, data) =>
    api.patch(`/room-reservations/${reservationId}/cancel`, data),
  extend: (reservationId, data) =>
    api.patch(`/room-reservations/${reservationId}/extend`, data),
};

export default reservationService;
