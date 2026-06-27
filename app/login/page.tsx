"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGoogleLogin } from '@react-oauth/google';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { Lock, User, Terminal, UserPlus, Mail, Eye, EyeOff, RefreshCw, IdCard, CheckCircle, AlertTriangle } from "lucide-react";

export default function KeyRushOrangeLoginPage() {
  const router = useRouter();

  // 🌟 Theme State
  const { theme: activeTheme, resolvedTheme } = useTheme();
  const currentTheme = activeTheme === 'system' ? resolvedTheme : activeTheme;
  const isDark = currentTheme === 'dark';
  const isHacker = currentTheme === 'hacker';

  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // 🌟 State ระบบแจ้งเตือน Pop-up และปุ่มส่งอีเมลซ้ำ
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' as 'success' | 'error' });
  const [showResendBtn, setShowResendBtn] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 4000);
  };

  // 🌟 Google OAuth Handler
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
          router.push('/welcome');
        } else {
          showToast(data.message, 'error');
        }
      } catch (err: any) {
        showToast(err.message || 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้', 'error');
      } finally {
        setLoading(false);
      }
    },
    onError: () => showToast('ยกเลิกการเข้าสู่ระบบด้วย Google', 'error'),
  });

  // 🌟 ระบบลืมรหัสผ่าน
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: identifier }),
      });

      const data = await response.json();
      if (data.success) {
        showToast(data.message, 'success');
      } else {
        showToast(data.message || 'เกิดข้อผิดพลาด', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 🌟 ระบบส่งอีเมลยืนยันซ้ำ
  const handleResendEmail = async () => {
    if (!identifier) {
      showToast("กรุณากรอก Username หรือ Email ก่อนนะ 🥺", "error");
      return;
    }

    setIsResending(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: identifier })
      });

      const data = await response.json();
      if (data.success) {
        showToast("ส่งลิงก์ยืนยันตัวตนใหม่สำเร็จแล้วจ้า! ✨", "success");
        setShowResendBtn(false);
      } else {
        showToast(data.message || "เกิดข้อผิดพลาดในการส่งอีเมลซ้ำ", "error");
      }
    } catch (err) {
      showToast("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์", "error");
    } finally {
      setIsResending(false);
    }
  };

  // 🌟 ระบบส่ง Form หลัก
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowResendBtn(false);

    if (isForgotPassword) {
      return handleForgotPassword(e);
    }

    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = isLogin
        ? { username: identifier, password }
        : { username: identifier, email, password, displayName };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("เซิร์ฟเวอร์ Backend ไม่ตอบสนอง");
      }

      const data = await response.json();

      if (data.success) {
        if (isLogin) {
          localStorage.setItem('keyrush_token', data.token);
          localStorage.setItem('keyrush_user', JSON.stringify(data.user));
          router.push('/welcome');
        } else {
          showToast(data.message || 'สร้างบัญชีสำเร็จ! ตรวจสอบอีเมลเพื่อยืนยันตัวตนนะ 💖', 'success');
          setIsLogin(true);
          setPassword('');
          setDisplayName('');
          setEmail('');
        }
      } else {
        showToast(data.message || 'เกิดข้อผิดพลาด', 'error');
        if (isLogin && data.message.includes('ยืนยันอีเมล')) {
          setShowResendBtn(true);
        }
      }
    } catch (err: any) {
      showToast(err.message || 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้', 'error');
    } finally {
      setLoading(false);
    }
  };

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
        <main className="relative z-10 w-full max-w-[500px] glass-card p-10 text-center bounce-in">

          {/* Mascot กล่องสี่เหลี่ยมเอียงหมุนได้สุดคิ้วท์ */}
          <div className="relative inline-block mb-8 group">
            <div className="w-24 h-24 bg-orange-500 dark:bg-[#2D223B] hacker:bg-[#111] text-white dark:text-yellow-400 hacker:text-green-500 rounded-[30px] shadow-xl flex items-center justify-center text-4xl transform -rotate-6 border-4 border-white dark:border-[#4B3965] hacker:border-[#166534] group-hover:rotate-0 transition-transform duration-300">
              {isForgotPassword ? <RefreshCw size={44} strokeWidth={3} /> : isLogin ? <Terminal size={44} strokeWidth={3} /> : <UserPlus size={44} strokeWidth={3} />}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-amber-400 dark:bg-yellow-500 hacker:bg-green-500 text-white dark:text-[#1E1B2E] hacker:text-[#0a0a0a] w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-lg border-4 border-white dark:border-[#382E54] hacker:border-[#166534] animate-bounce transition-colors duration-500">
              <Lock size={20} strokeWidth={4} />
            </div>
          </div>

          {/* Header ข้อความ */}
          <h1 className="cute-header text-4xl font-black mb-2 text-orange-600 dark:text-yellow-400 hacker:text-green-500 leading-none transition-colors duration-500">
            {isForgotPassword ? 'Reset Password' : isLogin ? 'Welcome Back' : 'Create Profile'}
          </h1>
          <p className="text-orange-800 dark:text-white/60 hacker:text-green-600/70 font-black mb-8 text-sm transition-colors duration-500">
            {isForgotPassword ? 'กู้คืนรหัสผ่านสายลับ 🔐' : isLogin ? 'เข้าสู่ระบบฝึกซ้อมคีย์ลัด 🧡' : 'ลงทะเบียนเปิดรหัสสายลับใหม่ 🚀'}
          </p>

          {/* 🌟 Google Login */}
          {!isForgotPassword && (
            <div className="mb-6">
              <button
                type="button"
                onClick={() => loginWithGoogle()}
                className="w-full py-4 bg-white dark:bg-[#2D223B] hacker:bg-[#111] text-orange-950 dark:text-white hacker:text-green-500 border-4 border-orange-100 dark:border-[#4B3965] hacker:border-[#166534] rounded-full font-black text-sm btn-squishy flex items-center justify-center gap-3 shadow-sm hover:border-orange-300 dark:hover:border-yellow-400 hacker:hover:border-green-500 transition-colors duration-300"
              >
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                </svg>
                <span>Sign In with Google</span>
              </button>
              <div className="flex items-center my-5">
                <div className="flex-grow border-t-4 border-orange-100/50 dark:border-[#382E54] hacker:border-[#166534] rounded-full transition-colors"></div>
                <span className="mx-3 text-xs font-black text-orange-400 dark:text-white/40 hacker:text-green-700 uppercase tracking-wider transition-colors">หรือระบุข้อมูล</span>
                <div className="flex-grow border-t-4 border-orange-100/50 dark:border-[#382E54] hacker:border-[#166534] rounded-full transition-colors"></div>
              </div>
            </div>
          )}

          {/* ฟอร์มกรอกข้อมูล */}
          <form onSubmit={handleFormSubmit} className="space-y-5 text-left">

            {/* REGISTER FIELDS */}
            {!isLogin && !isForgotPassword && (
              <>
                <div className="space-y-1 bounce-in">
                  <label className="text-xs font-black text-orange-800 dark:text-white/60 hacker:text-green-600 uppercase tracking-widest ml-4 transition-colors">Display Name</label>
                  <div className="relative group">
                    <User className="absolute left-6 top-1/2 -translate-y-1/2 text-orange-400 group-focus-within:text-orange-600 dark:text-white/40 dark:group-focus-within:text-yellow-400 hacker:text-green-700 hacker:group-focus-within:text-green-400 transition-colors" size={20} strokeWidth={3} />
                    <input
                      type="text"
                      required
                      maxLength={20}
                      placeholder="ชื่อเล่นเท่ๆ ของคุณ"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full pl-14 pr-6 py-4 bg-white/80 dark:bg-[#2D223B]/80 hacker:bg-[#111]/80 border-4 border-white dark:border-[#4B3965] hacker:border-[#166534] rounded-full focus:outline-none focus:border-orange-300 dark:focus:border-yellow-400 hacker:focus:border-green-500 transition-all font-black text-base text-orange-950 dark:text-white hacker:text-green-400 placeholder:text-[#5D4037]/70 dark:placeholder:text-white/30 hacker:placeholder:text-green-700 shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1 bounce-in">
                  <label className="text-xs font-black text-orange-800 dark:text-white/60 hacker:text-green-600 uppercase tracking-widest ml-4 transition-colors">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-orange-400 group-focus-within:text-orange-600 dark:text-white/40 dark:group-focus-within:text-yellow-400 hacker:text-green-700 hacker:group-focus-within:text-green-400 transition-colors" size={20} strokeWidth={3} />
                    <input
                      type="email"
                      required
                      placeholder="example@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-14 pr-6 py-4 bg-white/80 dark:bg-[#2D223B]/80 hacker:bg-[#111]/80 border-4 border-white dark:border-[#4B3965] hacker:border-[#166534] rounded-full focus:outline-none focus:border-orange-300 dark:focus:border-yellow-400 hacker:focus:border-green-500 transition-all font-black text-base text-orange-950 dark:text-white hacker:text-green-400 placeholder:text-[#5D4037]/70 dark:placeholder:text-white/30 hacker:placeholder:text-green-700 shadow-sm"
                    />
                  </div>
                </div>
              </>
            )}

            {/* COMMON FIELD: USERNAME */}
            <div className="space-y-1">
              <h1 className="text-xs font-black text-orange-800 dark:text-white/60 hacker:text-green-600 uppercase tracking-widest ml-4 transition-colors">Student ID / Username</h1>
              <div className="relative group">
                <IdCard className="absolute left-6 top-1/2 -translate-y-1/2 text-orange-400 group-focus-within:text-orange-600 dark:text-white/40 dark:group-focus-within:text-yellow-400 hacker:text-green-700 hacker:group-focus-within:text-green-400 transition-colors" size={20} strokeWidth={3} />
                <input
                  type="text"
                  required
                  maxLength={14}
                  placeholder="ระบุไอดีสายลับ"
                  value={identifier}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^[a-zA-Z0-9_-]*$/.test(val)) setIdentifier(val);
                  }}
                  className="w-full pl-14 pr-6 py-4 bg-white/80 dark:bg-[#2D223B]/80 hacker:bg-[#111]/80 border-4 border-white dark:border-[#4B3965] hacker:border-[#166534] rounded-full focus:outline-none focus:border-orange-300 dark:focus:border-yellow-400 hacker:focus:border-green-500 transition-all font-black text-base text-orange-950 dark:text-white hacker:text-green-400 placeholder:text-[#5D4037]/70 dark:placeholder:text-white/30 hacker:placeholder:text-green-700 shadow-sm"
                />
              </div>
            </div>

            {/* COMMON FIELD: PASSWORD */}
            {!isForgotPassword && (
              <div className="space-y-1">
                <div className="flex justify-between items-center px-4">
                  <label className="text-xs font-black text-orange-800 dark:text-white/60 hacker:text-green-600 uppercase tracking-widest transition-colors">Password</label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => { setIsForgotPassword(true); setToast({ show: false, msg: '', type: 'success' }); }}
                      className="text-xs font-black text-orange-600 dark:text-yellow-400 hacker:text-green-500 hover:text-orange-700 dark:hover:text-yellow-300 hacker:hover:text-green-400 hover:underline transition-colors"
                    >
                    </button>
                  )}
                </div>
                <div className="relative group">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-orange-400 group-focus-within:text-orange-600 dark:text-white/40 dark:group-focus-within:text-yellow-400 hacker:text-green-700 hacker:group-focus-within:text-green-400 transition-colors" size={20} strokeWidth={3} />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    maxLength={20}
                    placeholder="รหัสผ่านเข้าคลังข้อมูล"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-14 pr-14 py-4 bg-white/80 dark:bg-[#2D223B]/80 hacker:bg-[#111]/80 border-4 border-white dark:border-[#4B3965] hacker:border-[#166534] rounded-full focus:outline-none focus:border-orange-300 dark:focus:border-yellow-400 hacker:focus:border-green-500 transition-all font-black text-base text-orange-950 dark:text-white hacker:text-green-400 placeholder:text-[#5D4037]/70 dark:placeholder:text-white/30 hacker:placeholder:text-green-700 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-orange-400 hover:text-orange-600 dark:text-white/40 dark:hover:text-yellow-400 hacker:text-green-700 hacker:hover:text-green-400 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} strokeWidth={3} /> : <Eye size={20} strokeWidth={3} />}
                  </button>
                </div>
              </div>
            )}

            {/* BUTTON SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-5 mt-2 rounded-[30px] text-xl font-black btn-squishy border-4 flex items-center justify-center gap-3 disabled:opacity-50 transition-all duration-300 
                ${isHacker
                  ? 'bg-green-600 text-[#0a0a0a] border-green-500 shadow-[0_8px_0_#14532d] hover:bg-green-500'
                  : isDark
                    ? 'bg-yellow-400 text-[#1E1B2E] border-yellow-500 shadow-[0_8px_0_#ca8a04] hover:bg-yellow-300'
                    : 'bg-orange-500 text-white border-white shadow-[0_8px_0_rgba(249,115,22,0.2)] hover:bg-orange-400'}`}
            >
              {loading ? (
                <RefreshCw className="animate-spin" size={24} strokeWidth={3} />
              ) : (
                <>
                  <span>
                    {isForgotPassword ? 'ส่งลิงก์กู้คืน 🚀' : isLogin ? 'เข้าสู่ระบบ 🚀' : 'สมัครสมาชิก 🚀'}
                  </span>
                </>
              )}
            </button>
          </form>

          {/* 🌟 ระบบส่งเมลยืนยันซ้ำ */}
          <AnimatePresence>
            {showResendBtn && isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-50 dark:bg-rose-900/20 hacker:bg-[#111] border-4 border-white dark:border-rose-900/50 hacker:border-rose-900 rounded-3xl p-4 mt-5 text-center overflow-hidden shadow-sm transition-colors duration-500"
              >
                <p className="text-red-500 dark:text-rose-400 hacker:text-rose-500 text-xs mb-3 font-black transition-colors duration-500">
                  📬 ไม่ได้รับอีเมลยืนยันตัวตน หรือลิงก์หมดอายุใช่ไหม?
                </p>
                <button
                  type="button"
                  onClick={handleResendEmail}
                  disabled={isResending}
                  className="w-full py-3 bg-white dark:bg-[#1E1B2E] hacker:bg-[#0a0a0a] border-4 border-red-100 dark:border-rose-900/50 hacker:border-rose-900 text-red-500 dark:text-rose-400 hacker:text-rose-500 hover:border-red-300 dark:hover:border-rose-400 hacker:hover:border-rose-500 text-xs font-black uppercase tracking-widest rounded-full transition-all btn-squishy flex items-center justify-center gap-2 shadow-sm"
                >
                  {isResending ? "กำลังส่งข้อมูล..." : "ส่งอีเมลยืนยันอีกครั้ง ✉️"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ลิงก์สลับหน้าสถานะด้านล่างสุด */}
          <div className="mt-8 text-sm font-black text-orange-400 dark:text-white/50 hacker:text-green-600 transition-colors duration-500">
            {isForgotPassword ? (
              <p className="animate-in fade-in">
                จำรหัสผ่านได้แล้วหรอ?{' '}
                <button
                  type="button"
                  onClick={() => { setIsForgotPassword(false); setToast({ show: false, msg: '', type: 'success' }); }}
                  className="text-orange-600 dark:text-yellow-400 hacker:text-green-400 hover:underline font-black transition-colors"
                >
                  กลับไปหน้าเข้าสู่ระบบ
                </button>
              </p>
            ) : (
              <p>
                {isLogin ? "ยังไม่มีบัญชีสายลับ? " : "มีรหัสผ่านสายลับอยู่แล้ว? "}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setShowResendBtn(false);
                    setToast({ show: false, msg: '', type: 'success' });
                  }}
                  className="text-orange-600 dark:text-yellow-400 hacker:text-green-400 hover:underline font-black transition-colors"
                >
                  {isLogin ? 'สมัครสมาชิกที่นี่' : 'เข้าสู่ระบบที่นี่'}
                </button>
              </p>
            )}
          </div>
        </main>

        <footer className="mt-8 text-center relative z-10 text-xs font-black text-orange-400 dark:text-white/30 hacker:text-green-700 tracking-widest uppercase transition-colors duration-500">
          © 2026 KEYRUSH SYSTEM 💖
        </footer>
      </div>
    </div>
  );
}