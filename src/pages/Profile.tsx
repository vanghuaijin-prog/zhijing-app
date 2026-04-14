import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { formatCurrency } from '../lib/formatters';

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('读取图片失败'));
    reader.readAsDataURL(file);
  });

export default function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, membership, logout, refreshSession } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setEditName(user?.displayName || '');
    setEditAvatar(user?.avatar || '');
  }, [user?.avatar, user?.displayName]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await api.updateProfile({
        displayName: editName,
        avatar: editAvatar,
      });
      await refreshSession();
      setIsEditing(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.[0]) {
      return;
    }

    try {
      const result = await fileToDataUrl(event.target.files[0]);
      setEditAvatar(result);
    } catch (avatarError) {
      setError(avatarError instanceof Error ? avatarError.message : '处理头像失败');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="bg-[#f7f9fb] font-body text-[#191c1e] antialiased min-h-screen pb-28">
      <nav className="fixed top-0 w-full z-50 bg-[#f7f9fb]/80 backdrop-blur-xl flex items-center justify-between px-6 h-16 shadow-[0_4px_20px_-4px_rgba(0,61,155,0.05)]">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#003d9b]">location_on</span>
          <span className="text-lg font-black text-[#003d9b] font-headline tracking-tight">智净24H</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/notifications" className="active:scale-95 transition-transform text-[#434654]">
            <span className="material-symbols-outlined">notifications</span>
          </Link>
        </div>
      </nav>
      <main className="pt-20 px-4 max-w-md mx-auto space-y-6">
        <section className="flex items-center space-x-4 py-4">
          <button onClick={() => setIsEditing(true)} className="relative group">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#e0e3e5] shadow-sm group-hover:border-[#003d9b] transition-colors">
              <img src={user?.avatar} alt="User Avatar" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-[#003d9b] text-white p-1 rounded-full border-2 border-[#f7f9fb]">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                edit
              </span>
            </div>
          </button>
          <div className="space-y-1 flex-1">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-headline font-bold tracking-tight text-[#191c1e]">{user?.displayName}</h1>
              <button onClick={() => setIsEditing(true)} className="text-[#003d9b] text-sm font-bold">
                编辑
              </button>
            </div>
            <div className="inline-flex items-center px-3 py-0.5 rounded-xl bg-gradient-to-r from-[#81f4ff] to-[#b3ebff] shadow-sm">
              <span className="material-symbols-outlined text-xs mr-1 text-[#002022]" style={{ fontVariationSettings: "'FILL' 1" }}>
                stars
              </span>
              <span className="text-[10px] font-label font-bold uppercase tracking-wider text-[#002022]">{membership?.label || '普通用户'}</span>
            </div>
          </div>
        </section>
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-[#ffffff] p-5 rounded-xl shadow-[0_12px_32px_-8px_rgba(0,61,155,0.06)] flex flex-col justify-between h-32 relative overflow-hidden group active:scale-[0.98] transition-transform">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <span className="material-symbols-outlined text-6xl text-[#003d9b]">account_balance_wallet</span>
            </div>
            <span className="text-[#434654] text-sm font-medium">账户余额</span>
            <div>
              <span className="text-2xl font-headline font-black text-[#003d9b]">{formatCurrency(user?.walletBalance || 0)}</span>
            </div>
          </div>
          <div className="bg-[#ffffff] p-5 rounded-xl shadow-[0_12px_32px_-8px_rgba(0,61,155,0.06)] flex flex-col justify-between h-32 relative overflow-hidden group active:scale-[0.98] transition-transform border-t-2 border-[#50d9fe]/20">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <span className="material-symbols-outlined text-6xl text-[#00677d]">confirmation_number</span>
            </div>
            <span className="text-[#434654] text-sm font-medium">洗车次卡</span>
            <div className="flex items-baseline">
              <span className="text-2xl font-headline font-black text-[#00677d]">{user?.washCredits || 0}</span>
              <span className="text-[#434654] text-xs font-bold ml-1">次剩余</span>
            </div>
          </div>
        </section>
        <section className="bg-[#f2f4f6] rounded-xl p-2 space-y-1">
          <Link to="/orders" className="w-full flex items-center justify-between p-4 bg-[#ffffff] rounded-xl group hover:bg-[#f7f9fb] transition-colors active:scale-[0.99]">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-[#003d9b]/5 flex items-center justify-center text-[#003d9b]">
                <span className="material-symbols-outlined">receipt_long</span>
              </div>
              <span className="font-medium text-[#191c1e]">我的订单</span>
            </div>
            <span className="material-symbols-outlined text-[#c3c6d6] group-hover:text-[#003d9b] transition-colors">chevron_right</span>
          </Link>
          <Link to="/packages" className="w-full flex items-center justify-between p-4 bg-[#ffffff] rounded-xl group hover:bg-[#f7f9fb] transition-colors active:scale-[0.99]">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-[#00677d]/5 flex items-center justify-center text-[#00677d]">
                <span className="material-symbols-outlined">card_membership</span>
              </div>
              <span className="font-medium text-[#191c1e]">卡包中心</span>
            </div>
            <span className="material-symbols-outlined text-[#c3c6d6] group-hover:text-[#00677d] transition-colors">chevron_right</span>
          </Link>
          <Link to="/membership" className="w-full flex items-center justify-between p-4 bg-[#ffffff] rounded-xl group hover:bg-[#f7f9fb] transition-colors active:scale-[0.99]">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-[#004b51]/5 flex items-center justify-center text-[#004b51]">
                <span className="material-symbols-outlined">workspace_premium</span>
              </div>
              <span className="font-medium text-[#191c1e]">会员权益</span>
            </div>
            <span className="material-symbols-outlined text-[#c3c6d6] group-hover:text-[#004b51] transition-colors">chevron_right</span>
          </Link>
          <Link to="/feedback" className="w-full flex items-center justify-between p-4 bg-[#ffffff] rounded-xl group hover:bg-[#f7f9fb] transition-colors active:scale-[0.99]">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-[#e0e3e5]/50 flex items-center justify-center text-[#434654]">
                <span className="material-symbols-outlined">rate_review</span>
              </div>
              <span className="font-medium text-[#191c1e]">意见反馈</span>
            </div>
            <span className="material-symbols-outlined text-[#c3c6d6] transition-colors">chevron_right</span>
          </Link>
        </section>
        <section className="pt-4">
          <button onClick={handleLogout} className="w-full py-4 rounded-xl border border-[#ba1a1a]/20 bg-[#ba1a1a]/5 text-[#ba1a1a] font-bold flex items-center justify-center space-x-2 active:scale-95 transition-transform">
            <span className="material-symbols-outlined">logout</span>
            <span>退出登录</span>
          </button>
          <p className="text-center text-[10px] text-[#c3c6d6] mt-6 uppercase tracking-widest font-label font-medium">App Version 2.4.0 • 智净科技出品</p>
        </section>
      </main>
      <BottomNav />

      {isEditing ? (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-[#191c1e] mb-6 text-center">编辑个人资料</h2>
            <div className="space-y-6">
              <div className="flex flex-col items-center">
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-[#f2f4f6] cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                  <img src={editAvatar || user?.avatar} alt="Edit Avatar" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-white">photo_camera</span>
                  </div>
                </div>
                <p className="text-xs text-[#737685] mt-2">点击更换头像</p>
                <input type="file" ref={fileInputRef} accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#434654] mb-2 ml-1">昵称</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  className="w-full bg-[#f7f9fb] border border-[#c3c6d6]/50 rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-[#003d9b] focus:ring-1 focus:ring-[#003d9b] transition-all"
                />
              </div>
              {error ? <p className="text-sm text-[#ba1a1a]">{error}</p> : null}
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setIsEditing(false)} className="flex-1 py-4 rounded-xl border border-[#c3c6d6] text-[#434654] font-bold active:scale-95 transition-transform">
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-4 rounded-xl bg-[#003d9b] text-white font-bold shadow-[0_8px_20px_-4px_rgba(0,61,155,0.3)] active:scale-95 transition-transform disabled:opacity-60"
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
