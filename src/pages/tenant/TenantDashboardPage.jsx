import { useEffect, useState } from "react";
import useAuthStore from "@/stores/authStore";
import tenantDashboardService from "@/services/dashboardService";
import tenantNotificationService from "@/services/tenantNotificationService";
import TenantReportIncidentModal from "@/components/tenant/incidents/TenantReportIncidentModal";
import TenantViewNotificationModal from "@/components/tenant/notifications/TenantViewNotificationModal";

export default function TenantDashboard() {
  const user = useAuthStore((state) => state.user);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);

  // State cho Modal
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isViewNotiOpen, setIsViewNotiOpen] = useState(false);
  const [selectedNotiId, setSelectedNotiId] = useState(null);

  // 2. THÊM STATE QUẢN LÝ THÔNG BÁO
  const [notifications, setNotifications] = useState([]);

  // Gọi API lấy dữ liệu dashboard
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashRes, notiRes] = await Promise.all([
        tenantDashboardService.getTenantDashboard(),
        tenantNotificationService.getAll({ page: 1 })
      ]);

      setDashboardData(dashRes.data?.data || dashRes.data);
      setNotifications(notiRes.data?.data || []); // Lưu riêng thông báo
    } catch (error) {
      console.error("Lỗi lấy dữ liệu dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // // Hàm tính số ngày còn lại của hợp đồng
  // const calculateDaysLeft = (endDate) => {
  //   if (!endDate) return 0;
  //   const end = new Date(endDate);
  //   const today = new Date();
  //   const diffTime = end - today;
  //   const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  //   return diffDays > 0 ? diffDays : 0;
  // };

  // Hàm format trạng thái Yêu cầu sửa chữa
  const getIncidentStatus = (status) => {
    if (!status) return { text: "Đang xử lý", className: "bg-blue-50 text-blue-600" };

    const s = String(status).toLowerCase();
    switch (s) {
      case 'pending':
      case 'đang chờ':
        return { text: 'Đang chờ', className: 'bg-orange-50 text-orange-600' };
      case 'processing':
      case 'đang xử lý':
        return { text: 'Đang xử lý', className: 'bg-blue-50 text-blue-600' };
      case 'resolved': // Trạng thái bạn vừa nhắc tới
      case 'completed':
      case 'đã hoàn thành':
        return { text: 'Đã hoàn thành', className: 'bg-[#F0FDF4] text-primary' };
      case 'cancelled':
      case 'đã hủy':
        return { text: 'Đã hủy', className: 'bg-red-50 text-red-600' };
      default:
        return { text: status, className: 'bg-gray-100 text-gray-600' };
    }
  };

  // Render Skeleton/Loading chuyên nghiệp khi đang tải dữ liệu
  if (loading) {
    return (
      <div className="p-4 lg:p-8 space-y-6 w-full overflow-hidden">
        {/* SKELETON ROW 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Room Card Skeleton */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm lg:col-span-2 flex flex-col md:flex-row gap-6">
            <div className="md:w-5/12 shrink-0 bg-slate-200 animate-pulse rounded-xl min-h-[160px]"></div>
            <div className="flex-1 flex flex-col md:flex-row gap-6 py-2">
              <div className="flex-1 space-y-4">
                <div className="h-6 bg-slate-200 animate-pulse rounded w-3/4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-slate-200 animate-pulse rounded w-full"></div>
                  <div className="h-4 bg-slate-200 animate-pulse rounded w-5/6"></div>
                  <div className="h-4 bg-slate-200 animate-pulse rounded w-4/6"></div>
                </div>
              </div>
              <div className="hidden md:block w-px bg-gray-100"></div>
              <div className="flex-1 space-y-4">
                <div className="h-5 bg-slate-200 animate-pulse rounded w-1/2"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 animate-pulse rounded w-full"></div>
                  <div className="h-4 bg-slate-200 animate-pulse rounded w-3/4"></div>
                </div>
                <div className="pt-2 h-10 bg-slate-200 animate-pulse rounded w-1/3"></div>
              </div>
            </div>
          </div>

          {/* Notifications Skeleton */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-5">
              <div className="h-5 bg-slate-200 animate-pulse rounded w-1/3"></div>
              <div className="h-4 bg-slate-200 animate-pulse rounded w-1/5"></div>
            </div>
            <div className="space-y-5 flex-1">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse shrink-0"></div>
                  <div className="flex-1 space-y-2 mt-1">
                    <div className="h-4 bg-slate-200 animate-pulse rounded w-full"></div>
                    <div className="h-3 bg-slate-200 animate-pulse rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SKELETON ROW 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bill Skeleton */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between h-[280px]">
            <div>
              <div className="flex justify-between mb-4">
                <div className="h-6 bg-slate-200 animate-pulse rounded w-1/3"></div>
                <div className="h-5 bg-slate-200 animate-pulse rounded-full w-1/4"></div>
              </div>
              <div className="h-4 bg-slate-200 animate-pulse rounded w-1/4 mb-2"></div>
              <div className="h-10 bg-slate-200 animate-pulse rounded w-1/2 mb-6"></div>
              <div className="h-4 bg-slate-200 animate-pulse rounded w-2/3"></div>
            </div>
            <div className="flex gap-3 max-w-sm mt-6">
              <div className="flex-1 h-11 bg-slate-200 animate-pulse rounded-xl"></div>
              <div className="flex-1 h-11 bg-slate-200 animate-pulse rounded-xl"></div>
            </div>
          </div>

          {/* Utilities Skeleton */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm h-[280px]">
            <div className="flex justify-between mb-6">
              <div className="h-5 bg-slate-200 animate-pulse rounded w-1/3"></div>
              <div className="h-4 bg-slate-200 animate-pulse rounded w-1/5"></div>
            </div>
            <div className="grid grid-cols-2 gap-6 h-[calc(100%-44px)]">
              {[1, 2].map(i => (
                <div key={i} className="bg-[#FAFAFA] rounded-xl p-4 border border-gray-100 flex flex-col">
                  <div className="h-6 w-20 bg-slate-200 animate-pulse rounded mb-4"></div>
                  <div className="grid grid-cols-2 gap-4 mb-4 border-b border-gray-200 pb-4">
                    <div>
                      <div className="h-3 w-16 bg-slate-200 mb-2"></div>
                      <div className="h-5 w-10 bg-slate-200"></div>
                    </div>
                    <div>
                      <div className="h-3 w-16 bg-slate-200 mb-2"></div>
                      <div className="h-5 w-10 bg-slate-200"></div>
                    </div>
                  </div>
                  <div className="h-10 w-full bg-slate-200 animate-pulse rounded mt-auto"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SKELETON ROW 3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Contracts Skeleton */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm h-[250px]">
            <div className="flex justify-between mb-6">
              <div className="h-5 bg-slate-200 animate-pulse rounded w-1/2"></div>
              <div className="h-4 bg-slate-200 animate-pulse rounded w-1/4"></div>
            </div>
            <div className="space-y-5">
              {[1, 2, 3].map(i => (
                <div key={i}>
                  <div className="h-3 bg-slate-200 animate-pulse rounded w-1/3 mb-1.5"></div>
                  <div className="h-4 bg-slate-200 animate-pulse rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Repairs Skeleton */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between h-[250px]">
            <div className="flex justify-between mb-6">
              <div className="h-5 bg-slate-200 animate-pulse rounded w-1/2"></div>
              <div className="h-4 bg-slate-200 animate-pulse rounded w-1/4"></div>
            </div>
            <div className="flex justify-between mb-5">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-2 items-center">
                  <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse shrink-0"></div>
                  <div className="space-y-1.5">
                    <div className="w-4 h-4 bg-slate-200 animate-pulse rounded"></div>
                    <div className="w-10 h-2 bg-slate-200 animate-pulse rounded"></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-3 mb-4 flex-1">
              {[1].map(i => (
                <div key={i} className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-xl border border-gray-100">
                  <div className="w-10 h-10 rounded-lg bg-slate-200 animate-pulse shrink-0"></div>
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 bg-slate-200 animate-pulse rounded w-full"></div>
                    <div className="h-3 bg-slate-200 animate-pulse rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="w-full h-10 bg-slate-200 animate-pulse rounded-xl mt-auto shrink-0"></div>
          </div>

          {/* History Skeleton */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm h-[250px]">
            <div className="flex justify-between mb-6">
              <div className="h-5 bg-slate-200 animate-pulse rounded w-1/2"></div>
              <div className="h-4 bg-slate-200 animate-pulse rounded w-1/4"></div>
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex justify-between items-center pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse shrink-0"></div>
                    <div className="space-y-1.5">
                      <div className="w-20 h-4 bg-slate-200 animate-pulse rounded"></div>
                      <div className="w-16 h-3 bg-slate-200 animate-pulse rounded"></div>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="w-16 h-5 bg-slate-200 animate-pulse rounded-full"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Nếu không có dữ liệu
  if (!loading && !dashboardData) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>Không có dữ liệu hoặc bạn chưa được liên kết với phòng nào.</p>
      </div>
    );
  }

  // Lấy dữ liệu an toàn
  const roomInfo = dashboardData?.room_info || {};
  const leaseInfo = dashboardData?.lease_info || {};
  // const daysLeft = calculateDaysLeft(leaseInfo?.end_date || "2026-01-01");

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* ROW 1: Room Info & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ROOM CARD (Col span 2) */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm lg:col-span-2 flex flex-col md:flex-row gap-6">
          {/* Image / Fallback Icon */}
          <div className="md:w-5/12 shrink-0 flex">
            {roomInfo.image_url ? (
              <img
                src={roomInfo.image_url}
                alt={`Ảnh ${roomInfo.room_name || "phòng trọ"}`}
                className="w-full h-full object-cover rounded-xl min-h-[160px] border border-slate-100"
                onError={(e) => {
                  // Fallback: Lỡ link ảnh từ DB bị lỗi 404 thì hiện ảnh giữ chỗ, tránh bể layout
                  e.target.onerror = null;
                  e.target.src = 'https://placehold.co/600x400/f8fafc/94a3b8?text=Chưa+có+ảnh';
                }}
              />
            ) : (
              // Trạng thái Empty: Khi phòng thật sự chưa được upload ảnh nào trong DB
              <div className="w-full h-full min-h-[160px] bg-slate-50 border border-slate-100/60 rounded-xl flex flex-col items-center justify-center">
                <div className="w-14 h-14 bg-white rounded-full shadow-sm flex items-center justify-center mb-3">
                  <i className="fa-solid fa-house-chimney-window text-2xl text-slate-300"></i>
                </div>
                <span className="text-[12px] font-semibold text-slate-400">Chưa cập nhật ảnh</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 flex flex-col md:flex-row gap-6 py-2">
            {/* Basic Info */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-gray-900">{roomInfo.room_name || "Đang cập nhật"}</h3>
                <span className="bg-[#F0FDF4] text-primary text-xs font-semibold px-2.5 py-1 rounded-md border border-green-100">
                  Đang thuê
                </span>
              </div>

              <div className="space-y-3 text-sm text-gray-600">
                <p className="flex items-center gap-3">
                  <i className="fa-solid fa-house text-gray-400 w-4"></i>
                  {roomInfo.property_name || "Đang cập nhật"}
                </p>
                <p className="flex items-center gap-3">
                  <i className="fa-solid fa-stairs text-gray-400 w-4"></i>
                  Tầng {roomInfo.floor_number || "-"} <span className="text-gray-300">•</span> {roomInfo.area || "18"} m²
                </p>
                <p className="flex items-center gap-3">
                  <i className="fa-solid fa-user-group text-gray-400 w-4"></i>
                  {leaseInfo.occupants_count || 0} người ở.
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px bg-gray-100"></div>

            {/* Rent Time */}
            <div className="flex-1 space-y-4">
              <h4 className="text-sm font-semibold text-gray-900">Thời gian thuê</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p className="flex items-center gap-2">
                  <i className="fa-regular fa-calendar text-gray-400 w-4"></i>
                  Ngày bắt đầu: {leaseInfo.start_date ? new Date(leaseInfo.start_date).toLocaleDateString('vi-VN') : "Đang cập nhật"}
                </p>
                <p className="flex items-center gap-2">
                  <i className="fa-regular fa-calendar-check text-gray-400 w-4"></i>
                  Ngày hết hạn: {leaseInfo.end_date ? new Date(leaseInfo.end_date).toLocaleDateString('vi-VN') : "Không thời hạn"}
                </p>
                {/* HIỂN THỊ TỔNG NGÀY NẾU CÓ */}
                {leaseInfo.total_days && (
                  <p className="flex items-center gap-2">
                    <i className="fa-solid fa-clock-rotate-left text-gray-400 w-4"></i>
                    Tổng thời gian: {leaseInfo.total_days} ngày
                  </p>
                )}
              </div>
              <div className="pt-2">
                {leaseInfo.end_date ? (
                  <>
                    <span className="text-3xl font-bold text-primary">{leaseInfo.days_left ?? 0}</span>{" "}
                    <span className="text-primary font-medium">ngày</span>
                    {/* <p className="text-xs text-gray-500 mt-1">Còn lại</p> */}
                  </>
                ) : (
                  <span className="text-lg font-bold text-primary">Không thời hạn</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* NOTIFICATIONS CARD (Col span 1) */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-bold text-gray-900">Thông báo mới</h3>
            <a href="/tenant/notifications" className="text-sm text-blue-600 hover:underline">
              Xem tất cả
            </a>
          </div>

          <div className="space-y-5 flex-1">
            {notifications.length > 0 ? (
              notifications.slice(0, 3).map((noti, index) => {
                // Tùy chỉnh icon & màu sắc theo loại thông báo giống HTML cũ
                let iconClass = "fa-bullhorn";
                let colorClass = "bg-orange-50 text-orange-500";

                if (noti.type === 'billing' || noti.title.toLowerCase().includes("hóa đơn")) {
                  iconClass = "fa-file-invoice";
                  colorClass = "bg-green-50 text-primary";
                } else if (noti.type === 'water' || noti.title.toLowerCase().includes("nước") || noti.title.toLowerCase().includes("điện")) {
                  iconClass = "fa-droplet";
                  colorClass = "bg-blue-50 text-blue-500";
                }

                return (
                  <div
                    key={noti.id || index}
                    className="flex items-start gap-4 cursor-pointer hover:bg-slate-50 p-2 -mx-2 rounded-xl transition-colors"
                    onClick={() => { setSelectedNotiId(noti.id); setIsViewNotiOpen(true); }}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
                      <i className={`fa-solid ${iconClass} text-sm`}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-gray-900 truncate">{noti.title}</h4>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                        {noti.content
                          ? noti.content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()
                          : "Vui lòng kiểm tra chi tiết"}
                      </p>
                    </div>
                    <div className="text-[11px] text-gray-400 flex items-center gap-1.5 shrink-0">
                      {new Date(noti.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                    </div>
                  </div>
                );
              })
            ) : (
              // Trạng thái khi không có thông báo (Lấy từ HTML gốc hoặc tự tạo)
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                  <i className="fa-solid fa-bullhorn text-sm"></i>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-gray-900">Không có thông báo mới</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Bạn đã xem hết tất cả thông báo.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ROW 2: Bills & Utilities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* BILL CARD */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden flex flex-col justify-between">
          {dashboardData?.unpaid_invoices?.length > 0 ? (
            // TRƯỜNG HỢP CÓ HÓA ĐƠN CHƯA THANH TOÁN
            (() => {
              const invoice = dashboardData.unpaid_invoices[0];
              const dueDate = new Date(invoice.due_date);
              const today = new Date();
              const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

              return (
                <>
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <h3 className="font-bold text-lg text-gray-900">
                      Hóa đơn {invoice.period_from ? invoice.period_from.substring(0, 7) : "Kỳ này"}
                    </h3>
                    <span className="bg-orange-50 text-orange-600 text-[11px] font-semibold px-3 py-1 rounded-full border border-orange-100">
                      Chưa thanh toán
                    </span>
                  </div>

                  <div className="relative z-10">
                    <p className="text-sm text-gray-500 mb-1">Số tiền cần thanh toán</p>
                    <div className="flex items-start">
                      <span className="text-4xl font-bold text-primary tracking-tight">
                        {Number(invoice.remaining_amount).toLocaleString('vi-VN')}
                      </span>
                      <span className="text-xl font-bold text-primary ml-1 mt-1">đ</span>
                    </div>

                    <div className="flex items-center gap-3 mt-3 mb-6">
                      <p className="text-sm text-gray-600">
                        Hạn thanh toán: <span className="font-semibold text-gray-900">{invoice.due_date}</span>
                      </p>
                      {diffDays >= 0 ? (
                        <span className="bg-[#F0FDF4] text-primary text-[11px] font-semibold px-2 py-0.5 rounded-full">
                          Còn {diffDays} ngày
                        </span>
                      ) : (
                        <span className="bg-red-50 text-red-600 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-red-100">
                          Quá hạn {Math.abs(diffDays)} ngày
                        </span>
                      )}
                    </div>

                    <div className="flex gap-3 max-w-sm">
                      <button className="flex-1 bg-primary hover:bg-[#097340] text-white text-sm font-semibold py-2.5 rounded-xl transition flex justify-center items-center gap-2 shadow-md shadow-primary/20">
                        <img src="duong-dan-hinh-icon-thanh-toan-cua-ban.png" alt="Thanh toán" className="w-5 h-5 object-contain" />
                        Thanh toán
                      </button>
                      <button className="flex-1 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold py-2.5 rounded-xl transition border border-gray-200">
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                </>
              );
            })()
          ) : (
            // TRƯỜNG HỢP KHÔNG CÓ HÓA ĐƠN NỢ
            <div className="flex flex-col items-start justify-start h-full relative z-10 py-6">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                <i className="fa-solid fa-check-double text-2xl text-primary"></i>
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-1 ">Tuyệt vời!</h3>
              <p className="text-sm text-gray-500 ">Bạn đã thanh toán tất cả các hóa đơn.<br />Không có khoản nợ nào.</p>
            </div>
          )}

          {/* Hình minh họa góc phải dưới */}
          <div className="absolute right-10 bottom-10 opacity-90 hidden md:block">
            <img src="/icon_invoice.png" alt="Minh họa hóa đơn" className="w-[250px] h-auto object-contain transform translate-x-4 translate-y-4" />
          </div>
        </div>

        {/* UTILITIES CARD */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-900">Điện nước gần đây</h3>
            <a href="/tenant/utilities" className="text-sm text-blue-600 hover:underline">Xem chi tiết</a>
          </div>

          <div className="grid grid-cols-2 gap-6 flex-1">
            {/* ELECTRICITY */}
            {(() => {
              const elec = dashboardData?.recent_utilities?.find(u => u.type === 'electricity') || {};
              const elecPrev = elec.previous_reading || 0;
              const elecCur = elec.current_reading || 0;
              const elecUsage = elecCur - elecPrev;

              return (
                <div className="bg-[#FAFAFA] rounded-xl p-4 border border-gray-100 flex flex-col">
                  <div className="flex items-center gap-2 mb-4">
                    <i className="fa-solid fa-bolt text-yellow-500 text-lg"></i>
                    <h4 className="font-semibold text-gray-900">Điện</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 border-b border-gray-200 pb-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Tháng trước</p>
                      <p className="font-bold text-gray-900">{elecPrev} <span className="font-normal text-sm text-gray-500">số</span></p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Tháng này</p>
                      <p className="font-bold text-gray-900">{elecCur} <span className="font-normal text-sm text-gray-500">số</span></p>
                    </div>
                  </div>

                  <div className="flex justify-between items-end flex-1">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Tiêu thụ</p>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900">{elecUsage > 0 ? elecUsage : 0} <span className="font-normal text-sm text-gray-500">số</span></p>
                      </div>
                    </div>
                    {/* Mini Bar Chart CSS */}
                    <div className="flex items-end gap-1.5 h-12">
                      <div className="w-1.5 bg-yellow-200 rounded-t-sm h-[40%]"></div>
                      <div className="w-1.5 bg-yellow-200 rounded-t-sm h-[50%]"></div>
                      <div className="w-1.5 bg-yellow-200 rounded-t-sm h-[30%]"></div>
                      <div className="w-1.5 bg-yellow-200 rounded-t-sm h-[60%]"></div>
                      <div className="w-1.5 bg-yellow-200 rounded-t-sm h-[45%]"></div>
                      <div className="w-1.5 bg-yellow-400 rounded-t-sm h-[80%]"></div>
                      <div className="w-1.5 bg-yellow-400 rounded-t-sm h-[100%]"></div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* WATER */}
            {(() => {
              const water = dashboardData?.recent_utilities?.find(u => u.type !== 'electricity') || {};
              const waterPrev = water.previous_reading || 0;
              const waterCur = water.current_reading || 0;
              const waterUsage = waterCur - waterPrev;

              return (
                <div className="bg-[#FAFAFA] rounded-xl p-4 border border-gray-100 flex flex-col">
                  <div className="flex items-center gap-2 mb-4">
                    <i className="fa-solid fa-droplet text-blue-500 text-lg"></i>
                    <h4 className="font-semibold text-gray-900">Nước</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 border-b border-gray-200 pb-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Tháng trước</p>
                      <p className="font-bold text-gray-900">{waterPrev} <span className="font-normal text-sm text-gray-500">m³</span></p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Tháng này</p>
                      <p className="font-bold text-gray-900">{waterCur} <span className="font-normal text-sm text-gray-500">m³</span></p>
                    </div>
                  </div>

                  <div className="flex justify-between items-end flex-1">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Tiêu thụ</p>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900">{waterUsage > 0 ? waterUsage : 0} <span className="font-normal text-sm text-gray-500">m³</span></p>
                      </div>
                    </div>
                    {/* Mini Bar Chart CSS */}
                    <div className="flex items-end gap-1.5 h-12">
                      <div className="w-1.5 bg-blue-200 rounded-t-sm h-[60%]"></div>
                      <div className="w-1.5 bg-blue-200 rounded-t-sm h-[50%]"></div>
                      <div className="w-1.5 bg-blue-200 rounded-t-sm h-[70%]"></div>
                      <div className="w-1.5 bg-blue-200 rounded-t-sm h-[65%]"></div>
                      <div className="w-1.5 bg-blue-200 rounded-t-sm h-[80%]"></div>
                      <div className="w-1.5 bg-blue-400 rounded-t-sm h-[55%]"></div>
                      <div className="w-1.5 bg-blue-400 rounded-t-sm h-[90%]"></div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* ROW 3: Contracts, Repairs, History */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* CONTRACT CARD */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden flex flex-col">
          <div className="flex justify-between items-center mb-6 relative z-10">
            <h3 className="font-bold text-gray-900">Hợp đồng thuê</h3>
            <a href="/tenant/contracts" className="text-sm text-blue-600 hover:underline">Xem hợp đồng</a>
          </div>

          <div className="space-y-5 relative z-10">
            <div>
              <p className="text-xs text-gray-500 mb-1">Ngày bắt đầu</p>
              <p className="font-bold text-gray-900">
                {leaseInfo.start_date ? new Date(leaseInfo.start_date).toLocaleDateString('vi-VN') : "Đang cập nhật"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Ngày hết hạn</p>
              <p className="font-bold text-gray-900">
                {leaseInfo.end_date ? new Date(leaseInfo.end_date).toLocaleDateString('vi-VN') : "Không thời hạn"}
              </p>
            </div>
            <div className="pt-2">
              <p className="text-xs text-gray-500 mb-1">Còn lại</p>
              {leaseInfo.end_date ? (
                <p className="font-bold text-primary text-lg">{leaseInfo.days_left ?? 0} ngày</p>
              ) : (
                <p className="font-bold text-primary text-lg">Không giới hạn</p>
              )}
            </div>
          </div>

          {/* Decorative Graphic (Clipboard) */}
          <div className="absolute right-10 bottom-10 opacity-90 hidden md:block">
            <img src="/icon_contract.png" alt="Minh họa hợp đồng" className="w-[150px] h-auto object-contain transform translate-x-4 translate-y-4" />
          </div>
        </div>

        {/* REPAIR REQUESTS CARD (Sự cố) */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-900">Yêu cầu sửa chữa</h3>
            <a href="/tenant/incidents" className="text-sm text-blue-600 hover:underline">Xem tất cả</a>
          </div>

          {/* Summary Counters (Giả lập theo giao diện mẫu HTML) */}
          <div className="flex justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center">
                <i className="fa-solid fa-clock text-xs"></i>
              </div>
              <div>
                <p className="font-bold text-gray-900 leading-none mb-1">
                  {dashboardData?.recent_incidents?.filter(i => i.status === 'pending' || i.status === 'Đang chờ').length || 0}
                </p>
                <p className="text-[10px] text-gray-500">Đang chờ</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                <i className="fa-solid fa-screwdriver-wrench text-xs"></i>
              </div>
              <div>
                <p className="font-bold text-gray-900 leading-none mb-1">
                  {dashboardData?.recent_incidents?.filter(i => i.status === 'processing' || i.status === 'Đang xử lý').length || 0}
                </p>
                <p className="text-[10px] text-gray-500">Đang xử lý</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-50 text-primary flex items-center justify-center">
                <i className="fa-solid fa-check text-xs"></i>
              </div>
              <div>
                <p className="font-bold text-gray-900 leading-none mb-1">
                  {dashboardData?.recent_incidents?.filter(i => i.status === 'completed' || i.status === 'Đã hoàn thành').length || 0}
                </p>
                <p className="text-[10px] text-gray-500">Hoàn thành</p>
              </div>
            </div>
          </div>

          {/* List Yêu cầu gần đây */}
          <div className="flex-1 space-y-3 mb-4">
            {dashboardData?.recent_incidents?.length > 0 ? (
              dashboardData.recent_incidents.slice(0, 2).map((incident, idx) => {
                // Gọi hàm lấy format màu và text
                const statusFormat = getIncidentStatus(incident.status);

                return (
                  <div key={incident.id || idx} className="bg-[#F8FAFC] rounded-xl p-3 flex items-center gap-3 border border-gray-100 cursor-pointer hover:bg-gray-50 transition">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                      <i className="fa-solid fa-snowflake"></i>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-gray-900 line-clamp-1">{incident.title}</h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">Ngày tạo: {new Date(incident.created_at).toLocaleDateString('vi-VN')}</p>
                    </div>

                    {/* Áp dụng class và text từ hàm format */}
                    <span className={`${statusFormat.className} text-[10px] font-semibold px-2 py-1 rounded-md shrink-0`}>
                      {statusFormat.text}
                    </span>

                    <i className="fa-solid fa-chevron-right text-gray-300 text-xs ml-1"></i>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">Bạn chưa có yêu cầu sửa chữa nào.</p>
            )}
          </div>

          <button
            onClick={() => setIsReportOpen(true)}
            className="w-full bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold py-2.5 rounded-xl transition border border-gray-200 border-dashed flex justify-center items-center gap-2 mt-auto"
          >
            <i className="fa-solid fa-plus text-gray-400"></i> Gửi yêu cầu mới
          </button>
        </div>

        {/* PAYMENT HISTORY CARD */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-900">Lịch sử thanh toán</h3>
            <a href="/tenant/invoices" className="text-sm text-blue-600 hover:underline">Xem tất cả</a>
          </div>

          <div className="space-y-4 flex-1">
            {dashboardData?.recent_invoices?.length > 0 ? (
              dashboardData.recent_invoices.slice(0, 3).map((inv, idx) => {
                const isPaid = inv.status === 'Đã thanh toán' || inv.status === 'paid';
                return (
                  <div key={inv.id || idx} className="flex items-center justify-between pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full border ${isPaid ? 'border-green-200 text-primary' : 'border-orange-200 text-orange-500'} flex items-center justify-center bg-white shrink-0`}>
                        <i className={`fa-solid ${isPaid ? 'fa-check' : 'fa-clock'} text-xs`}></i>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">
                          Hóa đơn {inv.period_from ? inv.period_from.substring(0, 7) : "Kỳ này"}
                        </h4>
                        <p className="text-xs text-gray-600 mt-0.5">{Number(inv.total_amount).toLocaleString('vi-VN')}đ</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`${isPaid ? 'bg-[#F0FDF4] text-primary' : 'bg-orange-50 text-orange-600'} text-[10px] font-semibold px-2.5 py-1 rounded-full`}
                      >
                        {isPaid ? 'Đã thanh toán' : (inv.status === 'issued' ? 'Chưa thanh toán' : inv.status)}
                      </span>

                      {inv.paid_date && (
                        <span className="text-[11px] text-gray-400">{new Date(inv.paid_date).toLocaleDateString('vi-VN')}</span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 py-4">
                <i className="fa-solid fa-receipt text-2xl mb-2 text-gray-300"></i>
                <p className="text-sm">Chưa có lịch sử thanh toán.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal báo cáo sự cố */}
      <TenantReportIncidentModal
        open={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        onSuccess={fetchDashboardData} // Gọi lại API reload Dashboard khi báo cáo thành công
      />

      <TenantViewNotificationModal
        open={isViewNotiOpen}
        notificationId={selectedNotiId}
        onClose={() => { setIsViewNotiOpen(false); setSelectedNotiId(null); }}
      />

    </div>
  );
}