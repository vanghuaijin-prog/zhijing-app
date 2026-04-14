import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [account, setAccount] = useState('zhangzhijie');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [showAgreement, setShowAgreement] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showWeChat, setShowWeChat] = useState(false);
  const [weChatStatus, setWeChatStatus] = useState<'loading' | 'success'>('loading');

  const redirectTo = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/';

  const handleLogin = async (event: React.MouseEvent | React.FormEvent) => {
    event.preventDefault();
    if (!agreed) {
      setError('请先阅读并同意用户协议与隐私政策');
      return;
    }
    if (!account || !password) {
      setError('请输入账号和密码');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await login({ account, password });
      navigate(redirectTo, { replace: true });
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : '登录失败，请稍后再试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWeChatLogin = () => {
    if (!agreed) {
      setError('请先阅读并同意用户协议与隐私政策');
      return;
    }

    setError('');
    setShowWeChat(true);
    setWeChatStatus('loading');
    window.setTimeout(() => {
      setWeChatStatus('success');
      window.setTimeout(() => {
        setShowWeChat(false);
      }, 1200);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute -top-[10%] -right-[5%] w-[40%] h-[50%] bg-[#003d9b]/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute top-[40%] -left-[10%] w-[35%] h-[45%] bg-[#00677d]/5 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-[440px] flex flex-col gap-8 z-10">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 relative">
            <div className="w-20 h-20 bg-[#0052cc] rounded-3xl flex items-center justify-center shadow-[0_12px_32px_-8px_rgba(0,61,155,0.15)] overflow-hidden relative">
              <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-white to-transparent"></div>
              <span className="material-symbols-outlined text-white text-4xl relative z-10" style={{ fontVariationSettings: "'FILL' 1" }}>
                water_drop
              </span>
            </div>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#003d9b] mb-2 font-headline">智净24H</h1>
          <p className="text-[#434654] font-medium text-lg">欢迎登录</p>
        </div>

        <div className="bg-[#ffffff] p-8 rounded-[2rem] shadow-[0_12px_32px_-8px_rgba(0,61,155,0.08)]">
          <form className="flex flex-col gap-5" onSubmit={handleLogin}>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#434654] ml-1">账号/手机号</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#737685] group-focus-within:text-[#00677d] transition-colors">
                  person
                </span>
                <input
                  type="text"
                  value={account}
                  onChange={(event) => setAccount(event.target.value)}
                  placeholder="请输入您的账号或手机号"
                  className="w-full h-14 pl-12 pr-4 bg-[#ffffff] border border-[#c3c6d6]/40 rounded-xl outline-none focus:border-[#00677d] focus:ring-1 focus:ring-[#00677d] focus:shadow-[0_12px_32px_-8px_rgba(0,61,155,0.08)] transition-all placeholder:text-[#737685]/60 text-[#191c1e]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#434654] ml-1">密码</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#737685] group-focus-within:text-[#00677d] transition-colors">
                  lock
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="请输入您的密码"
                  className="w-full h-14 pl-12 pr-12 bg-[#ffffff] border border-[#c3c6d6]/40 rounded-xl outline-none focus:border-[#00677d] focus:ring-1 focus:ring-[#00677d] focus:shadow-[0_12px_32px_-8px_rgba(0,61,155,0.08)] transition-all placeholder:text-[#737685]/60 text-[#191c1e]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#737685] hover:text-[#191c1e] transition-colors focus:outline-none"
                >
                  <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between px-1 mt-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-[#c3c6d6] text-[#003d9b] focus:ring-[#0052cc] focus:ring-offset-0" />
                <span className="text-sm text-[#434654] group-hover:text-[#191c1e] transition-colors">记住我</span>
              </label>
              <Link to="/forgot-password" className="text-sm font-medium text-[#00677d] hover:text-[#003d9b] transition-colors">
                忘记密码？
              </Link>
            </div>

            <div className="mt-2 px-1">
              <label className="flex items-start gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(event) => {
                    setAgreed(event.target.checked);
                    if (event.target.checked) {
                      setError('');
                    }
                  }}
                  className="w-4 h-4 mt-0.5 rounded border-[#c3c6d6] text-[#003d9b] focus:ring-[#0052cc] focus:ring-offset-0"
                />
                <span className="text-xs text-[#737685] leading-relaxed">
                  我已阅读并同意
                  <button type="button" onClick={() => setShowAgreement(true)} className="text-[#003d9b] hover:underline mx-1">
                    《用户协议》
                  </button>
                  和
                  <button type="button" onClick={() => setShowPrivacy(true)} className="text-[#003d9b] hover:underline mx-1">
                    《隐私政策》
                  </button>
                </span>
              </label>
              {error ? <p className="text-[#ba1a1a] text-xs mt-2 ml-6">{error}</p> : null}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-14 mt-2 bg-[#003d9b] text-white rounded-xl font-bold text-lg shadow-[inset_0_2px_4px_rgba(255,255,255,0.2),0_8px_20px_-4px_rgba(0,61,155,0.3)] hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? '登录中...' : '登录'}
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[#c3c6d6]/20 text-center">
            <p className="text-[#434654] text-sm">
              还没有账号？
              <Link to="/register" className="text-[#003d9b] font-bold hover:underline underline-offset-4 ml-1">
                立即注册
              </Link>
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-6 mt-2">
          <div className="flex items-center gap-4 w-full">
            <div className="h-px bg-[#c3c6d6]/40 flex-1"></div>
            <span className="text-xs font-bold text-[#737685] uppercase tracking-widest">第三方登录</span>
            <div className="h-px bg-[#c3c6d6]/40 flex-1"></div>
          </div>
          <div className="flex gap-4">
            <button onClick={handleWeChatLogin} className="w-14 h-14 rounded-full bg-[#e0e3e5] flex items-center justify-center hover:bg-[#07c160]/20 transition-colors group">
              <svg className="w-7 h-7 text-[#191c1e] group-hover:text-[#07c160] transition-colors" viewBox="0 0 1024 1024" fill="currentColor">
                <path d="M682.666667 341.333333c-17.066667 0-34.133333 4.266667-51.2 8.533334-29.866667-106.666667-128-183.466667-247.466667-183.466667-140.8 0-256 102.4-256 230.4 0 72.533333 38.4 136.533333 98.133333 179.2-8.533334 29.866667-29.866667 85.333333-29.866667 85.333333s55.466667-25.6 106.666667-55.466666c25.6 8.533334 55.466667 12.8 85.333333 12.8 17.066667 0 34.133333-4.266667 51.2-8.533333-8.533334-21.333333-12.8-42.666667-12.8-64 0-110.933333 93.866667-204.8 209.066667-204.8z m-213.333334-64c17.066667 0 34.133333 12.8 34.133334 34.133334s-12.8 34.133333-34.133334 34.133333c-17.066667 0-34.133333-12.8-34.133333-34.133333s17.066667-34.133333 34.133333-34.133334z m-170.666666 68.266667c-17.066667 0-34.133333-12.8-34.133334-34.133334s12.8-34.133333 34.133334-34.133333c17.066667 0 34.133333 12.8 34.133333 34.133333s-17.066667 34.133333-34.133333 34.133334z m426.666666 128c110.933333 0 204.8 81.066667 204.8 183.466667 0 55.466667-29.866667 106.666667-76.8 140.8 8.533334 21.333333 21.333333 64 21.333334 64s-42.666667-21.333333-81.066667-42.666667c-21.333333 4.266667-42.666667 8.533333-68.266667 8.533333-110.933333 0-204.8-81.066667-204.8-183.466666 0-102.4 93.866667-170.666667 204.8-170.666667z m-68.266666 102.4c-12.8 0-25.6 8.533333-25.6 25.6s8.533333 25.6 25.6 25.6 25.6-8.533333 25.6-25.6-8.533333-25.6-25.6-25.6z m136.533333 0c-12.8 0-25.6 8.533333-25.6 25.6s8.533333 25.6 25.6 25.6 25.6-8.533333 25.6-25.6-8.533333-25.6-25.6-25.6z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#eceef0] text-[11px] font-bold text-[#737685] tracking-wider">
            <span className="material-symbols-outlined text-[14px]">verified_user</span>
            演示账号已预填，可直接登录
          </div>
        </div>
      </div>

      {showWeChat ? (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 flex flex-col items-center max-w-xs w-full animate-in zoom-in-95 duration-200">
            {weChatStatus === 'loading' ? (
              <>
                <div className="w-16 h-16 border-4 border-[#07c160]/30 border-t-[#07c160] rounded-full animate-spin mb-4"></div>
                <h3 className="font-bold text-[#191c1e] mb-2">正在拉起微信授权...</h3>
                <p className="text-xs text-[#737685] text-center">演示环境未接入微信开放平台，这里仅保留前端交互效果。</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-[#07c160]/20 rounded-full flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-[#07c160] text-3xl">check</span>
                </div>
                <h3 className="font-bold text-[#191c1e]">授权模拟完成</h3>
              </>
            )}
          </div>
        </div>
      ) : null}

      {showAgreement ? (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md h-[70vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-[#eceef0]">
              <h2 className="text-xl font-bold text-[#191c1e]">智净24H用户协议</h2>
              <button onClick={() => setShowAgreement(false)} className="material-symbols-outlined text-[#737685] hover:text-[#191c1e]">
                close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 text-sm text-[#434654] space-y-4 leading-relaxed">
              <p className="font-bold text-[#191c1e]">欢迎您使用智净24H服务！</p>
              <p>本平台提供 24 小时自助洗车设备的查询、预约、控制与支付等服务，您在注册和使用过程中应确保信息真实有效。</p>
              <p>您需对账号下发生的操作负责，如发现异常登录或未授权使用，请及时联系我们。</p>
              <p>使用设备时请遵守平台规则与相关法律法规，不得破坏设备、恶意占位或逃避支付。</p>
            </div>
            <div className="p-6 border-t border-[#eceef0]">
              <button
                onClick={() => {
                  setShowAgreement(false);
                  setAgreed(true);
                  setError('');
                }}
                className="w-full py-4 bg-[#003d9b] text-white font-bold rounded-xl active:scale-95 transition-transform"
              >
                我已阅读并同意
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showPrivacy ? (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md h-[70vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-[#eceef0]">
              <h2 className="text-xl font-bold text-[#191c1e]">智净24H隐私政策</h2>
              <button onClick={() => setShowPrivacy(false)} className="material-symbols-outlined text-[#737685] hover:text-[#191c1e]">
                close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 text-sm text-[#434654] space-y-4 leading-relaxed">
              <p>为了完成账号注册、预约、设备控制和订单支付，我们会使用您的手机号、设备信息与必要的账户资料。</p>
              <p>如您授权定位，我们会使用城市和区域信息推荐附近门店，但不会在未经许可的情况下向第三方公开您的个人数据。</p>
              <p>所有后端数据将通过受控服务端接口写入 Supabase 数据库，浏览器端不会暴露 service role key。</p>
            </div>
            <div className="p-6 border-t border-[#eceef0]">
              <button
                onClick={() => {
                  setShowPrivacy(false);
                  setAgreed(true);
                  setError('');
                }}
                className="w-full py-4 bg-[#003d9b] text-white font-bold rounded-xl active:scale-95 transition-transform"
              >
                我已阅读并同意
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
