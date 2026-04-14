import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { formatCurrency, formatDuration } from '../lib/formatters';
import type { ControlMode, ControlSession } from '../types/app';

const modeItems: Array<{ key: ControlMode; label: string; icon: string }> = [
  { key: 'water', label: '清水', icon: 'water_drop' },
  { key: 'foam', label: '泡沫', icon: 'soap' },
  { key: 'vacuum', label: '吸尘', icon: 'vacuum' },
  { key: 'handwash', label: '洗手', icon: 'dry_cleaning' },
];

export default function Control() {
  const navigate = useNavigate();
  const { refreshSession } = useAuth();
  const [session, setSession] = useState<ControlSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadSession = async () => {
    try {
      const currentSession = await api.getControlSession();
      setSession(currentSession);
    } catch (sessionError) {
      setError(sessionError instanceof Error ? sessionError.message : '加载设备会话失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSession();
  }, []);

  useEffect(() => {
    if (!session || session.isPaused) {
      return undefined;
    }

    const interval = window.setInterval(async () => {
      try {
        const nextSession = await api.tickControlSession();
        setSession(nextSession);
      } catch {
        window.clearInterval(interval);
      }
    }, 15000);

    return () => window.clearInterval(interval);
  }, [session]);

  const runAction = async (action: string, callback: () => Promise<ControlSession | null>) => {
    setBusyAction(action);
    setError('');
    try {
      const nextSession = await callback();
      setSession(nextSession);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : '操作失败');
    } finally {
      setBusyAction(null);
    }
  };

  const handleCheckout = async () => {
    setBusyAction('checkout');
    setError('');
    try {
      await api.checkoutControlSession();
      await refreshSession();
      navigate('/orders');
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : '结单失败');
      setBusyAction(null);
    }
  };

  return (
    <div className="bg-[#f7f9fb] text-[#191c1e] min-h-screen flex flex-col font-sans">
      <header className="fixed top-0 w-full z-50 bg-[#f7f9fb]/80 backdrop-blur-xl shadow-[0_4px_20px_-4px_rgba(0,61,155,0.05)] flex items-center justify-between px-6 h-16">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#003d9b]">location_on</span>
          <span className="text-lg font-black text-[#003d9b] tracking-tight">智净24H</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-[#50d9fe]/20 px-3 py-1 rounded-full gap-2 border border-[#50d9fe]/30">
            <span className={`w-2 h-2 rounded-full ${session?.isPaused ? 'bg-[#ba1a1a]' : 'bg-[#00677d] animate-pulse'}`}></span>
            <span className={`text-[10px] font-bold tracking-widest uppercase ${session?.isPaused ? 'text-[#ba1a1a]' : 'text-[#00677d]'}`}>
              {session ? (session.isPaused ? '设备已暂停' : '设备已连接 - 工作中') : '暂无设备会话'}
            </span>
          </div>
          <Link to="/notifications" className="material-symbols-outlined text-[#434654] hover:opacity-80 transition-opacity active:scale-95">
            notifications
          </Link>
        </div>
      </header>
      <main className="flex-grow pt-24 pb-32 px-6 flex flex-col items-center max-w-lg mx-auto w-full">
        {loading ? <div className="text-[#737685] py-20">正在连接设备...</div> : null}
        {!loading && !session ? (
          <div className="w-full bg-white rounded-3xl p-8 shadow-sm text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#003d9b]/10 flex items-center justify-center text-[#003d9b]">
              <span className="material-symbols-outlined text-3xl">qr_code_scanner</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#191c1e]">当前没有进行中的设备会话</h2>
              <p className="text-[#737685] mt-2">请先在首页扫码或点击“模拟扫描成功”开启设备。</p>
            </div>
            <Link to="/" className="inline-flex items-center justify-center px-8 py-3 bg-[#003d9b] text-white rounded-xl font-bold">
              返回首页
            </Link>
          </div>
        ) : null}

        {session ? (
          <>
            <section className="w-full flex justify-center mb-10 relative">
              <div
                className="w-64 h-64 rounded-full p-1 shadow-[0_20px_50px_rgba(0,61,155,0.15)] flex items-center justify-center relative"
                style={{ background: session.isPaused ? '#e0e3e5' : 'conic-gradient(from 180deg at 50% 50%, #003d9b 0deg, #50d9fe 180deg, #003d9b 360deg)' }}
              >
                <div className="absolute inset-4 rounded-full bg-[#ffffff] flex flex-col items-center justify-center shadow-inner">
                  <span className="text-[#434654] text-xs font-bold tracking-[0.2em] uppercase mb-1">当前消费金额</span>
                  <div className="flex items-baseline">
                    <span className="text-5xl font-black text-[#003d9b] tracking-tighter">{session.amount.toFixed(2)}</span>
                    <span className="ml-1 font-bold text-lg text-[#003d9b]">元</span>
                  </div>
                  <div className="mt-4 flex items-center gap-1.5 px-3 py-1 bg-[#eceef0] rounded-full">
                    <span className="material-symbols-outlined text-xs text-[#00677d]">timer</span>
                    <span className="text-[10px] font-bold text-[#434654] uppercase tracking-wider">已用 {formatDuration(session.durationMinutes)}</span>
                  </div>
                  <p className="text-xs text-[#737685] mt-3">{session.stationName} · {session.deviceCode}</p>
                </div>
                {!session.isPaused ? <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#003d9b] text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg uppercase tracking-widest">Live</div> : null}
              </div>
            </section>

            <section className="grid grid-cols-3 gap-4 w-full mb-8">
              {modeItems.slice(0, 3).map((item) => (
                <button
                  key={item.key}
                  onClick={() => runAction(`mode-${item.key}`, () => api.updateControlMode(item.key))}
                  disabled={busyAction !== null}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl shadow-[0_8px_20px_-6px_rgba(0,0,0,0.05)] active:scale-95 transition-all group disabled:opacity-60 ${session.activeMode === item.key ? 'bg-[#003d9b] text-white ring-4 ring-[#003d9b]/20' : 'bg-[#ffffff] border border-[#c3c6d6]/10 text-[#434654]'}`}
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-2 transition-colors ${session.activeMode === item.key ? 'bg-white/20' : 'bg-[#003d9b]/5 group-hover:bg-[#003d9b] group-hover:text-white'}`}>
                    <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                  </div>
                  <span className="text-xs font-bold">{item.label}</span>
                </button>
              ))}

              <div className="col-span-1"></div>

              <button
                onClick={() => runAction('mode-handwash', () => api.updateControlMode('handwash'))}
                disabled={busyAction !== null}
                className={`flex flex-col items-center justify-center p-4 rounded-xl shadow-[0_8px_20px_-6px_rgba(0,0,0,0.05)] active:scale-95 transition-all group disabled:opacity-60 ${session.activeMode === 'handwash' ? 'bg-[#003d9b] text-white ring-4 ring-[#003d9b]/20' : 'bg-[#ffffff] border border-[#c3c6d6]/10 text-[#434654]'}`}
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-2 transition-colors ${session.activeMode === 'handwash' ? 'bg-white/20' : 'bg-[#003d9b]/5 group-hover:bg-[#003d9b] group-hover:text-white'}`}>
                  <span className="material-symbols-outlined text-2xl">dry_cleaning</span>
                </div>
                <span className="text-xs font-bold">洗手</span>
              </button>

              <button
                onClick={() => runAction(session.isPaused ? 'resume' : 'pause', () => (session.isPaused ? api.resumeControlSession() : api.pauseControlSession()))}
                disabled={busyAction !== null}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border active:scale-95 transition-all group disabled:opacity-60 ${session.isPaused ? 'bg-[#ba1a1a] text-white border-[#ba1a1a] ring-4 ring-[#ba1a1a]/20' : 'bg-[#ba1a1a]/5 border-[#ba1a1a]/20 text-[#ba1a1a]'}`}
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-2 shadow-lg ${session.isPaused ? 'bg-white/20 text-white' : 'bg-[#ba1a1a] text-white shadow-[#ba1a1a]/20'}`}>
                  <span className="material-symbols-outlined text-2xl">{session.isPaused ? 'play_arrow' : 'pause'}</span>
                </div>
                <span className="text-xs font-bold">{session.isPaused ? '继续' : '暂停'}</span>
              </button>
            </section>

            {error ? <div className="w-full bg-[#fff4f4] text-[#ba1a1a] rounded-2xl px-4 py-3 text-sm mb-4">{error}</div> : null}

            <div className="w-full mt-auto space-y-4 relative">
              <button
                onClick={handleCheckout}
                disabled={busyAction !== null}
                className="w-full h-20 bg-[#003d9b] text-white rounded-xl flex items-center justify-center gap-4 shadow-[0_12px_32px_-8px_rgba(0,61,155,0.25)] active:scale-95 transition-transform overflow-hidden relative group disabled:opacity-60"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#003d9b] to-[#0052cc] opacity-50"></div>
                <span className="relative z-10 text-xl font-black tracking-widest uppercase">
                  {busyAction === 'checkout' ? '结单中...' : `一键结单 ${formatCurrency(session.amount)}`}
                </span>
                <span className="relative z-10 material-symbols-outlined text-2xl">check_circle</span>
              </button>
              <Link to="/feedback" className="absolute -top-16 right-0 w-12 h-12 bg-[#ba1a1a] rounded-full shadow-lg shadow-[#ba1a1a]/30 flex items-center justify-center active:scale-90 transition-transform">
                <span className="material-symbols-outlined text-white text-xl">build</span>
                <div className="absolute -right-2 -top-2 bg-[#191c1e] text-[#f7f9fb] text-[8px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">一键报修</div>
              </Link>
            </div>
          </>
        ) : null}
      </main>
      <BottomNav />
    </div>
  );
}
