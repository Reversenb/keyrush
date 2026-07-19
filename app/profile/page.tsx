"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Cropper from 'react-easy-crop';
import { PageSkeleton, skCard, sk } from '@/components/skeleton';
import Navbar from '@/components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import {
  Upload, ZoomOut, ZoomIn, LayoutDashboard, Save, CheckCircle, RefreshCw, Bot
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

// 🤖 ลดเหลือ 50 ตัว — โหลดไวขึ้นครึ่งหนึ่ง (seed เก่าที่ user เคยเลือกไว้ยังแสดงผลได้ปกติ)
const AVATAR_OPTIONS = [
  "Felix", "Aneka", "Jack", "Mimi", "Leo", "Nala", "Kiki", "Pepper", "Rusty", "Shadow",
  "Bolt", "Ziggy", "Spark", "Luna", "Mocha", "Titan", "Nova", "Olive", "Pixel", "Rex",
  "Gizmo", "Cipher", "Glitch", "Vortex", "Neo", "Trinity", "Axel", "Orion", "Nyx", "Echo",
  "Zeus", "Apollo", "Athena", "Ares", "Hades", "Hera", "Poseidon", "Hermes", "Artemis", "Aphrodite",
  "Blade", "Crash", "Ghost", "Jinx", "Matrix", "Onyx", "Rogue", "Viper", "Wolf", "Panda"
];

// 🤖 รูป avatar พร้อม skeleton ระหว่างรอโหลด — ไม่โชว์ alt text ค้างเป็นชื่อ
function BotAvatar({ src, alt, className }: { src: string; alt: string; className: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <span className="relative block w-full h-full">
      {!loaded && <span className="absolute inset-0 rounded-full animate-pulse bg-orange-100 dark:bg-white/10 hacker:bg-green-900/40" />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        // เผื่อรูปมาจาก cache แล้ว complete ก่อน React ผูก onLoad ทัน
        ref={(el) => { if (el?.complete && el.naturalWidth > 0) setLoaded(true); }}
        className={`${className} transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </span>
  );
}

export default function ProfilePage() {
  const router = useRouter();

  // 🌟 Theme State
  const { theme: activeTheme, resolvedTheme } = useTheme();
  const currentTheme = activeTheme === 'system' ? resolvedTheme : activeTheme;
  const isDark = currentTheme === 'dark';
  const isHacker = currentTheme === 'hacker' || currentTheme === 'dragon'; const isDragon = currentTheme === 'dragon';

  const [user, setUser] = useState<any>(null);
  const [displayName, setDisplayName] = useState('');
  const [editAvatar, setEditAvatar] = useState('Felix');
  const [bio, setBio] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{
    width: number; height: number; x: number; y: number;
  } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      // แสดงข้อมูล cache ก่อนเพื่อความไว แล้วค่อยยืนยันกับ backend (401 → เด้งไป login อัตโนมัติ)
      const savedUserStr = localStorage.getItem('keyrush_user');

      if (savedUserStr) {
        try {
          const parsedUser = JSON.parse(savedUserStr);
          setUser(parsedUser);
          setDisplayName(parsedUser.displayName || parsedUser.username?.split('@')[0] || "");
          setEditAvatar(parsedUser.avatar || "Felix");
          setBio(parsedUser.bio || "");
        } catch (e) {
          console.error("Local data parse error", e);
        }
      }

      try {
        const res = await apiFetch('/api/user/progress');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            setUser(data.data);
            setDisplayName(data.data.displayName || data.data.username?.split('@')[0] || "");
            setEditAvatar(data.data.avatar || "Felix");
            setBio(data.data.bio || "");
            localStorage.setItem('keyrush_user', JSON.stringify(data.data));
          }
        }
      } catch (err) {
        console.warn("Backend offline or unreachable, using LocalStorage data instead.");
      }

      setTimeout(() => setLoading(false), 500);
    };

    fetchUser();
  }, [router]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => setImage(reader.result as string));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onCropComplete = useCallback((_area: any, pixels: any) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const createCroppedImage = async () => {
    if (!image || !croppedAreaPixels) return null;
    const canvas = document.createElement('canvas');
    const img = new Image();
    img.src = image;
    await new Promise((resolve) => (img.onload = resolve));

    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(
      img,
      croppedAreaPixels.x, croppedAreaPixels.y,
      croppedAreaPixels.width, croppedAreaPixels.height,
      0, 0, 300, 300
    );
    return canvas.toDataURL('image/jpeg');
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);

    const finalAvatar = image ? (await createCroppedImage() || editAvatar) : editAvatar;

    const savedUser = JSON.parse(localStorage.getItem('keyrush_user') || '{}');
    const updatedUser = { ...savedUser, displayName, avatar: finalAvatar, bio };
    localStorage.setItem('keyrush_user', JSON.stringify(updatedUser));
    setUser(updatedUser);

    if (image) {
      setEditAvatar(finalAvatar as string);
      setImage(null);
    }

    try {
      await apiFetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, avatar: finalAvatar, bio })
      });
    } catch (err) {
      console.warn("Save to backend failed (Offline mode). Data saved locally.");
    } finally {
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
      setSaving(false);
    }
  };

  if (loading) return (
    <PageSkeleton maxW="max-w-5xl">
      {/* Header: หัวข้อ USER PROFILE ซ้าย + ปุ่ม Dashboard/Save ขวา (โครงเดียวกับหน้าจริง) */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 md:mb-8 gap-4 mt-2 md:mt-6">
        <div className={`${sk} rounded-2xl h-10 md:h-14 w-64 md:w-96 max-w-full`} />
        <div className="flex flex-row w-full lg:w-auto gap-3">
          <div className={`${sk} rounded-2xl md:rounded-[24px] h-12 flex-1 lg:flex-none lg:w-40`} />
          <div className={`${sk} rounded-2xl md:rounded-[24px] h-12 flex-1 lg:flex-none lg:w-44`} />
        </div>
      </div>
      {/* บอร์ดตั้งค่าโปรไฟล์: ซ้ายรูป+ตัวเลือก avatar / ขวาฟอร์ม */}
      <div className={`${skCard} rounded-[28px] p-6 md:p-10`}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <div className="lg:col-span-4 flex flex-col items-center">
            <div className={`${sk} rounded-[40px] size-48 md:size-56 mb-5`} />
            <div className={`${sk} rounded-full h-3.5 w-36 mb-4`} />
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-5 gap-3 w-full">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className={`${sk} rounded-full aspect-square`} style={{ opacity: 1 - i * 0.06 }} />
              ))}
            </div>
          </div>
          <div className="lg:col-span-8 flex flex-col gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2.5">
                <div className={`${sk} rounded-full h-3.5 w-32`} />
                <div className={`${sk} rounded-2xl h-14 w-full`} />
              </div>
            ))}
            <div className="flex flex-col gap-2.5">
              <div className={`${sk} rounded-full h-3.5 w-40`} />
              <div className={`${sk} rounded-2xl h-28 w-full`} />
            </div>
          </div>
        </div>
      </div>
    </PageSkeleton>
  );

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans font-black flex flex-col selection:bg-orange-500/20 dark:selection:bg-yellow-400/20 hacker:selection:bg-green-500/20 relative overflow-x-hidden transition-colors duration-500">

      <Navbar theme="linux" />

      {/* 🌸 สไตล์ 3D แบบครอบคลุม 🌸 */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(2deg); }
        }
        .float-element { animation: float 6s ease-in-out infinite; }
        .float-delayed { animation: float 7s ease-in-out infinite 1.5s; }
        
        .glass-card {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(16px);
          border: 4px solid white;
          border-radius: 40px;
          box-shadow: 0 10px 30px rgba(249, 115, 22, 0.1);
          transition: all 0.3s ease;
        }

        .dark .glass-card {
          background: rgba(45, 34, 59, 0.7); 
          border-color: #382E54;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }

        .hacker .glass-card {
          background: rgba(10, 10, 10, 0.85); 
          border-color: #166534; 
          box-shadow: 0 10px 30px rgba(34, 197, 94, 0.15);
        }
        
        .btn-squishy {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-squishy:hover { transform: scale(1.03) translateY(-2px); }
        .btn-squishy:active { transform: scale(0.97) translateY(0); box-shadow: none !important; }

        .cute-header {
          text-shadow: 3px 3px 0px rgba(255, 255, 255, 1), 
                       -1px -1px 0px rgba(255, 255, 255, 1), 
                       1px -1px 0px rgba(255, 255, 255, 1), 
                       -1px 1px 0px rgba(255, 255, 255, 1);
          letter-spacing: -0.02em;
        }

        .dark .cute-header { text-shadow: 2px 2px 0px rgba(0, 0, 0, 0.3); }
        .hacker .cute-header { text-shadow: 2px 2px 0px rgba(0, 0, 0, 0.8); }
        
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(249,115,22,0.3); border-radius: 4px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(250,204,21,0.3); }
        .hacker .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(34,197,94,0.3); }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(249,115,22,0.6); }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(250,204,21,0.6); }
        .hacker .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(34,197,94,0.6); }
      `}</style>

      {/* 🎈 Background Blobs เปลี่ยนตามธีม 🎈 */}
      <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-400 dark:bg-yellow-500 hacker:bg-green-600 rounded-full blur-[100px] opacity-20 dark:opacity-10 hacker:opacity-10 float-element pointer-events-none z-0 transition-colors duration-500" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-amber-400 dark:bg-yellow-600 hacker:bg-green-700 rounded-full blur-[100px] opacity-20 dark:opacity-10 hacker:opacity-10 float-delayed pointer-events-none z-0 transition-colors duration-500" style={{ animationDelay: '1.5s' }} />

      {/* 🌟 POP-UP NOTIFICATION เมื่อบันทึกสำเร็จ 🌟 */}
      <AnimatePresence>
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9, x: '-50%' }}
            animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
            exit={{ opacity: 0, y: -30, scale: 0.9, x: '-50%' }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`fixed top-24 left-1/2 z-[200] flex items-center gap-4 px-6 py-4 rounded-[24px] border-4 shadow-xl transition-colors duration-500
              ${isHacker
                ? 'bg-[#0a0a0a] border-green-500 text-green-400 shadow-[0_8px_0_#14532d]'
                : isDark
                  ? 'bg-[#1E1B2E] border-yellow-400 text-yellow-400 shadow-[0_8px_0_#ca8a04]'
                  : 'bg-white border-green-400 text-green-600 shadow-[0_8px_0_#4ade80]'
              }`}
          >
            <div className={`p-2 rounded-xl ${isHacker ? 'bg-green-900/40' : isDark ? 'bg-yellow-400/10' : 'bg-green-100'}`}>
              <CheckCircle size={28} strokeWidth={3} className={isHacker ? 'text-green-500' : isDark ? 'text-yellow-400' : 'text-green-500'} />
            </div>
            <div>
              <h4 className={`font-black uppercase tracking-widest text-sm cute-header ${isHacker ? 'text-green-500' : isDark ? 'text-yellow-400' : 'text-green-600'}`}>Update Successful</h4>
              <p className="text-xs font-bold opacity-80 mt-0.5">ระบบได้บันทึกข้อมูลโปรไฟล์ของคุณแล้ว ✨</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 relative overflow-x-hidden overflow-y-auto p-4 md:p-8 z-20 flex flex-col items-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-5xl mx-auto relative z-10 mt-4 md:mt-8"
        >

          {/* ========================================================= */}
          {/* 🎯 HEADER & ACTION BUTTONS (ย้ายปุ่มขึ้นมาตรงนี้) 🎯 */}
          {/* ========================================================= */}
          <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 md:mb-8 gap-4 relative">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-orange-950 dark:text-white hacker:text-white tracking-tighter drop-shadow-sm leading-none cute-header transition-colors duration-500">
                USER <span className="text-orange-500 dark:text-yellow-400 hacker:text-green-500 transition-colors duration-500">PROFILE</span>
              </h1>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-row w-full lg:w-auto gap-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex-1 lg:flex-none px-4 md:px-6 py-3 bg-white dark:bg-[#1E1B2E] hacker:bg-[#0a0a0a] border-4 border-orange-100 dark:border-[#4B3965] hacker:border-[#166534] text-orange-600 dark:text-white hacker:text-green-500 shadow-[0_4px_0_#fed7aa] dark:shadow-[0_4px_0_#000] hacker:shadow-[0_4px_0_#000] rounded-2xl md:rounded-[24px] font-black transition-all uppercase tracking-widest flex items-center justify-center gap-2 btn-squishy text-xs md:text-sm"
              >
                <LayoutDashboard size={18} strokeWidth={3} className="hidden sm:block" /> Dashboard
              </button>

              <button
                onClick={handleSave}
                disabled={saving || saveSuccess}
                className={`flex-1 lg:flex-none px-4 md:px-8 py-3 rounded-2xl md:rounded-[24px] font-black transition-all uppercase tracking-widest flex items-center justify-center gap-2 border-4 disabled:cursor-not-allowed btn-squishy text-xs md:text-sm
                  ${saveSuccess
                    ? 'bg-green-100 dark:bg-green-900/30 hacker:bg-green-900/30 text-green-600 dark:text-green-400 hacker:text-green-400 border-white dark:border-green-800 hacker:border-green-800 shadow-sm'
                    : isHacker
                      ? 'bg-green-500 border-green-400 text-[#0a0a0a] shadow-[0_6px_0_#14532d] disabled:opacity-50 disabled:shadow-none'
                      : isDark
                        ? 'bg-yellow-400 border-yellow-300 text-[#1E1B2E] shadow-[0_6px_0_#ca8a04] disabled:opacity-50 disabled:shadow-none'
                        : 'bg-orange-500 border-white text-white shadow-[0_6px_0_rgba(249,115,22,0.2)] disabled:opacity-50 disabled:shadow-none'
                  }
                `}
              >
                {saving ? (
                  <><RefreshCw className="animate-spin" size={18} strokeWidth={3} /> <span className="hidden sm:inline">Saving</span></>
                ) : saveSuccess ? (
                  <><CheckCircle size={18} strokeWidth={3} /> <span className="hidden sm:inline">Saved</span></>
                ) : (
                  <><Save size={18} strokeWidth={3} /> Save <span className="hidden sm:inline">Profile</span></>
                )}
              </button>
            </div>
          </header>

          {/* ========================================================= */}
          {/* 🌟 1. PROFILE SETTINGS (บอร์ดตั้งค่า Profile) 🌟 */}
          {/* ========================================================= */}
          <div className="glass-card p-6 md:p-10 mb-8 shadow-sm relative overflow-hidden group">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 relative z-30">

              {/* ซ้าย: ส่วนจัดการรูปภาพ */}
              <div className="lg:col-span-4 flex flex-col items-center">
                <div className="relative size-48 md:size-56 bg-white dark:bg-[#1E1B2E] hacker:bg-[#0a0a0a] rounded-[40px] overflow-hidden border-8 border-white dark:border-[#382E54] hacker:border-[#166534] shadow-sm mb-5 group-hover:shadow-md transition-all duration-500 cursor-pointer">
                  {image ? (
                    <div className="relative w-full h-full bg-orange-50 dark:bg-black/30">
                      <Cropper
                        image={image}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        cropShape="round"
                        showGrid={false}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                      />
                    </div>
                  ) : (
                    <BotAvatar
                      src={editAvatar.startsWith('data:') ? editAvatar : `https://api.dicebear.com/7.x/bottts/svg?seed=${editAvatar}&radius=50`}
                      alt="Avatar"
                      className="w-full h-full object-cover p-2 transition-transform duration-500 ease-out hover:scale-110"
                    />
                  )}
                </div>

                {image && (
                  <div className="w-full max-w-[240px] flex items-center gap-3 mb-5 bg-white dark:bg-[#2D223B] hacker:bg-[#111] px-4 py-3 rounded-2xl border-4 border-white dark:border-[#4B3965] hacker:border-green-800 shadow-sm transition-colors duration-500">
                    <ZoomOut className="text-orange-400 dark:text-yellow-500 hacker:text-green-500" size={20} strokeWidth={3} />
                    <input
                      type="range"
                      min={1} max={3} step={0.1}
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="flex-1 accent-orange-500 h-2 bg-orange-100 rounded-lg appearance-none cursor-pointer"
                    />
                    <ZoomIn className="text-orange-400 dark:text-yellow-500 hacker:text-green-500" size={20} strokeWidth={3} />
                  </div>
                )}

                <input type="file" accept="image/jpeg, image/png, image/webp" onChange={onFileChange} className="hidden" id="upload-photo" />
                <div className="flex flex-col gap-2 w-full max-w-[240px]">
                  <label htmlFor="upload-photo" className="w-full flex items-center justify-center gap-2 cursor-pointer py-4 bg-orange-100 dark:bg-[#382E54] hacker:bg-[#111] text-orange-600 dark:text-yellow-400 hacker:text-green-500 font-black rounded-[20px] border-4 border-white dark:border-[#4B3965] hacker:border-green-800 shadow-[0_4px_0_#fed7aa] dark:shadow-[0_4px_0_#1E1B2E] hacker:shadow-[0_4px_0_#0a0a0a] transition-all text-sm uppercase tracking-widest btn-squishy">
                    <Upload size={20} strokeWidth={3} />
                    Upload Custom
                  </label>
                  {image && (
                    <button onClick={() => { setImage(null); setEditAvatar(user?.avatar || 'Felix'); }} className="text-xs text-red-500 hover:text-red-600 font-black uppercase tracking-widest py-2 transition-colors">
                      [ Cancel Upload ]
                    </button>
                  )}
                </div>
              </div>

              {/* ขวา: ตั้งชื่อ, Bio & เลือก Bot Avatar */}
              <div className="lg:col-span-8 flex flex-col gap-6">

                <div className="space-y-2">
                  <label className="text-xs text-orange-500 dark:text-yellow-500 hacker:text-green-600 font-black uppercase tracking-widest pl-2 transition-colors duration-500">
                    Display Name
                  </label>
                  <div className="relative flex items-center w-full bg-white/80 dark:bg-[#1E1B2E]/80 hacker:bg-[#0a0a0a]/80 border-4 border-white dark:border-[#382E54] hacker:border-green-800 rounded-[24px] px-6 py-4 focus-within:border-orange-300 dark:focus-within:border-yellow-400 hacker:focus-within:border-green-500 transition-all shadow-sm">
                    <span className="text-orange-400 dark:text-yellow-500 hacker:text-green-600 font-black mr-3 text-xl transition-colors duration-500">&gt;</span>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="bg-transparent outline-none text-orange-950 dark:text-white hacker:text-green-400 font-black w-full placeholder:text-orange-950/30 dark:placeholder:text-white/30 hacker:placeholder:text-green-600/30 text-lg transition-colors duration-500"
                      placeholder="ตั้งชื่อเล่นของคุณ..."
                      maxLength={20}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center pl-2 pr-2">
                    <label className="text-xs text-orange-500 dark:text-yellow-500 hacker:text-green-600 font-black uppercase tracking-widest transition-colors duration-500">
                      Bio / Status
                    </label>
                    <span className={`text-xs font-black ${bio.length >= 150 ? 'text-red-500' : 'text-orange-300 dark:text-white/30 hacker:text-green-600/50'} transition-colors duration-500`}>
                      [{bio.length}/150]
                    </span>
                  </div>
                  <div className="relative flex items-start w-full bg-white/80 dark:bg-[#1E1B2E]/80 hacker:bg-[#0a0a0a]/80 border-4 border-white dark:border-[#382E54] hacker:border-green-800 rounded-[24px] px-6 py-4 focus-within:border-orange-300 dark:focus-within:border-yellow-400 hacker:focus-within:border-green-500 transition-all shadow-sm">
                    <span className="text-orange-400 dark:text-yellow-500 hacker:text-green-600 font-black mr-3 mt-0.5 text-xl transition-colors duration-500">~</span>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="bg-transparent outline-none text-orange-950 dark:text-white hacker:text-green-400 font-black w-full placeholder:text-orange-950/30 dark:placeholder:text-white/30 hacker:placeholder:text-green-600/30 text-lg resize-none custom-scrollbar transition-colors duration-500"
                      placeholder="เขียนอธิบายความเป็นตัวคุณ..."
                      rows={3}
                      maxLength={150}
                    />
                  </div>
                </div>

                <div className="bg-white/60 dark:bg-[#1E1B2E]/60 hacker:bg-[#0a0a0a]/60 p-6 rounded-[30px] border-4 border-white dark:border-[#382E54] hacker:border-green-800 shadow-sm flex-1 flex flex-col transition-colors duration-500">
                  <label className="flex items-center gap-2 text-xs font-black text-orange-500 dark:text-yellow-500 hacker:text-green-500 uppercase tracking-widest mb-4 transition-colors duration-500">
                    <Bot size={20} strokeWidth={3} /> Choose Bot Identity
                  </label>

                  <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-3 max-h-[160px] md:max-h-[200px] overflow-y-auto pr-3 custom-scrollbar p-1">
                    {AVATAR_OPTIONS.map(seed => {
                      const isActive = editAvatar === seed && !image;
                      return (
                        <button
                          key={seed}
                          type="button"
                          onClick={() => {
                            setImage(null);
                            setEditAvatar(seed);
                          }}
                          className={`group aspect-square rounded-[20px] transition-all duration-300 p-1 flex items-center justify-center relative border-4 
                            ${isActive
                              ? (isHacker ? 'border-green-500 bg-green-900/30 shadow-sm scale-105' : isDark ? 'border-yellow-400 bg-yellow-400/10 shadow-sm scale-105' : 'border-orange-500 bg-orange-100 shadow-sm scale-105')
                              : (isHacker ? 'border-green-900 bg-[#111] hover:border-green-600' : isDark ? 'border-[#4B3965] bg-[#2D223B] hover:border-yellow-500/50' : 'border-white bg-white hover:border-orange-300')
                            }
                          `}
                        >
                          <BotAvatar
                            src={`https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&radius=50`}
                            alt={seed}
                            className={`w-full h-full rounded-full transition-transform duration-300 ${isActive ? 'scale-100' : 'group-hover:scale-110'}`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </motion.div>
      </main>
    </div>
  );
}