import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

type LocalFile = {
  url: string;
  type: string;
  name: string;
};

export default function Feedback() {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState('不出水');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) {
      return;
    }
    const nextFiles = Array.from(event.target.files as FileList).map((file: File) => ({
      url: URL.createObjectURL(file),
      type: file.type,
      name: file.name,
    }));
    setFiles((previous) => [...previous, ...nextFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((previous) => previous.filter((_, fileIndex) => fileIndex !== index));
  };

  const handleSubmit = async () => {
    if (!description || !phone) {
      setError('请补充详细描述和联系电话');
      return;
    }

    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      await api.createFeedback({
        type: selectedType,
        description,
        phone,
        attachments: files.map((file) => file.name),
      });
      setDescription('');
      setFiles([]);
      setMessage('反馈已提交，我们会尽快处理');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '提交反馈失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#f7f9fb] text-[#191c1e] min-h-screen pb-32">
      <header className="fixed top-0 w-full z-50 bg-[#f7f9fb]/80 backdrop-blur-xl flex items-center justify-between px-6 py-4 shadow-[0_12px_32px_-8px_rgba(0,61,155,0.08)]">
        <div className="flex items-center gap-2">
          <Link to="/profile" className="material-symbols-outlined text-[#003d9b]">
            arrow_back_ios
          </Link>
          <span className="font-headline font-bold tracking-tight text-lg text-[#003d9b]">反馈与报修</span>
        </div>
        <div className="text-[#434654]">
          <span className="material-symbols-outlined">history</span>
        </div>
      </header>
      <main className="pt-24 px-6 max-w-2xl mx-auto space-y-8">
        <section className="space-y-2">
          <h2 className="text-2xl font-headline font-bold text-[#003d9b] tracking-tight">遇到问题了？</h2>
          <p className="text-[#434654] text-sm leading-relaxed">请选择故障类型并详细描述，我们的运维团队将在 24 小时内为您处理。您的反馈是我们提升服务的动力。</p>
        </section>
        <section className="space-y-4">
          <h3 className="font-headline font-bold text-[#191c1e] flex items-center gap-2">
            <span className="w-1.5 h-6 bg-[#00677d] rounded-full"></span>
            选择故障类型
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: '不出水', icon: 'water_drop' },
              { id: '泡沫少', icon: 'bubbles' },
              { id: '扫码失败', icon: 'qr_code_scanner' },
              { id: '其他故障', icon: 'error' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedType(item.id)}
                className={`flex flex-col items-start p-4 rounded-xl border-2 transition-all ${selectedType === item.id ? 'bg-[#ffffff] border-[#003d9b] text-[#003d9b] shadow-[0_12px_32px_-8px_rgba(0,61,155,0.08)]' : 'bg-[#f2f4f6] border-transparent hover:border-[#c3c6d6]/30 text-[#434654]'}`}
              >
                <span className="material-symbols-outlined mb-2" style={{ fontVariationSettings: selectedType === item.id ? "'FILL' 1" : "'FILL' 0" }}>
                  {item.icon}
                </span>
                <span className={`text-sm ${selectedType === item.id ? 'font-bold' : 'font-medium'}`}>{item.id}</span>
              </button>
            ))}
          </div>
        </section>
        <section className="space-y-4">
          <h3 className="font-headline font-bold text-[#191c1e] flex items-center gap-2">
            <span className="w-1.5 h-6 bg-[#00677d] rounded-full"></span>
            详细描述
          </h3>
          <div className="relative">
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value.slice(0, 300))}
              className="w-full bg-[#ffffff] border-none rounded-xl p-4 text-[#191c1e] placeholder:text-[#737685] focus:ring-2 focus:ring-[#00677d] shadow-sm"
              placeholder="请详细说明您遇到的问题，例如：设备编号、具体表现等..."
              rows={4}
            ></textarea>
            <div className="absolute bottom-3 right-3 text-[10px] font-mono text-[#737685] uppercase tracking-widest">{description.length} / 300</div>
          </div>
        </section>
        <section className="space-y-4">
          <h3 className="font-headline font-bold text-[#191c1e] flex items-center gap-2">
            <span className="w-1.5 h-6 bg-[#00677d] rounded-full"></span>
            上传照片/视频
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div onClick={() => fileInputRef.current?.click()} className="aspect-square bg-[#f2f4f6] rounded-xl border-2 border-dashed border-[#c3c6d6]/50 flex flex-col items-center justify-center text-[#737685] cursor-pointer hover:bg-[#e6e8ea] transition-colors">
              <span className="material-symbols-outlined text-3xl">add_a_photo</span>
              <span className="text-[10px] mt-1 font-bold">添加</span>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*" multiple className="hidden" />
            {files.map((file, index) => (
              <div key={`${file.name}-${index}`} className="relative aspect-square rounded-xl overflow-hidden group">
                <div onClick={() => removeFile(index)} className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer z-10">
                  <span className="material-symbols-outlined text-white">delete</span>
                </div>
                {file.type.startsWith('video/') ? <video src={file.url} className="w-full h-full object-cover" /> : <img src={file.url} alt="upload preview" className="w-full h-full object-cover" />}
              </div>
            ))}
          </div>
          <p className="text-[10px] text-[#737685] italic">支持 jpg/png/mp4 格式，单个文件不超过 20MB</p>
        </section>
        <section className="space-y-4">
          <h3 className="font-headline font-bold text-[#191c1e] flex items-center gap-2">
            <span className="w-1.5 h-6 bg-[#00677d] rounded-full"></span>
            联系电话
          </h3>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#00677d] group-focus-within:text-[#003d9b] transition-colors">
              <span className="material-symbols-outlined">call</span>
            </div>
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="w-full bg-[#ffffff] border-none rounded-xl py-4 pl-12 pr-4 text-[#191c1e] focus:ring-2 focus:ring-[#00677d] shadow-sm"
              placeholder="请输入您的手机号码"
            />
          </div>
        </section>
        {error ? <div className="bg-[#fff4f4] text-[#ba1a1a] rounded-2xl px-4 py-3 text-sm">{error}</div> : null}
        {message ? <div className="bg-[#ecfff4] text-[#00677d] rounded-2xl px-4 py-3 text-sm">{message}</div> : null}
      </main>
      <div className="fixed bottom-0 left-0 w-full p-6 bg-white/90 backdrop-blur-md border-t border-[#c3c6d6]/15 z-50">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-[#003d9b] text-white font-headline font-bold py-4 rounded-xl shadow-[0_12px_32px_-8px_rgba(0,61,155,0.2)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            send
          </span>
          {submitting ? '提交中...' : '提交反馈'}
        </button>
      </div>
    </div>
  );
}
