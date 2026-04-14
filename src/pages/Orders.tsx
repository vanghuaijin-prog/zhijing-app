import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { formatCurrency, formatFullDateTime } from '../lib/formatters';
import type { Order, OrderStatus } from '../types/app';

type Tab = 'all' | Extract<OrderStatus, 'in_progress' | 'completed'>;

export default function Orders() {
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const loadOrders = async () => {
      setLoading(true);
      setError('');
      try {
        const result = await api.getOrders(activeTab);
        if (!cancelled) {
          setOrders(result);
        }
      } catch (ordersError) {
        if (!cancelled) {
          setError(ordersError instanceof Error ? ordersError.message : '获取订单失败');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadOrders();
    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  return (
    <div className="bg-[#f7f9fb] text-[#191c1e] min-h-screen pb-20">
      <header className="fixed top-0 w-full z-50 bg-[#f7f9fb]/80 backdrop-blur-xl flex items-center justify-between px-6 py-4 shadow-[0_4px_20px_-4px_rgba(0,61,155,0.05)]">
        <div className="flex items-center gap-2">
          <Link to="/profile" className="material-symbols-outlined text-[#003d9b]">
            arrow_back_ios
          </Link>
          <span className="font-headline font-bold tracking-tight text-lg text-[#003d9b]">我的订单</span>
        </div>
        <div className="text-[#434654]">
          <span className="material-symbols-outlined">filter_list</span>
        </div>
      </header>
      <main className="pt-24 px-4 max-w-2xl mx-auto">
        <div className="flex p-1 bg-[#f2f4f6] rounded-xl mb-6 sticky top-20 z-40">
          {[
            { key: 'all', label: '全部' },
            { key: 'in_progress', label: '进行中' },
            { key: 'completed', label: '已完成' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as Tab)}
              className={`flex-1 py-2.5 text-sm rounded-lg transition-colors ${activeTab === tab.key ? 'font-bold bg-[#ffffff] text-[#003d9b] shadow-sm' : 'font-medium text-[#434654] hover:text-[#191c1e]'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? <div className="text-center text-[#737685] py-12">订单加载中...</div> : null}
        {error ? <div className="bg-[#fff4f4] text-[#ba1a1a] rounded-2xl px-4 py-3 text-sm mb-4">{error}</div> : null}

        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className={`bg-[#ffffff] rounded-2xl p-5 shadow-sm border border-[#c3c6d6]/15 ${order.status === 'completed' ? 'opacity-85' : 'relative overflow-hidden group'}`}>
              {order.status !== 'completed' ? <div className="absolute top-0 right-0 w-16 h-16 bg-[#00677d]/5 rounded-bl-full"></div> : null}
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined ${order.status === 'completed' ? 'text-[#434654]' : 'text-[#00677d]'}`}>local_car_wash</span>
                  <span className="font-bold text-[#191c1e]">{order.stationName} - {order.deviceCode}设备</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-md uppercase tracking-wider ${order.status === 'in_progress' ? 'font-bold text-[#00677d] bg-[#81f4ff]/20' : 'font-medium text-[#737685] bg-[#f2f4f6]'}`}>
                  {order.status === 'in_progress' ? '进行中' : '已完成'}
                </span>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs text-[#434654] mb-1">{formatFullDateTime(order.startedAt)}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs font-bold text-[#191c1e]">{order.status === 'in_progress' ? '已消费:' : '总计:'}</span>
                    <span className={`font-black ${order.status === 'in_progress' ? 'text-xl text-[#003d9b]' : 'text-lg text-[#191c1e]'}`}>{formatCurrency(order.amount)}</span>
                  </div>
                </div>
                <Link
                  to={order.status === 'in_progress' ? '/control' : '/booking'}
                  state={order.status === 'completed' ? { stationId: order.stationId } : undefined}
                  className={order.status === 'in_progress' ? 'bg-[#003d9b] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-[0_4px_12px_rgba(0,61,155,0.2)] active:scale-95 transition-transform block text-center' : 'border border-[#c3c6d6] text-[#434654] px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#f2f4f6] transition-colors active:scale-95 block text-center'}
                >
                  {order.status === 'in_progress' ? '查看详情' : '再来一单'}
                </Link>
              </div>
            </div>
          ))}

          {!loading && orders.length === 0 ? <div className="text-center text-[#737685] py-16">当前筛选条件下暂无订单</div> : null}
        </div>
      </main>
    </div>
  );
}
