import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { formatRelativeTime } from '../lib/formatters';
import type { AppNotification } from '../types/app';

const typeStyles: Record<AppNotification['type'], { icon: string; color: string; bg: string }> = {
  system: { icon: 'info', color: 'text-[#003d9b]', bg: 'bg-[#003d9b]/10' },
  promotion: { icon: 'campaign', color: 'text-[#ba1a1a]', bg: 'bg-[#ba1a1a]/10' },
  order: { icon: 'check_circle', color: 'text-[#00677d]', bg: 'bg-[#00677d]/10' },
};

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const loadNotifications = async () => {
      try {
        const result = await api.getNotifications();
        if (!cancelled) {
          setNotifications(result);
        }
      } catch (notificationError) {
        if (!cancelled) {
          setError(notificationError instanceof Error ? notificationError.message : '获取消息失败');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadNotifications();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="bg-[#f7f9fb] text-[#191c1e] min-h-screen pb-20">
      <header className="fixed top-0 w-full z-50 bg-[#f7f9fb]/80 backdrop-blur-xl flex items-center px-6 h-16 shadow-[0_4px_20px_-4px_rgba(0,61,155,0.05)]">
        <button onClick={() => navigate(-1)} className="material-symbols-outlined text-[#003d9b] mr-4 hover:opacity-80 transition-opacity">
          arrow_back_ios
        </button>
        <h1 className="text-lg font-bold text-[#003d9b] tracking-tight">消息中心</h1>
      </header>
      <main className="pt-24 px-4 max-w-2xl mx-auto space-y-4">
        {loading ? <div className="text-center text-[#737685] py-12">正在加载消息...</div> : null}
        {error ? <div className="bg-[#fff4f4] text-[#ba1a1a] rounded-2xl px-4 py-3 text-sm">{error}</div> : null}

        {notifications.map((notification) => {
          const style = typeStyles[notification.type];
          return (
            <div key={notification.id} className={`bg-white p-5 rounded-2xl shadow-sm border border-[#c3c6d6]/15 active:scale-[0.98] transition-transform cursor-pointer ${notification.read ? 'opacity-75' : ''}`}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full ${style.bg} flex items-center justify-center ${style.color}`}>
                    <span className="material-symbols-outlined text-sm">{style.icon}</span>
                  </div>
                  <h3 className="font-bold text-[#191c1e]">{notification.title}</h3>
                </div>
                <span className="text-xs text-[#737685] font-medium">{formatRelativeTime(notification.createdAt)}</span>
              </div>
              <p className="text-sm text-[#434654] pl-10">{notification.content}</p>
            </div>
          );
        })}

        {!loading && notifications.length === 0 ? <div className="text-center text-[#737685] py-16">暂无消息</div> : null}
      </main>
    </div>
  );
}
