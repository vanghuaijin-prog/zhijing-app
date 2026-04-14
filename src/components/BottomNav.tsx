import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function BottomNav() {
  const location = useLocation();
  const path = location.pathname;
  
  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pt-2 pb-6 h-20 bg-[#ffffff] rounded-t-[24px] border-t border-[#c3c6d6]/15 shadow-[0_-8px_32px_-4px_rgba(0,61,155,0.08)]">
      <Link to="/" className={`flex flex-col items-center justify-center transition-colors active:scale-90 duration-200 ${path === '/' ? 'text-[#003d9b] bg-[#f2f4f6] rounded-xl px-4 py-1' : 'text-[#434654] hover:text-[#00677d]'}`}>
        <span className="material-symbols-outlined" style={path === '/' ? { fontVariationSettings: "'FILL' 1" } : {}}>map</span>
        <span className="text-[11px] font-bold tracking-wide mt-1">首页</span>
      </Link>
      <Link to="/packages" className={`flex flex-col items-center justify-center transition-colors active:scale-90 duration-200 ${path === '/packages' ? 'text-[#003d9b] bg-[#f2f4f6] rounded-xl px-4 py-1' : 'text-[#434654] hover:text-[#00677d]'}`}>
        <span className="material-symbols-outlined" style={path === '/packages' ? { fontVariationSettings: "'FILL' 1" } : {}}>local_activity</span>
        <span className="text-[11px] font-bold tracking-wide mt-1">套餐</span>
      </Link>
      <Link to="/control" className={`flex flex-col items-center justify-center transition-colors active:scale-90 duration-200 ${path === '/control' ? 'text-[#003d9b] bg-[#f2f4f6] rounded-xl px-4 py-1' : 'text-[#434654] hover:text-[#00677d]'}`}>
        <span className="material-symbols-outlined" style={path === '/control' ? { fontVariationSettings: "'FILL' 1" } : {}}>settings_remote</span>
        <span className="text-[11px] font-bold tracking-wide mt-1">控制</span>
      </Link>
      <Link to="/profile" className={`flex flex-col items-center justify-center transition-colors active:scale-90 duration-200 ${path === '/profile' ? 'text-[#003d9b] bg-[#f2f4f6] rounded-xl px-4 py-1' : 'text-[#434654] hover:text-[#00677d]'}`}>
        <span className="material-symbols-outlined" style={path === '/profile' ? { fontVariationSettings: "'FILL' 1" } : {}}>person</span>
        <span className="text-[11px] font-bold tracking-wide mt-1">我的</span>
      </Link>
    </nav>
  );
}
