import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Membership() {
  const { membership } = useAuth();
  const progress = membership ? Math.min(100, (membership.growthValue / membership.nextTierGrowthValue) * 100) : 0;

  return (
    <div className="bg-[#f7f9fb] text-[#191c1e] min-h-screen pb-20">
      <header className="fixed top-0 w-full z-50 bg-[#f7f9fb]/80 backdrop-blur-xl flex items-center justify-between px-6 py-4 shadow-[0_4px_20px_-4px_rgba(0,61,155,0.05)]">
        <div className="flex items-center gap-2">
          <Link to="/profile" className="material-symbols-outlined text-[#003d9b]">
            arrow_back_ios
          </Link>
          <span className="font-headline font-bold tracking-tight text-lg text-[#003d9b]">会员中心</span>
        </div>
      </header>
      <main className="pt-24 px-4 max-w-2xl mx-auto space-y-8">
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#003d9b] to-[#0052cc] p-6 shadow-[0_20px_40px_-12px_rgba(0,61,155,0.3)]">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-20 -mt-20 blur-2xl"></div>
          <div className="relative z-10 text-white">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-2xl font-black tracking-tight mb-1">{membership?.label || '普通用户'}</h2>
                <p className="text-xs opacity-80">尊享 {membership?.benefits.length || 0} 项特权</p>
              </div>
              <span className="material-symbols-outlined text-4xl opacity-50" style={{ fontVariationSettings: "'FILL' 1" }}>
                stars
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span>成长值 {membership?.growthValue || 0}/{membership?.nextTierGrowthValue || 0}</span>
                <span>距离下一等级还需 {(membership?.nextTierGrowthValue || 0) - (membership?.growthValue || 0)}</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-[#81f4ff] rounded-full" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          </div>
        </div>
        <section>
          <h3 className="font-headline font-bold text-lg mb-4 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-[#00677d] rounded-full"></span>
            我的特权
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {(membership?.benefits || []).map((benefit) => (
              <div key={benefit.id} className="flex flex-col items-center text-center space-y-2 bg-white rounded-2xl p-4 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-[#003d9b]/10 flex items-center justify-center text-[#003d9b]">
                  <span className="material-symbols-outlined">{benefit.icon}</span>
                </div>
                <span className="text-xs font-bold">{benefit.title}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
