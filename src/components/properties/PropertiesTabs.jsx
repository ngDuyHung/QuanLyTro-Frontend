export default function PropertiesTabs() {
  return (
    <div className="flex border-b border-slate-200 mb-5">
      {/* Tab Active */}
      <button className="px-6 py-3 text-[14px] font-bold text-brand border-b-2 border-brand">
        Danh sách khu nhà
      </button>
      
      {/* Tab Inactive */}
      <button className="px-6 py-3 text-[14px] font-medium text-slate-500 hover:text-slate-800 transition-colors">
        Danh sách phòng
      </button>
    </div>
  );
}