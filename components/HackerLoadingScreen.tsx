"use client";

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Terminal } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function HackerLoadingScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 🌟 ดึงค่า Theme เพื่อตรวจสอบว่ากำลังใช้โหมดอะไร
  const { theme: activeTheme, resolvedTheme } = useTheme();
  const currentTheme = activeTheme === 'system' ? resolvedTheme : activeTheme;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const letters = '0123456789KEYRUSH@#$%^&*()_+~|}{[]:;?><,./-=';
    const fontSize = 16;
    const columns = canvas.width / fontSize;
    const drops: number[] = [];

    for (let x = 0; x < columns; x++) {
      drops[x] = 1;
    }

    // 🌟 เช็คโหมดเพื่อกำหนดสี Matrix Rain
    const isDark = currentTheme === 'dark' || currentTheme === 'amethyst';
    const isHacker = currentTheme === 'hacker' || currentTheme === 'dragon'; const isDragon = currentTheme === 'dragon';
    const isSakura = currentTheme === 'sakura';

    // สีพื้นหลังเวลาตัวอักษรจางลง (Fade)
    const fadeColor = isHacker
      ? (isDragon ? 'rgba(20, 3, 3, 0.15)' : 'rgba(10, 10, 10, 0.15)') // แฮกเกอร์/มังกร: ดำสนิท
      : isDark
        ? 'rgba(30, 27, 46, 0.15)' // ดาร์ก: ม่วงเข้ม
        : isSakura
          ? 'rgba(255, 241, 245, 0.15)' // ซากุระ: ชมพูอ่อน
          : 'rgba(255, 247, 237, 0.15)'; // สว่าง: ส้มอ่อน

    // สีตัวอักษร Matrix
    const textColor = isHacker
      ? (isDragon ? '#ef4444' : '#22c55e') // แฮกเกอร์: เขียวสว่าง / มังกร: แดง
      : isDark
        ? '#facc15' // ดาร์ก: เหลือง (yellow-400)
        : isSakura
          ? '#ec4899' // ซากุระ: ชมพู (pink-500)
          : '#f97316'; // สว่าง: ส้ม (orange-500)

    const draw = () => {
      ctx.fillStyle = fadeColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = textColor;
      ctx.font = `bold ${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = letters.charAt(Math.floor(Math.random() * letters.length));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 33);
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, [currentTheme]); // 🌟 รีโหลด Canvas ทุกครั้งที่เปลี่ยน Theme เพื่อให้สีเปลี่ยนทันที

  return (
    // 🌟 อัปเกรดคลาส Tailwind ให้รองรับ hacker:... 🌟
    <div className="fixed inset-0 bg-background overflow-hidden flex items-center justify-center font-sans z-[100] transition-colors duration-500">

      {/* 🌟 พื้นหลัง Matrix */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0 opacity-40 dark:opacity-20 hacker:opacity-30 transition-opacity duration-500"
      ></canvas>

      {/* 🌟 การ์ด Loading */}
      <div className="relative z-10 bg-white/80 dark:bg-[#1E1B2E]/80 hacker:bg-[#0a0a0a]/90 border-4 border-white dark:border-[#382E54] hacker:border-green-800 px-12 py-10 rounded-[32px] backdrop-blur-xl shadow-[0_20px_50px_rgba(249,115,22,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] hacker:shadow-[0_20px_50px_rgba(34,197,94,0.15)] flex flex-col items-center transition-colors duration-500">

        {/* ไอคอนเด้งดึ๋ง */}
        <div className="w-20 h-20 bg-orange-100 dark:bg-[#2D223B] hacker:bg-[#111111] rounded-[24px] flex items-center justify-center mb-6 shadow-inner border-2 border-white dark:border-[#4B3965] hacker:border-green-700 transform -rotate-6 animate-pulse transition-colors duration-500">
          <Terminal size={40} strokeWidth={3} className="text-orange-500 dark:text-yellow-400 hacker:text-green-500 transition-colors duration-500" />
        </div>

        {/* ข้อความ */}
        <p className="text-orange-500 dark:text-yellow-400 hacker:text-green-500 tracking-widest text-xl font-black uppercase mb-1 cute-header transition-colors duration-500">
          Loading ...
        </p>
        <p className="text-sm font-bold text-orange-950/40 dark:text-white/40 hacker:text-green-500/60 mb-6 transition-colors duration-500">
          Preparing your mission...
        </p>

        {/* 🌟 หลอดโหลดข้อมูลขอบมน 🌟 */}
        <div className="w-64 h-4 bg-orange-100 dark:bg-[#382E54] hacker:bg-[#111111] overflow-hidden rounded-full border-2 border-white dark:border-[#4B3965] hacker:border-green-800 shadow-inner transition-colors duration-500">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
            className="h-full bg-orange-500 dark:bg-yellow-400 hacker:bg-green-500 rounded-full transition-colors duration-500"
          />
        </div>
      </div>
    </div>
  );
}