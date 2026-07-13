"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, animate } from 'framer-motion';
import { useTheme } from 'next-themes';
import HackerLoadingScreen from '@/components/HackerLoadingScreen';
import { Play, Map, History, Activity, Target, ArrowRight, Cpu, AppWindow, Trophy, BookOpen, Zap, Terminal } from 'lucide-react';
import Navbar from '@/components/Navbar';


const RANKS = [
  { id: 1, title: "Script Kiddie", minExp: 0, color: "text-slate-300", icon: "keyboard" },
  { id: 2, title: "Cyber Novice", minExp: 200, color: "text-[#0df259]", icon: "terminal" },
  { id: 3, title: "Net Runner", minExp: 500, color: "text-yellow-400", icon: "router" },
  { id: 4, title: "System Admin", minExp: 1000, color: "text-cyan-400", icon: "dns" },
  { id: 5, title: "Elite Operative", minExp: 2000, color: "text-purple-400", icon: "bug_report" },
  { id: 6, title: "Phantom Architect", minExp: 3500, color: "text-pink-500", icon: "fingerprint" },
  { id: 7, title: "Root Master", minExp: 5000, color: "text-red-500", icon: "admin_panel_settings" },
];

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
  const isHacker = currentTheme === 'hacker';

  // สีหลักของแต่ละธีม (ส้ม -> เหลือง -> เขียว)
  const primaryHex = isHacker ? '#22c55e' : (isDark ? '#facc15' : '#f97316');

  useEffect(() => {
    setIsMounted(true); // ✅ เซ็ตค่า Mounted เมื่อรันฝั่ง Client สำเร็จ

    const fetchDashboardData = async () => {
      const token = localStorage.getItem('keyrush_token');
      if (!token) return router.push('/login');

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;

        const [progRes, statsRes] = await Promise.all([
          fetch(`${apiUrl}/api/user/progress`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${apiUrl}/api/user/stats`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (progRes.status === 401 || progRes.status === 403) {
          localStorage.removeItem('keyrush_token');
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
    if (colorClass.includes('slate')) return 'text-slate-500 dark:text-slate-300 hacker:text-green-500';
    if (colorClass.includes('0df259')) return 'text-green-500 dark:text-green-400 hacker:text-green-400';
    if (colorClass.includes('yellow')) return 'text-amber-500 dark:text-yellow-400 hacker:text-green-400';
    if (colorClass.includes('cyan')) return 'text-blue-500 dark:text-cyan-400 hacker:text-green-400';
    if (colorClass.includes('purple')) return 'text-purple-500 dark:text-purple-400 hacker:text-green-400';
    if (colorClass.includes('pink')) return 'text-pink-500 dark:text-pink-400 hacker:text-green-400';
    if (colorClass.includes('red')) return 'text-red-500 dark:text-red-400 hacker:text-green-400';
    return 'text-orange-500 dark:text-yellow-400 hacker:text-green-400';
  };

  const getAccColorHex = (acc: number) => {
    if (acc < 80) return '#fb7185';
    if (acc < 95) return '#fbbf24';
    return '#4ade80';
  };

  const getAccColorClass = (acc: number) => {
    if (acc < 80) return 'text-rose-500 hacker:text-rose-500';
    if (acc < 95) return 'text-amber-500 hacker:text-amber-500';
    return 'text-green-500 hacker:text-green-500';
  };

  const getAccLabel = (acc: number) => {
    if (acc < 80) return 'Need Practice';
    if (acc < 95) return 'Good';
    return 'Excellent';
  };

  const dataPoints = stats.recentWpm.length > 0 ? stats.recentWpm : [0];
  const plotPoints = dataPoints.length === 1 ? [dataPoints[0], dataPoints[0]] : dataPoints;
  const maxWpm = Math.max(80, ...plotPoints) + 10;

  const svgPoints = plotPoints.map((val: number, i: number) => {
    const x = (i / (plotPoints.length - 1)) * 100;
    const y = 48 - (val / maxWpm) * 45;
    return { x, y, val };
  });

  const pathD = `M0,50 ` + svgPoints.map((p) => `L${p.x},${p.y}`).join(' ') + ` L100,50 Z`;
  const lineD = svgPoints.map((p, i) => (i === 0 ? 'M' : 'L') + `${p.x},${p.y}`).join(' ');

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

      <AnimatePresence>
        {loading && <HackerLoadingScreen />}
      </AnimatePresence>

      <div className="flex h-full grow flex-col relative z-10 w-full">

        <Navbar />

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
                <p className="text-orange-800 dark:text-white/60 hacker:text-white/60 text-sm md:text-base font-black uppercase tracking-widest mt-1 transition-colors">
                  สถานะระบบ: <span className="text-orange-500 dark:text-green-400 hacker:text-green-400 animate-pulse">ONLINE</span> | ภารกิจที่ผ่าน: <span className="text-orange-600 dark:text-yellow-400 hacker:text-green-500"><AnimatedNumber value={totalLessonsCompleted} start={!loading} /></span>
                </p>
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
            <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
              {[
                { label: 'Lessons Completed', value: totalLessonsCompleted, icon: <BookOpen size={28} strokeWidth={3} />, color: 'blue' },
                { label: 'Total XP', value: totalExp, icon: <Zap size={28} strokeWidth={3} fill="currentColor" />, color: 'primary', isXp: true },
                { label: 'Your Rank', title: currentRank.title, icon: <Trophy size={28} strokeWidth={3} />, color: 'pink', rankColor: currentRank.color }
              ].map((stat, i) => (
                <div key={i} className="glass-card p-8 hover:-translate-y-2 transition-all duration-300 group shadow-sm flex flex-col justify-center">
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
                      <p className={`text-4xl font-black tracking-tight cute-header text-orange-600 dark:text-yellow-400 hacker:text-green-500 transition-colors`}>
                        <AnimatedNumber value={stat.value as number} start={!loading} />
                      </p>
                    )}
                  </div>
                </div>
              ))}
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

                <div className="relative h-56 sm:h-72 w-full z-10">
                  <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 50">
                    {[0, 12.5, 25, 37.5, 50].map(y => (
                      <line key={y} className="text-orange-200 dark:text-white/10 hacker:text-white/10 transition-colors" stroke="currentColor" strokeDasharray="4 4" strokeWidth="0.2" x1="0" x2="100" y1={y} y2={y}></line>
                    ))}

                    <defs>
                      <linearGradient id="orangeLine" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={primaryHex} />
                        <stop offset="100%" stopColor={isHacker ? '#86efac' : isDark ? '#fef08a' : '#fbbf24'} />
                      </linearGradient>
                      <linearGradient id="orangeArea" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={primaryHex} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={primaryHex} stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <g>
                      <path d={pathD} fill="url(#orangeArea)"></path>
                      <path d={lineD} fill="none" stroke="url(#orangeLine)" strokeLinecap="round" strokeLinejoin="miter" strokeWidth="1" className="drop-shadow-sm"></path>
                      {svgPoints.map((p, i) => (
                        <g key={i} className="group/point">
                          <circle cx={p.x} cy={p.y} r="1.5" fill={isHacker ? '#0a0a0a' : isDark ? '#1E1B2E' : 'white'} stroke={primaryHex} strokeWidth="0.5" className="cursor-pointer transition-transform hover:scale-[2] origin-center" />
                          <text x={p.x} y={p.y - 3} fill={primaryHex} fontSize="3" textAnchor="middle" fontWeight="900" className="opacity-0 group-hover/point:opacity-100 transition-opacity drop-shadow-sm">{p.val}</text>
                        </g>
                      ))}
                    </g>
                  </svg>
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
                    <circle
                      cx="50" cy="50" fill="transparent" r="38"
                      stroke={primaryHex}
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
                        <td colSpan={5} className="px-8 py-20 text-center text-orange-400 dark:text-white/50 hacker:text-white/50 font-black flex flex-col items-center justify-center gap-4 transition-colors">
                          <Terminal size={48} strokeWidth={3} className="opacity-30 animate-bounce" />
                          <span className="text-sm uppercase tracking-widest">ยังไม่มีประวัติการทำภารกิจ เริ่มฝึกพิมพ์กันเลย! 🚀</span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>


            <footer className="py-10 text-center text-orange-400 dark:text-white/30 hacker:text-white/30 font-black text-[11px] uppercase tracking-widest transition-colors">
              © 2026 KeyRush Operative Dashboard 💖
            </footer>

          </div>
        </motion.main>
      </div>
    </div>
  );
}