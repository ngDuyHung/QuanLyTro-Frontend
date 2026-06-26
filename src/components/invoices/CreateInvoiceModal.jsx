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
}) {
    const [form, setForm] = useState(initialForm);
    const [leases, setLeases] = useState([]);
    const [isLoadingLeases, setIsLoadingLeases] = useState(false);
    const [isPreparing, setIsPreparing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [clientError, setClientError] = useState("");

    // --- State các khoản phí (Đã bỏ Nợ cũ) ---
    const [rent, setRent] = useState({ price: 0 });

    const [electricity, setElectricity] = useState({
        prev: "", current: "", price: 3500, image: null, preview: "", is_chot_roi: false
    });
    const [water, setWater] = useState({
        prev: "", current: "", price: 20000, image: null, preview: "", is_chot_roi: false
    });

    const [dynamicItems, setDynamicItems] = useState([]);

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
            setForm(initialForm);
            setLeases([]);
            setRent({ price: 0 });
            setElectricity({ prev: "", current: "", price: 3500, image: null, preview: "", is_chot_roi: false });
            setWater({ prev: "", current: "", price: 20000, image: null, preview: "", is_chot_roi: false });
            setDynamicItems([]);
            setClientError("");
        }
    }, [open]);

    // Lấy Hợp đồng theo Khu nhà
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
                setLeases(response.data.data || []);
            } catch (error) {
                setClientError("Lỗi tải danh sách phòng.");
            } finally {
                setIsLoadingLeases(false);
            }
        };
        fetchLeases();
    }, [open, form.property_id]);

    // Lấy Dữ liệu Prepare
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

                let tempRent = 0;
                let tempElec = { prev: "", current: "", price: 3500, image: null, preview: "", is_chot_roi: false };
                let tempWater = { prev: "", current: "", price: 20000, image: null, preview: "", is_chot_roi: false };

                data.suggested_items.forEach(item => {
                    if (item.charge_type === 'rent') {
                        tempRent = item.unit_price_snapshot;
                    }
                    else if (item.charge_type === 'electricity' || item.charge_type === 'water') {
                        const match = item.description.match(/Số cũ: (\d+) - Số mới: (\d+)/);
                        const stateObj = {
                            prev: match ? parseInt(match[1]) : "",
                            current: match ? parseInt(match[2]) : "",
                            price: item.charge_type === 'electricity' ? 3500 : 20000,
                            image: null,
                            preview: "",
                            is_chot_roi: true
                        };
                        if (item.charge_type === 'electricity') tempElec = stateObj;
                        if (item.charge_type === 'water') tempWater = stateObj;
                    }
                });

                setRent({ price: tempRent });
                setElectricity(tempElec);
                setWater(tempWater);

            } catch (error) {
                console.error("Lỗi Prepare:", error);
            } finally {
                setIsPreparing(false);
            }
        };

        const timeout = setTimeout(fetchPrepareData, 300);
        return () => clearTimeout(timeout);
    }, [open, form.lease_id, form.period_to]);

    // --- Handlers ---
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

    const handleAddDynamicItem = () => {
        setDynamicItems(prev => [
            ...prev,
            { id: Date.now(), charge_type: "other", description: "", quantity: 1, unit_price_snapshot: 0 }
        ]);
    };

    const handleUpdateDynamicItem = (id, field, value) => {
        setDynamicItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handleRemoveDynamicItem = (id) => {
        setDynamicItems(prev => prev.filter(item => item.id !== id));
    };

    // --- Tính toán TỔNG TIỀN ---
    const elecUsage = Math.max(0, (Number(electricity.current) || 0) - (Number(electricity.prev) || 0));
    const elecAmount = elecUsage * (Number(electricity.price) || 0);

    const waterUsage = Math.max(0, (Number(water.current) || 0) - (Number(water.prev) || 0));
    const waterAmount = waterUsage * (Number(water.price) || 0);

    const dynamicAmount = dynamicItems.reduce((sum, item) => {
        const amount = (Number(item.quantity) || 0) * (Number(item.unit_price_snapshot) || 0);
        return item.charge_type === 'discount' ? sum - amount : sum + amount;
    }, 0);

    // Đã bỏ previousDebt khỏi tổng
    const totalAmount = (Number(rent.price) || 0) + elecAmount + waterAmount + dynamicAmount;

    // --- SUBMIT ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setClientError("");

        if (!form.lease_id) return setClientError("Vui lòng chọn Phòng (Hợp đồng).");
        if (new Date(form.period_to) <= new Date(form.period_from)) return setClientError("Ngày kết thúc kỳ phải sau ngày bắt đầu.");

        try {
            setIsSubmitting(true);

            // BƯỚC 1: Chốt điện nước ngầm
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

            // BƯỚC 2: Ráp mảng Items & Gọi API Invoice
            const items = [];
            items.push({ charge_type: "room", description: "Tiền phòng", unit: "Tháng", quantity: 1, unit_price_snapshot: rent.price });

            if (elecUsage > 0) items.push({ charge_type: "electricity", description: "Tiền điện", unit: "kWh", quantity: elecUsage, unit_price_snapshot: electricity.price });
            if (waterUsage > 0) items.push({ charge_type: "water", description: "Tiền nước", unit: "m³", quantity: waterUsage, unit_price_snapshot: water.price });

            dynamicItems.forEach(item => {
                if (item.description && item.unit_price_snapshot > 0) {
                    items.push({
                        charge_type: item.charge_type,
                        description: item.description,
                        unit: item.charge_type === 'discount' ? 'Lần' : 'Tháng/Lần',
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

            await invoiceService.create(payload);

            toast.success("Đã tạo hóa đơn thành công!");
            onSuccess?.();
            onClose();

        } catch (error) {
            setClientError(error.response?.data?.message || "Có lỗi xảy ra khi tạo hóa đơn.");
        } finally {
            setIsSubmitting(false);
        }
    };

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
                    <button type="button" onClick={onClose} disabled={isSubmitting} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1 overflow-hidden">
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
                        <div className="bg-white px-5 py-5 border-b border-slate-200 mt-2 relative">
                            {isPreparing && <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex items-center justify-center"><span className="animate-pulse text-brand font-semibold text-[13px]">Đang đồng bộ dữ liệu...</span></div>}

                            <h3 className="text-[14px] font-bold text-brand mb-4 flex items-center gap-2"><i className="fa-solid fa-money-bill text-[13px]"></i> 2. Phí cố định (Phòng, Điện, Nước)</h3>

                            {/* Tiền phòng */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 mb-3">
                                <div className="w-[120px] font-semibold text-[13px] text-slate-700"><i className="fa-solid fa-house fa-fw text-brand mr-1"></i> Tiền phòng</div>
                                <div className="flex-1 flex items-center gap-3 w-full">
                                    <div className="flex-1 relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-slate-400">Giá</span>
                                        <input type="number" value={rent.price}
                                            onChange={(e) => setRent({ price: Number(e.target.value) || 0 })}
                                            className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded text-[13px] font-semibold focus:border-brand outline-none" />
                                    </div>
                                    <div className="text-[14px] font-bold text-slate-800 min-w-[100px] text-right">{Number(rent.price).toLocaleString()} đ</div>
                                </div>
                            </div>

                            {/* Điện Nước Row */}
                            {[
                                { type: 'electricity', label: 'Tiền điện', icon: 'fa-bolt', unit: 'kWh', state: electricity },
                                { type: 'water', label: 'Tiền nước', icon: 'fa-droplet', unit: 'm³', state: water }
                            ].map((item) => (
                                <div key={item.type} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 mb-3">
                                    <div className="w-[120px] font-semibold text-[13px] text-slate-700"><i className={`fa-solid ${item.icon} fa-fw text-${item.type === 'electricity' ? 'amber' : 'blue'}-500 mr-1`}></i> {item.label}</div>
                                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
                                        <div className="relative">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">Số cũ</span>
                                            <input type="number" disabled={item.state.is_chot_roi} value={item.state.prev} onChange={(e) => handleUtilityChange(item.type, 'prev', e.target.value)} className="w-full pl-[45px] pr-2 py-1.5 border border-slate-200 rounded text-[13px] focus:border-brand outline-none disabled:bg-slate-100" />
                                        </div>
                                        <div className="relative">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">Số mới</span>
                                            <input type="number" disabled={item.state.is_chot_roi} value={item.state.current} onChange={(e) => handleUtilityChange(item.type, 'current', e.target.value)} className="w-full pl-[50px] pr-2 py-1.5 border border-slate-200 rounded text-[13px] focus:border-brand outline-none disabled:bg-slate-100" />
                                        </div>
                                        <div className="relative">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">Đơn giá</span>
                                            <input type="number" value={item.state.price} onChange={(e) => handleUtilityChange(item.type, 'price', e.target.value)} className="w-full pl-[55px] pr-2 py-1.5 border border-slate-200 rounded text-[13px] focus:border-brand outline-none" />
                                        </div>

                                        <div className="flex items-center gap-2 justify-end">
                                            {!item.state.is_chot_roi && (
                                                <label className="w-8 h-8 rounded border border-slate-200 bg-white flex items-center justify-center text-slate-500 cursor-pointer hover:bg-brand/10 hover:text-brand hover:border-brand transition-colors relative" title="Tải ảnh đồng hồ">
                                                    <i className="fa-solid fa-camera text-[12px]"></i>
                                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange(item.type)} />
                                                    {item.state.preview && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border border-white"></span>}
                                                </label>
                                            )}
                                            <div className="text-[13px] font-bold text-slate-800 min-w-[80px] text-right">
                                                {((Math.max(0, (Number(item.state.current) || 0) - (Number(item.state.prev) || 0))) * (Number(item.state.price) || 0)).toLocaleString()} đ
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* SECTION 3: Dịch vụ khác & Giảm trừ */}
                        <div className="bg-white px-5 py-5 border-b border-slate-200 mt-2">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-[14px] font-bold text-brand flex items-center gap-2"><i className="fa-solid fa-layer-group text-[13px]"></i> 3. Dịch vụ khác & Khấu trừ</h3>
                                <button type="button" onClick={handleAddDynamicItem} className="text-[12px] font-semibold text-brand hover:text-green-700 bg-brand/10 px-3 py-1.5 rounded-lg"><i className="fa-solid fa-plus mr-1"></i> Thêm khoản thu</button>
                            </div>

                            {dynamicItems.length === 0 ? (
                                <div className="text-center py-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-[12px] text-slate-400">Không có dịch vụ phát sinh thêm.</div>
                            ) : (
                                <div className="space-y-2">
                                    {dynamicItems.map(item => (
                                        <div key={item.id} className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-white border border-slate-200 p-2 rounded-lg">
                                            <select value={item.charge_type} onChange={(e) => handleUpdateDynamicItem(item.id, 'charge_type', e.target.value)} className="w-full sm:w-[130px] p-2 bg-slate-50 border border-slate-200 rounded text-[12px] outline-none">
                                                <option value="garbage">Tiền rác</option>
                                                <option value="internet">Internet/Wifi</option>
                                                <option value="surcharge">Phụ thu</option>
                                                <option value="discount">Giảm trừ</option>
                                                <option value="damage_fee">Phí hư hỏng</option>
                                                <option value="other">Khác</option>
                                            </select>
                                            <input type="text" placeholder="Tên hiển thị" value={item.description} onChange={(e) => handleUpdateDynamicItem(item.id, 'description', e.target.value)} className="flex-1 min-w-[150px] p-2 border border-slate-200 rounded text-[12px] outline-none" />
                                            <input type="number" placeholder="Số lượng" value={item.quantity} onChange={(e) => handleUpdateDynamicItem(item.id, 'quantity', e.target.value)} className="w-[80px] p-2 border border-slate-200 rounded text-[12px] outline-none" />
                                            <input type="number" placeholder="Đơn giá" value={item.unit_price_snapshot} onChange={(e) => handleUpdateDynamicItem(item.id, 'unit_price_snapshot', e.target.value)} className="w-[100px] p-2 border border-slate-200 rounded text-[12px] outline-none" />

                                            <div className="w-[90px] text-right font-bold text-[13px] text-slate-700">
                                                {item.charge_type === 'discount' ? '-' : ''}{((Number(item.quantity) || 0) * (Number(item.unit_price_snapshot) || 0)).toLocaleString()} đ
                                            </div>
                                            <button type="button" onClick={() => handleRemoveDynamicItem(item.id)} className="w-8 h-8 rounded text-red-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center shrink-0"><i className="fa-solid fa-trash-can"></i></button>
                                        </div>
                                    ))}
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
                                    <span className="font-semibold">{(rent.price + elecAmount + waterAmount).toLocaleString()} đ</span>
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

                    {/* Footer */}
                    <div className="border-t border-slate-200 px-5 py-3.5 bg-white shrink-0 sticky bottom-0 z-20 flex items-center justify-between gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                        <button type="button" onClick={onClose} disabled={isSubmitting} className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-lg text-[13px] font-semibold hover:bg-slate-200 w-[100px] sm:w-auto text-center disabled:opacity-70">
                            Hủy
                        </button>
                        <button type="submit" disabled={isSubmitting || isPreparing} className="flex-1 sm:flex-none px-8 py-2.5 bg-brand text-white rounded-lg text-[13px] font-semibold hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-70">
                            {isSubmitting ? (
                                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Đang tạo...</>
                            ) : (
                                <><i className="fa-solid fa-file-invoice"></i> Tạo hóa đơn</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}