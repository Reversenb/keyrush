"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useGoogleLogin } from '@react-oauth/google';
import { apiFetch, clearUserState, logout } from '@/lib/api';

import {
  Map as MapIcon, Lock, Play, Zap, Trophy,
  Terminal, ShieldCheck, Flag, Sparkles, Code, ChevronRight,
  MonitorPlay, Network, Bell, LayoutDashboard, User as UserIcon, LogOut, Menu, X, Sun, Moon, ShoppingBag, Heart, Flame, Cloud, Leaf, Gem,
  CheckCircle, AlertTriangle, RefreshCw
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

  const { theme: activeTheme, resolvedTheme, setTheme } = useTheme();
  const currentTheme = activeTheme === 'system' ? resolvedTheme : activeTheme;

  const [user, setUser] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  // เช็คสิทธิ์ธีมได้ก็ต่อเมื่อรู้ข้อมูลผู้ใช้จริงจาก backend แล้ว (กันรีเซ็ตธีมของคนที่ซื้อไว้ตอนโหลดแรก)
  const [userSynced, setUserSynced] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' as 'success' | 'error' });

  const [showDropdown, setShowDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);

    // แสดงจาก cache ทันทีกัน UI กระพริบ (ปุ่ม Sign In วูบก่อนแล้วค่อยเป็น avatar)
    // — ค่าจริงจะถูก API ยืนยัน/แก้ทับด้านล่างอยู่ดี
    const savedUser = localStorage.getItem('keyrush_user');
    if (savedUser) {
      try { setUser(JSON.parse(savedUser)); } catch (e) { }
    }

    // เช็คสถานะ login จริงจาก backend (cookie ถูกแนบไปเอง) — 200 คือยัง login อยู่, 401 คือไม่/หมดอายุ
    const checkAuthStatus = async () => {
      try {
        const res = await apiFetch('/api/user/progress', {}, { redirectOn401: false });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            setUser(data.data);
            localStorage.setItem('keyrush_user', JSON.stringify(data.data));
          }
        } else if (res.status === 401 || res.status === 403) {
          clearUserState();
          setUser(null);
        }
        setUserSynced(true);
      } catch (e) {
        console.error("Auth status check failed", e);
      }
    };

    checkAuthStatus();
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

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 4000);
  };

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
    setIsMobileMenuOpen(false);
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoggingIn(true);
      try {
        // Backend จะ Set-Cookie (auth_token + csrf_token) กลับมาเอง — ไม่มี token ใน body แล้ว
        const response = await apiFetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: tokenResponse.access_token }),
        }, { redirectOn401: false });

        const data = await response.json();

        if (data.success) {
          localStorage.setItem('keyrush_user', JSON.stringify(data.user));
          // แจ้ง CursorGlow/Navbar ให้โหลดของไอดีใหม่ทันที — กันเอฟเฟกต์เมาส์ของไอดีเก่าค้าง
          window.dispatchEvent(new Event('keyrush-user-updated'));
          setUser(data.user);
          showToast('เข้าสู่ระบบสำเร็จ! 🚀', 'success');

          setTimeout(() => {
            router.push('/welcome');
          }, 800);
        } else {
          showToast(data.message, 'error');
          setIsLoggingIn(false);
        }
      } catch (err: any) {
        showToast(err.message || 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้', 'error');
        setIsLoggingIn(false);
      }
    },
    onError: () => {
      showToast('ยกเลิกการเข้าสู่ระบบด้วย Google', 'error');
      setIsLoggingIn(false);
    },
  });

  const getShowName = () => {
    if (!user) return 'เพื่อนใหม่';
    if (user.displayName && user.displayName.trim() !== '') return user.displayName;
    if (user.email) return user.email.split('@')[0];
    if (user.username) return user.username.split('@')[0];
    return 'เพื่อนใหม่';
  };

  const handleLogout = async () => {
    // ให้ server revoke token + เคลียร์ cookie ก่อน แล้วค่อยเคลียร์ state ฝั่ง client
    await logout();
    setUser(null);
    setShowDropdown(false);
  };

  // 🌟 สลับธีม: พื้นฐาน 2 ธีม (Cute/Dark) + ธีมพรีเมียมที่ "ใส่อยู่" (ระบบเดียวกับ Navbar)
  const equippedThemeId: string | null = user?.activeTheme ?? null;
  const themeRing = ['light', 'dark', ...(equippedThemeId ? [equippedThemeId] : [])];

  // 🔒 ใช้ธีมพรีเมียมที่ไม่ได้ใส่อยู่ไม่ได้ (เช่นค่าเก่าใน localStorage สมัย Hacker ยังฟรี) — เด้งกลับ Cute
  useEffect(() => {
    if (!userSynced || !currentTheme) return;
    if (!themeRing.includes(currentTheme)) setTheme('light');
  }, [userSynced, currentTheme, equippedThemeId]);

  const cycleTheme = () => {
    const idx = themeRing.indexOf(currentTheme || 'light');
    setTheme(themeRing[(idx + 1) % themeRing.length]);
  };

  // ชื่อ + ไอคอนของแต่ละธีม (ครอบคลุมธีมพรีเมียม ไม่งั้นปุ่มจะว่าง/ขึ้น Cute ผิดๆ)
  const THEME_META: Record<string, { label: string; icon: React.ReactNode }> = {
    light: { label: 'Cute', icon: <Sun size={18} strokeWidth={3} /> },
    dark: { label: 'Dark', icon: <Moon size={18} strokeWidth={3} /> },
    hacker: { label: 'Hacker', icon: <Code size={18} strokeWidth={3} /> },
    sakura: { label: 'Sakura', icon: <Heart size={18} strokeWidth={3} fill="currentColor" /> },
    dragon: { label: 'Red Dragon', icon: <Flame size={18} strokeWidth={3} /> },
    sky: { label: 'Sky Blue', icon: <Cloud size={18} strokeWidth={3} fill="currentColor" /> },
    mint: { label: 'Mint', icon: <Leaf size={18} strokeWidth={3} fill="currentColor" /> },
    amethyst: { label: 'Amethyst Night', icon: <Gem size={18} strokeWidth={3} /> },
  };
  const themeMeta = THEME_META[currentTheme || 'light'] || THEME_META.light;
  const nextThemeMeta = THEME_META[themeRing[(themeRing.indexOf(currentTheme || 'light') + 1) % themeRing.length]] || THEME_META.light;

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

  const dropdownBtnStyle = "w-full text-left px-4 py-3 text-sm font-black rounded-2xl flex items-center justify-between group nav-squishy border-4 bg-white dark:bg-yellow-400 hacker:bg-green-500 text-orange-600 dark:text-[#1E1B2E] hacker:text-[#0a0a0a] border-orange-200 dark:border-yellow-500 hacker:border-green-600 shadow-[0_4px_0_#fed7aa] dark:shadow-[0_4px_0_#ca8a04] hacker:shadow-[0_4px_0_#15803d] hover:bg-orange-50 dark:hover:bg-yellow-300 hacker:hover:bg-green-400";

  return (
    // 🌟 ใส่ flex flex-col ที่ div หลัก เพื่อจัดระเบียบและควบคุมให้ Footer อยู่ล่างสุดเสมอ
    <div className="min-h-screen flex flex-col bg-background font-sans font-black overflow-x-hidden relative selection:bg-orange-500/20 dark:selection:bg-yellow-400/20 hacker:selection:bg-green-500/20 text-foreground transition-colors duration-500">

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
          transition: transform 0.1s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.1s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s, border-color 0.2s, color 0.2s, filter 0.35s ease;
        }

        /* ✨ เอฟเฟกต์ปุ่มเรืองแสง .btn-shine ย้ายไปไว้ที่ globals.css แล้ว (ใช้ร่วมได้ทุกหน้า) */
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

      {/* 🌟 ย้ายก้อน Blobs มาใส่กล่อง overflow-hidden เพื่อซ่อนส่วนที่ล้นทะลุจอไม่ให้เพิ่มความยาวหน้าเว็บ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-400 dark:bg-yellow-500 hacker:bg-green-600 rounded-full blur-[100px] opacity-40 dark:opacity-10 hacker:opacity-10 float-element transition-colors duration-500" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-amber-400 dark:bg-yellow-600 hacker:bg-green-700 rounded-full blur-[100px] opacity-30 dark:opacity-10 hacker:opacity-10 float-delayed transition-colors duration-500" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] bg-orange-300 dark:bg-yellow-400 hacker:bg-green-500 rounded-full blur-[100px] opacity-30 dark:opacity-10 hacker:opacity-10 float-element transition-colors duration-500" style={{ animationDelay: '2s' }} />
      </div>

      {/* 🌟 Custom Toast Pop-up */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`fixed top-8 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-6 py-4 border-4 rounded-[24px] backdrop-blur-xl shadow-xl transition-colors duration-500
              ${toast.type === 'success'
                ? 'bg-white dark:bg-[#1E1B2E] hacker:bg-[#0a0a0a] border-green-300 dark:border-green-400 hacker:border-green-600 text-green-600 dark:text-green-400 hacker:text-green-500'
                : 'bg-white dark:bg-[#1E1B2E] hacker:bg-[#0a0a0a] border-red-300 dark:border-rose-500 hacker:border-rose-700 text-red-600 dark:text-rose-400 hacker:text-rose-500'
              }`}
          >
            {toast.type === 'success' ? <CheckCircle size={24} strokeWidth={3} /> : <AlertTriangle size={24} strokeWidth={3} />}
            <p className="font-black text-sm md:text-base tracking-wide">{toast.msg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="relative z-50 flex items-center justify-between border-b-4 border-white dark:border-[#382E54] hacker:border-green-800 bg-white/70 dark:bg-[#1E1B2E]/70 hacker:bg-[#0a0a0a]/80 backdrop-blur-md px-6 md:px-10 py-4 sticky top-0 shadow-sm transition-colors duration-500">
        <div className="flex items-center gap-8">
          <Link href="/" className="glow-hover flex items-center gap-3 transition-all hover:scale-105 cursor-pointer group no-underline">
            <div className={`w-10 h-10 bg-orange-500 dark:bg-yellow-400 hacker:bg-green-500 text-white dark:text-[#1E1B2E] hacker:text-[#0a0a0a] rounded-2xl shadow-md flex items-center justify-center transform -rotate-6 border-2 border-white dark:border-transparent hacker:border-transparent group-hover:rotate-0 transition-all`}>
              <Terminal size={22} strokeWidth={4} />
            </div>
            <h2 className={`text-2xl font-black tracking-tight text-orange-600 dark:text-yellow-400 hacker:text-green-500 m-0`}>KeyRush</h2>
          </Link>
        </div>

        <div className="flex items-center gap-4 md:gap-8">
          <nav className="hidden lg:flex items-center gap-2">
            {['จุดเด่น ✨', 'บทเรียน 🎯'].map((name) => {
              const targetId = name === 'จุดเด่น ✨' ? 'features' : 'path';
              return (
                <a
                  key={name}
                  href={`#${targetId}`}
                  onClick={(e) => handleScrollTo(e, targetId)}
                  className="relative px-5 py-2.5 text-sm font-black transition-all duration-300 rounded-2xl group nav-squishy border-4 border-transparent text-orange-800 dark:text-white/60 hacker:text-white/70 hover:bg-white dark:hover:bg-yellow-400 hacker:hover:bg-[#111] hover:text-orange-600 dark:hover:text-[#1E1B2E] hacker:hover:text-green-400 hover:border-orange-200 dark:hover:border-yellow-500 hacker:hover:border-green-600 hover:shadow-[0_4px_0_#fed7aa] dark:hover:shadow-[0_4px_0_#ca8a04] hacker:hover:shadow-[0_4px_0_#15803d] hover:-translate-y-1"
                >
                  <span className="relative z-10">{name}</span>
                </a>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 md:gap-4 ml-4 border-l-4 border-white dark:border-[#382E54] hacker:border-green-800 pl-4 md:pl-6 transition-colors">
            <button onClick={cycleTheme} className="btn-squishy hidden md:flex items-center justify-center p-2.5 rounded-2xl border-4 bg-white dark:bg-yellow-400 hacker:bg-[#0a0a0a] text-orange-600 dark:text-[#1E1B2E] hacker:text-green-500 border-orange-200 dark:border-yellow-500 hacker:border-green-600 shadow-[0_6px_0_#fed7aa] dark:shadow-[0_6px_0_#ca8a04] hacker:shadow-[0_6px_0_#15803d]">
              {themeMeta.icon}
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
                        <button onClick={() => { setShowDropdown(false); router.push('/map'); }} className={dropdownBtnStyle}>
                          <div className="flex items-center gap-3">
                            <MapIcon size={18} strokeWidth={3} className="group-hover:scale-110 transition-transform" /> Mission
                          </div>
                        </button>
                        <button onClick={() => { setShowDropdown(false); router.push('/shop'); }} className={dropdownBtnStyle}>
                          <div className="flex items-center gap-3">
                            <ShoppingBag size={18} strokeWidth={3} className="group-hover:scale-110 transition-transform" /> Shop
                          </div>
                        </button>
                        <button onClick={() => { setShowDropdown(false); router.push('/profile'); }} className={dropdownBtnStyle}>
                          <div className="flex items-center gap-3">
                            <UserIcon size={18} strokeWidth={3} className="group-hover:scale-110 transition-transform" /> Edit Profile
                          </div>
                        </button>

                        <button onClick={cycleTheme} className={dropdownBtnStyle}>
                          <div className="flex items-center gap-3">
                            <span className="group-hover:scale-110 transition-transform">{themeMeta.icon}</span>
                            Theme
                          </div>
                          <span className="text-[10px] opacity-60 uppercase tracking-wider">
                            {themeMeta.label}
                          </span>
                        </button>

                        <div className="h-1 w-full bg-orange-100/50 dark:bg-white/5 hacker:bg-green-900/50 my-1 rounded-full"></div>

                        <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-sm font-black rounded-2xl flex items-center gap-3 group nav-squishy border-4 bg-white dark:bg-[#1E1B2E] hacker:bg-[#0a0a0a] text-rose-500 dark:text-rose-400 hacker:text-rose-500 border-rose-200 dark:border-rose-900 hacker:border-rose-900 shadow-[0_4px_0_#fecdd3] dark:shadow-[0_4px_0_#4c1d95] hacker:shadow-[0_4px_0_#881337] hover:bg-rose-50 dark:hover:bg-[#2D223B] hacker:hover:bg-[#111]">
                          <LogOut size={18} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" /> Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={() => loginWithGoogle()}
                disabled={isLoggingIn}
                className={`btn-squishy flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 font-black transition-all border-4 bg-white dark:bg-yellow-400 hacker:bg-green-500 text-orange-600 dark:text-[#1E1B2E] hacker:text-[#0a0a0a] border-orange-200 dark:border-yellow-500 hacker:border-green-600 shadow-[0_6px_0_#fed7aa] dark:shadow-[0_6px_0_#ca8a04] hacker:shadow-[0_6px_0_#15803d] hover:bg-orange-50 dark:hover:bg-yellow-300 hacker:hover:bg-green-400 rounded-2xl text-xs md:text-sm ${isLoggingIn ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isLoggingIn ? (
                  <RefreshCw className="animate-spin" size={18} strokeWidth={3} />
                ) : (
                  <>
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-4 w-4 md:h-5 md:w-5">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    </svg>
                    <span className="hidden sm:inline">เข้าสู่ระบบ</span>
                  </>
                )}
              </button>
            )}

            <button id="mobile-menu-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden btn-squishy flex items-center justify-center p-2.5 font-black transition-all border-4 bg-white dark:bg-yellow-400 hacker:bg-[#0a0a0a] text-orange-600 dark:text-[#1E1B2E] hacker:text-green-500 border-orange-200 dark:border-yellow-500 hacker:border-green-600 shadow-[0_6px_0_#fed7aa] dark:shadow-[0_6px_0_#ca8a04] hacker:shadow-[0_6px_0_#15803d] hover:bg-orange-50 dark:hover:bg-yellow-300 hacker:hover:bg-[#111] rounded-2xl">
              {isMobileMenuOpen ? <X size={24} strokeWidth={4} /> : <Menu size={24} strokeWidth={4} />}
            </button>
          </div>
        </div>

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
              {['จุดเด่น ✨', 'บทเรียน 🎯'].map((name) => {
                const targetId = name === 'จุดเด่น ✨' ? 'features' : 'path';
                return (
                  <a
                    key={name}
                    href={`#${targetId}`}
                    onClick={(e) => handleScrollTo(e, targetId)}
                    className="px-5 py-4 rounded-2xl text-base font-black text-orange-800 dark:text-white/60 hacker:text-white/70 hover:bg-orange-50 dark:hover:bg-[#382E54] hacker:hover:bg-[#111] hover:text-orange-500 dark:hover:text-yellow-400 hacker:hover:text-green-400 border-2 border-transparent transition-all"
                  >
                    {name}
                  </a>
                );
              })}
              <div className="w-full h-1 bg-orange-100/50 dark:bg-white/10 hacker:bg-green-900/50 my-2 rounded-full"></div>
              <button onClick={cycleTheme} className={dropdownBtnStyle}>
                <div className="flex items-center gap-3">
                  {themeMeta.icon}
                  Switch to {nextThemeMeta.label} Mode
                </div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="relative z-10 container mx-auto px-6 pt-16 md:pt-28 pb-20 flex flex-col items-center gap-14 md:gap-16">
        <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="flex flex-col items-center text-center w-full">
          <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white dark:bg-[#2D223B] hacker:bg-[#0a0a0a] border-4 border-white dark:border-[#4B3965] hacker:border-green-600 text-orange-500 dark:text-yellow-400 hacker:text-green-500 text-sm font-black mb-8 shadow-sm transition-colors">
            <Sparkles size={16} strokeWidth={3} className="animate-pulse" />
            ระบบฝึกพิมพ์คำสั่ง
          </motion.div>

          {/* ขนาดไหลตามความกว้างจอ: เล็กสุด 2.75rem (จอมือถือไม่ล้น) ใหญ่สุด 7rem (จอใหญ่เต็มตา) */}
          <motion.h2 variants={fadeInUp} className="cute-header text-[clamp(2.75rem,8.5vw,7rem)] font-black text-orange-950 dark:text-white hacker:text-white leading-[1.08] mb-6 drop-shadow-sm transition-colors">
            Master the <br />
            <span className="text-orange-500 dark:text-yellow-400 hacker:text-green-500">Command Line</span>
          </motion.h2>

          <motion.p variants={fadeInUp} className="text-[clamp(1.05rem,1.9vw,1.5rem)] text-orange-800 dark:text-white/70 hacker:text-white/70 mb-10 max-w-3xl mx-auto leading-relaxed font-black transition-colors">
            อยากใช้ Terminal คล่องๆ แต่กลัวเผลอลบไฟล์พังใช่ไหม? หมดห่วงได้เลย!
            ฝึกพิมพ์ในระบบจำลอง ลุยด่านต่างๆ สนุก ปลอดภัย และเก่งขึ้นชัวร์
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row justify-center gap-4 w-full sm:w-auto">
            {user ? (
              <Link href="/dashboard" className="btn-shine btn-squishy flex items-center justify-center gap-3 px-8 py-5 text-lg font-black text-white dark:text-[#1E1B2E] hacker:text-[#0a0a0a] bg-orange-500 dark:bg-yellow-400 hacker:bg-green-500 border-4 border-white dark:border-yellow-600 hacker:border-green-600 rounded-[30px] shadow-[0_8px_0_#c2410c] dark:shadow-[0_8px_0_#ca8a04] hacker:shadow-[0_8px_0_#15803d] hover:bg-orange-400 dark:hover:bg-yellow-300 hacker:hover:bg-green-400 transition-colors">
                <Play size={20} fill="currentColor" /> เริ่มฝึกพิมพ์เลย!
              </Link>
            ) : (
              <button
                onClick={() => loginWithGoogle()}
                disabled={isLoggingIn}
                className="btn-shine btn-squishy flex items-center justify-center gap-3 px-8 py-5 text-lg font-black text-white dark:text-[#1E1B2E] hacker:text-[#0a0a0a] bg-orange-500 dark:bg-yellow-400 hacker:bg-green-500 border-4 border-white dark:border-yellow-600 hacker:border-green-600 rounded-[30px] shadow-[0_8px_0_#c2410c] dark:shadow-[0_8px_0_#ca8a04] hacker:shadow-[0_8px_0_#15803d] hover:bg-orange-400 dark:hover:bg-yellow-300 hacker:hover:bg-green-400 transition-colors"
              >
                {isLoggingIn ? <RefreshCw className="animate-spin" size={20} /> : <Play size={20} fill="currentColor" />}
                {isLoggingIn ? 'กำลังเชื่อมต่อ...' : 'เข้าสู่ระบบเพื่อเริ่มฝึก!'}
              </button>
            )}

            <button onClick={(e) => handleScrollTo(e as any, 'path')} className="btn-squishy flex items-center justify-center gap-3 px-8 py-5 text-lg font-black text-orange-600 dark:text-yellow-400 hacker:text-green-500 bg-white dark:bg-[#2D223B] hacker:bg-[#0a0a0a] border-4 border-orange-200 dark:border-[#4B3965] hacker:border-green-600 rounded-[30px] shadow-[0_8px_0_#fed7aa] dark:shadow-[0_8px_0_#1E1B2E] hacker:shadow-[0_8px_0_#15803d] hover:bg-orange-50 dark:hover:bg-[#382E54] hacker:hover:bg-[#111] transition-colors">
              🎯 บทเรียน
            </button>
          </motion.div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.3, type: "spring" }} className="w-full max-w-3xl mx-auto">
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

            <div className="p-6 md:p-8 font-prompt font-black text-orange-800 dark:text-white/80 hacker:text-white/80 text-sm md:text-base relative z-10 min-h-[280px] bg-white/60 dark:bg-black/30 hacker:bg-black/60 transition-colors">
              <div className="mb-3">
                <span className="text-orange-600 dark:text-yellow-400 hacker:text-green-500 font-black">student@keyrush</span>:
                <span className="text-orange-400 dark:text-yellow-600 hacker:text-green-600">~</span>$
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}> ./init_system.sh</motion.span>
              </div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="mb-3 text-orange-500 dark:text-yellow-300 hacker:text-green-400 drop-shadow-sm font-black">
                [SYSTEM] Initializing simulated server environment...
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2 }} className="mb-3">
                Loading File System Management module... <span className="text-green-500 dark:text-green-400 hacker:text-green-400 font-black">[SUCCESS]</span>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.7 }} className="mb-3">
                Establishing connection to the main network... <span className="text-green-500 dark:text-green-400 hacker:text-green-400 font-black">[SUCCESS]</span>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.2 }} className="mb-8 text-orange-600 dark:text-yellow-400 hacker:text-green-500 font-black">
                Status: System ready. Awaiting commands.
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 4 }} className="flex items-center">
                <span className="text-orange-600 dark:text-yellow-400 hacker:text-green-500 font-black mr-2">student@keyrush</span>:
                <span className="text-orange-400 dark:text-yellow-600 hacker:text-green-600">~</span>$
                <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-3 h-6 bg-orange-500 dark:bg-yellow-400 hacker:bg-green-500 ml-2 block rounded-sm"></motion.span>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </main>

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
            <p className="text-orange-800 dark:text-white/70 hacker:text-white/70 font-black leading-relaxed transition-colors">ตรวจสอบคำสั่งแบบทันที พร้อมแสดงผลลัพธ์</p>
          </motion.div>
        </div>
      </section>

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

      <section className="relative z-10 container mx-auto px-6 py-32 text-center">
        <motion.h3 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="cute-header text-5xl md:text-7xl font-black text-orange-950 dark:text-white hacker:text-white mb-6 transition-colors">Ready to <span className="text-orange-500 dark:text-yellow-400 hacker:text-green-500">Execute?</span> 🚀</motion.h3>
        <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} transition={{ delay: 0.1 }} className="text-orange-800 dark:text-white/70 hacker:text-white/70 mb-10 max-w-xl mx-auto font-black text-xl transition-colors">ระบบพร้อมใช้งานแล้ว เข้าสู่ระบบเพื่อเริ่มการเรียนรู้ของคุณได้เลย ✨</motion.p>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} transition={{ delay: 0.2 }}>
          {user ? (
            <Link href="/dashboard" className="btn-shine btn-squishy inline-flex items-center justify-center gap-3 px-10 py-6 text-2xl font-black text-white dark:text-[#1E1B2E] hacker:text-[#0a0a0a] bg-orange-500 dark:bg-yellow-400 hacker:bg-green-500 border-4 border-white dark:border-yellow-600 hacker:border-green-600 rounded-[32px] shadow-[0_10px_0_#c2410c] dark:shadow-[0_10px_0_#ca8a04] hacker:shadow-[0_10px_0_#15803d] hover:bg-orange-400 dark:hover:bg-yellow-300 hacker:hover:bg-green-400">
              เริ่มฝึกกันเลย! <ChevronRight size={28} strokeWidth={4} />
            </Link>
          ) : (
            <button
              onClick={() => loginWithGoogle()}
              disabled={isLoggingIn}
              className="btn-shine btn-squishy inline-flex items-center justify-center gap-3 px-10 py-6 text-2xl font-black text-white dark:text-[#1E1B2E] hacker:text-[#0a0a0a] bg-orange-500 dark:bg-yellow-400 hacker:bg-green-500 border-4 border-white dark:border-yellow-600 hacker:border-green-600 rounded-[32px] shadow-[0_10px_0_#c2410c] dark:shadow-[0_10px_0_#ca8a04] hacker:shadow-[0_10px_0_#15803d] hover:bg-orange-400 dark:hover:bg-yellow-300 hacker:hover:bg-green-400"
            >
              {isLoggingIn ? <RefreshCw className="animate-spin" size={28} /> : <Play size={28} fill="currentColor" />}
              {isLoggingIn ? 'กำลังเชื่อมต่อ...' : 'เข้าสู่ระบบเพื่อเริ่มฝึก!'}
            </button>
          )}
        </motion.div>
      </section>

      {/* 🌟 เพิ่ม mt-auto เข้าไปที่ Footer เพื่อผลักมันให้ชิดขอบล่างของหน้าจอเสมอ */}
      <footer className="relative z-10 mt-auto py-4 flex flex-col items-center justify-center text-center text-orange-600 dark:text-white/30 hacker:text-white/40 font-black text-sm bg-white/70 dark:bg-[#1E1B2E]/70 hacker:bg-[#0a0a0a]/80 border-t-4 border-white dark:border-[#382E54] hacker:border-green-900 uppercase tracking-widest transition-colors">
        <p className="m-0">© 2026 KeyRush. Interactive Terminal Training ✨</p>
      </footer>

    </div>
  );
}