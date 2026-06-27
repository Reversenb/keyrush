"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import HackerLoadingScreen from '@/components/HackerLoadingScreen';
import {
  Map as MapIcon, Lock, Play, Zap, Trophy,
  Terminal, ShieldCheck, Flag, Sparkles, Code, ChevronRight,
  MonitorPlay, Network, Bell, LayoutDashboard, User as UserIcon, LogOut, Menu, X, Sun, Moon
} from 'lucide-react';

// =========================================================================
// 🌟 ข้อมูลโหมดการเล่นต่างๆ (Map Nodes)
// =========================================================================
const MAP_MODES = [
  {
    id: 'campaign',
    title: 'Campaign Mode',
    subtitle: 'Sector 01',
    desc: 'ลุยด่านฝึกพิมพ์ตามเนื้อเรื่องสุดมันส์ พร้อมเรียนรู้คำสั่งพื้นฐานไปในตัว โหมดหลักสำหรับสายลับหน้าใหม่!',
    icon: MapIcon,
    isLocked: false,
    link: '/campaignpage',
    colorTheme: 'orange',
  },
  {
    id: 'survival',
    title: 'Survival Mode',
    subtitle: 'Sector 02',
    desc: 'เอาชีวิตรอดจากกองทัพบั๊ก! พิมพ์คำสั่งให้เร็วและแม่นยำที่สุดก่อนที่เวลาจะหมดลง (เร็วๆ นี้)',
    icon: Zap,
    isLocked: true,
    link: '#',
    colorTheme: 'slate',
  },
  {
    id: 'arena',
    title: 'Hacker Arena',
    subtitle: 'Sector 03',
    desc: 'ประลองความเร็วในการพิมพ์กับสายลับคนอื่นๆ บนกระดานผู้นำระดับโลก ใครจะไวกว่ากัน? (เร็วๆ นี้)',
    icon: Trophy,
    isLocked: true,
    link: '#',
    colorTheme: 'slate',
  }
];

export default function KeyRushOrangeLandingPage() {
  const router = useRouter();
  const pathname = usePathname();

  // 🌟 Theme State
  const { theme: activeTheme, resolvedTheme, setTheme } = useTheme();
  const currentTheme = activeTheme === 'system' ? resolvedTheme : activeTheme;

  // 🌟 User State
  const [user, setUser] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  // 🌟 Navbar State
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
    const savedUser = localStorage.getItem('keyrush_user');
    const token = localStorage.getItem('keyrush_token');

    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Parse error", e);
      }
    }
    setTimeout(() => setLoading(false), 600);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        const toggleButton = document.getElementById('mobile-menu-toggle');
        if (toggleButton && !toggleButton.contains(event.target as Node)) {
          setIsMobileMenuOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const getShowName = () => {
    if (!user) return 'เพื่อนใหม่';
    if (user.displayName && user.displayName.trim() !== '') return user.displayName;
    if (user.email) return user.email.split('@')[0];
    if (user.username) return user.username.split('@')[0];
    return 'เพื่อนใหม่';
  };

  const handleLogout = () => {
    localStorage.removeItem('keyrush_token');
    localStorage.removeItem('keyrush_user');
    setUser(null);
    setShowDropdown(false);
    router.push('/login');
  };

  // 🌟 ฟังก์ชันสลับ 3 ธีม (Cute -> Dark -> Hacker -> Cute)
  const cycleTheme = () => {
    if (currentTheme === 'light') setTheme('dark');
    else if (currentTheme === 'dark') setTheme('hacker');
    else setTheme('light');
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 20 } }
  };
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  if (!isMounted) return <div className="min-h-screen bg-background"></div>;

  const avatarUrl = user?.avatar?.startsWith('data:')
    ? user.avatar
    : `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.avatar || 'Felix'}`;

  // 🌟 สไตล์ปุ่ม 3D ใน Dropdown 🌟
  const dropdownBtnStyle = "w-full text-left px-4 py-3 text-sm font-black rounded-2xl flex items-center justify-between group nav-squishy border-4 bg-white dark:bg-yellow-400 hacker:bg-green-500 text-orange-600 dark:text-[#1E1B2E] hacker:text-[#0a0a0a] border-orange-200 dark:border-yellow-500 hacker:border-green-600 shadow-[0_4px_0_#fed7aa] dark:shadow-[0_4px_0_#ca8a04] hacker:shadow-[0_4px_0_#15803d] hover:bg-orange-50 dark:hover:bg-yellow-300 hacker:hover:bg-green-400";

  return (
    <div className="min-h-screen bg-background font-sans font-black overflow-x-hidden relative selection:bg-orange-500/20 dark:selection:bg-yellow-400/20 hacker:selection:bg-green-500/20 scroll-smooth text-foreground transition-colors duration-500">

      {/* 🌸 สไตล์ 3D และ แอนิเมชัน 🌸 */}
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
          box-shadow: 0 10px 30px rgba(249, 115, 22, 0.15);
          transition: all 0.3s ease;
        }

        .dark .glass-card {
          background: rgba(45, 34, 59, 0.7); 
          border-color: #382E54;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }

        .hacker .glass-card {
          background: rgba(10, 10, 10, 0.85); 
          border-color: #16a34a; 
          box-shadow: 0 10px 30px rgba(34, 197, 94, 0.15);
        }
        
        .btn-squishy {
          transition: transform 0.1s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.1s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s, border-color 0.2s, color 0.2s;
        }
        .btn-squishy:hover { transform: translateY(-2px); }
        .btn-squishy:active { transform: translateY(6px); box-shadow: 0 0 0 transparent !important; }

        .nav-squishy {
          transition: transform 0.1s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.1s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s, color 0.2s, border-color 0.2s;
        }
        .nav-squishy:active { transform: translateY(4px); box-shadow: 0 0 0 transparent !important; }

        .cute-header {
          text-shadow: 3px 3px 0px rgba(255, 255, 255, 1), 
                       -1px -1px 0px rgba(255, 255, 255, 1), 
                       1px -1px 0px rgba(255, 255, 255, 1), 
                       -1px 1px 0px rgba(255, 255, 255, 1);
          letter-spacing: -0.02em;
        }

        .dark .cute-header { text-shadow: 2px 2px 0px rgba(0, 0, 0, 0.3); }
        .hacker .cute-header { text-shadow: 2px 2px 0px rgba(0, 0, 0, 0.8); }
      `}</style>

      {/* 🎈 Background Blobs (ส้ม -> เหลือง -> เขียว) 🎈 */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-400 dark:bg-yellow-500 hacker:bg-green-600 rounded-full blur-[100px] opacity-40 dark:opacity-10 hacker:opacity-10 float-element pointer-events-none z-0 transition-colors duration-500" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-amber-400 dark:bg-yellow-600 hacker:bg-green-700 rounded-full blur-[100px] opacity-30 dark:opacity-10 hacker:opacity-10 float-delayed pointer-events-none z-0 transition-colors duration-500" style={{ animationDelay: '1.5s' }} />
      <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] bg-orange-300 dark:bg-yellow-400 hacker:bg-green-500 rounded-full blur-[100px] opacity-30 dark:opacity-10 hacker:opacity-10 float-element pointer-events-none z-0 transition-colors duration-500" style={{ animationDelay: '2s' }} />

      <AnimatePresence>
        {loading && <HackerLoadingScreen />}
      </AnimatePresence>

      {/* ================= EMBEDDED HEADER ================= */}
      <header className="relative z-50 flex items-center justify-between border-b-4 border-white dark:border-[#382E54] hacker:border-green-800 bg-white/70 dark:bg-[#1E1B2E]/70 hacker:bg-[#0a0a0a]/80 backdrop-blur-md px-6 md:px-10 py-4 sticky top-0 shadow-sm transition-colors duration-500">

        {/* 🌟 โลโก้ KEYRUSH (ไม่มีกรอบ) 🌟 */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 transition-all hover:scale-105 cursor-pointer group no-underline">
            <div className={`w-10 h-10 bg-orange-500 dark:bg-yellow-400 hacker:bg-green-500 text-white dark:text-[#1E1B2E] hacker:text-[#0a0a0a] rounded-2xl shadow-md flex items-center justify-center transform -rotate-6 border-2 border-white dark:border-transparent hacker:border-transparent group-hover:rotate-0 transition-all`}>
              <Terminal size={22} strokeWidth={4} />
            </div>
            <h2 className={`text-2xl font-black tracking-tight text-orange-600 dark:text-yellow-400 hacker:text-green-500 m-0`}>KEYRUSH</h2>
          </Link>
        </div>

        <div className="flex items-center gap-4 md:gap-8">
          {/* เมนูหลักบน Landing Page */}
          <nav className="hidden lg:flex items-center gap-2">
            {['จุดเด่น ✨', 'ด่านฝึก 🎯'].map((name) => (
              <a key={name} href={name === 'จุดเด่น ✨' ? '#features' : '#path'} className="relative px-5 py-2.5 text-sm font-black transition-all duration-300 rounded-2xl group nav-squishy border-4 border-transparent text-orange-800 dark:text-white/60 hacker:text-white/70 hover:bg-white dark:hover:bg-yellow-400 hacker:hover:bg-[#111] hover:text-orange-600 dark:hover:text-[#1E1B2E] hacker:hover:text-green-400 hover:border-orange-200 dark:hover:border-yellow-500 hacker:hover:border-green-600 hover:shadow-[0_4px_0_#fed7aa] dark:hover:shadow-[0_4px_0_#ca8a04] hacker:hover:shadow-[0_4px_0_#15803d] hover:-translate-y-1">
                <span className="relative z-10">{name}</span>
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 md:gap-4 ml-4 border-l-4 border-white dark:border-[#382E54] hacker:border-green-800 pl-4 md:pl-6 transition-colors">

            {/* 🌟 ปุ่มสลับธีม 3D 🌟 */}
            <button onClick={cycleTheme} className="btn-squishy hidden md:flex items-center justify-center p-2.5 rounded-2xl border-4 bg-white dark:bg-yellow-400 hacker:bg-[#0a0a0a] text-orange-600 dark:text-[#1E1B2E] hacker:text-green-500 border-orange-200 dark:border-yellow-500 hacker:border-green-600 shadow-[0_6px_0_#fed7aa] dark:shadow-[0_6px_0_#ca8a04] hacker:shadow-[0_6px_0_#15803d] hover:bg-orange-50 dark:hover:bg-yellow-300 hover:bg-[#111]">
              {currentTheme === 'dark' && <Moon size={20} strokeWidth={3} />}
              {currentTheme === 'light' && <Sun size={20} strokeWidth={3} />}
              {currentTheme === 'hacker' && <Code size={20} strokeWidth={3} />}
            </button>

            {user ? (
              <div className="relative" ref={dropdownRef}>
                <div
                  className="btn-squishy bg-center bg-no-repeat aspect-square bg-cover rounded-2xl size-12 cursor-pointer origin-center border-4 bg-white dark:bg-yellow-400 hacker:bg-[#0a0a0a] border-orange-200 dark:border-yellow-500 hacker:border-green-600 shadow-[0_6px_0_#fed7aa] dark:shadow-[0_6px_0_#ca8a04] hacker:shadow-[0_6px_0_#15803d]"
                  onClick={() => setShowDropdown(!showDropdown)}
                  style={{ backgroundImage: `url("${avatarUrl}")` }}
                ></div>

                <AnimatePresence>
                  {showDropdown && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="absolute right-0 mt-4 w-64 bg-white/95 dark:bg-[#1E1B2E]/95 hacker:bg-[#0a0a0a]/95 backdrop-blur-2xl border-4 border-white dark:border-[#382E54] hacker:border-green-600 rounded-[24px] shadow-xl overflow-hidden z-50 p-3 origin-top-right"
                    >
                      <div className="px-4 py-3 mb-3 bg-orange-50/80 dark:bg-black/20 hacker:bg-[#111] rounded-2xl border-2 border-white dark:border-white/5 hacker:border-green-800">
                        <p className="text-orange-600 dark:text-yellow-400 hacker:text-green-500 font-black truncate text-base">{getShowName()}</p>
                        <p className="text-xs text-orange-400 dark:text-white/50 hacker:text-white/60 truncate mt-0.5 font-black">{user.email || user.username}</p>
                      </div>

                      <div className="flex flex-col gap-2">
                        {user?.role?.toLowerCase() === 'admin' && (
                          <button onClick={() => { setShowDropdown(false); router.push('/admin/missions'); }} className={dropdownBtnStyle}>
                            <div className="flex items-center gap-3">
                              <ShieldCheck size={18} strokeWidth={3} className="group-hover:rotate-12 transition-transform" /> Mission Manager
                            </div>
                          </button>
                        )}
                        <button onClick={() => { setShowDropdown(false); router.push('/dashboard'); }} className={dropdownBtnStyle}>
                          <div className="flex items-center gap-3">
                            <LayoutDashboard size={18} strokeWidth={3} className="group-hover:scale-110 transition-transform" /> Dashboard
                          </div>
                        </button>
                        <button onClick={() => { setShowDropdown(false); router.push('/profile'); }} className={dropdownBtnStyle}>
                          <div className="flex items-center gap-3">
                            <UserIcon size={18} strokeWidth={3} className="group-hover:scale-110 transition-transform" /> Edit Profile
                          </div>
                        </button>

                        {/* 🌟 ปุ่ม Theme Toggle ใน Dropdown 🌟 */}
                        <button onClick={cycleTheme} className={dropdownBtnStyle}>
                          <div className="flex items-center gap-3">
                            {currentTheme === 'dark' && <Moon size={18} strokeWidth={3} className="group-hover:scale-110 transition-transform" />}
                            {currentTheme === 'light' && <Sun size={18} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />}
                            {currentTheme === 'hacker' && <Code size={18} strokeWidth={3} className="group-hover:scale-110 transition-transform" />}
                            Theme
                          </div>
                          <span className="text-[10px] opacity-60 uppercase tracking-wider">
                            {currentTheme === 'dark' ? 'Dark' : currentTheme === 'hacker' ? 'Hacker' : 'Cute'}
                          </span>
                        </button>

                        <div className="h-1 w-full bg-orange-100/50 dark:bg-white/5 hacker:bg-green-900/50 my-1 rounded-full"></div>

                        <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-sm font-black rounded-2xl flex items-center gap-3 group nav-squishy border-4 bg-white dark:bg-[#1E1B2E] hacker:bg-[#0a0a0a] text-rose-500 dark:text-rose-400 hacker:text-rose-500 border-rose-200 dark:border-rose-900 hacker:border-rose-900 shadow-[0_4px_0_#fecdd3] dark:shadow-[0_4px_0_#4c1d95] hacker:shadow-[0_4px_0_#881337] hover:bg-rose-50 dark:hover:bg-[#2D223B] hacker:hover:bg-[#111]">
                          <LogOut size={18} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" /> ออกจากระบบ
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link href="/login" className="btn-squishy flex items-center justify-center px-6 py-2.5 font-black transition-all border-4 bg-white dark:bg-yellow-400 hacker:bg-green-500 text-orange-600 dark:text-[#1E1B2E] hacker:text-[#0a0a0a] border-orange-200 dark:border-yellow-500 hacker:border-green-600 shadow-[0_6px_0_#fed7aa] dark:shadow-[0_6px_0_#ca8a04] hacker:shadow-[0_6px_0_#15803d] hover:bg-orange-50 dark:hover:bg-yellow-300 hacker:hover:bg-green-400 rounded-2xl text-sm">
                เข้าสู่ระบบ 🚀
              </Link>
            )}

            <button id="mobile-menu-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden btn-squishy flex items-center justify-center p-2.5 font-black transition-all border-4 bg-white dark:bg-yellow-400 hacker:bg-[#0a0a0a] text-orange-600 dark:text-[#1E1B2E] hacker:text-green-500 border-orange-200 dark:border-yellow-500 hacker:border-green-600 shadow-[0_6px_0_#fed7aa] dark:shadow-[0_6px_0_#ca8a04] hacker:shadow-[0_6px_0_#15803d] hover:bg-orange-50 dark:hover:bg-yellow-300 hacker:hover:bg-[#111] rounded-2xl">
              {isMobileMenuOpen ? <X size={24} strokeWidth={4} /> : <Menu size={24} strokeWidth={4} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              ref={mobileMenuRef}
              className="absolute top-full left-0 w-full bg-white/95 dark:bg-[#1E1B2E]/95 hacker:bg-[#0a0a0a]/95 backdrop-blur-2xl border-b-4 border-white dark:border-[#382E54] hacker:border-green-800 shadow-xl flex flex-col p-5 space-y-2 lg:hidden z-40"
            >
              {['จุดเด่น ✨', 'ด่านฝึก 🎯'].map((name) => (
                <a key={name} href={name === 'จุดเด่น ✨' ? '#features' : '#path'} onClick={() => setIsMobileMenuOpen(false)} className="px-5 py-4 rounded-2xl text-base font-black text-orange-800 dark:text-white/60 hacker:text-white/70 hover:bg-orange-50 dark:hover:bg-[#382E54] hacker:hover:bg-[#111] hover:text-orange-500 dark:hover:text-yellow-400 hacker:hover:text-green-400 border-2 border-transparent transition-all">
                  {name}
                </a>
              ))}
              <div className="w-full h-1 bg-orange-100/50 dark:bg-white/10 hacker:bg-green-900/50 my-2 rounded-full"></div>
              <button onClick={cycleTheme} className={dropdownBtnStyle}>
                <div className="flex items-center gap-3">
                  {currentTheme === 'dark' && <Moon size={20} strokeWidth={3} />}
                  {currentTheme === 'light' && <Sun size={20} strokeWidth={3} />}
                  {currentTheme === 'hacker' && <Code size={20} strokeWidth={3} />}
                  Switch to {currentTheme === 'dark' ? 'Hacker Mode' : currentTheme === 'hacker' ? 'Cute Mode' : 'Dark Mode'}
                </div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ================= HERO SECTION ================= */}
      <main className="relative z-10 container mx-auto px-6 pt-16 md:pt-28 pb-20 flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-8">

        {/* ฝั่งซ้าย: ข้อความ */}
        <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="flex flex-col items-center lg:items-start text-center lg:text-left flex-1">
          <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white dark:bg-[#2D223B] hacker:bg-[#0a0a0a] border-4 border-white dark:border-[#4B3965] hacker:border-green-600 text-orange-500 dark:text-yellow-400 hacker:text-green-500 text-sm font-black mb-8 shadow-sm transition-colors">
            <Sparkles size={16} strokeWidth={3} className="animate-pulse" />
            ระบบฝึกพิมพ์คำสั่งสุดน่ารัก! 🎀
          </motion.div>

          <motion.h2 variants={fadeInUp} className="cute-header text-6xl md:text-7xl font-black text-orange-950 dark:text-white hacker:text-white leading-[1.1] mb-6 drop-shadow-sm transition-colors">
            Master the <br />
            <span className="text-orange-500 dark:text-yellow-400 hacker:text-green-500">Command Line</span>
          </motion.h2>

          <motion.p variants={fadeInUp} className="text-lg md:text-xl text-orange-800 dark:text-white/70 hacker:text-white/70 mb-10 max-w-xl leading-relaxed font-black transition-colors">
            อยากใช้ Terminal คล่องๆ แต่กลัวเผลอลบไฟล์พังใช่ไหม? หมดห่วงได้เลย!
            ฝึกพิมพ์ในระบบจำลองสุดน่ารัก ลุยด่านต่างๆ สนุก ปลอดภัย และเก่งขึ้นชัวร์ 💖
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            {/* 🌟 ปุ่ม 3D เริ่มฝึกพิมพ์ 🌟 */}
            <Link href={user ? "/dashboard" : "/login"} className="btn-squishy flex items-center justify-center gap-3 px-8 py-5 text-lg font-black text-white dark:text-[#1E1B2E] hacker:text-[#0a0a0a] bg-orange-500 dark:bg-yellow-400 hacker:bg-green-500 border-4 border-white dark:border-yellow-600 hacker:border-green-600 rounded-[30px] shadow-[0_8px_0_#c2410c] dark:shadow-[0_8px_0_#ca8a04] hacker:shadow-[0_8px_0_#15803d] hover:bg-orange-400 dark:hover:bg-yellow-300 hacker:hover:bg-green-400 transition-colors">
              <Play size={20} fill="currentColor" /> เริ่มฝึกพิมพ์เลย!
            </Link>

            {/* 🌟 ปุ่ม 3D ดูด่าน 🌟 */}
            <a href="#path" className="btn-squishy flex items-center justify-center gap-3 px-8 py-5 text-lg font-black text-orange-600 dark:text-yellow-400 hacker:text-green-500 bg-white dark:bg-[#2D223B] hacker:bg-[#0a0a0a] border-4 border-orange-200 dark:border-[#4B3965] hacker:border-green-600 rounded-[30px] shadow-[0_8px_0_#fed7aa] dark:shadow-[0_8px_0_#1E1B2E] hacker:shadow-[0_8px_0_#15803d] hover:bg-orange-50 dark:hover:bg-[#382E54] hacker:hover:bg-[#111] transition-colors">
              🎯 ดูด่านทั้งหมด
            </a>
          </motion.div>
        </motion.div>

        {/* ฝั่งขวา: Cute Terminal Mockup */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.3, type: "spring" }} className="flex-1 w-full max-w-2xl">
          <div className="glass-card overflow-hidden group text-left transform-gpu hover:scale-[1.02] transition-all duration-500 relative">
            <div className="flex items-center px-6 py-4 bg-white/90 dark:bg-[#2D223B]/90 hacker:bg-[#0a0a0a]/90 border-b-4 border-white dark:border-[#382E54] hacker:border-green-800 relative z-30 transition-colors">
              <div className="flex gap-2.5">
                <div className="size-4 rounded-full bg-red-400 shadow-inner"></div>
                <div className="size-4 rounded-full bg-orange-400 dark:bg-yellow-400 hacker:bg-green-400 shadow-inner"></div>
                <div className="size-4 rounded-full bg-green-400 shadow-inner"></div>
              </div>
              <div className="mx-auto flex items-center gap-2 text-sm text-orange-500 dark:text-yellow-400 hacker:text-green-500 font-black tracking-widest cute-header transition-colors">
                <Terminal size={18} strokeWidth={3} /> cute_terminal.exe
              </div>
            </div>

            <div className="p-6 md:p-8 font-mono text-orange-800 dark:text-white/80 hacker:text-white/80 text-sm md:text-base relative z-10 min-h-[280px] font-black bg-white/60 dark:bg-black/30 hacker:bg-black/60 transition-colors">
              <div className="mb-3"><span className="text-orange-600 dark:text-yellow-400 hacker:text-green-500 font-black">student@keyrush</span>:<span className="text-orange-400 dark:text-yellow-600 hacker:text-green-600">~</span>$ <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>./start_magic.sh</motion.span></div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="mb-3 text-orange-500 dark:text-yellow-300 hacker:text-green-400 drop-shadow-sm font-black">[SYSTEM] 🪄 กำลังร่ายมนตร์สร้างเซิร์ฟเวอร์จำลอง...</motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2 }} className="mb-3">โหลดโมดูล 1: จัดการไฟล์น่ารักๆ... <span className="text-green-500 dark:text-green-400 hacker:text-green-400 font-black">[สำเร็จ 💖]</span></motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.7 }} className="mb-3">เชื่อมต่อกับโลกไซเบอร์... <span className="text-green-500 dark:text-green-400 hacker:text-green-400 font-black">[เรียบร้อย ☁️]</span></motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.2 }} className="mb-8 text-orange-600 dark:text-yellow-400 hacker:text-green-500 font-black">Status: พร้อมแล้ว! รอรับคำสั่งจ้า 🚀</motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 4 }} className="flex items-center">
                <span className="text-orange-600 dark:text-yellow-400 hacker:text-green-500 font-black mr-2">student@keyrush</span>:<span className="text-orange-400 dark:text-yellow-600 hacker:text-green-600">~</span>$
                <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-3 h-6 bg-orange-500 dark:bg-yellow-400 hacker:bg-green-500 ml-2 block rounded-sm"></motion.span>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* ================= FEATURES SECTION ================= */}
      <section id="features" className="relative z-10 container mx-auto px-6 py-24">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeInUp} className="text-center mb-16">
          <h3 className="cute-header text-5xl md:text-6xl font-black text-orange-950 dark:text-white hacker:text-white mb-4 transition-colors">Learn by <span className="text-orange-500 dark:text-yellow-400 hacker:text-green-500">Doing</span> ✨</h3>
          <p className="text-orange-600 dark:text-white/60 hacker:text-white/60 max-w-2xl mx-auto font-black text-xl uppercase tracking-widest transition-colors">สนุก ปลอดภัย และเก่งขึ้นได้อย่างรวดเร็ว!</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} transition={{ delay: 0.1 }} className="glass-card p-10 hover:-translate-y-2 transition-transform duration-500 text-center flex flex-col items-center group">
            <div className="w-20 h-20 bg-orange-100 dark:bg-yellow-400/10 hacker:bg-green-500/10 text-orange-500 dark:text-yellow-400 hacker:text-green-500 rounded-[24px] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform float-element border-4 border-white dark:border-[#382E54] hacker:border-green-800 shadow-sm">
              <Code size={40} strokeWidth={3} />
            </div>
            <h4 className="text-2xl font-black text-orange-950 dark:text-white hacker:text-white mb-3 cute-header transition-colors">Interactive Learning</h4>
            <p className="text-orange-800 dark:text-white/70 hacker:text-white/70 font-black leading-relaxed transition-colors">ทำแบบฝึกหัดทีละขั้นตอน เรียนรู้จากโจทย์ปัญหาที่มักพบเจอจริงในการทำงาน</p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} transition={{ delay: 0.2 }} className="glass-card p-10 hover:-translate-y-2 transition-transform duration-500 text-center flex flex-col items-center group">
            <div className="w-20 h-20 bg-amber-100 dark:bg-amber-400/10 hacker:bg-green-500/10 text-amber-500 dark:text-amber-400 hacker:text-green-500 rounded-[24px] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform float-element border-4 border-white dark:border-[#382E54] hacker:border-green-800 shadow-sm" style={{ animationDelay: '1s' }}>
              <ShieldCheck size={40} strokeWidth={3} />
            </div>
            <h4 className="text-2xl font-black text-orange-950 dark:text-white hacker:text-white mb-3 cute-header transition-colors">Virtual Environment</h4>
            <p className="text-orange-800 dark:text-white/70 hacker:text-white/70 font-black leading-relaxed transition-colors">ทดลองคำสั่งลบหรือย้ายไฟล์ได้อย่างอิสระในเซิร์ฟเวอร์จำลอง ปลอดภัย 100%</p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} transition={{ delay: 0.3 }} className="glass-card p-10 hover:-translate-y-2 transition-transform duration-500 text-center flex flex-col items-center group">
            <div className="w-20 h-20 bg-yellow-100 dark:bg-green-400/10 hacker:bg-green-500/10 text-yellow-500 dark:text-green-400 hacker:text-green-500 rounded-[24px] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform float-element border-4 border-white dark:border-[#382E54] hacker:border-green-800 shadow-sm" style={{ animationDelay: '2s' }}>
              <Sparkles size={40} strokeWidth={3} />
            </div>
            <h4 className="text-2xl font-black text-orange-950 dark:text-white hacker:text-white mb-3 cute-header transition-colors">Real-time Validation</h4>
            <p className="text-orange-800 dark:text-white/70 hacker:text-white/70 font-black leading-relaxed transition-colors">ระบบตรวจสอบคำสั่งแบบทันที พร้อมแสดงผลลัพธ์ และมีคำแนะนำคอยช่วยเหลือ</p>
          </motion.div>
        </div>
      </section>

      {/* ================= MODULES SECTION ================= */}
      <section id="path" className="relative z-10 py-24 bg-white/50 dark:bg-black/20 hacker:bg-[#0a0a0a]/80 border-t-4 border-white dark:border-[#382E54] hacker:border-green-900 transition-colors">
        <div className="container mx-auto px-6 max-w-5xl">
          <motion.h3 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="cute-header text-4xl md:text-5xl font-black text-orange-950 dark:text-white hacker:text-white mb-12 text-center transition-colors">
            Training <span className="text-orange-500 dark:text-yellow-400 hacker:text-green-500">Modules</span> 💾
          </motion.h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} transition={{ delay: 0.1 }} className="glass-card p-6 hover:-translate-y-1 transition-all group flex items-start gap-5 border-l-8 border-l-orange-500 dark:border-l-yellow-400 hacker:border-l-green-500 cursor-pointer">
              <div className="w-16 h-16 bg-white dark:bg-[#382E54] hacker:bg-[#0a0a0a] border-4 border-orange-100 dark:border-transparent hacker:border-green-600 rounded-[20px] flex items-center justify-center text-orange-500 dark:text-yellow-400 hacker:text-green-500 group-hover:scale-110 transition-transform shadow-sm flex-shrink-0">
                <Terminal size={32} strokeWidth={3} />
              </div>
              <div>
                <div className="text-white dark:text-[#1E1B2E] hacker:text-[#0a0a0a] bg-orange-500 dark:bg-yellow-400 hacker:bg-green-500 px-3 py-1 rounded-xl font-black text-xs inline-block mb-2 border-2 border-white dark:border-transparent hacker:border-transparent shadow-sm tracking-wider">MODULE 01</div>
                <h5 className="text-xl font-black text-orange-950 dark:text-white hacker:text-white mb-1">Linux: Basic Navigation</h5>
                <p className="text-orange-700 dark:text-white/60 hacker:text-white/60 font-black text-sm">pwd, ls, cd, mkdir, touch, rm...</p>
              </div>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} transition={{ delay: 0.2 }} className="glass-card p-6 hover:-translate-y-1 transition-all group flex items-start gap-5 border-l-8 border-l-orange-400 dark:border-l-green-400 hacker:border-l-green-500 cursor-pointer">
              <div className="w-16 h-16 bg-white dark:bg-[#382E54] hacker:bg-[#0a0a0a] border-4 border-orange-100 dark:border-transparent hacker:border-green-600 rounded-[20px] flex items-center justify-center text-orange-400 dark:text-green-400 hacker:text-green-500 group-hover:scale-110 transition-transform shadow-sm flex-shrink-0">
                <ShieldCheck size={32} strokeWidth={3} />
              </div>
              <div>
                <div className="text-white dark:text-[#1E1B2E] hacker:text-[#0a0a0a] bg-orange-400 dark:bg-green-400 hacker:bg-green-500 px-3 py-1 rounded-xl font-black text-xs inline-block mb-2 border-2 border-white dark:border-transparent hacker:border-transparent shadow-sm tracking-wider">MODULE 02</div>
                <h5 className="text-xl font-black text-orange-950 dark:text-white hacker:text-white mb-1">Linux: Permissions</h5>
                <p className="text-orange-700 dark:text-white/60 hacker:text-white/60 font-black text-sm">grep, chmod, chown, tar, ps, kill...</p>
              </div>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} transition={{ delay: 0.3 }} className="glass-card p-6 hover:-translate-y-1 transition-all group flex items-start gap-5 border-l-8 border-l-amber-500 dark:border-l-blue-400 hacker:border-l-green-500 cursor-pointer">
              <div className="w-16 h-16 bg-white dark:bg-[#382E54] hacker:bg-[#0a0a0a] border-4 border-orange-100 dark:border-transparent hacker:border-green-600 rounded-[20px] flex items-center justify-center text-amber-500 dark:text-blue-400 hacker:text-green-500 group-hover:scale-110 transition-transform shadow-sm flex-shrink-0">
                <MonitorPlay size={32} strokeWidth={3} />
              </div>
              <div>
                <div className="text-white dark:text-[#1E1B2E] hacker:text-[#0a0a0a] bg-amber-500 dark:bg-blue-400 hacker:bg-green-500 px-3 py-1 rounded-xl font-black text-xs inline-block mb-2 border-2 border-white dark:border-transparent hacker:border-transparent shadow-sm tracking-wider">MODULE 03</div>
                <h5 className="text-xl font-black text-orange-950 dark:text-white hacker:text-white mb-1">Windows: CMD Basics</h5>
                <p className="text-orange-700 dark:text-white/60 hacker:text-white/60 font-black text-sm">dir, cd, md, rd, del, copy, cls...</p>
              </div>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} transition={{ delay: 0.4 }} className="glass-card p-6 hover:-translate-y-1 transition-all group flex items-start gap-5 border-l-8 border-l-yellow-500 dark:border-l-purple-400 hacker:border-l-green-500 cursor-pointer">
              <div className="w-16 h-16 bg-white dark:bg-[#382E54] hacker:bg-[#0a0a0a] border-4 border-orange-100 dark:border-transparent hacker:border-green-600 rounded-[20px] flex items-center justify-center text-yellow-500 dark:text-purple-400 hacker:text-green-500 group-hover:scale-110 transition-transform shadow-sm flex-shrink-0">
                <Network size={32} strokeWidth={3} />
              </div>
              <div>
                <div className="text-orange-950 dark:text-white hacker:text-[#0a0a0a] bg-yellow-400 dark:bg-purple-500 hacker:bg-green-500 px-3 py-1 rounded-xl font-black text-xs inline-block mb-2 border-2 border-white dark:border-transparent hacker:border-transparent shadow-sm tracking-wider">MODULE 04</div>
                <h5 className="text-xl font-black text-orange-950 dark:text-white hacker:text-white mb-1">Windows: Network</h5>
                <p className="text-orange-700 dark:text-white/60 hacker:text-white/60 font-black text-sm">ipconfig, ping, tasklist</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ================= BOTTOM CTA ================= */}
      <section className="relative z-10 container mx-auto px-6 py-32 text-center">
        <motion.h3 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="cute-header text-5xl md:text-7xl font-black text-orange-950 dark:text-white hacker:text-white mb-6 transition-colors">Ready to <span className="text-orange-500 dark:text-yellow-400 hacker:text-green-500">Execute?</span> 🚀</motion.h3>
        <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} transition={{ delay: 0.1 }} className="text-orange-800 dark:text-white/70 hacker:text-white/70 mb-10 max-w-xl mx-auto font-black text-xl transition-colors">ระบบพร้อมใช้งานแล้ว เข้าสู่ระบบเพื่อเริ่มการเรียนรู้ของคุณได้เลย ✨</motion.p>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} transition={{ delay: 0.2 }}>
          {/* 🌟 ปุ่ม 3D ใหญ่สุด 🌟 */}
          <Link href={user ? "/dashboard" : "/login"} className="btn-squishy inline-flex items-center justify-center gap-3 px-10 py-6 text-2xl font-black text-white dark:text-[#1E1B2E] hacker:text-[#0a0a0a] bg-orange-500 dark:bg-yellow-400 hacker:bg-green-500 border-4 border-white dark:border-yellow-600 hacker:border-green-600 rounded-[32px] shadow-[0_10px_0_#c2410c] dark:shadow-[0_10px_0_#ca8a04] hacker:shadow-[0_10px_0_#15803d] hover:bg-orange-400 dark:hover:bg-yellow-300 hacker:hover:bg-green-400">
            เริ่มฝึกกันเลย! <ChevronRight size={28} strokeWidth={4} />
          </Link>
        </motion.div>
      </section>

      <footer className="relative z-10 py-10 text-center text-orange-600 dark:text-white/30 hacker:text-white/40 font-black text-sm bg-white/70 dark:bg-[#1E1B2E]/70 hacker:bg-[#0a0a0a]/80 border-t-4 border-white dark:border-[#382E54] hacker:border-green-900 uppercase tracking-widest transition-colors">
        <p>© 2026 KeyRush. Interactive Terminal Training ✨</p>
      </footer>

    </div>
  );
}