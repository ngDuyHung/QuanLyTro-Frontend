import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import tenantMemberService from "@/services/tenantMemberService";
import TenantMembersTable from "@/components/tenant/members/TenantMembersTable";
import TenantAddMemberModal from "@/components/tenant/members/TenantAddMemberModal";
import TenantEditMemberModal from "@/components/tenant/members/TenantEditMemberModal";
import TenantViewMemberModal from "@/components/tenant/members/TenantViewMemberModal";
import TenantRemoveMemberModal from "@/components/tenant/members/TenantRemoveMemberModal";

export default function TenantMembersPage() {
    const [members, setMembers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Quản lý Modal & Data
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);

    const fetchMembers = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await tenantMemberService.getAll();
            setMembers(res.data?.data || res.data || []);
        } catch (error) {
            toast.error("Không thể tải danh sách thành viên.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    // Các hàm mở Modal
    const openEdit = (member) => { setSelectedMember(member); setIsEditModalOpen(true); };
    const openView = (member) => { setSelectedMember(member); setIsViewModalOpen(true); };
    const openRemove = (member) => { setSelectedMember(member); setIsRemoveModalOpen(true); };

    return (
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-4 md:p-6 lg:p-8 flex flex-col h-full bg-slate-50">
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
                <div>
                    <h1 className="text-[22px] font-bold text-slate-800">Thành viên ở ghép</h1>
                    <p className="text-[13px] text-slate-500 mt-1">Quản lý những người đang lưu trú cùng bạn trong phòng.</p>
                </div>
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="w-full sm:w-auto px-5 py-2.5 bg-brand text-white rounded-lg text-[13px] font-bold hover:bg-brand/90 shadow-sm flex items-center justify-center gap-2"
                >
                    <i className="fa-solid fa-user-plus"></i> Thêm thành viên
                </button>
            </div>

            <div className="flex-1 min-h-0 flex flex-col">
                <TenantMembersTable 
                    members={members} 
                    isLoading={isLoading} 
                    onView={openView}
                    onEdit={openEdit}
                    onRemove={openRemove}
                />
            </div>

            {/* Các Modals */}
            <TenantAddMemberModal open={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSuccess={fetchMembers} />
            <TenantEditMemberModal open={isEditModalOpen} member={selectedMember} onClose={() => { setIsEditModalOpen(false); setSelectedMember(null); }} onSuccess={fetchMembers} />
            <TenantViewMemberModal open={isViewModalOpen} member={selectedMember} onClose={() => { setIsViewModalOpen(false); setSelectedMember(null); }} />
            <TenantRemoveMemberModal open={isRemoveModalOpen} member={selectedMember} onClose={() => { setIsRemoveModalOpen(false); setSelectedMember(null); }} onSuccess={fetchMembers} />
        </div>
    );
}