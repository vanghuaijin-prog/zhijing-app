import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import type { Station } from '../types/app';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [claimed, setClaimed] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showCitySelector, setShowCitySelector] = useState(false);
  const [selectedCity, setSelectedCity] = useState(user?.city || '深圳市');
  const [selectedDistrict, setSelectedDistrict] = useState(user?.district || '南山区');
  const [stations, setStations] = useState<Station[]>([]);
  const [scanLinePos, setScanLinePos] = useState(0);
  const [loadingStations, setLoadingStations] = useState(false);
  const [startingControl, setStartingControl] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setSelectedCity(user?.city || '深圳市');
    setSelectedDistrict(user?.district || '南山区');
  }, [user?.city, user?.district]);

  useEffect(() => {
    if (!showScanner) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setScanLinePos((previous) => (previous >= 100 ? 0 : previous + 2));
    }, 30);

    return () => window.clearInterval(interval);
  }, [showScanner]);

  useEffect(() => {
    let cancelled = false;
    const loadStations = async () => {
      setLoadingStations(true);
      setError('');
      try {
        const result = await api.getStations({ city: selectedCity, district: selectedDistrict });
        if (!cancelled) {
          setStations(result);
        }
      } catch (stationError) {
        if (!cancelled) {
          setError(stationError instanceof Error ? stationError.message : '获取门店失败');
        }
      } finally {
        if (!cancelled) {
          setLoadingStations(false);
        }
      }
    };

    void loadStations();
    return () => {
      cancelled = true;
    };
  }, [selectedCity, selectedDistrict]);

  const currentStation = useMemo(() => stations[0] || null, [stations]);

  const handleLocationClick = () => {
    if (!navigator.geolocation) {
      setShowCitySelector(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => setShowMap(true),
      () => setShowCitySelector(true),
    );
  };

  const handleStartControl = async () => {
    if (!currentStation) {
      setError('当前区域暂无可用门店');
      return;
    }

    setStartingControl(true);
    setError('');
    try {
      await api.startControlSession(currentStation.id);
      setShowScanner(false);
      navigate('/control');
    } catch (controlError) {
      setError(controlError instanceof Error ? controlError.message : '连接设备失败');
    } finally {
      setStartingControl(false);
    }
  };

  const cities = ['北京市', '上海市', '广州市', '深圳市', '杭州市', '成都市', '武汉市', '西安市'];
  const districts = ['南山区', '福田区', '罗湖区', '宝安区', '龙岗区', '盐田区'];

  return (
    <div className="bg-[#f7f9fb] font-body text-[#191c1e] antialiased overflow-hidden h-screen flex flex-col">
      <header className="fixed top-0 w-full z-50 bg-[#f7f9fb]/80 backdrop-blur-xl flex items-center justify-between px-6 h-16 shadow-[0_4px_20px_-4px_rgba(0,61,155,0.05)]">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#003d9b]">location_on</span>
          <span className="text-lg font-black text-[#003d9b] font-headline tracking-tight">智净24H {selectedDistrict}站</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/notifications" className="text-[#434654] active:scale-95 transition-transform hover:opacity-80">
            <span className="material-symbols-outlined">notifications</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 relative w-full overflow-hidden mt-16 pb-20">
        <div className="absolute inset-0 z-0">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCQfFA22hipejgBpXrladsZ3NTTuRFfQxr_K2PS8VnrBazdeJV7LRRHzNxyUskwQsKBIuvGYK2Suk17Oa5WPlz53JvpvaxkSgx_HDCPEAzDkO-NpoJmYBbw75cVUeD4v--qg_A2kWhTglqkmPZNmD9ZgW-0KvCzeOtrNLRYPWnca2ZDNVNkfuRytIQi3MkkVuBL3D7P_xSnScDEtlo8m-6yA9WQiS_XKbo7thW5osCi9D0_qniZoemGmJ0nuQgvopb_ANd1qjUYgl_V"
            alt="Map"
            className="w-full h-full object-cover grayscale-[20%]"
          />
          <div className="absolute top-1/3 left-1/4 group">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-6 h-6 rounded-full bg-[#003d9b]/20 animate-ping"></div>
              <div className="relative z-10 bg-[#003d9b] text-white p-2 rounded-full shadow-lg">
                <span className="material-symbols-outlined text-sm">local_car_wash</span>
              </div>
            </div>
          </div>
          <div className="absolute top-1/2 right-1/3">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-6 h-6 rounded-full bg-[#00677d]/20 animate-ping"></div>
              <div className="relative z-10 bg-[#00677d] text-white p-2 rounded-full shadow-lg">
                <span className="material-symbols-outlined text-sm">local_car_wash</span>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-[85%] max-w-sm">
          <div className="bg-white/80 backdrop-blur-md border border-white/40 p-6 rounded-[24px] shadow-[0_24px_48px_-12px_rgba(0,61,155,0.15)] relative overflow-hidden group">
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-[#50d9fe]/30 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700"></div>
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-[#0052cc] rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-[#003d9b]/20">
                <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  card_giftcard
                </span>
              </div>
              <h3 className="font-headline font-black text-2xl text-[#003d9b] leading-tight mb-1">新人首单 8.8元专享</h3>
              <p className="text-[#434654] text-sm font-medium mb-6">尊享智净顶级科技洗车服务</p>
              <button
                onClick={() => setClaimed(true)}
                disabled={claimed}
                className={`w-full font-bold py-3.5 rounded-xl shadow-[0_12px_32px_-8px_rgba(0,61,155,0.3)] active:scale-95 transition-all flex items-center justify-center gap-2 ${claimed ? 'bg-[#e0e3e5] text-[#737685] shadow-none' : 'bg-[#003d9b] text-white'}`}
              >
                {claimed ? '已领取' : '立即领取'}
                {!claimed ? <span className="material-symbols-outlined text-sm">arrow_forward</span> : null}
              </button>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30">
          <button
            onClick={() => setShowScanner(true)}
            className="group flex items-center gap-3 px-8 py-4 bg-[#003d9b] text-white rounded-full shadow-[0_12px_40px_-4px_rgba(0,61,155,0.4)] hover:shadow-[0_16px_48px_-4px_rgba(0,61,155,0.5)] active:scale-95 transition-all"
          >
            <div className="bg-white/20 p-2 rounded-full">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                qr_code_scanner
              </span>
            </div>
            <span className="font-headline font-black text-lg tracking-wider">扫码洗车</span>
          </button>
        </div>

        <div className="absolute bottom-28 left-4 right-4 z-20 flex gap-3">
          <Link
            to="/booking"
            state={{ stationId: currentStation?.id }}
            className="flex-1 bg-white/80 backdrop-blur-md p-4 rounded-2xl flex items-center gap-3 shadow-sm active:scale-95 transition-transform"
          >
            <div className="w-10 h-10 rounded-xl bg-[#50d9fe]/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#00677d]">schedule</span>
            </div>
            <div>
              <div className="text-[10px] text-[#434654] font-bold uppercase tracking-widest">当前状态</div>
              <div className="text-sm font-bold text-[#191c1e]">
                {loadingStations
                  ? '加载中...'
                  : currentStation
                    ? `空闲中 (${currentStation.availableDevices}/${currentStation.totalDevices})`
                    : '暂无门店'}
              </div>
            </div>
          </Link>
          <button onClick={handleLocationClick} className="flex-1 bg-white/80 backdrop-blur-md p-4 rounded-2xl flex items-center gap-3 shadow-sm active:scale-95 transition-transform text-left">
            <div className="w-10 h-10 rounded-xl bg-[#81f4ff]/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#004b51]">near_me</span>
            </div>
            <div>
              <div className="text-[10px] text-[#434654] font-bold uppercase tracking-widest">最近距离</div>
              <div className="text-sm font-bold text-[#191c1e]">{currentStation ? `${currentStation.distanceKm}km` : '暂无数据'}</div>
            </div>
          </button>
        </div>

        {error ? (
          <div className="absolute bottom-52 left-4 right-4 z-20">
            <div className="bg-[#fff4f4] text-[#ba1a1a] rounded-2xl px-4 py-3 text-sm shadow-sm">{error}</div>
          </div>
        ) : null}
      </main>
      <BottomNav />

      {showScanner ? (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
          <div className="flex items-center justify-between p-6 text-white">
            <button onClick={() => setShowScanner(false)} className="material-symbols-outlined text-3xl">
              close
            </button>
            <span className="font-bold tracking-widest">扫码洗车</span>
            <span className="material-symbols-outlined text-3xl opacity-0">close</span>
          </div>
          <div className="flex-1 relative flex items-center justify-center">
            <div className="w-64 h-64 border-2 border-[#50d9fe] rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#003d9b] rounded-tl-xl"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#003d9b] rounded-tr-xl"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#003d9b] rounded-bl-xl"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#003d9b] rounded-br-xl"></div>
              <div
                className="absolute left-0 w-full h-1 bg-[#50d9fe] shadow-[0_0_15px_#50d9fe] opacity-80"
                style={{ top: `${scanLinePos}%` }}
              ></div>
            </div>
            <p className="absolute bottom-24 text-white/70 text-sm">将二维码放入框内，即可自动扫描</p>
            <button
              onClick={handleStartControl}
              disabled={startingControl}
              className="absolute bottom-8 bg-[#003d9b] text-white px-8 py-3 rounded-full font-bold shadow-lg active:scale-95 transition-transform disabled:opacity-60"
            >
              {startingControl ? '连接中...' : '模拟扫描成功'}
            </button>
          </div>
        </div>
      ) : null}

      {showCitySelector ? (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-white rounded-t-[2rem] p-6 h-[65vh] flex flex-col animate-in slide-in-from-bottom-full duration-300">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-xl text-[#191c1e]">选择城市与区域</h3>
              <button onClick={() => setShowCitySelector(false)} className="material-symbols-outlined text-[#737685]">
                close
              </button>
            </div>
            <p className="text-sm text-[#ba1a1a] mb-6 bg-[#ba1a1a]/10 p-3 rounded-xl flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">location_disabled</span>
              无法获取您的定位，请手动选择您所在的区域。
            </p>

            <div className="flex gap-4 flex-1 overflow-hidden bg-[#f7f9fb] rounded-2xl border border-[#eceef0]">
              <div className="flex-1 overflow-y-auto border-r border-[#eceef0] py-2">
                {cities.map((city) => (
                  <button
                    key={city}
                    onClick={() => setSelectedCity(city)}
                    className={`w-full text-left px-6 py-4 text-sm transition-colors ${selectedCity === city ? 'text-[#003d9b] font-bold bg-white border-l-4 border-[#003d9b]' : 'text-[#434654] hover:bg-[#eceef0]'}`}
                  >
                    {city}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto py-2">
                {districts.map((district) => (
                  <button
                    key={district}
                    onClick={() => {
                      setSelectedDistrict(district);
                      setShowCitySelector(false);
                      setShowMap(true);
                    }}
                    className="w-full text-left px-6 py-4 text-sm text-[#191c1e] hover:bg-[#eceef0] transition-colors flex justify-between items-center"
                  >
                    {district}
                    <span className="material-symbols-outlined text-[#c3c6d6] text-sm">chevron_right</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showMap ? (
        <div className="fixed inset-0 z-[100] bg-[#f7f9fb] flex flex-col">
          <div className="absolute top-0 w-full z-10 bg-white/80 backdrop-blur-md flex items-center p-6 shadow-sm">
            <button onClick={() => setShowMap(false)} className="material-symbols-outlined text-[#003d9b] text-2xl mr-4">
              arrow_back_ios
            </button>
            <span className="font-bold text-lg text-[#191c1e]">附近门店</span>
          </div>
          <div className="flex-1 relative">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCQfFA22hipejgBpXrladsZ3NTTuRFfQxr_K2PS8VnrBazdeJV7LRRHzNxyUskwQsKBIuvGYK2Suk17Oa5WPlz53JvpvaxkSgx_HDCPEAzDkO-NpoJmYBbw75cVUeD4v--qg_A2kWhTglqkmPZNmD9ZgW-0KvCzeOtrNLRYPWnca2ZDNVNkfuRytIQi3MkkVuBL3D7P_xSnScDEtlo8m-6yA9WQiS_XKbo7thW5osCi9D0_qniZoemGmJ0nuQgvopb_ANd1qjUYgl_V"
              alt="Full Map"
              className="w-full h-full object-cover"
            />

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <div className="bg-white px-4 py-2 rounded-xl shadow-lg mb-2 whitespace-nowrap">
                <p className="font-bold text-[#003d9b] text-sm">{currentStation?.name || `${selectedDistrict}站`}</p>
                <p className="text-xs text-[#737685]">
                  距离 {currentStation?.distanceKm || '--'}km | 空闲 {currentStation?.availableDevices || 0}/{currentStation?.totalDevices || 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-[#003d9b] rounded-full flex items-center justify-center shadow-xl border-4 border-white">
                <span className="material-symbols-outlined text-white text-xl">local_car_wash</span>
              </div>
            </div>

            <div className="absolute bottom-8 left-4 right-4 bg-white rounded-2xl p-4 shadow-xl flex justify-between items-center">
              <div>
                <h3 className="font-bold text-[#191c1e] text-lg">智净24H {currentStation?.name || `${selectedDistrict}站`}</h3>
                <p className="text-sm text-[#737685] mt-1">{currentStation?.address || `${selectedCity}${selectedDistrict}`}</p>
              </div>
              <button
                onClick={() => {
                  setShowMap(false);
                  navigate('/booking', { state: { stationId: currentStation?.id } });
                }}
                className="bg-[#003d9b] text-white px-6 py-3 rounded-xl font-bold shadow-md active:scale-95 transition-transform"
              >
                去预约
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
