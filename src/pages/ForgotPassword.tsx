import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [method, setMethod] = useState<'phone' | 'email'>('phone');
  const [step, setStep] = useState(1);
  const [target, setTarget] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendCode = async () => {
    if (!target) {
      setError(method === 'phone' ? '请输入手机号' : '请输入邮箱');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await api.sendCode({
        target,
        scene: 'reset_password',
        method,
      });
      setSuccess(`验证码已生成，演示码：${result.debugCode}`);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : '发送验证码失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!target || !verificationCode || !newPassword) {
      setError('请完整填写重置信息');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.resetPassword({
        target,
        method,
        verificationCode,
        newPassword,
      });
      setStep(2);
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : '重置密码失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#f7f9fb] text-[#191c1e] min-h-screen flex flex-col items-center p-6 font-sans">
      <div className="w-full max-w-md pt-12">
        <button onClick={() => navigate(-1)} className="material-symbols-outlined text-[#003d9b] mb-8 hover:opacity-80 transition-opacity">
          arrow_back_ios
        </button>
        <h1 className="text-3xl font-extrabold text-[#003d9b] mb-2 font-headline tracking-tight">找回密码</h1>
        <p className="text-[#737685] mb-8 font-medium">请选择找回方式并验证您的身份以重置密码</p>

        {step === 1 ? (
          <div className="bg-white p-6 rounded-[2rem] shadow-[0_12px_32px_-8px_rgba(0,61,155,0.08)]">
            <div className="flex bg-[#f2f4f6] p-1 rounded-xl mb-6">
              <button
                onClick={() => setMethod('phone')}
                className={`flex-1 py-2.5 text-sm rounded-lg transition-all ${method === 'phone' ? 'bg-white font-bold text-[#003d9b] shadow-sm' : 'text-[#737685] font-medium hover:text-[#191c1e]'}`}
              >
                手机号找回
              </button>
              <button
                onClick={() => setMethod('email')}
                className={`flex-1 py-2.5 text-sm rounded-lg transition-all ${method === 'email' ? 'bg-white font-bold text-[#003d9b] shadow-sm' : 'text-[#737685] font-medium hover:text-[#191c1e]'}`}
              >
                邮箱找回
              </button>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#434654] ml-1">{method === 'phone' ? '手机号' : '邮箱地址'}</label>
                <input
                  type={method === 'phone' ? 'tel' : 'email'}
                  value={target}
                  onChange={(event) => setTarget(event.target.value)}
                  placeholder={method === 'phone' ? '请输入绑定的手机号' : '请输入绑定的邮箱'}
                  className="w-full h-14 px-4 bg-[#ffffff] border border-[#c3c6d6]/40 rounded-xl outline-none focus:border-[#00677d] focus:ring-1 focus:ring-[#00677d] transition-all placeholder:text-[#737685]/60"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#434654] ml-1">验证码</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(event) => setVerificationCode(event.target.value)}
                    placeholder="请输入验证码"
                    className="w-full h-14 px-4 bg-[#ffffff] border border-[#c3c6d6]/40 rounded-xl outline-none focus:border-[#00677d] focus:ring-1 focus:ring-[#00677d] transition-all placeholder:text-[#737685]/60"
                  />
                  <button
                    onClick={handleSendCode}
                    disabled={loading}
                    type="button"
                    className="whitespace-nowrap px-6 bg-[#003d9b]/10 text-[#003d9b] font-bold rounded-xl hover:bg-[#003d9b]/20 transition-colors active:scale-95 disabled:opacity-60"
                  >
                    获取验证码
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#434654] ml-1">新密码</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="请输入新密码 (至少6位)"
                  className="w-full h-14 px-4 bg-[#ffffff] border border-[#c3c6d6]/40 rounded-xl outline-none focus:border-[#00677d] focus:ring-1 focus:ring-[#00677d] transition-all placeholder:text-[#737685]/60"
                />
              </div>

              {error ? <p className="text-sm text-[#ba1a1a]">{error}</p> : null}
              {success ? <p className="text-sm text-[#00677d]">{success}</p> : null}

              <button
                onClick={handleReset}
                disabled={loading}
                type="button"
                className="w-full h-14 bg-[#003d9b] text-white font-bold rounded-xl mt-6 shadow-[0_8px_20px_-4px_rgba(0,61,155,0.3)] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {loading ? '处理中...' : '重置密码'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white p-10 rounded-[2rem] shadow-[0_12px_32px_-8px_rgba(0,61,155,0.08)] text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-[#50d9fe]/20 rounded-full flex items-center justify-center mx-auto mb-6 relative">
              <div className="absolute inset-2 bg-[#00677d] rounded-full flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined text-white text-4xl">check</span>
              </div>
            </div>
            <h2 className="text-2xl font-extrabold text-[#191c1e] mb-2 tracking-tight">密码重置成功</h2>
            <p className="text-[#737685] mb-8 font-medium">您的密码已成功更新，请使用新密码重新登录。</p>
            <button
              onClick={() => navigate('/login')}
              className="w-full h-14 bg-[#003d9b] text-white font-bold rounded-xl shadow-[0_8px_20px_-4px_rgba(0,61,155,0.3)] hover:opacity-90 active:scale-[0.98] transition-all"
            >
              去登录
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
