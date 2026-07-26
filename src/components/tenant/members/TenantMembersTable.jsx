import React from "react";

const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("vi-VN");
};

export default function TenantMembersTable({ members, isLoading, onView, onEdit, onRemove }) {
    if (isLoading) {
        return (
            <div className="flex-1 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-brand">
                <i className="fa-solid fa-circle-notch fa-spin text-3xl"></i>
            </div>
        );
    }

    if (members.length === 0) {
        return (
            <div className="flex-1 bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 p-6">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3 text-2xl"><i className="fa-solid fa-users-slash"></i></div>
                <p className="text-[14px] font-medium text-slate-600">Phòng chưa có thành viên ở ghép.</p>
                <p className="text-[12px] text-slate-400 mt-1">Bấm "Thêm thành viên" để thêm người ở chung.</p>
            </div>
        );
    }

    return (
        <div className="bg-transparent lg:bg-white border-none lg:border lg:border-slate-200 lg:rounded-xl shadow-none lg:shadow-sm lg:overflow-hidden flex flex-col flex-1">
            
            {/* Mobile View */}
            <div className="lg:hidden flex flex-col gap-3 pb-4">
                {members.map((m) => (
                    <div key={m.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
                        <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-100">
                            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                                <i className="fa-solid fa-user"></i>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-slate-800 text-[15px] truncate">{m.tenant?.full_name || m.full_name}</h3>
                                <p className="text-[12px] text-slate-500 mt-0.5">{m.relationship_label}</p>
                            </div>
                        </div>
                        <div className="space-y-1.5 text-[12px] text-slate-600 mb-4">
                            <div className="flex justify-between"><span>SĐT:</span> <strong className="text-slate-800">{m.tenant?.phone || m.phone}</strong></div>
                            <div className="flex justify-between"><span>Vào ở:</span> <strong className="text-slate-800">{formatDate(m.move_in_date)}</strong></div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => onView(m)} className="flex-1 py-1.5 bg-slate-50 text-slate-600 border border-slate-200 rounded text-[12px] font-bold hover:bg-slate-100"><i className="fa-regular fa-eye"></i> Xem</button>
                            <button onClick={() => onEdit(m)} className="flex-1 py-1.5 bg-blue-50 text-blue-600 border border-blue-200 rounded text-[12px] font-bold hover:bg-blue-100"><i className="fa-solid fa-pen"></i> Sửa</button>
                            <button onClick={() => onRemove(m)} className="flex-1 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded text-[12px] font-bold hover:bg-red-100"><i className="fa-solid fa-arrow-right-from-bracket"></i> Rời</button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop View */}
            <div className="hidden lg:block overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
                    <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                        <tr>
                            <th className="py-3 px-4 text-[13px] font-semibold text-slate-600">Họ và Tên</th>
                            <th className="py-3 px-4 text-[13px] font-semibold text-slate-600">Mối quan hệ</th>
                            <th className="py-3 px-4 text-[13px] font-semibold text-slate-600">Số điện thoại</th>
                            <th className="py-3 px-4 text-[13px] font-semibold text-slate-600 text-center">Ngày vào ở</th>
                            <th className="py-3 px-4 text-[13px] font-semibold text-slate-600 text-center w-[150px]">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="text-[13px]">
                        {members.map((m) => (
                            <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                <td className="py-3 px-4 font-bold text-slate-800">{m.tenant?.full_name || m.full_name}</td>
                                <td className="py-3 px-4 text-slate-600"><span className="bg-slate-100 px-2 py-1 rounded text-[11px] font-semibold text-slate-600">{m.relationship_label}</span></td>
                                <td className="py-3 px-4 text-slate-600">{m.tenant?.phone || m.phone}</td>
                                <td className="py-3 px-4 text-center text-slate-600">{formatDate(m.move_in_date)}</td>
                                <td className="py-3 px-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <button onClick={() => onView(m)} title="Xem chi tiết" className="w-7 h-7 rounded bg-white border border-slate-200 text-slate-500 hover:text-brand hover:border-brand shadow-sm flex items-center justify-center"><i className="fa-regular fa-eye"></i></button>
                                        <button onClick={() => onEdit(m)} title="Sửa thông tin" className="w-7 h-7 rounded bg-white border border-slate-200 text-blue-500 hover:text-blue-700 hover:border-blue-500 shadow-sm flex items-center justify-center"><i className="fa-solid fa-pen text-[11px]"></i></button>
                                        <button onClick={() => onRemove(m)} title="Rời phòng" className="w-7 h-7 rounded bg-white border border-slate-200 text-red-500 hover:text-red-700 hover:border-red-500 shadow-sm flex items-center justify-center"><i className="fa-solid fa-arrow-right-from-bracket text-[11px]"></i></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}