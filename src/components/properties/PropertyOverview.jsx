export default function PropertyOverview() {
  return (
    <div className="mb-2 lg:mb-0">
      
      {/* Tiêu đề */}
      <div className="flex items-center justify-between mb-3 hidden lg:flex">
        <h3 className="text-[14px] font-bold text-slate-800">
          Tổng quan <span className="text-brand">Khu A - Đường Lê Văn Sỹ</span>
        </h3>
        <span className="text-[11px] text-slate-400">Cập nhật lúc: 14:30 hôm nay</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        
        {/* Stat 1: Tổng phòng */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center gap-3 shadow-sm relative hover:border-slate-300 transition-colors">
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center text-lg shrink-0">
            <i className="fa-solid fa-house-user"></i>
          </div>
          <div>
            <p className="text-[18px] lg:text-[20px] font-bold text-slate-800 leading-none">20</p>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">Tổng phòng</p>
          </div>
        </div>

        {/* Stat 2: Đang thuê */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center gap-3 shadow-sm relative overflow-hidden hover:border-green-300 transition-colors">
          <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center text-lg shrink-0">
            <i className="fa-solid fa-door-closed"></i>
          </div>
          <div className="flex-1">
            <p className="text-[18px] lg:text-[20px] font-bold text-slate-800 leading-none">16</p>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">Đang thuê</p>
          </div>
          <div className="absolute top-2.5 right-2.5 text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100">80%</div>
        </div>

        {/* Stat 3: Phòng trống */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center gap-3 shadow-sm relative overflow-hidden hover:border-blue-300 transition-colors">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center text-lg shrink-0">
            <i className="fa-solid fa-door-open"></i>
          </div>
          <div className="flex-1">
            <p className="text-[18px] lg:text-[20px] font-bold text-slate-800 leading-none">3</p>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">Phòng trống</p>
          </div>
          <div className="absolute top-2.5 right-2.5 text-[10px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">15%</div>
        </div>

        {/* Stat 4: Bảo trì */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center gap-3 shadow-sm relative overflow-hidden hover:border-orange-300 transition-colors">
          <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center text-lg shrink-0">
            <i className="fa-solid fa-wrench"></i>
          </div>
          <div className="flex-1">
            <p className="text-[18px] lg:text-[20px] font-bold text-slate-800 leading-none">1</p>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">Bảo trì</p>
          </div>
          <div className="absolute top-2.5 right-2.5 text-[10px] font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">5%</div>
        </div>

      </div>
    </div>
  );
}