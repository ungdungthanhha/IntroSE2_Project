// src/App.tsx
import { useEffect, useState } from 'react';
// 1. QUAN TRỌNG: Import Navigate
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { auth } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/Videos';
import Users from './pages/Users';
import Reports from './pages/Reports';
import Login from './pages/Login';

const ProtectedRoute = ({ children }: { children: any }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const isNewSession = !sessionStorage.getItem('browserSession');

    if (isNewSession) {
      localStorage.removeItem('isAdmin');
      localStorage.removeItem('adminEmail');
      sessionStorage.setItem('browserSession', 'active');
    }

    // Lắng nghe trạng thái auth từ Firebase
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Kiểm tra localStorage
        const isAdmin = localStorage.getItem('isAdmin') === 'true';
        setIsAuthenticated(isAdmin);

        if (!isAdmin) {
          // Đăng xuất Firebase và redirect
          await auth.signOut();
          navigate('/login');
        }
      } else {
        // Không có user -> chưa đăng nhập
        setIsAuthenticated(false);
        localStorage.clear();
        navigate('/login');
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [navigate]);

  // Hiển thị loading trong khi kiểm tra auth
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '16px',
        color: '#666'
      }}>
        ⏳ Đang kiểm tra phiên đăng nhập...
      </div>
    );
  }

  return isAuthenticated ? children : null;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Khu vực Admin */}
        <Route path="/" element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/videos" replace />} />
          <Route path="videos" element={<Dashboard />} />

          <Route path="users" element={<Users />} />
          <Route path="reports" element={<Reports />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;