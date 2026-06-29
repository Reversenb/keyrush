"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGoogleLogin } from '@react-oauth/google';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { Terminal, CheckCircle, AlertTriangle, RefreshCw } from "lucide-react";

export default function KeyRushOrangeLoginPage() {
  const router = useRouter();

  // 🌟 Theme State
  const { theme: activeTheme, resolvedTheme } = useTheme();
  const currentTheme = activeTheme === 'system' ? resolvedTheme : activeTheme;
  const isDark = currentTheme === 'dark';
  const isHacker = currentTheme === 'hacker';

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' as 'success' | 'error' });

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 4000);
  };

  // 🌟 Google OAuth Handler (ยิงเข้า Hono หลังบ้าน)
  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: tokenResponse.access_token }),
        });

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("เซิร์ฟเวอร์ Backend ไม่ตอบสนอง");
        }

        const data = await response.json();

        if (data.success) {
          localStorage.setItem('keyrush_token', data.token);
          localStorage.setItem('keyrush_user', JSON.stringify(data.user));
          showToast('เข้าสู่ระบบสำเร็จ! 🚀', 'success');

          setTimeout(() => {
            router.push('/welcome');
          }, 800);
        } else {
          showToast(data.message, 'error');
          setLoading(false);
        }
      } catch (err: any) {
        showToast(err.message || 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้', 'error');
        setLoading(false);
      }
    },
    onError: () => {
      showToast('ยกเลิกการเข้าสู่ระบบด้วย Google', 'error');
      setLoading(false);
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground font-sans font-black overflow-x-hidden relative selection:bg-orange-500/20 dark:selection:bg-yellow-400/20 hacker:selection:bg-green-500/20 transition-colors duration-500">

      {/* 🌸 สไตล์ 3D และ Animation 🌸 */}
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
        
        .bounce-in {
          animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        @keyframes bounceIn {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* 🎈 Background Blobs เปลี่ยนสีตามธีม 🎈 */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-400 dark:bg-yellow-500 hacker:bg-green-600 rounded-full blur-[100px] opacity-30 dark:opacity-10 hacker:opacity-10 float-element pointer-events-none z-0 transition-colors duration-500" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-amber-400 dark:bg-yellow-600 hacker:bg-green-700 rounded-full blur-[100px] opacity-30 dark:opacity-10 hacker:opacity-10 float-element pointer-events-none z-0 transition-colors duration-500" style={{ animationDelay: '1.5s' }} />

      {/* 💻 Floating IT Emojis ลอยประดับฉากหลัง */}
      <div className="absolute top-[15%] left-[10%] text-6xl float-element pointer-events-none opacity-80 dark:opacity-30 hacker:opacity-20 transition-opacity">💻</div>
      <div className="absolute bottom-[25%] left-[5%] text-5xl float-element pointer-events-none opacity-80 dark:opacity-30 hacker:opacity-20 transition-opacity" style={{ animationDelay: '1s' }}>🚀</div>
      <div className="absolute top-[25%] right-[10%] text-7xl float-element pointer-events-none opacity-80 dark:opacity-30 hacker:opacity-20 transition-opacity" style={{ animationDelay: '2s' }}>💾</div>
      <div className="absolute bottom-[20%] right-[15%] text-6xl float-element pointer-events-none opacity-80 dark:opacity-30 hacker:opacity-20 transition-opacity" style={{ animationDelay: '0.5s' }}>🎯</div>

      {/* 🎯 โลโก้ KeyRush ย้อนกลับหน้าหลัก (มุมซ้ายบน) 🎯 */}
      <div className="absolute top-6 left-6 md:top-8 md:left-10 z-50">
        <Link
          href="/"
          style={{ textDecoration: 'none' }}
          className="flex items-center gap-3 transition-all hover:scale-105 cursor-pointer group btn-squishy no-underline hover:no-underline"
        >
          <div className="w-10 h-10 bg-orange-500 dark:bg-yellow-400 hacker:bg-green-500 text-white dark:text-[#1E1B2E] hacker:text-[#0a0a0a] rounded-2xl shadow-md flex items-center justify-center transform -rotate-6 border-2 border-white dark:border-transparent hacker:border-transparent group-hover:rotate-0 transition-all">
            <Terminal size={22} strokeWidth={4} />
          </div>
          <span className="text-2xl font-black tracking-tight text-orange-600 dark:text-yellow-400 hacker:text-green-500 no-underline hover:no-underline transition-colors duration-500" style={{ textDecoration: 'none' }}>KeyRush</span>
        </Link>
      </div>

      {/* 🌟 Custom Toast Pop-up เด้งละมุน 🌟 */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`fixed top-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-4 border-4 rounded-[24px] backdrop-blur-xl shadow-xl transition-colors duration-500
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

      <div className="w-full min-h-screen flex flex-col items-center justify-center p-6">

        {/* 📦 Main Login Card */}
        <main className="relative z-10 w-full max-w-[450px] glass-card p-10 text-center bounce-in">

          {/* Mascot กล่องสี่เหลี่ยมเอียงหมุนได้สุดคิ้วท์ */}
          <div className="relative inline-block mb-8 group">
            <div className="w-24 h-24 bg-orange-500 dark:bg-[#2D223B] hacker:bg-[#111] text-white dark:text-yellow-400 hacker:text-green-500 rounded-[30px] shadow-xl flex items-center justify-center text-4xl transform -rotate-6 border-4 border-white dark:border-[#4B3965] hacker:border-[#166534] group-hover:rotate-0 transition-transform duration-300">
              {loading ? <RefreshCw className="animate-spin" size={44} strokeWidth={3} /> : <Terminal size={44} strokeWidth={3} />}
            </div>
          </div>

          {/* Header ข้อความ */}
          <h1 className="cute-header text-4xl font-black mb-2 text-orange-600 dark:text-yellow-400 hacker:text-green-500 leading-none transition-colors duration-500">
            Welcome Back
          </h1>
          <p className="text-orange-800 dark:text-white/60 hacker:text-green-600/70 font-black mb-10 text-sm transition-colors duration-500">
            เข้าสู่ระบบฝึกซ้อมคีย์ลัดด้วยบัญชี Google ของคุณ 🚀
          </p>

          {/* 🌟 Google Login Button Only */}
          <div className="mb-4">
            <button
              type="button"
              onClick={() => loginWithGoogle()}
              disabled={loading}
              className={`w-full py-5 bg-white dark:bg-[#2D223B] hacker:bg-[#111] text-orange-950 dark:text-white hacker:text-green-500 border-4 border-orange-100 dark:border-[#4B3965] hacker:border-[#166534] rounded-full font-black text-lg btn-squishy flex items-center justify-center gap-4 shadow-sm hover:border-orange-300 dark:hover:border-yellow-400 hacker:hover:border-green-500 transition-colors duration-300 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <RefreshCw className="animate-spin text-orange-500 dark:text-yellow-400 hacker:text-green-500" size={24} strokeWidth={3} />
              ) : (
                <>
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-6 w-6">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                  <span>Sign In with Google</span>
                </>
              )}
            </button>
          </div>

          <p className="mt-6 text-xs font-bold text-orange-400 dark:text-white/40 hacker:text-green-700 transition-colors duration-500">
            ระบบจะสร้างบัญชีสายลับให้ใหม่ทันทีหากคุณยังไม่เคยลงทะเบียน 🕶️
          </p>

        </main>

        <footer className="mt-8 text-center relative z-10 text-xs font-black text-orange-400 dark:text-white/30 hacker:text-green-700 tracking-widest uppercase transition-colors duration-500">
          © 2026 KEYRUSH SYSTEM 💖
        </footer>
      </div>
    </div>
  );
}