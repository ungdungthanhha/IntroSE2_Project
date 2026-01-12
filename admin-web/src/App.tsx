// src/App.tsx
import { useEffect } from 'react';
// 1. QUAN TRỌNG: Import Navigate
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/Videos';
import Users from './pages/Users';
import Reports from './pages/Reports';
import Login from './pages/Login'; 

// --- COMPONENT BẢO VỆ (Giữ nguyên) ---
const ProtectedRoute = ({ children }: { children: any }) => {
  const navigate = useNavigate();
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  useEffect(() => {
    if (!isAdmin) navigate('/login');
  }, [isAdmin, navigate]);

  return isAdmin ? children : null;
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