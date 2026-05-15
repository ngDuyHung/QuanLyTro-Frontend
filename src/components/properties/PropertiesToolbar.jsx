export default function PropertiesToolbar() {
  return (
    <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-6">
      {/* Search Input */}
      <div className="relative w-full lg:w-[400px]">
        <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
        <input
          type="text"
          placeholder="Tìm kiếm khu nhà theo tên hoặc địa chỉ..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
        />
      </div>

      {/* Filters & Action */}
      <div className="flex items-center flex-wrap gap-2 w-full lg:w-auto">
        {/* Nút Lọc */}
        <button className="bg-white border border-slate-200 px-4 py-2.5 rounded-lg text-[13px] font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-2">
          <i className="fa-solid fa-filter text-brand"></i>
          Tất cả trạng thái
          <i className="fa-solid fa-angle-down text-[10px] ml-1 text-slate-400"></i>
        </button>

        {/* Nút Sắp xếp */}
        <button className="bg-white border border-slate-200 px-4 py-2.5 rounded-lg text-[13px] font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-2">
          <i className="fa-solid fa-arrow-up-wide-short text-slate-400"></i>
          Sắp xếp: Mới nhất
          <i className="fa-solid fa-angle-down text-[10px] ml-1 text-slate-400"></i>
        </button>

        {/* Nút Thêm Mới */}
        <button className="bg-brand text-white px-5 py-2.5 rounded-lg text-[13px] font-medium hover:bg-brand-dark transition-colors flex items-center gap-2 shadow-sm">
          <i className="fa-solid fa-plus"></i>
          Thêm khu nhà mới
        </button>
      </div>
    </div>
  );
}
