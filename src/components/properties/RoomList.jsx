export default function RoomList() {
  return (
    <div className="flex flex-col flex-1">
      
      {/* Header chung của danh sách phòng (Mobile & Desktop) */}
      <div className="flex justify-between items-center mb-3 lg:px-5 lg:py-4 lg:bg-white lg:border lg:border-slate-200 lg:rounded-t-xl lg:mb-0 lg:border-b-0">
        <div>
          {/* Mobile text */}
          <p className="text-[14px] font-bold text-slate-800 lg:hidden">Danh sách phòng</p>
          <p className="text-[12px] text-brand font-semibold mt-0.5 lg:hidden">Khu A - Lê Văn Sỹ · 8/20 phòng</p>
          
          {/* Desktop text */}
          <h3 className="hidden lg:block text-[15px] font-bold text-slate-800">
            Phòng thuộc: <span className="text-brand">Khu A - Đường Lê Văn Sỹ</span>
          </h3>
        </div>
        
        {/* Nút hành động */}
        <div className="flex items-center gap-2">
          <button className="hidden lg:flex border border-green-200 text-brand px-2.5 py-1.5 rounded-lg text-[13px] font-medium hover:bg-brand-50 transition-colors items-center gap-1.5">
            <i className="fa-solid fa-arrow-down-a-z"></i>
            <span>Sắp xếp phòng</span>
          </button>
          <button className="bg-brand text-white px-3.5 py-2 lg:px-2.5 lg:py-1.5 rounded-xl lg:rounded-lg text-[13px] font-semibold lg:font-medium hover:bg-brand-dark transition-colors flex items-center gap-1.5 shadow-sm lg:shadow-none">
            <i className="fa-solid fa-plus text-[11px] lg:text-[13px]"></i> 
            <span className="hidden lg:inline">Thêm phòng mới</span>
            <span className="lg:hidden">Thêm phòng</span>
          </button>
        </div>
      </div>

      {/* ========================================== */}
      {/* 1. GIAO DIỆN MOBILE: DANH SÁCH CARD        */}
      {/* ========================================== */}
      <div className="lg:hidden flex flex-col gap-3 pb-4">
        
        {/* Phòng 101 - Đang thuê */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
                <i className="fa-solid fa-door-open text-green-500 text-sm"></i>
              </div>
              <div>
                <p className="text-[14px] font-bold text-slate-800 leading-none">Phòng 101</p>
                <p className="text-[11px] text-slate-400 mt-0.5">25 m²</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-green-50 text-green-600 text-[11px] font-semibold rounded-full">Đang thuê</span>
              <button className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400">
                <i className="fa-solid fa-ellipsis-vertical text-[12px]"></i>
              </button>
            </div>
          </div>
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                <i className="fa-solid fa-user text-slate-400 text-[11px]"></i>
              </div>
              <div>
                <p className="text-[13px] font-semibold text-slate-800 leading-none">Nguyễn Văn B</p>
                <p className="text-[11px] text-slate-500 mt-0.5">0901 234 567</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[15px] font-bold text-brand leading-none">2.800.000đ</p>
              <p className="text-[10px] text-slate-400 mt-0.5">/tháng</p>
            </div>
          </div>
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex gap-2">
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-slate-200 rounded-lg bg-white text-[12px] font-medium text-slate-600 active:bg-slate-100">
                <i className="fa-regular fa-eye text-slate-400"></i> Xem chi tiết
            </button>
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-green-200 rounded-lg bg-green-50 text-[12px] font-medium text-brand active:bg-green-100">
                <i className="fa-solid fa-file-invoice-dollar text-[11px]"></i> Hóa đơn
            </button>
          </div>
        </div>

        {/* Phòng 103 - Trống */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                <i className="fa-solid fa-door-open text-blue-400 text-sm"></i>
              </div>
              <div>
                <p className="text-[14px] font-bold text-slate-800 leading-none">Phòng 103</p>
                <p className="text-[11px] text-slate-400 mt-0.5">20 m²</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-blue-50 text-blue-500 text-[11px] font-semibold rounded-full">Trống</span>
              <button className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400">
                <i className="fa-solid fa-ellipsis-vertical text-[12px]"></i>
              </button>
            </div>
          </div>
          <div className="px-4 py-3 flex items-center justify-between">
            <p className="text-[13px] text-slate-400 italic">Chưa có khách thuê</p>
            <div className="text-right">
              <p className="text-[15px] font-bold text-brand leading-none">2.500.000đ</p>
              <p className="text-[10px] text-slate-400 mt-0.5">/tháng</p>
            </div>
          </div>
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex gap-2">
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-slate-200 rounded-lg bg-white text-[12px] font-medium text-slate-600 active:bg-slate-100">
                <i className="fa-regular fa-eye text-slate-400"></i> Xem chi tiết
            </button>
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-brand rounded-lg bg-brand text-[12px] font-medium text-white active:bg-brand-dark">
                <i className="fa-solid fa-user-plus text-[11px]"></i> Thêm khách
            </button>
          </div>
        </div>

        {/* Phòng 201 - Bảo trì */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center shrink-0">
                <i className="fa-solid fa-wrench text-orange-400 text-sm"></i>
              </div>
              <div>
                <p className="text-[14px] font-bold text-slate-800 leading-none">Phòng 201</p>
                <p className="text-[11px] text-slate-400 mt-0.5">24 m²</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-orange-50 text-orange-500 text-[11px] font-semibold rounded-full">Bảo trì</span>
              <button className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400">
                <i className="fa-solid fa-ellipsis-vertical text-[12px]"></i>
              </button>
            </div>
          </div>
          <div className="px-4 py-3 flex items-center justify-between">
            <p className="text-[13px] text-slate-400 italic">Đang bảo trì</p>
            <div className="text-right">
              <p className="text-[15px] font-bold text-brand leading-none">2.700.000đ</p>
              <p className="text-[10px] text-slate-400 mt-0.5">/tháng</p>
            </div>
          </div>
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex gap-2">
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-slate-200 rounded-lg bg-white text-[12px] font-medium text-slate-600 active:bg-slate-100">
                <i className="fa-regular fa-eye text-slate-400"></i> Xem chi tiết
            </button>
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-orange-200 rounded-lg bg-orange-50 text-[12px] font-medium text-orange-600 active:bg-orange-100">
                <i className="fa-solid fa-wrench text-[11px]"></i> Bảo trì
            </button>
          </div>
        </div>

      </div>

      {/* ========================================== */}
      {/* 2. GIAO DIỆN DESKTOP: TABLE KHUNG RỘNG     */}
      {/* ========================================== */}
      <div className="hidden lg:flex flex-1 overflow-hidden bg-white border-x border-slate-200">
        <div className="flex-1 overflow-x-auto overflow-y-auto no-scrollbar">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-[700px]">
            <thead className="sticky top-0 bg-white z-10 shadow-sm shadow-slate-100">
              <tr>
                <th className="text-[12px] text-slate-500 font-medium py-3 px-5 border-b border-slate-100 w-[120px]">Tên phòng</th>
                <th className="text-[12px] text-slate-500 font-medium py-3 px-2 border-b border-slate-100 w-[100px]">Diện tích</th>
                <th className="text-[12px] text-slate-500 font-medium py-3 px-2 border-b border-slate-100 w-[120px]">Giá phòng</th>
                <th className="text-[12px] text-slate-500 font-medium py-3 px-2 border-b border-slate-100 w-[110px]">Trạng thái</th>
                <th className="text-[12px] text-slate-500 font-medium py-3 px-2 border-b border-slate-100">Người thuê</th>
                <th className="text-[12px] text-slate-500 font-medium py-3 px-5 border-b border-slate-100 text-center w-[80px]">Thao tác</th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              
              {/* Row 1 - Phòng 101 */}
              <tr className="hover:bg-slate-50 transition-colors border-b border-slate-50">
                <td className="py-3 px-5 font-semibold text-slate-800">
                  <i className="fa-solid fa-door-open text-slate-400 mr-2"></i> Phòng 101
                </td>
                <td className="py-3 px-2 text-slate-600">25 m²</td>
                <td className="py-3 px-2 font-semibold text-slate-800">2.800.000đ</td>
                <td className="py-3 px-2">
                  <span className="px-2.5 py-1 bg-green-50 text-green-600 text-[11px] font-semibold rounded-full">Đang thuê</span>
                </td>
                <td className="py-3 px-2">
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-800">Nguyễn Văn B</span>
                    <span className="text-[11px] text-slate-500">0901 234 567</span>
                  </div>
                </td>
                <td className="py-3 px-5 text-center">
                  <div className="flex justify-center gap-1.5">
                    <button className="w-7 h-7 rounded border border-slate-200 text-slate-500 hover:text-brand hover:border-brand flex items-center justify-center"><i className="fa-regular fa-eye"></i></button>
                    <button className="w-7 h-7 rounded border border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300 flex items-center justify-center"><i className="fa-solid fa-ellipsis-vertical"></i></button>
                  </div>
                </td>
              </tr>

              {/* Row 2 - Phòng 201 */}
              <tr className="hover:bg-slate-50 transition-colors border-b border-slate-50">
                <td className="py-3 px-5 font-semibold text-slate-800">
                  <i className="fa-solid fa-door-open text-slate-400 mr-2"></i> Phòng 201
                </td>
                <td className="py-3 px-2 text-slate-600">24 m²</td>
                <td className="py-3 px-2 font-semibold text-slate-800">2.700.000đ</td>
                <td className="py-3 px-2">
                  <span className="px-2.5 py-1 bg-orange-50 text-orange-500 text-[11px] font-semibold rounded-full">Bảo trì</span>
                </td>
                <td className="py-3 px-2 text-slate-400">—</td>
                <td className="py-3 px-5 text-center">
                  <div className="flex justify-center gap-1.5">
                    <button className="w-7 h-7 rounded border border-slate-200 text-slate-500 hover:text-brand hover:border-brand flex items-center justify-center"><i className="fa-regular fa-eye"></i></button>
                    <button className="w-7 h-7 rounded border border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300 flex items-center justify-center"><i className="fa-solid fa-ellipsis-vertical"></i></button>
                  </div>
                </td>
              </tr>

              {/* Row 3 - Phòng 202 */}
              <tr className="hover:bg-slate-50 transition-colors border-b border-slate-50">
                <td className="py-3 px-5 font-semibold text-slate-800">
                  <i className="fa-solid fa-door-open text-slate-400 mr-2"></i> Phòng 202
                </td>
                <td className="py-3 px-2 text-slate-600">22 m²</td>
                <td className="py-3 px-2 font-semibold text-slate-800">2.600.000đ</td>
                <td className="py-3 px-2">
                  <span className="px-2.5 py-1 bg-green-50 text-green-600 text-[11px] font-semibold rounded-full">Đang thuê</span>
                </td>
                <td className="py-3 px-2">
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-800">Hoàng Văn F</span>
                    <span className="text-[11px] text-slate-500">0905 678 901</span>
                  </div>
                </td>
                <td className="py-3 px-5 text-center">
                  <div className="flex justify-center gap-1.5">
                    <button className="w-7 h-7 rounded border border-slate-200 text-slate-500 hover:text-brand hover:border-brand flex items-center justify-center"><i className="fa-regular fa-eye"></i></button>
                    <button className="w-7 h-7 rounded border border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300 flex items-center justify-center"><i className="fa-solid fa-ellipsis-vertical"></i></button>
                  </div>
                </td>
              </tr>

              {/* Row 4 - Phòng 203 */}
              <tr className="hover:bg-slate-50 transition-colors border-b border-slate-50">
                <td className="py-3 px-5 font-semibold text-slate-800">
                  <i className="fa-solid fa-door-open text-slate-400 mr-2"></i> Phòng 203
                </td>
                <td className="py-3 px-2 text-slate-600">20 m²</td>
                <td className="py-3 px-2 font-semibold text-slate-800">2.500.000đ</td>
                <td className="py-3 px-2">
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-500 text-[11px] font-semibold rounded-full">Trống</span>
                </td>
                <td className="py-3 px-2 text-slate-400">—</td>
                <td className="py-3 px-5 text-center">
                  <div className="flex justify-center gap-1.5">
                    <button className="w-7 h-7 rounded border border-slate-200 text-slate-500 hover:text-brand hover:border-brand flex items-center justify-center"><i className="fa-regular fa-eye"></i></button>
                    <button className="w-7 h-7 rounded border border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300 flex items-center justify-center"><i className="fa-solid fa-ellipsis-vertical"></i></button>
                  </div>
                </td>
              </tr>

            </tbody>
          </table>
        </div>
      </div>

      {/* Phân trang (Pagination) chung */}
      <div className="flex justify-between items-center lg:px-5 lg:py-3 lg:bg-white lg:border lg:border-slate-200 lg:border-t-slate-100 lg:rounded-b-xl pt-2 pb-2">
        <span className="text-[12px] text-slate-500">
            <span className="lg:hidden">Hiển thị 1–8 / 20 phòng</span>
            <span className="hidden lg:inline">Hiển thị 1 - 8 trong tổng số 20 phòng</span>
        </span>
        <div className="flex gap-1">
          <button className="w-8 h-8 lg:w-7 lg:h-7 rounded-lg lg:rounded flex items-center justify-center text-slate-400 border border-slate-200 bg-white hover:bg-slate-50">
            <i className="fa-solid fa-angle-left text-[12px] lg:text-[11px]"></i>
          </button>
          <button className="w-8 h-8 lg:w-7 lg:h-7 rounded-lg lg:rounded flex items-center justify-center bg-brand text-white font-medium text-[13px] lg:text-[12px]">
            1
          </button>
          <button className="w-8 h-8 lg:w-7 lg:h-7 rounded-lg lg:rounded flex items-center justify-center text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 font-medium text-[13px] lg:text-[12px]">
            2
          </button>
          {/* Nút số 3 chỉ hiện ở Desktop theo bản gốc */}
          <button className="hidden lg:flex w-7 h-7 rounded items-center justify-center text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 font-medium text-[12px]">
            3
          </button>
          <button className="w-8 h-8 lg:w-7 lg:h-7 rounded-lg lg:rounded flex items-center justify-center text-slate-500 border border-slate-200 bg-white hover:bg-slate-50">
            <i className="fa-solid fa-angle-right text-[12px] lg:text-[11px]"></i>
          </button>
        </div>
      </div>

    </div>
  );
}