import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import useAuthStore from "../../stores/authStore";
import authService from "../../services/authService";
import {
  generateCodeChallenge,
  generateCodeVerifier,
  generateState,
} from "../../utils/zaloPkce";
const loginSchema = z.object({
  phone: z
    .string()
    .min(1, "Vui lòng nhập số điện thoại")
    .regex(/^(0[0|1|3|5|7|8|9])\d{8}$/, "Số điện thoại không đúng định dạng"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [infoMessage, setInfoMessage] = useState(
    () => sessionStorage.getItem("zalo_link_message") || "",
  );

  const [zaloLinkToken, setZaloLinkToken] = useState(
    () => sessionStorage.getItem("zalo_link_token") || "",
  );
  const [isZaloProcessing, setIsZaloProcessing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const redirectByRole = (user) => {
    const roleRedirectMap = {
      admin: "/admin/dashboard",
      landlord: "/landlord/dashboard",
      tenant: "/tenant/dashboard",
    };

    navigate(roleRedirectMap[user.role] || "/");
  };
  const onSubmit = async (data) => {
    setServerError("");

    try {
      const payload = {
        ...data,
        ...(zaloLinkToken ? { zalo_link_token: zaloLinkToken } : {}),
      };

      console.log("Login payload:", payload);

      const response = await authService.login(payload);

      const token = response.data.access_token;
      const user = response.data.user;

      setAuth(user, token);

      if (response.data.zalo_linked_now || user.zalo_linked) {
        toast.success("Liên kết Zalo và đăng nhập thành công!", {
          autoClose: 1500,
        });

        setZaloLinkToken("");
        setInfoMessage("");
        sessionStorage.removeItem("zalo_link_token");
        sessionStorage.removeItem("zalo_link_message");
      } else {
        toast.success("Đăng nhập thành công!", { autoClose: 1500 });
      }

      sessionStorage.removeItem("zalo_code_verifier");
      sessionStorage.removeItem("zalo_state");

      redirectByRole(user);
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 422) {
        setServerError(
          error.response.data.message ||
            "Số điện thoại hoặc mật khẩu không đúng!",
        );
      } else {
        setServerError("Không thể kết nối đến máy chủ.");
      }
    }
  };

  const handleZaloLogin = async () => {
    try {
      setServerError("");
      setInfoMessage("");
      setIsZaloProcessing(true);

      const appId = import.meta.env.VITE_ZALO_APP_ID;
      const redirectUri =
        import.meta.env.VITE_ZALO_REDIRECT_URI ||
        `${window.location.origin}/login/zalo`;

      if (!appId) {
        throw new Error("Thiếu cấu hình Zalo App ID.");
      }

      if (!window.crypto?.subtle) {
        throw new Error("Trình duyệt không hỗ trợ bảo mật đăng nhập Zalo.");
      }

      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      const state = generateState();

      sessionStorage.setItem("zalo_code_verifier", codeVerifier);
      sessionStorage.setItem("zalo_state", state);

      const params = new URLSearchParams({
        app_id: appId,
        redirect_uri: redirectUri,
        code_challenge: codeChallenge,
        state,
      });

      const zaloUrl = `https://oauth.zaloapp.com/v4/permission?${params.toString()}`;

      setTimeout(() => {
        window.location.href = zaloUrl;
      }, 300);
    } catch (error) {
      console.error("Zalo init error:", error);

      setServerError(
        error?.message
          ? `Không thể khởi tạo đăng nhập Zalo: ${error.message}`
          : "Không thể khởi tạo đăng nhập Zalo.",
      );

      setIsZaloProcessing(false);
    }
  };

  useEffect(() => {
    const handleZaloCallback = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get("code");
      const state = searchParams.get("state");

      if (!code) {
        return;
      }

      const storedState = sessionStorage.getItem("zalo_state");
      const codeVerifier = sessionStorage.getItem("zalo_code_verifier");

      if (!storedState || storedState !== state) {
        setServerError("Phiên đăng nhập Zalo không hợp lệ.");
        navigate("/login", { replace: true });
        return;
      }

      if (!codeVerifier) {
        setServerError("Không tìm thấy mã xác minh Zalo. Vui lòng thử lại.");
        navigate("/login", { replace: true });
        return;
      }

      try {
        setIsZaloProcessing(true);
        setServerError("");
        setInfoMessage("");

        const response = await authService.zaloLogin({
          code,
          code_verifier: codeVerifier,
        });

        if (response.data.requires_link) {
          const message =
            response.data.message ||
            "Tài khoản Zalo chưa được liên kết. Vui lòng đăng nhập bằng số điện thoại và mật khẩu để liên kết lần đầu.";

          sessionStorage.setItem("zalo_link_token", response.data.link_token);
          sessionStorage.setItem("zalo_link_message", message);

          setZaloLinkToken(response.data.link_token);
          setInfoMessage(message);

          navigate("/login", { replace: true });
          return;
        }

        const token = response.data.access_token;
        const user = response.data.user;

        setAuth(user, token);

        sessionStorage.removeItem("zalo_code_verifier");
        sessionStorage.removeItem("zalo_state");

        toast.success("Đăng nhập bằng Zalo thành công!", { autoClose: 1500 });

        redirectByRole(user);
      } catch (error) {
        setServerError(
          error.response?.data?.message ||
            "Không thể đăng nhập bằng Zalo. Vui lòng thử lại.",
        );

        navigate("/login", { replace: true });
      } finally {
        setIsZaloProcessing(false);
      }
    };

    handleZaloCallback();
  }, []);

  return (
    <>
      <div className="w-full bg-white p-6 sm:p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl font-bold text-heading">Đăng nhập</h2>
          <p className="mt-2 text-sm text-gray-500">
            Chào mừng bạn quay trở lại!
          </p>
        </div>

        {serverError && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm font-medium rounded-lg border border-red-100 text-center">
            {serverError}
          </div>
        )}

        {infoMessage && (
          <div className="mb-4 p-3 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg border border-blue-100 text-center">
            {infoMessage}
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 sm:space-y-5"
        >
          {/* Số điện thoại */}
          <div className="space-y-1.5">
            <label className="block font-medium text-heading text-sm sm:text-base">
              Số điện thoại đăng nhập
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
                    d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.896-1.596-5.496-4.196-7.092-7.092l1.293-.97c.362-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                  />
                </svg>
              </div>
              <input
                type="text"
                {...register("phone")}
                placeholder="Nhập số điện thoại"
                className={`w-full pl-11 pr-4 py-2.5 sm:py-3 bg-white border rounded-lg text-heading placeholder-gray-400 focus:outline-none focus:ring-2 transition ${errors.phone ? "border-red-500 focus:ring-red-200" : "border-gray-200 focus:ring-primary/20 focus:border-primary"}`}
              />
            </div>
            {errors.phone && (
              <p className="text-red-500 text-xs">{errors.phone.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block font-medium text-heading text-sm sm:text-base">
                Mật khẩu
              </label>
              <a
                href="#"
                className="text-primary hover:text-primary-hover font-medium text-sm"
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
                className={`w-full pl-11 pr-11 py-2.5 sm:py-3 bg-white border rounded-lg text-heading placeholder-gray-400 focus:outline-none focus:ring-2 transition ${errors.password ? "border-red-500 focus:ring-red-200" : "border-gray-200 focus:ring-primary/20 focus:border-primary"}`}
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
              className="ml-2 font-medium cursor-pointer select-none text-sm sm:text-base"
            >
              Ghi nhớ đăng nhập
            </label>
          </div>

          {/* Nút Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 sm:py-3 px-4 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg shadow-sm transition flex justify-center items-center"
          >
            {isSubmitting
              ? "Đang xử lý..."
              : zaloLinkToken
                ? "Đăng nhập và liên kết Zalo"
                : "Đăng nhập"}
          </button>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-xs">
              Hoặc đăng nhập với
            </span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          {/* Nút Đăng nhập với Zalo */}
          <button
            type="button"
            onClick={handleZaloLogin}
            disabled={isZaloProcessing || isSubmitting}
            aria-busy={isZaloProcessing}
            className="
  group w-full py-2.5 sm:py-2.5 px-4 
  bg-white hover:bg-[#f4f8ff] 
  border border-[#8cbaff] hover:border-[#8cbaff] 
  text-[#1a76ff] font-semibold
  rounded-xl shadow-sm hover:shadow-md
  transition-all duration-200
  flex justify-center items-center gap-2.5
  focus:outline-none focus:ring-2 focus:ring-[#1a76ff]/20 focus:border-[#1a76ff]
  disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:shadow-sm
"
          >
            <span className="w-7 h-7 flex items-center justify-center shrink-0">
              {isZaloProcessing ? (
                <span className="w-5 h-5 border-2 border-[#1a76ff] border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  width="28"
                  height="28"
                  className="transition-transform duration-200 group-hover:scale-105"
                >
                  <path
                    fill="#2962ff"
                    d="M15,36V6.827l-1.211-0.811C8.64,8.083,5,13.112,5,19v10c0,7.732,6.268,14,14,14h10	c4.722,0,8.883-2.348,11.417-5.931V36H15z"
                  />
                  <path
                    fill="#eee"
                    d="M29,5H19c-1.845,0-3.601,0.366-5.214,1.014C10.453,9.25,8,14.528,8,19	c0,6.771,0.936,10.735,3.712,14.607c0.216,0.301,0.357,0.653,0.376,1.022c0.043,0.835-0.129,2.365-1.634,3.742	c-0.162,0.148-0.059,0.419,0.16,0.428c0.942,0.041,2.843-0.014,4.797-0.877c0.557-0.246,1.191-0.203,1.729,0.083	C20.453,39.764,24.333,40,28,40c4.676,0,9.339-1.04,12.417-2.916C42.038,34.799,43,32.014,43,29V19C43,11.268,36.732,5,29,5z"
                  />
                  <path
                    fill="#2962ff"
                    d="M36.75,27C34.683,27,33,25.317,33,23.25s1.683-3.75,3.75-3.75s3.75,1.683,3.75,3.75	S38.817,27,36.75,27z M36.75,21c-1.24,0-2.25,1.01-2.25,2.25s1.01,2.25,2.25,2.25S39,24.49,39,23.25S37.99,21,36.75,21z"
                  />
                  <path
                    fill="#2962ff"
                    d="M31.5,27h-1c-0.276,0-0.5-0.224-0.5-0.5V18h1.5V27z"
                  />
                  <path
                    fill="#2962ff"
                    d="M27,19.75v0.519c-0.629-0.476-1.403-0.769-2.25-0.769c-2.067,0-3.75,1.683-3.75,3.75	S22.683,27,24.75,27c0.847,0,1.621-0.293,2.25-0.769V26.5c0,0.276,0.224,0.5,0.5,0.5h1v-7.25H27z M24.75,25.5	c-1.24,0-2.25-1.01-2.25-2.25S23.51,21,24.75,21S27,22.01,27,23.25S25.99,25.5,24.75,25.5z"
                  />
                  <path
                    fill="#2962ff"
                    d="M21.25,18h-8v1.5h5.321L13,26h0.026c-0.163,0.211-0.276,0.463-0.276,0.75V27h7.5	c0.276,0,0.5-0.224,0.5-0.5v-1h-5.321L21,19h-0.026c0.163-0.211,0.276-0.463,0.276-0.75V18z"
                  />
                </svg>
              )}
            </span>

            <span className="text-sm sm:text-base leading-none">
              {isZaloProcessing
                ? "Đang chuyển sang Zalo..."
                : "Đăng nhập với Zalo"}
            </span>
          </button>

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
    </>
  );
}
