export default function RoomTable() {
  const rooms = [
    { id: "A101", floor: "Tầng 1", building: "Khu A", address: "Đường Lê Văn Sỹ", area: "25 m²", price: "2.800.000đ", status: "Đang thuê", paymentStatus: "Đã thanh toán", tenant: "Nguyễn Văn B", phone: "0901 234 567", expire: "10/06/2024", expireDays: "21 ngày" },
    { id: "A102", floor: "Tầng 1", building: "Khu A", address: "Đường Lê Văn Sỹ", area: "22 m²", price: "2.600.000đ", status: "Đang thuê", paymentStatus: "Quá hạn 3 ngày", isLate: true, tenant: "Trần Thị C", phone: "0902 345 678", expire: "08/06/2024", expireDays: "19 ngày", isExpireNear: true },
    { id: "A103", floor: "Tầng 1", building: "Khu A", address: "Đường Lê Văn Sỹ", area: "20 m²", price: "2.500.000đ", status: "Trống", paymentStatus: "—", tenant: "—", phone: "—", expire: "—", expireDays: "" },
    { id: "B201", floor: "Tầng 2", building: "Khu B", address: "Đường Nguyễn Văn Đậu", area: "24 m²", price: "2.700.000đ", status: "Đang thuê", paymentStatus: "Sắp đến hạn", isWarning: true, tenant: "Phạm Thị E", phone: "0904 567 890", expire: "25/05/2024", expireDays: "5 ngày", isExpireNear: true },
    { id: "B202", floor: "Tầng 2", building: "Khu B", address: "Đường Nguyễn Văn Đậu", area: "22 m²", price: "2.600.000đ", status: "Đang thuê", paymentStatus: "Đã thanh toán", tenant: "Hoàng Văn F", phone: "0905 678 901", expire: "05/06/2024", expireDays: "16 ngày" },
    { id: "C301", floor: "Tầng 3", building: "Khu C", address: "Đường Hoàng Văn Thụ", area: "28 m²", price: "3.000.000đ", status: "Đang thuê", paymentStatus: "Quá hạn 7 ngày", isLate: true, tenant: "Lê Văn D", phone: "0903 456 789", expire: "03/06/2024", expireDays: "14 ngày", isExpireNear: true },
    { id: "C302", floor: "Tầng 3", building: "Khu C", address: "Đường Hoàng Văn Thụ", area: "25 m²", price: "2.800.000đ", status: "Bảo trì", paymentStatus: "—", tenant: "—", phone: "—", expire: "—", expireDays: "" },
    { id: "D101", floor: "Tầng 1", building: "Khu D", address: "Đường Tô Hiến Thành", area: "20 m²", price: "2.500.000đ", status: "Trống", paymentStatus: "—", tenant: "—", phone: "—", expire: "—", expireDays: "" },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm mb-6 flex flex-col">
      {/* Filters */}
      <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3 flex-1">
          <div className="relative w-[240px]">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input type="text" placeholder="Tìm kiếm phòng, người thuê, SĐT..." className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-[13px] focus:border-brand focus:ring-1 focus:ring-brand outline-none" />
          </div>
          <select className="border border-slate-200 rounded-lg text-[13px] px-3 py-2 text-slate-600 outline-none focus:border-brand">
            <option>Tất cả khu nhà</option>
          </select>
          <select className="border border-slate-200 rounded-lg text-[13px] px-3 py-2 text-slate-600 outline-none focus:border-brand">
            <option>Trạng thái thuê</option>
          </select>
          <select className="border border-slate-200 rounded-lg text-[13px] px-3 py-2 text-slate-600 outline-none focus:border-brand">
            <option>Trạng thái thanh toán</option>
          </select>
          <select className="border border-slate-200 rounded-lg text-[13px] px-3 py-2 text-slate-600 outline-none focus:border-brand">
            <option>Hợp đồng hết hạn</option>
          </select>
          <button className="border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-600 hover:bg-slate-50 flex items-center gap-2">
            <i className="fa-solid fa-filter"></i> Thêm bộ lọc
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button className="text-[13px] text-slate-500 hover:text-slate-800 px-2">Xóa lọc</button>
          <button className="bg-brand-50 text-brand border border-green-200 rounded-lg px-3 py-2 text-[13px] font-medium hover:bg-green-100 flex items-center gap-2">
            <i className="fa-regular fa-floppy-disk"></i> Lưu bộ lọc
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-slate-50/50 text-[12px] text-slate-500 font-medium">
            <tr>
              <th className="py-3 px-4 border-b border-slate-100 w-[40px]"><input type="checkbox" className="rounded border-slate-300 text-brand focus:ring-brand" /></th>
              <th className="py-3 px-4 border-b border-slate-100">Phòng <i className="fa-solid fa-sort ml-1 text-slate-300"></i></th>
              <th className="py-3 px-4 border-b border-slate-100">Khu nhà <i className="fa-solid fa-sort ml-1 text-slate-300"></i></th>
              <th className="py-3 px-4 border-b border-slate-100">Diện tích <i className="fa-solid fa-sort ml-1 text-slate-300"></i></th>
              <th className="py-3 px-4 border-b border-slate-100">Giá phòng <i className="fa-solid fa-sort ml-1 text-slate-300"></i></th>
              <th className="py-3 px-4 border-b border-slate-100">Trạng thái thuê <i className="fa-solid fa-sort ml-1 text-slate-300"></i></th>
              <th className="py-3 px-4 border-b border-slate-100">Thanh toán <i className="fa-solid fa-sort ml-1 text-slate-300"></i></th>
              <th className="py-3 px-4 border-b border-slate-100">Người thuê <i className="fa-solid fa-sort ml-1 text-slate-300"></i></th>
              <th className="py-3 px-4 border-b border-slate-100">HĐ hết hạn <i className="fa-solid fa-sort ml-1 text-slate-300"></i></th>
              <th className="py-3 px-4 border-b border-slate-100 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="text-[13px]">
            {rooms.map((room, idx) => (
              <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="py-3 px-4"><input type="checkbox" className="rounded border-slate-300 text-brand focus:ring-brand" /></td>
                <td className="py-3 px-4">
                  <p className="font-bold text-slate-800">{room.id}</p>
                  <p className="text-[11px] text-slate-500">{room.floor}</p>
                </td>
                <td className="py-3 px-4">
                  <p className="font-bold text-slate-800">{room.building}</p>
                  <p className="text-[11px] text-slate-500">{room.address}</p>
                </td>
                <td className="py-3 px-4 text-slate-600">{room.area}</td>
                <td className="py-3 px-4 font-bold text-slate-800">{room.price}</td>
                <td className="py-3 px-4">
                  {room.status === "Đang thuê" && <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-green-50 text-green-600">Đang thuê</span>}
                  {room.status === "Trống" && <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-blue-50 text-blue-500">Trống</span>}
                  {room.status === "Bảo trì" && <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-orange-50 text-orange-500">Bảo trì</span>}
                </td>
                <td className="py-3 px-4">
                  {room.paymentStatus === "Đã thanh toán" && <span className="px-2.5 py-1 rounded-full border border-green-200 text-[11px] font-medium text-green-600 bg-green-50/50 flex items-center w-max gap-1.5"><i className="fa-regular fa-circle-check"></i> Đã thanh toán</span>}
                  {room.isLate && <span className="px-2.5 py-1 rounded-full border border-red-200 text-[11px] font-medium text-red-600 bg-red-50/50 flex items-center w-max gap-1.5"><i className="fa-solid fa-triangle-exclamation"></i> {room.paymentStatus}</span>}
                  {room.isWarning && <span className="px-2.5 py-1 rounded-full border border-orange-200 text-[11px] font-medium text-orange-500 bg-orange-50/50 flex items-center w-max gap-1.5"><i className="fa-regular fa-clock"></i> {room.paymentStatus}</span>}
                  {room.paymentStatus === "—" && <span className="text-slate-400">—</span>}
                </td>
                <td className="py-3 px-4">
                  {room.tenant !== "—" ? (
                    <>
                      <p className="font-semibold text-slate-800">{room.tenant}</p>
                      <p className="text-[11px] text-slate-500">{room.phone}</p>
                    </>
                  ) : <span className="text-slate-400">—</span>}
                </td>
                <td className="py-3 px-4">
                   {room.expire !== "—" ? (
                    <>
                      <p className={`font-semibold ${room.isExpireNear ? 'text-red-500' : 'text-slate-800'}`}>{room.expire}</p>
                      <p className={`text-[11px] ${room.isExpireNear ? 'text-orange-500' : 'text-slate-500'}`}>{room.expireDays}</p>
                    </>
                  ) : <span className="text-slate-400">—</span>}
                </td>
                <td className="py-3 px-4">
                  {room.status === "Trống" ? (
                    <div className="flex justify-center gap-2">
                       <button className="w-8 h-8 rounded border border-green-200 text-brand hover:bg-green-50 flex items-center justify-center"><i className="fa-solid fa-plus"></i></button>
                       <button className="w-8 h-8 rounded border border-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center"><i className="fa-regular fa-eye"></i></button>
                       <button className="w-8 h-8 rounded border border-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center"><i className="fa-solid fa-ellipsis-vertical"></i></button>
                    </div>
                  ) : (
                    <div className="flex justify-center gap-2">
                      <button className="w-8 h-8 rounded border border-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center"><i className="fa-regular fa-eye"></i></button>
                      <button className="w-8 h-8 rounded border border-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center"><i className="fa-solid fa-file-contract"></i></button>
                      <button className="w-8 h-8 rounded border border-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center"><i className="fa-solid fa-droplet"></i></button>
                      <button className="w-8 h-8 rounded border border-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center"><i className="fa-solid fa-ellipsis-vertical"></i></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[13px] text-slate-500">Hiển thị 1 - 10 trong tổng số 120 phòng</span>
        <div className="flex items-center gap-4">
          <div className="flex gap-1">
            <button className="w-8 h-8 rounded border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50"><i className="fa-solid fa-angle-left"></i></button>
            <button className="w-8 h-8 rounded bg-brand text-white font-medium flex items-center justify-center">1</button>
            <button className="w-8 h-8 rounded border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 flex items-center justify-center">2</button>
            <button className="w-8 h-8 rounded border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 flex items-center justify-center">3</button>
            <button className="w-8 h-8 rounded border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 flex items-center justify-center">4</button>
            <button className="w-8 h-8 rounded border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 flex items-center justify-center">5</button>
            <span className="w-8 h-8 flex items-center justify-center text-slate-400">...</span>
            <button className="w-8 h-8 rounded border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 flex items-center justify-center">12</button>
            <button className="w-8 h-8 rounded border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50"><i className="fa-solid fa-angle-right"></i></button>
          </div>
          <select className="border border-slate-200 rounded-lg text-[13px] px-3 py-1.5 text-slate-600 outline-none focus:border-brand">
            <option>10 / trang</option>
          </select>
        </div>
      </div>
    </div>
  );
}