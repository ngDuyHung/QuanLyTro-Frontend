export default function PropertyList() {
  return (
    <>
      {/* Tiêu đề cho Mobile (Sẽ ẩn trên Desktop) */}
      <div className="flex items-center justify-between mb-2 lg:hidden">
        <p className="text-[13px] font-bold text-slate-700">Chọn khu nhà</p>
        <span className="text-[12px] text-slate-400">4 khu nhà</span>
      </div>

      {/* WRAPPER GỘP: Cuộn ngang trên Mobile, Cuộn dọc trên Desktop */}
      <div className="flex gap-3 pb-2 overflow-x-auto no-scrollbar lg:flex-col lg:overflow-y-visible lg:pb-0">
        
        {/* ==================================================== */}
        {/* CARD 1: Khu A (Đang hoạt động)                       */}
        {/* ==================================================== */}
        <div className="flex-shrink-0 w-[148px] lg:w-full bg-white border-2 border-brand rounded-xl p-2.5 lg:p-3.5 cursor-pointer shadow-sm flex flex-col lg:flex-row lg:gap-4 transition-all">
          
          {/* Ảnh Cover */}
          <div className="w-full h-[66px] lg:w-[130px] lg:h-[130px] rounded-lg overflow-hidden shrink-0 mb-2 lg:mb-0">
            <img 
              src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=200"
              alt="Khu A" 
              className="w-full h-full object-cover" 
            />
          </div>

          {/* Info Khu nhà - THÊM min-w-0 ĐỂ TRUNCATE HOẠT ĐỘNG */}
          <div className="flex-1 flex flex-col justify-between min-w-0">
            <div>
              <div className="flex justify-between items-start gap-2">
                {/* Phần Tiêu đề & Badge Desktop */}
                <div className="flex items-center gap-2 flex-wrap min-w-0 w-full lg:w-auto">
                  {/* Truncate text trên mobile */}
                  <h3 className="text-[12px] lg:text-[15px] font-bold text-slate-800 truncate w-full lg:w-auto lg:whitespace-normal">
                    Khu A - Lê Văn Sỹ
                  </h3>
                  
                  {/* BADGE DESKTOP: Chỉ hiện trên màn lớn */}
                  <span className="hidden lg:inline-flex px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-semibold rounded-md whitespace-nowrap">
                    Đang hoạt động
                  </span>
                </div>
                
                {/* Nút 3 chấm ẩn ở mobile, hiện ở desktop */}
                <button className="hidden shrink-0 text-slate-400 hover:text-slate-600 lg:block">
                  <i className="fa-solid fa-ellipsis"></i>
                </button>
              </div>

              {/* Địa chỉ chỉ hiện trên Desktop */}
              <p className="hidden lg:flex text-[12px] text-slate-500 mt-1.5 items-start gap-1.5 line-clamp-2">
                <i className="fa-solid fa-location-dot mt-0.5 text-slate-400 shrink-0"></i>
                123/45 Lê Văn Sỹ, Phường 13, Quận 3, TP.HCM
              </p>
            </div>

            {/* Thông số phòng & Badge Mobile */}
            <div className="mt-1 lg:mt-2 lg:pt-2 lg:border-t lg:border-slate-50">
              
              {/* GIAO DIỆN MOBILE: Hiện số phòng và Badge HĐ nằm ngang hàng */}
              <div className="flex items-center justify-between lg:hidden">
                <p className="text-[11px] text-slate-500">16/20 phòng</p>
                {/* BADGE MOBILE: Nằm dưới cùng bên phải */}
                <span className="px-1.5 py-0.5 bg-green-50 text-green-600 text-[10px] font-semibold rounded-md">
                  HĐ
                </span>
              </div>
              
              {/* GIAO DIỆN DESKTOP: Grid Stats & Cập nhật */}
              <div className="hidden lg:block">
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <p className="text-[16px] font-bold text-slate-800 leading-none">20</p>
                    <p className="text-[10px] text-slate-500 mt-1.5">Tổng phòng</p>
                  </div>
                  <div>
                    <p className="text-[16px] font-bold text-slate-800 leading-none">16</p>
                    <p className="text-[10px] text-slate-500 mt-1.5">Đang thuê</p>
                  </div>
                  <div>
                    <p className="text-[16px] font-bold text-slate-800 leading-none">3</p>
                    <p className="text-[10px] text-slate-500 mt-1.5">Phòng trống</p>
                  </div>
                  <div>
                    <p className="text-[16px] font-bold text-slate-800 leading-none">1</p>
                    <p className="text-[10px] text-slate-500 mt-1.5">Bảo trì</p>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 mt-2.5">
                  Cập nhật: 20/05/2024
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ==================================================== */}
        {/* CARD 2: Khu D (Tạm ngưng)                            */}
        {/* ==================================================== */}
        <div className="flex-shrink-0 w-[148px] lg:w-full bg-white border border-slate-200 rounded-xl p-2.5 lg:p-3.5 cursor-pointer shadow-sm flex flex-col lg:flex-row lg:gap-4 transition-all opacity-80 hover:opacity-100 hover:border-brand">
          
          {/* Ảnh Cover */}
          <div className="w-full h-[66px] lg:w-[130px] lg:h-[130px] rounded-lg overflow-hidden shrink-0 mb-2 lg:mb-0">
            <img 
              src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=200"
              alt="Khu D" 
              className="w-full h-full object-cover grayscale" 
            />
          </div>

          <div className="flex-1 flex flex-col justify-between min-w-0">
            <div>
              <div className="flex justify-between items-start gap-2">
                <div className="flex items-center gap-2 flex-wrap min-w-0 w-full lg:w-auto">
                  <h3 className="text-[12px] lg:text-[15px] font-bold text-slate-800 truncate w-full lg:w-auto lg:whitespace-normal">
                    Khu D - T.H. Thành
                  </h3>
                  
                  {/* BADGE DESKTOP */}
                  <span className="hidden lg:inline-flex px-2 py-0.5 bg-orange-50 text-orange-500 text-[10px] font-semibold rounded-md whitespace-nowrap">
                    Tạm ngưng
                  </span>
                </div>
                
                <button className="hidden shrink-0 text-slate-400 hover:text-slate-600 lg:block">
                  <i className="fa-solid fa-ellipsis"></i>
                </button>
              </div>

              <p className="hidden lg:flex text-[12px] text-slate-500 mt-1.5 items-start gap-1.5 line-clamp-2">
                <i className="fa-solid fa-location-dot mt-0.5 text-slate-400 shrink-0"></i>
                78 Tô Hiến Thành, Phường 15, Quận 10, TP.HCM
              </p>
            </div>

            <div className="mt-1 lg:mt-2 lg:pt-2 lg:border-t lg:border-slate-50">
              
              {/* GIAO DIỆN MOBILE: Hiện số phòng và Badge TN nằm ngang hàng */}
              <div className="flex items-center justify-between lg:hidden">
                <p className="text-[11px] text-slate-500">0/10 phòng</p>
                {/* BADGE MOBILE */}
                <span className="px-1.5 py-0.5 bg-orange-50 text-orange-500 text-[10px] font-semibold rounded-md">
                  TN
                </span>
              </div>
              
              {/* GIAO DIỆN DESKTOP */}
              <div className="hidden lg:block">
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <p className="text-[16px] font-bold text-slate-800 leading-none">10</p>
                    <p className="text-[10px] text-slate-500 mt-1.5">Tổng phòng</p>
                  </div>
                  <div>
                    <p className="text-[16px] font-bold text-slate-800 leading-none">0</p>
                    <p className="text-[10px] text-slate-500 mt-1.5">Đang thuê</p>
                  </div>
                  <div>
                    <p className="text-[16px] font-bold text-slate-800 leading-none">10</p>
                    <p className="text-[10px] text-slate-500 mt-1.5">Phòng trống</p>
                  </div>
                  <div>
                    <p className="text-[16px] font-bold text-slate-800 leading-none">0</p>
                    <p className="text-[10px] text-slate-500 mt-1.5">Bảo trì</p>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 mt-2.5">
                  Cập nhật: 10/05/2024
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* ==================================================== */}
      {/* PHÂN TRANG (Chỉ hiện trên Desktop)                   */}
      {/* ==================================================== */}
      <div className="hidden lg:flex justify-center items-center gap-1 mt-2 mb-4">
        <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50">
          <i className="fa-solid fa-angle-left text-[12px]"></i>
        </button>
        <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-[13px] font-medium text-white shadow-sm shadow-green-600/20">
          1
        </button>
        <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-50">
          2
        </button>
        <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-50">
          3
        </button>
        <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50">
          <i className="fa-solid fa-angle-right text-[12px]"></i>
        </button>
      </div>
    </>
  );
}