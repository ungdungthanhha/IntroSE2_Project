// src/components/Header.tsx
import React, { useEffect, useState } from 'react';
import { FaSearch } from 'react-icons/fa'; 
import { auth } from '../services/firebase'; 
import { useSearch } from '../context/SearchContext'; // Import hook tìm kiếm

const Header: React.FC = () => {
  const [adminInfo, setAdminInfo] = useState({ name: 'Admin', email: '', avatar: '' });
  
  // Lấy hàm setSearchTerm từ Context
  const { searchTerm, setSearchTerm } = useSearch(); 

  // ... (Giữ nguyên đoạn useEffect lấy thông tin Admin cũ) ...
  useEffect(() => {
    const user = auth.currentUser;
    const storedEmail = localStorage.getItem('adminEmail');
    if (user) {
      const displayName = user.displayName || storedEmail?.split('@')[0] || "Admin";
      setAdminInfo({
        name: displayName,
        email: user.email || "",
        avatar: user.photoURL || `https://ui-avatars.com/api/?name=${displayName}&background=fe2c55&color=fff`
      });
    } else if (storedEmail) {
      const nameFromEmail = storedEmail.split('@')[0];
      setAdminInfo({
        name: nameFromEmail,
        email: storedEmail,
        avatar: `https://ui-avatars.com/api/?name=${nameFromEmail}&background=fe2c55&color=fff`
      });
    }
  }, []);

  return (
    <header style={{ 
      height: '70px', background: 'white', borderBottom: '1px solid #e3e3e4', 
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px',
      position: 'sticky', top: 0, zIndex: 100 
    }}>
      {/* Thanh tìm kiếm HOẠT ĐỘNG THẬT */}
      <div style={{ display: 'flex', alignItems: 'center', background: '#f1f1f2', padding: '10px 15px', borderRadius: '99px', width: '300px' }}>
        <FaSearch color="#a6a6a6" />
        <input 
          placeholder="Tìm kiếm (ID, Tên, Mô tả)..." 
          style={{ border: 'none', background: 'transparent', marginLeft: '10px', outline: 'none', width: '100%' }}
          
          // Binding dữ liệu 2 chiều
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: '700', fontSize: '14px', textTransform: 'capitalize' }}>{adminInfo.name}</div>
          <div style={{ fontSize: '12px', color: '#888' }}>{adminInfo.email}</div>
        </div>
        <img src={adminInfo.avatar} alt="Admin" style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid #eee', objectFit: 'cover' }} />
      </div>
    </header>
  );
};

export default Header;