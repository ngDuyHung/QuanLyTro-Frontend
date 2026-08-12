import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import settingService from "@/services/settingService";
import api from "@/services/api";

export default function PushConfigTab() {
    const [autoRemind, setAutoRemind] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);

    const [permission, setPermission] = useState(Notification.permission);
    const [isSubscribing, setIsSubscribing] = useState(false);
    // state quản lý loading cho nút test
    const [isTestingWorkflow, setIsTestingWorkflow] = useState(false);


    // Link Cronjob API
    const cronUrl = `${import.meta.env.VITE_API_BASE_URL}/cron/remind-utility-readings`;

    const fetchConfig = useCallback(async () => {
        try {
            setIsLoading(true);
            const res = await settingService.getAutoRemindSetting();
            setAutoRemind(res.data?.auto_remind_utility);
        } catch (error) {
            console.error("Lỗi lấy cấu hình nhắc nhở:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

    const handleSave = async () => {
        try {
            setIsSaving(true);
            await settingService.toggleAutoRemind({ is_active: autoRemind });
            toast.success("Đã cập nhật trạng thái hệ thống nhắc nhở!");
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi khi lưu cấu hình.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleTestWorkflow = async () => {
        try {
            setIsTestingWorkflow(true);
            const res = await settingService.testWorkflowRemind();
            toast.success(`${res.data.message} Đã nhắc ${res.data.reminded_rooms} phòng.`);
        } catch (error) {
            toast.warning(error.response?.data?.message || "Lỗi khi chạy thử luồng.");
        } finally {
            setIsTestingWorkflow(false);
        }
    };

    const handleTestPush = async () => {
        try {
            setIsTesting(true);
            const res = await settingService.testPushNotification();
            toast.success(res.data?.message || "Đã gửi thông báo. Hãy kiểm tra màn hình!");
        } catch (error) {
            toast.error(error.response?.data?.message || "Không thể gửi test. Hãy chắc chắn bạn đã cấp quyền bên dưới.");
        } finally {
            setIsTesting(false);
        }
    };

    const urlBase64ToUint8Array = (base64String) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };

    const handleSubscribeDevice = async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            toast.error("Trình duyệt của bạn không hỗ trợ Web Push Notification.");
            return;
        }

        try {
            setIsSubscribing(true);
            const currentPerm = await Notification.requestPermission();
            setPermission(currentPerm);

            if (currentPerm !== 'granted') {
                toast.warning("Bạn đã từ chối nhận thông báo. Hãy mở cài đặt trình duyệt để bật lại.");
                return;
            }

            const registration = await navigator.serviceWorker.ready;
            const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || "YOUR_VAPID_PUBLIC_KEY";

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
            });

            const subData = subscription.toJSON();
            await api.post('/push/subscribe', {
                endpoint: subData.endpoint,
                keys: subData.keys
            });

            toast.success("Đăng ký nhận thông báo trên thiết bị này thành công!");
        } catch (error) {
            console.error(error);
            toast.error("Đăng ký thất bại. Kiểm tra lại kết nối hoặc public key.");
        } finally {
            setIsSubscribing(false);
        }
    };

    const handleCopyCron = () => {
        navigator.clipboard.writeText(cronUrl);
        toast.info("Đã copy link Cronjob API!");
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
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8">

                {/* CỘT TRÁI: ĐIỀU KHIỂN HỆ THỐNG */}
                <div className="w-full md:w-[55%] flex flex-col gap-5">
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 h-full">
                        <h3 className="text-[15px] font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <i className="fa-solid fa-clock text-amber-500"></i> Cấu hình tự động nhắc nhở
                        </h3>

                        <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6 relative overflow-hidden shadow-sm">
                            <div className={`absolute top-0 left-0 w-1 h-full transition-colors ${autoRemind ? 'bg-brand' : 'bg-slate-300'}`}></div>

                            <div className="flex items-center justify-between gap-4">
                                <div className="flex-1">
                                    <h4 className={`text-[14px] font-bold mb-1 transition-colors ${autoRemind ? 'text-brand' : 'text-slate-600'}`}>
                                        {autoRemind ? 'Đang bật tự động nhắc nhở' : 'Đã tắt nhắc nhở'}
                                    </h4>
                                    <p className="text-[11px] text-slate-500 leading-relaxed">
                                        {autoRemind
                                            ? "Hệ thống sẽ tự động quét và gửi thông báo đến khách thuê trước ngày thu tiền nếu họ chưa chốt điện nước."
                                            : "Hệ thống đang tạm ngưng việc quét và gửi thông báo nhắc nhở cho khu trọ của bạn."}
                                    </p>
                                </div>

                                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={autoRemind}
                                        onChange={(e) => setAutoRemind(e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-brand rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
                                </label>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mb-6">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-5 py-2.5 bg-brand text-white rounded-lg text-[13px] font-semibold hover:bg-brand-dark transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {isSaving ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : <i className="fa-solid fa-floppy-disk"></i>}
                                Lưu cấu hình
                            </button>
                        </div>

                        {/* HƯỚNG DẪN CRONJOB */}
                        <div className="pt-5 border-t border-slate-200">
                            <h4 className="text-[13px] font-bold text-slate-800 mb-2">Đường dẫn Cronjob API:</h4>
                            <div className="flex bg-white border border-slate-300 rounded-lg overflow-hidden mb-4 shadow-sm">
                                <input
                                    type="text"
                                    readOnly
                                    value={cronUrl}
                                    className="w-full px-3 py-2 text-[12px] text-slate-600 font-mono outline-none bg-transparent"
                                />
                                <button
                                    onClick={handleCopyCron}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[12px] border-l border-slate-300 transition-colors uppercase"
                                >
                                    Copy
                                </button>
                            </div>

                            <div className="text-[12px] text-slate-600 bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                                <p className="font-bold text-blue-800 mb-2">Hướng dẫn Cài đặt trên Server / Cpanel:</p>
                                <p className="mb-2">Thiết lập Cronjob chạy mỗi ngày 1 lần (Ví dụ: <code>0 8 * * *</code>) với lệnh CURL sau. Hãy thay <code>YOUR_SECRET_KEY</code> bằng Secret lưu trong file .env của hệ thống.</p>
                                <code className="block bg-slate-800 text-green-400 p-3 rounded-md text-[11px] overflow-x-auto whitespace-pre-wrap">
                                    curl -X POST {cronUrl} -H "X-Cron-Secret: YOUR_SECRET_KEY"
                                </code>
                                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between gap-4 shadow-sm">
                                    <div>
                                        <h4 className="text-[13px] font-bold text-amber-800 mb-0.5">Demo Workflow</h4>
                                        <p className="text-[11px] text-amber-700">Chạy thử luồng tự động tìm các phòng chưa chốt điện nước và gửi thông báo Push ngay lập tức (Bỏ qua điều kiện ngày tháng).</p>
                                    </div>
                                    <button
                                        onClick={handleTestWorkflow}
                                        disabled={isTestingWorkflow}
                                        className="shrink-0 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[12px] font-bold transition-colors shadow-md disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isTestingWorkflow ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : <i className="fa-solid fa-play"></i>}
                                        Chạy thử ngay
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* CỘT PHẢI: QUẢN LÝ THIẾT BỊ & TEST */}
                <div className="w-full md:w-[45%] flex flex-col gap-5">
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 relative overflow-hidden h-full">
                        <h3 className="text-[15px] font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <i className="fa-solid fa-mobile-screen text-blue-500"></i> Thiết bị của bạn
                        </h3>

                        <div className="mb-5">
                            <p className="text-[13px] text-slate-600 mb-3">
                                Để nhận thông báo trên máy tính/điện thoại này, bạn cần cấp quyền cho trình duyệt.
                            </p>

                            <button
                                onClick={handleSubscribeDevice}
                                disabled={isSubscribing || permission === 'granted'}
                                className={`w-full py-2.5 rounded-lg text-[13px] font-bold border transition-colors flex justify-center items-center gap-2
                                    ${permission === 'granted'
                                        ? 'bg-green-50 border-green-200 text-green-700'
                                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                            >
                                {isSubscribing && <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></span>}
                                {permission === 'granted' ? (
                                    <><i className="fa-solid fa-check"></i> Đã cấp quyền trên thiết bị này</>
                                ) : (
                                    <><i className="fa-regular fa-bell"></i> Cho phép nhận thông báo</>
                                )}
                            </button>
                        </div>

                        <div className="pt-4 border-t border-slate-200">
                            <p className="text-[12px] text-slate-500 mb-3">
                                Bạn có thể test gửi 1 thông báo thực tế từ Server về máy bạn để kiểm tra đường truyền:
                            </p>
                            <button
                                onClick={handleTestPush}
                                disabled={isTesting || permission !== 'granted'}
                                className="px-5 py-2 border border-blue-200 bg-blue-50 text-blue-600 rounded-lg text-[13px] font-bold hover:bg-blue-600 hover:text-white transition-colors disabled:opacity-50"
                            >
                                {isTesting ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></span> : <i className="fa-solid fa-paper-plane"></i>} Gửi Test Thông báo
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}