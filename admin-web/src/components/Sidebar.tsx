// src/components/Sidebar.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom'; 
import { FaTiktok, FaVideo, FaUsers, FaFlag, FaSignOutAlt } from 'react-icons/fa';
import { logoutAdmin } from '../services/authService'; // Import hàm đăng xuất chuẩn

const Sidebar: React.FC = () => {
  const location = useLocation();

  // Hàm xử lý Đăng xuất
  const handleLogout = async () => {
    const confirm = window.confirm("Bạn có chắc chắn muốn đăng xuất?");
    if (confirm) {
      await logoutAdmin();
    }
  };

  // Hàm tạo Style động cho từng Link
  const getLinkStyle = (path: string) => {
    // Kiểm tra xem đường dẫn hiện tại có bắt đầu bằng path này không
    // (Để khi vào /videos/detail vẫn sáng đèn tab Video)
    const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
    
    return {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '14px 20px',
      textDecoration: 'none',
      fontSize: '15px',
      fontWeight: isActive ? '700' : '500',
      color: isActive ? '#fe2c55' : '#161823',
      backgroundColor: isActive ? 'rgba(254, 44, 85, 0.06)' : 'transparent',
      borderRight: isActive ? '4px solid #fe2c55' : '4px solid transparent',
      transition: 'all 0.2s ease-in-out',
      borderRadius: '0 8px 8px 0',
      marginRight: '10px'
    };
  };

  return (
    <aside style={{ 
      width: '260px', 
      background: '#ffffff', 
      height: '100vh', 
      borderRight: '1px solid #e3e3e4',
      display: 'flex', 
      flexDirection: 'column',
      boxSizing: 'border-box',
      paddingTop: '20px'
    }}>
      {/* --- LOGO --- */}
      <div style={{ 
        display: 'flex', alignItems: 'center', gap: '8px', 
        padding: '0 24px 30px 24px', 
        fontSize: '22px', fontWeight: '800' 
      }}>
        <FaTiktok size={26} color="#000" />
        <span>TikToc <span style={{ color: '#fe2c55' }}>Admin</span></span>
      </div>
      
      {/* --- MENU --- */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
        
        {/* 1. Tab Video */}
        <Link to="/videos" style={getLinkStyle('/videos')}>
          <FaVideo size={18} />
          <span>Video</span>
        </Link>

        {/* 2. Tab Người dùng */}
        <Link to="/users" style={getLinkStyle('/users')}>
          <FaUsers size={18} />
          <span>Người dùng</span>
        </Link>

        {/* 3. Tab Báo cáo */}
        <Link to="/reports" style={getLinkStyle('/reports')}>
          <FaFlag size={18} />
          <span>Kiểm duyệt</span>
        </Link>
      </nav>

      {/* --- LOGOUT BUTTON --- */}
      <div style={{ padding: '20px' }}>
        <button 
          onClick={handleLogout}
          style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            width: '100%', padding: '12px', 
            background: '#f1f1f2', color: '#161823', 
            border: 'none', borderRadius: '8px', 
            fontWeight: '600', cursor: 'pointer', transition: '0.3s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#e4e4e6'}
          onMouseOut={(e) => e.currentTarget.style.background = '#f1f1f2'}
        >
          <FaSignOutAlt /> Đăng xuất
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;