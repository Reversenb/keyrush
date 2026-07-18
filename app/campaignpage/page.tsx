"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { Terminal, Monitor, Zap, Medal, Trophy, CheckCircle, Lock, Power } from 'lucide-react';
import Navbar from '@/components/Navbar';
import HackerLoadingScreen from '@/components/HackerLoadingScreen';
import { apiFetch, clearUserState } from '@/lib/api';
import { getRankByExp } from '@/lib/ranks';

export default function CampaignPage() {
  const router = useRouter();

  // 🌟 Theme State
  const { theme: activeTheme, resolvedTheme } = useTheme();
  const currentTheme = activeTheme === 'system' ? resolvedTheme : activeTheme;
  const isDark = currentTheme === 'dark';
  const isHacker = currentTheme === 'hacker' || currentTheme === 'dragon'; const isDragon = currentTheme === 'dragon';

  const [user, setUser] = useState<any>(null);
  const [targetOs, setTargetOs] = useState<'linux' | 'windows'>('linux');
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  // 🌟 Ref สำหรับคำนวณการเลื่อนหน้าจอ
  const currentLevelRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
    const fetchProfile = async () => {
      try {
        // cookie ถูกแนบไปเอง — ถ้า 401 apiFetch จะพาไปหน้า login ให้
        const res = await apiFetch('/api/user/progress');

        if (res.status === 401 || res.status === 403) {
          clearUserState();
          router.push('/login');
          return;
        }

        const data = await res.json();

        if (data.success && data.data) {
          setUser({
            ...data.data,
            linuxLevel: data.data.linuxLevel || 1,
            linuxExp: data.data.linuxExp || 0,
            windowsLevel: data.data.windowsLevel || 1,
            windowsExp: data.data.windowsExp || 0,
          });
        }
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setTimeout(() => setLoading(false), 500);
      }
    };

    fetchProfile();

    // ✅ FIXED: บังคับให้เป็น Linux เป็นค่า Default เสมอเมื่อเปิดเข้ามาหน้านี้ 
    // ตัดปัญหาการจำค่าเก่าที่ผิดพลาดจากหน้า Leaderboard หรือ Session เก่า
    setTargetOs('linux');
    localStorage.setItem('keyrush_target_os', 'linux');

  }, [router]);

  const activeLevel = targetOs === 'linux' ? (user?.linuxLevel || 1) : (user?.windowsLevel || 1);
  const activeExp = targetOs === 'linux' ? (user?.linuxExp || 0) : (user?.windowsExp || 0);

  // 🌟 Auto-scroll ไปยังโหนดปัจจุบัน
  useEffect(() => {
    if (isMounted && !loading && currentLevelRef.current && mapContainerRef.current) {
      setTimeout(() => {
        const container = mapContainerRef.current;
        const target = currentLevelRef.current;
        if (container && target) {
          const scrollPosition = target.offsetTop - (container.clientHeight / 2) + (target.clientHeight / 2);
          container.scrollTo({
            top: scrollPosition,
            behavior: 'smooth'
          });
        }
      }, 300);
    }
  }, [isMounted, loading, targetOs, activeLevel]);

  const handleEnterMission = () => {
    localStorage.setItem('keyrush_target_os', targetOs);
    router.push('/campaignplay');
  };

  const handleReplayMission = (level: number) => {
    localStorage.setItem('keyrush_target_os', targetOs);
    router.push(`/campaignplay?level=${level}`);
  };

  // เพดาน EXP ของช่วงเลเวลปัจจุบัน — ใช้คำนวณแถบความคืบหน้าเท่านั้น
  // (ชื่อแรงค์ที่แสดงดึงจากตารางกลาง lib/ranks.ts ด้านล่าง)
  const getTierMaxExp = (level: number) => {
    if (level <= 3) return 300;
    if (level <= 6) return 600;
    if (level <= 9) return 900;
    return 9900;
  };

  const tierMaxExp = getTierMaxExp(activeLevel);
  // 🏆 แรงค์จริงจากตารางกลาง lib/ranks.ts (คิดจาก EXP รวมทั้งสอง OS — ตรงกับหน้า Ranks/Dashboard)
  const globalRank = getRankByExp((user?.linuxExp || 0) + (user?.windowsExp || 0));
  const baseExpForTier = (Math.ceil(activeLevel / 3) - 1) * 300;
  const expInCurrentTier = activeExp - baseExpForTier;
  const expNeededForTier = tierMaxExp - baseExpForTier;
  const progressPercent = Math.min((expInCurrentTier / expNeededForTier) * 100, 100);

  // 🌟 Dynamic Theme Variables 🌟
  const isLinux = targetOs === 'linux';

  const themeColorHex = isHacker ? (isDragon ? '#ef4444' : '#22c55e') : isDark ? (isLinux ? '#facc15' : '#60a5fa') : (isLinux ? '#f97316' : '#3b82f6');
  const themeText = isHacker ? 'text-green-500' : isDark ? (isLinux ? 'text-yellow-400' : 'text-blue-400') : (isLinux ? 'text-orange-500' : 'text-blue-500');
  const themeBg = isHacker ? 'bg-green-600' : isDark ? (isLinux ? 'bg-yellow-400' : 'bg-blue-500') : (isLinux ? 'bg-orange-500' : 'bg-blue-500');
  const themeLightBg = isHacker ? 'bg-green-900/30' : isDark ? (isLinux ? 'bg-yellow-400/20' : 'bg-blue-500/20') : (isLinux ? 'bg-orange-100' : 'bg-blue-100');
  const themeBorder = isHacker ? 'border-green-600' : isDark ? (isLinux ? 'border-yellow-400' : 'border-blue-400') : (isLinux ? 'border-orange-500' : 'border-blue-500');
  const themeShadow = isHacker ? 'shadow-[0_8px_0_#14532d]' : isDark ? (isLinux ? 'shadow-[0_8px_0_#ca8a04]' : 'shadow-[0_8px_0_#1d4ed8]') : (isLinux ? 'shadow-[0_8px_0_rgba(249,115,22,0.2)]' : 'shadow-[0_8px_0_rgba(59,130,246,0.2)]');

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  if (!isMounted) return <div className="min-h-screen bg-background"></div>;

  return (
    <div className={`min-h-screen bg-background font-sans font-black flex flex-col text-foreground relative transition-colors duration-500 ${isHacker ? 'selection:bg-green-500/20' : isDark ? (isLinux ? 'selection:bg-yellow-400/20' : 'selection:bg-blue-500/20') : (isLinux ? 'selection:bg-orange-500/20' : 'selection:bg-blue-500/20')}`}>

      {/* 🌸 สไตล์รองรับ 3 ธีม 🌸 */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(2deg); }
        }
        .float-element { animation: float 6s ease-in-out infinite; }
        .float-delayed { animation: float 7s ease-in-out infinite 1.5s; }
        
        .glass-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(16px);
          border: 4px solid white;
          border-radius: 32px;
          transition: all 0.3s ease;
          box-shadow: 0 10px 30px rgba(249, 115, 22, 0.1);
        }

        .dark .glass-card {
          background: rgba(45, 34, 59, 0.7); 
          border-color: #382E54;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .hacker .glass-card {
          background: rgba(10, 10, 10, 0.85); 
          border-color: #166534; 
          box-shadow: 0 10px 30px rgba(34, 197, 94, 0.15);
        }
        
        .btn-squishy {
          transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-squishy:hover { transform: scale(1.05) translateY(-2px); }
        .btn-squishy:active { transform: scale(0.95) translateY(0); box-shadow: none !important; }

        .cute-header {
          text-shadow: 2px 2px 0px rgba(255, 255, 255, 1), -1px -1px 0px rgba(255, 255, 255, 1), 1px -1px 0px rgba(255, 255, 255, 1), -1px 1px 0px rgba(255, 255, 255, 1);
          letter-spacing: -0.02em;
        }

        .dark .cute-header { text-shadow: 2px 2px 0px rgba(0, 0, 0, 0.4); }
        .hacker .cute-header { text-shadow: 2px 2px 0px rgba(0, 0, 0, 0.8); }
        
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(249,115,22,0.3); border-radius: 4px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(250,204,21,0.3); }
        .hacker .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(34,197,94,0.3); }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(249,115,22,0.6); }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(250,204,21,0.6); }
        .hacker .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(34,197,94,0.6); }
      `}</style>

      {/* 🎈 Background Blobs 🎈 */}
      <div className={`fixed top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[100px] opacity-20 hacker:opacity-10 float-element pointer-events-none z-0 transition-colors duration-1000 ${isHacker ? 'bg-green-600' : isDark ? (isLinux ? 'bg-yellow-500' : 'bg-blue-600') : (isLinux ? 'bg-orange-400' : 'bg-blue-400')}`} />
      <div className={`fixed bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full blur-[100px] opacity-20 hacker:opacity-10 float-delayed pointer-events-none z-0 transition-colors duration-1000 ${isHacker ? 'bg-green-700' : isDark ? (isLinux ? 'bg-yellow-600' : 'bg-cyan-600') : (isLinux ? 'bg-amber-400' : 'bg-cyan-400')}`} style={{ animationDelay: '1.5s' }} />

      <AnimatePresence>
        {loading && <HackerLoadingScreen />}
      </AnimatePresence>

      {/* ================= Header & Navbar ================= */}
      <div className="z-50 relative shrink-0">
        <Navbar theme="linux" />
      </div>

      {/* ================= Main Content ================= */}
      <div className="flex-1 relative z-10 p-4 md:p-6 lg:p-8 flex justify-center pb-20">

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={!loading ? "show" : "hidden"}
          className="w-full max-w-[1200px] flex flex-col gap-4 md:gap-6"
        >

          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-black text-orange-950 dark:text-white hacker:text-white tracking-tighter uppercase cute-header mb-1 transition-colors duration-500">
              Mission <span className={themeText}>Control</span>
            </h1>
            <p className={`font-bold text-xs md:text-sm uppercase tracking-widest transition-colors duration-500 ${isHacker ? 'text-green-600' : isDark ? 'text-white/60' : 'text-orange-600'}`}>
              เลือกระบบปฏิบัติการที่ต้องการฝึกฝน
            </p>
          </div>

          {/* 🌟 3 กล่องสถานะด้านบน (Stats Cards) 🌟 */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 shrink-0">
            <div className="glass-card p-4 md:p-5 shadow-sm hover:shadow-md col-span-2 sm:col-span-1 group transition-all">
              <div className="flex items-center justify-between mb-2">
                <p className={`text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-colors duration-500 ${isHacker ? 'text-green-600' : isDark ? 'text-white/50' : 'text-orange-400'}`}>
                  <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${themeBg}`}></span>
                  {targetOs} EXP
                </p>
                <div className={`p-1.5 rounded-xl ${themeLightBg} ${themeText} group-hover:scale-110 transition-all duration-300`}>
                  <Zap size={18} strokeWidth={3} />
                </div>
              </div>
              <p className={`text-3xl md:text-4xl font-black leading-tight cute-header transition-colors duration-500 ${themeText}`}>
                {activeExp.toLocaleString()}
              </p>
              <div className={`w-full h-2.5 rounded-full mt-3 overflow-hidden relative shadow-inner border-2 transition-colors duration-500 ${isHacker ? 'bg-[#0a0a0a] border-green-900' : isDark ? 'bg-[#1E1B2E] border-[#382E54]' : 'bg-orange-50 border-white'}`}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                  className={`h-full rounded-full transition-colors duration-500 ${themeBg}`}
                />
              </div>
            </div>

            <div className="glass-card p-4 md:p-5 shadow-sm hover:shadow-md group flex flex-col justify-center transition-all">
              <div className="flex items-center justify-between mb-2">
                <p className={`text-[10px] md:text-xs font-black uppercase tracking-widest transition-colors duration-500 ${isHacker ? 'text-green-600' : isDark ? 'text-white/50' : 'text-orange-400'}`}>LEVEL</p>
                <div className={`p-1.5 rounded-xl ${themeLightBg} ${themeText} group-hover:scale-110 transition-all duration-300`}>
                  <Medal size={18} strokeWidth={3} />
                </div>
              </div>
              <p className={`text-3xl md:text-4xl font-black leading-tight cute-header transition-colors duration-500 ${isHacker ? 'text-green-400' : isDark ? 'text-white' : 'text-orange-950'}`}>LVL {activeLevel}</p>
            </div>

            {/* 🏆 การ์ดแรงค์ — กดเพื่อไปดูตารางแรงค์ทั้งหมด */}
            <Link href="/ranks" title="ดูตารางแรงค์ทั้งหมด" className="glass-card p-4 md:p-5 shadow-sm hover:shadow-md hover:-translate-y-1 group flex flex-col justify-center transition-all cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <p className={`text-[10px] md:text-xs font-black uppercase tracking-widest transition-colors duration-500 ${isHacker ? 'text-green-600' : isDark ? 'text-white/50' : 'text-orange-400'}`}>Rank</p>
                <div className={`p-1.5 rounded-xl ${themeLightBg} ${themeText} group-hover:scale-110 transition-all duration-300`}>
                  <Trophy size={18} strokeWidth={3} />
                </div>
              </div>
              <p className={`text-xl md:text-2xl font-black leading-tight mt-1 cute-header truncate transition-colors duration-500 ${themeText}`}>
                {globalRank.title.toUpperCase()}
              </p>
            </Link>
          </motion.div>

          {/* 🌟 พื้นที่แผนที่ (Campaign Map Area) กำหนดความสูงตายตัว 🌟 */}
          <motion.div variants={itemVariants} className="h-[600px] md:h-[700px] glass-card shadow-sm relative overflow-hidden flex flex-col">

            {/* พื้นหลังตาราง Grid */}
            <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.05] hacker:opacity-[0.08] pointer-events-none transition-all duration-500" style={{ backgroundImage: `linear-gradient(${themeColorHex} 2px, transparent 2px), linear-gradient(90deg, ${themeColorHex} 2px, transparent 2px)`, backgroundSize: '40px 40px' }}></div>

            {/* 🌟 ป้ายสลับสาย (OS Toggle) 🌟 */}
            <div className="absolute top-4 right-4 md:top-6 md:right-6 z-50 pointer-events-auto">
              <div className={`p-2.5 rounded-[24px] border-4 flex gap-4 shadow-sm relative backdrop-blur-md transition-colors duration-500 ${isHacker ? 'bg-[#0a0a0a]/80 border-[#166534]' : isDark ? 'bg-[#1E1B2E]/80 border-[#382E54]' : 'bg-white/80 border-white'}`}>

                <button
                  onClick={() => setTargetOs('linux')}
                  className={`relative px-5 py-2.5 md:py-3 rounded-[16px] text-[10px] md:text-xs font-black uppercase tracking-widest transition-colors duration-300 flex items-center justify-center gap-1.5 whitespace-nowrap btn-squishy z-10 
                    ${targetOs === 'linux'
                      ? (isHacker ? 'text-[#0a0a0a]' : isDark ? 'text-[#1E1B2E]' : 'text-white')
                      : (isHacker ? 'text-green-700 hover:text-green-500 hover:bg-[#111]' : isDark ? 'text-white/50 hover:text-yellow-400 hover:bg-[#2D223B]' : 'text-orange-400 hover:text-orange-600 hover:bg-orange-50/50')}`}
                >
                  {targetOs === 'linux' && (
                    <motion.div
                      layoutId="activeOsBg"
                      className={`absolute inset-0 rounded-[16px] -z-10 shadow-sm transition-colors duration-500 ${isHacker ? 'bg-green-500' : isDark ? 'bg-yellow-400' : 'bg-orange-500'}`}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Terminal size={16} strokeWidth={3} /> LINUX
                </button>

                <button
                  onClick={() => setTargetOs('windows')}
                  className={`relative px-5 py-2.5 md:py-3 rounded-[16px] text-[10px] md:text-xs font-black uppercase tracking-widest transition-colors duration-300 flex items-center justify-center gap-1.5 whitespace-nowrap btn-squishy z-10 
                    ${targetOs === 'windows'
                      ? (isHacker ? 'text-[#0a0a0a]' : isDark ? 'text-[#1E1B2E]' : 'text-white')
                      : (isHacker ? 'text-green-700 hover:text-green-500 hover:bg-[#111]' : isDark ? 'text-white/50 hover:text-blue-400 hover:bg-[#2D223B]' : 'text-blue-400 hover:text-blue-600 hover:bg-blue-50/50')}`}
                >
                  {targetOs === 'windows' && (
                    <motion.div
                      layoutId="activeOsBg"
                      className={`absolute inset-0 rounded-[16px] -z-10 shadow-sm transition-colors duration-500 ${isHacker ? 'bg-green-500' : isDark ? 'bg-blue-400' : 'bg-blue-500'}`}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Monitor size={16} strokeWidth={3} /> WIN
                </button>

              </div>
            </div>

            {/* 🌟 กรอบเลื่อน Timeline 🌟 */}
            <div ref={mapContainerRef} className="flex-1 relative z-10 overflow-y-auto overflow-x-hidden custom-scrollbar w-full">
              <div className="flex flex-col items-center w-full pt-28 pb-32 px-4">
                <div className="flex flex-col items-center w-full">

                  {/* System Boot (โหนดจุดเริ่มต้น) */}
                  {activeLevel === 1 && (
                    <div className="flex flex-col items-center w-full">
                      <div className="flex flex-col items-center gap-2 relative z-10 opacity-60">
                        <div className={`size-12 md:size-14 rounded-full border-4 flex items-center justify-center shadow-sm transition-colors duration-500 ${isHacker ? 'bg-[#0a0a0a] border-[#166534]' : isDark ? 'bg-[#1E1B2E] border-[#382E54]' : 'bg-orange-100 border-white'}`}>
                          <Power className={themeText} size={24} strokeWidth={3} />
                        </div>
                        <div className={`text-center px-4 py-2 rounded-xl border-2 shadow-sm transition-colors duration-500 ${isHacker ? 'bg-[#0a0a0a] border-[#166534]' : isDark ? 'bg-[#1E1B2E] border-[#382E54]' : 'bg-white border-white'}`}>
                          <p className={`text-[10px] md:text-xs font-black ${isHacker ? 'text-green-600' : isDark ? 'text-white/60' : 'text-orange-950'}`}>System Boot</p>
                        </div>
                      </div>
                      <div className={`w-2 h-10 md:h-14 my-2 rounded-full opacity-30 ${themeBg}`}></div>
                    </div>
                  )}

                  {/* ด่านในอดีตทั้งหมดที่ผ่านไปแล้ว */}
                  {Array.from({ length: activeLevel - 1 }).map((_, index) => {
                    const lvl = index + 1;
                    return (
                      <div key={lvl} className="flex flex-col items-center w-full">
                        <button
                          onClick={() => handleReplayMission(lvl)}
                          className="flex flex-col items-center gap-2 relative z-10 group cursor-pointer hover:scale-110 transition-transform btn-squishy"
                        >
                          <div className={`size-14 md:size-16 rounded-[24px] border-4 flex items-center justify-center transition-colors duration-500 shadow-sm ${themeText} ${isHacker ? 'bg-[#0a0a0a] border-[#166534] hover:bg-[#111]' : isDark ? 'bg-[#2D223B] border-[#4B3965] hover:bg-[#382E54]' : `bg-white border-white hover:${themeLightBg}`}`}>
                            <CheckCircle size={28} strokeWidth={3} className={themeText} />
                          </div>
                          <div className={`text-center px-4 py-2 rounded-xl border-2 shadow-sm group-hover:shadow-md transition-all duration-500 ${isHacker ? 'bg-[#0a0a0a] border-[#166534]' : isDark ? 'bg-[#1E1B2E] border-[#382E54]' : 'bg-white border-white'}`}>
                            <p className={`text-[10px] md:text-xs font-black ${isHacker ? 'text-green-500' : isDark ? 'text-white' : 'text-orange-950'}`}>Level {lvl}</p>
                            <p className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest mt-0.5 ${themeText}`}>[ Replay ]</p>
                          </div>
                        </button>
                        <div className={`w-2 h-12 md:h-16 my-3 rounded-full ${themeBg}`}></div>
                      </div>
                    );
                  })}

                  {/* 🌟 โหนดปัจจุบัน (Current Objective) 🌟 */}
                  <div ref={currentLevelRef} className="flex flex-col items-center gap-3 relative z-10 w-[90%] sm:w-64 group mt-2">
                    <motion.div
                      animate={{ y: [-5, 5, -5] }}
                      transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                      className={`size-20 md:size-24 rounded-[32px] border-4 flex items-center justify-center relative z-20 shadow-md transition-colors duration-500 ${isHacker ? 'bg-[#111] border-green-500' : isDark ? `bg-[#2D223B] ${themeBorder}` : 'bg-white border-white'}`}
                    >
                      <div className={`absolute inset-[-10px] rounded-[36px] border-4 border-dashed opacity-40 animate-[spin_6s_linear_infinite] ${themeBorder}`}></div>
                      <div className={`absolute inset-0 rounded-[28px] animate-ping opacity-30 ${themeBg}`}></div>
                      {targetOs === 'linux'
                        ? <Terminal size={36} strokeWidth={3} className={themeText} />
                        : <Monitor size={36} strokeWidth={3} className={themeText} />
                      }
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className={`text-center backdrop-blur-xl px-5 md:px-6 py-5 md:py-6 rounded-[24px] border-4 shadow-lg relative mt-3 w-full transition-colors duration-500 z-10 ${isHacker ? 'bg-[#0a0a0a]/95 border-[#166534]' : isDark ? 'bg-[#1E1B2E]/95 border-[#382E54]' : 'bg-white/95 border-white'}`}
                    >
                      <div className="absolute -top-3 md:-top-4 left-1/2 -translate-x-1/2 border-[8px] md:border-[10px] border-transparent transition-colors duration-500" style={{ borderBottomColor: isHacker ? '#166534' : isDark ? '#382E54' : 'white' }}></div>

                      <p className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-1 transition-colors duration-500 ${isHacker ? 'text-green-600' : isDark ? 'text-white/50' : 'text-orange-400'}`}>Current Objective</p>
                      <p className={`text-2xl md:text-3xl font-black mb-4 md:mb-5 tracking-tight cute-header ${themeText}`}>Level {activeLevel}</p>

                      <button
                        onClick={handleEnterMission}
                        className={`block w-full py-3.5 md:py-4 text-sm md:text-base font-black rounded-[20px] transition-all uppercase tracking-widest border-4 btn-squishy shadow-sm hover:scale-[1.03]
                          ${isHacker
                            ? 'bg-green-600 text-[#0a0a0a] border-green-500 shadow-[0_6px_0_#14532d] hover:bg-green-500'
                            : isDark
                              ? `${themeBg} text-[#1E1B2E] ${themeBorder} ${themeShadow} hover:opacity-90`
                              : `${themeBg} text-white border-white ${themeShadow} hover:opacity-90`
                          }`}
                      >
                        Start Mission
                      </button>
                    </motion.div>
                  </div>

                  {/* เส้นเชื่อมไปด่านอนาคต */}
                  <div className={`w-2 h-12 md:h-16 my-4 rounded-full opacity-30 border-2 border-dashed transition-colors duration-500 ${themeBorder}`}></div>

                  {/* 🌟 โหนดอนาคต (Locked) 🌟 */}
                  <div className="flex flex-col items-center gap-2 relative z-10 opacity-50 grayscale">
                    <div className={`size-14 md:size-16 rounded-[24px] border-4 flex items-center justify-center shadow-sm transition-colors duration-500 ${isHacker ? 'bg-[#0a0a0a] border-[#166534]' : isDark ? 'bg-[#1E1B2E] border-[#382E54]' : 'bg-orange-100 border-white'}`}>
                      <Lock className={isHacker ? 'text-green-600' : isDark ? 'text-white/50' : 'text-orange-400'} size={28} strokeWidth={3} />
                    </div>
                    <div className={`text-center mt-2 px-4 py-2 rounded-xl border-2 shadow-sm transition-colors duration-500 ${isHacker ? 'bg-[#0a0a0a] border-[#166534]' : isDark ? 'bg-[#1E1B2E] border-[#382E54]' : 'bg-white border-white'}`}>
                      <p className={`text-[10px] md:text-xs font-black ${isHacker ? 'text-green-600' : isDark ? 'text-white/60' : 'text-orange-950'}`}>Level {activeLevel + 1}</p>
                      <p className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest mt-0.5 ${isHacker ? 'text-green-700' : isDark ? 'text-white/40' : 'text-orange-400'}`}>Encrypted</p>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}