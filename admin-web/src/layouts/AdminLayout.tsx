// src/layouts/AdminLayout.tsx
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { SearchProvider } from '../context/SearchContext';

const AdminLayout = () => {
  return (
    <SearchProvider>
      {/* 1. Khung bao ngoài cùng: Khóa chặt chiều cao bằng đúng màn hình, không cho body scroll */}
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        
        {/* Sidebar nằm bên trái, tự động cao theo khung cha (100vh) */}
        <Sidebar />

        {/* 2. Phần bên phải (Header + Nội dung) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
          
          {/* Header nằm im ở trên cùng */}
          <Header />

          {/* 3. Khu vực nội dung thay đổi (Outlet): */}
          {/* overflowY: 'auto' -> Chỉ cho phép cuộn riêng khu vực này */}
          <div style={{ flex: 1, overflowY: 'auto', background: '#f8f9fa' }}>
            <Outlet />
          </div>
          
        </div>
      </div>
    </SearchProvider>
  );
};

export default AdminLayout;