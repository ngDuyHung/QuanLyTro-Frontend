import React, { useState, useEffect, useRef } from "react";
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
    defaultRoom = null,
    defaultLease = null,
    isCheckout = false, // <--- Bổ sung prop này
    defaultNote = ""
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
    const [preparedHeader, setPreparedHeader] = useState({ tenantName: "" });
    const [zoomImage, setZoomImage] = useState(null);
    const scrollContainerRef = useRef(null);

    const [isLeaseDropdownOpen, setIsLeaseDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Xử lý click ra ngoài để đóng dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsLeaseDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // 2. Lắng nghe clientError, nếu có lỗi thì cuộn lên top
    useEffect(() => {
        if (clientError && scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
                top: 0,
                behavior: "smooth" // Tạo hiệu ứng cuộn mượt mà
            });
        }
    }, [clientError]);

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

            // Ưu tiên lấy billing_day từ lease trước, nếu không có thì lấy từ room
            const sourceRoom = defaultLease ? (defaultLease.room || defaultLease) : defaultRoom;
            const billingDay = sourceRoom ? parseInt(defaultLease?.billing_day || sourceRoom.billing_day, 10) : null;

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

            // Hạn thanh toán: Bằng ngày bắt đầu ("Từ ngày") cộng thêm 10 ngày
            dueDate = new Date(fromDate.getTime());
            dueDate.setDate(dueDate.getDate() + 10);

            // DÒ TÌM PROPERTY ID AN TOÀN (Kể cả khi bị nested sâu bên trong)
            const initPropertyId = defaultLease
                ? (defaultLease.room?.property_id || defaultLease.room?.property?.id)
                : (defaultRoom ? (defaultRoom.property_id || defaultRoom.property?.id) : "");

            // Hàm helper nhỏ để format ngày theo giờ Local (tránh lỗi lệch Timezone)
            const formatDateLocal = (date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            // Cập nhật vào form
            setForm({
                ...initialForm,
                property_id: initPropertyId || "",
                lease_id: defaultLease ? defaultLease.id : "",
                period_from: formatDateLocal(fromDate),
                period_to: formatDateLocal(toDate),
                due_date: formatDateLocal(dueDate),
                issue_date: formatDateLocal(today), // <-- LUÔN LẤY NGÀY MỚI NHẤT
                note: defaultNote || "",
            });

            // Reset các state phụ khác (Giữ nguyên phần cũ của bạn)
            setLeases([]);
            setRent({ price: 0 });
            setElectricity({ reading_id: null, prev: "", current: "", price: 0, free: 0, image: null, preview: "", is_chot_roi: false });
            setWater({ reading_id: null, prev: "", current: "", price: 0, free: 0, image: null, preview: "", is_chot_roi: false });
            setDynamicItems([]);
            setClientError("");
            setSubmitAction(null);
        }
    }, [open, defaultRoom, defaultLease, defaultNote]);

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
                    is_checkout: isCheckout ? 1 : 0
                });

                const data = res.data.data;
                console.log("Prepare Data:", data);

                // Gán thẳng data từ Backend vào State (Clean code)
                setRent({ price: data.room.price });
                setElectricity(data.electricity);
                setWater(data.water);
                setPreparedHeader({ tenantName: data.tenant?.name || "" });
                setDynamicItems(data.dynamic_items);

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

    // --- TỰ ĐỘNG TÍNH LẠI NGÀY KHI NGƯỜI DÙNG CHỌN/ĐỔI HỢP ĐỒNG ---
    useEffect(() => {
        // Bỏ qua nếu modal đang đóng, chưa chọn phòng hoặc danh sách hợp đồng chưa tải xong
        if (!open || !form.lease_id || leases.length === 0) return;

        // Tìm chi tiết hợp đồng đang được chọn
        const selectedLease = leases.find(l => String(l.id) === String(form.lease_id));
        if (!selectedLease) return;

        const today = new Date();
        let fromDate, toDate, dueDate;

        // Lấy ngày lập hóa đơn (ưu tiên từ hợp đồng, nếu không có thì lấy từ phòng)
        const billingDay = parseInt(selectedLease.billing_day || selectedLease.room?.billing_day, 10);

        if (billingDay && !isNaN(billingDay) && billingDay > 0) {
            fromDate = new Date(today.getFullYear(), today.getMonth(), billingDay);
            toDate = new Date(today.getFullYear(), today.getMonth() + 1, billingDay);
            toDate.setDate(toDate.getDate() - 1);
        } else {
            // Mặc định nếu không cài đặt ngày
            fromDate = new Date();
            toDate = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
            toDate.setDate(toDate.getDate() - 1);
        }

        // Hạn thanh toán mặc định +10 ngày
        dueDate = new Date(fromDate.getTime());
        dueDate.setDate(dueDate.getDate() + 10);

        const formatDateLocal = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        // Cập nhật lại State của form
        setForm(prev => ({
            ...prev,
            period_from: formatDateLocal(fromDate),
            period_to: formatDateLocal(toDate),
            due_date: formatDateLocal(dueDate),
        }));

    }, [form.lease_id, leases, open]);
    // -----------------------------------------------------------------------

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
        if (electricity.current !== "" && Number(electricity.current) < Number(electricity.prev)) {
            return setClientError("Số điện mới không được nhỏ hơn số cũ.");
        }
        if (water.current !== "" && Number(water.current) < Number(water.prev)) {
            return setClientError("Số nước mới không được nhỏ hơn số cũ.");
        }

        try {
            setSubmitAction(actionType); // Bật loading theo action (draft hoặc issue)

            // Bước 1: Chốt điện nước ngầm
            const processUtility = async (utilityState, typeStr) => {
                if (utilityState.current !== "") {
                    const fd = new FormData();
                    fd.append("lease_id", form.lease_id);
                    fd.append("type", typeStr);
                    fd.append("previous_reading", utilityState.prev); // Bổ sung cập nhật cả số cũ nếu user sửa
                    fd.append("current_reading", utilityState.current);
                    fd.append("reading_date", form.period_from);
                    if (utilityState.image) fd.append("meter_image", utilityState.image);

                    if (utilityState.reading_id) {
                        // Thêm _method=PUT để tương thích Laravel API Resource khi dùng FormData
                        fd.append("_method", "PUT");
                        await utilityService.update(utilityState.reading_id, fd);
                    } else {
                        await utilityService.create(fd);
                    }
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
                    description: `Tiền điện (${electricity.current} - ${electricity.prev}  )`,
                    unit: "kWh",
                    quantity: elecUsage,
                    unit_price_snapshot: electricity.price,
                    free_quantity_snapshot: electricity.free
                });
            }

            if (waterUsage >= 0 && water.current !== "") {
                items.push({
                    charge_type: "water",
                    description: `Tiền nước (${water.current} - ${water.prev}  )`,
                    unit: "m³",
                    quantity: waterUsage,
                    unit_price_snapshot: water.price,
                    free_quantity_snapshot: water.free
                });
            }

            // -- LẤY CÁC DỊCH VỤ KHÁC --
            dynamicItems.forEach(item => {
                if (item.unit_price_snapshot >= 0) {
                    // Tự động tạo mô tả mặc định nếu chủ nhà bỏ trống
                    let desc = item.description;
                    if (!desc || desc.trim() === "") {
                        if (item.charge_type === 'discount') desc = 'Giảm trừ';
                        else if (item.charge_type === 'surcharge') desc = 'Phụ thu';
                        else if (item.charge_type === 'damage_fee') desc = 'Phí hư hỏng/phát sinh';
                        else if (item.charge_type === 'deposit') desc = 'Tiền cọc/thế chân';
                        else desc = 'Khoản khác';
                    }

                    items.push({
                        charge_type: item.charge_type,
                        description: desc,
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
            <style> {`
    @keyframes slideUp {
      from { transform: translateY(100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes fadeIn {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `}</style>

            <div className="bg-slate-50 w-full h-[100vh] sm:h-auto sm:max-h-[90vh] sm:max-w-[1000px]  sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out] sm:animate-[fadeIn_0.2s_ease-out] relative">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-2 sm:py-4 border-b border-slate-200 bg-white shrink-0 sticky top-0 z-20">
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
                    <div ref={scrollContainerRef} className="overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex-1 pb-6 bg-slate-50">

                        {clientError && (
                            <div className="mx-5 mt-4 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-[13px] flex items-center gap-2">
                                <i className="fa-solid fa-circle-exclamation"></i> {clientError}
                            </div>
                        )}

                        {/* SECTION 1: Thông tin chung (Giao diện Header Biên lai) */}
                        <div className="bg-white px-4 py-5 border-b border-slate-200 mt-1 relative z-30">
                            {/* Tem trang trí góc (Tùy chọn cho đẹp) */}
                            <div className="absolute top-0 right-0 w-16 h-16 bg-brand/5 rounded-bl-full -z-0"></div>

                            <div className="relative z-10">
                                {/* Dòng Tên Phòng & Khách thuê */}
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        {form.lease_id ? (
                                            <>

                                                <div className="text-[13px] text-slate-500  flex items-center gap-1.5">
                                                    <i className="fa-regular fa-user text-[12px] text-brand"></i>
                                                    <span className="font-medium text-slate-700">
                                                        {preparedHeader.tenantName || leases.find(l => l.id === form.lease_id)?.tenant?.full_name || "Tên khách thuê..."}
                                                    </span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-[13px] font-bold text-amber-500 flex items-center gap-2">
                                                <i className="fa-solid fa-hand-pointer"></i> Vui lòng chọn phòng
                                            </div>
                                        )}
                                    </div>

                                </div>

                                {/* Form chọn Khu nhà / Phòng (Thiết kế chìm, ít gây chú ý nếu đã có defaultRoom) */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <div className="relative">
                                        <select
                                            value={form.property_id}
                                            onChange={handleChange("property_id")}
                                            className="w-full bg-transparent border-b border-slate-300 py-1.5 text-[13px] font-medium text-slate-700 outline-none focus:border-brand appearance-none pr-6"
                                        >
                                            <option value="">-- Chọn khu nhà --</option>
                                            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                        <i className="fa-solid fa-chevron-down absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none"></i>
                                    </div>
                                    {/* CUSTOM DROPDOWN CHỌN PHÒNG */}
                                    <div className="relative" ref={dropdownRef}>
                                        <div
                                            className={`w-full bg-transparent border-b border-slate-300 py-1.5 text-[13px] font-medium text-slate-700 outline-none cursor-pointer flex items-center justify-between ${(!form.property_id || isLoadingLeases) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            onClick={() => {
                                                if (form.property_id && !isLoadingLeases) {
                                                    setIsLeaseDropdownOpen(!isLeaseDropdownOpen);
                                                }
                                            }}
                                        >
                                            <span className="truncate pr-4">
                                                {isLoadingLeases ? "Đang tải..." : form.lease_id ? (() => {
                                                    const l = leases.find(l => l.id === form.lease_id);
                                                    return l ? `${l.room?.name} - ${l.tenant?.full_name}` : "-- Chọn phòng thuê --";
                                                })() : "-- Chọn phòng thuê --"}
                                            </span>
                                            <i className={`fa-solid fa-chevron-down text-[10px] text-slate-400 transition-transform ${isLeaseDropdownOpen ? 'rotate-180' : ''}`}></i>
                                        </div>

                                        {/* BẢNG DANH SÁCH XỔ XUỐNG KÈM BADGE TRẠNG THÁI */}
                                        {isLeaseDropdownOpen && (
                                            <div className="absolute top-full left-0 right-0 mt-1 max-h-72 overflow-y-auto bg-white border border-emerald-500 rounded-xl shadow-xl z-50 animate-[fadeIn_0.15s_ease-out] no-scrollbar">
                                                {leases.length === 0 ? (
                                                    <div className="p-3 text-center text-[12px] text-slate-500">Chưa có phòng nào đang thuê.</div>
                                                ) : (
                                                    leases.map(l => {
                                                        const status = l.payment_status || 'none';
                                                        const unpaidAmount = l.unpaid_amount || 0;

                                                        return (
                                                            <div
                                                                key={l.id}
                                                                onClick={() => {
                                                                    handleChange("lease_id")({ target: { value: l.id } });
                                                                    setIsLeaseDropdownOpen(false);
                                                                }}
                                                                className={`px-3 py-2.5 border-b border-emerald-100 cursor-pointer hover:bg-slate-100 transition-colors flex items-center justify-between ${form.lease_id === l.id ? 'bg-brand/10' : ''}`}
                                                            >
                                                                <div className="flex flex-col min-w-0 pr-2">
                                                                    <span className="font-bold text-[13px] text-slate-800 truncate">{l.room?.name || 'Phòng trống'}</span>
                                                                    <span className="text-[11px] text-slate-500 truncate">{l.tenant?.full_name}</span>
                                                                </div>
                                                                <div className="shrink-0 flex items-center">
                                                                    {status === 'issued' || status === 'overdue' ? (
                                                                        <span className="inline-block px-2 py-0.5 bg-red-50 text-red-600 border border-red-200 rounded-md text-[10px] font-bold whitespace-nowrap shadow-sm">
                                                                            Nợ {Number(unpaidAmount).toLocaleString('vi-VN')}đ
                                                                        </span>
                                                                    ) : status === 'unbilled' ? (
                                                                        <span className="inline-block px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-md text-[10px] font-bold whitespace-nowrap shadow-sm">
                                                                            Tháng này chưa lập
                                                                        </span>
                                                                    ) : status === 'draft' ? (
                                                                        <span className="inline-block px-2 py-0.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-md text-[10px] font-bold whitespace-nowrap shadow-sm">
                                                                            Đang lưu nháp
                                                                        </span>
                                                                    ) : status === 'partially_paid' ? (
                                                                        <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-md text-[10px] font-bold whitespace-nowrap shadow-sm">
                                                                            Thu một phần
                                                                        </span>
                                                                    ) : status === 'paid' ? (
                                                                        <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-md text-[10px] font-bold whitespace-nowrap shadow-sm">
                                                                            Đã thu tháng này
                                                                        </span>
                                                                    ) : null}
                                                                </div>
                                                            </div>
                                                        )
                                                    })
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Khối Ngày tháng thiết kế kiểu underline */}
                                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 pt-1">
                                    <div className="flex-1">
                                        <label className="block text-[11px] text-slate-500 font-semibold mb-1">Kỳ thanh toán <span className="text-red-500">*</span></label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="date"
                                                value={form.period_from}
                                                onChange={handleChange("period_from")}
                                                className="w-full bg-transparent border-b border-slate-300 text-[13px] font-semibold text-slate-700 outline-none focus:border-brand pb-1 transition-colors"
                                            />
                                            <span className="text-slate-400 text-[12px]"><i className="fa-solid fa-arrow-right-long"></i></span>
                                            <input
                                                type="date"
                                                value={form.period_to}
                                                onChange={handleChange("period_to")}
                                                className="w-full bg-transparent border-b border-slate-300 text-[13px] font-semibold text-slate-700 outline-none focus:border-brand pb-1 transition-colors"
                                            />
                                        </div>
                                    </div>
                                    <div className="w-full sm:w-[140px]">
                                        <label className="block text-[11px] text-slate-500 font-semibold mb-1">Hạn thanh toán</label>
                                        <input
                                            type="date"
                                            value={form.due_date}
                                            onChange={handleChange("due_date")}
                                            className="w-full bg-transparent border-b border-slate-300 text-[13px] font-semibold text-brand outline-none focus:border-brand pb-1 transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 2: Các khoản phí cố định */}
                        <div className="bg-slate-50 px-4 sm:px-5 py-5 border-b border-slate-200 relative">
                            {isPreparing && (
                                <div className="absolute inset-0 bg-slate-50/70 backdrop-blur-sm z-10 flex items-center justify-center">
                                    <span className="animate-pulse text-brand font-semibold text-[13px] bg-white px-4 py-2 rounded-full shadow-sm">
                                        <i className="fa-solid fa-spinner fa-spin mr-2"></i>Đang đồng bộ dữ liệu...
                                    </span>
                                </div>
                            )}

                            <div className="flex items-center justify-between mb-4">
                                <h3 className="flex items-center gap-2 text-[15px] font-bold text-slate-800">
                                    <i className="fa-solid fa-bolt text-brand text-[14px]"></i>
                                    <span>2. Tiền phòng & Điện nước</span>
                                </h3>
                            </div>

                            {/* ========================================== */}
                            {/* MOBILE VIEW (Dạng Card)          */}
                            {/* ========================================== */}
                            <div className="sm:hidden">
                                {/* --- CARD TIỀN PHÒNG --- */}
                                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-4">

                                    {/* Header */}
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0">
                                                <i className="fa-solid fa-house text-[15px]"></i>
                                            </div>
                                            <div>
                                                <div className="text-[13px] font-bold text-slate-700">
                                                    Tiền phòng
                                                </div>
                                                <div className="text-[11px] text-slate-500">
                                                    Giá cố định theo tháng
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[17px] font-black text-brand leading-none">
                                                {Number(rent.price).toLocaleString("vi-VN")} đ
                                            </div>
                                        </div>
                                    </div>
                                    {/* Body */}
                                    <div className="p-4">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                value={
                                                    rent.price === 0
                                                        ? ""
                                                        : Number(rent.price).toLocaleString("vi-VN")
                                                }
                                                placeholder="Nhập giá phòng..."
                                                onChange={(e) => {
                                                    const rawValue = e.target.value.replace(/[^\d]/g, "");
                                                    setRent({
                                                        price: rawValue ? Number(rawValue) : 0
                                                    });
                                                }}
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-4 pr-12 py-3 text-[14px] font-semibold text-slate-800 outline-none transition-all focus:border-brand focus:bg-white"
                                            />

                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-medium text-slate-400">
                                                VNĐ
                                            </span>

                                        </div>

                                    </div>

                                </div>

                                {/* --- CARD ĐIỆN / NƯỚC --- */}
                                {[
                                    { type: 'electricity', label: 'Điện tiêu thụ', icon: 'fa-plug', unit: 'kWh', state: electricity, bgIcon: 'bg-amber-50', textIcon: 'text-amber-500' },
                                    { type: 'water', label: 'Nước sinh hoạt', icon: 'fa-faucet-drip', unit: 'm³', state: water, bgIcon: 'bg-blue-50', textIcon: 'text-blue-500' }
                                ].map((item) => {
                                    const usage = Math.max(0, (Number(item.state.current) || 0) - (Number(item.state.prev) || 0));
                                    const billable = Math.max(0, usage - (Number(item.state.free) || 0));
                                    const amount = billable * (Number(item.state.price) || 0);

                                    return (
                                        <div key={item.type} className="bg-white border border-slate-200 rounded-xl mb-4 shadow-sm overflow-hidden">
                                            {/* Header Card */}
                                            <div className="flex justify-between items-center p-3 border-b border-slate-100 bg-slate-50/50">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-9 h-9 rounded-full ${item.bgIcon} flex items-center justify-center ${item.textIcon} shrink-0`}>
                                                        <i className={`fa-solid ${item.icon} text-[15px]`}></i>
                                                    </div>
                                                    <div>
                                                        <div className="text-[13px] font-bold text-slate-700">{item.label}</div>
                                                        <div className="text-[11px] text-slate-500">
                                                            Sử dụng: <span className="font-bold text-slate-700">{usage} {item.unit}</span>
                                                            {Number(item.state.free) > 0 && <span className="text-emerald-600 ml-1">(Miễn phí {item.state.free})</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[15px] font-black text-brand">{amount.toLocaleString()} đ</div>
                                                </div>
                                            </div>

                                            {/* Body Card */}
                                            <div className="p-3">
                                                <div className="flex items-start gap-3 w-full">
                                                    {/* Nhập Số cũ / Số mới */}
                                                    <div className="flex-1 flex gap-2 relative">


                                                        <div className="flex-1 border border-brand/30 rounded-lg p-2 transition-colors bg-brand/5 focus-within:border-brand focus-within:bg-white">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <label className="text-[10px] font-bold uppercase tracking-wide text-brand">Số mới</label>
                                                            </div>
                                                            <input
                                                                type="number"
                                                                value={item.state.current}
                                                                onChange={(e) => handleUtilityChange(item.type, 'current', e.target.value)}
                                                                className="w-full bg-transparent text-[15px] font-black outline-none text-brand"
                                                                placeholder="0"
                                                            />
                                                        </div>

                                                        <div className="flex-1 border border-slate-200 rounded-lg p-2 transition-colors bg-slate-50 focus-within:border-brand focus-within:bg-white">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Số cũ</label>
                                                            </div>
                                                            <input
                                                                type="number"
                                                                value={item.state.prev}
                                                                onChange={(e) => handleUtilityChange(item.type, 'prev', e.target.value)}
                                                                className="w-full bg-transparent text-[15px] font-bold text-slate-700 outline-none"
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Ảnh chụp (Luôn cho phép sửa) */}
                                                    <div className="w-[60px] h-[60px] shrink-0">
                                                        {item.state.preview ? (
                                                            <div className="relative w-full h-full rounded-lg border border-slate-200 bg-slate-100">
                                                                <div onClick={() => setZoomImage(item.state.preview)} className="w-full h-full cursor-zoom-in">
                                                                    <img src={item.state.preview} alt="preview" className="w-full h-full object-cover rounded-lg" />
                                                                </div>
                                                                <button type="button" onClick={() => handleRemoveImage(item.type)} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] active:scale-90 shadow-sm"><i className="fa-solid fa-xmark"></i></button>
                                                            </div>
                                                        ) : (
                                                            <label className="w-full h-full rounded-lg border border-dashed border-slate-300 text-slate-400 flex flex-col items-center justify-center gap-1 cursor-pointer bg-slate-50 hover:bg-slate-100 hover:text-brand hover:border-brand transition-colors">
                                                                <i className="fa-solid fa-camera text-[16px]"></i>
                                                                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange(item.type)} />
                                                            </label>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Đơn giá & Miễn phí (Xếp ngang 2 ô, nhưng nội dung bên trong xếp dọc) */}
                                                <div className="mt-3 pt-3 border-t border-dashed border-slate-200 flex flex-nowrap gap-2">

                                                    {/* Ô ĐƠN GIÁ */}
                                                    <label className="flex-1 flex flex-col justify-center bg-slate-50 rounded-lg px-2.5 py-1.5 border border-slate-200 cursor-text transition-colors focus-within:border-brand focus-within:bg-white shadow-sm overflow-hidden">
                                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide mb-0.5">Đơn giá</span>
                                                        <div className="flex items-center min-w-0">
                                                            <input
                                                                type="text"
                                                                inputMode="numeric"
                                                                value={item.state.price === 0 ? "" : Number(item.state.price).toLocaleString("vi-VN")}
                                                                placeholder="0"
                                                                onChange={(e) => {
                                                                    const rawValue = e.target.value.replace(/[^\d]/g, "");
                                                                    handleUtilityChange(item.type, 'price', rawValue ? Number(rawValue) : 0);
                                                                }}
                                                                // Căn trái text để đồng bộ với tiêu đề ở trên, tăng size chữ lên 14px cho dễ nhìn
                                                                className="w-full min-w-0 bg-transparent text-[14px] font-bold text-slate-800 outline-none"
                                                            />
                                                            <span className="text-[11px] text-slate-400 ml-1 whitespace-nowrap shrink-0">đ/{item.unit}</span>
                                                        </div>
                                                    </label>

                                                    {/* Ô MIỄN PHÍ */}
                                                    <label className="flex-1 flex flex-col justify-center bg-emerald-50/50 rounded-lg px-2.5 py-1.5 border border-emerald-200 cursor-text transition-colors focus-within:border-emerald-400 focus-within:bg-emerald-50 shadow-sm overflow-hidden">
                                                        <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wide mb-0.5">Miễn phí</span>
                                                        <div className="flex items-center min-w-0">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={item.state.free}
                                                                onChange={(e) => handleUtilityChange(item.type, 'free', e.target.value)}
                                                                className="w-full min-w-0 bg-transparent text-[14px] font-bold text-emerald-700 outline-none"
                                                            />
                                                            <span className="text-[11px] text-emerald-600 ml-1 whitespace-nowrap shrink-0">{item.unit}</span>
                                                        </div>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* ========================================== */}
                            {/* DESKTOP VIEW (Giao diện Gốc của user có thêm Cột Sử dụng) */}
                            {/* ========================================== */}
                            <div className="hidden sm:block">
                                {/* Tiền phòng */}
                                <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 lg:gap-4 bg-white lg:bg-slate-50 p-3 rounded-xl border border-slate-200 mb-3 hover:border-slate-300 transition-colors shadow-sm lg:shadow-none">
                                    <div className="flex justify-between items-center lg:w-[120px] shrink-0 border-b border-slate-100 lg:border-0 pb-1.5 lg:pb-0">
                                        <div className="font-bold text-[14px] lg:text-[13px] text-slate-700 flex items-center">
                                            <i className="fa-solid fa-house fa-fw text-brand mr-2 lg:mr-1 text-[15px] lg:text-[14px]"></i> Tiền phòng
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
                                            className="w-full pl-[72px] pr-3 py-2 lg:py-1.5 border border-slate-200 rounded-lg text-[13px] font-semibold focus:border-brand outline-none transition-colors"
                                        />
                                    </div>

                                    {/* Cột giả để căn lề ngang hàng với cột Tổng Tiền ở bên dưới */}
                                    <div className="hidden lg:block lg:w-[130px] shrink-0 text-right font-black text-brand text-[14px]">
                                        {Number(rent.price).toLocaleString()} đ
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
                                        <div key={item.type} className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 lg:gap-4 bg-white lg:bg-slate-50 p-3 rounded-xl border border-slate-200 mb-3 hover:border-slate-300 transition-colors shadow-sm lg:shadow-none">

                                            <div className="flex flex-col justify-center lg:w-[130px] shrink-0 border-b border-slate-100 lg:border-0 pb-1.5 lg:pb-0">
                                                <div className="font-bold text-[14px] lg:text-[13px] text-slate-700 flex items-center">
                                                    <i className={`fa-solid ${item.icon} fa-fw text-${item.type === 'electricity' ? 'amber' : 'blue'}-500 mr-2 lg:mr-1 text-[15px] lg:text-[14px]`}></i>
                                                    {item.label}
                                                </div>
                                                {/* Phần hiển thị số lượng dùng chìm gọn gàng phía dưới */}
                                                <div className="text-[11px] text-slate-500 lg:mt-0.5 ml-6 lg:ml-5">
                                                    Đã dùng: <span className="font-bold text-slate-700">{usage}</span> {item.unit}
                                                </div>
                                            </div>

                                            <div className="flex-1 flex flex-col lg:flex-row gap-3 w-full">

                                                {/* Lưới các ô Inputs: Bỏ thuộc tính disabled */}
                                                <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 flex-1">
                                                    {/* Ô Số cũ */}
                                                    <div className="relative">
                                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 pointer-events-none">Số cũ</span>
                                                        <input
                                                            type="number"
                                                            value={item.state.prev}
                                                            onChange={(e) => handleUtilityChange(item.type, 'prev', e.target.value)}
                                                            className="w-full pl-[46px] pr-2 py-2 lg:py-1.5 border border-slate-200 bg-white rounded-lg text-[13px] font-semibold focus:border-brand outline-none transition-colors"
                                                        />
                                                    </div>

                                                    {/* Ô Số mới */}
                                                    <div className="relative">
                                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 pointer-events-none">Số mới</span>
                                                        <input
                                                            type="number"
                                                            value={item.state.current}
                                                            onChange={(e) => handleUtilityChange(item.type, 'current', e.target.value)}
                                                            className="w-full pl-[52px] pr-2 py-2 lg:py-1.5 border border-brand/40 bg-brand/5 rounded-lg text-[13px] font-bold text-brand focus:border-brand outline-none transition-colors"
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
                                                            className="w-full pl-[56px] pr-2 py-2 lg:py-1.5 border border-slate-200 bg-white rounded-lg text-[13px] font-semibold focus:border-brand outline-none transition-colors"
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

                                                {/* Khu vực Xử lý Ảnh Chốt số & Thành tiền (Luôn cho sửa ảnh) */}
                                                <div className="flex items-center justify-between lg:justify-end gap-3 lg:w-[130px] shrink-0 pt-2 lg:pt-0 border-t border-dashed border-slate-100 lg:border-0">

                                                    {/* Cột Hiển thị Thành Tiền */}
                                                    <div className="text-[14px] font-black text-slate-800 text-right w-full lg:w-auto whitespace-nowrap pr-1">
                                                        {amount.toLocaleString()} đ
                                                    </div>

                                                    {item.state.preview ? (
                                                        <div className="relative w-full lg:w-9 h-9 rounded-lg border border-slate-200 bg-slate-100 shrink-0">
                                                            <div
                                                                onClick={() => setZoomImage(item.state.preview)}
                                                                className="w-full h-full cursor-zoom-in relative group"
                                                                title="Bấm để xem phóng to"
                                                            >
                                                                <img src={item.state.preview} alt="preview" className="w-full h-full object-cover rounded-lg shadow-sm" />
                                                            </div>
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
                                                        <label className="w-full lg:w-9 h-9 rounded-lg border border-dashed border-slate-300 text-slate-500 hover:text-brand hover:border-brand hover:bg-brand/5 flex items-center justify-center gap-2 lg:gap-0 cursor-pointer transition-colors shrink-0 bg-white" title="Chụp ảnh đồng hồ">
                                                            <i className="fa-solid fa-camera text-[14px] lg:text-[13px]"></i>
                                                            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange(item.type)} />
                                                        </label>
                                                    )}
                                                </div>

                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                        </div>

                        {/* SECTION 3: Dịch vụ khác & Giảm trừ */}
                        <div className="bg-white px-4 py-5 sm:px-5 border-b border-slate-200 mt-2">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="flex items-center gap-2 text-[15px] font-bold text-slate-800">
                                    <i className="fa-solid fa-layer-group text-brand text-[14px]"></i> 3. Dịch vụ khác
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
                                                className="bg-white border border-slate-200 sm:bg-transparent sm:border-0 p-3 sm:px-4 sm:py-2 rounded-xl sm:rounded-none flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4 relative shadow-sm sm:shadow-none"
                                            >
                                                {/* 1. Loại dịch vụ & Nút xóa trên Mobile */}
                                                <div className="flex items-center justify-between gap-2 w-full sm:w-[140px] shrink-0">
                                                    <div className="relative flex-1">
                                                        <select
                                                            value={item.charge_type}
                                                            onChange={(e) => handleUpdateDynamicItem(item.id, 'charge_type', e.target.value)}
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-2.5 pr-7 py-1.5 text-[13px] font-medium text-slate-700 outline-none focus:border-brand appearance-none"
                                                        >
                                                            <option value="garbage">Tiền rác/tháng</option>
                                                            <option value="internet">Internet/tháng</option>
                                                            <option value="discount">Giảm trừ (-)</option>
                                                            <option value="deposit">Cọc/thế chân</option>
                                                            <option value="damage_fee">Phí hư hại</option>
                                                            <option value="other">Khác</option>
                                                        </select>
                                                        <i className="fa-solid fa-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 sm:hidden pointer-events-none"></i>
                                                    </div>

                                                    {/* Nút xóa trên Mobile (Gọn nhẹ hơn) */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveDynamicItem(item.id)}
                                                        className="sm:hidden w-7 h-7 rounded-md bg-red-50 text-red-500 flex items-center justify-center shrink-0 active:bg-red-100 transition-colors"
                                                    >
                                                        <i className="fa-solid fa-trash-can text-[13px]"></i>
                                                    </button>
                                                </div>

                                                {/* 2. Ô nhập mô tả (Ẩn bớt trên mobile nếu là Rác/Internet) */}
                                                <div className={`w-full sm:flex-1 ${['garbage', 'internet'].includes(item.charge_type) ? 'hidden sm:block' : 'block'}`}>
                                                    <input
                                                        type="text"
                                                        placeholder="Mô tả (Ví dụ: Sửa bóng đèn)..."
                                                        value={item.description}
                                                        onChange={(e) => handleUpdateDynamicItem(item.id, 'description', e.target.value)}
                                                        className="w-full px-2.5 py-1.5 bg-slate-50 sm:bg-white border border-slate-200 rounded-lg text-[13px] outline-none focus:border-brand text-slate-700 placeholder:text-slate-400"
                                                    />
                                                </div>

                                                {/* 3. Wrapper cho SL, Giá, Thành tiền: Mobile xếp dạng lưới, PC dùng `contents` để giữ nguyên cột */}
                                                <div className="flex flex-col sm:contents w-full gap-2 mt-2 sm:mt-0">

                                                    {/* Nhóm SL và Đơn Giá (Mobile xếp ngang 2 ô) */}
                                                    <div className="flex gap-2 sm:contents w-full">
                                                        {/* Ô Số lượng */}
                                                        <label className="flex-[1] sm:flex-none flex flex-col justify-center sm:block sm:w-[70px] shrink-0 bg-slate-50 sm:bg-transparent rounded-lg sm:rounded-none px-2.5 py-1.5 sm:p-0 border border-slate-200 sm:border-0 cursor-text focus-within:border-brand focus-within:bg-white shadow-sm sm:shadow-none transition-colors">
                                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide mb-0.5 sm:hidden">Số lượng</span>
                                                            <input
                                                                type="number"
                                                                value={item.quantity}
                                                                onChange={(e) => handleUpdateDynamicItem(item.id, 'quantity', e.target.value)}
                                                                className="w-full min-w-0 bg-transparent text-[14px] sm:text-[13px] font-bold sm:font-medium sm:text-center outline-none text-slate-800"
                                                            />
                                                        </label>

                                                        {/* Ô Đơn giá */}
                                                        <label className="flex-[2] sm:flex-none flex flex-col justify-center sm:block sm:w-[115px] shrink-0 bg-slate-50 sm:bg-transparent rounded-lg sm:rounded-none px-2.5 py-1.5 sm:p-0 border border-slate-200 sm:border-0 cursor-text focus-within:border-brand focus-within:bg-white shadow-sm sm:shadow-none transition-colors min-w-0">
                                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide mb-0.5 sm:hidden">Đơn giá (đ)</span>
                                                            <input
                                                                type="text"
                                                                inputMode="numeric"
                                                                value={item.unit_price_snapshot === 0 ? "" : Number(item.unit_price_snapshot).toLocaleString("vi-VN")}
                                                                placeholder="0"
                                                                onChange={(e) => {
                                                                    const rawValue = e.target.value.replace(/[^\d]/g, "");
                                                                    handleUpdateDynamicItem(item.id, 'unit_price_snapshot', rawValue ? Number(rawValue) : 0);
                                                                }}
                                                                // Căn trái trên Mobile để đồng bộ với tiêu đề, căn phải trên PC
                                                                className="w-full min-w-0 bg-transparent text-[14px] sm:text-[13px] font-bold sm:font-medium text-left sm:text-right outline-none text-slate-800"
                                                            />
                                                        </label>
                                                    </div>

                                                    {/* Nhóm Thành tiền (Mobile tự động xuống dòng và có vạch mờ phân cách) */}
                                                    <div className="flex items-center justify-between sm:justify-end sm:contents pt-1.5 sm:pt-0 mt-1 sm:mt-0 border-t border-slate-100 border-dashed sm:border-0">
                                                        <span className="text-[12px] text-slate-500 font-medium sm:hidden">Thành tiền:</span>
                                                        <div className={`text-[16px] sm:text-[13px] font-black sm:font-bold text-right sm:w-[115px] shrink-0 truncate ${item.charge_type === 'discount' ? 'text-red-500' : 'text-slate-800'}`}>
                                                            {item.charge_type === 'discount' ? '-' : ''}{((Number(item.quantity) || 0) * (Number(item.unit_price_snapshot) || 0)).toLocaleString()} <span className="text-[12px] underline decoration-slate-300 ml-0.5">đ</span>
                                                        </div>
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
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* SECTION 4: Lời nhắn tới khách thuê */}
                        <div className="bg-white px-4 sm:px-5 py-5 border-t border-slate-200">
                            {/* Header */}
                            <div className="flex items-start gap-3 mb-3">
                                <h3 className="flex items-center gap-2 text-[15px] font-bold text-slate-800">

                                    <i className="fa-solid fa-note-sticky text-brand text-[14px]"></i>

                                    <span>4. Lời nhắn tới khách thuê</span>

                                </h3>
                            </div>
                            {/* Textarea */}
                            <textarea
                                value={form.note}
                                onChange={handleChange("note")}
                                placeholder="Ví dụ: Vui lòng thanh toán trước ngày 05 hàng tháng. Nếu có sai sót vui lòng liên hệ chủ nhà."
                                className="w-full min-h-[72px] rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] text-slate-700 placeholder:text-slate-400 outline-none resize-none transition-all focus:bg-white focus:border-brand"
                            />
                        </div>
                    </div>

                    {/* Footer với Tổng tiền & Nút Bấm tối ưu Mobile/PC */}
                    <div className="border-t border-slate-200 p-4 sm:px-5 sm:py-3.5 bg-white shrink-0 sticky bottom-0 z-20 shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">

                        {/* 1. HIỂN THỊ TỔNG TIỀN (Mobile: nằm trên / PC: nằm trái) */}
                        <div className="flex items-center justify-between sm:justify-start sm:gap-4 w-full sm:w-auto  sm:bg-transparent p-1 sm:p-0 rounded-lg sm:rounded-none  sm:border-none">
                            <span className="text-[13px] text-slate-600 font-medium hidden sm:block">Tổng cộng:</span>
                            <span className="text-[13px]  font-semibold sm:hidden">Tổng thanh toán:</span>

                            <span className="text-[18px] sm:text-[22px] font-black text-brand">
                                {totalAmount.toLocaleString()} đ
                            </span>
                        </div>

                        {/* 2. NHÓM NÚT HÀNH ĐỘNG (Bỏ nút Hủy) */}
                        <div className="flex items-center gap-2.5 w-full sm:w-auto">

                            {/* Nút Lưu nháp (Ngắn trên mobile: tỷ lệ 1 phần) */}
                            <button
                                type="button"
                                onClick={() => handleSubmit('draft')}
                                disabled={!!submitAction || isPreparing}
                                className="flex-[1] sm:flex-none px-0 sm:px-5 py-2.5 bg-slate-700 text-white rounded-lg text-[13px] font-semibold hover:bg-slate-800 flex items-center justify-center gap-2 disabled:opacity-70 transition-colors"
                            >
                                {submitAction === 'draft' ? (
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                ) : (
                                    <i className="fa-solid fa-file-pen"></i>
                                )}
                                <span className="hidden sm:inline">Lưu nháp</span>
                                <span className="sm:hidden">Nháp</span>
                            </button>

                            {/* Nút Lưu & Phát hành (Dài trên mobile: tỷ lệ 2 phần) */}
                            <button
                                type="button"
                                onClick={() => handleSubmit('issue')}
                                disabled={!!submitAction || isPreparing}
                                className="flex-[2] sm:flex-none px-0 sm:px-6 py-2.5 bg-brand text-white rounded-lg text-[13px] font-semibold hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-70 shadow-sm shadow-brand/30 transition-colors"
                            >
                                {submitAction === 'issue' ? (
                                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Đang xử lý...</>
                                ) : (
                                    <><i className="fa-regular fa-paper-plane"></i> Lưu & Phát hành</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}