import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import type { Station } from '../types/app';

type DateOption = {
  day: string;
  date: string;
  fullDate: Date;
};

const buildScheduledAt = (fullDate: Date, time: string) => {
  const [timePart, period] = time.split(' ');
  const [rawHour, rawMinute] = timePart.split(':').map(Number);
  let hour = rawHour;

  if (period === 'PM' && hour !== 12) {
    hour += 12;
  }
  if (period === 'AM' && hour === 12) {
    hour = 0;
  }

  const target = new Date(fullDate);
  target.setHours(hour, rawMinute, 0, 0);
  return target.toISOString();
};

export default function Booking() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('12:15 PM');
  const [dates, setDates] = useState<DateOption[]>([]);
  const [currentMonthYear, setCurrentMonthYear] = useState('');
  const [stations, setStations] = useState<Station[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const preferredStationId = ((location.state as { stationId?: string } | null)?.stationId || user?.defaultStationId) ?? null;

  useEffect(() => {
    const today = new Date();
    const nextDates: DateOption[] = [];
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let index = 0; index < 7; index += 1) {
      const value = new Date(today);
      value.setDate(today.getDate() + index);
      nextDates.push({
        day: weekdays[value.getDay()],
        date: value.getDate().toString(),
        fullDate: value,
      });
    }

    setDates(nextDates);
    setSelectedDate(nextDates[0].date);
    setCurrentMonthYear(`${today.getFullYear()}年${today.getMonth() + 1}月`);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadStations = async () => {
      try {
        const result = await api.getStations({
          city: user?.city,
          district: user?.district,
        });
        if (!cancelled) {
          setStations(result);
        }
      } catch (stationError) {
        if (!cancelled) {
          setError(stationError instanceof Error ? stationError.message : '加载门店失败');
        }
      }
    };

    void loadStations();
    return () => {
      cancelled = true;
    };
  }, [user?.city, user?.district]);

  const station = useMemo(() => {
    if (preferredStationId) {
      return stations.find((item) => item.id === preferredStationId) || stations[0] || null;
    }
    return stations[0] || null;
  }, [preferredStationId, stations]);

  const times = ['09:00 AM', '10:30 AM', '12:15 PM', '02:45 PM', '04:00 PM', '05:30 PM', '07:00 PM', '08:30 PM', '10:00 PM'];

  const handleBooking = async () => {
    const selectedDateOption = dates.find((item) => item.date === selectedDate);
    if (!station || !selectedDateOption) {
      setError('当前没有可预约门店或时间');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const booking = await api.createBooking({
        stationId: station.id,
        scheduledAt: buildScheduledAt(selectedDateOption.fullDate, selectedTime),
      });
      navigate('/booking-success', { state: { booking } });
    } catch (bookingError) {
      setError(bookingError instanceof Error ? bookingError.message : '预约失败，请稍后再试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#f7f9fb] text-[#191c1e] min-h-screen pb-32">
      <header className="fixed top-0 w-full z-50 bg-[#f7f9fb]/80 backdrop-blur-md shadow-[0_4px_20px_-4px_rgba(0,61,155,0.05)] flex items-center justify-between px-6 h-16">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="material-symbols-outlined text-[#003d9b] hover:opacity-80 transition-opacity">
            arrow_back_ios
          </button>
          <h1 className="text-xl font-extrabold tracking-tighter text-[#003d9b] font-headline">预约洗车</h1>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/notifications" className="hover:opacity-80 transition-opacity active:scale-95 text-[#434654]">
            <span className="material-symbols-outlined">notifications</span>
          </Link>
        </div>
      </header>
      <main className="pt-24 px-4 max-w-2xl mx-auto space-y-8">
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-[#c3c6d6]/15">
          <p className="text-xs uppercase tracking-widest text-[#737685] font-bold mb-2">预约门店</p>
          <h2 className="text-xl font-bold text-[#191c1e]">{station ? `智净24H ${station.name}` : '正在加载门店...'}</h2>
          <p className="text-sm text-[#737685] mt-1">{station?.address || '请稍候'}</p>
          <p className="text-sm text-[#003d9b] mt-3">空闲设备：{station ? `${station.availableDevices}/${station.totalDevices}` : '--'}</p>
        </section>
        <section className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-base font-bold text-[#191c1e]">预约日期</h2>
              <span className="text-xs font-medium text-[#003d9b]">{currentMonthYear}</span>
            </div>
            <div className="flex gap-3 overflow-x-auto py-2" style={{ scrollbarWidth: 'none' }}>
              {dates.map((item) => (
                <button
                  key={item.date}
                  onClick={() => setSelectedDate(item.date)}
                  className={`flex-shrink-0 w-14 h-20 rounded-2xl flex flex-col items-center justify-center transition-all ${selectedDate === item.date ? 'bg-[#003d9b] text-white shadow-lg ring-4 ring-[#003d9b]/10' : 'bg-[#ffffff] shadow-sm opacity-60 hover:opacity-100'}`}
                >
                  <span className={`text-[10px] font-medium mb-1 uppercase ${selectedDate === item.date ? '' : 'opacity-60'}`}>{item.day}</span>
                  <span className="font-bold text-lg">{item.date}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="text-base font-bold text-[#191c1e] px-1">可用时间段</h2>
            <div className="grid grid-cols-3 gap-3">
              {times.map((time) => (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  className={`h-14 rounded-xl text-sm transition-colors ${selectedTime === time ? 'bg-[#50d9fe] text-[#005c70] border-2 border-[#00677d] font-bold shadow-md' : 'bg-[#ffffff] border border-[#c3c6d6]/30 font-medium text-[#434654] hover:bg-[#eceef0]'}`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        </section>
        {error ? <div className="bg-[#fff4f4] text-[#ba1a1a] rounded-2xl px-4 py-3 text-sm">{error}</div> : null}
      </main>
      <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t border-[#c3c6d6]/10 px-6 pt-4 pb-10 z-40">
        <div className="flex gap-4 max-w-2xl mx-auto">
          <button onClick={() => navigate(-1)} className="flex-1 h-12 rounded-xl border border-[#c3c6d6] text-[#434654] font-bold hover:bg-[#f2f4f6] transition-colors active:scale-95">
            取消
          </button>
          <button
            onClick={handleBooking}
            disabled={submitting}
            className="flex-[2] h-12 rounded-xl bg-[#003d9b] text-white font-bold shadow-[0_8px_24px_rgba(0,61,155,0.15)] hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <span>{submitting ? '预约中...' : '立即预约'}</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}
