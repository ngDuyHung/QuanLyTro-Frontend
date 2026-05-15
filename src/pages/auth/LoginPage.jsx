import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import useAuthStore from "../../stores/authStore";
import authService from "../../services/authService";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Vui lòng nhập email")
    .email("Email không đúng định dạng"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setServerError("");
    try {
      const response = await authService.login(data);
      const token = response.data.access_token;
      const user = response.data.user;

      setAuth(user, token);
      toast.success("Đăng nhập thành công!", { autoClose: 1500 });
      console.log("User Role:", user.role);
      const roleRedirectMap = {
        admin: "/admin/dashboard",
        landlord: "/landlord/dashboard",
        tenant: "/tenant/dashboard",
      };
      navigate(roleRedirectMap[user.role] || "/");
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 422) {
        setServerError(
          error.response.data.message || "Email hoặc mật khẩu không đúng!",
        );
      } else {
        setServerError("Không thể kết nối đến máy chủ.");
      }
    }
  };

  return (
    <div className="w-full max-w-[440px] bg-white p-8 sm:p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 z-10">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-heading">Đăng nhập</h2>
        <p className="mt-2 text-sm">Chào mừng bạn quay trở lại!</p>
      </div>

      {serverError && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm font-medium rounded-lg border border-red-100 text-center">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Email */}
        <div className="space-y-1.5">
          <label className="block font-medium text-heading">
            Email đăng nhập
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <input
              type="text"
              {...register("email")}
              placeholder="Nhập email"
              className={`w-full pl-11 pr-4 py-3 bg-white border rounded-lg text-heading placeholder-gray-400 focus:outline-none focus:ring-2 transition ${errors.email ? "border-red-500 focus:ring-red-200" : "border-gray-200 focus:ring-primary/20 focus:border-primary"}`}
            />
          </div>
          {errors.email && (
            <p className="text-red-500 text-xs">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block font-medium text-heading">Mật khẩu</label>
            <a
              href="#"
              className="text-primary hover:text-primary-hover font-medium"
            >
              Quên mật khẩu?
            </a>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              {...register("password")}
              placeholder="Nhập mật khẩu"
              className={`w-full pl-11 pr-11 py-3 bg-white border rounded-lg text-heading placeholder-gray-400 focus:outline-none focus:ring-2 transition ${errors.password ? "border-red-500 focus:ring-red-200" : "border-gray-200 focus:ring-primary/20 focus:border-primary"}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              </svg>
            </button>
          </div>
          {errors.password && (
            <p className="text-red-500 text-xs">{errors.password.message}</p>
          )}
        </div>

        {/* Checkbox */}
        <div className="flex items-center">
          <input
            id="remember-me"
            type="checkbox"
            className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2 accent-primary cursor-pointer"
          />
          <label
            htmlFor="remember-me"
            className="ml-2 font-medium cursor-pointer select-none"
          >
            Ghi nhớ đăng nhập
          </label>
        </div>

        {/* Nút Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg shadow-sm transition flex justify-center items-center"
        >
          {isSubmitting ? "Đang xử lý..." : "Đăng nhập"}
        </button>

        {/* Nút Google / Facebook (HTML thuần) */}
        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="flex-shrink-0 mx-4 text-gray-400 text-xs">Hoặc</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        <p className="text-center text-sm pt-2">
          Chưa có tài khoản?{" "}
          <Link
            to="/register"
            className="text-primary hover:text-primary-hover font-semibold"
          >
            Đăng ký ngay
          </Link>
        </p>
      </form>
    </div>
  );
}
