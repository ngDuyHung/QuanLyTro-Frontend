import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import sepayConfigService from "@/services/sepayConfigService";

export default function SepayConfigTab() {
    const [token, setToken] = useState("");
    const [tokenHint, setTokenHint] = useState(""); // Lưu lại chuỗi che mờ để so sánh
    const [autoConfirm, setAutoConfirm] = useState(true);
    const [hasTokenInDb, setHasTokenInDb] = useState(false);
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [isDisconnecting, setIsDisconnecting] = useState(false);

    const webhookUrl = `${import.meta.env.VITE_API_BASE_URL}/sepay-webhook`;

    const fetchConfig = useCallback(async () => {
        try {
            setIsLoading(true);
            const res = await sepayConfigService.getConfig();
            const data = res.data?.data;

            // Đọc trạng thái từ has_api_token do backend trả về
            if (data?.has_api_token) {
                const hint = data.api_token_hint || "••••••••••••••••";
                setToken(hint); 
                setTokenHint(hint);
                setHasTokenInDb(true);
            } else {
                setToken("");
                setTokenHint("");
                setHasTokenInDb(false);
            }

            // Đọc trạng thái auto_confirm
            const dbAutoConfirm = data?.sepay_auto_confirm !== undefined ? data?.sepay_auto_confirm : data?.auto_confirm;
            setAutoConfirm(dbAutoConfirm === 1 || dbAutoConfirm === true || dbAutoConfirm === "1");

        } catch (error) {
            console.error("Lỗi lấy cấu hình:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

    const handleSave = async () => {
        // Validation cơ bản khi chưa có token nào
        if (!hasTokenInDb && (!token || token.trim() === "")) {
            return toast.warning("Vui lòng nhập API Token để kết nối cấu hình.");
        }

        try {
            setIsSaving(true);
            
            // Payload cơ bản (API hỗ trợ update từng phần nên gửi những gì cần đổi)
            const payload = {
                sepay_auto_confirm: autoConfirm ? true : false,
                sepay_match_pattern: "HD" // Mặc định như API bạn test
            };

            // CHỈ gửi token mới lên backend nếu người dùng gõ token khác với chuỗi Hint (••••)
            if (token && token.trim() !== "" && token !== tokenHint) {
                payload.sepay_api_token = token.trim();
            }

            await sepayConfigService.saveConfig(payload);
            toast.success("Đã lưu cấu hình SePay thành công!");
            fetchConfig(); // Reload lại để lấy Hint mới nếu có
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi khi lưu cấu hình.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleTest = async () => {
        try {
            setIsTesting(true);
            const res = await sepayConfigService.testConnection();
            toast.success(res.data?.message || "Kết nối thành công! SePay đang hoạt động tốt.");
        } catch (error) {
            toast.error(error.response?.data?.message || "Kết nối thất bại. Vui lòng kiểm tra lại Token.");
        } finally {
            setIsTesting(false);
        }
    };

    const handleDisconnect = async () => {
        if (!window.confirm("Hủy kết nối sẽ xóa API Token và hệ thống ngừng tự động nhận báo có. Bạn có chắc chắn?")) return;

        try {
            setIsDisconnecting(true);
            await sepayConfigService.disconnect();
            toast.success("Đã hủy kết nối SePay.");
            setToken("");
            setTokenHint("");
            setHasTokenInDb(false);
            setAutoConfirm(true);
        } catch (error) {
            toast.error("Lỗi khi hủy kết nối.");
        } finally {
            setIsDisconnecting(false);
        }
    };

    const handleCopyWebhook = () => {
        navigator.clipboard.writeText(webhookUrl);
        toast.info("Đã copy link Webhook!");
    };

    if (isLoading) {
        return (
            <div className="p-5 bg-white border border-t-0 border-slate-200 rounded-b-xl flex justify-center py-20">
                <span className="w-8 h-8 border-4 border-slate-200 border-t-brand rounded-full animate-spin"></span>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 bg-white border border-t-0 border-slate-200 rounded-b-xl animate-[fadeIn_0.2s_ease-out] flex-1">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8">
                
                {/* CỘT TRÁI */}
                <div className="w-full md:w-1/2 flex flex-col gap-5">
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-200">
                            <span className="text-[14px] font-bold text-slate-800">Trạng thái API:</span>
                            {hasTokenInDb ? (
                                <span className="px-3 py-1 bg-green-100 text-green-700 text-[12px] font-bold rounded-full flex items-center gap-1.5">
                                    <i className="fa-solid fa-circle-check"></i> Đang kết nối
                                </span>
                            ) : (
                                <span className="px-3 py-1 bg-slate-200 text-slate-600 text-[12px] font-bold rounded-full flex items-center gap-1.5">
                                    <i className="fa-solid fa-circle-xmark"></i> Chưa kết nối
                                </span>
                            )}
                        </div>

                        <div className="mb-6">
                            <label className="block text-[13px] font-semibold text-slate-700 mb-2">API Token <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                onClick={() => {
                                    // Magic UX: Bấm vào nếu đang là chuỗi Hint thì tự động xóa trắng để nhập token mới
                                    if(token === tokenHint) setToken("");
                                }}
                                placeholder="Nhập chuỗi Token của bạn..."
                                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-[13px] outline-none focus:border-brand font-mono"
                            />
                            <p className="text-[11px] text-slate-500 mt-1.5">Lấy Token tại <a href="https://my.sepay.vn" target="_blank" rel="noreferrer" className="text-brand hover:underline font-semibold">my.sepay.vn</a> &gt; Cài đặt &gt; API Token.</p>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6 relative overflow-hidden">
                            <div className={`absolute top-0 left-0 w-1 h-full transition-colors ${autoConfirm ? 'bg-brand' : 'bg-slate-300'}`}></div>
                            
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex-1">
                                    <h4 className={`text-[14px] font-bold mb-1 transition-colors ${autoConfirm ? 'text-brand' : 'text-slate-600'}`}>
                                        <i className={`fa-solid ${autoConfirm ? 'fa-robot' : 'fa-hand-pointer'} mr-1.5`}></i> 
                                        {autoConfirm ? 'Gạch nợ Tự động' : 'Duyệt Thủ công'}
                                    </h4>
                                    <p className="text-[11px] text-slate-500 leading-relaxed">
                                        {autoConfirm 
                                            ? "Hệ thống tự động trừ nợ khi phát hiện chuyển khoản khớp mã HĐ."
                                            : "Chỉ lưu lịch sử vào tab đối soát. Bạn phải tự bấm xác nhận thu."}
                                    </p>
                                </div>
                                
                                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={autoConfirm} 
                                        onChange={(e) => setAutoConfirm(e.target.checked)} 
                                    />
                                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
                                </label>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="px-5 py-2.5 bg-brand text-white rounded-lg text-[13px] font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm shadow-brand/30"
                                >
                                    {isSaving ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : <i className="fa-solid fa-floppy-disk"></i>}
                                    Lưu cấu hình
                                </button>

                                {hasTokenInDb && (
                                    <button 
                                        onClick={handleTest}
                                        disabled={isTesting}
                                        className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-600 hover:text-white transition-colors disabled:opacity-50"
                                        title="Chạy thử kết nối2"
                                    >
                                        {isTesting ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span> : <i className="fa-solid fa-bolt"></i>}
                                    </button>
                                )}
                            </div>
                            
                            {hasTokenInDb && (
                                <button 
                                    onClick={handleDisconnect}
                                    disabled={isDisconnecting}
                                    className="text-[12px] font-semibold text-red-500 hover:text-red-700 hover:underline transition-colors flex items-center gap-1.5 px-2"
                                >
                                    <i className="fa-solid fa-trash-can"></i> Xóa Token
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* CỘT PHẢI */}
                <div className="w-full md:w-1/2 flex flex-col gap-5">
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 relative overflow-hidden h-full">
                        {hasTokenInDb && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand to-green-300"></div>}
                        
                        <h3 className="text-[14px] font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <i className="fa-solid fa-satellite-dish text-brand"></i> Cấu hình Webhook
                        </h3>

                        <label className="block text-[12px] font-semibold text-slate-700 mb-2">Đường dẫn Webhook của bạn:</label>
                        <div className="flex bg-white border border-slate-300 rounded-lg overflow-hidden mb-5 shadow-sm">
                            <input 
                                type="text" 
                                readOnly 
                                value={webhookUrl}
                                className="w-full px-3 py-2.5 text-[13px] text-slate-600 font-mono outline-none bg-transparent"
                            />
                            <button 
                                onClick={handleCopyWebhook}
                                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[12px] border-l border-slate-300 transition-colors uppercase tracking-wider"
                            >
                                Copy
                            </button>
                        </div>

                        <div className="text-[13px] text-slate-600 space-y-3 bg-white p-4 rounded-lg border border-slate-200">
                            <p className="font-bold text-slate-800">Các bước tích hợp:</p>
                            <ul className="list-decimal list-inside space-y-2 ml-1">
                                <li>Truy cập menu <b>Tích hợp (Integration)</b> trên SePay.</li>
                                <li>Dán đường dẫn Webhook ở trên vào ô <b>Webhook URL</b>.</li>
                                <li>Tick chọn sự kiện <b>Nhận tiền</b>.</li>
                                <li>Bấm Lưu. Hệ thống sẽ tự động quét nội dung chuyển khoản để đối soát hóa đơn!</li>
                            </ul>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}