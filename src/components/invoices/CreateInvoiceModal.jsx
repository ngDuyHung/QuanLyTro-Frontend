import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import leasesService from "@/services/leasesService";
import invoiceService from "@/services/invoiceService";
import utilityService from "@/services/utilityService";

const initialForm = {
    property_id: "",
    lease_id: "",
    period_from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
    period_to: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10),
    issue_date: new Date().toISOString().slice(0, 10),
    due_date: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
    note: "",
};

export default function CreateInvoiceModal({
    open,
    onClose,
    properties = [],
    onSuccess,
    defaultRoom = null
}) {
    const [form, setForm] = useState(initialForm);
    const [leases, setLeases] = useState([]);
    const [isLoadingLeases, setIsLoadingLeases] = useState(false);
    const [isPreparing, setIsPreparing] = useState(false);
    // Đổi state isSubmitting thành lưu tên action đang chạy ('draft' hoặc 'issue') để hiển thị loading đúng nút
    const [submitAction, setSubmitAction] = useState(null);
    const [clientError, setClientError] = useState("");
    const [rent, setRent] = useState({ price: 0 });
    const [electricity, setElectricity] = useState({
        prev: "", current: "", price: 0, free: 0, image: null, preview: "", is_chot_roi: false
    });
    const [water, setWater] = useState({
        prev: "", current: "", price: 0, free: 0, image: null, preview: "", is_chot_roi: false
    });
    const [dynamicItems, setDynamicItems] = useState([]);
    const [zoomImage, setZoomImage] = useState(null);

    useEffect(() => {
        return () => {
            if (electricity.preview) URL.revokeObjectURL(electricity.preview);
            if (water.preview) URL.revokeObjectURL(water.preview);
        };
    }, [electricity.preview, water.preview]);

    useEffect(() => {
        if (open) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "";
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    useEffect(() => {
        if (open) {
            // --- TÍNH TOÁN NGÀY TỰ ĐỘNG CHUẨN UX ---
            const today = new Date();
            let fromDate, toDate, dueDate;

            // Kiểm tra xem phòng có cấu hình ngày thu tiền không (billing_day)
            const billingDay = defaultRoom ? parseInt(defaultRoom.billing_day, 10) : null;

            if (billingDay && !isNaN(billingDay) && billingDay > 0) {
                // TRƯỜNG HỢP 1: Lấy theo ngày thanh toán của phòng
                fromDate = new Date(today.getFullYear(), today.getMonth(), billingDay);

                // Lấy ngày này ở tháng sau rồi TRỪ ĐI 1 NGÀY (Ví dụ: Từ ngày 05/08 đến ngày 04/09)
                toDate = new Date(today.getFullYear(), today.getMonth() + 1, billingDay);
                toDate.setDate(toDate.getDate() - 1);
            } else {
                // TRƯỜNG HỢP 2: Mặc định lấy ngày hiện tại và tính tròn 1 tháng
                fromDate = new Date();

                // Tính ngày này ở tháng sau rồi TRỪ ĐI 1 NGÀY (Ví dụ: Từ ngày 07/08 đến ngày 06/09)
                toDate = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
                toDate.setDate(toDate.getDate() - 1);
            }

            // Hạn thanh toán: Bằng ngày kết thúc ("Đến ngày") cộng thêm 10 ngày
            dueDate = new Date(toDate.getTime());
            dueDate.setDate(dueDate.getDate() + 10);

            // Cập nhật vào form
            setForm({
                ...initialForm,
                property_id: defaultRoom ? defaultRoom.property_id : "",
                period_from: fromDate.toISOString().slice(0, 10),
                period_to: toDate.toISOString().slice(0, 10),
                due_date: dueDate.toISOString().slice(0, 10),
            });

            // Reset các state phụ khác (Giữ nguyên phần cũ của bạn)
            setLeases([]);
            setRent({ price: 0 });
            setElectricity({ prev: "", current: "", price: 0, free: 0, image: null, preview: "", is_chot_roi: false });
            setWater({ prev: "", current: "", price: 0, free: 0, image: null, preview: "", is_chot_roi: false });
            setDynamicItems([]);
            setClientError("");
            setSubmitAction(null);
        }
    }, [open, defaultRoom]);

    useEffect(() => {
        if (!open || !form.property_id) {
            setLeases([]);
            return;
        }
        const fetchLeases = async () => {
            try {
                setIsLoadingLeases(true);
                const response = await leasesService.getAll({
                    property_id: form.property_id,
                    status: "active",
                    per_page: 100,
                });

                const fetchedLeases = response.data.data || [];
                setLeases(fetchedLeases);

                // --- BỔ SUNG LOGIC AUTO-FILL ---
                // Khi đã tải xong danh sách Hợp đồng, tìm Hợp đồng thuộc phòng defaultRoom
                if (defaultRoom) {
                    const matchedLease = fetchedLeases.find(l => String(l.room_id) === String(defaultRoom.id));
                    if (matchedLease) {
                        setForm(prev => ({ ...prev, lease_id: matchedLease.id }));
                    }
                }
            } catch (error) {
                setClientError("Lỗi tải danh sách phòng.");
            } finally {
                setIsLoadingLeases(false);
            }
        };
        fetchLeases();
    }, [open, form.property_id]);

    useEffect(() => {
        if (!open || !form.lease_id || !form.period_to) return;

        const fetchPrepareData = async () => {
            try {
                setIsPreparing(true);
                const res = await invoiceService.prepareData({
                    lease_id: form.lease_id,
                    period_to: form.period_to,
                });

                const data = res.data.data;
                console.log("Prepare Data:", data);
                let tempRent = 0;
                let tempElec = { prev: "", current: "", price: 0, free: 0, image: null, preview: "", is_chot_roi: false };
                let tempWater = { prev: "", current: "", price: 0, free: 0, image: null, preview: "", is_chot_roi: false };
                let tempDynamics = [];

                data.suggested_items.forEach((item, index) => {
                    // 1. Ghi nhận tiền phòng
                    if (item.charge_type === 'room') {
                        tempRent = item.unit_price_snapshot;
                    }
                    // 2. Xử lý logic Điện (Đọc trực tiếp từ cấu trúc Backend, không dùng Regex)
                    else if (item.charge_type === 'electricity') {
                        tempElec.prev = item.previous_reading ?? "";
                        tempElec.current = item.current_reading ?? "";
                        tempElec.price = item.unit_price_snapshot;
                        tempElec.free = item.free_quantity_snapshot || 0;
                        tempElec.is_chot_roi = item.is_chot_roi;
                    }
                    // 3. Xử lý logic Nước
                    else if (item.charge_type === 'water') {
                        tempWater.prev = item.previous_reading ?? "";
                        tempWater.current = item.current_reading ?? "";
                        tempWater.price = item.unit_price_snapshot;
                        tempWater.free = item.free_quantity_snapshot || 0;
                        tempWater.is_chot_roi = item.is_chot_roi;
                    }
                    // 4. Các dịch vụ phụ trợ còn lại (rác, wifi...)
                    else {
                        tempDynamics.push({
                            id: Date.now() + index,
                            charge_type: item.charge_type,
                            description: item.description,
                            quantity: item.quantity,
                            unit_price_snapshot: item.unit_price_snapshot,
                            unit: item.unit || "Tháng/Lần"
                        });
                    }
                });

                // Cập nhật State 1 lần duy nhất
                setRent({ price: tempRent });
                setElectricity(tempElec);
                setWater(tempWater);
                setDynamicItems(tempDynamics);

            } catch (error) {
                console.error("Lỗi Prepare:", error);
                setClientError("Không thể tải dữ liệu gợi ý hóa đơn.");
            } finally {
                setIsPreparing(false);
            }
        };

        const timeout = setTimeout(fetchPrepareData, 300);
        return () => clearTimeout(timeout);
    }, [open, form.lease_id, form.period_to]);

    const handleChange = (field) => (e) => {
        setForm(prev => ({ ...prev, [field]: e.target.value, ...(field === "property_id" ? { lease_id: "" } : {}) }));
    };

    const handleUtilityChange = (type, field, value) => {
        const setter = type === 'electricity' ? setElectricity : setWater;
        setter(prev => ({ ...prev, [field]: value }));
    };

    const handleImageChange = (type) => (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const setter = type === 'electricity' ? setElectricity : setWater;

        setter(prev => {
            if (prev.preview) URL.revokeObjectURL(prev.preview);
            return { ...prev, image: file, preview: URL.createObjectURL(file) };
        });
        event.target.value = "";
    };
    const handleRemoveImage = (type) => {
        const setter = type === 'electricity' ? setElectricity : setWater;
        setter(prev => {
            if (prev.preview) URL.revokeObjectURL(prev.preview);
            return { ...prev, image: null, preview: "" };
        });
    };
    const handleAddDynamicItem = () => {
        setDynamicItems(prev => [
            ...prev,
            { id: Date.now(), charge_type: "other", description: "", quantity: 1, unit_price_snapshot: 0, unit: "Lần" }
        ]);
    };

    const handleUpdateDynamicItem = (id, field, value) => {
        setDynamicItems(prev => prev.map(item => {
            if (item.id === id) {
                let newItem = { ...item, [field]: value };

                // Tự động điền mô tả ngầm nếu user đổi Select (để vượt qua validate Backend)
                if (field === 'charge_type') {
                    if (value === 'garbage') newItem.description = 'Tiền rác';
                    else if (value === 'internet') newItem.description = 'Internet / Wifi';
                    else if (value === 'deposit') newItem.description = 'Tiền cọc / Thế chân';
                    else if (value === 'discount') newItem.description = ''; // BỔ SUNG
                    else if (value === 'surcharge') newItem.description = 'Phụ thu'; // BỔ SUNG
                    else if (value === 'damage_fee') newItem.description = 'Phí hư hỏng'; // BỔ SUNG
                    else if (value === 'other') newItem.description = ''; // Nếu chọn khác thì xóa trống cho user tự nhập
                }
                return newItem;
            }
            return item;
        }));
    };

    const handleRemoveDynamicItem = (id) => {
        setDynamicItems(prev => prev.filter(item => item.id !== id));
    };

    // Tính tổng tiền an toàn với Number()
    const elecUsage = Math.max(0, (Number(electricity.current) || 0) - (Number(electricity.prev) || 0));
    const elecBillable = Math.max(0, elecUsage - (Number(electricity.free) || 0));
    const elecAmount = elecBillable * (Number(electricity.price) || 0);

    const waterUsage = Math.max(0, (Number(water.current) || 0) - (Number(water.prev) || 0));
    const waterBillable = Math.max(0, waterUsage - (Number(water.free) || 0));
    const waterAmount = waterBillable * (Number(water.price) || 0);

    const dynamicAmount = dynamicItems.reduce((sum, item) => {
        const amount = (Number(item.quantity) || 0) * (Number(item.unit_price_snapshot) || 0);
        return item.charge_type === 'discount' ? sum - amount : sum + amount;
    }, 0);

    const totalAmount = (Number(rent.price) || 0) + elecAmount + waterAmount + dynamicAmount;

    // --- SUBMIT VỚI 2 ACTION KHÁC NHAU ---
    const handleSubmit = async (actionType) => {
        setClientError("");

        if (!form.lease_id) return setClientError("Vui lòng chọn Phòng (Hợp đồng).");
        if (new Date(form.period_to) <= new Date(form.period_from)) return setClientError("Ngày kết thúc kỳ phải sau ngày bắt đầu.");

        try {
            setSubmitAction(actionType); // Bật loading theo action (draft hoặc issue)

            // Bước 1: Chốt điện nước ngầm
            const processUtility = async (utilityState, typeStr) => {
                if (!utilityState.is_chot_roi && utilityState.current !== "") {
                    const fd = new FormData();
                    fd.append("lease_id", form.lease_id);
                    fd.append("type", typeStr);
                    fd.append("current_reading", utilityState.current);
                    fd.append("reading_date", form.period_to);
                    if (utilityState.image) fd.append("meter_image", utilityState.image);
                    await utilityService.create(fd);
                }
            };

            await Promise.all([
                processUtility(electricity, 'electricity'),
                processUtility(water, 'water')
            ]);

            // Tính toán số lượng sử dụng
            const elecUsage = Number(electricity.current) - Number(electricity.prev);
            const waterUsage = Number(water.current) - Number(water.prev);

            // Bước 2: Tạo hóa đơn
            const items = [];
            items.push({ charge_type: "room", description: "Tiền phòng", unit: "Tháng", quantity: 1, unit_price_snapshot: rent.price });

            // Sửa thành >= 0 và nâng cấp phần description
            if (elecUsage >= 0 && electricity.current !== "") {
                items.push({
                    charge_type: "electricity",
                    description: `Tiền điện ( ${electricity.prev} - ${electricity.current})`,
                    unit: "kWh",
                    quantity: elecUsage,
                    unit_price_snapshot: electricity.price,
                    free_quantity_snapshot: electricity.free
                });
            }

            if (waterUsage >= 0 && water.current !== "") {
                items.push({
                    charge_type: "water",
                    description: `Tiền nước (${water.prev} - ${water.current})`,
                    unit: "m³",
                    quantity: waterUsage,
                    unit_price_snapshot: water.price,
                    free_quantity_snapshot: water.free
                });
            }

            // -- LẤY CÁC DỊCH VỤ KHÁC --
            dynamicItems.forEach(item => {
                if (item.description && item.unit_price_snapshot >= 0) { //  >= 0 để lỡ có dịch vụ giá 0đ vẫn hiện
                    items.push({
                        charge_type: item.charge_type,
                        description: item.description,
                        unit: item.unit || (item.charge_type === 'discount' ? 'Lần' : 'Tháng/Lần'),
                        quantity: Number(item.quantity) || 1,
                        unit_price_snapshot: Number(item.unit_price_snapshot),
                    });
                }
            });

            const payload = {
                lease_id: form.lease_id,
                invoice_type: "monthly",
                period_from: form.period_from,
                period_to: form.period_to,
                issue_date: form.issue_date,
                due_date: form.due_date,
                note: form.note,
                items: items
            };

            const response = await invoiceService.create(payload);
            const newInvoiceId = response.data.data.id;

            // Bước 3: Nếu là nút "Lưu & Phát hành", gọi API Phát hành ngay
            if (actionType === 'issue') {
                await invoiceService.issue(newInvoiceId);
                toast.success("Đã tạo và phát hành hóa đơn thành công!");
            } else {
                toast.success("Đã lưu nháp hóa đơn thành công!");
            }

            onSuccess?.();
            onClose();

        } catch (error) {
            setClientError(error.response?.data?.message || "Có lỗi xảy ra khi tạo hóa đơn.");
        } finally {
            setSubmitAction(null);
        }
    };

    /* --- BỘ PHÓNG TO ẢNH (LIGHTBOX OVERLAY) KHI NHẤN VÀO HÌNH --- */
    if (zoomImage) {
        return (
            <div
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 animate-[fadeIn_0.15s_ease-out] cursor-zoom-out"
                onClick={() => setZoomImage(null)}
            >
                <div className="relative max-w-full max-h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                    <img
                        src={zoomImage}
                        alt="Zoomed reading"
                        className="max-w-[95vw] max-h-[85vh] object-contain rounded-xl shadow-2xl border border-white/10"
                    />
                    {/* Nút đóng chế độ xem ảnh */}
                    <button
                        type="button"
                        onClick={() => setZoomImage(null)}
                        className="absolute -top-12 right-0 lg:-right-10 w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 active:scale-95 transition-transform text-[18px]"
                    >
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>
            </div>
        );
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4 transition-all">
            <div className="bg-slate-50 w-full h-[95vh] sm:h-auto sm:max-h-[90vh] sm:max-w-[900px] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out] sm:animate-[fadeIn_0.2s_ease-out] relative">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-white shrink-0 sticky top-0 z-20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand shrink-0">
                            <i className="fa-solid fa-file-invoice-dollar text-[18px]"></i>
                        </div>
                        <div>
                            <h2 className="text-[17px] sm:text-[19px] font-bold text-slate-800">Lập hóa đơn mới</h2>
                            <p className="text-[12px] text-slate-500 mt-0.5 hidden sm:block">Hệ thống sẽ tự động tổng hợp phí dịch vụ phát sinh trong kỳ.</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} disabled={!!submitAction} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                {/* Sửa form thành không onSubmit để xử lý click 2 nút riêng biệt */}
                <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
                    <div className="overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex-1 pb-6 bg-slate-50">

                        {clientError && (
                            <div className="mx-5 mt-4 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-[13px] flex items-center gap-2">
                                <i className="fa-solid fa-circle-exclamation"></i> {clientError}
                            </div>
                        )}

                        {/* SECTION 1: Thông tin chung */}
                        <div className="bg-white px-5 py-5 border-b border-slate-200 mt-4">
                            <h3 className="text-[14px] font-bold text-brand mb-4 flex items-center gap-2"><i className="fa-solid fa-circle-info text-[13px]"></i> 1. Thông tin chung</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="sm:col-span-1">
                                    <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Khu nhà <span className="text-red-500">*</span></label>
                                    <select value={form.property_id} onChange={handleChange("property_id")} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] outline-none focus:border-brand">
                                        <option value="">Chọn khu nhà</option>
                                        {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Phòng đang thuê <span className="text-red-500">*</span></label>
                                    <select value={form.lease_id} onChange={handleChange("lease_id")} disabled={!form.property_id || isLoadingLeases} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] outline-none focus:border-brand disabled:opacity-60">
                                        <option value="">{isLoadingLeases ? "Đang tải..." : "Chọn phòng"}</option>
                                        {leases.map(l => <option key={l.id} value={l.id}>{l.room?.name} - Khách: {l.tenant?.full_name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Kỳ HĐ: Từ ngày <span className="text-red-500">*</span></label>
                                    <input type="date" value={form.period_from} onChange={handleChange("period_from")} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] outline-none focus:border-brand" />
                                </div>
                                <div>
                                    <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Kỳ HĐ: Đến ngày <span className="text-red-500">*</span></label>
                                    <input type="date" value={form.period_to} onChange={handleChange("period_to")} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] outline-none focus:border-brand" />
                                </div>
                                <div>
                                    <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Hạn thanh toán</label>
                                    <input type="date" value={form.due_date} onChange={handleChange("due_date")} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] outline-none focus:border-brand" />
                                </div>
                            </div>
                        </div>

                        {/* SECTION 2: Các khoản phí cố định */}
                        <div className="bg-white px-4 sm:px-5 py-5 border-b border-slate-200 mt-2 relative">
                            {isPreparing && <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex items-center justify-center"><span className="animate-pulse text-brand font-semibold text-[13px]">Đang đồng bộ dữ liệu...</span></div>}

                            {/* Tiêu đề phần 2 & Công thức tổng quát đặt gọn gàng ở đây */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                                <h3 className="text-[14px] font-bold text-brand flex items-center gap-2">
                                    <i className="fa-solid fa-money-bill text-[13px]"></i> 2. Phí cố định (Phòng, Điện, Nước)
                                </h3>
                                {/* Dòng chú thích công thức tinh gọn, ẩn trên mobile nếu quá chật hoặc giữ chữ nhỏ */}
                                <div className="text-[11px] text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg flex items-center gap-1.5 border border-slate-200 w-fit">
                                    <i className="fa-solid fa-calculator text-slate-400"></i>
                                    <span>Công thức: <span className="font-mono text-slate-700">(Số mới - Số cũ - Miễn phí) × Đơn giá</span></span>
                                </div>
                            </div>
                            {/* Tiền phòng */}
                            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 lg:gap-4 bg-white lg:bg-slate-50 p-3 rounded-xl border border-slate-200 mb-3">
                                <div className="flex justify-between items-center lg:w-[120px] shrink-0 border-b border-slate-100 lg:border-0 pb-1.5 lg:pb-0">
                                    <div className="font-bold text-[14px] lg:text-[13px] text-slate-700 flex items-center">
                                        <i className="fa-solid fa-house fa-fw text-brand mr-2 lg:mr-1 text-[15px] lg:text-[14px]"></i> Tiền phòng
                                    </div>
                                    <div className="lg:hidden text-[14px] font-black text-brand">
                                        {Number(rent.price).toLocaleString()} đ
                                    </div>
                                </div>
                                <div className="flex-1 relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] lg:text-[12px] text-slate-400 pointer-events-none">Giá phòng</span>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={rent.price === 0 ? "" : Number(rent.price).toLocaleString("vi-VN")}
                                        placeholder="0"
                                        onChange={(e) => {
                                            const rawValue = e.target.value.replace(/[^\d]/g, "");
                                            setRent({ price: rawValue ? Number(rawValue) : 0 });
                                        }}
                                        className="w-full pl-[72px] pr-3 py-2 border border-slate-200 rounded-lg text-[13px] font-semibold focus:border-brand outline-none transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Điện Nước Row */}
                            {[
                                { type: 'electricity', label: 'Tiền điện', icon: 'fa-bolt', unit: 'kWh', state: electricity },
                                { type: 'water', label: 'Tiền nước', icon: 'fa-droplet', unit: 'm³', state: water }
                            ].map((item) => {
                                const usage = Math.max(0, (Number(item.state.current) || 0) - (Number(item.state.prev) || 0));
                                const billable = Math.max(0, usage - (Number(item.state.free) || 0));
                                const amount = billable * (Number(item.state.price) || 0);

                                return (
                                    <div key={item.type} className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 lg:gap-4 bg-white lg:bg-slate-50 p-3 rounded-xl border border-slate-200 mb-3">

                                        {/* Tiêu đề dòng dịch vụ & Tổng tiền (Hiển thị trên Mobile) */}
                                        <div className="flex justify-between items-center lg:w-[120px] shrink-0 border-b border-slate-100 lg:border-0 pb-1.5 lg:pb-0">
                                            <div className="font-bold text-[14px] lg:text-[13px] text-slate-700 flex items-center">
                                                <i className={`fa-solid ${item.icon} fa-fw text-${item.type === 'electricity' ? 'amber' : 'blue'}-500 mr-2 lg:mr-1 text-[15px] lg:text-[14px]`}></i>
                                                {item.label}/{item.unit}
                                            </div>
                                            <div className="lg:hidden text-[14px] font-black text-brand">
                                                {amount.toLocaleString()} đ
                                            </div>
                                        </div>

                                        <div className="flex-1 flex flex-col lg:flex-row gap-3 w-full">

                                            {/* Lưới các ô Inputs: Chữ nhãn nằm hoàn toàn ĐẰNG TRONG ô input */}
                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 flex-1">
                                                {/* Ô Số cũ */}
                                                <div className="relative">
                                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 pointer-events-none">Số cũ</span>
                                                    <input
                                                        type="number"
                                                        disabled={item.state.is_chot_roi}
                                                        value={item.state.prev}
                                                        onChange={(e) => handleUtilityChange(item.type, 'prev', e.target.value)}
                                                        className="w-full pl-[46px] pr-2 py-2 lg:py-1.5 border border-slate-200 rounded-lg text-[13px] font-semibold focus:border-brand outline-none disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                                                    />
                                                </div>

                                                {/* Ô Số mới */}
                                                <div className="relative">
                                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 pointer-events-none">Số mới</span>
                                                    <input
                                                        type="number"
                                                        disabled={item.state.is_chot_roi}
                                                        value={item.state.current}
                                                        onChange={(e) => handleUtilityChange(item.type, 'current', e.target.value)}
                                                        className="w-full pl-[52px] pr-2 py-2 lg:py-1.5 border border-slate-200 rounded-lg text-[13px] font-semibold focus:border-brand outline-none disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                                                    />
                                                </div>

                                                {/* Ô Đơn giá */}
                                                <div className="relative">
                                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 pointer-events-none">Đơn giá</span>
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        value={item.state.price === 0 ? "" : Number(item.state.price).toLocaleString("vi-VN")}
                                                        placeholder="0"
                                                        onChange={(e) => {
                                                            const rawValue = e.target.value.replace(/[^\d]/g, "");
                                                            handleUtilityChange(item.type, 'price', rawValue ? Number(rawValue) : 0);
                                                        }}
                                                        className="w-full pl-[56px] pr-2 py-2 lg:py-1.5 border border-slate-200 rounded-lg text-[13px] font-semibold focus:border-brand outline-none transition-colors"
                                                    />
                                                </div>

                                                {/* Ô Miễn phí */}
                                                <div className="relative">
                                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-emerald-600 font-semibold pointer-events-none">Miễn phí</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={item.state.free}
                                                        onChange={(e) => handleUtilityChange(item.type, 'free', e.target.value)}
                                                        className="w-full pl-[62px] pr-2 py-2 lg:py-1.5 border border-emerald-200 bg-emerald-50 rounded-lg text-[13px] text-emerald-700 font-bold focus:border-emerald-500 outline-none transition-colors"
                                                    />
                                                </div>
                                            </div>

                                            {/* Khu vực Xử lý Ảnh Chốt số & Trạng thái Khóa */}
                                            <div className="flex items-center justify-between lg:justify-end gap-3 lg:w-[130px] shrink-0 pt-2 lg:pt-0 border-t border-dashed border-slate-100 lg:border-0">

                                                {!item.state.is_chot_roi ? (
                                                    item.state.preview ? (
                                                        /* KHI ĐÃ CÓ ẢNH: Giữ nguyên size w-full trên mobile và w-9 trên PC y hệt như lúc chưa thêm */
                                                        <div className="relative w-full lg:w-9 h-9 rounded-lg border border-slate-200 bg-slate-100 shrink-0">
                                                            <div
                                                                onClick={() => setZoomImage(item.state.preview)}
                                                                className="w-full h-full cursor-zoom-in relative group"
                                                                title="Bấm để xem phóng to"
                                                            >
                                                                <img src={item.state.preview} alt="preview" className="w-full h-full object-cover rounded-lg shadow-sm" />

                                                                {/* Lớp phủ mờ nhẹ gợi ý trên Mobile để biết là bấm vào phóng to được */}
                                                                <div className="absolute inset-0 bg-black/20 text-white rounded-lg flex items-center justify-center gap-1.5 lg:gap-0 text-[12px] font-medium lg:text-[0px]">
                                                                    <i className="fa-solid fa-magnifying-glass-plus text-[13px] lg:text-[11px]"></i>
                                                                    <span className="lg:hidden">Bấm để xem lại</span>
                                                                </div>
                                                            </div>

                                                            {/* Nút xóa ảnh góc phải trên cùng */}
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveImage(item.type)}
                                                                className="absolute -top-1.5 -right-1.5 w-5 h-5 lg:w-4 lg:h-4 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] lg:text-[9px] shadow-md cursor-pointer z-10 transition-transform active:scale-90"
                                                                title="Xóa ảnh"
                                                            >
                                                                <i className="fa-solid fa-xmark"></i>
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        /* KHI CHƯA CÓ ẢNH: Khung label mặc định */
                                                        <label className="w-full lg:w-9 h-9 rounded-lg border border-dashed border-slate-300 text-slate-500 hover:text-brand hover:border-brand hover:bg-brand/5 flex items-center justify-center gap-2 lg:gap-0 cursor-pointer transition-colors shrink-0 bg-slate-50 lg:bg-white" title="Chụp ảnh đồng hồ">
                                                            <i className="fa-solid fa-camera text-[14px] lg:text-[13px]"></i>
                                                            <span className="text-[12px] font-medium lg:hidden">Tải ảnh hóa đơn</span>
                                                            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange(item.type)} />
                                                        </label>
                                                    )
                                                ) : (
                                                    <div className="flex-1 lg:w-9 lg:h-9 flex items-center justify-center lg:justify-end gap-2 text-slate-400 bg-slate-50 lg:bg-transparent rounded-lg py-1.5 lg:py-0">
                                                        <i className="fa-solid fa-lock text-[12px]"></i>
                                                        <span className="text-[11px] italic lg:hidden">Đã chốt số kỳ này</span>
                                                    </div>
                                                )}

                                                {/* Thành tiền (Ẩn trên mobile vì đã đưa lên tiêu đề card dịch vụ phía trên) */}
                                                <div className="hidden lg:block text-[13px] font-bold text-slate-800 min-w-[80px] text-right truncate">
                                                    {amount.toLocaleString()} đ
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* SECTION 3: Dịch vụ khác & Giảm trừ */}
                        <div className="bg-white px-4 py-5 sm:px-5 border-b border-slate-200 mt-2">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-[14px] font-bold text-brand flex items-center gap-2">
                                    <i className="fa-solid fa-layer-group text-[13px]"></i> 3. Dịch vụ khác & Khấu trừ
                                </h3>
                                <button
                                    type="button"
                                    onClick={handleAddDynamicItem}
                                    className="text-[12px] font-bold text-brand hover:text-green-700 bg-brand/10 px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
                                >
                                    <i className="fa-solid fa-plus mr-1"></i>
                                    <span>Thêm</span>
                                    <span className="hidden sm:inline">&nbsp;khoản thu</span>
                                </button>
                            </div>

                            {dynamicItems.length === 0 ? (
                                <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-[12px] text-slate-400">
                                    Không có dịch vụ phát sinh thêm.
                                </div>
                            ) : (
                                /* Trên PC: Tạo một hàng Header giả lập làm tiêu đề cột cho thẳng hàng */
                                <div className="space-y-3 sm:space-y-0 sm:border sm:border-slate-200 sm:rounded-xl sm:overflow-hidden sm:bg-white">

                                    {/* Thanh tiêu đề cột (Chỉ hiển thị trên PC) */}
                                    <div className="hidden sm:flex items-center gap-4 bg-slate-50 px-4 py-2 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                                        <div className="w-[140px]">Loại khoản phí</div>
                                        <div className="flex-1">Tên hiển thị / Mô tả chi tiết</div>
                                        <div className="w-[70px] text-center">SL</div>
                                        <div className="w-[115px] text-right">Đơn giá</div>
                                        <div className="w-[115px] text-right">Thành tiền</div>
                                        <div className="w-8"></div> {/* Khoảng trống cho nút xóa */}
                                    </div>

                                    {/* Danh sách các dòng dịch vụ */}
                                    <div className="space-y-3 sm:space-y-0 sm:divide-y sm:divide-slate-100">
                                        {dynamicItems.map((item, index) => (
                                            <div
                                                key={item.id}
                                                className="bg-slate-50/70 sm:bg-transparent border border-slate-200 sm:border-0 p-3.5 sm:px-4 sm:py-3 rounded-xl sm:rounded-none flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 relative shadow-sm sm:shadow-none"
                                            >
                                                {/* 1. Loại dịch vụ & Nút xóa trên Mobile */}
                                                <div className="flex items-center justify-between gap-2 w-full sm:w-[140px] shrink-0">
                                                    <span className="text-[11px] font-bold text-slate-400 uppercase sm:hidden">Loại phí</span>
                                                    <select
                                                        value={item.charge_type}
                                                        onChange={(e) => handleUpdateDynamicItem(item.id, 'charge_type', e.target.value)}
                                                        className="w-[160px] sm:w-full p-2 bg-white border border-slate-200 rounded-lg text-[13px] outline-none focus:border-brand font-semibold text-slate-700 shadow-sm sm:shadow-none"
                                                    >
                                                        <option value="garbage">Tiền rác/tháng</option>
                                                        <option value="internet">Internet/tháng</option>
                                                        <option value="discount">Giảm trừ</option>
                                                        <option value="deposit">Cọc/thế chân</option>
                                                        <option value="other">Khác</option>
                                                    </select>

                                                    {/* Nút xóa nhanh góc phải trên Mobile (dễ bấm bằng ngón cái) */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveDynamicItem(item.id)}
                                                        className="sm:hidden w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center shrink-0 active:bg-red-100"
                                                    >
                                                        <i className="fa-solid fa-trash-can text-[13px]"></i>
                                                    </button>
                                                </div>

                                                {/* 2. Ô nhập mô tả: Luôn hiện trên PC. Trên mobile: chỉ ẩn đi đối với Rác/Internet cho gọn gàng */}
                                                <div className={`w-full sm:flex-1 flex-col gap-1 ${['garbage', 'internet'].includes(item.charge_type) ? 'hidden sm:flex' : 'flex'
                                                    }`}>
                                                    <span className="text-[11px] font-bold text-slate-400 uppercase sm:hidden">Ghi chú cụ thể</span>
                                                    <input
                                                        type="text"
                                                        placeholder="Ví dụ: Sửa bóng đèn phòng khách..."
                                                        value={item.description}
                                                        onChange={(e) => handleUpdateDynamicItem(item.id, 'description', e.target.value)}
                                                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[13px] outline-none focus:border-brand text-slate-700 placeholder:text-slate-400 shadow-sm sm:shadow-none"
                                                    />
                                                </div>

                                                {/* 3. Phần Số lượng, Đơn giá & Thành tiền (Xếp dạng lưới 3 cột trên Mobile, trải ngang cột trên PC) */}
                                                <div className="grid grid-cols-3 sm:flex sm:items-center gap-2 sm:gap-4 w-full sm:w-auto items-center pt-2.5 border-t border-dashed border-slate-200 sm:pt-0 sm:border-0">

                                                    {/* Ô Số lượng */}
                                                    <div className="flex flex-col gap-1 sm:w-[70px]">
                                                        <span className="text-[11px] font-bold text-slate-400 uppercase sm:hidden text-center">SL</span>
                                                        <input
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={(e) => handleUpdateDynamicItem(item.id, 'quantity', e.target.value)}
                                                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[13px] outline-none focus:border-brand text-center font-bold text-slate-700 shadow-sm sm:shadow-none"
                                                        />
                                                    </div>

                                                    {/* Ô Đơn giá */}
                                                    <div className="flex flex-col gap-1 sm:w-[115px]">
                                                        <span className="text-[11px] font-bold text-slate-400 uppercase sm:hidden text-right">Đơn giá</span>
                                                        <input
                                                            type="text"
                                                            inputMode="numeric"
                                                            value={item.unit_price_snapshot === 0 ? "" : Number(item.unit_price_snapshot).toLocaleString("vi-VN")}
                                                            placeholder="0"
                                                            onChange={(e) => {
                                                                const rawValue = e.target.value.replace(/[^\d]/g, "");
                                                                handleUpdateDynamicItem(item.id, 'unit_price_snapshot', rawValue ? Number(rawValue) : 0);
                                                            }}
                                                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[13px] outline-none focus:border-brand text-right font-bold text-slate-700 shadow-sm sm:shadow-none"
                                                        />
                                                    </div>

                                                    {/* Ô hiển thị Thành tiền */}
                                                    <div className="flex flex-col gap-1 items-end justify-center sm:w-[115px]">
                                                        <span className="text-[11px] font-bold text-slate-400 uppercase sm:hidden text-right">Thành tiền</span>
                                                        <div className={`text-[13px] font-black sm:text-right w-full text-right h-[38px] flex items-center justify-end ${item.charge_type === 'discount' ? 'text-red-500' : 'text-slate-700'}`}>
                                                            {item.charge_type === 'discount' ? '-' : ''}{((Number(item.quantity) || 0) * (Number(item.unit_price_snapshot) || 0)).toLocaleString()} đ
                                                        </div>
                                                    </div>

                                                    {/* Nút xóa trên màn hình PC */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveDynamicItem(item.id)}
                                                        className="hidden sm:flex w-8 h-8 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 items-center justify-center shrink-0 transition-colors"
                                                        title="Xóa khoản thu này"
                                                    >
                                                        <i className="fa-solid fa-trash-can text-[13px]"></i>
                                                    </button>
                                                </div>

                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* SECTION 4: Tổng kết & Ghi chú */}
                        <div className="px-5 py-5 mt-2 flex flex-col-reverse sm:flex-row gap-5 items-start">
                            <div className="w-full sm:w-1/2 bg-white p-4 rounded-xl border border-slate-200">
                                <label className="block text-[12px] font-semibold text-slate-700 mb-2">Ghi chú hóa đơn (Tùy chọn)</label>
                                <textarea value={form.note} onChange={handleChange("note")} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-[13px] outline-none focus:border-brand min-h-[100px] resize-none" placeholder="Nhập ghi chú..."></textarea>
                            </div>
                            <div className="w-full sm:w-1/2 bg-brand/5 border border-brand/20 p-4 rounded-xl">
                                <div className="flex justify-between items-center mb-2 text-[13px] text-slate-600">
                                    <span>Tổng các khoản phí cố định:</span>
                                    <span className="font-semibold">{((Number(rent.price) || 0) + elecAmount + waterAmount).toLocaleString()} đ</span>
                                </div>
                                <div className="flex justify-between items-center mb-2 text-[13px] text-slate-600">
                                    <span>Phát sinh / Giảm trừ:</span>
                                    <span className={`font-semibold ${dynamicAmount < 0 ? 'text-red-500' : ''}`}>{dynamicAmount.toLocaleString()} đ</span>
                                </div>
                                <div className="border-t border-brand/20 my-2 pt-2 flex justify-between items-center">
                                    <span className="text-[14px] font-bold text-slate-800">TỔNG CỘNG:</span>
                                    <span className="text-[20px] font-black text-brand">{totalAmount.toLocaleString()} đ</span>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Footer với các Nút Bấm đã tối ưu UX Mobile & Desktop */}
                    <div className="border-t border-slate-200 px-4 py-3.5 sm:px-5 bg-white shrink-0 sticky bottom-0 z-20 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">

                        {/* 1. NÚT HỦY (Chỉ hiển thị riêng ở Desktop - nằm bên trái) */}
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={!!submitAction}
                            className="hidden sm:block px-5 py-2.5 bg-slate-100 text-slate-600 rounded-lg text-[13px] font-semibold hover:bg-slate-200 w-auto text-center disabled:opacity-70 transition-colors"
                        >
                            Hủy
                        </button>

                        {/* 2. NHÓM NÚT HÀNH ĐỘNG CHÍNH */}
                        <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">

                            {/* NÚT LƯU & PHÁT HÀNH (Mobile: Đẩy lên hàng 1 bằng order-1 | Desktop: Đẩy ra sau bằng sm:order-2) */}
                            <button
                                type="button"
                                onClick={() => handleSubmit('issue')}
                                disabled={!!submitAction || isPreparing}
                                className="order-1 sm:order-2 px-6 py-2.5 bg-brand text-white rounded-lg text-[13px] font-semibold hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-70 shadow-sm shadow-brand/30 transition-colors w-full sm:w-auto"
                            >
                                {submitAction === 'issue' ? (
                                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Đang phát hành...</>
                                ) : (
                                    <><i className="fa-regular fa-paper-plane"></i> Lưu & Phát hành</>
                                )}
                            </button>

                            {/* Hàng 2 trên Mobile: Chứa nút [Hủy (nhỏ)] + [Lưu nháp (to hơn)] */}
                            <div className="order-2 sm:order-1 flex gap-2.5 w-full sm:w-auto">

                                {/* NÚT HỦY (Chỉ hiển thị ở Mobile - chiếm 1 phần không gian) */}
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={!!submitAction}
                                    className="sm:hidden flex-[1] px-2 py-2.5 bg-slate-100 text-slate-600 rounded-lg text-[13px] font-semibold hover:bg-slate-200 text-center disabled:opacity-70 transition-colors"
                                >
                                    Hủy
                                </button>

                                {/* NÚT LƯU NHÁP (Mobile: chiếm 2 phần không gian | Desktop: Tự động vừa vặn chữ) */}
                                <button
                                    type="button"
                                    onClick={() => handleSubmit('draft')}
                                    disabled={!!submitAction || isPreparing}
                                    className="flex-[2] sm:flex-none px-6 py-2.5 bg-slate-700 text-white rounded-lg text-[13px] font-semibold hover:bg-slate-800 flex items-center justify-center gap-2 disabled:opacity-70 transition-colors w-full sm:w-auto"
                                >
                                    {submitAction === 'draft' ? (
                                        <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Đang lưu...</>
                                    ) : (
                                        <><i className="fa-solid fa-file-pen"></i> Lưu nháp</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}