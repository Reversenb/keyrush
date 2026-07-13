"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { Terminal, Monitor, Globe, RefreshCw, Trophy, AlertCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import HackerLoadingScreen from '@/components/HackerLoadingScreen';

export default function LeaderboardPage() {
  const router = useRouter();

  // 🌟 ระบบ Theme
  const { theme: activeTheme, resolvedTheme } = useTheme();
  const currentTheme = activeTheme === 'system' ? resolvedTheme : activeTheme;
  const isDark = currentTheme === 'dark';
  const isHacker = currentTheme === 'hacker';

  const [user, setUser] = useState<any>(null);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetOs, setTargetOs] = useState<'linux' | 'windows' | 'combined'>('linux');

  useEffect(() => {
    const fetchUserAndLeaderboard = async () => {
      const token = localStorage.getItem('keyrush_token');
      if (!token) {
        router.push('/login');
        return;
      }

      const savedUserStr = localStorage.getItem('keyrush_user');
      if (savedUserStr) {
        try { setUser(JSON.parse(savedUserStr)); } catch (e) { }
      }

      const savedOs = (localStorage.getItem('keyrush_target_os') as 'linux' | 'windows' | 'combined') || 'linux';
      setTargetOs(savedOs);
      await loadLeaderboard(savedOs);
    };

    fetchUserAndLeaderboard();
  }, [router]);

  const loadLeaderboard = async (os: 'linux' | 'windows' | 'combined') => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/leaderboard/${os}`);

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
    localStorage.setItem('keyrush_target_os', os);
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

  // 🌟 ฟังก์ชันหาชื่อแรงค์ ปรับสีให้เข้ากับทุกธีม
  const getRankDetails = (level: number) => {
    if (level <= 3) return { title: "Script Kiddie", color: "text-slate-400 dark:text-slate-300 hacker:text-green-600" };
    if (level <= 6) return { title: "Junior Hacker", color: "text-orange-400 dark:text-yellow-500 hacker:text-green-500" };
    if (level <= 9) return { title: "SysAdmin", color: "text-blue-500 dark:text-blue-400 hacker:text-green-400" };
    return { title: "Root Master", color: "text-pink-500 font-black dark:text-pink-400 hacker:text-green-300" };
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
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
    tableBorder: isHacker ? 'border-green-800 shadow-[0_10px_30px_rgba(34,197,94,0.15)]' : isDark ? 'border-[#382E54] shadow-[0_10px_30px_rgba(0,0,0,0.3)]' : 'border-white shadow-[0_10px_30px_rgba(249,115,22,0.1)]',
    tableHeader: isHacker ? 'bg-green-900/40 border-green-800 text-green-500' : isDark ? 'bg-black/20 border-[#382E54] text-yellow-500' : (targetOs === 'linux' ? 'bg-orange-100 border-white text-orange-600' : targetOs === 'windows' ? 'bg-blue-100 border-white text-blue-600' : 'bg-pink-100 border-white text-pink-600'),
    tableRowHover: isHacker ? 'hover:bg-green-900/20 border-[#166534]' : isDark ? 'hover:bg-white/5 border-[#382E54]' : (targetOs === 'linux' ? 'hover:bg-orange-50/80 border-white' : targetOs === 'windows' ? 'hover:bg-blue-50/80 border-white' : 'hover:bg-pink-50/80 border-white'),
    tableRowMe: isHacker ? 'bg-green-900/30 border-l-8 border-l-green-500 shadow-sm border-[#166534]' : isDark ? 'bg-[#2D223B] border-l-8 border-l-yellow-400 shadow-sm border-[#382E54]' : (targetOs === 'linux' ? 'bg-orange-50 border-l-8 border-l-orange-500 shadow-sm border-white' : targetOs === 'windows' ? 'bg-blue-50 border-l-8 border-l-blue-500 shadow-sm border-white' : 'bg-pink-50 border-l-8 border-l-pink-500 shadow-sm border-white'),

    // สีปุ่ม Tab
    tabIdleText: isHacker ? 'text-green-700 hover:text-green-400' : isDark ? 'text-white/40 hover:text-yellow-400' : 'text-orange-400 hover:text-orange-600',
    tabIdleBg: isHacker ? 'bg-[#0a0a0a] border-green-900 hover:bg-[#111] hover:border-green-600 shadow-[0_4px_0_#14532d]' : isDark ? 'bg-[#1E1B2E] border-[#382E54] hover:bg-[#2D223B] hover:border-[#4B3965] shadow-[0_4px_0_#0a0a0a]' : 'bg-white border-orange-200 hover:bg-orange-50 hover:border-orange-300 shadow-[0_4px_0_#fed7aa]',
    tabActiveText: isHacker ? 'text-[#0a0a0a]' : isDark ? 'text-[#1E1B2E]' : 'text-white',
    tabActiveBg: isHacker ? 'bg-green-500 border-green-400 shadow-[0_4px_0_#16a34a]' : isDark ? 'bg-yellow-400 border-yellow-300 shadow-[0_4px_0_#ca8a04]' : (targetOs === 'linux' ? 'bg-orange-500 border-orange-400 shadow-[0_4px_0_#c2410c]' : targetOs === 'windows' ? 'bg-blue-500 border-blue-400 shadow-[0_4px_0_#1d4ed8]' : 'bg-pink-500 border-pink-400 shadow-[0_4px_0_#be185d]')
  };

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
        
        .glass-card {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(16px);
          border: 4px solid white;
          border-radius: 40px;
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

      <div className="relative z-50 shrink-0">
        <Navbar theme="linux" />
      </div>

      <div className="flex flex-1 w-full justify-center relative z-10 pt-8 pb-20">
        <div className="w-full max-w-5xl flex flex-col px-4 md:px-8 gap-10 relative z-10">

          {/* Header */}
          <div className="text-center animate-in fade-in slide-in-from-top-4 duration-700">
            <h1 className="text-4xl md:text-6xl font-black text-orange-950 dark:text-white hacker:text-white tracking-tighter uppercase mb-4 cute-header transition-colors">
              Global <span className={styles.textMain}>Rankings</span>
            </h1>
            <p className="text-orange-600 dark:text-yellow-500 hacker:text-green-600 font-bold text-sm max-w-xl mx-auto uppercase tracking-widest transition-colors">
              ตารางจัดอันดับยอดฝีมือ
            </p>
          </div>

          {/* 🌟 ป้ายสลับสาย (Tabs) แบบ 3D 🌟 */}
          <div className="flex justify-center relative z-20 w-full mb-12 md:mb-16 animate-in fade-in zoom-in duration-500 delay-100">
            <div className="bg-white/80 dark:bg-[#1E1B2E]/80 hacker:bg-[#0a0a0a]/80 backdrop-blur-md p-3 rounded-[32px] border-4 border-white dark:border-[#382E54] hacker:border-[#166534] flex w-full max-w-[650px] shadow-sm gap-3 relative transition-colors">

              {(['linux', 'windows', 'combined'] as const).map((os) => {
                const isActive = targetOs === os;
                const icon = os === 'linux' ? <Terminal size={20} strokeWidth={3} /> : os === 'windows' ? <Monitor size={20} strokeWidth={3} /> : <Globe size={20} strokeWidth={3} />;
                const label = os === 'combined' ? 'Total' : os.charAt(0).toUpperCase() + os.slice(1);

                return (
                  <button
                    key={os}
                    onClick={() => handleOsChange(os)}
                    className={`flex-1 py-4 rounded-[20px] text-xs md:text-sm font-black uppercase tracking-widest relative transition-all duration-300 flex items-center justify-center gap-2 border-4 btn-squishy ${isActive ? `${styles.tabActiveBg} ${styles.tabActiveText}` : styles.tabIdleBg + ' ' + styles.tabIdleText}`}
                  >
                    {icon}
                    <span className="relative z-10">{label}</span>
                  </button>
                );
              })}

            </div>
          </div>

          {loading ? (
            <div className={`flex flex-col justify-center items-center py-32 animate-pulse ${styles.textMain}`}>
              <RefreshCw size={48} strokeWidth={3} className="animate-spin mb-4" />
              <span className="tracking-widest uppercase font-black text-sm">Loading Data...</span>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div key={targetOs} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }} className="w-full">

                {/* 🌟 แท่น Podium Top 3 🌟 */}
                {leaderboardData.length >= 3 && (
                  <div className="flex justify-center items-end gap-3 md:gap-8 h-72 md:h-80 mb-16 px-2 mt-8">

                    {/* 🥈 Rank 2 */}
                    <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, type: "spring" }} className="flex flex-col items-center w-28 md:w-40 relative group">
                      <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} className="flex flex-col items-center z-10">
                        <Link href={`/u/${leaderboardData[1]?.displayName || leaderboardData[1]?.username.split('@')[0]}`}>
                          <div className="relative mb-3 group-hover:scale-110 transition-transform duration-300 cursor-pointer">
                            <div className="w-16 h-16 md:w-20 md:h-20 flex-shrink-0 rounded-full border-4 border-slate-300 dark:border-slate-500 hacker:border-green-800 bg-white shadow-sm flex items-center justify-center p-[2px] overflow-hidden">
                              <img src={getAvatarUrl(leaderboardData[1]?.avatar)} alt="Rank 2" className="w-full h-full object-cover rounded-full" />
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-slate-200 dark:bg-slate-700 hacker:bg-[#0a0a0a] text-slate-700 dark:text-slate-200 hacker:text-green-500 rounded-full flex items-center justify-center text-sm font-black border-2 border-white dark:border-[#382E54] hacker:border-[#166534] shadow-sm z-10">2</div>
                          </div>
                        </Link>
                        <Link href={`/u/${leaderboardData[1]?.displayName || leaderboardData[1]?.username.split('@')[0]}`} className="text-orange-950 dark:text-white hacker:text-green-400 font-black text-sm truncate w-full text-center hover:underline cursor-pointer">
                          {leaderboardData[1]?.displayName || leaderboardData[1]?.username.split('@')[0]}
                        </Link>
                        <p className={`text-[10px] uppercase tracking-widest mt-1 mb-0.5 font-black ${getRankDetails(getPlayerLevel(leaderboardData[1])).color}`}>
                          {getRankDetails(getPlayerLevel(leaderboardData[1])).title}
                        </p>
                        <p className={`text-xs font-black ${styles.textMain} bg-white dark:bg-[#1E1B2E] hacker:bg-[#0a0a0a] px-3 py-1 rounded-xl border-2 border-white dark:border-[#382E54] hacker:border-green-800 shadow-sm mt-1`}>
                          {getPlayerExp(leaderboardData[1]).toLocaleString()} EXP
                        </p>
                      </motion.div>
                      <div className="w-full h-28 md:h-32 bg-white/80 dark:bg-[#2D223B]/80 hacker:bg-[#111]/80 rounded-t-[24px] mt-4 flex justify-center items-start pt-3 border-4 border-b-0 border-white dark:border-[#382E54] hacker:border-green-800 relative overflow-hidden shadow-sm backdrop-blur-md transition-colors"></div>
                    </motion.div>

                    {/* 🥇 Rank 1 */}
                    <motion.div initial={{ opacity: 0, scale: 0.8, y: 50 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: "spring", bounce: 0.5 }} className="flex flex-col items-center w-36 md:w-52 relative z-20 group">

                      {/* 🌟 Glow Effect ด้านหลัง 🌟 */}
                      <div className={`absolute top-10 w-[150%] h-[150%] blur-3xl rounded-full pointer-events-none transition-colors duration-500 ${isHacker ? 'bg-green-500/20 group-hover:bg-green-500/40' : isDark ? 'bg-yellow-400/20 group-hover:bg-yellow-400/40' : 'bg-yellow-300/40 group-hover:bg-yellow-300/60'}`}></div>

                      <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }} className="flex flex-col items-center z-10">
                        <Trophy size={40} strokeWidth={2.5} className="text-yellow-400 hacker:text-green-400 mb-2 drop-shadow-sm fill-yellow-200 dark:fill-yellow-600 hacker:fill-green-900" />
                        <Link href={`/u/${leaderboardData[0]?.displayName || leaderboardData[0]?.username.split('@')[0]}`}>
                          <div className="relative mb-3 group-hover:scale-110 transition-transform duration-300 cursor-pointer">
                            <div className={`w-24 h-24 md:w-28 md:h-28 flex-shrink-0 rounded-full border-4 ${isHacker ? 'border-green-500' : 'border-yellow-400'} bg-white shadow-md flex items-center justify-center p-[3px] overflow-hidden`}>
                              <img src={getAvatarUrl(leaderboardData[0]?.avatar)} alt="Rank 1" className="w-full h-full object-cover rounded-full" />
                            </div>
                            <div className={`absolute -bottom-2 -right-2 w-8 h-8 ${isHacker ? 'bg-green-500' : 'bg-yellow-400'} text-[#1E1B2E] rounded-full flex items-center justify-center text-sm font-black border-2 border-white dark:border-[#382E54] hacker:border-[#0a0a0a] shadow-sm z-10`}>1</div>
                          </div>
                        </Link>
                        <Link href={`/u/${leaderboardData[0]?.displayName || leaderboardData[0]?.username.split('@')[0]}`} className="text-orange-950 dark:text-white hacker:text-green-400 font-black text-base md:text-lg truncate w-full text-center hover:underline cursor-pointer">
                          {leaderboardData[0]?.displayName || leaderboardData[0]?.username.split('@')[0]}
                        </Link>
                        <p className={`text-[11px] uppercase tracking-widest mt-1 font-black ${getRankDetails(getPlayerLevel(leaderboardData[0])).color}`}>
                          {getRankDetails(getPlayerLevel(leaderboardData[0])).title}
                        </p>
                        <p className={`text-sm ${isHacker ? 'text-green-400 bg-green-900/30 border-green-800' : 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-400/10 border-white dark:border-yellow-500'} font-black mt-1.5 px-4 py-1.5 rounded-[16px] border-2 shadow-sm transition-colors`}>
                          {getPlayerExp(leaderboardData[0]).toLocaleString()} EXP
                        </p>
                      </motion.div>
                      <div className="w-full h-36 md:h-44 bg-white dark:bg-[#382E54] hacker:bg-[#0a0a0a] rounded-t-[32px] mt-4 flex justify-center items-start pt-4 border-4 border-b-0 border-white dark:border-[#4B3965] hacker:border-green-600 relative overflow-hidden shadow-md transition-colors"></div>
                    </motion.div>

                    {/* 🥉 Rank 3 */}
                    <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, type: "spring" }} className="flex flex-col items-center w-28 md:w-40 relative group">
                      <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 1 }} className="flex flex-col items-center z-10">
                        <Link href={`/u/${leaderboardData[2]?.displayName || leaderboardData[2]?.username.split('@')[0]}`}>
                          <div className="relative mb-3 group-hover:scale-110 transition-transform duration-300 cursor-pointer">
                            <div className="w-16 h-16 md:w-20 md:h-20 flex-shrink-0 rounded-full border-4 border-orange-300 dark:border-[#4B3965] hacker:border-green-800 bg-white shadow-sm flex items-center justify-center p-[2px] overflow-hidden">
                              <img src={getAvatarUrl(leaderboardData[2]?.avatar)} alt="Rank 3" className="w-full h-full object-cover rounded-full" />
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-orange-300 dark:bg-[#4B3965] hacker:bg-green-900 text-white hacker:text-green-400 rounded-full flex items-center justify-center text-sm font-black border-2 border-white dark:border-[#382E54] hacker:border-[#166534] shadow-sm z-10">3</div>
                          </div>
                        </Link>
                        <Link href={`/u/${leaderboardData[2]?.displayName || leaderboardData[2]?.username.split('@')[0]}`} className="text-orange-950 dark:text-white hacker:text-green-400 font-black text-sm truncate w-full text-center hover:underline cursor-pointer">
                          {leaderboardData[2]?.displayName || leaderboardData[2]?.username.split('@')[0]}
                        </Link>
                        <p className={`text-[10px] uppercase tracking-widest mt-1 mb-0.5 font-black ${getRankDetails(getPlayerLevel(leaderboardData[2])).color}`}>
                          {getRankDetails(getPlayerLevel(leaderboardData[2])).title}
                        </p>
                        <p className={`text-xs font-black ${styles.textMain} bg-white dark:bg-[#1E1B2E] hacker:bg-[#0a0a0a] px-3 py-1 rounded-xl border-2 border-white dark:border-[#382E54] hacker:border-green-800 shadow-sm mt-1`}>
                          {getPlayerExp(leaderboardData[2]).toLocaleString()} EXP
                        </p>
                      </motion.div>
                      <div className="w-full h-24 md:h-28 bg-white/60 dark:bg-[#2D223B]/60 hacker:bg-[#111]/60 rounded-t-[24px] mt-4 flex justify-center items-start pt-3 border-4 border-b-0 border-white dark:border-[#382E54] hacker:border-green-800 relative overflow-hidden shadow-sm backdrop-blur-md transition-colors"></div>
                    </motion.div>

                  </div>
                )}

                {/* 🌟 ตารางรายชื่อทั้งหมด 🌟 */}
                <div className={`glass-card overflow-hidden ${styles.tableBorder}`}>

                  <div className={`grid grid-cols-12 gap-4 px-4 md:px-8 py-5 text-xs font-black uppercase tracking-widest border-b-4 ${styles.tableHeader}`}>
                    <div className="col-span-2 md:col-span-1 text-center">Rank</div>
                    <div className="col-span-7 md:col-span-6">Player</div>
                    <div className="col-span-3 md:col-span-2 text-center hidden md:block">Tier</div>
                    <div className="col-span-3 md:col-span-3 text-right">Total EXP</div>
                  </div>

                  <motion.div variants={containerVariants} initial="hidden" animate="show" className={`divide-y-4 ${isHacker ? 'divide-green-900' : isDark ? 'divide-[#382E54]' : 'divide-white'}`}>
                    {leaderboardData.map((player, index) => {
                      const isMe = user?.id === player.id;
                      const exp = getPlayerExp(player);
                      const level = getPlayerLevel(player);
                      const rankDetails = getRankDetails(level);
                      const playerProfileUrl = `/u/${player.displayName || player.username.split('@')[0]}`;

                      let rankColor = isHacker ? "text-green-700" : isDark ? "text-white/30" : "text-orange-300";
                      if (index === 0) rankColor = isHacker ? "text-green-400" : "text-yellow-500";
                      else if (index === 1) rankColor = isHacker ? "text-green-500" : "text-slate-400";
                      else if (index === 2) rankColor = isHacker ? "text-green-600" : "text-orange-500";

                      return (
                        <motion.div
                          key={player.id}
                          variants={itemVariants}
                          className={`grid grid-cols-12 gap-4 px-4 md:px-8 py-5 items-center transition-all duration-300 group ${isMe ? styles.tableRowMe : styles.tableRowHover}`}
                        >
                          <div className={`col-span-2 md:col-span-1 text-center font-black text-xl md:text-2xl cute-header ${rankColor}`}>
                            {index + 1}
                          </div>

                          <div className="col-span-7 md:col-span-6 flex items-center gap-4 min-w-0">
                            <Link href={playerProfileUrl} className="flex-shrink-0 cursor-pointer">
                              <div className={`w-12 h-12 md:w-14 md:h-14 flex-shrink-0 rounded-full bg-white dark:bg-[#1E1B2E] hacker:bg-[#0a0a0a] border-4 border-white dark:border-[#382E54] hacker:border-[#166534] shadow-sm flex items-center justify-center overflow-hidden p-0.5 group-hover:scale-105 transition-transform ${isMe ? `ring-4 ${targetOs === 'linux' ? 'ring-orange-500' : targetOs === 'windows' ? 'ring-blue-500' : 'ring-pink-500'}` : ''}`}>
                                <img src={getAvatarUrl(player.avatar)} alt="avatar" className="w-full h-full object-cover rounded-full" />
                              </div>
                            </Link>

                            <div className="truncate min-w-0">
                              <p className={`font-black truncate text-sm md:text-base tracking-wide flex items-center gap-2 ${isMe ? styles.textMain : (isHacker ? 'text-green-500 group-hover:text-green-400' : isDark ? 'text-white group-hover:text-yellow-400' : 'text-orange-950 group-hover:text-orange-600')}`}>
                                <Link href={playerProfileUrl} className="truncate hover:underline cursor-pointer transition-all">
                                  {player.displayName || player.username.split('@')[0]}
                                </Link>
                                {isMe && <span className={`text-[10px] px-2.5 py-1 rounded-lg text-[#1E1B2E] font-black uppercase tracking-widest flex-shrink-0 ${styles.bgMain}`}>You</span>}
                              </p>
                              <p className={`text-[10px] md:hidden mt-1 uppercase tracking-wider font-black ${rankDetails.color}`}>
                                {rankDetails.title}
                              </p>
                            </div>
                          </div>

                          <div className="col-span-3 md:col-span-2 hidden md:flex flex-col items-center justify-center">
                            <div className={`inline-flex items-center justify-center rounded-xl px-3 py-1.5 text-xs font-black shadow-sm transition-colors ${styles.bgLight} ${styles.textMain}`}>
                              LVL {level}
                            </div>
                            <span className={`text-[10px] mt-2 uppercase tracking-widest font-black ${rankDetails.color}`}>
                              {rankDetails.title}
                            </span>
                          </div>

                          <div className={`col-span-3 md:col-span-3 text-right font-black text-base md:text-xl tracking-wider cute-header ${isMe ? styles.textMain : (isHacker ? 'text-green-600 group-hover:text-green-400' : isDark ? 'text-white/70 group-hover:text-yellow-400' : 'text-orange-800 group-hover:text-orange-600')}`}>
                            {exp.toLocaleString()}
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