import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import propertyService from "@/services/propertyService";
import servicePriceService from "@/services/servicePriceService";
import ServicePricesTable from "@/components/servicePrices/ServicePricesTable";
import AddServicePriceModal from "@/components/servicePrices/AddServicePriceModal";

export default function ServicePricesPage() {
    const [prices, setPrices] = useState([]);
    const [properties, setProperties] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState(null);

    // Filter states
    const [page, setPage] = useState(1);
    const [propertyId, setPropertyId] = useState(""); // Rỗng nghĩa là xem giá "Mặc định hệ thống"

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Tải danh sách khu nhà trọ để đưa vào thẻ Select bộ lọc
    const fetchProperties = useCallback(async () => {
        try {
            const response = await propertyService.getAll({ per_page: 100 });
            setProperties(response.data.data || []);
        } catch (error) {
            toast.error("Không thể tải danh sách khu nhà.");
        }
    }, []);

    // Tải bảng giá dịch vụ dựa trên bộ lọc khu nhà trọ đang chọn
    const fetchServicePrices = useCallback(async () => {
        try {
            setIsLoading(true);
            let response;
            
            if (propertyId) {
                // Lấy bảng giá áp dụng riêng của Khu nhà trọ cụ thể
                response = await servicePriceService.getByProperty(propertyId, { page, per_page: 15 });
            } else {
                // Lấy bảng giá mặc định cấu hình chung toàn hệ thống
                response = await servicePriceService.getGlobal({ page, per_page: 15 });
            }

            setPrices(response.data.data || []);
            setPagination(response.data.meta || null);
        } catch (error) {
            toast.error("Không thể tải danh sách bảng giá dịch vụ.");
        } finally {
            setIsLoading(false);
        }
    }, [page, propertyId]);

    useEffect(() => {
        fetchProperties();
    }, [fetchProperties]);

    useEffect(() => {
        fetchServicePrices();
    }, [fetchServicePrices]);

    const handleCreateServicePrice = async (formData) => {
        try {
            setIsSubmitting(true);
            await servicePriceService.create(formData);
            toast.success("Cấu hình đơn giá dịch vụ thành công!");
            setIsAddModalOpen(false);
            fetchServicePrices();
        } catch (error) {
            toast.error(error.response?.data?.message || "Có lỗi xảy ra khi lưu đơn giá.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeletePrice = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa cấu hình đơn giá này? Hệ thống sẽ fallback về giá mặc định.")) return;
        try {
            await servicePriceService.delete(id);
            toast.success("Xóa cấu hình đơn giá dịch vụ thành công.");
            fetchServicePrices();
        } catch (error) {
            toast.error(error.response?.data?.message || "Không thể xóa đơn giá này.");
        }
    };

    return (
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-4 md:p-6 flex flex-col h-full bg-slate-50">
            {/* Tiêu đề đầu trang */}
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-[22px] font-bold text-slate-800">Cấu hình giá dịch vụ</h1>
                    <p className="text-[13px] text-slate-500 mt-1">
                        Thiết lập đơn giá Điện, Nước, Wifi, Rác áp dụng mặc định hoặc cấu hình riêng cho từng khu nhà.
                    </p>
                </div>
            </div>

            {/* Bảng danh sách dịch vụ kèm bộ lọc */}
            <div className="flex-1 min-h-0 flex flex-col">
                <ServicePricesTable
                    prices={prices}
                    properties={properties}
                    pagination={pagination}
                    page={page}
                    onPageChange={setPage}
                    isLoading={isLoading}
                    propertyId={propertyId}
                    onPropertyIdChange={(val) => { setPropertyId(val); setPage(1); }}
                    onOpenAddModal={() => setIsAddModalOpen(true)}
                    onDeletePrice={handleDeletePrice}
                />
            </div>

            {/* Modal Thiết lập giá */}
            <AddServicePriceModal
                open={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={handleCreateServicePrice}
                isSubmitting={isSubmitting}
                properties={properties}
                currentPropertyFilter={propertyId}
            />
        </div>
    );
}