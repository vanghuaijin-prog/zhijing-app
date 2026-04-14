import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { formatCurrency } from '../lib/formatters';
import type { RechargeOffer, WashPackage } from '../types/app';

export default function Packages() {
  const { refreshSession } = useAuth();
  const [activeTab, setActiveTab] = useState<'packages' | 'timecard' | 'recharge'>('packages');
  const [packages, setPackages] = useState<WashPackage[]>([]);
  const [rechargeOffers, setRechargeOffers] = useState<RechargeOffer[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [selectedRecharge, setSelectedRecharge] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const washCards = packages.filter((item) => item.kind === 'wash_card');
  const timeCards = packages.filter((item) => item.kind === 'time_card');
  const selectedPackage = packages.find((item) => item.id === selectedPackageId) || null;
  const total = activeTab === 'recharge' ? selectedRecharge || 0 : selectedPackage?.price || 0;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [packageList, rechargeList] = await Promise.all([api.getPackages(), api.getRechargeOffers()]);
        if (!cancelled) {
          setPackages(packageList);
          setRechargeOffers(rechargeList);
          setSelectedPackageId(packageList[0]?.id || null);
          setSelectedRecharge(rechargeList.find((item) => item.highlighted)?.amount || rechargeList[0]?.amount || null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : '加载数据失败');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'packages' && washCards.length > 0) {
      setSelectedPackageId((current) =>
        washCards.some((item) => item.id === current) ? current : washCards[0].id,
      );
    }
    if (activeTab === 'timecard' && timeCards.length > 0) {
      setSelectedPackageId((current) =>
        timeCards.some((item) => item.id === current) ? current : timeCards[0].id,
      );
    }
    if (activeTab === 'recharge' && selectedRecharge === null && rechargeOffers.length > 0) {
      setSelectedRecharge(rechargeOffers[0].amount);
    }
  }, [activeTab, rechargeOffers, selectedRecharge, timeCards, washCards]);

  const handleCustomRecharge = () => {
    const customValue = window.prompt('请输入充值金额');
    const amount = Number(customValue || 0);
    if (amount > 0) {
      setSelectedRecharge(amount);
      setActiveTab('recharge');
    }
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      if (activeTab === 'recharge') {
        if (!selectedRecharge) {
          throw new Error('请选择充值金额');
        }
        await api.createRecharge(selectedRecharge);
        await refreshSession();
        setMessage(`充值成功，金额 ${formatCurrency(selectedRecharge)}`);
      } else {
        if (!selectedPackage) {
          throw new Error('请选择套餐');
        }
        await api.purchasePackage(selectedPackage.id);
        await refreshSession();
        setMessage(`购买成功：${selectedPackage.title}`);
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const featuredWashCards = useMemo(() => washCards.slice().sort((left, right) => right.price - left.price), [washCards]);

  return (
    <div className="bg-[#f7f9fb] font-body text-[#191c1e] antialiased min-h-screen pb-40">
      <header className="fixed top-0 w-full z-50 bg-[#f7f9fb]/80 backdrop-blur-xl shadow-[0_4px_20px_-4px_rgba(0,61,155,0.05)]">
        <div className="flex items-center justify-between px-6 h-16 w-full">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#003d9b]">location_on</span>
            <span className="font-headline font-bold tracking-tight text-lg text-[#003d9b]">智净24H</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/notifications" className="material-symbols-outlined text-[#434654] hover:opacity-80 transition-opacity active:scale-95">
              notifications
            </Link>
          </div>
        </div>
      </header>
      <main className="pt-20 px-4 max-w-2xl mx-auto">
        <div className="flex p-1 bg-[#f2f4f6] rounded-xl mb-8 sticky top-20 z-40">
          <button onClick={() => setActiveTab('packages')} className={`flex-1 py-2.5 text-sm transition-all rounded-lg ${activeTab === 'packages' ? 'font-semibold bg-[#ffffff] text-[#003d9b] shadow-sm' : 'font-medium text-[#434654] hover:text-[#191c1e]'}`}>次卡商城</button>
          <button onClick={() => setActiveTab('timecard')} className={`flex-1 py-2.5 text-sm transition-all rounded-lg ${activeTab === 'timecard' ? 'font-semibold bg-[#ffffff] text-[#003d9b] shadow-sm' : 'font-medium text-[#434654] hover:text-[#191c1e]'}`}>时间卡</button>
          <button onClick={() => setActiveTab('recharge')} className={`flex-1 py-2.5 text-sm transition-all rounded-lg ${activeTab === 'recharge' ? 'font-semibold bg-[#ffffff] text-[#003d9b] shadow-sm' : 'font-medium text-[#434654] hover:text-[#191c1e]'}`}>余额储值</button>
        </div>

        {loading ? <div className="text-center text-[#737685] py-12">正在加载卡包与储值方案...</div> : null}
        {error ? <div className="bg-[#fff4f4] text-[#ba1a1a] rounded-2xl px-4 py-3 text-sm mb-4">{error}</div> : null}
        {message ? <div className="bg-[#ecfff4] text-[#00677d] rounded-2xl px-4 py-3 text-sm mb-4">{message}</div> : null}

        {activeTab === 'packages' ? (
          <section className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-end mb-4">
              <h2 className="font-headline text-2xl font-extrabold tracking-tight text-[#003d9b]">热销次卡</h2>
              <span className="text-xs font-bold text-[#00677d] uppercase tracking-widest">Selected Offers</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {featuredWashCards.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedPackageId(item.id)}
                  className={`${index === 0 ? 'col-span-2 p-6' : 'p-4'} relative overflow-hidden rounded-xl text-left transition-all ${selectedPackageId === item.id ? 'bg-[#0052cc] text-white shadow-[0_12px_32px_-8px_rgba(0,61,155,0.3)] ring-4 ring-[#003d9b]/20' : 'bg-white text-[#191c1e] shadow-sm border border-[#c3c6d6]/20'}`}
                >
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        {item.highlight ? <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 inline-block ${selectedPackageId === item.id ? 'bg-[#81f4ff] text-[#002022]' : 'bg-[#003d9b]/10 text-[#003d9b]'}`}>{item.highlight}</span> : null}
                        <h3 className={`${index === 0 ? 'text-2xl' : 'text-xl'} font-bold`}>{item.title}</h3>
                        <p className={`text-xs mt-1 ${selectedPackageId === item.id ? 'text-white/80' : 'text-[#434654]'}`}>{item.subtitle}</p>
                      </div>
                      <span className={`material-symbols-outlined text-3xl ${selectedPackageId === item.id ? 'opacity-50' : 'text-[#003d9b]'}`}>local_activity</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className={`${index === 0 ? 'text-4xl' : 'text-2xl'} font-black`}>{formatCurrency(item.price)}</span>
                      <span className={`text-sm ${selectedPackageId === item.id ? 'opacity-80' : 'text-[#737685]'}`}>/ {item.credits || 0}次</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {activeTab === 'timecard' ? (
          <section className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="font-headline text-2xl font-extrabold tracking-tight text-[#003d9b] mb-4">尊享时间卡</h2>
            {timeCards.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedPackageId(item.id)}
                className={`relative group cursor-pointer overflow-hidden rounded-2xl bg-[#191c1e] aspect-[1.586/1] shadow-2xl transition-transform hover:scale-[1.02] w-full ${selectedPackageId === item.id ? 'ring-4 ring-[#003d9b]/30' : 'ring-2 ring-transparent'}`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#2d3133] to-[#191c1e]"></div>
                <div className="relative h-full p-8 flex flex-col justify-between text-left">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#b3ebff] to-[#003d9b] flex items-center justify-center shadow-lg">
                        <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>diamond</span>
                      </div>
                      <div>
                        <h3 className="text-white font-bold tracking-wide">{item.title}</h3>
                        <p className="text-[10px] text-[#b3ebff] opacity-70 tracking-[0.2em] uppercase">{item.subtitle}</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[#e0e3e5] opacity-20 text-6xl">contactless</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[#e0e3e5]/60 text-xs font-medium tracking-widest uppercase">Valid Period</p>
                    <p className="text-white text-2xl font-black tracking-tight">{item.durationDays} DAYS ACCESS</p>
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="text-white">
                      <span className="text-3xl font-bold">{formatCurrency(item.price)}</span>
                      <span className="text-xs opacity-50 ml-1">/ PACKAGE</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </section>
        ) : null}

        {activeTab === 'recharge' ? (
          <section className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="font-headline text-2xl font-extrabold tracking-tight text-[#003d9b] mb-4">储值中心</h2>
            <div className="grid grid-cols-2 gap-4">
              {rechargeOffers.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedRecharge(item.amount)}
                  className={`flex flex-col items-center justify-center p-6 transition-all rounded-2xl group relative overflow-hidden shadow-sm ${selectedRecharge === item.amount ? 'bg-[#0052cc] text-white ring-4 ring-[#003d9b]/20' : 'bg-[#ffffff] border-2 border-transparent hover:border-[#00677d] text-[#191c1e]'}`}
                >
                  {item.highlighted && selectedRecharge !== item.amount ? <div className="absolute top-0 left-0 bg-[#003d9b] text-white text-[9px] px-3 py-1 font-bold rounded-br-lg">BEST VALUE</div> : null}
                  <span className={`text-sm font-medium mb-1 ${selectedRecharge === item.amount ? 'text-white/80' : 'text-[#434654]'}`}>{item.label}</span>
                  <span className="text-2xl font-black">{formatCurrency(item.amount)}</span>
                </button>
              ))}
              <button onClick={handleCustomRecharge} className="flex flex-col items-center justify-center p-6 bg-[#ffffff] border-2 border-transparent hover:border-[#00677d] transition-all rounded-2xl group relative overflow-hidden shadow-sm">
                <span className="text-sm font-medium text-[#434654] mb-1">自定义金额</span>
                <span className="material-symbols-outlined text-[#434654] mt-1">edit_square</span>
              </button>
            </div>
          </section>
        ) : null}
      </main>
      <div className="fixed bottom-0 left-0 w-full z-50">
        <div className="bg-white/80 backdrop-blur-md mx-4 mb-4 p-4 rounded-[24px] shadow-[0_12px_40px_-12px_rgba(0,61,155,0.2)] border border-white/30 flex items-center justify-between">
          <div className="pl-2">
            <p className="text-[10px] text-[#434654] font-bold uppercase tracking-wider">Estimated Total</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-[#003d9b]">{formatCurrency(total)}</span>
            </div>
          </div>
          <button
            onClick={handleConfirm}
            disabled={loading || submitting}
            className="bg-[#003d9b] text-white px-10 py-4 rounded-xl font-bold tracking-tight shadow-[0_8px_20px_-4px_rgba(0,61,155,0.3)] active:scale-95 transition-transform disabled:opacity-60"
          >
            {submitting ? '处理中...' : '确认支付'}
          </button>
        </div>
        <BottomNav />
      </div>
    </div>
  );
}
