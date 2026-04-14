import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center text-[#003d9b]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-[#003d9b]/20 border-t-[#003d9b] rounded-full animate-spin"></div>
          <p className="text-sm font-medium">正在加载您的账户信息...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
