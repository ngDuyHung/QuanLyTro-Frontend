import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import authService from "../../services/authService";

// Sức mạnh của Zod: Validate password khớp nhau
const registerSchema = z.object({
  name: z.string().min(2, "Họ tên phải có ít nhất 2 ký tự"),
  email: z.string().min(1, "Vui lòng nhập email").email("Email không đúng định dạng"),
  phone: z.string().regex(/(84|0[3|5|7|8|9])+([0-9]{8})\b/, "Số điện thoại không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
  password_confirmation: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
}).refine((data) => data.password === data.password_confirmation, {
  message: "Mật khẩu xác nhận không khớp!",
  path: ["password_confirmation"],
});

export default function RegisterPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data) => {
    setServerError("");
    try {
      // Gọi API đăng ký
      await authService.register({
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        password_confirmation: data.password_confirmation
      });

      toast.success("Đăng ký thành công! Vui lòng đăng nhập.", { autoClose: 2000 });
      navigate("/login");
    } catch (error) {
      if (error.response?.status === 422) {
        setServerError(error.response.data.message || "Email hoặc số điện thoại đã tồn tại!");
      } else {
        setServerError("Không thể kết nối đến máy chủ.");
      }
    }
  };

  return (
    <div className="w-full max-w-[440px] bg-white p-8 sm:p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 z-10 my-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-heading">Tạo tài khoản mới</h2>
        <p className="mt-2 text-sm">Bắt đầu quản lý nhà trọ hiệu quả</p>
      </div>

      {serverError && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm font-medium rounded-lg border border-red-100 text-center">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Họ và Tên */}
        <div className="space-y-1.5">
          <label className="block font-medium text-heading">Họ và tên</label>
          <input 
            type="text" 
            {...register("name")}
            placeholder="VD: Nguyễn Văn A" 
            className={`w-full px-4 py-2.5 bg-white border rounded-lg text-heading placeholder-gray-400 focus:outline-none focus:ring-2 transition ${errors.name ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-primary/20 focus:border-primary'}`}
          />
          {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
        </div>

        {/* Email & Phone */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block font-medium text-heading">Email</label>
            <input 
              type="text" 
              {...register("email")}
              placeholder="Email" 
              className={`w-full px-4 py-2.5 bg-white border rounded-lg text-heading placeholder-gray-400 focus:outline-none focus:ring-2 transition ${errors.email ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-primary/20 focus:border-primary'}`}
            />
            {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="block font-medium text-heading">Số điện thoại</label>
            <input 
              type="text" 
              {...register("phone")}
              placeholder="SĐT" 
              className={`w-full px-4 py-2.5 bg-white border rounded-lg text-heading placeholder-gray-400 focus:outline-none focus:ring-2 transition ${errors.phone ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-primary/20 focus:border-primary'}`}
            />
            {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}
          </div>
        </div>

        {/* Mật khẩu */}
        <div className="space-y-1.5">
          <label className="block font-medium text-heading">Mật khẩu</label>
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"} 
              {...register("password")}
              placeholder="Tạo mật khẩu" 
              className={`w-full pl-4 pr-11 py-2.5 bg-white border rounded-lg text-heading placeholder-gray-400 focus:outline-none focus:ring-2 transition ${errors.password ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-primary/20 focus:border-primary'}`}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
        </div>

        {/* Xác nhận Mật khẩu */}
        <div className="space-y-1.5">
          <label className="block font-medium text-heading">Xác nhận mật khẩu</label>
          <input 
            type={showPassword ? "text" : "password"} 
            {...register("password_confirmation")}
            placeholder="Nhập lại mật khẩu" 
            className={`w-full px-4 py-2.5 bg-white border rounded-lg text-heading placeholder-gray-400 focus:outline-none focus:ring-2 transition ${errors.password_confirmation ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-primary/20 focus:border-primary'}`}
          />
          {errors.password_confirmation && <p className="text-red-500 text-xs">{errors.password_confirmation.message}</p>}
        </div>

        {/* Submit */}
        <button type="submit" disabled={isSubmitting} className="w-full py-3 px-4 mt-2 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg shadow-sm transition flex justify-center items-center">
          {isSubmitting ? "Đang xử lý..." : "Đăng ký tài khoản"}
        </button>

        <p className="text-center text-sm pt-3">
          Đã có tài khoản? <Link to="/login" className="text-primary hover:text-primary-hover font-semibold">Đăng nhập</Link>
        </p>
      </form>
    </div>
  );
}