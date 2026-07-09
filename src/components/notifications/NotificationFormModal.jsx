import React, { useState, useEffect, useRef } from "react";
import JoditEditor from "jodit-react";
import { toast } from "react-toastify";
import propertyService from "@/services/propertyService";
import roomService from "@/services/roomService";

const initialForm = {
    title: "",
    type: "info",
    target_type: "all",
    target_id: "",
    is_pinned: false,
    status: "draft",
    content: "",
};

export default function NotificationFormModal({ open, onClose, onSubmit, isSubmitting, initialData }) {
    const editor = useRef(null);
    const [form, setForm] = useState(initialForm);
    const [properties, setProperties] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [selectedPropertyForRoom, setSelectedPropertyForRoom] = useState("");

    useEffect(() => {
        if (open) fetchProperties();
    }, [open]);

    useEffect(() => {
        if (form.target_type === "room" && selectedPropertyForRoom) {
            fetchRooms(selectedPropertyForRoom);
        } else {
            setRooms([]);
        }
    }, [form.target_type, selectedPropertyForRoom]);

    useEffect(() => {
        if (open && initialData) {
            setForm({
                id: initialData.id,
                title: initialData.title || "",
                type: initialData.type || "info",
                target_type: initialData.target_type || "all",
                target_id: initialData.target_id || "",
                is_pinned: Boolean(initialData.is_pinned),
                status: initialData.status || "draft",
                content: initialData.content || "",
            });
        } else if (open && !initialData) {
            setForm(initialForm);
            setSelectedPropertyForRoom("");
        }
    }, [open, initialData]);

    if (!open) return null;

    const fetchProperties = async () => {
        try {
            const res = await propertyService.getAll({ per_page: 100 });
            setProperties(res.data.data || []);
        } catch (error) {}
    };

    const fetchRooms = async (propertyId) => {
        try {
            const res = await roomService.getByProperty(propertyId, { per_page: 200 });
            setRooms(res.data.data || []);
        } catch (error) {}
    };

    const handleChange = (field) => (e) => {
        const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
        setForm((prev) => {
            const newForm = { ...prev, [field]: value };
            if (field === "target_type") {
                newForm.target_id = "";
                setSelectedPropertyForRoom("");
            }
            return newForm;
        });
    };

    const handleSubmit = (statusValue) => (e) => {
        e.preventDefault();
        if (!form.title.trim()) return toast.warning("Vui lòng nhập tiêu đề");
        if (!form.content.trim()) return toast.warning("Vui lòng nhập nội dung");

        const submitData = {
            ...form,
            status: statusValue,
            target_id: form.target_type === "all" ? null : Number(form.target_id)
        };
        onSubmit(submitData);
    };

    const config = {
        readonly: false,
        height: 350,
        placeholder: "Nội dung thông báo...",
        uploader: { insertImageAsBase64URI: true },
        language: "vi",
        toolbarAdaptive: true,
        buttons: "bold,italic,underline,strikethrough,|,ul,ol,|,font,fontsize,brush,paragraph,|,image,table,link,|,align,undo,redo"
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4 transition-all">
            <style>{`
                @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
                @keyframes fadeIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            `}</style>

            <div className="bg-slate-50 w-full h-[95vh] sm:h-auto sm:max-h-[95vh] max-w-[900px] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out] sm:animate-[fadeIn_0.2s_ease-out]">
                
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand shrink-0">
                            <i className="fa-solid fa-bullhorn text-[18px]"></i>
                        </div>
                        <h2 className="text-[17px] font-bold text-slate-800 truncate">
                            {initialData ? "Chỉnh sửa thông báo" : "Soạn thông báo mới"}
                        </h2>
                    </div>
                    <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                {/* Form Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-5 no-scrollbar">
                    {/* Hàng 1: Tiêu đề & Ghim */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <label className="block text-[13px] font-bold text-slate-700 mb-1.5 ml-1">Tiêu đề thông báo <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={form.title}
                                onChange={handleChange("title")}
                                placeholder="Nhập tiêu đề..."
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[14px] font-semibold text-slate-800 focus:border-brand outline-none"
                            />
                        </div>
                        <div className="sm:mt-7">
                            <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 h-full sm:h-[42px]">
                                <input type="checkbox" checked={form.is_pinned} onChange={handleChange("is_pinned")} className="w-4 h-4 rounded text-brand focus:ring-brand" />
                                <span className="text-[13px] font-bold text-slate-700 whitespace-nowrap"><i className="fa-solid fa-thumbtack text-red-500 mr-1"></i> Ghim đầu</span>
                            </label>
                        </div>
                    </div>

                    {/* Hàng 2: Bộ lọc đối tượng */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                        <div>
                            <label className="block text-[12px] font-bold text-slate-500 mb-1.5 uppercase ml-1">Phân loại</label>
                            <select value={form.type} onChange={handleChange("type")} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-semibold text-slate-800 outline-none">
                                <option value="info">Thông tin chung</option>
                                <option value="warning">Cảnh báo / Nội quy</option>
                                <option value="billing">Tài chính / Tiền nong</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-[12px] font-bold text-slate-500 mb-1.5 uppercase ml-1">Phạm vi gửi</label>
                            <select value={form.target_type} onChange={handleChange("target_type")} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-semibold text-slate-800 outline-none">
                                <option value="all">Toàn bộ hệ thống</option>
                                <option value="property">Gửi theo Khu nhà</option>
                                <option value="room">Gửi theo Phòng</option>
                            </select>
                        </div>

                        {form.target_type === "property" && (
                            <div>
                                <label className="block text-[12px] font-bold text-slate-500 mb-1.5 uppercase ml-1">Chọn Khu nhà</label>
                                <select value={form.target_id} onChange={handleChange("target_id")} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-semibold text-slate-800 outline-none border-brand/30">
                                    <option value="">-- Chọn khu --</option>
                                    {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                        )}

                        {form.target_type === "room" && (
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase">Khu</label>
                                    <select value={selectedPropertyForRoom} onChange={(e) => setSelectedPropertyForRoom(e.target.value)} className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[12px] font-semibold outline-none">
                                        <option value="">--</option>
                                        {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div className="flex-[1.5]">
                                    <label className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase">Phòng</label>
                                    <select disabled={!selectedPropertyForRoom} value={form.target_id} onChange={handleChange("target_id")} className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[12px] font-semibold outline-none disabled:opacity-50">
                                        <option value="">--</option>
                                        {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Vùng Editor */}
                    <div className="flex-1 flex flex-col min-h-[350px]">
                        <label className="block text-[13px] font-bold text-slate-700 mb-1.5 ml-1">Nội dung thông báo <span className="text-red-500">*</span></label>
                        <div className="flex-1 rounded-xl overflow-hidden border border-slate-200 bg-white">
                            <JoditEditor
                                ref={editor}
                                value={form.content}
                                config={config}
                                onBlur={newContent => setForm(prev => ({ ...prev, content: newContent }))}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer - Cập nhật Responsive theo yêu cầu */}
                <div className="border-t border-slate-200 p-4 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white shrink-0">
                    {/* Nút Hủy: Trên Mobile nằm dưới cùng (row 2), trên PC nằm bên trái */}
                    <button 
                        type="button" 
                        onClick={onClose} 
                        disabled={isSubmitting} 
                        className="order-2 sm:order-1 w-full sm:w-auto px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-[13px] font-bold hover:bg-slate-200 transition-colors whitespace-nowrap text-center"
                    >
                        Hủy bỏ
                    </button>
                    
                    {/* Hàng chứa Nháp & Đăng: Trên Mobile nằm hàng đầu (row 1), nháp ngắn đăng dài */}
                    <div className="order-1 sm:order-2 flex flex-row gap-2 w-full sm:w-auto items-center">
                        <button 
                            type="button" 
                            onClick={handleSubmit("draft")} 
                            disabled={isSubmitting} 
                            className="w-[35%] sm:w-auto px-3 sm:px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl text-[13px] font-bold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                        >
                            {isSubmitting && form.status === 'draft' ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-regular fa-floppy-disk"></i>}
                            Lưu nháp
                        </button>
                        <button 
                            type="button" 
                            onClick={handleSubmit("published")} 
                            disabled={isSubmitting} 
                            className="flex-1 sm:flex-none px-5 py-2.5 bg-brand text-white rounded-xl text-[13px] font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-brand/20 transition-colors whitespace-nowrap"
                        >
                            {isSubmitting && form.status === 'published' ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-paper-plane"></i>}
                            {form.status === 'published' && initialData ? 'Cập nhật nội dung' : 'Đăng thông báo'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}