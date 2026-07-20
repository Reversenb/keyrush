"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import {
  Terminal, LayoutDashboard, User as UserIcon, LogOut,
  ShieldCheck, Menu, X, ChevronRight, Sun, Moon, Code, Zap, Heart, Flame, Cloud, Leaf, Gem, ShoppingBag
} from 'lucide-react'; // 🌟 เพิ่มไอคอน Code สำหรับธีม Hacker
import { apiFetch, logout } from '@/lib/api';
import CoinIcon from '@/components/CoinIcon';

interface NavbarProps {
  theme?: 'linux' | 'windows';
}

export default function Navbar({ theme = 'linux' }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme: activeTheme, resolvedTheme, setTheme } = useTheme();
  const currentTheme = activeTheme === 'system' ? resolvedTheme : activeTheme;

  const [user, setUser] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  // เช็คสิทธิ์ธีมได้ก็ต่อเมื่อรู้ข้อมูลผู้ใช้จริงจาก backend แล้ว (กันรีเซ็ตธีมของคนที่ซื้อไว้ตอนโหลดแรก)
  const [userSynced, setUserSynced] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
    // แสดงจาก cache ก่อนกัน UI กระพริบ...
    const savedUserStr = localStorage.getItem('keyrush_user');
    if (savedUserStr) {
      try {
        const parsedUser = JSON.parse(savedUserStr);
        setUser(parsedUser);
      } catch (e) { }
    }

    // ...แล้ว sync ข้อมูลจริงจาก backend ทับ (กัน avatar/ชื่อค้างเป็นค่าเก่าจนกว่าจะรีเฟรช)
    const syncUser = async () => {
      try {
        const res = await apiFetch('/api/user/progress', {}, { redirectOn401: false });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            setUser(data.data);
            localStorage.setItem('keyrush_user', JSON.stringify(data.data));
            // ส่งต่อให้ CursorGlow อ่านค่า activeCursor สดของไอดีปัจจุบัน (กันเอฟเฟกต์ค้างข้ามไอดี)
            window.dispatchEvent(new Event('keyrush-user-updated'));
          }
        } else if (res.status === 401) {
          setUser(null);
          localStorage.removeItem('keyrush_user');
          window.dispatchEvent(new Event('keyrush-user-updated'));
        }
        setUserSynced(true);
      } catch (e) { }
    };
    syncUser();

    // 🛍️ ฟังสัญญาณจากหน้า Shop: กดใส่/ถอดธีมแล้วให้วงจรสลับธีมอัปเดตทันที ไม่ต้องรีเฟรช
    const onUserUpdated = () => {
      const s = localStorage.getItem('keyrush_user');
      if (s) { try { setUser(JSON.parse(s)); } catch (e) { } }
      else { setUser(null); } // logout แล้ว — เคลียร์โปรไฟล์ค้างบน Navbar ด้วย
    };
    window.addEventListener('keyrush-user-updated', onUserUpdated);
    return () => window.removeEventListener('keyrush-user-updated', onUserUpdated);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        const toggleButton = document.getElementById('mobile-menu-toggle');
        if (toggleButton && !toggleButton.contains(event.target as Node)) {
          setIsMobileMenuOpen(false);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    // ให้ server revoke token + เคลียร์ cookie ก่อน แล้วค่อยพาไปหน้า login
    await logout();
    setUser(null);
    router.push('/login');
  };

  const getShowName = () => {
    if (!user) return 'Hacker';
    if (user.displayName && user.displayName.trim() !== '') return user.displayName;
    if (user.email) return user.email.split('@')[0];
    if (user.username) return user.username.split('@')[0];
    return 'Hacker';
  };

  // 🌟 สลับธีม: พื้นฐาน 2 ธีม (Cute/Dark) + ธีมพรีเมียมเฉพาะที่ "กดใส่อยู่" เท่านั้น 🌟
  // (ซื้อแล้วแต่ยังไม่ใส่ = ไม่โผล่ในวงจร / กดถอดในร้าน = หายไป) — Hacker ก็เป็นธีมซื้อในร้านแล้ว
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

  // ชื่อ + ไอคอนของธีมปัจจุบัน (ครอบคลุมธีมพรีเมียมด้วย ไม่งั้นปุ่มจะว่างเปล่า)
  const THEME_META: Record<string, { label: string; icon: React.ReactNode }> = {
    light: { label: 'Cute', icon: <Sun size={20} strokeWidth={3} /> },
    dark: { label: 'Dark', icon: <Moon size={20} strokeWidth={3} /> },
    hacker: { label: 'Hacker', icon: <Code size={20} strokeWidth={3} /> },
    sakura: { label: 'Sakura', icon: <Heart size={20} strokeWidth={3} fill="currentColor" /> },
    dragon: { label: 'Red Dragon', icon: <Flame size={20} strokeWidth={3} /> },
    sky: { label: 'Sky Blue', icon: <Cloud size={20} strokeWidth={3} fill="currentColor" /> },
    mint: { label: 'Mint', icon: <Leaf size={20} strokeWidth={3} fill="currentColor" /> },
    amethyst: { label: 'Amethyst Night', icon: <Gem size={20} strokeWidth={3} /> },
  };
  const themeMeta = THEME_META[currentTheme || 'light'] || THEME_META.light;
  // ธีมถัดไปในวงจร (ไว้โชว์ "Switch to ..." ในเมนูมือถือ)
  const nextThemeMeta = THEME_META[themeRing[(themeRing.indexOf(currentTheme || 'light') + 1) % themeRing.length]] || THEME_META.light;

  const navItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Mission', path: '/map' },
    { name: 'Leaderboard', path: '/leaderboard' },
    { name: 'Shop', path: '/shop' },
    { name: 'Docs', path: '/docs' }
  ];

  // 🌟 อัปเกรด Class สำหรับปุ่ม 3D รองรับ Hacker Mode (พื้นเขียว, กรอบเขียว, ตัวหนังสือดำ) 🌟
  const styles = {
    // โลโก้
    textMain: theme === 'linux' ? 'text-orange-500 dark:text-yellow-400 hacker:text-green-500' : 'text-blue-500 dark:text-blue-400 hacker:text-green-500',
    bgMain: theme === 'linux' ? 'bg-orange-500 dark:bg-yellow-400 hacker:bg-green-500' : 'bg-blue-500 dark:bg-blue-400 hacker:bg-green-500',

    // ปุ่มไอคอนหลัก (กระดิ่ง, Sign In, Hamburger, รูปโปรไฟล์)
    btn3D: "btn-squishy flex items-center justify-center font-black transition-all border-4 bg-white dark:bg-yellow-400 hacker:bg-green-500 text-orange-600 dark:text-[#1E1B2E] hacker:text-black border-orange-200 dark:border-yellow-500 hacker:border-green-600 shadow-[0_6px_0_#fed7aa] dark:shadow-[0_6px_0_#ca8a04] hacker:shadow-[0_6px_0_#166534] hover:bg-orange-50 dark:hover:bg-yellow-300 hacker:hover:bg-green-400",

    // Nav Link (Desktop & Mobile)
    navActive: "border-4 bg-orange-100 dark:bg-yellow-400 hacker:bg-green-500 text-orange-600 dark:text-[#1E1B2E] hacker:text-black border-orange-300 dark:border-yellow-600 hacker:border-green-600 shadow-[0_4px_0_#fdba74] dark:shadow-[0_4px_0_#ca8a04] hacker:shadow-[0_4px_0_#166534] -translate-y-1",
    navIdle: "border-4 bg-transparent text-orange-950/60 dark:text-white/60 hacker:text-green-500/60 border-transparent hover:bg-white dark:hover:bg-yellow-400 hacker:hover:bg-green-500 hover:text-orange-600 dark:hover:text-[#1E1B2E] hacker:hover:text-black hover:border-orange-200 dark:hover:border-yellow-500 hacker:hover:border-green-600 hover:shadow-[0_4px_0_#fed7aa] dark:hover:shadow-[0_4px_0_#ca8a04] hacker:hover:shadow-[0_4px_0_#166534] hover:-translate-y-1 transition-all",

    // ปุ่มใน Dropdown 
    dropdownBtn: "w-full text-left px-4 py-3 text-sm font-black rounded-2xl flex items-center justify-between group nav-squishy border-4 bg-white dark:bg-yellow-400 hacker:bg-green-500 text-orange-600 dark:text-[#1E1B2E] hacker:text-black border-orange-200 dark:border-yellow-500 hacker:border-green-600 shadow-[0_4px_0_#fed7aa] dark:shadow-[0_4px_0_#ca8a04] hacker:shadow-[0_4px_0_#166534] hover:bg-orange-50 dark:hover:bg-yellow-300 hacker:hover:bg-green-400",
    dropdownLogout: "w-full text-left px-4 py-3 text-sm font-black rounded-2xl flex items-center gap-3 group nav-squishy border-4 bg-white dark:bg-[#1E1B2E] hacker:bg-[#0a0a0a] text-rose-500 dark:text-rose-400 hacker:text-rose-500 border-rose-200 dark:border-rose-900 hacker:border-rose-900 shadow-[0_4px_0_#fecdd3] dark:shadow-[0_4px_0_#4c1d95] hacker:shadow-[0_4px_0_#881337] hover:bg-rose-50 dark:hover:bg-[#2D223B] hacker:hover:bg-[#111]"
  };

  const isLinkActive = (path: string) => pathname?.startsWith(path);

  if (!isMounted) return null;

  return (
    <header className="flex items-center justify-between border-b-4 border-white dark:border-[#382E54] hacker:border-[#166534] bg-white/70 dark:bg-[#1E1B2E]/70 hacker:bg-[#050505]/80 backdrop-blur-md px-6 md:px-10 py-3 sticky top-0 z-50 font-sans shadow-sm transition-colors duration-500">

      {/* 🌟 CSS Animation สำหรับปุ่ม 3D สวิทช์คีย์บอร์ด 🌟 */}
      <style>{`
        .btn-squishy {
          transition: transform 0.1s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.1s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s;
        }
        .btn-squishy:hover { transform: translateY(-2px); }
        .btn-squishy:active { transform: translateY(6px); box-shadow: 0 0 0 transparent !important; }

        .nav-squishy {
          transition: transform 0.1s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.1s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s, color 0.2s, border-color 0.2s;
        }
        .nav-squishy:active { transform: translateY(4px); box-shadow: 0 0 0 transparent !important; }
      `}</style>

      {/* โลโก้ (ยึดตามโครงสร้างเดิมของบอส) */}
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-3 transition-all hover:scale-105 cursor-pointer group no-underline hover:no-underline">
          <div className={`w-10 h-10 ${styles.bgMain} text-white dark:text-[#1E1B2E] hacker:text-black rounded-2xl shadow-md flex items-center justify-center transform -rotate-6 border-2 border-white dark:border-transparent hacker:border-transparent group-hover:rotate-0 transition-all`}>
            <Terminal size={20} strokeWidth={4} />
          </div>
          <h2 className={`text-2xl font-black tracking-tight ${styles.textMain}`}>KeyRush</h2>
        </Link>
      </div>

      <div className="flex items-center gap-4 md:gap-8">
        {/* เมนูหลัก Desktop */}
        <nav className="hidden lg:flex items-center gap-2">
          {navItems.map((item) => {
            const isActive = isLinkActive(item.path);
            return (
              <Link
                key={item.name}
                href={item.path}
                className={`relative px-4 py-2 text-sm font-black tracking-widest uppercase rounded-2xl group overflow-hidden nav-squishy
                  ${isActive ? styles.navActive : styles.navIdle}
                `}
              >
                <span className="relative z-10 flex items-center gap-2">
                  {isActive && <span className="animate-pulse opacity-80 font-black">&gt;</span>}
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* ส่วนขวา: ปุ่มสลับธีม + โปรไฟล์ */}
        <div className="flex items-center gap-3 md:gap-4 ml-4 border-l-4 border-white dark:border-[#382E54] hacker:border-[#166534] pl-4 md:pl-6 transition-colors">

          {/* 🌟 3D Theme Toggle Button (Cute → Dark → Hacker) 🌟 */}
          <button
            onClick={cycleTheme}
            title={`ธีมปัจจุบัน: ${themeMeta.label} — กดเพื่อสลับ`}
            className={`rounded-2xl p-2.5 ${styles.btn3D}`}
          >
            {themeMeta.icon}
          </button>

          {user ? (
            <div className="relative" ref={dropdownRef}>

              {/* 🌟 3D Profile Avatar 🌟 */}
              <div
                className={`bg-center bg-no-repeat aspect-square bg-cover rounded-2xl size-12 cursor-pointer origin-center ${styles.btn3D}`}
                onClick={() => setShowDropdown(!showDropdown)}
                style={{ backgroundImage: `url(${user?.avatar?.startsWith('data:') ? user.avatar : `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.avatar || 'Felix'}`})` }}
              ></div>

              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute right-0 mt-4 w-72 bg-white/95 dark:bg-[#1E1B2E]/95 hacker:bg-[#0a0a0a]/95 backdrop-blur-2xl border-4 border-white dark:border-[#382E54] hacker:border-green-600 rounded-[24px] shadow-xl overflow-hidden z-50 p-3"
                  >
                    <div className="px-4 py-3 mb-3 bg-orange-50/80 dark:bg-black/20 hacker:bg-[#111] rounded-2xl border-2 border-white dark:border-white/5 hacker:border-green-900/30">
                      <p className={`font-black tracking-tight truncate text-base ${styles.textMain}`}>{getShowName()}</p>
                      <p className="text-xs text-orange-950/50 dark:text-white/50 hacker:text-green-500/60 truncate mt-0.5 font-bold">
                        {user.email || user.username || 'Hacker Operative'}
                      </p>

                      {/* 🪙 เหรียญ + ⚡ EXP รวม (Linux + Windows) — รองรับเลข 5 หลักโดยไม่ตัดคำ */}
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <div className="flex items-center gap-2 px-2.5 py-2 rounded-xl border-2 bg-white dark:bg-[#2D223B] hacker:bg-[#0a0a0a] border-orange-100 dark:border-[#4B3965] hacker:border-green-900 min-w-0">
                          <CoinIcon size={18} className="shrink-0 text-amber-500 dark:text-yellow-400 hacker:text-green-500" />
                          <div className="min-w-0">
                            <p className="text-[8px] font-black uppercase tracking-widest opacity-50 leading-none">Coins</p>
                            <p className="text-sm font-black tabular-nums whitespace-nowrap text-amber-500 dark:text-yellow-400 hacker:text-green-400 leading-tight">
                              {(user.coins ?? 0).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 px-2.5 py-2 rounded-xl border-2 bg-white dark:bg-[#2D223B] hacker:bg-[#0a0a0a] border-orange-100 dark:border-[#4B3965] hacker:border-green-900 min-w-0">
                          <Zap size={16} strokeWidth={3} className="shrink-0 text-orange-500 dark:text-yellow-400 hacker:text-green-500 fill-current" />
                          <div className="min-w-0">
                            <p className="text-[8px] font-black uppercase tracking-widest opacity-50 leading-none">Total EXP</p>
                            <p className="text-sm font-black tabular-nums whitespace-nowrap text-orange-600 dark:text-yellow-400 hacker:text-green-400 leading-tight">
                              {(((user.linuxExp ?? 0) + (user.windowsExp ?? 0))).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {user?.role?.toLowerCase() === 'admin' && (
                        <button
                          onClick={() => { setShowDropdown(false); router.push('/admin/missions'); }}
                          className={`${styles.dropdownBtn}`}
                        >
                          <div className="flex items-center gap-3">
                            <ShieldCheck size={18} strokeWidth={3} className="group-hover:rotate-12 transition-transform" />
                            Mission Manager
                          </div>
                        </button>
                      )}

                      <button
                        onClick={() => { setShowDropdown(false); router.push('/shop'); }}
                        className={`${styles.dropdownBtn}`}
                      >
                        <div className="flex items-center gap-3">
                          <ShoppingBag size={18} strokeWidth={3} className="group-hover:scale-110 transition-transform" />
                          Shop
                        </div>
                      </button>

                      <button
                        onClick={() => { setShowDropdown(false); router.push('/profile'); }}
                        className={`${styles.dropdownBtn}`}
                      >
                        <div className="flex items-center gap-3">
                          <UserIcon size={18} strokeWidth={3} className="group-hover:scale-110 transition-transform" />
                          Edit Profile
                        </div>
                      </button>

                      {/* 🌟 Theme Toggle 🌟 */}
                      <button
                        onClick={cycleTheme}
                        className={`${styles.dropdownBtn}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="group-hover:scale-110 transition-transform">{themeMeta.icon}</span>
                          Theme
                        </div>
                        <span className="text-[10px] opacity-60 uppercase tracking-wider">
                          {themeMeta.label}
                        </span>
                      </button>

                      <div className="h-1 w-full bg-orange-100/50 dark:bg-white/5 hacker:bg-green-900/50 my-1 rounded-full"></div>

                      <button
                        onClick={handleLogout}
                        className={`${styles.dropdownLogout}`}
                      >
                        <LogOut size={18} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link href="/login" className={`px-5 py-2.5 text-sm rounded-2xl ${styles.btn3D}`}>
              Sign In
            </Link>
          )}

          <button
            id="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`lg:hidden rounded-2xl p-2.5 ${styles.btn3D}`}
          >
            {isMobileMenuOpen ? <X size={24} strokeWidth={3} /> : <Menu size={24} strokeWidth={3} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            ref={mobileMenuRef}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className={`absolute top-full left-0 w-full bg-white/95 dark:bg-[#1E1B2E]/95 hacker:bg-[#0a0a0a]/95 backdrop-blur-2xl border-b-4 border-white dark:border-[#382E54] hacker:border-green-600 shadow-xl flex flex-col p-5 space-y-3 lg:hidden z-40`}
          >
            {navItems.map((item) => {
              const isActive = isLinkActive(item.path);
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  className={`px-5 py-4 rounded-2xl text-sm font-black tracking-widest uppercase flex items-center gap-3 nav-squishy
                    ${isActive ? styles.navActive : styles.navIdle}
                  `}
                >
                  <ChevronRight size={18} strokeWidth={3} className={isActive ? 'animate-pulse' : 'opacity-0'} />
                  {item.name}
                </Link>
              );
            })}

            <div className="w-full h-1 bg-orange-100/50 dark:bg-white/10 hacker:bg-green-900/50 my-2 rounded-full"></div>

            <button
              onClick={cycleTheme}
              className={`${styles.dropdownBtn} py-4`}
            >
              <div className="flex items-center gap-3">
                {themeMeta.icon}
                Switch to {nextThemeMeta.label} Mode
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}