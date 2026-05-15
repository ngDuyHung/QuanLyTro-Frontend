export default function PropertyOverview() {
  return (
    <div className="mb-3 lg:mb-0 lg:border lg:border-slate-200 lg:bg-white lg:p-5 lg:rounded-xl lg:shadow-sm">
      
      {/* Tiêu đề chỉ hiện trên Desktop */}
      <h3 className="hidden lg:block text-[14px] font-bold text-slate-800 mb-4">
        Tổng quan <span className="text-brand">Khu A - Đường Lê Văn Sỹ</span>
      </h3>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 lg:gap-4">
        
        {/* Stat 1: Tổng phòng */}
        <div className="bg-white lg:bg-slate-50/50 border border-slate-100 rounded-xl lg:rounded-lg p-3 flex items-center gap-2.5 lg:gap-4 shadow-sm lg:shadow-none">
          <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-lg bg-slate-100 lg:bg-slate-200 text-slate-500 flex items-center justify-center text-sm lg:text-lg shrink-0">
            <i className="fa-solid fa-house-user"></i>
          </div>
          <div>
            <p className="text-[18px] lg:text-[20px] font-bold text-slate-800 leading-none">20</p>
            <p className="text-[11px] text-slate-500 mt-0.5 lg:mt-1 font-medium">Tổng phòng</p>
          </div>
        </div>

        {/* Stat 2: Đang thuê */}
        <div className="bg-green-50 lg:bg-green-50/30 border border-green-100 rounded-xl lg:rounded-lg p-3 flex items-center gap-2.5 lg:gap-4 shadow-sm lg:shadow-none relative overflow-hidden">
          <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center text-sm lg:text-lg shrink-0">
            <i className="fa-solid fa-door-closed"></i>
          </div>
          <div className="flex-1">
            <p className="text-[18px] lg:text-[20px] font-bold text-slate-800 leading-none">16</p>
            <p className="text-[11px] text-slate-500 mt-0.5 lg:mt-1 font-medium">
              Đang thuê <span className="text-green-600 font-bold lg:hidden">80%</span>
            </p>
          </div>
          <div className="hidden lg:block absolute bottom-2 right-3 text-[11px] font-bold text-green-600">80%</div>
        </div>

        {/* Stat 3: Phòng trống */}
        <div className="bg-blue-50 lg:bg-blue-50/30 border border-blue-100 rounded-xl lg:rounded-lg p-3 flex items-center gap-2.5 lg:gap-4 shadow-sm lg:shadow-none relative overflow-hidden">
          <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-lg bg-blue-100 text-blue-500 flex items-center justify-center text-sm lg:text-lg shrink-0">
            <i className="fa-solid fa-door-open"></i>
          </div>
          <div className="flex-1">
            <p className="text-[18px] lg:text-[20px] font-bold text-slate-800 leading-none">3</p>
            <p className="text-[11px] text-slate-500 mt-0.5 lg:mt-1 font-medium">
              Phòng trống <span className="text-blue-500 font-bold lg:hidden">15%</span>
            </p>
          </div>
          <div className="hidden lg:block absolute bottom-2 right-3 text-[11px] font-bold text-blue-500">15%</div>
        </div>

        {/* Stat 4: Bảo trì */}
        <div className="bg-orange-50 lg:bg-orange-50/30 border border-orange-100 rounded-xl lg:rounded-lg p-3 flex items-center gap-2.5 lg:gap-4 shadow-sm lg:shadow-none relative overflow-hidden">
          <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-lg bg-orange-100 text-orange-500 flex items-center justify-center text-sm lg:text-lg shrink-0">
            <i className="fa-solid fa-wrench"></i>
          </div>
          <div className="flex-1">
            <p className="text-[18px] lg:text-[20px] font-bold text-slate-800 leading-none">1</p>
            <p className="text-[11px] text-slate-500 mt-0.5 lg:mt-1 font-medium">
              Bảo trì <span className="text-orange-500 font-bold lg:hidden">5%</span>
            </p>
          </div>
          <div className="hidden lg:block absolute bottom-2 right-3 text-[11px] font-bold text-orange-500">5%</div>
        </div>

      </div>
    </div>
  );
}