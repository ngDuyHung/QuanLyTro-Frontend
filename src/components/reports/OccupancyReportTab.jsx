import React from "react";

// Dịch các loại sự cố
const incidentLabels = {
    electrical: "Sự cố điện",
    water: "Sự cố nước",
    furniture: "Nội thất/Thiết bị",
    security: "An ninh",
    other: "Khác",
};

// Hàm format tiền tệ VNĐ
const formatVND = (amount) => {
    return Number(amount || 0).toLocaleString("vi-VN") + " đ";
};

export default function OccupancyReportTab({ data }) {
    if (!data) return null;

    const { leases, incidents_breakdown, occupancy = {} } = data;

    const totalRooms = occupancy.total_rooms || 0;
    const occupiedRooms = occupancy.occupied_rooms || 0;
    const occupancyRate = occupancy.occupancy_rate || 0;
    const vacantRooms = occupancy.vacant_rooms || [];

    // Tính tổng sự cố để tính %
    const totalIncidents = Object.values(incidents_breakdown || {}).reduce((a, b) => a + b, 0);

    return (
        <div className="flex flex-col gap-6 animate-[fadeIn_0.3s_ease-out]">

            {/* 0. TỶ LỆ LẤP ĐẦY (Chỉ số quan trọng nhất của báo cáo vận hành) */}
            <div className="bg-white rounded-xl p-5 md:p-6 border border-slate-100 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                    {/* Vòng tròn tỷ lệ lấp đầy */}
                    <div className="flex items-center gap-4 shrink-0">
                        <div
                            className="w-20 h-20 rounded-full flex items-center justify-center text-lg font-bold text-[#0e8b4d]"
                            style={{
                                background: `conic-gradient(#0e8b4d ${occupancyRate * 3.6}deg, #e2e8f0 0deg)`,
                            }}
                        >
                            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-[15px]">
                                {occupancyRate}%
                            </div>
                        </div>
                        <div>
                            <p className="text-[12px] text-slate-500 font-semibold uppercase mb-1">Tỷ lệ lấp đầy</p>
                            <p className="text-[13px] text-slate-700">
                                <span className="font-bold text-slate-800">{occupiedRooms}</span> / {totalRooms} phòng đang có khách
                            </p>
                        </div>
                    </div>

                    <div className="flex-1 grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 rounded-lg p-3 flex flex-col">
                            <span className="text-[11px] text-blue-600 font-semibold uppercase">Đang cho thuê</span>
                            <span className="text-lg font-bold text-blue-700">{occupiedRooms} phòng</span>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-3 flex flex-col">
                            <span className="text-[11px] text-orange-600 font-semibold uppercase">Đang trống</span>
                            <span className="text-lg font-bold text-orange-600">{totalRooms - occupiedRooms} phòng</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 0.5 DANH SÁCH PHÒNG ĐANG TRỐNG */}
            {vacantRooms.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 md:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-2 text-slate-800 font-bold text-[15px]">
                            <i className="fa-solid fa-door-open text-orange-500"></i>
                            Phòng đang trống (trống lâu nhất trước)
                        </div>
                        <span className="text-[12px] text-slate-500 font-medium">{vacantRooms.length} phòng</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse whitespace-nowrap">
                            <thead>
                                <tr className="bg-slate-50 text-[12px] text-slate-500 uppercase tracking-wider">
                                    <th className="py-3 px-4 font-bold border-b border-slate-200">Phòng / Khu nhà</th>
                                    <th className="py-3 px-4 font-bold border-b border-slate-200">Trống từ</th>
                                    <th className="py-3 px-4 font-bold border-b border-slate-200 text-right">Giá niêm yết</th>
                                </tr>
                            </thead>
                            <tbody className="text-[13px] text-slate-700">
                                {vacantRooms.map((room, index) => (
                                    <tr key={index} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                        <td className="py-3 px-4">
                                            <div className="font-bold text-slate-800">{room.room_name}</div>
                                            <div className="text-[12px] text-slate-500 flex items-center gap-1 mt-0.5">
                                                <i className="fa-solid fa-building"></i> {room.property_name}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-slate-500">{room.vacant_since}</td>
                                        <td className="py-3 px-4 text-right font-semibold text-slate-700">
                                            {formatVND(room.price)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 1. THỐNG KÊ HỢP ĐỒNG (QUẢN LÝ TÀI SẢN) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center text-xl shrink-0">
                        <i className="fa-solid fa-file-circle-plus"></i>
                    </div>
                    <div>
                        <p className="text-[12px] text-slate-500 font-semibold uppercase">Hợp đồng mới</p>
                        <p className="text-2xl font-bold text-slate-800">{leases?.new_leases || 0} <span className="text-[14px] text-slate-400 font-normal">hợp đồng</span></p>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center text-xl shrink-0">
                        <i className="fa-solid fa-file-circle-minus"></i>
                    </div>
                    <div>
                        <p className="text-[12px] text-slate-500 font-semibold uppercase">Hợp đồng đã trả</p>
                        <p className="text-2xl font-bold text-slate-800">{leases?.ended_leases || 0} <span className="text-[14px] text-slate-400 font-normal">hợp đồng</span></p>
                    </div>
                </div>
            </div>

            {/* 2. THỐNG KÊ SỰ CỐ & BẢO TRÌ */}
            <div className="bg-white rounded-xl p-5 md:p-6 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-3">
                    <i className="fa-solid fa-screwdriver-wrench text-blue-500 text-lg"></i>
                    <h3 className="text-[15px] font-bold text-slate-800">Thống kê sự cố kỹ thuật</h3>
                </div>

                {totalIncidents === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 opacity-60">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                            <i className="fa-solid fa-shield-check text-3xl text-green-400"></i>
                        </div>
                        <p className="text-[13px] text-slate-500 font-medium">Không có sự cố nào trong kỳ</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {Object.entries(incidents_breakdown).map(([category, count]) => {
                            const percent = ((count / totalIncidents) * 100).toFixed(0);
                            return (
                                <div key={category} className="group">
                                    <div className="flex justify-between items-end mb-1.5">
                                        <span className="text-[13px] font-semibold text-slate-700">
                                            {incidentLabels[category] || category}
                                        </span>
                                        <span className="text-[13px] font-bold text-slate-800">{count} vụ</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                                style={{ width: `${percent}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-[12px] font-bold text-slate-500 w-10 text-right">{percent}%</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}