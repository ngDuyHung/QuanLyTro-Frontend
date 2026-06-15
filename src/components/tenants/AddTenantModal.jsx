import React, { useState, useEffect } from 'react';

const initialForm = {
    full_name: "",
    phone: "",
    email: "",
    id_card_number: "",
};


export default function AddTenantModal({
    open,
    onClose,
    onSubmit,
    isSubmitting = false,
}) {
    const [form, setForm] = useState(initialForm);
    const [frontImage, setFrontImage] = useState(null);
    const [backImage, setBackImage] = useState(null);
    const [clientError, setClientError] = useState("");

    const [isAssignRoom, setIsAssignRoom] = useState(false);
    const [role, setRole] = useState("representative");
    const [isAutoAccount, setIsAutoAccount] = useState(false);


    useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }

        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);

    if (!open) return null;

    const handleChange = (field) => (event) => {
        setClientError("");

        setForm((prev) => ({
            ...prev,
            [field]: event.target.value,
        }));
    };

    const handleClose = () => {
        if (isSubmitting) return;

        setForm(initialForm);
        setFrontImage(null);
        setBackImage(null);
        setClientError("");
        onClose();
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        if (!form.full_name.trim()) {
            setClientError("Vui lòng nhập họ và tên khách thuê.");
            return;
        }

        if (!form.phone.trim()) {
            setClientError("Vui lòng nhập số điện thoại.");
            return;
        }

        if (!form.id_card_number.trim()) {
            setClientError("Vui lòng nhập số CCCD/CMND.");
            return;
        }

        const payload = new FormData();

        payload.append("full_name", form.full_name.trim());
        payload.append("phone", form.phone.trim());
        payload.append("email", form.email.trim());
        payload.append("id_card_number", form.id_card_number.trim());

        if (frontImage) {
            payload.append("id_card_front_image", frontImage);
        }

        if (backImage) {
            payload.append("id_card_back_image", backImage);
        }

        onSubmit(payload);
    };

    return (
        <div id="modal-add-tenant" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px] p-4 sm:p-6 overflow-hidden">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[1100px] flex flex-col h-[95vh] sm:h-auto sm:max-h-[95vh] overflow-hidden">

                {/* HEADER - Gắn sự kiện onClose vào nút X */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-white">
                    <h2 className="text-[18px] font-bold text-slate-800">Thêm khách thuê mới</h2>
                    <button type="button"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="text-slate-400 hover:text-slate-600 transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-50">
                        <i className="fa-solid fa-xmark text-[20px]"></i>
                    </button>
                </div>

                {/* BODY */}
                <div className="flex-1 overflow-y-auto no-scrollbar bg-white">
                    <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">

                        {/* CỘT TRÁI (7/12) */}
                        <div className="lg:col-span-7 flex flex-col gap-8">

                            {/* 1. Thông tin cá nhân */}
                            <div>
                                <div className="flex items-center gap-2.5 mb-4">
                                    <div className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-[12px] font-bold shrink-0">1</div>
                                    <h3 className="text-[15px] font-bold text-slate-800">Nhập thông tin cá nhân</h3>
                                </div>
                                {clientError && (
                                    <div className="mb-4 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-[13px]">
                                        {clientError}
                                    </div>
                                )}
                                {/* Khu vực Upload (Chỉ hiện khi chọn OCR) */}

                                <div className="bg-green-50/50 border border-green-100 text-green-700 px-4 py-3 rounded-lg text-[13px] flex items-start gap-3 mb-5">
                                    <i className="fa-solid fa-wand-magic-sparkles mt-0.5 text-green-500"></i>
                                    <p>Chụp rõ nét mặt trước và mặt sau CCCD để hệ thống tự động trích xuất thông tin.</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                    <label className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-brand hover:bg-green-50/30 transition-all group min-h-[140px]">
                                        <p className="text-[13px] font-semibold text-slate-700 mb-3 group-hover:text-brand transition-colors">Mặt trước CCCD</p>
                                        <div className="w-12 h-10 border border-slate-300 rounded flex items-center justify-center text-slate-400 mb-2 group-hover:border-brand group-hover:text-brand transition-colors relative">
                                            <i className="fa-regular fa-address-card text-xl"></i>
                                            <i className="fa-solid fa-user absolute text-[10px] right-2 bottom-2"></i>
                                        </div>
                                        <span className="text-[12px] text-slate-500 group-hover:text-brand transition-colors">Chụp hoặc tải ảnh lên</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(event) =>
                                                setFrontImage(event.target.files?.[0] || null)
                                            }
                                            className="hidden" accept="image/*" />
                                    </label>

                                    <label className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-brand hover:bg-green-50/30 transition-all group min-h-[140px]">
                                        <p className="text-[13px] font-semibold text-slate-700 mb-3 group-hover:text-brand transition-colors">Mặt sau CCCD</p>
                                        <div className="w-12 h-10 border border-slate-300 rounded flex items-center justify-center text-slate-400 mb-2 group-hover:border-brand group-hover:text-brand transition-colors relative">
                                            <i className="fa-regular fa-address-card text-xl"></i>
                                            <i className="fa-solid fa-qrcode absolute text-[10px] right-2 bottom-2"></i>
                                        </div>
                                        <span className="text-[12px] text-slate-500 group-hover:text-brand transition-colors">Chụp hoặc tải ảnh lên</span>
                                        <input type="file"
                                            accept="image/*"
                                            onChange={(event) =>
                                                setBackImage(event.target.files?.[0] || null)
                                            }
                                            className="hidden" accept="image/*" />
                                    </label>
                                </div>

                                {/* Form Nhập Liệu */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-5">
                                    <div className="sm:col-span-1">
                                        <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Họ và tên <span className="text-red-500">*</span></label>
                                        <input type="text"
                                            value={form.full_name}
                                            onChange={handleChange("full_name")}
                                            placeholder="Nhập họ và tên" className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all" />
                                    </div>

                                    <div className="sm:col-span-1">
                                        <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Số điện thoại <span className="text-red-500">*</span></label>
                                        <input type="text"
                                            value={form.phone}
                                            onChange={handleChange("phone")}
                                            placeholder="Nhập số điện thoại" className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all" />
                                    </div>
                                    <div className="sm:col-span-1">
                                        <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Email <span className="text-red-500">*</span></label>
                                        <input
                                            type="email"
                                            value={form.email}
                                            onChange={handleChange("email")}
                                            placeholder="VD: khachthue@gmail.com"
                                            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                                        />  </div>

                                    <div className="sm:col-span-1">
                                        <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Số CCCD <span className="text-red-500">*</span></label>
                                        <input type="text"
                                            value={form.id_card_number}
                                            onChange={handleChange("id_card_number")}
                                            placeholder="Nhập số CCCD" className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all" />
                                    </div>

                                    <div className="sm:col-span-1">
                                        <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Ngày sinh</label>
                                        <div className="relative">
                                            <input type="text" placeholder="dd/mm/yyyy" className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all" />
                                            <i className="fa-regular fa-calendar absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"></i>
                                        </div>
                                    </div>

                                    <div className="sm:col-span-1">
                                        <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Giới tính</label>
                                        <div className="relative">
                                            <select className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand appearance-none cursor-pointer transition-all">
                                                <option value="">Chọn giới tính</option>
                                                <option value="male">Nam</option>
                                                <option value="female">Nữ</option>
                                            </select>
                                            <i className="fa-solid fa-angle-down absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[12px] pointer-events-none"></i>
                                        </div>
                                    </div>


                                    <div className="sm:col-span-3">
                                        <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Địa chỉ thường trú</label>
                                        <input type="text" placeholder="Nhập địa chỉ thường trú (số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố)" className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all" />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Nơi cấp CCCD (Cục/Phòng Công an)</label>
                                        <input type="text" placeholder="Nhập nơi cấp" className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all" />
                                    </div>

                                    <div className="sm:col-span-1">
                                        <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Ngày cấp CCCD</label>
                                        <div className="relative">
                                            <input type="text" placeholder="dd/mm/yyyy" className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all" />
                                            <i className="fa-regular fa-calendar absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="h-px w-full bg-slate-100"></div>

                            {/* 2. Thông tin lưu trú */}
                            <div>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-[12px] font-bold shrink-0">2</div>
                                        <h3 className="text-[15px] font-bold text-slate-800">Thông tin lưu trú <span className="text-slate-400 font-normal text-[13px]">(tùy chọn)</span></h3>
                                    </div>

                                    {/* Công tắc Gắn khách vào phòng */}
                                    <label className="flex items-center gap-3 cursor-pointer ml-8 sm:ml-0">
                                        <span className="text-[13px] font-semibold text-slate-700">Gắn khách này vào phòng ngay</span>
                                        <div className="relative">
                                            <input type="checkbox" checked={isAssignRoom} onChange={() => setIsAssignRoom(!isAssignRoom)} className="sr-only peer" />
                                            <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-brand after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-[18px] after:w-[18px] after:transition-all"></div>
                                        </div>
                                    </label>
                                </div>

                                {/* Nếu công tắc bật thì mới hiện Form chọn phòng */}
                                {isAssignRoom ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                                        <div>
                                            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Khu nhà</label>
                                            <select className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] outline-none focus:border-brand">
                                                <option>Khu A</option>
                                                <option>Khu B</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Phòng</label>
                                            <select className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] outline-none focus:border-brand">
                                                <option>Phòng 101 (25 m²)</option>
                                                <option>Phòng 102 (22 m²)</option>
                                            </select>
                                        </div>

                                        {/* Thêm ô Chọn Hợp Đồng dành riêng cho Khách Đại Diện */}
                                        {role === "representative" && (
                                            <div className="sm:col-span-2 p-3 bg-brand/5 border border-brand/20 rounded-lg flex flex-col gap-2 mt-2">
                                                <label className="block text-[12px] font-bold text-brand">Hợp đồng thuê phòng (Tùy chọn)</label>
                                                <select className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-[13px] outline-none focus:border-brand">
                                                    <option value="">-- Tạo hợp đồng mới sau --</option>
                                                    <option value="HD001">Hợp đồng HD00123</option>
                                                </select>
                                                <span className="text-[11px] text-slate-500">Tạo hợp đồng mới hoặc chọn hợp đồng đã có trong phòng.</span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="bg-[#f4f7fe] border border-blue-100 text-blue-700 px-4 py-3.5 rounded-lg text-[13px] flex items-center gap-3">
                                        <i className="fa-solid fa-circle-info text-blue-500"></i>
                                        <p>Bạn có thể lưu hồ sơ trước, sau đó gắn vào phòng khi cần.</p>
                                    </div>
                                )}
                            </div>

                        </div>

                        {/* CỘT PHẢI (5/12) */}
                        <div className="lg:col-span-5 flex flex-col gap-6">

                            {/* 3. Tài khoản người thuê */}
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 shadow-sm h-full flex flex-col">
                                <div className="flex items-center gap-2.5 mb-4">
                                    <div className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-[12px] font-bold shrink-0">3</div>
                                    <h3 className="text-[15px] font-bold text-slate-800">Tài khoản người thuê</h3>
                                </div>

                                <div className="mb-5">
                                    <p className="text-[13px] font-bold text-slate-800 mb-3">Vai trò trong phòng</p>
                                    <div className="flex flex-col gap-3">

                                        {/* Nút Radio Khách Đại Diện */}
                                        <label className={`relative border rounded-xl p-4 cursor-pointer transition-all ${role === 'representative' ? 'border-brand bg-green-50/30' : 'border-slate-200 hover:border-brand/30 bg-white'}`}>
                                            <input type="radio" name="role" checked={role === 'representative'} onChange={() => handleRoleChange('representative')} className="absolute top-4 left-4 w-4 h-4 text-brand focus:ring-brand border-slate-300" />
                                            <div className="ml-7">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[14px] font-bold text-slate-800">Khách đại diện</span>
                                                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Khuyên dùng</span>
                                                </div>
                                                <p className="text-[12px] text-slate-500 leading-relaxed">Người đứng tên hợp đồng, nhận hóa đơn và thanh toán</p>
                                            </div>
                                        </label>

                                        {/* Nút Radio Người Ở Ghép */}
                                        <label className={`relative border rounded-xl p-4 cursor-pointer transition-all ${role === 'roommate' ? 'border-blue-500 bg-blue-50/30' : 'border-slate-200 hover:border-blue-300 bg-white'}`}>
                                            <input type="radio" name="role" checked={role === 'roommate'} onChange={() => handleRoleChange('roommate')} className="absolute top-4 left-4 w-4 h-4 text-brand focus:ring-brand border-slate-300" />
                                            <div className="ml-7">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[14px] font-semibold text-slate-800">Người ở ghép</span>
                                                </div>
                                                <p className="text-[12px] text-slate-500 leading-relaxed">Thành viên ở chung, chỉ dùng để quản lý nhân khẩu</p>
                                            </div>
                                        </label>

                                    </div>
                                </div>

                                {/* Công tắc Tự Cấp Tài Khoản */}
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[13px] font-bold text-slate-800">Tự cấp tài khoản cho khách</span>
                                    <label className="relative cursor-pointer">
                                        <input type="checkbox" checked={isAutoAccount} onChange={() => setIsAutoAccount(!isAutoAccount)} disabled={role === 'roommate'} className="sr-only peer" />
                                        <div className={`w-10 h-5.5 rounded-full peer peer-focus:outline-none peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-[18px] after:w-[18px] after:transition-all ${role === 'roommate' ? 'bg-slate-200 cursor-not-allowed' : 'bg-slate-200 peer-checked:bg-brand'}`}></div>
                                    </label>
                                </div>

                                {/* Hiển thị thông báo tuỳ theo Vai Trò */}
                                {role === 'roommate' ? (
                                    <div className="bg-orange-50 border border-orange-100 p-3.5 rounded-xl text-[13px] text-orange-800 flex items-start gap-3 mt-auto">
                                        <i className="fa-solid fa-circle-exclamation mt-0.5 text-orange-500 shrink-0"></i>
                                        <div className="leading-relaxed">
                                            <p className="font-semibold mb-0.5">Người ở ghép không được cấp tài khoản.</p>
                                            <p>Chỉ dùng để quản lý nhân khẩu và tính định mức nước.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-white border border-green-100 shadow-sm p-4 rounded-xl text-[13px] text-slate-700 mb-4">
                                        <p className="font-medium text-slate-600 mb-2">Hệ thống sẽ:</p>
                                        <ul className="space-y-2">
                                            <li className="flex items-start gap-2">
                                                <i className="fa-solid fa-check text-green-500 mt-1 shrink-0 text-[11px]"></i>
                                                <span>Kiểm tra SĐT đã có tài khoản chưa</span>
                                            </li>
                                            <li className="flex items-start gap-2 pl-5">
                                                <div className="w-1 h-1 rounded-full bg-slate-400 mt-2 shrink-0"></div>
                                                <span className="text-slate-600">Nếu chưa: tự động tạo tài khoản mới</span>
                                            </li>
                                            <li className="flex items-start gap-2 pl-5">
                                                <div className="w-1 h-1 rounded-full bg-slate-400 mt-2 shrink-0"></div>
                                                <span className="text-slate-600">Nếu đã có: liên kết với hồ sơ này</span>
                                            </li>
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* 4. Ghi chú */}
                            <div className="bg-white">
                                <div className="flex items-center gap-2.5 mb-3">
                                    <div className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-[12px] font-bold shrink-0">4</div>
                                    <h3 className="text-[14px] font-bold text-slate-800">Ghi chú <span className="text-slate-400 font-normal text-[12px]">(tùy chọn)</span></h3>
                                </div>
                                <div className="relative">
                                    <textarea placeholder="Nhập ghi chú thêm về khách thuê..." className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-800 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all resize-none min-h-[120px]"></textarea>
                                    <span className="absolute bottom-3 right-3 text-[11px] text-slate-400">0/300</span>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* FOOTER - Gắn sự kiện onClose vào nút Hủy */}
                <div className="border-t border-slate-100 px-6 py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 shrink-0 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
                    <button type="button" onClick={handleClose} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-[13px] font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto">
                        <i className="fa-solid fa-xmark text-[14px]"></i> Hủy
                    </button>

                    <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-6 py-2.5 bg-brand text-white rounded-lg text-[13px] font-semibold hover:bg-green-700 disabled:opacity-60 flex items-center gap-2"
                    >
                        {isSubmitting && (
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        )}
                        Lưu khách thuê
                    </button>
                </div>

            </div>
        </div>
    );
}