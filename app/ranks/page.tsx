"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import Navbar from '@/components/Navbar';
import HackerLoadingScreen from '@/components/HackerLoadingScreen';
import {
  Keyboard, Terminal, Router as RouterIcon, Server,
  Bug, Fingerprint, Crown, ShieldCheck, Lock, CheckCircle
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { RANKS as BASE_RANKS } from '@/lib/ranks';

// ข้อมูลแรงค์กลางมาจาก lib/ranks.ts — ที่นี่เก็บเฉพาะสไตล์สีประจำหน้า Ranks
const RANK_STYLES: Record<number, { color: string; hex: string; border: string; bg: string; shadow: string }> = {
  1: { color: "text-slate-400", hex: "#94a3b8", border: "border-slate-200", bg: "bg-slate-100", shadow: "shadow-sm" },
  2: { color: "text-green-500", hex: "#4ade80", border: "border-green-200", bg: "bg-green-100", shadow: "shadow-sm" },
  3: { color: "text-amber-500", hex: "#fbbf24", border: "border-amber-200", bg: "bg-amber-100", shadow: "shadow-sm" },
  4: { color: "text-blue-500", hex: "#60a5fa", border: "border-blue-200", bg: "bg-blue-100", shadow: "shadow-sm" },
  5: { color: "text-purple-500", hex: "#c084fc", border: "border-purple-200", bg: "bg-purple-100", shadow: "shadow-sm" },
  6: { color: "text-pink-500", hex: "#f472b6", border: "border-pink-200", bg: "bg-pink-100", shadow: "shadow-sm" },
  7: { color: "text-rose-500", hex: "#fb7185", border: "border-rose-200", bg: "bg-rose-100", shadow: "shadow-[0_10px_30px_rgba(251,113,133,0.3)]" },
};
const RANKS = BASE_RANKS.map(r => ({ ...r, ...RANK_STYLES[r.id] }));

// 🌟 ฟังก์ชันแปลงชื่อ Icon เป็น Lucide Component
const getIcon = (name: string, size: number, className: string = "") => {
  const props = { size, strokeWidth: 3, className };
  switch (name) {
    case 'keyboard': return <Keyboard {...props} />;
    case 'terminal': return <Terminal {...props} />;
    case 'router': return <RouterIcon {...props} />;
    case 'dns': return <Server {...props} />;
    case 'bug_report': return <Bug {...props} />;
    case 'fingerprint': return <Fingerprint {...props} />;
    case 'admin_panel_settings': return <Crown {...props} />;
    default: return <Terminal {...props} />;
  }
};

export default function RanksPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 🌟 ระบบ Theme
  const { theme: activeTheme, resolvedTheme } = useTheme();
  const currentTheme = activeTheme === 'system' ? resolvedTheme : activeTheme;
  const isDark = currentTheme === 'dark';
  const isHacker = currentTheme === 'hacker';

  // 🌟 ฟังก์ชันคำนวณสีของแต่ละ Rank ตาม Theme ปัจจุบัน
  const getRankTheme = (rank: any) => {
    if (isHacker) {
      return {
        color: "text-green-400",
        hex: "#4ade80",
        bg: "bg-green-900/20",
        shadow: rank.id === 7 ? "shadow-[0_10px_30px_rgba(34,197,94,0.3)]" : "shadow-sm"
      };
    }
    if (isDark) {
      const darkMap: any = {
        1: { color: 'text-slate-300', hex: '#cbd5e1', bg: 'bg-slate-800/50' },
        2: { color: 'text-green-400', hex: '#4ade80', bg: 'bg-green-900/30' },
        3: { color: 'text-yellow-400', hex: '#facc15', bg: 'bg-yellow-900/30' },
        4: { color: 'text-blue-400', hex: '#60a5fa', bg: 'bg-blue-900/30' },
        5: { color: 'text-purple-400', hex: '#c084fc', bg: 'bg-purple-900/30' },
        6: { color: 'text-pink-400', hex: '#f472b6', bg: 'bg-pink-900/30' },
        7: { color: 'text-rose-400', hex: '#fb7185', bg: 'bg-rose-900/30' },
      };
      return { ...darkMap[rank.id], shadow: rank.id === 7 ? "shadow-[0_10px_30px_rgba(251,113,133,0.3)]" : "shadow-sm" };
    }
    return { color: rank.color, hex: rank.hex, bg: rank.bg, shadow: rank.shadow };
  };

  useEffect(() => {
    const fetchUserProgress = async () => {
      try {
        // หน้านี้ดูได้แม้ไม่ login — เจอ 401 แค่ไม่แสดงข้อมูล user (ไม่ต้องเด้งไปหน้า login)
        const res = await apiFetch('/api/user/progress', {}, { redirectOn401: false });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            setUser(data.data);
          }
        }
      } catch (err) {
        console.warn("Offline mode");
      }
      setTimeout(() => setLoading(false), 500);
    };
    fetchUserProgress();
  }, []);

  if (loading) return <HackerLoadingScreen />;

  const totalExp = user ? (user.linuxExp || 0) + (user.windowsExp || 0) : 0;

  let currentRank = RANKS[0];
  let nextRank = RANKS[1];
  let activeIndex = 0;

  for (let i = 0; i < RANKS.length; i++) {
    if (totalExp >= RANKS[i].minExp) {
      currentRank = RANKS[i];
      nextRank = RANKS[i + 1] || null;
      activeIndex = i;
    }
  }

  const currentRankDetails = getRankTheme(currentRank);
  const nextRankDetails = nextRank ? getRankTheme(nextRank) : null;

  let progressPercent = 100;
  if (nextRank) {
    const expNeededForNext = nextRank.minExp - currentRank.minExp;
    const expEarnedInCurrent = totalExp - currentRank.minExp;
    progressPercent = Math.min(100, Math.max(0, (expEarnedInCurrent / expNeededForNext) * 100));
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 200, damping: 20 } }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans font-black flex flex-col selection:bg-orange-500/20 dark:selection:bg-yellow-400/20 hacker:selection:bg-green-500/20 relative overflow-x-hidden transition-colors duration-500">

      <Navbar theme="linux" />

      {/* 🌸 สไตล์ 3D แบบครบวงจร 🌸 */}
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
          transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-squishy:hover { transform: scale(1.05) translateY(-4px); }
        .btn-squishy:active { transform: scale(0.95) translateY(0); box-shadow: none !important; }

        .cute-header {
          text-shadow: 2px 2px 0px rgba(255, 255, 255, 1), 
                       -1px -1px 0px rgba(255, 255, 255, 1), 
                       1px -1px 0px rgba(255, 255, 255, 1), 
                       -1px 1px 0px rgba(255, 255, 255, 1);
          letter-spacing: -0.02em;
        }

        .dark .cute-header { text-shadow: 2px 2px 0px rgba(0, 0, 0, 0.3); }
        .hacker .cute-header { text-shadow: 2px 2px 0px rgba(0, 0, 0, 0.8); }
      `}</style>

      {/* 🎈 Background Blobs เปลี่ยนตามธีม 🎈 */}
      <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-400 dark:bg-yellow-500 hacker:bg-green-600 rounded-full blur-[100px] opacity-20 dark:opacity-10 hacker:opacity-10 float-element pointer-events-none z-0 transition-colors duration-500" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-amber-400 dark:bg-yellow-600 hacker:bg-green-700 rounded-full blur-[100px] opacity-20 dark:opacity-10 hacker:opacity-10 float-delayed pointer-events-none z-0 transition-colors duration-500" style={{ animationDelay: '1.5s' }} />

      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8 relative z-20 flex flex-col items-center pt-8 md:pt-12 pb-24">

        <header className="text-center mb-12 relative w-full">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white dark:bg-[#2D223B] hacker:bg-[#0a0a0a] border-4 border-white dark:border-[#4B3965] hacker:border-green-800 text-orange-500 dark:text-yellow-400 hacker:text-green-500 text-sm font-black mb-6 shadow-sm transition-colors duration-500">
              <ShieldCheck size={18} strokeWidth={3} />
              Rank System
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-orange-950 dark:text-white hacker:text-white tracking-tighter mb-4 uppercase leading-none cute-header transition-colors duration-500">
              YOUR <span className="text-orange-500 dark:text-yellow-400 hacker:text-green-500">RANK</span>
            </h1>
          </motion.div>
        </header>

        <motion.div variants={containerVariants} initial="hidden" animate="show" className="w-full">
          {/* ===================================================================== */}
          {/* 🌟 Player Progress Card 🌟 */}
          {/* ===================================================================== */}
          {user ? (
            <motion.div variants={itemVariants} className="w-full glass-card p-8 md:p-12 mb-20 relative overflow-hidden group">

              <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-[100px] opacity-30 pointer-events-none transition-colors duration-500" style={{ backgroundColor: currentRankDetails.hex }}></div>

              <div className="flex flex-col md:flex-row items-center justify-between gap-10 relative z-30">

                <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 text-center md:text-left w-full md:w-auto">
                  <div className={`w-28 h-28 md:w-32 md:h-32 rounded-[32px] flex-shrink-0 flex items-center justify-center border-4 bg-white dark:bg-[#1E1B2E] hacker:bg-[#0a0a0a] border-white dark:border-[#382E54] hacker:border-[#166534] ${currentRankDetails.shadow} relative transition-transform duration-500 hover:scale-105 hover:-rotate-3`}>
                    <div className="absolute inset-0 rounded-[28px] opacity-20 pointer-events-none transition-colors duration-500" style={{ backgroundColor: currentRankDetails.hex }}></div>
                    <div className={`${currentRankDetails.color} transition-colors duration-500`}>
                      {getIcon(currentRank.icon, 64)}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-black text-orange-400 dark:text-white/50 hacker:text-green-500/60 uppercase tracking-widest mb-2 flex items-center justify-center md:justify-start gap-2 transition-colors duration-500">
                      <span className="w-2.5 h-2.5 rounded-full animate-pulse shadow-sm border border-white dark:border-transparent hacker:border-transparent transition-colors duration-500" style={{ backgroundColor: currentRankDetails.hex }}></span> ACTIVE CLEARANCE
                    </p>
                    <h2 className={`text-4xl md:text-5xl font-black uppercase tracking-tighter ${currentRankDetails.color} cute-header transition-colors duration-500`}>{currentRank.title}</h2>
                  </div>
                </div>

                <div className="text-center md:text-right w-full md:w-auto">
                  <p className="text-xs font-black text-orange-400 dark:text-white/50 hacker:text-green-500/60 uppercase tracking-widest mb-3 transition-colors duration-500">TOTAL EXPERIENCE</p>
                  <div className={`text-6xl md:text-7xl font-black tracking-tighter leading-none mb-1 cute-header ${currentRankDetails.color} transition-colors duration-500`}>
                    {totalExp.toLocaleString()}
                  </div>
                  <p className="text-xs text-orange-500 dark:text-yellow-500 hacker:text-green-600 font-black tracking-widest uppercase mt-2 transition-colors duration-500">Data Points Acquired</p>
                </div>
              </div>

              <div className="relative pt-10 z-30">
                <div className="flex justify-between items-end mb-3">
                  <div>
                    <span className="text-xs font-black uppercase tracking-widest text-orange-600 dark:text-yellow-400 hacker:text-green-500 transition-colors duration-500">PROGRESS TO NEXT TIER</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-orange-950 dark:text-white hacker:text-white font-black tracking-widest transition-colors duration-500">
                      {currentRank.minExp.toLocaleString()} XP / <span className={nextRankDetails ? nextRankDetails.color : 'text-orange-400 dark:text-white/50 hacker:text-green-600/50'}>{nextRank ? `${nextRank.minExp.toLocaleString()} XP` : 'MAX'}</span>
                    </span>
                  </div>
                </div>

                <div className="w-full h-5 rounded-full bg-white dark:bg-[#382E54] hacker:bg-[#111] border-4 border-white dark:border-[#4B3965] hacker:border-[#166534] overflow-hidden relative shadow-sm transition-colors duration-500">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                    className="h-full rounded-full relative transition-colors duration-500"
                    style={{ backgroundColor: currentRankDetails.hex }}
                  />
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="text-center mb-20 glass-card py-16 rounded-[40px] relative overflow-hidden">
              <Lock size={64} strokeWidth={2.5} className="text-orange-300 dark:text-white/30 hacker:text-green-800 mx-auto mb-6 transition-colors" />
              <p className="text-orange-500 dark:text-yellow-400 hacker:text-green-500 font-black text-sm uppercase tracking-widest transition-colors">กรุณาเข้าสู่ระบบ</p>
              <button onClick={() => router.push('/login')} className="mt-8 px-10 py-4 bg-orange-500 dark:bg-yellow-400 hacker:bg-green-600 text-white dark:text-[#1E1B2E] hacker:text-[#0a0a0a] font-black text-sm uppercase tracking-widest border-4 border-white dark:border-yellow-500 hacker:border-green-500 rounded-[24px] hover:bg-orange-400 dark:hover:bg-yellow-300 hacker:hover:bg-green-500 transition-all shadow-[0_8px_0_rgba(249,115,22,0.2)] dark:shadow-[0_8px_0_rgba(250,204,21,0.2)] hacker:shadow-[0_8px_0_rgba(34,197,94,0.2)] btn-squishy">
                เข้าสู่ระบบเพื่อดูแรงค์ของคุณ
              </button>
            </div>
          )}

          {/* ===================================================================== */}
          {/* 🌟 2. จัด Timeline ให้อยู่ตรงกลางเส้นเป๊ะๆ 🌟 */}
          {/* ===================================================================== */}
          <div className="w-full relative z-30">

            {/* เส้นบอกทาง (Line) */}
            <div className="absolute top-0 bottom-0 left-[32px] md:left-[80px] w-2 bg-white dark:bg-[#382E54] hacker:bg-[#111] rounded-full overflow-hidden -translate-x-1/2 z-0 shadow-sm border-2 border-orange-50 dark:border-[#1E1B2E] hacker:border-[#0a0a0a] transition-colors duration-500">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(activeIndex / (RANKS.length - 1)) * 100}%` }}
                transition={{ duration: 2, ease: "easeInOut" }}
                className="w-full bg-orange-500 dark:bg-yellow-400 hacker:bg-green-500 shadow-sm rounded-full transition-colors duration-500"
              />
            </div>

            {/* คอนเทนเนอร์เว้นระยะเผื่อเส้น */}
            <div className="space-y-8 md:space-y-12 pl-[64px] md:pl-[160px]">
              {RANKS.map((rank, index) => {
                const isUnlocked = totalExp >= rank.minExp;
                const isCurrent = user && currentRank.id === rank.id;
                const rTheme = getRankTheme(rank); // ดึงสีปัจจุบันของแต่ละยศ

                return (
                  <motion.div
                    key={rank.id}
                    variants={itemVariants}
                    className={`relative p-6 md:p-8 rounded-[32px] border-4 transition-all duration-500 flex flex-col md:flex-row items-center gap-6 md:gap-8 group overflow-visible
                      ${isCurrent
                        ? `bg-white/95 dark:bg-[#2D223B]/95 hacker:bg-[#111]/95 border-white dark:border-yellow-400 hacker:border-green-500 shadow-[0_15px_30px_rgba(249,115,22,0.15)] dark:shadow-[0_15px_30px_rgba(0,0,0,0.3)] hacker:shadow-[0_15px_30px_rgba(34,197,94,0.1)] scale-[1.02] z-10`
                        : 'bg-white/60 dark:bg-[#1E1B2E]/60 hacker:bg-[#0a0a0a]/60 border-white dark:border-[#382E54] hacker:border-green-900 hover:border-orange-200 dark:hover:border-yellow-500/50 hacker:hover:border-green-600'}
                      ${!isUnlocked && user ? 'opacity-60 grayscale hover:grayscale-0 transition-all' : ''}
                    `}
                  >
                    {/* 🌟 จุดเชื่อม Timeline (Dot) 🌟 */}
                    <div className={`absolute top-1/2 left-[-32px] md:left-[-80px] -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-4 flex items-center justify-center transition-colors duration-500 z-20 ${isCurrent ? 'shadow-md scale-110' : 'shadow-sm'} 
                      ${isUnlocked ? (isHacker ? 'bg-[#0a0a0a]' : isDark ? 'bg-[#1E1B2E]' : 'bg-white') : (isHacker ? 'bg-[#111]' : isDark ? 'bg-[#2D223B]' : 'bg-orange-50')}`}
                      style={{ borderColor: isUnlocked ? rTheme.hex : (isHacker ? '#166534' : isDark ? '#382E54' : 'white') }}
                    >
                      {isCurrent && <div className="w-3 h-3 rounded-full animate-pulse transition-colors duration-500" style={{ backgroundColor: rTheme.hex }}></div>}
                    </div>

                    <div className="flex-shrink-0 flex items-center gap-6 w-full md:w-auto relative z-10">
                      <div className={`w-20 h-20 md:w-24 md:h-24 rounded-[24px] flex items-center justify-center border-4 border-white dark:border-[#382E54] hacker:border-green-800 shadow-sm transition-all duration-500 ${isCurrent ? 'scale-110' : 'group-hover:scale-105'} ${isUnlocked ? rTheme.bg : 'bg-orange-50 dark:bg-[#2D223B] hacker:bg-[#111]'}`}>
                        <div className={`${rTheme.color} transition-colors duration-500`}>
                          {getIcon(rank.icon, 36)}
                        </div>
                      </div>
                      <div className="flex-1 md:w-52">
                        <p className="text-[10px] font-black text-orange-400 dark:text-white/50 hacker:text-green-600 uppercase tracking-widest mb-1 transition-colors">TIER {rank.id}</p>
                        <h3 className={`text-xl md:text-2xl font-black uppercase tracking-tighter cute-header ${rTheme.color} transition-colors`}>{rank.title}</h3>
                      </div>
                    </div>

                    <div className="flex-1 relative z-10 w-full">
                      <p className="text-xs md:text-sm text-orange-950/70 dark:text-white/60 hacker:text-white/60 font-bold leading-relaxed line-clamp-2 md:line-clamp-none transition-colors">
                        {rank.desc}
                      </p>
                    </div>

                    <div className="flex-shrink-0 text-left md:text-right w-full md:w-auto mt-4 md:mt-0 relative z-10">
                      <p className="text-[10px] font-black text-orange-400 dark:text-white/50 hacker:text-green-600 uppercase tracking-widest mb-1 transition-colors">REQ. EXP</p>
                      <p className="text-xl md:text-2xl font-black text-orange-600 dark:text-yellow-400 hacker:text-green-400 tracking-tighter cute-header transition-colors">
                        {rank.minExp === 0 ? "0" : `${rank.minExp.toLocaleString()}`} <span className="text-[10px] text-orange-400 dark:text-white/40 hacker:text-green-600/60 uppercase tracking-widest ml-1 transition-colors">XP</span>
                      </p>
                    </div>

                    {/* กุญแจ / ติ๊กถูก */}
                    <div className="absolute top-6 right-6 transition-colors">
                      {!isUnlocked && user && <Lock size={20} strokeWidth={3} className="text-orange-300 dark:text-white/30 hacker:text-green-800" />}
                      {isUnlocked && !isCurrent && <CheckCircle size={24} strokeWidth={3} className={`${rTheme.color} opacity-50 transition-colors`} />}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

        </motion.div>
      </main>

      <footer className="py-8 text-center text-orange-400 dark:text-white/30 hacker:text-green-600/50 font-black text-xs uppercase tracking-widest relative z-10 border-t-4 border-white dark:border-[#382E54] hacker:border-green-900 bg-white/40 dark:bg-[#1E1B2E]/70 hacker:bg-[#0a0a0a]/80 backdrop-blur-md transition-colors duration-500">
        © 2026 KeyRush
      </footer>
    </div>
  );
}