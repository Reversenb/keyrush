"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, animate } from 'framer-motion';
import { useTheme } from 'next-themes';
import { SkelStatCards, SkelListRows, skCard, sk } from '@/components/skeleton';
import { Play, Map, History, Activity, Target, ArrowRight, Cpu, AppWindow, Trophy, BookOpen, Zap, Terminal } from 'lucide-react';
import CoinIcon from '@/components/CoinIcon';
import Navbar from '@/components/Navbar';
import { apiFetch, clearUserState } from '@/lib/api';
import { RANKS as BASE_RANKS } from '@/lib/ranks';


// =========================================================================
// 📈 กราฟ WPM แบบมาตรฐาน — แกน y เริ่มศูนย์พร้อม tick, เส้นสีเดียว 2.5px,
// จุดข้อมูลมีวงแหวนสี surface, เส้นอ้างอิงค่าเฉลี่ย, crosshair + tooltip ตอน hover
// (วาดใน viewBox สัดส่วนจริง ไม่ใช้ preserveAspectRatio=none ที่ทำให้เส้น/ตัวเลขเบี้ยว)
// =========================================================================
function WpmChart({ points, avg, accentHex, isDark, isHacker, isDragon, isSakura, isSky }: {
  points: number[]; avg: number; accentHex: string; isDark: boolean; isHacker: boolean; isDragon: boolean; isSakura: boolean; isSky: boolean;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const W = 560, H = 250;
  const M = { top: 20, right: 20, bottom: 30, left: 42 };
  const plotW = W - M.left - M.right, plotH = H - M.top - M.bottom;

  const data = points;
  const hasData = data.length > 0;

  // เพดานแกน y ปัดขึ้นเป็นสเต็ปสวยๆ (ขั้นละ 20, ต่ำสุด 60)
  const niceMax = Math.max(60, Math.ceil(Math.max(...(hasData ? data : [0]), avg) / 20) * 20);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(niceMax * f));

  const xAt = (i: number) => (data.length <= 1 ? M.left + plotW / 2 : M.left + (i / (data.length - 1)) * plotW);
  const yAt = (v: number) => M.top + plotH - (Math.min(v, niceMax) / niceMax) * plotH;

  const lineD = data.map((v, i) => `${i === 0 ? 'M' : 'L'}${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`).join(' ');
  const areaD = hasData
    ? `M${xAt(0).toFixed(1)},${M.top + plotH} ${data.map((v, i) => `L${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`).join(' ')} L${xAt(data.length - 1).toFixed(1)},${M.top + plotH} Z`
    : '';

  // สีตามธีม: กริด/ตัวหนังสือใช้ ink ของธีม (ไม่ใช้สี series กับข้อความ)
  const gridColor = isHacker ? (isDragon ? 'rgba(239,68,68,0.14)' : 'rgba(34,197,94,0.14)') : isDark ? 'rgba(255,255,255,0.10)' : isSakura ? 'rgba(190,24,93,0.14)' : isSky ? 'rgba(3,105,161,0.14)' : 'rgba(154,52,18,0.14)';
  const inkMuted = isHacker ? (isDragon ? 'rgba(248,113,113,0.55)' : 'rgba(74,222,128,0.55)') : isDark ? 'rgba(255,255,255,0.5)' : isSakura ? 'rgba(157,23,77,0.6)' : isSky ? 'rgba(7,89,133,0.6)' : 'rgba(124,45,18,0.6)';
  const ink = isHacker ? (isDragon ? '#fca5a5' : '#86efac') : isDark ? '#ffffff' : isSakura ? '#500724' : isSky ? '#082f49' : '#431407';
  const surface = isHacker ? '#0a0a0a' : isDark ? '#1E1B2E' : '#ffffff';

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!hasData) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const fx = ((e.clientX - rect.left) / rect.width) * W;
    const idx = data.length <= 1 ? 0 : Math.round(((fx - M.left) / plotW) * (data.length - 1));
    setHoverIdx(Math.min(data.length - 1, Math.max(0, idx)));
  };

  if (!hasData) {
    return (
      <div className="h-56 sm:h-64 w-full flex flex-col items-center justify-center gap-2 text-center">
        <p className="text-sm font-black uppercase tracking-widest text-orange-400 dark:text-white/40 hacker:text-green-700">ยังไม่มีข้อมูลความเร็ว</p>
        <p className="text-xs font-bold text-orange-300 dark:text-white/30 hacker:text-green-800">ออกภารกิจแรกเพื่อเริ่มเก็บสถิติ 🚀</p>
      </div>
    );
  }

  const hp = hoverIdx !== null ? { x: xAt(hoverIdx), y: yAt(data[hoverIdx]), val: data[hoverIdx] } : null;
  const last = data.length - 1;
  const avgY = yAt(avg);
  const xTickIdx = Array.from(new Set([0, Math.floor(last / 2), last]));

  return (
    <div className="relative w-full" onMouseMove={handleMove} onMouseLeave={() => setHoverIdx(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto overflow-visible" role="img" aria-label={`กราฟความเร็วพิมพ์ ${data.length} รอบล่าสุด เฉลี่ย ${avg} WPM`}>
        {/* กริดแนวนอน + tick แกน y (จางๆ ไม่แย่งซีนข้อมูล) */}
        {ticks.map(t => (
          <g key={t}>
            <line x1={M.left} x2={W - M.right} y1={yAt(t)} y2={yAt(t)} stroke={gridColor} strokeWidth="1" />
            <text x={M.left - 8} y={yAt(t) + 4} textAnchor="end" fontSize="11" fontWeight="700" fill={inkMuted}>{t}</text>
          </g>
        ))}
        {/* tick แกน x: รอบแรก / กลาง / ล่าสุด */}
        {xTickIdx.map(i => (
          <text key={i} x={xAt(i)} y={H - 8} textAnchor="middle" fontSize="11" fontWeight="700" fill={inkMuted}>#{i + 1}</text>
        ))}

        {/* เส้นอ้างอิงค่าเฉลี่ย */}
        {avg > 0 && (
          <g>
            <line x1={M.left} x2={W - M.right} y1={avgY} y2={avgY} stroke={accentHex} strokeOpacity="0.45" strokeWidth="1.5" strokeDasharray="6 5" />
            {/* วางชิดซ้าย — ฝั่งขวาสงวนไว้ให้ label ของจุดล่าสุด กันข้อความทับกัน */}
            <text x={M.left + 6} y={avgY - 6} textAnchor="start" fontSize="10" fontWeight="900" fill={inkMuted}>AVG {avg}</text>
          </g>
        )}

        <defs>
          <linearGradient id="wpmArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accentHex} stopOpacity="0.22" />
            <stop offset="100%" stopColor={accentHex} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#wpmArea)" />
        <path d={lineD} fill="none" stroke={accentHex} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* crosshair ตอน hover */}
        {hp && <line x1={hp.x} x2={hp.x} y1={M.top} y2={M.top + plotH} stroke={accentHex} strokeOpacity="0.35" strokeWidth="1.5" />}

        {/* จุดข้อมูล: fill สี surface + ขอบสี accent (แยกตัวจากเส้นชัด) */}
        {data.map((v, i) => (
          <circle key={i} cx={xAt(i)} cy={yAt(v)} r={hoverIdx === i ? 6 : 4} fill={surface} stroke={accentHex} strokeWidth="2.5" style={{ transition: 'r 0.15s' }} />
        ))}

        {/* direct label เฉพาะจุดล่าสุด (selective — ไม่แปะเลขทุกจุด) */}
        {hoverIdx === null && (
          <text x={xAt(last)} y={yAt(data[last]) - 12} textAnchor="middle" fontSize="12" fontWeight="900" fill={ink}>{data[last]}</text>
        )}
      </svg>

      {/* tooltip แบบ HTML (คมชัดทุกขนาดจอ) */}
      {hp && hoverIdx !== null && (
        <div
          className="absolute pointer-events-none z-10 -translate-x-1/2 -translate-y-full flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 text-xs font-black shadow-md whitespace-nowrap"
          style={{ left: `${(hp.x / W) * 100}%`, top: `calc(${(hp.y / H) * 100}% - 12px)`, backgroundColor: surface, borderColor: accentHex, color: ink }}
        >
          <span className="inline-block size-2.5 rounded-full" style={{ backgroundColor: accentHex }} />
          ครั้งที่ {hoverIdx + 1} · {hp.val} WPM
        </div>
      )}
    </div>
  );
}

// ข้อมูลแรงค์กลางมาจาก lib/ranks.ts — ที่นี่เก็บเฉพาะสีประจำหน้า dashboard
const RANK_COLORS: Record<number, string> = {
  1: "text-slate-300", 2: "text-[#92400e]", 3: "text-yellow-400", 4: "text-cyan-400",
  5: "text-purple-400", 6: "text-pink-500", 7: "text-red-500",
  8: "text-[#059669]", // 💚 Keyrush Master
};
const RANKS = BASE_RANKS.map(r => ({ ...r, color: RANK_COLORS[r.id] }));

function AnimatedNumber({ value, start, duration = 1.5 }: { value: number; start: boolean; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!start) return;
    const controls = animate(0, value, {
      duration: duration,
      ease: "easeOut",
      onUpdate: (v) => {
        setDisplayValue(Math.floor(v));
      },
    });
    return () => controls.stop();
  }, [value, start, duration]);

  return <>{displayValue.toLocaleString()}</>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ avgWpm: 0, avgAccuracy: 0, recentWpm: [] as number[], recentLessons: [] as any[] });
  const [loading, setLoading] = useState(true);

  // 🌟 ป้องกัน Hydration Mismatch
  const [isMounted, setIsMounted] = useState(false);

  // 🌟 ดึงค่า Theme เพื่อสลับสี SVG กราฟให้รองรับ 3 ธีม
  const { theme: activeTheme, resolvedTheme } = useTheme();
  const currentTheme = activeTheme === 'system' ? resolvedTheme : activeTheme;
  const isDark = currentTheme === 'dark';
  const isHacker = currentTheme === 'hacker' || currentTheme === 'dragon'; const isDragon = currentTheme === 'dragon';

  // สีหลักของแต่ละธีม (ส้ม -> เหลือง -> เขียว/แดง -> ชมพู)
  const isSakura = currentTheme === 'sakura';
  const isSky = currentTheme === 'sky';
  const primaryHex = isHacker ? (isDragon ? '#ef4444' : '#22c55e') : (isDark ? '#facc15' : isSakura ? '#ec4899' : isSky ? '#0ea5e9' : '#f97316');

  useEffect(() => {
    setIsMounted(true); // ✅ เซ็ตค่า Mounted เมื่อรันฝั่ง Client สำเร็จ

    const fetchDashboardData = async () => {
      try {
        // cookie ถูกแนบไปเอง — ถ้า 401 apiFetch จะพาไปหน้า login ให้
        const [progRes, statsRes] = await Promise.all([
          apiFetch('/api/user/progress'),
          apiFetch('/api/user/stats')
        ]);

        if (progRes.status === 401 || progRes.status === 403) {
          clearUserState();
          return router.push('/login');
        }

        const progContentType = progRes.headers.get("content-type");
        if (!progContentType || !progContentType.includes("application/json")) {
          throw new Error("Backend ไม่ได้ตอบกลับเป็น JSON! กรุณาเช็ค API URL หรือตรวจสอบว่าเซิร์ฟเวอร์รันอยู่หรือไม่");
        }

        const progData = await progRes.json();
        const statsData = await statsRes.json();

        if (progData.success && progData.data) {
          setUser({
            ...progData.data,
            linuxLevel: progData.data.linuxLevel || 1,
            linuxExp: progData.data.linuxExp || 0,
            windowsLevel: progData.data.windowsLevel || 1,
            windowsExp: progData.data.windowsExp || 0,
          });
        }
        if (statsData.success && statsData.data) {
          setStats(statsData.data);
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setTimeout(() => setLoading(false), 800);
      }
    };
    fetchDashboardData();
  }, [router]);

  const getShowName = () => {
    if (!user) return 'Hacker';
    if (user.displayName && user.displayName.trim() !== '') return user.displayName;
    if (user.email) return user.email.split('@')[0];
    if (user.username) return user.username.split('@')[0];
    return 'Hacker';
  };

  const linuxLvl = user?.linuxLevel || 1;
  const winLvl = user?.windowsLevel || 1;
  const linuxExp = user?.linuxExp || 0;
  const winExp = user?.windowsExp || 0;

  const totalExp = linuxExp + winExp;
  const totalLessonsCompleted = (linuxLvl - 1) + (winLvl - 1);

  let currentRank = RANKS[0];
  for (let i = 0; i < RANKS.length; i++) {
    if (totalExp >= RANKS[i].minExp) {
      currentRank = RANKS[i];
    }
  }

  // 🌟 เพิ่มการรองรับสีของ Hacker Mode 🌟
  const getLightModeRankColor = (colorClass: string) => {
    // 💚 Keyrush Master — โทนเขียว | 🤎 Bronze — โทนน้ำตาล (เช็ค hex เฉพาะก่อน keyword ทั่วไป)
    if (colorClass.includes('059669')) return 'text-emerald-600 dark:text-emerald-400 hacker:text-green-300';
    if (colorClass.includes('92400e')) return 'text-amber-800 dark:text-amber-500 hacker:text-green-600';
    if (colorClass.includes('slate')) return 'text-slate-500 dark:text-slate-300 hacker:text-green-500';
    if (colorClass.includes('yellow')) return 'text-amber-500 dark:text-yellow-400 hacker:text-green-400';
    if (colorClass.includes('cyan')) return 'text-blue-500 dark:text-cyan-400 hacker:text-green-400';
    if (colorClass.includes('purple')) return 'text-purple-500 dark:text-purple-400 hacker:text-green-400';
    if (colorClass.includes('pink')) return 'text-pink-500 dark:text-pink-400 hacker:text-green-400';
    if (colorClass.includes('red')) return 'text-red-500 dark:text-red-400 hacker:text-green-400';
    return 'text-orange-500 dark:text-yellow-400 hacker:text-green-400';
  };

  const getAccColorHex = (acc: number) => {
    // ธีมสว่างใช้เฉดเข้ม (ผ่าน validate contrast ≥3:1 บนพื้นขาว) ธีมมืดใช้เฉดสว่าง
    const onDark = isDark || isHacker;
    if (acc < 80) return onDark ? '#fb7185' : '#e11d48';
    if (acc < 95) return onDark ? '#fbbf24' : '#d97706';
    return onDark ? (isDragon ? '#f87171' : '#4ade80') : (isDragon ? '#dc2626' : '#16a34a');
  };

  const getAccColorClass = (acc: number) => {
    if (acc < 80) return 'text-rose-600 dark:text-rose-400 hacker:text-rose-500';
    if (acc < 95) return 'text-amber-600 dark:text-amber-400 hacker:text-amber-500';
    return 'text-green-600 dark:text-green-400 hacker:text-green-500';
  };

  const getAccLabel = (acc: number) => {
    if (acc < 80) return 'Need Practice';
    if (acc < 95) return 'Good';
    return 'Excellent';
  };

  const circleCircumference = 238.76;
  const accOffset = circleCircumference - (circleCircumference * stats.avgAccuracy) / 100;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  // ✅ ดักจับเรนเดอร์เปล่าๆ จนกว่าจะเมาท์เสร็จ เพื่อแก้ปัญหา Hydration Error
  if (!isMounted) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-pulse text-orange-500 dark:text-yellow-400 hacker:text-green-500 font-black">LOADING DATA...</div></div>;
  }

  return (
    <div className="bg-background font-sans font-black text-foreground min-h-screen flex flex-col overflow-x-hidden selection:bg-orange-500/20 dark:selection:bg-yellow-400/20 hacker:selection:bg-green-500/20 relative transition-colors duration-500">

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@400;500;700;900&display=swap');
        .font-prompt { font-family: 'Prompt', sans-serif; }

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
          transition: transform 0.1s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.1s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s, border-color 0.2s, color 0.2s;
        }
        .btn-squishy:hover { transform: translateY(-2px); }
        .btn-squishy:active { transform: translateY(6px); box-shadow: 0 0 0 transparent !important; }

        .cute-header {
          text-shadow: 2px 2px 0px rgba(255, 255, 255, 1), 
                       -1px -1px 0px rgba(255, 255, 255, 1), 
                       1px -1px 0px rgba(255, 255, 255, 1), 
                       -1px 1px 0px rgba(255, 255, 255, 1);
          letter-spacing: -0.02em;
        }

        .dark .cute-header {
           text-shadow: 2px 2px 0px rgba(0, 0, 0, 0.3); 
        }

        .hacker .cute-header {
           text-shadow: 2px 2px 0px rgba(0, 0, 0, 0.8); 
        }
        
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #fff7ed; }
        .dark ::-webkit-scrollbar-track { background: #1E1B2E; }
        .hacker ::-webkit-scrollbar-track { background: #0a0a0a; }

        ::-webkit-scrollbar-thumb { background: #fed7aa; border-radius: 4px; }
        .dark ::-webkit-scrollbar-thumb { background: #4B3965; }
        .hacker ::-webkit-scrollbar-thumb { background: #166534; }

        ::-webkit-scrollbar-thumb:hover { background: #f97316; }
        .dark ::-webkit-scrollbar-thumb:hover { background: #facc15; }
        .hacker ::-webkit-scrollbar-thumb:hover { background: #22c55e; }
      `}</style>

      {/* 🎈 Background Blobs 🎈 */}
      <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-400 dark:bg-yellow-500 hacker:bg-green-600 rounded-full blur-[100px] opacity-20 dark:opacity-5 hacker:opacity-10 float-element pointer-events-none z-0 transition-colors" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-amber-400 dark:bg-yellow-600 hacker:bg-green-700 rounded-full blur-[100px] opacity-20 dark:opacity-5 hacker:opacity-10 float-delayed pointer-events-none z-0 transition-colors" />
      <div className="fixed top-[40%] left-[20%] w-[300px] h-[300px] bg-yellow-300 dark:bg-yellow-400 hacker:bg-green-500 rounded-full blur-[100px] opacity-20 dark:opacity-5 hacker:opacity-10 float-element pointer-events-none z-0 transition-colors" style={{ animationDelay: '2s' }} />

      <div className="flex h-full grow flex-col relative z-10 w-full">

        <Navbar />

        {loading ? (
          /* 💀 Skeleton เฉพาะหน้า Dashboard: การ์ดต้อนรับ + สถิติ 4 ใบ + กราฟ + ประวัติล่าสุด 💀 */
          <div className="flex-1 px-4 md:px-10 py-8 flex justify-center relative z-10 w-full animate-in fade-in duration-300" aria-hidden>
            <div className="flex flex-col max-w-[1200px] w-full gap-6 md:gap-8">
              <div className={`${skCard} rounded-[28px] p-6 md:p-8 flex items-center gap-4 md:gap-6`}>
                <div className={`${sk} rounded-full w-16 h-16 md:w-20 md:h-20 shrink-0`} />
                <div className="flex-1 flex flex-col gap-2.5">
                  <div className={`${sk} rounded-full h-5 w-48 max-w-full`} />
                  <div className={`${sk} rounded-full h-3.5 w-32`} />
                </div>
                <div className={`${sk} rounded-2xl h-10 w-28 hidden md:block`} />
              </div>
              <SkelStatCards n={4} cols="grid-cols-2 lg:grid-cols-4" />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                <div className={`${skCard} rounded-[28px] p-5 md:p-6 flex flex-col gap-4`}>
                  <div className={`${sk} rounded-full h-4 w-36`} />
                  <div className="flex items-end gap-3 flex-1 min-h-48 md:min-h-56">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className={`${sk} rounded-t-xl flex-1`} style={{ height: `${30 + ((i * 37) % 60)}%` }} />
                    ))}
                  </div>
                </div>
                <SkelListRows n={4} />
              </div>
            </div>
          </div>
        ) : (
        <motion.main
          variants={containerVariants}
          initial="hidden"
          animate={!loading ? "show" : "hidden"}
          className="flex-1 px-4 md:px-10 py-8 flex justify-center relative z-10 w-full"
        >
          <div className="flex flex-col max-w-[1200px] w-full flex-1 gap-8 mx-auto">

            {/* 🌟 Welcome Card 🌟 */}
            <motion.div variants={itemVariants} className="glass-card p-8 md:p-10 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-end gap-6 shadow-sm">
              <div className="flex flex-col gap-2 w-full z-10">
                <h1 className="text-black-600 dark:text-white hacker:text-white text-3xl md:text-4xl font-black leading-tight tracking-tight cute-header transition-colors">
                  Welcome back, <span className="text-orange-500 dark:text-yellow-400 hacker:text-green-500">{getShowName()}</span>
                </h1>
                {/* 🏷️ ฉายาจากร้านค้า (ถ้ายังไม่ใส่ ชวนไปเลือกที่ร้าน) */}
                <div className="mt-1">
                  {user?.title ? (
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-[14px] border-2 text-sm md:text-base font-black shadow-sm transition-colors bg-orange-100 border-white text-orange-600 dark:bg-yellow-400/15 dark:border-[#4B3965] dark:text-yellow-300 hacker:bg-green-900/30 hacker:border-green-800 hacker:text-green-400">
                      ✦ {user.title}
                    </span>
                  ) : (
                    <Link href="/shop" className="inline-flex items-center gap-2 px-4 py-1.5 rounded-[14px] border-2 border-dashed text-xs md:text-sm font-black uppercase tracking-widest transition-colors border-orange-200 text-orange-400 hover:text-orange-600 hover:border-orange-400 dark:border-[#4B3965] dark:text-white/40 dark:hover:text-yellow-400 hacker:border-green-900 hacker:text-green-700 hacker:hover:text-green-500">
                      ยังไม่มีฉายา — ไปเลือกที่ร้านค้า ✨
                    </Link>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto shrink-0 z-10">
                <button
                  onClick={() => router.push('/map')}
                  className="btn-squishy flex items-center justify-center gap-2 px-6 py-4 w-full sm:w-auto bg-white dark:bg-[#2D223B] hacker:bg-[#111] text-orange-600 dark:text-yellow-400 hacker:text-green-500 rounded-[24px] font-black text-sm uppercase tracking-widest border-4 border-orange-200 dark:border-[#4B3965] hacker:border-[#166534] shadow-[0_8px_0_#fed7aa] dark:shadow-[0_8px_0_#1E1B2E] hacker:shadow-[0_8px_0_#0a0a0a] hover:bg-orange-50 dark:hover:bg-[#382E54] hacker:hover:bg-[#1a1a1a] transition-all"
                >
                  <Map size={20} strokeWidth={3} /> ดูแผนที่ภารกิจ
                </button>

                <button
                  onClick={() => router.push('/campaignpage')}
                  className="btn-squishy flex items-center justify-center gap-2 px-6 py-4 w-full sm:w-auto bg-orange-500 dark:bg-yellow-400 hacker:bg-green-600 text-white dark:text-[#1E1B2E] hacker:text-[#0a0a0a] rounded-[24px] font-black text-sm uppercase tracking-widest border-4 border-white dark:border-transparent hacker:border-transparent shadow-[0_8px_0_#c2410c] dark:shadow-[0_8px_0_#a16207] hacker:shadow-[0_8px_0_#14532d] hover:bg-orange-400 dark:hover:bg-yellow-300 hacker:hover:bg-green-500 transition-all"
                >
                  <Play size={20} strokeWidth={3} fill="currentColor" /> ลุยภารกิจต่อ
                </button>
              </div>
            </motion.div>

            {/* 🌟 STATS CARDS 🌟 */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
              {[
                { label: 'Lessons Completed', value: totalLessonsCompleted, icon: <BookOpen size={28} strokeWidth={3} />, color: 'blue' },
                { label: 'Total XP', value: totalExp, icon: <Zap size={28} strokeWidth={3} fill="currentColor" />, color: 'primary', isXp: true },
                { label: 'Coins', value: user?.coins || 0, icon: <CoinIcon size={28} />, color: 'amber', isCoins: true },
                { label: 'Your Rank', title: currentRank.title, icon: <Trophy size={28} strokeWidth={3} />, color: 'pink', rankColor: currentRank.color }
              ].map((stat, i) => {
                const cardContent = (
                  <>
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-4 rounded-[20px] bg-orange-100 dark:bg-yellow-400/10 hacker:bg-green-500/10 text-orange-500 dark:text-yellow-400 hacker:text-green-500 border-4 border-white dark:border-[#382E54] hacker:border-[#166534] shadow-sm group-hover:scale-110 transition-all">
                        {stat.icon}
                      </div>
                    </div>
                    <div>
                      <p className="text-orange-400 dark:text-white/50 hacker:text-white/50 text-xs font-black uppercase tracking-widest mb-1 transition-colors">{stat.label}</p>
                      {stat.title ? (
                        <p className={`text-2xl lg:text-3xl font-black tracking-tight cute-header transition-colors ${getLightModeRankColor(stat.rankColor!)}`}>
                          {stat.title.toUpperCase()}
                        </p>
                      ) : (
                        <p className={`text-4xl font-black tracking-tight cute-header transition-colors ${stat.isCoins ? 'text-amber-500 dark:text-yellow-400 hacker:text-green-400' : 'text-orange-600 dark:text-yellow-400 hacker:text-green-500'}`}>
                          <AnimatedNumber value={stat.value as number} start={!loading} />
                        </p>
                      )}
                    </div>
                  </>
                );
                const cardClass = "glass-card p-8 hover:-translate-y-2 transition-all duration-300 group shadow-sm flex flex-col justify-center";

                // 🏆 การ์ดแรงค์ → ตารางแรงค์ | 🪙 การ์ดเหรียญ → ร้านค้า (กดได้ทั้งกล่อง)
                const linkHref = stat.title ? '/ranks' : stat.isCoins ? '/shop' : null;
                return linkHref ? (
                  <Link key={i} href={linkHref} title={stat.title ? 'ดูตารางแรงค์ทั้งหมด' : 'ไปที่ร้านค้า'} className={`${cardClass} cursor-pointer`}>
                    {cardContent}
                  </Link>
                ) : (
                  <div key={i} className={cardClass}>
                    {cardContent}
                  </div>
                );
              })}
            </motion.div>

            {/* 🌟 GRAPHS SECTION 🌟 */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">

              {/* WPM Chart */}
              <div className="lg:col-span-2 glass-card p-8 flex flex-col gap-6 relative overflow-hidden shadow-sm group hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center relative z-10 gap-4">
                  <div>
                    <h3 className="text-orange-950 dark:text-white hacker:text-white text-xl font-black uppercase tracking-tight flex items-center gap-2 cute-header transition-colors">
                      <Activity className="text-orange-500 dark:text-yellow-400 hacker:text-green-500" strokeWidth={3} /> WPM OUTPUT
                    </h3>
                    <p className="text-orange-600 dark:text-white/50 hacker:text-white/50 text-[11px] font-black uppercase tracking-widest mt-1 transition-colors">วิเคราะห์ความเร็วการพิมพ์ของคุณ</p>
                  </div>
                  <div className="flex items-center gap-3 bg-white dark:bg-[#382E54] hacker:bg-[#111] px-5 py-3 rounded-2xl border-4 border-orange-100 dark:border-[#4B3965] hacker:border-[#166534] shadow-sm transition-colors">
                    <span className="text-4xl font-black text-orange-500 dark:text-yellow-400 hacker:text-green-500 cute-header transition-colors">
                      <AnimatedNumber value={stats.avgWpm} start={!loading} />
                    </span>
                    <span className="text-[11px] text-orange-400 dark:text-white/60 hacker:text-white/60 font-black uppercase tracking-widest mt-3 transition-colors">avg</span>
                  </div>
                </div>

                <div className="relative w-full z-10">
                  <WpmChart points={stats.recentWpm} avg={stats.avgWpm} accentHex={primaryHex} isDark={isDark} isHacker={isHacker} isDragon={isDragon} isSakura={isSakura} isSky={isSky} />
                </div>
              </div>

              {/* Accuracy Chart */}
              <div className="glass-card p-8 flex flex-col items-center justify-center gap-8 relative overflow-hidden shadow-sm group hover:shadow-md transition-shadow">
                <div className="w-full relative z-10 text-center sm:text-left">
                  <h3 className="text-orange-950 dark:text-white hacker:text-white text-xl font-black uppercase tracking-tight flex items-center gap-2 justify-center sm:justify-start cute-header transition-colors">
                    <Target className="text-orange-500 dark:text-yellow-400 hacker:text-green-500" strokeWidth={3} /> ACCURACY
                  </h3>
                  <p className="text-orange-600 dark:text-white/50 hacker:text-white/50 text-[11px] font-black uppercase tracking-widest mt-1 transition-colors">ความแม่นยำในการพิมพ์</p>
                </div>
                <div className="relative size-48 sm:size-56 flex items-center justify-center z-10">
                  <svg className="size-full -rotate-90 transform drop-shadow-sm" viewBox="0 0 100 100">
                    <circle className="text-orange-100 dark:text-white/10 hacker:text-white/10 transition-colors" cx="50" cy="50" fill="transparent" r="38" stroke="currentColor" strokeWidth="8"></circle>
                    {/* วงแหวนใช้สี status (แดง/เหลือง/เขียว) ให้ตรงกับป้ายคำอธิบายด้านใน */}
                    <circle
                      cx="50" cy="50" fill="transparent" r="38"
                      stroke={getAccColorHex(stats.avgAccuracy)}
                      strokeDasharray={circleCircumference}
                      strokeDashoffset={!loading ? accOffset : circleCircumference}
                      strokeLinecap="round" strokeWidth="8" className="transition-all duration-[1500ms] ease-out delay-300"
                    ></circle>
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-4xl font-black text-orange-600 dark:text-yellow-400 hacker:text-green-500 tracking-tight cute-header transition-colors">
                      <AnimatedNumber value={stats.avgAccuracy} start={!loading} />%
                    </span>
                    <span className={`text-[11px] font-black uppercase tracking-widest mt-2 px-4 py-1.5 rounded-xl bg-white dark:bg-[#382E54] hacker:bg-[#111] border-4 border-white dark:border-[#4B3965] hacker:border-[#166534] shadow-sm transition-colors ${getAccColorClass(stats.avgAccuracy)}`}>
                      {getAccLabel(stats.avgAccuracy)}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 🌟 RECENT LOGS 🌟 */}
            <motion.div variants={itemVariants} className="glass-card flex flex-col overflow-hidden shadow-sm w-full group hover:shadow-md transition-shadow">
              <div className="p-6 md:p-8 border-b-4 border-white dark:border-[#382E54] hacker:border-[#166534] bg-white/50 dark:bg-black/20 hacker:bg-black/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors">
                <div>
                  <h3 className="text-orange-950 dark:text-white hacker:text-white text-xl font-black uppercase tracking-tight flex items-center gap-2 cute-header transition-colors">
                    <History className="text-orange-500 dark:text-yellow-400 hacker:text-green-500" strokeWidth={3} /> RECENT MISSIONS 🎯
                  </h3>
                  <p className="text-orange-600 dark:text-white/50 hacker:text-white/50 text-[11px] font-black uppercase tracking-widest mt-1 transition-colors">ประวัติการทำภารกิจล่าสุดของคุณ</p>
                </div>

                <button
                  onClick={() => router.push('/history')}
                  className="btn-squishy flex items-center gap-2 px-5 py-3 bg-white dark:bg-[#2D223B] hacker:bg-[#111] border-4 border-orange-200 dark:border-[#4B3965] hacker:border-[#166534] shadow-[0_6px_0_#fed7aa] dark:shadow-[0_6px_0_#1E1B2E] hacker:shadow-[0_6px_0_#0a0a0a] rounded-[20px] text-xs font-black text-orange-600 dark:text-yellow-400 hacker:text-green-500 hover:bg-orange-50 dark:hover:bg-[#382E54] hacker:hover:bg-[#1a1a1a] transition-all"
                >
                  ดูทั้งหมด <ArrowRight size={18} strokeWidth={3} />
                </button>
              </div>

              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-sm whitespace-nowrap min-w-[700px]">
                  <thead className="bg-orange-100 dark:bg-white/5 hacker:bg-white/5 text-orange-600 dark:text-yellow-400/70 hacker:text-green-500/70 font-black text-[11px] uppercase tracking-widest border-b-4 border-white dark:border-[#382E54] hacker:border-[#166534] transition-colors">
                    <tr>
                      <th className="px-8 py-5">ระบบเป้าหมาย (Target)</th>
                      <th className="px-8 py-5">ด่าน (Sector)</th>
                      <th className="px-8 py-5 text-center">WPM</th>
                      <th className="px-8 py-5 text-center">ความแม่นยำ</th>
                      <th className="px-8 py-5 text-right">เวลาทำภารกิจ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-4 divide-white dark:divide-[#382E54] hacker:divide-[#166534] transition-colors">
                    {stats.recentLessons && stats.recentLessons.length > 0 ? (
                      stats.recentLessons.map((lesson: any, i: number) => {
                        const isLinux = lesson.os === 'linux';
                        const themeColor = isLinux ? 'text-orange-500 dark:text-yellow-400 hacker:text-green-500' : 'text-blue-500 dark:text-blue-400 hacker:text-green-500';
                        const bgIcon = isLinux ? 'bg-orange-100 dark:bg-yellow-400/10 hacker:bg-green-500/10' : 'bg-blue-100 dark:bg-blue-500/20 hacker:bg-green-500/10';
                        return (
                          <tr key={i} className="group hover:bg-white/60 dark:hover:bg-white/5 hacker:hover:bg-white/5 transition-colors">
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-4">
                                <div className={`size-14 rounded-[20px] flex items-center justify-center border-4 border-white dark:border-transparent hacker:border-transparent ${themeColor} ${bgIcon} group-hover:scale-110 transition-transform shadow-sm`}>
                                  {isLinux ? <Cpu size={24} strokeWidth={2.5} /> : <AppWindow size={24} strokeWidth={2.5} />}
                                </div>
                                <div>
                                  <span className="font-black text-orange-950 dark:text-white hacker:text-white block uppercase tracking-wider text-sm transition-colors">
                                    {isLinux ? 'Linux CLI Terminal' : 'Windows CMD Core'}
                                  </span>
                                  <span className={`text-[10px] font-black uppercase ${themeColor}`}>[ MISSION COMPLETE ✨ ]</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-5 text-orange-800 dark:text-white/80 hacker:text-white/80 text-sm uppercase font-black tracking-widest transition-colors">Node_{lesson.level.toString().padStart(2, '0')}</td>
                            <td className="px-8 py-5 text-center font-black text-orange-600 dark:text-yellow-400 hacker:text-green-500 text-xl cute-header transition-colors">{lesson.wpm}</td>
                            <td className="px-8 py-5 text-center">
                              <span className={`font-black px-4 py-2 rounded-xl bg-white dark:bg-[#382E54] hacker:bg-[#111] border-4 border-white dark:border-[#4B3965] hacker:border-[#166534] shadow-sm text-sm transition-colors ${getAccColorClass(lesson.accuracy)}`}>
                                {lesson.accuracy}%
                              </span>
                            </td>
                            <td className="px-8 py-5 text-right text-orange-400 dark:text-white/50 hacker:text-white/50 text-[11px] font-black uppercase tracking-widest transition-colors">
                              {new Date(lesson.createdAt).toLocaleString('en-GB', { hour12: false, month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        {/* ห้ามใส่ flex ที่ <td> ตรงๆ — จะทำลาย table layout แล้ว colSpan ไม่ทำงาน */}
                        <td colSpan={5} className="px-8 py-20 text-center transition-colors">
                          <div className="flex flex-col items-center justify-center gap-4 text-orange-400 dark:text-white/50 hacker:text-white/50 font-black">
                            <Terminal size={48} strokeWidth={3} className="opacity-30 animate-bounce" />
                            <span className="text-sm uppercase tracking-widest">ยังไม่มีประวัติการทำภารกิจ เริ่มฝึกพิมพ์กันเลย! 🚀</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>


            <footer className="py-10 text-center text-orange-400 dark:text-white/30 hacker:text-white/30 font-black text-[11px] uppercase tracking-widest transition-colors">
              © 2026 KeyRush
            </footer>

          </div>
        </motion.main>
        )}
      </div>
    </div>
  );
}
