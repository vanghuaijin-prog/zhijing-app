import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { formatCurrency, formatDateTime } from '../lib/formatters';
import type { RechargeOffer, RechargeRecord } from '../types/app';

export default function Recharge() {
  const { refreshSession } = useAuth();
  const [offers, setOffers] = useState<RechargeOffer[]>([]);
  const [history, setHistory] = useState<RechargeRecord[]>([]);
  const [balance, setBalance] = useState(0);
  const [selectedAmount, setSelectedAmount] = useState<number>(500);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [profile, rechargeOffers, rechargeHistory] = await Promise.all([
          api.getProfile(),
          api.getRechargeOffers(),
          api.getRechargeHistory(),
        ]);
        if (!cancelled) {
          setBalance(profile.user.walletBalance);
          setOffers(rechargeOffers);
          setHistory(rechargeHistory);
          setSelectedAmount(rechargeOffers.find((item) => item.highlighted)?.amount || rechargeOffers[0]?.amount || 500);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : '加载充值信息失败');
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleRecharge = async () => {
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      const result = await api.createRecharge(selectedAmount);
      await refreshSession();
      setBalance(result.balance);
      const nextHistory = await api.getRechargeHistory();
      setHistory(nextHistory);
      setMessage(`充值成功，当前余额 ${formatCurrency(result.balance)}`);
    } catch (rechargeError) {
      setError(rechargeError instanceof Error ? rechargeError.message : '充值失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#f7f9fb] text-[#191c1e] min-h-screen pb-32">
      <header className="fixed top-0 w-full z-50 bg-[#f7f9fb]/80 backdrop-blur-xl flex items-center justify-between px-6 py-4 shadow-[0_4px_20px_-4px_rgba(0,61,155,0.05)]">
        <div className="flex items-center gap-2">
          <Link to="/packages" className="material-symbols-outlined text-[#003d9b]">
            arrow_back_ios
          </Link>
          <span className="font-headline font-bold tracking-tight text-lg text-[#003d9b]">余额充值</span>
        </div>
        <div className="text-[#434654] text-sm font-medium">充值记录</div>
      </header>
      <main className="pt-24 px-4 max-w-2xl mx-auto space-y-8">
        <div className="bg-[#ffffff] rounded-2xl p-6 shadow-sm border border-[#c3c6d6]/15 flex flex-col items-center justify-center">
          <span className="text-sm font-medium text-[#434654] mb-2">当前余额 (元)</span>
          <span className="text-4xl font-black text-[#003d9b] font-headline tracking-tighter">{balance.toFixed(2)}</span>
        </div>
        <section className="space-y-4">
          <h3 className="font-headline font-bold text-[#191c1e] flex items-center gap-2">
            <span className="w-1.5 h-5 bg-[#00677d] rounded-full"></span>
            选择充值金额
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {offers.map((offer) => (
              <button
                key={offer.id}
                onClick={() => setSelectedAmount(offer.amount)}
                className={`flex flex-col items-center justify-center p-6 transition-all rounded-2xl group relative overflow-hidden shadow-sm ${selectedAmount === offer.amount ? 'bg-[#0052cc] text-white ring-4 ring-[#003d9b]/20' : 'bg-[#ffffff] border-2 border-transparent hover:border-[#00677d] text-[#191c1e]'}`}
              >
                {offer.highlighted && selectedAmount !== offer.amount ? <div className="absolute top-0 left-0 bg-[#003d9b] text-white text-[9px] px-3 py-1 font-bold rounded-br-lg">BEST VALUE</div> : null}
                <span className={`text-sm font-medium mb-1 ${selectedAmount === offer.amount ? 'text-white/80' : 'text-[#434654]'}`}>{offer.label}</span>
                <span className="text-2xl font-black">{formatCurrency(offer.amount)}</span>
              </button>
            ))}
          </div>
        </section>

        {error ? <div className="bg-[#fff4f4] text-[#ba1a1a] rounded-2xl px-4 py-3 text-sm">{error}</div> : null}
        {message ? <div className="bg-[#ecfff4] text-[#00677d] rounded-2xl px-4 py-3 text-sm">{message}</div> : null}

        <section className="space-y-4">
          <h3 className="font-headline font-bold text-[#191c1e] flex items-center gap-2">
            <span className="w-1.5 h-5 bg-[#00677d] rounded-full"></span>
            最近充值记录
          </h3>
          <div className="space-y-3">
            {history.map((record) => (
              <div key={record.id} className="bg-white rounded-2xl p-4 border border-[#c3c6d6]/15 flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#191c1e]">{formatCurrency(record.amount)} + 赠送 {formatCurrency(record.bonus)}</p>
                  <p className="text-sm text-[#737685]">{formatDateTime(record.createdAt)}</p>
                </div>
                <span className="text-[#003d9b] font-bold">到账 {formatCurrency(record.finalAmount)}</span>
              </div>
            ))}
            {history.length === 0 ? <div className="text-sm text-[#737685]">暂无充值记录</div> : null}
          </div>
        </section>
      </main>
      <div className="fixed bottom-0 left-0 w-full p-6 bg-white/90 backdrop-blur-md border-t border-[#c3c6d6]/15 z-50">
        <button
          onClick={handleRecharge}
          disabled={submitting}
          className="w-full bg-[#003d9b] text-white font-headline font-bold py-4 rounded-xl shadow-[0_12px_32px_-8px_rgba(0,61,155,0.2)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {submitting ? '充值中...' : `立即充值 ${formatCurrency(selectedAmount)}`}
        </button>
      </div>
    </div>
  );
}
