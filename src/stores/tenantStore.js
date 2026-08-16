import { create } from 'zustand';

const useTenantStore = create((set) => ({
  leases: [],
  currentLeaseId: null,
  
  setLeases: (leases) => set({ leases }),
  setCurrentLeaseId: (id) => set({ currentLeaseId: id }),
  clearTenantData: () => set({ leases: [], currentLeaseId: null }),
}));

export default useTenantStore;