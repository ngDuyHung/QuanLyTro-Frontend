import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      
      // Hàm gọi khi Login thành công
      setAuth: (user, token) => set({ user, token }),
      
      // Hàm gọi khi Đăng xuất hoặc bị lỗi 401
      clearAuth: () => set({ user: null, token: null }),
    }),
    {
      name: 'auth-storage', // Tên key nó sẽ tự lưu trong localStorage trình duyệt
    }
  )
);

export default useAuthStore;