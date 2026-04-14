import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import { formatDateTime } from '../lib/formatters';
import type { Booking } from '../types/app';

export default function BookingSuccess() {
  const location = useLocation();
  const initialBooking = (location.state as { booking?: Booking } | null)?.booking || null;
  const [booking, setBooking] = useState<Booking | null>(initialBooking);

  useEffect(() => {
    if (booking) {
      return;
    }

    let cancelled = false;
    const loadBooking = async () => {
      try {
        const bookings = await api.getBookings();
        if (!cancelled) {
          setBooking(bookings[0] || null);
        }
      } catch {
        if (!cancelled) {
          setBooking(null);
        }
      }
    };

    void loadBooking();
    return () => {
      cancelled = true;
    };
  }, [booking]);

  return (
    <div className="bg-[#f7f9fb] text-[#191c1e] min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-24 h-24 bg-[#50d9fe]/20 rounded-full flex items-center justify-center mb-6 relative">
        <div className="absolute inset-2 bg-[#00677d] rounded-full flex items-center justify-center shadow-lg">
          <span className="material-symbols-outlined text-white text-5xl">check</span>
        </div>
      </div>
      <h1 className="text-2xl font-headline font-black text-[#003d9b] mb-2">预约成功</h1>
      <p className="text-[#434654] text-sm mb-8 text-center">您的洗车服务已成功预约，请准时前往门店。</p>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#c3c6d6]/20 w-full max-w-sm mb-8 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-[#737685] text-sm">预约门店</span>
          <span className="font-bold text-[#191c1e]">{booking?.stationName || '智净24H 科技园站'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[#737685] text-sm">预约时间</span>
          <span className="font-bold text-[#003d9b]">{booking ? formatDateTime(booking.scheduledAt) : '--'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[#737685] text-sm">分配设备</span>
          <span className="font-bold text-[#191c1e]">{booking ? `${booking.deviceCode} ${booking.deviceName}` : '--'}</span>
        </div>
      </div>

      <div className="flex flex-col w-full max-w-sm gap-3">
        <Link to="/orders" className="w-full bg-[#003d9b] text-white font-bold py-4 rounded-xl shadow-[0_8px_24px_rgba(0,61,155,0.2)] active:scale-95 transition-all text-center">
          查看订单
        </Link>
        <Link to="/" className="w-full bg-transparent border-2 border-[#c3c6d6] text-[#434654] font-bold py-4 rounded-xl hover:bg-[#f2f4f6] active:scale-95 transition-all text-center">
          返回首页
        </Link>
      </div>
    </div>
  );
}
