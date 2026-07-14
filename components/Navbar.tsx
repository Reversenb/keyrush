"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import {
  Terminal, Bell, LayoutDashboard, User as UserIcon, LogOut,
  ShieldCheck, Menu, X, ChevronRight, Sun, Moon, Code
} from 'lucide-react'; // 🌟 เพิ่มไอคอน Code สำหรับธีม Hacker
import { logout } from '@/lib/api';

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

  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
    const savedUserStr = localStorage.getItem('keyrush_user');
    if (savedUserStr) {
      try {
        const parsedUser = JSON.parse(savedUserStr);
        setUser(parsedUser);
      } catch (e) { }
    }
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

  // 🌟 ฟังก์ชันสลับ 3 ธีม (Cute -> Dark -> Hacker -> Cute) 🌟
  const cycleTheme = () => {
    if (currentTheme === 'light') setTheme('dark');
    else if (currentTheme === 'dark') setTheme('hacker');
    else setTheme('light');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Mission', path: '/map' },
    { name: 'Leaderboard', path: '/leaderboard' },
    { name: 'Ranks', path: '/ranks' },
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

        {/* ส่วนขวา: ปุ่มกระดิ่ง + โปรไฟล์ */}
        <div className="flex items-center gap-3 md:gap-4 ml-4 border-l-4 border-white dark:border-[#382E54] hacker:border-[#166534] pl-4 md:pl-6 transition-colors">

          {/* 🌟 3D Notification Button 🌟 */}
          <button className={`rounded-2xl p-2.5 ${styles.btn3D}`}>
            <Bell size={20} strokeWidth={3} />
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
                    className="absolute right-0 mt-4 w-64 bg-white/95 dark:bg-[#1E1B2E]/95 hacker:bg-[#0a0a0a]/95 backdrop-blur-2xl border-4 border-white dark:border-[#382E54] hacker:border-green-600 rounded-[24px] shadow-xl overflow-hidden z-50 p-3"
                  >
                    <div className="px-4 py-3 mb-3 bg-orange-50/80 dark:bg-black/20 hacker:bg-[#111] rounded-2xl border-2 border-white dark:border-white/5 hacker:border-green-900/30">
                      <p className={`font-black tracking-tight truncate text-base ${styles.textMain}`}>{getShowName()}</p>
                      <p className="text-xs text-orange-950/50 dark:text-white/50 hacker:text-green-500/60 truncate mt-0.5 font-bold">
                        {user.email || user.username || 'Hacker Operative'}
                      </p>
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
                {currentTheme === 'dark' && <Moon size={20} strokeWidth={3} />}
                {currentTheme === 'light' && <Sun size={20} strokeWidth={3} />}
                {currentTheme === 'hacker' && <Code size={20} strokeWidth={3} />}
                Switch to {currentTheme === 'cute' ? 'Cute Mode' : currentTheme === 'dark' ? 'Hacker Mode' : currentTheme === 'hacker' ? 'Cute Mode' : 'Dark Mode'}
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}