"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { Terminal, Monitor, Globe, Trophy, AlertCircle, Crown, Sparkles, Zap, Users, Medal, ChevronDown, Check } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { apiFetch } from '@/lib/api';
import { getRankByExp } from '@/lib/ranks';

export default function LeaderboardPage() {
  const router = useRouter();

  // 🌟 ระบบ Theme
  const { theme: activeTheme, resolvedTheme } = useTheme();
  const currentTheme = activeTheme === 'system' ? resolvedTheme : activeTheme;
  const isDark = currentTheme === 'dark';
  const isHacker = currentTheme === 'hacker' || currentTheme === 'dragon'; const isDragon = currentTheme === 'dragon';

  const [user, setUser] = useState<any>(null);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetOs, setTargetOs] = useState<'linux' | 'windows' | 'combined'>('combined');
  // 📂 dropdown เลือกหมวด (Total/Linux/Windows) — ประหยัดพื้นที่กว่าแถบ Tab เต็มแถว
  const [osMenuOpen, setOsMenuOpen] = useState(false);

  // 🛡️ กัน hydration mismatch: สี/สไตล์หลายจุดคำนวณจาก useTheme() ใน JS
  // ตอน SSR server ไม่รู้ธีมของผู้ใช้ → ต้องรอ mount ฝั่ง client ก่อนค่อย render ของจริง
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const fetchUserAndLeaderboard = async () => {
      // เช็คสถานะ login + ดึงข้อมูล user สดจาก backend (401 → apiFetch พาไปหน้า login ให้)
      try {
        const res = await apiFetch('/api/user/progress');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) setUser(data.data);
        }
      } catch (e) {
        console.error("Auth check failed", e);
      }

      // ใช้ key เฉพาะของหน้านี้ (ไม่ปนกับ keyrush_target_os ที่หน้าเล่นเกมใช้ ซึ่งรับได้แค่ linux/windows)
      const saved = localStorage.getItem('keyrush_leaderboard_os');
      const savedOs: 'linux' | 'windows' | 'combined' =
        saved === 'linux' || saved === 'windows' ? saved : 'combined';
      setTargetOs(savedOs);
      await loadLeaderboard(savedOs);
    };

    fetchUserAndLeaderboard();
  }, [router]);

  const loadLeaderboard = async (os: 'linux' | 'windows' | 'combined') => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/leaderboard/${os}`);

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Backend ไม่ได้ส่ง JSON กลับมา!");
        setLeaderboardData([]);
        return;
      }

      const data = await res.json();
      if (data.success) {
        setLeaderboardData(data.data);
      }
    } catch (error) {
      console.error("Leaderboard fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOsChange = (os: 'linux' | 'windows' | 'combined') => {
    setTargetOs(os);
    localStorage.setItem('keyrush_leaderboard_os', os);
    loadLeaderboard(os);
  };

  const getAvatarUrl = (avatarStr?: string) => {
    if (!avatarStr) return 'https://api.dicebear.com/7.x/bottts/svg?seed=Felix&radius=50';
    return avatarStr.startsWith('data:')
      ? avatarStr
      : `https://api.dicebear.com/7.x/bottts/svg?seed=${avatarStr}&radius=50`;
  };

  const getPlayerExp = (player: any) => {
    if (!player) return 0;
    if (targetOs === 'combined') return (player.linuxExp || 0) + (player.windowsExp || 0);
    return targetOs === 'linux' ? (player.linuxExp || 0) : (player.windowsExp || 0);
  };

  const getPlayerLevel = (player: any) => {
    if (!player) return 1;
    if (targetOs === 'combined') return (player.linuxLevel || 1) + (player.windowsLevel || 1);
    return targetOs === 'linux' ? (player.linuxLevel || 1) : (player.windowsLevel || 1);
  };

  const getPlayerName = (player: any) => player?.displayName || player?.username?.split('@')[0] || '???';
  const getProfileUrl = (player: any) => `/u/${getPlayerName(player)}`;

  // 🌟 แรงค์ใช้ตารางกลาง lib/ranks.ts (คิดจาก EXP) — ตรงกับ Dashboard/Ranks/Docs
  // สีประจำแรงค์แต่ละขั้น รองรับทุกธีม
  const RANK_COLORS: Record<number, string> = {
    1: 'text-slate-400 dark:text-slate-300 hacker:text-green-700',
    2: 'text-amber-800 dark:text-amber-500 hacker:text-green-600',
    3: 'text-amber-500 dark:text-yellow-400 hacker:text-green-500',
    4: 'text-blue-500 dark:text-blue-400 hacker:text-green-400',
    5: 'text-purple-500 dark:text-purple-400 hacker:text-green-400',
    6: 'text-pink-500 dark:text-pink-400 hacker:text-green-300',
    7: 'text-rose-500 dark:text-rose-400 hacker:text-green-200',
    8: 'text-emerald-600 dark:text-emerald-400 hacker:text-green-300', // 💚 Keyrush Master
  };
  const getRankDetails = (exp: number) => {
    const r = getRankByExp(exp);
    return { title: r.title, color: RANK_COLORS[r.id] || RANK_COLORS[1] };
  };

  // 🏅 สีเหรียญอันดับ 1-3 (รองรับทุกธีม)
  const medalStyles = [
    isHacker
      ? { ring: 'border-green-400', badge: 'bg-green-400 text-[#0a0a0a]', glow: 'bg-green-500/25', num: 'text-green-300' }
      : { ring: 'border-yellow-400', badge: 'bg-yellow-400 text-yellow-950', glow: 'bg-yellow-400/30', num: 'text-yellow-500' },
    isHacker
      ? { ring: 'border-green-600', badge: 'bg-green-700 text-green-100', glow: 'bg-green-600/15', num: 'text-green-500' }
      : { ring: 'border-slate-300 dark:border-slate-400', badge: 'bg-slate-300 text-slate-700', glow: 'bg-slate-300/25', num: 'text-slate-400' },
    isHacker
      ? { ring: 'border-green-800', badge: 'bg-green-900 text-green-300', glow: 'bg-green-800/15', num: 'text-green-700' }
      : { ring: 'border-orange-300', badge: 'bg-orange-300 text-orange-900', glow: 'bg-orange-300/25', num: 'text-orange-400' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  // 🌟 สไตล์สำหรับโหมดต่างๆ และการรองรับ Theme (Cute/Dark/Hacker)
  const styles = {
    selection: targetOs === 'linux' ? 'selection:bg-orange-500/20' : targetOs === 'windows' ? 'selection:bg-blue-500/20' : 'selection:bg-pink-500/20',

    // โทนสีหลัก
    textMain: isHacker ? 'text-green-500' : isDark ? 'text-yellow-400' : (targetOs === 'linux' ? 'text-orange-500' : targetOs === 'windows' ? 'text-blue-500' : 'text-pink-500'),
    bgMain: isHacker ? 'bg-green-500' : isDark ? 'bg-yellow-400' : (targetOs === 'linux' ? 'bg-orange-500' : targetOs === 'windows' ? 'bg-blue-500' : 'bg-pink-500'),
    bgLight: isHacker ? 'bg-green-900/30' : isDark ? 'bg-white/10' : (targetOs === 'linux' ? 'bg-orange-100' : targetOs === 'windows' ? 'bg-blue-100' : 'bg-pink-100'),

    // ตาราง
    tableBorder: isHacker ? 'border-green-800 shadow-[0_10px_40px_rgba(34,197,94,0.2)]' : isDark ? 'border-[#382E54] shadow-[0_10px_40px_rgba(0,0,0,0.35)]' : 'border-white shadow-[0_10px_40px_rgba(249,115,22,0.12)]',
    tableHeader: isHacker ? 'bg-green-900/40 border-green-800 text-green-500' : isDark ? 'bg-black/20 border-[#382E54] text-yellow-500' : (targetOs === 'linux' ? 'bg-orange-100 border-white text-orange-600' : targetOs === 'windows' ? 'bg-blue-100 border-white text-blue-600' : 'bg-pink-100 border-white text-pink-600'),
    tableRowHover: isHacker ? 'hover:bg-green-900/20 border-[#166534]' : isDark ? 'hover:bg-white/5 border-[#382E54]' : (targetOs === 'linux' ? 'hover:bg-orange-50/80 border-white' : targetOs === 'windows' ? 'hover:bg-blue-50/80 border-white' : 'hover:bg-pink-50/80 border-white'),
    tableRowMe: isHacker ? 'bg-green-900/30 border-l-8 border-l-green-500 shadow-sm border-[#166534]' : isDark ? 'bg-[#2D223B] border-l-8 border-l-yellow-400 shadow-sm border-[#382E54]' : (targetOs === 'linux' ? 'bg-orange-50 border-l-8 border-l-orange-500 shadow-sm border-white' : targetOs === 'windows' ? 'bg-blue-50 border-l-8 border-l-blue-500 shadow-sm border-white' : 'bg-pink-50 border-l-8 border-l-pink-500 shadow-sm border-white'),

    // สีปุ่ม Tab
    tabIdleText: isHacker ? 'text-green-700 hover:text-green-400' : isDark ? 'text-white/40 hover:text-yellow-400' : 'text-orange-400 hover:text-orange-600',
    tabIdleBg: isHacker ? 'bg-[#0a0a0a] border-green-900 hover:bg-[#111] hover:border-green-600 shadow-[0_4px_0_#14532d]' : isDark ? 'bg-[#1E1B2E] border-[#382E54] hover:bg-[#2D223B] hover:border-[#4B3965] shadow-[0_4px_0_#0a0a0a]' : 'bg-white border-orange-200 hover:bg-orange-50 hover:border-orange-300 shadow-[0_4px_0_#fed7aa]',
    tabActiveText: isHacker ? 'text-[#0a0a0a]' : isDark ? 'text-[#1E1B2E]' : 'text-white',
    tabActiveBg: isHacker ? 'bg-green-500 border-green-400 shadow-[0_4px_0_#16a34a]' : isDark ? 'bg-yellow-400 border-yellow-300 shadow-[0_4px_0_#ca8a04]' : (targetOs === 'linux' ? 'bg-orange-500 border-orange-400 shadow-[0_4px_0_#c2410c]' : targetOs === 'windows' ? 'bg-blue-500 border-blue-400 shadow-[0_4px_0_#1d4ed8]' : 'bg-pink-500 border-pink-400 shadow-[0_4px_0_#be185d]')
  };

  // 🏆 EXP ของแชมป์ ไว้คิดแถบเทียบสัดส่วนในตาราง
  const topExp = leaderboardData.length > 0 ? Math.max(1, getPlayerExp(leaderboardData[0])) : 1;
  // ตำแหน่งของเราในตาราง (ไว้โชว์การ์ด "อันดับของคุณ")
  const myIndex = user ? leaderboardData.findIndex((p) => p.id === user.id) : -1;

  // 🥇🥈🥉 การ์ดบนแท่น Podium (ลำดับแสดงผล: 2, 1, 3)
  const renderPodium = (player: any, rank: 1 | 2 | 3) => {
    if (!player) return null;
    const medal = medalStyles[rank - 1];
    const isChampion = rank === 1;
    const name = getPlayerName(player);
    const rankDetails = getRankDetails(getPlayerExp(player));

    const baseHeights = isChampion ? 'h-32 sm:h-36 md:h-44' : rank === 2 ? 'h-24 sm:h-28 md:h-32' : 'h-20 sm:h-24 md:h-28';
    const width = isChampion ? 'w-32 sm:w-40 md:w-52' : 'w-24 sm:w-32 md:w-40';
    const avatarSize = isChampion ? 'w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28' : 'w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20';

    return (
      <motion.div
        initial={{ opacity: 0, y: 50, scale: isChampion ? 0.8 : 1 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: isChampion ? 0 : rank === 2 ? 0.2 : 0.35, type: "spring", bounce: isChampion ? 0.5 : 0.3 }}
        className={`flex flex-col items-center ${width} relative group ${isChampion ? 'z-20' : ''}`}
      >
        {/* ✨ Glow ด้านหลัง */}
        <div className={`absolute top-8 w-[140%] h-[140%] blur-3xl rounded-full pointer-events-none transition-all duration-500 ${medal.glow} ${isChampion ? 'group-hover:scale-125' : 'opacity-60'}`} />

        <motion.div
          animate={{ y: [0, isChampion ? -8 : -4, 0] }}
          transition={{ repeat: Infinity, duration: isChampion ? 3 : 4 + rank * 0.5, ease: "easeInOut", delay: rank * 0.4 }}
          className="flex flex-col items-center z-10 w-full"
        >
          {/* 👑 มงกุฎเฉพาะแชมป์ */}
          {isChampion && (
            <motion.div animate={{ rotate: [-6, 6, -6] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}>
              <Crown size={36} strokeWidth={2.5} className={`mb-1 drop-shadow-md ${isHacker ? 'text-green-400 fill-green-900' : 'text-yellow-400 fill-yellow-200 dark:fill-yellow-500/40'}`} />
            </motion.div>
          )}

          <Link href={getProfileUrl(player)}>
            <div className="relative mb-2 md:mb-3 group-hover:scale-110 transition-transform duration-300 cursor-pointer">
              {/* วงแหวนหมุนรอบแชมป์ */}
              {isChampion && (
                <div className={`absolute -inset-2 rounded-full border-4 border-dashed animate-[spin_10s_linear_infinite] ${isHacker ? 'border-green-500/60' : 'border-yellow-400/70'}`} />
              )}
              <div className={`${avatarSize} flex-shrink-0 rounded-full border-4 ${medal.ring} bg-white shadow-md flex items-center justify-center p-[3px] overflow-hidden relative`}>
                <img src={getAvatarUrl(player.avatar)} alt={`Rank ${rank}`} className="w-full h-full object-cover rounded-full" />
              </div>
              <div className={`absolute -bottom-2 -right-2 w-7 h-7 md:w-8 md:h-8 ${medal.badge} rounded-full flex items-center justify-center text-xs md:text-sm font-black border-2 border-white dark:border-[#382E54] hacker:border-[#0a0a0a] shadow-md z-10`}>
                {rank}
              </div>
            </div>
          </Link>

          <Link href={getProfileUrl(player)} className={`font-black truncate w-full text-center hover:underline cursor-pointer transition-colors ${isChampion ? 'text-sm sm:text-base md:text-lg' : 'text-xs sm:text-sm'} text-orange-950 dark:text-white hacker:text-green-400`}>
            {name}
          </Link>
          <p className={`text-[9px] md:text-[10px] uppercase tracking-widest mt-0.5 font-black ${rankDetails.color}`}>
            {rankDetails.title}
          </p>
          <p className={`${isChampion
            ? (isHacker ? 'text-green-400 bg-green-900/30 border-green-700' : 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-400/10 border-white dark:border-yellow-500')
            : `${styles.textMain} bg-white dark:bg-[#1E1B2E] hacker:bg-[#0a0a0a] border-white dark:border-[#382E54] hacker:border-green-800`}
            text-[10px] sm:text-xs ${isChampion ? 'md:text-sm px-3 md:px-4 py-1 md:py-1.5' : 'px-2.5 py-1'} font-black mt-1 rounded-xl md:rounded-[14px] border-2 shadow-sm transition-colors whitespace-nowrap flex items-center gap-1`}>
            <Zap size={11} className="fill-current shrink-0" /> {getPlayerExp(player).toLocaleString()} EXP
          </p>
        </motion.div>

        {/* 🏛️ แท่นยืน — มีเลขอันดับจางๆ อยู่ในแท่น */}
        <div className={`w-full ${baseHeights} rounded-t-[20px] md:rounded-t-[28px] mt-3 md:mt-4 border-4 border-b-0 relative overflow-hidden shadow-md backdrop-blur-md transition-colors
          ${isChampion
            ? 'bg-white dark:bg-[#382E54] hacker:bg-[#0a0a0a] border-white dark:border-[#4B3965] hacker:border-green-600'
            : 'bg-white/70 dark:bg-[#2D223B]/70 hacker:bg-[#111]/70 border-white dark:border-[#382E54] hacker:border-green-800'}`}
        >
          <span className={`absolute inset-x-0 top-1 md:top-2 text-center text-4xl md:text-6xl font-black opacity-25 select-none ${medal.num}`}>{rank}</span>
          <div className={`absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t to-transparent ${isHacker ? 'from-green-500/15' : isDark ? 'from-yellow-400/10' : 'from-orange-200/50'}`} />
          {isChampion && (
            <div className="absolute inset-0 opacity-40 [background:repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.08)_10px,rgba(255,255,255,0.08)_20px)]" />
          )}
        </div>
      </motion.div>
    );
  };

  // ⏳ ยังไม่ mount = ยังไม่รู้ธีมจริงของผู้ใช้ → โชว์พื้นเปล่าธีมกลางไปก่อน กัน hydration mismatch
  if (!mounted) {
    return <div className="bg-background min-h-screen" />;
  }

  return (
    <div className={`bg-background font-sans font-black min-h-screen flex flex-col overflow-x-hidden text-foreground relative transition-colors duration-500 ${styles.selection}`}>

      {/* 🌸 สไตล์ 3D และ Animation 🌸 */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(2deg); }
        }
        .float-element { animation: float 6s ease-in-out infinite; }
        .float-delayed { animation: float 7s ease-in-out infinite 1.5s; }

        @keyframes sparkle-pop {
          0%, 100% { transform: scale(0.6); opacity: 0.3; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        .sparkle { animation: sparkle-pop 2.4s ease-in-out infinite; }

        .glass-card {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(16px);
          border: 4px solid white;
          border-radius: 32px;
          transition: all 0.3s ease;
        }

        .dark .glass-card {
          background: rgba(45, 34, 59, 0.7);
          border-color: #382E54;
        }

        .hacker .glass-card {
          background: rgba(10, 10, 10, 0.85);
          border-color: #166534;
        }

        .btn-squishy {
          transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-squishy:hover { transform: translateY(-2px); }
        .btn-squishy:active { transform: translateY(4px); box-shadow: 0 0 0 transparent !important; }

        .cute-header {
          text-shadow: 2px 2px 0px rgba(255, 255, 255, 1), -1px -1px 0px rgba(255, 255, 255, 1), 1px -1px 0px rgba(255, 255, 255, 1), -1px 1px 0px rgba(255, 255, 255, 1);
          letter-spacing: -0.02em;
        }

        .dark .cute-header { text-shadow: 2px 2px 0px rgba(0, 0, 0, 0.4); }
        .hacker .cute-header { text-shadow: 2px 2px 0px rgba(0, 0, 0, 0.8); }
      `}</style>

      {/* 🎈 Background Blobs เปลี่ยนตามธีม 🎈 */}
      <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-400 dark:bg-yellow-500 hacker:bg-green-600 rounded-full blur-[100px] opacity-20 dark:opacity-10 hacker:opacity-10 float-element pointer-events-none z-0 transition-colors" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-amber-400 dark:bg-yellow-600 hacker:bg-green-700 rounded-full blur-[100px] opacity-20 dark:opacity-10 hacker:opacity-10 float-delayed pointer-events-none z-0 transition-colors" style={{ animationDelay: '1.5s' }} />
      <div className="fixed top-[30%] left-[15%] w-[250px] h-[250px] bg-pink-300 dark:bg-purple-700 hacker:bg-green-800 rounded-full blur-[90px] opacity-10 dark:opacity-10 hacker:opacity-5 float-element pointer-events-none z-0 transition-colors" />

      {/* ✨ ดาวประกายกระจายทั่วฉากหลัง ✨ */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
        {[
          { top: '18%', left: '8%', delay: '0s', size: 14 },
          { top: '28%', left: '88%', delay: '0.7s', size: 18 },
          { top: '55%', left: '5%', delay: '1.3s', size: 12 },
          { top: '70%', left: '92%', delay: '0.4s', size: 16 },
          { top: '12%', left: '55%', delay: '1.8s', size: 12 },
        ].map((s, i) => (
          <Sparkles
            key={i}
            size={s.size}
            style={{ top: s.top, left: s.left, animationDelay: s.delay, position: 'absolute' }}
            className="sparkle text-orange-300 dark:text-yellow-500/60 hacker:text-green-600/70 transition-colors"
          />
        ))}
      </div>

      <div className="relative z-50 shrink-0">
        <Navbar theme="linux" />
      </div>

      <div className="flex flex-1 w-full justify-center relative z-10 pt-4 md:pt-6 pb-16 md:pb-20">
        <div className="w-full max-w-5xl flex flex-col px-3 sm:px-4 md:px-8 gap-4 md:gap-6 relative z-10">

          {/* Header */}
          <div className="text-center animate-in fade-in slide-in-from-top-4 duration-700">
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 mb-2 rounded-2xl border-2 text-[10px] md:text-xs font-black uppercase tracking-widest shadow-sm transition-colors
              bg-white border-orange-100 text-orange-500 dark:bg-[#2D223B] dark:border-[#4B3965] dark:text-yellow-400 hacker:bg-[#111] hacker:border-green-900 hacker:text-green-500`}>
              <Trophy size={14} strokeWidth={3} /> Hall of Fame
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-orange-950 dark:text-white hacker:text-white tracking-tighter uppercase mb-1 md:mb-2 cute-header transition-colors">
              Global <span className={styles.textMain}>Rankings</span>
            </h1>

          </div>

          {loading ? (
            /* 💀 Skeleton Loading — โครงหน้าจำลองระหว่างรอข้อมูล (แถวบน + Podium + ตาราง) 💀 */
            <div className="w-full animate-in fade-in duration-300" aria-hidden>
              {/* แถวบน: การ์ดอันดับ + ปุ่มหมวด */}
              <div className="flex items-stretch gap-3 md:gap-4 mb-4 md:mb-6">
                <div className={`flex-1 rounded-[24px] border-4 px-3 md:px-6 py-2.5 md:py-3 flex items-center gap-2.5 md:gap-4 ${styles.tableBorder} bg-white/60 dark:bg-[#1E1B2E]/60 hacker:bg-[#0a0a0a]/60`}>
                  <div className={`w-11 h-11 md:w-13 md:h-13 shrink-0 rounded-2xl animate-pulse ${styles.bgLight}`} />
                  <div className={`hidden sm:block w-10 h-10 md:w-11 md:h-11 shrink-0 rounded-full animate-pulse ${styles.bgLight}`} />
                  <div className="flex-1 flex flex-col gap-2">
                    <div className={`h-2.5 w-20 rounded-full animate-pulse ${styles.bgLight}`} />
                    <div className={`h-3.5 w-32 rounded-full animate-pulse ${styles.bgLight}`} />
                  </div>
                  <div className={`hidden min-[420px]:block h-6 w-20 rounded-full animate-pulse ${styles.bgLight}`} />
                </div>
                <div className={`w-28 md:w-36 self-stretch rounded-[16px] md:rounded-[20px] border-4 animate-pulse ${styles.tableBorder} ${styles.bgLight}`} />
              </div>

              {/* Podium 3 แท่น (2-1-3) */}
              <div className="flex justify-center items-end gap-2 sm:gap-4 md:gap-8 mb-6 md:mb-10 px-1 md:px-2 mt-2 md:mt-4">
                {[
                  { w: 'w-24 sm:w-32 md:w-40', h: 'h-24 sm:h-28 md:h-32', av: 'w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20' },
                  { w: 'w-32 sm:w-40 md:w-52', h: 'h-32 sm:h-36 md:h-44', av: 'w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28' },
                  { w: 'w-24 sm:w-32 md:w-40', h: 'h-20 sm:h-24 md:h-28', av: 'w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20' },
                ].map((s, i) => (
                  <div key={i} className={`flex flex-col items-center gap-3 ${s.w}`}>
                    <div className={`${s.av} rounded-full animate-pulse ${styles.bgLight}`} />
                    <div className={`h-3 w-16 rounded-full animate-pulse ${styles.bgLight}`} />
                    <div className={`w-full ${s.h} rounded-t-[20px] animate-pulse ${styles.bgLight}`} />
                  </div>
                ))}
              </div>

              {/* ตารางรายชื่อ */}
              <div className={`glass-card overflow-hidden ${styles.tableBorder}`}>
                <div className={`px-3 md:px-8 py-4 md:py-5 border-b-4 ${styles.tableHeader}`}>
                  <div className={`h-3 w-40 rounded-full animate-pulse ${styles.bgLight}`} />
                </div>
                <div className={`divide-y-4 ${isHacker ? 'divide-green-900' : isDark ? 'divide-[#382E54]' : 'divide-white'}`}>
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 md:gap-5 px-3 md:px-8 py-3.5 md:py-4" style={{ opacity: 1 - i * 0.1 }}>
                      <div className={`w-8 h-8 md:w-9 md:h-9 shrink-0 rounded-xl animate-pulse ${styles.bgLight}`} />
                      <div className={`w-9 h-9 md:w-10 md:h-10 shrink-0 rounded-full animate-pulse ${styles.bgLight}`} />
                      <div className="flex-1 flex flex-col gap-2">
                        <div className={`h-3 rounded-full animate-pulse ${styles.bgLight}`} style={{ width: `${55 - i * 4}%` }} />
                        <div className={`h-2 rounded-full animate-pulse ${styles.bgLight}`} style={{ width: `${30 - i * 2}%` }} />
                      </div>
                      <div className={`h-4 w-16 md:w-20 shrink-0 rounded-full animate-pulse ${styles.bgLight}`} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div key={targetOs} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }} className="w-full">

          {/* 🌟 แถวบน: การ์ดอันดับของคุณ (ซ้าย) + Dropdown เลือกหมวด (ขวา) — โผล่พร้อมกันตอนโหลดเสร็จ 🌟 */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex items-stretch gap-3 md:gap-4 relative z-20 w-full mb-4 md:mb-6">

            {/* 📌 การ์ดอันดับของคุณ — กดแล้วไปหน้าตารางแรงค์ 📌 */}
            {user && myIndex >= 0 ? (
              <Link href="/ranks" title="ดูตารางแรงค์ทั้งหมด" className="block flex-1 min-w-0">
                <div className={`glass-card h-full flex items-center gap-2.5 md:gap-4 px-3 md:px-6 py-2.5 md:py-3 cursor-pointer hover:-translate-y-1 hover:shadow-md transition-all ${styles.tableBorder}`}>
                  <div className={`w-11 h-11 md:w-13 md:h-13 shrink-0 rounded-2xl flex flex-col items-center justify-center font-black shadow-sm ${styles.bgMain} ${isHacker || isDark ? 'text-[#1E1B2E]' : 'text-white'}`}>
                    <span className="text-[8px] uppercase tracking-widest opacity-80 leading-none mt-0.5">Rank</span>
                    <span className="text-base md:text-lg leading-tight">#{myIndex + 1}</span>
                  </div>
                  <div className="hidden sm:block w-10 h-10 md:w-11 md:h-11 shrink-0 rounded-full bg-white dark:bg-[#1E1B2E] hacker:bg-[#0a0a0a] border-4 border-white dark:border-[#382E54] hacker:border-[#166534] shadow-sm overflow-hidden p-0.5">
                    <img src={getAvatarUrl(user.avatar)} alt="me" className="w-full h-full object-cover rounded-full" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] md:text-[10px] uppercase tracking-widest opacity-50 font-black">อันดับของคุณ</p>
                    <p className={`font-black truncate text-sm md:text-base ${styles.textMain}`}>
                      {user.displayName || user.username?.split('@')[0]}
                    </p>
                    {user.title && (
                      <p className="truncate text-[10px] md:text-[11px] font-black text-orange-400 dark:text-purple-300 hacker:text-green-600 transition-colors">
                        ✦ {user.title}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0 hidden min-[420px]:block">
                    <p className="text-[9px] md:text-[10px] uppercase tracking-widest opacity-50 font-black">Total EXP</p>
                    <p className={`font-black text-sm md:text-lg cute-header ${styles.textMain} flex items-center justify-end gap-1`}>
                      <Zap size={13} className="fill-current" /> {getPlayerExp(leaderboardData[myIndex]).toLocaleString()}
                    </p>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="flex-1" />
            )}

            {/* 📂 Dropdown เลือกหมวด — แทนแถบ Tab เต็มแถว ประหยัดพื้นที่ 📂 */}
            <div className="relative shrink-0 self-center">
              <button
                onClick={() => setOsMenuOpen((v) => !v)}
                className={`flex items-center gap-1.5 md:gap-2 px-3.5 md:px-5 py-3 md:py-3.5 rounded-[16px] md:rounded-[20px] text-[10px] sm:text-xs md:text-sm font-black uppercase tracking-widest border-4 btn-squishy transition-all duration-300 ${styles.tabActiveBg} ${styles.tabActiveText}`}
              >
                {targetOs === 'linux' ? <Terminal size={16} strokeWidth={3} /> : targetOs === 'windows' ? <Monitor size={16} strokeWidth={3} /> : <Globe size={16} strokeWidth={3} />}
                <span>{targetOs === 'combined' ? 'Total' : targetOs.charAt(0).toUpperCase() + targetOs.slice(1)}</span>
                <ChevronDown size={16} strokeWidth={3} className={`transition-transform duration-300 ${osMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {osMenuOpen && (
                <>
                  {/* ฉากหลังโปร่งใส — กดที่ไหนก็ปิดเมนู */}
                  <div className="fixed inset-0 z-30" onClick={() => setOsMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 z-40 w-44 md:w-48 bg-white dark:bg-[#1E1B2E] hacker:bg-[#0a0a0a] border-4 border-orange-100 dark:border-[#382E54] hacker:border-[#166534] rounded-[20px] p-2 shadow-xl flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-200 transition-colors">
                    {(['combined', 'linux', 'windows'] as const).map((os) => {
                      const isActive = targetOs === os;
                      const icon = os === 'linux' ? <Terminal size={15} strokeWidth={3} /> : os === 'windows' ? <Monitor size={15} strokeWidth={3} /> : <Globe size={15} strokeWidth={3} />;
                      const label = os === 'combined' ? 'Total' : os.charAt(0).toUpperCase() + os.slice(1);
                      return (
                        <button
                          key={os}
                          onClick={() => { handleOsChange(os); setOsMenuOpen(false); }}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-[14px] text-[11px] md:text-xs font-black uppercase tracking-widest transition-colors ${isActive ? `${styles.tabActiveBg} ${styles.tabActiveText} border-2` : `${styles.tabIdleText} hover:bg-orange-50 dark:hover:bg-white/5 hacker:hover:bg-green-900/20`}`}
                        >
                          {icon}
                          <span className="flex-1 text-left">{label}</span>
                          {isActive && <Check size={14} strokeWidth={4} />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </motion.div>

                {/* 🌟 แท่น Podium Top 3 (ลำดับ 2-1-3) 🌟 */}
                {leaderboardData.length >= 3 && (
                  <div className="flex justify-center items-end gap-2 sm:gap-4 md:gap-8 mb-6 md:mb-10 px-1 md:px-2 mt-2 md:mt-4">
                    {renderPodium(leaderboardData[1], 2)}
                    {renderPodium(leaderboardData[0], 1)}
                    {renderPodium(leaderboardData[2], 3)}
                  </div>
                )}

                {/* 🌟 ตารางรายชื่อทั้งหมด 🌟 */}
                <div className={`glass-card overflow-hidden ${styles.tableBorder}`}>

                  <div className={`grid grid-cols-12 gap-2 md:gap-4 px-3 md:px-8 py-4 md:py-5 text-[10px] md:text-xs font-black uppercase tracking-widest border-b-4 ${styles.tableHeader}`}>
                    <div className="col-span-2 md:col-span-1 text-center">Rank</div>
                    <div className="col-span-6 md:col-span-6">Player</div>
                    <div className="col-span-2 text-center hidden md:block">Tier</div>
                    <div className="col-span-4 md:col-span-3 text-right">Total EXP</div>
                  </div>

                  <motion.div variants={containerVariants} initial="hidden" animate="show" className={`divide-y-4 ${isHacker ? 'divide-green-900' : isDark ? 'divide-[#382E54]' : 'divide-white'}`}>
                    {leaderboardData.map((player, index) => {
                      const isMe = user?.id === player.id;
                      const exp = getPlayerExp(player);
                      const level = getPlayerLevel(player);
                      const rankDetails = getRankDetails(exp);
                      const playerProfileUrl = getProfileUrl(player);
                      const expPct = Math.max(2, Math.round((exp / topExp) * 100));
                      const isTop3 = index < 3;

                      let rankColor = isHacker ? "text-green-700" : isDark ? "text-white/30" : "text-orange-300";
                      if (index === 0) rankColor = isHacker ? "text-green-400" : "text-yellow-500";
                      else if (index === 1) rankColor = isHacker ? "text-green-500" : "text-slate-400";
                      else if (index === 2) rankColor = isHacker ? "text-green-600" : "text-orange-500";

                      return (
                        <motion.div
                          key={player.id}
                          variants={itemVariants}
                          className={`grid grid-cols-12 gap-2 md:gap-4 px-3 md:px-8 py-4 md:py-5 items-center transition-all duration-300 group ${isMe ? styles.tableRowMe : styles.tableRowHover}`}
                        >
                          {/* อันดับ — Top 3 ได้เหรียญ */}
                          <div className="col-span-2 md:col-span-1 flex justify-center">
                            {isTop3 ? (
                              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shadow-sm border-2 border-white dark:border-[#382E54] hacker:border-[#0a0a0a] ${medalStyles[index].badge}`}>
                                <Medal size={16} strokeWidth={3} />
                              </div>
                            ) : (
                              <span className={`font-black text-lg md:text-2xl cute-header ${rankColor}`}>{index + 1}</span>
                            )}
                          </div>

                          <div className="col-span-6 md:col-span-6 flex items-center gap-2.5 md:gap-4 min-w-0">
                            <Link href={playerProfileUrl} className="flex-shrink-0 cursor-pointer">
                              <div className={`w-10 h-10 md:w-14 md:h-14 flex-shrink-0 rounded-full bg-white dark:bg-[#1E1B2E] hacker:bg-[#0a0a0a] border-4 border-white dark:border-[#382E54] hacker:border-[#166534] shadow-sm flex items-center justify-center overflow-hidden p-0.5 group-hover:scale-105 transition-transform ${isMe ? `ring-4 ${targetOs === 'linux' ? 'ring-orange-500' : targetOs === 'windows' ? 'ring-blue-500' : 'ring-pink-500'}` : ''}`}>
                                <img src={getAvatarUrl(player.avatar)} alt="avatar" className="w-full h-full object-cover rounded-full" />
                              </div>
                            </Link>

                            <div className="truncate min-w-0">
                              <p className={`font-black truncate text-xs sm:text-sm md:text-base tracking-wide flex items-center gap-1.5 md:gap-2 ${isMe ? styles.textMain : (isHacker ? 'text-green-500 group-hover:text-green-400' : isDark ? 'text-white group-hover:text-yellow-400' : 'text-orange-950 group-hover:text-orange-600')}`}>
                                <Link href={playerProfileUrl} className="truncate hover:underline cursor-pointer transition-all">
                                  {getPlayerName(player)}
                                </Link>
                                {isMe && <span className={`text-[9px] md:text-[10px] px-2 md:px-2.5 py-0.5 md:py-1 rounded-lg text-[#1E1B2E] font-black uppercase tracking-widest flex-shrink-0 ${styles.bgMain}`}>You</span>}
                              </p>
                              {/* 🏷️ ฉายาจากร้านค้า */}
                              {player.title && (
                                <span className="inline-block mt-0.5 text-[9px] md:text-[10px] font-black px-2 py-0.5 rounded-lg border-2 shadow-sm bg-orange-100 border-white text-orange-600 dark:bg-yellow-400/15 dark:border-[#4B3965] dark:text-yellow-300 hacker:bg-green-900/30 hacker:border-green-800 hacker:text-green-400">
                                  {player.title}
                                </span>
                              )}
                              <p className={`text-[9px] md:hidden mt-0.5 uppercase tracking-wider font-black ${rankDetails.color}`}>
                                LVL {level} · {rankDetails.title}
                              </p>
                            </div>
                          </div>

                          <div className="col-span-2 hidden md:flex flex-col items-center justify-center">
                            <div className={`inline-flex items-center justify-center rounded-xl px-3 py-1.5 text-xs font-black shadow-sm transition-colors ${styles.bgLight} ${styles.textMain}`}>
                              LVL {level}
                            </div>
                            <span className={`text-[10px] mt-2 uppercase tracking-widest font-black ${rankDetails.color}`}>
                              {rankDetails.title}
                            </span>
                          </div>

                          {/* EXP + แถบเทียบสัดส่วนกับแชมป์ */}
                          <div className="col-span-4 md:col-span-3 flex flex-col items-end gap-1 md:gap-1.5 min-w-0">
                            <span className={`font-black text-sm md:text-xl tracking-wider cute-header truncate ${isMe ? styles.textMain : (isHacker ? 'text-green-600 group-hover:text-green-400' : isDark ? 'text-white/70 group-hover:text-yellow-400' : 'text-orange-800 group-hover:text-orange-600')}`}>
                              {exp.toLocaleString()}
                            </span>
                            <div className="w-16 sm:w-20 md:w-28 h-1.5 rounded-full overflow-hidden bg-black/10 dark:bg-white/10 hacker:bg-green-900/40">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${expPct}%` }}
                                transition={{ duration: 0.8, delay: 0.2 + index * 0.04, ease: "easeOut" }}
                                className={`h-full rounded-full ${styles.bgMain}`}
                              />
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}

                    {leaderboardData.length === 0 && (
                      <div className={`py-20 flex flex-col items-center justify-center gap-4 ${styles.textMain}`}>
                        <AlertCircle size={48} strokeWidth={3} className="opacity-50 mb-2" />
                        <p className="font-black uppercase tracking-widest text-sm">ยังไม่มีสายลับในระบบนี้!</p>
                      </div>
                    )}
                  </motion.div>
                </div>
              </motion.div>
            </AnimatePresence>
          )}

        </div>
      </div>
    </div>
  );
}
