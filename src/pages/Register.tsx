import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendCode = async () => {
    if (!phone) {
      setError('请先输入手机号');
      return;
    }

    setSendingCode(true);
    setError('');
    try {
      const result = await api.sendCode({
        target: phone,
        scene: 'register',
        method: 'phone',
      });
      setSuccess(`验证码已生成，演示码：${result.debugCode}`);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : '发送验证码失败');
    } finally {
      setSendingCode(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!agreed) {
      setError('请先同意用户协议与隐私政策');
      return;
    }
    if (!username || !phone || !verificationCode || !password || !confirmPassword) {
      setError('请完整填写注册信息');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await register({
        username,
        phone,
        password,
        confirmPassword,
        displayName: username,
        agreementAccepted: agreed,
        verificationCode,
      });
      navigate('/', { replace: true });
    } catch (registerError) {
      setError(registerError instanceof Error ? registerError.message : '注册失败，请稍后再试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#f7f9fb] text-[#191c1e] min-h-screen flex flex-col">
      <header className="fixed top-0 w-full z-50 flex items-center justify-between px-4 h-16 bg-[#f7f9fb]/80 backdrop-blur-md">
        <Link to="/login" className="flex items-center justify-center p-2 active:scale-95 transition-transform text-[#003d9b]">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="font-headline font-bold tracking-tight text-lg text-[#003d9b]">用户注册</h1>
        <div className="w-10"></div>
      </header>
      <main className="flex-grow pt-24 pb-12 px-6 flex flex-col items-center">
        <div className="w-full max-w-md mb-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#0052cc]/10 mb-4">
            <span className="material-symbols-outlined text-4xl text-[#003d9b]" style={{ fontVariationSettings: "'FILL' 1" }}>
              water_drop
            </span>
          </div>
          <h2 className="text-3xl font-headline font-extrabold tracking-tight text-[#003d9b] mb-2">加入 智净24H</h2>
          <p className="text-[#434654] font-body">开启您的智慧洗护新生活</p>
        </div>
        <div className="w-full max-w-md bg-[#ffffff] rounded-[2rem] p-8 shadow-[0_12px_32px_-8px_rgba(0,61,155,0.08)]">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#434654] px-1 uppercase tracking-wider">账号设置</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#737685] text-xl group-focus-within:text-[#003d9b] transition-colors">
                  account_circle
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="请设置用户名"
                  className="w-full pl-12 pr-4 py-4 bg-[#f2f4f6] border-none rounded-xl focus:ring-2 focus:ring-[#00677d] transition-all outline-none text-[#191c1e] placeholder:text-[#737685]/60"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#434654] px-1 uppercase tracking-wider">手机号码</label>
              <div className="flex gap-2">
                <div className="relative flex-grow group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#737685] text-xl group-focus-within:text-[#003d9b] transition-colors">
                    smartphone
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="请输入手机号"
                    className="w-full pl-12 pr-4 py-4 bg-[#f2f4f6] border-none rounded-xl focus:ring-2 focus:ring-[#00677d] transition-all outline-none text-[#191c1e] placeholder:text-[#737685]/60"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={sendingCode}
                  className="px-4 py-4 bg-[#50d9fe] text-[#005c70] text-sm font-bold rounded-xl active:scale-95 transition-all whitespace-nowrap disabled:opacity-60"
                >
                  {sendingCode ? '发送中' : '获取验证码'}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#434654] px-1 uppercase tracking-wider">验证码</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#737685] text-xl group-focus-within:text-[#003d9b] transition-colors">
                  verified_user
                </span>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(event) => setVerificationCode(event.target.value)}
                  placeholder="请输入6位验证码"
                  className="w-full pl-12 pr-4 py-4 bg-[#f2f4f6] border-none rounded-xl focus:ring-2 focus:ring-[#00677d] transition-all outline-none text-[#191c1e] placeholder:text-[#737685]/60"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#434654] px-1 uppercase tracking-wider">设置密码</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#737685] text-xl group-focus-within:text-[#003d9b] transition-colors">
                  lock
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="请输入登录密码"
                  className="w-full pl-12 pr-4 py-4 bg-[#f2f4f6] border-none rounded-xl focus:ring-2 focus:ring-[#00677d] transition-all outline-none text-[#191c1e] placeholder:text-[#737685]/60"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#434654] px-1 uppercase tracking-wider">确认密码</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#737685] text-xl group-focus-within:text-[#003d9b] transition-colors">
                  lock_reset
                </span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="请再次确认密码"
                  className="w-full pl-12 pr-4 py-4 bg-[#f2f4f6] border-none rounded-xl focus:ring-2 focus:ring-[#00677d] transition-all outline-none text-[#191c1e] placeholder:text-[#737685]/60"
                />
              </div>
            </div>
            <div className="flex items-start gap-3 py-2">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreed}
                  onChange={(event) => setAgreed(event.target.checked)}
                  className="w-5 h-5 rounded-md border-[#c3c6d6] text-[#003d9b] focus:ring-[#0052cc] transition-all cursor-pointer"
                />
              </div>
              <label htmlFor="terms" className="text-sm text-[#434654] leading-tight cursor-pointer">
                我已阅读并同意 <span className="text-[#003d9b] font-bold">《用户服务协议》</span> 与 <span className="text-[#003d9b] font-bold">《隐私权政策》</span>
              </label>
            </div>
            {error ? <p className="text-sm text-[#ba1a1a]">{error}</p> : null}
            {success ? <p className="text-sm text-[#00677d]">{success}</p> : null}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-[#003d9b] text-white font-headline font-bold text-lg rounded-xl shadow-lg shadow-[#003d9b]/20 active:scale-95 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-60"
            >
              {submitting ? '注册中...' : '立即注册'}
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
            <div className="text-center pt-4">
              <p className="text-[#434654] text-sm">
                已有账号？
                <Link to="/login" className="text-[#003d9b] font-bold hover:underline inline-flex items-center gap-0.5 ml-1">
                  去登录
                  <span className="material-symbols-outlined text-sm">login</span>
                </Link>
              </p>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
