const formatCurrency = (value) => {
  const number = Number(value || 0);
  return `${new Intl.NumberFormat("vi-VN").format(number)}đ`;
};

const getFloorLabel = (floorNumber) => {
  if (floorNumber === null || floorNumber === undefined || floorNumber === "") {
    return "Không xác định";
  }

  if (String(floorNumber) === "0") {
    return "Trệt";
  }

  return `Tầng ${floorNumber}`;
};

const getBillingDayLabel = (billingDay) => {
  if (billingDay === null || billingDay === undefined || billingDay === "") {
    return "Theo cấu hình khu nhà";
  }

  if (String(billingDay) === "0") {
    return "Theo ngày vào ở";
  }

  return `Ngày ${billingDay} hằng tháng`;
};

export default function ViewRoomModal({ open, onClose, room }) {
  if (!open || !room) return null;

  const images = room.images || [];

  const coverImage =
    images.find((image) => image.is_cover)?.image_url ||
    images[0]?.image_url ||
    "";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          width: "600px",
          maxWidth: "95%",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#fff",
          padding: "20px",
          borderRadius: "8px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h2>Chi tiết phòng {room.name}</h2>

          <button type="button" onClick={onClose}>
            Đóng
          </button>
        </div>

        <hr />

        {coverImage ? (
          <div>
            <p>
              <strong>Ảnh phòng:</strong>
            </p>

            <img
              src={coverImage}
              alt={room.name}
              style={{
                width: "100%",
                height: "250px",
                objectFit: "cover",
                borderRadius: "6px",
              }}
            />
          </div>
        ) : (
          <p>Phòng chưa có hình ảnh.</p>
        )}

        <h3>Thông tin cơ bản</h3>

        <table border="1" cellPadding="8" style={{ width: "100%" }}>
          <tbody>
            <tr>
              <td>Tên phòng</td>
              <td>{room.name}</td>
            </tr>

            <tr>
              <td>Khu nhà</td>
              <td>{room.property?.name || "Không có dữ liệu"}</td>
            </tr>

            <tr>
              <td>Địa chỉ khu nhà</td>
              <td>{room.property?.address || "Không có dữ liệu"}</td>
            </tr>

            <tr>
              <td>Tầng</td>
              <td>{getFloorLabel(room.floor_number)}</td>
            </tr>

            <tr>
              <td>Diện tích</td>
              <td>{room.area ? `${room.area} m²` : "Chưa nhập"}</td>
            </tr>

            <tr>
              <td>Giá thuê</td>
              <td>{formatCurrency(room.current_price)}</td>
            </tr>

            <tr>
              <td>Sức chứa tối đa</td>
              <td>
                {Number(room.max_occupants || 0) > 0
                  ? `${room.max_occupants} người`
                  : "Chưa giới hạn"}
              </td>
            </tr>

            <tr>
              <td>Ngày thu tiền</td>
              <td>{getBillingDayLabel(room.billing_day)}</td>
            </tr>

            <tr>
              <td>Trạng thái</td>
              <td>{room.status_label || room.status}</td>
            </tr>

            <tr>
              <td>Cho phép ở ghép</td>
              <td>{room.allow_shared ? "Có" : "Không"}</td>
            </tr>

            <tr>
              <td>Đăng công khai</td>
              <td>{room.is_public ? "Có" : "Không"}</td>
            </tr>
          </tbody>
        </table>

        <h3>Mô tả</h3>

        <p>{room.description || "Chưa có mô tả."}</p>

        {images.length > 1 && (
          <>
            <h3>Danh sách ảnh</h3>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {images.map((image) => (
                <img
                  key={image.id}
                  src={image.image_url}
                  alt="Ảnh phòng"
                  style={{
                    width: "90px",
                    height: "70px",
                    objectFit: "cover",
                    borderRadius: "4px",
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}