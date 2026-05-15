import PropertiesTabs from "@/components/properties/PropertiesTabs";
import PropertiesToolbar from "@/components/properties/PropertiesToolbar";
import PropertyList from "@/components/properties/PropertyList";
import PropertyOverview from "@/components/properties/PropertyOverview";
import RoomList from "@/components/properties/RoomList";

export default function PropertiesPage() {
  return (
    <div className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-6 lg:p-8 flex flex-col h-full bg-slate-50">
      
      {/* Khối Tabs & Toolbar */}
      <PropertiesTabs />
      <PropertiesToolbar />

      {/* Main Content Grid */}
      <div className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-12 lg:gap-6">
        
        {/* CỘT TRÁI: Danh sách khu nhà (Tỷ lệ 5/12) */}
        <div className="lg:col-span-5 flex flex-col gap-4 lg:overflow-y-auto no-scrollbar lg:pr-1 mb-6 lg:mb-0">
          <PropertyList />
        </div>

        {/* CỘT PHẢI: Chi tiết phòng & Tổng quan (Tỷ lệ 7/12) */}
        <div className="lg:col-span-7 flex flex-col h-full gap-6">
          
          {/* KHỐI TỔNG QUAN: 
              - Mobile: Nằm TRÊN (order-1)
              - Desktop: Bị đẩy xuống DƯỚI (lg:order-2) 
          */}
          <div className="order-1 lg:order-2 shrink-0">
            <PropertyOverview />
          </div>

          {/* KHỐI DANH SÁCH PHÒNG: 
              - Mobile: Nằm DƯỚI (order-2)
              - Desktop: Được đẩy lên TRÊN (lg:order-1) 
          */}
          <div className="order-2 lg:order-1 flex-1 flex flex-col min-h-0">
            <RoomList />
          </div>

        </div>

      </div>
    </div>
  );
}