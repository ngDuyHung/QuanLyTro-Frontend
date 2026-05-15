import api from './api';

const propertyService = {
  // Lấy danh sách (có hỗ trợ phân trang và tìm kiếm)
  getAll: (params) => api.get('/properties', { params }),
  
  // Lấy chi tiết 1 khu nhà
  getById: (id) => api.get(`/properties/${id}`),
  
  // Thêm mới
  create: (data) => api.post('/properties', data),
  
  // Cập nhật
  update: (id, data) => api.put(`/properties/${id}`, data),
  
  // Xóa
  delete: (id) => api.delete(`/properties/${id}`),
};

export default propertyService;