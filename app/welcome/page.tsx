"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { PageSkeleton, sk } from '@/components/skeleton';
import { Terminal, ArrowRight, Edit3, Check, X, ShieldCheck, ShieldAlert } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export default function WelcomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  // 🌟 Theme State
  const { theme: activeTheme, resolvedTheme } = useTheme();
  const currentTheme = activeTheme === 'system' ? resolvedTheme : activeTheme;
  const isDark = currentTheme === 'dark' || currentTheme === 'amethyst';
  const isHacker = currentTheme === 'hacker' || currentTheme === 'dragon'; const isDragon = currentTheme === 'dragon';

  // State สำหรับฟอร์มแก้ชื่อ
  const [newDisplayName, setNewDisplayName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  // เหตุผลที่เซิร์ฟเวอร์ปฏิเสธชื่อ (เช่น มีคำไม่สุภาพ) — ถ้าไม่โชว์ ผู้ใช้จะงงว่ากดแล้วเงียบ
  const [nameError, setNameError] = useState<string | null>(null);
  const [showForm, setShowNameForm] = useState(false);

  // State สำหรับแอนิเมชัน Terminal
  const [logStep, setLogStep] = useState(0);

  // เพื่อป้องกัน Hydration Mismatch และระบบโหลด
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    const fetchFreshUserData = async () => {
      try {
        // cookie ถูกแนบไปเอง — ถ้า 401 (ยังไม่ login/หมดอายุ) apiFetch จะพาไปหน้า login ให้
        const res = await apiFetch('/api/user/progress');
        if (!res.ok) return;
        const data = await res.json();

        if (data.success && data.data) {
          setUser(data.data);
          setNewDisplayName(data.data.displayName || "");

          if (!data.data.displayName || data.data.displayName.trim() === '') {
            setShowNameForm(true);
          }

          localStorage.setItem('keyrush_user', JSON.stringify(data.data));
        }
      } catch (e) {
        console.error("Fetch error", e);
      } finally {
        setTimeout(() => setIsLoading(false), 1000);
      }
    };

    fetchFreshUserData();
  }, [router]);

  useEffect(() => {
    if (!isLoading) {
      const interval = setInterval(() => {
        setLogStep((prev) => (prev < 6 ? prev + 1 : prev));
      }, 400);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDisplayName.trim()) return;

    setIsUpdating(true);
    setNameError(null);

    try {
      const res = await apiFetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: newDisplayName })
      });
      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
        setUser({ ...user, displayName: newDisplayName });
        setShowNameForm(false);
        const savedUser = JSON.parse(localStorage.getItem('keyrush_user') || '{}');
        localStorage.setItem('keyrush_user', JSON.stringify({ ...savedUser, displayName: newDisplayName }));
      } else {
        setNameError(data?.message || 'ตั้งชื่อไม่สำเร็จ กรุณาลองใหม่');
      }
    } catch (err) {
      setNameError('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelNameEdit = () => {
    setShowNameForm(false);
    setNewDisplayName(user?.displayName || "");
  };

  const getShowName = () => {
    if (!user) return 'ROOT_USER';
    if (user.displayName && user.displayName.trim() !== '') return user.displayName;
    if (user.email) return user.email.split('@')[0];
    if (user.username) return user.username.split('@')[0];
    return 'ROOT_USER';
  };

  if (!isMounted || isLoading) return (
    <PageSkeleton maxW="max-w-3xl" navbar={false}>
      {/* จัดกึ่งกลางจอเหมือนของจริง (main เป็น flex items-center justify-center) */}
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-8 text-center">
        {/* ป้ายสถานะเล็กด้านบน */}
        <div className={`${sk} rounded-full h-10 w-52`} />

        {/* หัวข้อ "Welcome back, <ชื่อ>" 2 บรรทัด (text-5xl / md:text-7xl) */}
        <div className="flex flex-col items-center gap-3 w-full">
          <div className={`${sk} rounded-2xl h-12 md:h-16 w-72 md:w-[26rem] max-w-full`} />
          <div className={`${sk} rounded-2xl h-12 md:h-16 w-56 md:w-80 max-w-full`} />
        </div>

        {/* ปุ่มแก้ชื่อ / ช่องกรอกชื่อ */}
        <div className={`${sk} rounded-full h-12 w-full max-w-lg`} />

        {/* การ์ด system_boot.log ด้านล่าง */}
        <div className="w-full max-w-2xl glass-card overflow-hidden mt-2">
          <div className="flex items-center gap-3 px-5 py-4 border-b-4 border-orange-50 dark:border-[#382E54] hacker:border-[#166534] transition-colors">
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => <div key={i} className={`${sk} size-3 rounded-full`} />)}
            </div>
            <div className={`${sk} rounded-full h-3 w-32 mx-auto`} />
          </div>
          <div className="p-5 flex flex-col gap-3 items-start">
            {['78%', '92%', '64%', '46%'].map((w, i) => (
              <div key={i} className={`${sk} rounded-full h-3.5`} style={{ width: w, opacity: 1 - i * 0.15 }} />
            ))}
          </div>
        </div>
      </div>
    </PageSkeleton>
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans font-black overflow-x-hidden relative selection:bg-orange-500/20 dark:selection:bg-yellow-400/20 hacker:selection:bg-green-500/20 flex flex-col transition-colors duration-500">

      {/* 🌸 สไตล์ 3D แบบครอบคลุมทุกธีม 🌸 */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(2deg); }
        }
        .float-element { animation: float 6s ease-in-out infinite; }
        
        .glass-card {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(16px);
          border: 4px solid white;
          border-radius: 40px;
          box-shadow: 0 20px 50px rgba(249, 115, 22, 0.15);
          transition: all 0.3s ease;
        }

        .dark .glass-card {
          background: rgba(45, 34, 59, 0.7); 
          border-color: #382E54;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
        }

        .hacker .glass-card {
          background: rgba(10, 10, 10, 0.85); 
          border-color: #166534; 
          box-shadow: 0 20px 50px rgba(34, 197, 94, 0.15);
        }
        
        .btn-squishy {
          transition: transform 0.1s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.1s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s, border-color 0.2s, color 0.2s;
        }
        .btn-squishy:hover { transform: scale(1.02) translateY(-2px); }
        .btn-squishy:active { transform: scale(0.98) translateY(6px); box-shadow: 0 0 0 transparent !important; }

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

      {/* 🎈 Background Blobs เปลี่ยนสีตามธีม 🎈 */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-400 dark:bg-yellow-500 hacker:bg-green-600 rounded-full blur-[100px] opacity-30 dark:opacity-10 hacker:opacity-10 float-element pointer-events-none z-0 transition-colors duration-500" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-amber-400 dark:bg-yellow-600 hacker:bg-green-700 rounded-full blur-[100px] opacity-30 dark:opacity-10 hacker:opacity-10 float-element pointer-events-none z-0 transition-colors duration-500" style={{ animationDelay: '1.5s' }} />

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="max-w-3xl w-full flex flex-col items-center text-center space-y-8 relative z-10"
        >
          <div className="space-y-6 flex flex-col items-center">

            {/* 🏷️ Badge ด้านบน */}
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-5 py-2 bg-white/80 dark:bg-[#1E1B2E]/80 hacker:bg-[#0a0a0a]/80 border-4 border-white dark:border-[#382E54] hacker:border-[#166534] rounded-full shadow-sm btn-squishy transition-colors duration-500">
              <span className="relative flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isHacker ? 'bg-green-400' : isDark ? 'bg-yellow-400' : 'bg-orange-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${isHacker ? 'bg-green-500' : isDark ? 'bg-yellow-500' : 'bg-orange-500'}`}></span>
              </span>
              <span className={`font-sans text-[12px] font-black tracking-widest uppercase ${isHacker ? 'text-green-500' : isDark ? 'text-yellow-400' : 'text-orange-600'}`}>KeyRush</span>
            </motion.div>

            {/* 👋 ข้อความต้อนรับ */}
            <motion.h1 variants={itemVariants} className={`cute-header text-5xl md:text-7xl font-black leading-[1.1] tracking-tighter drop-shadow-sm transition-colors duration-500 ${isHacker ? 'text-green-500' : isDark ? 'text-yellow-400' : 'text-orange-600'}`}>
              Welcome back,<br />
              <span className={isHacker ? 'text-white' : isDark ? 'text-white' : 'text-[#5D4037]'}>
                {getShowName()}
              </span>
            </motion.h1>

            {/* 📝 ฟอร์มเปลี่ยนชื่อแบบน่ารัก */}
            <AnimatePresence mode="wait">
              {showForm ? (
                <motion.form
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ type: "spring" as const, bounce: 0.4 }}
                  onSubmit={handleUpdateName}
                  className="mt-6 relative z-20 w-full max-w-lg"
                >
                  <div className="flex flex-col items-center gap-3 w-full">
                    <p className={`text-xs font-black tracking-widest uppercase px-3 py-1 rounded-md border-2 transition-colors duration-500 ${isHacker ? 'bg-[#0a0a0a]/50 border-[#166534] text-green-600' : isDark ? 'bg-[#1E1B2E]/50 border-[#382E54] text-white/60' : 'bg-white/50 border-white text-orange-800'}`}>Your Display Name</p>

                    <div className={`flex items-center w-full border-4 rounded-full p-2 pl-6 shadow-sm transition-all duration-500 ${isHacker ? 'bg-[#111]/90 border-[#166534] focus-within:border-green-500' : isDark ? 'bg-[#2D223B]/90 border-[#4B3965] focus-within:border-yellow-400' : 'bg-white/90 border-white focus-within:border-orange-300'}`}>
                      <Terminal className={`mr-3 shrink-0 transition-colors duration-500 ${isHacker ? 'text-green-600' : isDark ? 'text-yellow-500' : 'text-orange-400'}`} size={20} strokeWidth={3} />
                      <input
                        type="text"
                        maxLength={20}
                        value={newDisplayName}
                        onChange={(e) => { setNewDisplayName(e.target.value); if (nameError) setNameError(null); }}
                        placeholder="ตั้งชื่อเล่นสายลับของคุณ..."
                        className={`bg-transparent border-none outline-none font-black text-base w-full transition-colors duration-500 ${isHacker ? 'text-green-400 placeholder:text-green-800' : isDark ? 'text-white placeholder:text-white/30' : 'text-orange-950 placeholder:text-[#5D4037]/50'}`}
                        autoFocus
                      />

                      {/* 🌟 กลุ่มปุ่มควบคุม (Enter & Cancel) 🌟 */}
                      <div className="flex items-center gap-2 ml-2 pr-1">
                        <button
                          type="submit"
                          disabled={isUpdating || !newDisplayName.trim()}
                          className={`w-[80px] h-[40px] text-[10px] md:text-xs rounded-full font-black transition-colors uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-sm shrink-0 btn-squishy ${isHacker ? 'bg-green-600 hover:bg-green-500 text-[#0a0a0a]' : isDark ? 'bg-yellow-400 hover:bg-yellow-300 text-[#1E1B2E]' : 'bg-orange-500 hover:bg-orange-400 text-white'}`}
                        >
                          {isUpdating ? 'SYNC...' : 'ENTER'}
                        </button>

                        {user?.displayName && (
                          <button
                            type="button"
                            onClick={handleCancelNameEdit}
                            disabled={isUpdating}
                            className={`w-[80px] h-[40px] text-[10px] md:text-xs rounded-full font-black transition-colors uppercase tracking-widest disabled:opacity-50 flex items-center justify-center shadow-sm shrink-0 btn-squishy ${isHacker ? 'bg-rose-900/30 hover:bg-rose-900/50 text-rose-500' : isDark ? 'bg-rose-900/30 hover:bg-rose-900/50 text-rose-400' : 'bg-red-100 hover:bg-red-200 text-red-600'}`}
                          >
                            CANCEL
                          </button>
                        )}
                      </div>
                    </div>

                    {/* ⚠️ เหตุผลที่ตั้งชื่อไม่ผ่าน */}
                    {nameError && (
                      <p className={`text-xs font-black text-center px-4 py-2 rounded-2xl border-2 transition-colors ${isHacker ? 'bg-rose-900/20 border-rose-800 text-rose-400' : isDark ? 'bg-rose-500/10 border-rose-500/40 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-600'}`}>
                        {nameError}
                      </p>
                    )}
                  </div>
                </motion.form>
              ) : (
                <motion.button
                  variants={itemVariants}
                  onClick={() => setShowNameForm(true)}
                  className={`text-xs font-black transition-colors uppercase tracking-widest relative z-20 group flex items-center gap-2 ${isHacker ? 'text-green-600 hover:text-green-400' : isDark ? 'text-white/50 hover:text-yellow-400' : 'text-orange-400 hover:text-orange-600'}`}
                >
                  <Edit3 size={16} strokeWidth={3} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                  Change Your name
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* 💻 Terminal Log Box */}
          <motion.div variants={itemVariants} className="w-full max-w-2xl glass-card overflow-hidden mt-8 relative z-10 group">

            <div className={`border-b-4 px-5 py-3 flex items-center justify-between relative z-10 transition-colors duration-500 ${isHacker ? 'bg-[#0a0a0a]/80 border-[#166534]' : isDark ? 'bg-[#1E1B2E]/80 border-[#382E54]' : 'bg-white/50 border-white'}`}>
              <div className="flex gap-2">
                <div className={`w-3.5 h-3.5 rounded-full border-2 shadow-sm ${isHacker ? 'bg-rose-500 border-[#0a0a0a]' : isDark ? 'bg-rose-400 border-[#1E1B2E]' : 'bg-red-400 border-white'}`}></div>
                <div className={`w-3.5 h-3.5 rounded-full border-2 shadow-sm ${isHacker ? 'bg-yellow-500 border-[#0a0a0a]' : isDark ? 'bg-yellow-400 border-[#1E1B2E]' : 'bg-amber-400 border-white'}`}></div>
                <div className={`w-3.5 h-3.5 rounded-full border-2 shadow-sm ${isHacker ? 'bg-green-500 border-[#0a0a0a]' : isDark ? 'bg-green-400 border-[#1E1B2E]' : 'bg-green-400 border-white'}`}></div>
              </div>
              <span className={`font-sans text-[11px] font-black tracking-widest uppercase transition-colors duration-500 ${isHacker ? 'text-green-600' : isDark ? 'text-white/50' : 'text-orange-400'}`}>system_boot.log</span>
              <div className="w-10"></div>
            </div>

            <div className={`p-6 md:p-8 font-sans text-[13px] md:text-sm font-black text-left space-y-4 h-64 overflow-hidden relative z-10 transition-colors duration-500 ${isHacker ? 'text-green-500' : isDark ? 'text-white/70' : 'text-orange-800'}`}>

              {/* ค่าที่ใช้ร่วมกันใน Log */}
              {(() => {
                const arrowColor = isHacker ? 'text-green-600' : isDark ? 'text-yellow-500' : 'text-orange-400';
                const okBadge = isHacker ? 'text-[#0a0a0a] bg-green-500' : isDark ? 'text-green-400 bg-green-900/30' : 'text-green-500 bg-green-100';
                const warnBadge = isHacker ? 'text-[#0a0a0a] bg-yellow-500' : isDark ? 'text-yellow-400 bg-yellow-900/30' : 'text-amber-500 bg-amber-100';

                return (
                  <>
                    {logStep >= 1 && (
                      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
                        <span className={arrowColor}>{">"}</span> <span>Authenticating credentials...</span>
                        <span className={`px-2 py-0.5 rounded-md ml-auto ${okBadge}`}>OK</span>
                      </motion.div>
                    )}
                    {logStep >= 2 && (
                      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
                        <span className={arrowColor}>{">"}</span> <span>Loading secure interfaces...</span>
                        <span className={`px-2 py-0.5 rounded-md ml-auto ${okBadge}`}>OK</span>
                      </motion.div>
                    )}
                    {logStep >= 3 && (
                      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
                        <span className={arrowColor}>{">"}</span> <span>Checking user profile...</span>
                        {user?.displayName ? (
                          <span className={`px-2 py-0.5 rounded-md ml-auto flex items-center gap-1 ${okBadge}`}><ShieldCheck size={14} /> SECURE</span>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-md ml-auto flex items-center gap-1 ${warnBadge}`}><ShieldAlert size={14} /> ALIAS REQ</span>
                        )}
                      </motion.div>
                    )}
                    {logStep >= 4 && (
                      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
                        <span className={arrowColor}>{">"}</span> <span>Establishing connection...</span>
                        <span className={`px-2 py-0.5 rounded-md ml-auto ${okBadge}`}>OK</span>
                      </motion.div>
                    )}
                    {logStep >= 5 && (
                      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
                        <span className={arrowColor}>{">"}</span> <span>Syncing local state...</span>
                        <span className={`px-2 py-0.5 rounded-md ml-auto ${okBadge}`}>OK</span>
                      </motion.div>
                    )}
                    {logStep >= 6 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`mt-4 pt-4 border-t-4 flex items-center gap-2 text-base transition-colors duration-500 ${isHacker ? 'border-[#166534] text-green-400' : isDark ? 'border-[#382E54] text-yellow-400' : 'border-white/50 text-orange-600'}`}>
                        <span>{">"} Awaiting your command...</span>
                        <span className={`w-3 h-5 rounded-sm inline-block animate-pulse ${isHacker ? 'bg-green-500' : isDark ? 'bg-yellow-400' : 'bg-orange-500'}`}></span>
                      </motion.div>
                    )}
                  </>
                );
              })()}

              <div className={`absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t pointer-events-none transition-colors duration-500 ${isHacker ? 'from-[#111]/90' : isDark ? 'from-[#2D223B]/90' : 'from-white/90'} to-transparent`}></div>
            </div>
          </motion.div>

          {/* 🚀 ปุ่ม Go to Dashboard */}
          <motion.div variants={itemVariants} className="mt-10 relative z-20 w-full max-w-sm">
            <motion.button
              whileHover={{ scale: showForm ? 1 : 1.05 }}
              whileTap={{ scale: showForm ? 1 : 0.95 }}
              onClick={() => router.push('/dashboard')}
              disabled={showForm}
              className={`w-full font-black text-lg px-8 py-5 rounded-full border-4 transition-all duration-300 flex items-center justify-center gap-3 uppercase tracking-widest relative overflow-hidden btn-squishy
                ${showForm ? 'opacity-50 cursor-not-allowed' : ''}
                ${isHacker
                  ? 'bg-green-600 text-[#0a0a0a] border-green-500 shadow-[0_10px_0_rgba(34,197,94,0.2)] hover:bg-green-500'
                  : isDark
                    ? 'bg-yellow-400 text-[#1E1B2E] border-yellow-500 shadow-[0_10px_0_rgba(250,204,21,0.2)] hover:bg-yellow-300'
                    : 'bg-orange-500 text-white border-white shadow-[0_10px_0_rgba(249,115,22,0.2)] hover:bg-orange-400'
                }`}
            >
              <span className="relative z-10">Go To Dashboard</span>
              <ArrowRight size={24} strokeWidth={4} className="relative z-10 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </motion.div>

        </motion.div>
      </main>
    </div>
  );
}