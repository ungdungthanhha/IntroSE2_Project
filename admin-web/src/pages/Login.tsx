// src/pages/Login.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTiktok } from 'react-icons/fa';
import { loginAdmin } from '../services/authService';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Gọi service đăng nhập
      await loginAdmin(email, password);
      
      // Đăng nhập thành công -> Chuyển thẳng vào trang Videos
      navigate('/videos');
      
    } catch (err: any) {
      console.error(err);
      // Xử lý thông báo lỗi chi tiết
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
        setError('Email hoặc mật khẩu không chính xác!');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau 5 phút.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Lỗi kết nối mạng. Vui lòng kiểm tra internet.');
      } else {
        setError(err.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: '#f8f9fa',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    }}>
      {/* Thêm style CSS animation cho cái vòng xoay loading */}
      <style>
        {`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          .loader {
            border: 2px solid rgba(255,255,255,0.3);
            border-top: 2px solid #fff;
            border-radius: 50%;
            width: 14px;
            height: 14px;
            animation: spin 1s linear infinite;
            display: inline-block;
          }
        `}
      </style>

      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        width: '100%',
        maxWidth: '400px',
        textAlign: 'center'
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '30px' }}>
          <FaTiktok size={32} color="#000" />
          <span style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px' }}>
            TikToc <span style={{ color: '#fe2c55' }}>Admin</span>
          </span>
        </div>

        <h3 style={{ margin: '0 0 24px 0', color: '#161823', fontSize: '20px', fontWeight: '700' }}>
          Đăng nhập hệ thống
        </h3>

        <form onSubmit={handleLogin}>
          {/* Email Input */}
          <div style={{ marginBottom: '16px', textAlign: 'left' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px', color: '#161823' }}>
              Email
            </label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%', padding: '12px', borderRadius: '4px',
                border: '1px solid #d3d3d3', boxSizing: 'border-box', outline: 'none',
                background: '#f1f1f2', fontSize: '15px', transition: '0.2s'
              }}
              onFocus={(e) => e.target.style.background = '#fff'}
              onBlur={(e) => e.target.style.background = '#f1f1f2'}
            />
          </div>

          {/* Password Input */}
          <div style={{ marginBottom: '24px', textAlign: 'left' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px', color: '#161823' }}>
              Mật khẩu
            </label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%', padding: '12px', borderRadius: '4px',
                border: '1px solid #d3d3d3', boxSizing: 'border-box', outline: 'none',
                background: '#f1f1f2', fontSize: '15px', transition: '0.2s'
              }}
              onFocus={(e) => e.target.style.background = '#fff'}
              onBlur={(e) => e.target.style.background = '#f1f1f2'}
            />
          </div>

          {/* Thông báo lỗi */}
          {error && (
            <div style={{ 
              color: '#ea2845', 
              fontSize: '13px', 
              margin: '-10px 0 20px', 
              background: 'rgba(234, 40, 69, 0.05)', 
              padding: '10px', 
              borderRadius: '4px',
              textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Button Submit */}
          <button 
            type="submit" 
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? '#fab1bb' : '#fe2c55', // Màu nhạt đi khi loading
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontWeight: '700',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: '0.2s',
              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px'
            }}
          >
            {loading && <span className="loader"></span>}
            {loading ? 'Đang xác thực...' : 'Đăng nhập'}
          </button>
        </form>

        <div style={{ marginTop: '24px', fontSize: '12px', color: '#888' }}>
          Bạn quên mật khẩu? <a href="#" style={{ color: '#fe2c55', textDecoration: 'none', fontWeight: '600' }}>Gọi support IT</a>
        </div>
      </div>
    </div>
  );
};

export default Login;