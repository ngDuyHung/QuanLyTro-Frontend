export default function RoomWidgets() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Box Cảnh báo */}
      <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-5 shadow-sm">
        <h3 className="text-[14px] font-bold text-slate-800 mb-4">Cảnh báo</h3>
        <ul className="space-y-3">
          <li className="flex justify-between items-center text-[13px]">
            <div className="flex items-center gap-2 text-red-600 font-medium">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
              10 phòng đang nợ tiền
            </div>
            <button className="text-red-500 hover:text-red-700 font-medium">Xem chi tiết</button>
          </li>
          <li className="flex justify-between items-center text-[13px]">
            <div className="flex items-center gap-2 text-orange-600 font-medium">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
              5 hợp đồng sắp hết hạn (7 ngày)
            </div>
            <button className="text-red-500 hover:text-red-700 font-medium">Xem chi tiết</button>
          </li>
          <li className="flex justify-between items-center text-[13px]">
            <div className="flex items-center gap-2 text-orange-600 font-medium">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
              2 phòng đang bảo trì
            </div>
            <button className="text-red-500 hover:text-red-700 font-medium">Xem chi tiết</button>
          </li>
        </ul>
      </div>

      {/* Box Thao tác nhanh */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <h3 className="text-[14px] font-bold text-slate-800 mb-4">Thao tác nhanh</h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {[
            { icon: "fa-file-invoice", text: "Tạo hóa đơn" },
            { icon: "fa-droplet", text: "Ghi chỉ số điện nước" },
            { icon: "fa-money-bill-wave", text: "Thu tiền phòng" },
            { icon: "fa-file-signature", text: "Gia hạn hợp đồng" },
            { icon: "fa-wrench", text: "Bảo trì phòng" },
            { icon: "fa-headset", text: "Tạo yêu cầu dịch vụ" },
          ].map((item, idx) => (
             <button key={idx} className="flex flex-col items-center justify-center p-2 text-center group hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
              <div className="w-10 h-10 rounded-lg bg-green-50 text-brand flex items-center justify-center mb-2 group-hover:bg-brand group-hover:text-white transition-colors">
                <i className={`fa-solid ${item.icon} text-lg`}></i>
              </div>
              <span className="text-[11px] text-slate-600 font-medium leading-tight">{item.text}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Box Báo cáo nhanh */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[14px] font-bold text-slate-800">Báo cáo nhanh</h3>
          <button className="text-[12px] text-brand font-medium hover:underline">Xem chi tiết</button>
        </div>
        
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex justify-between items-end mb-1">
              <span className="text-[12px] text-slate-500 font-medium">Tỷ lệ lấp đầy</span>
              <span className="text-[16px] font-bold text-slate-800">79.2%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-brand h-full rounded-full" style={{ width: '79.2%' }}></div>
            </div>
          </div>
          
          <div className="flex justify-between pt-2 border-t border-slate-50">
            <div>
              <p className="text-[11px] text-slate-500 mb-1">Doanh thu tháng 5</p>
              <div className="flex items-center gap-2">
                <p className="text-[15px] font-bold text-brand">63.250.000đ</p>
                <span className="text-[10px] text-brand bg-green-50 px-1 rounded">↑ 14%</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-slate-500 mb-1">Công nợ hiện tại</p>
              <p className="text-[15px] font-bold text-red-500">12.750.000đ</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}