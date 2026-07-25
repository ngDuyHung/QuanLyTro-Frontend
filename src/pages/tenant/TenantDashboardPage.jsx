import { useEffect, useState } from "react";
import useAuthStore from "@/stores/authStore";
import tenantDashboardService from "@/services/dashboardService";

export default function TenantDashboard() {
  const user = useAuthStore((state) => state.user);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await tenantDashboardService.getTenantDashboard();
      setDashboardData(res.data?.data || res.data);
    } catch (error) {
      console.error("Lỗi lấy dữ liệu dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Style CSS nội tuyến đơn giản cho table dễ nhìn
  const tableStyle = { width: "100%", borderCollapse: "collapse", marginBottom: "20px" };
  const thTdStyle = { border: "1px solid #ccc", padding: "8px", textAlign: "left" };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Trang chủ - Tổng quan</h1>
      <p>Xin chào người thuê: <strong>{user?.name}</strong></p>

      {loading && <p>Đang tải dữ liệu...</p>}

      {!loading && !dashboardData && (
        <p>Không có dữ liệu hoặc bạn chưa được liên kết với phòng nào.</p>
      )}

      {!loading && dashboardData && (
        <div style={{ marginTop: "20px" }}>

          {/* 1. THÔNG TIN PHÒNG & HỢP ĐỒNG (Key - Value) */}
          <h3>1. Thông tin Phòng & Hợp đồng</h3>
          <table style={tableStyle}>
            <tbody>
              <tr>
                <th style={thTdStyle} width="200">Khu nhà:</th>
                <td style={thTdStyle}>{dashboardData.room_info?.property_name} - {dashboardData.room_info?.address}</td>
              </tr>
              <tr>
                <th style={thTdStyle}>Phòng:</th>
                <td style={thTdStyle}>{dashboardData.room_info?.room_name}</td>
              </tr>
              <tr>
                <th style={thTdStyle}>Giá thuê cơ bản:</th>
                <td style={thTdStyle}>{Number(dashboardData.room_info?.room_price || 0).toLocaleString('vi-VN')} đ/tháng</td>
              </tr>
              <tr>
                <th style={thTdStyle}>Ngày vào ở (HĐ):</th>
                <td style={thTdStyle}>{dashboardData.lease_info?.start_date}</td>
              </tr>
              <tr>
                <th style={thTdStyle}>Tiền cọc:</th>
                <td style={thTdStyle}>{Number(dashboardData.lease_info?.deposit || 0).toLocaleString('vi-VN')} đ</td>
              </tr>
              <tr>
                <th style={thTdStyle}>Số lượng người ở: </th>
                <td style={thTdStyle}>{dashboardData.lease_info?.occupants_count || 0} người</td>
              </tr>
              <tr>
                <th style={thTdStyle}>Số tầng:</th>
                <td style={thTdStyle}>{dashboardData.room_info?.floor_number || 0}</td>
              </tr>
            </tbody>
          </table>

          {/* 2. HÓA ĐƠN CHƯA THANH TOÁN (Mảng) */}
          <h3>2. Hóa đơn chưa thanh toán</h3>
          {dashboardData.unpaid_invoices?.length > 0 ? (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thTdStyle}>Mã HĐ</th>
                  <th style={thTdStyle}>Kỳ hóa đơn</th>
                  <th style={thTdStyle}>Hạn chót</th>
                  <th style={thTdStyle}>Tổng tiền</th>
                  <th style={thTdStyle}>Còn nợ</th>
                  <th style={thTdStyle}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.unpaid_invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td style={thTdStyle}>{inv.invoice_code}</td>
                    <td style={thTdStyle}>{inv.period_from} đến {inv.period_to}</td>
                    <td style={thTdStyle}>{inv.due_date}</td>
                    <td style={thTdStyle}>{Number(inv.total_amount).toLocaleString('vi-VN')} đ</td>
                    <td style={{ ...thTdStyle, color: "red", fontWeight: "bold" }}>
                      {Number(inv.remaining_amount).toLocaleString('vi-VN')} đ
                    </td>
                    <td style={thTdStyle}>{inv.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Bạn không có hóa đơn nào đang nợ.</p>
          )}

          <h3>2.1 5 hóa đơn gần đây</h3>
          {dashboardData.recent_invoices?.length > 0 ? (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thTdStyle}>Mã HĐ</th>
                  <th style={thTdStyle}>Kỳ hóa đơn</th>
                  <th style={thTdStyle}>Hạn chót</th>
                  <th style={thTdStyle}>Tổng tiền</th>
                  <th style={thTdStyle}>Còn nợ</th>
                  <th style={thTdStyle}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.recent_invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td style={thTdStyle}>{inv.invoice_code}</td>
                    <td style={thTdStyle}>{inv.period_from} đến {inv.period_to}</td>
                    <td style={thTdStyle}>{inv.due_date}</td>
                    <td style={thTdStyle}>{Number(inv.total_amount).toLocaleString('vi-VN')} đ</td>
                    <td style={{ ...thTdStyle, color: "red", fontWeight: "bold" }}>
                      {Number(inv.remaining_amount).toLocaleString('vi-VN')} đ
                    </td>
                    <td style={thTdStyle}>{inv.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Chưa có hóa đơn nào gần đây.</p>
          )}

          {/* 3. CHỈ SỐ ĐIỆN NƯỚC GẦN ĐÂY (Mảng) */}
          <h3>3. Chỉ số điện nước (Gần đây nhất)</h3>
          {dashboardData.recent_utilities?.length > 0 ? (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thTdStyle}>Loại</th>
                  <th style={thTdStyle}>Ngày chốt</th>
                  <th style={thTdStyle}>Chỉ số cũ</th>
                  <th style={thTdStyle}>Chỉ số mới</th>
                  <th style={thTdStyle}>Sử dụng</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.recent_utilities.map((util) => (
                  <tr key={util.id}>
                    <td style={thTdStyle}>{util.type === 'electricity' ? 'Điện' : 'Nước'}</td>
                    <td style={thTdStyle}>{util.reading_date}</td>
                    <td style={thTdStyle}>{util.previous_reading}</td>
                    <td style={thTdStyle}>{util.current_reading}</td>
                    <td style={thTdStyle}>{util.current_reading - util.previous_reading}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Chưa có dữ liệu chốt điện nước.</p>
          )}

          {/* 4. SỰ CỐ GẦN ĐÂY (Mảng) */}
          <h3>4. Lịch sử báo cáo sự cố</h3>
          {dashboardData.recent_incidents?.length > 0 ? (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thTdStyle}>Ngày báo</th>
                  <th style={thTdStyle}>Tiêu đề</th>
                  <th style={thTdStyle}>Phân loại</th>
                  <th style={thTdStyle}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.recent_incidents.map((incident) => (
                  <tr key={incident.id}>
                    <td style={thTdStyle}>{new Date(incident.created_at).toLocaleDateString('vi-VN')}</td>
                    <td style={thTdStyle}>{incident.title}</td>
                    <td style={thTdStyle}>{incident.category}</td>
                    <td style={thTdStyle}>{incident.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Chưa có báo cáo sự cố nào.</p>
          )}

          {/* 5. THÔNG BÁO (Mảng) */}
          <h3>5. Thông báo mới</h3>
          {dashboardData.notifications?.length > 0 ? (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thTdStyle}>Ngày gửi</th>
                  <th style={thTdStyle}>Tiêu đề</th>
                  <th style={thTdStyle}>Loại</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.notifications.map((noti) => (
                  <tr key={noti.id}>
                    <td style={thTdStyle}>{new Date(noti.created_at).toLocaleDateString('vi-VN')}</td>
                    <td style={thTdStyle}>{noti.title}</td>
                    <td style={thTdStyle}>{noti.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Không có thông báo mới.</p>
          )}

        </div>
      )
      }
    </div >
  );
}