import axios from 'axios';
import { toast } from 'react-toastify';
import useAuthStore from '../stores/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Accept': 'application/json',

  },
});

// 1. TỰ ĐỘNG GẮN TOKEN VÀO MỌI REQUEST
api.interceptors.request.use((config) => {
  // Lấy thẳng token từ Zustand Store (rất tiện, không cần query localStorage)
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

let isAlerting401 = false;

// 2. TỰ ĐỘNG BẮT LỖI TỪ LARAVEL TRẢ VỀ
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Bỏ qua nếu lúc gọi API dev tự truyền option hideErrorToast
    if (error.config?.hideErrorToast) return Promise.reject(error);

    if (error.response) {
      const { status, data } = error.response;
      
      if (status === 422) {
        // Validation từ FormRequest của Laravel
        const firstError = Object.values(data.errors || {})[0]?.[0];
        toast.warning(firstError || data.message || "Dữ liệu không hợp lệ!");
      } 
      else if (status === 401) {
        // Hết hạn Token hoặc chưa đăng nhập
        if (!isAlerting401) {
          isAlerting401 = true;
          toast.error("Phiên đăng nhập hết hạn!", { autoClose: 1500 });
            
          // Xóa data trong Zustand
          useAuthStore.getState().clearAuth(); 
          
          setTimeout(() => {
            isAlerting401 = false; // Fix: Reset lại cờ cho lần sau
            window.location.href = '/login';
          }, 1500);
        }
      } 
      else if (status === 403) {
        toast.error("Bạn không có quyền thực hiện hành động này!");
      } 
      else {
        toast.error(data.message || "Lỗi máy chủ!");
      }
    } else {
      toast.error("Không thể kết nối tới máy chủ API!");
    }

    return Promise.reject(error);
  }
);

export default api;