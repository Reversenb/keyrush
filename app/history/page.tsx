"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import Navbar from '@/components/Navbar';
import HackerLoadingScreen from '@/components/HackerLoadingScreen';
import {
  History as HistoryIcon, Terminal, Monitor, Database,
  FileText, Clock, Star, X, ListFilter, Zap, ChevronLeft, ChevronRight, CalendarDays
} from 'lucide-react';
import { apiFetch, clearUserState } from '@/lib/api';

// วันแบบ local เป็น key "YYYY-MM-DD" (ไม่ใช้ toISOString เพราะจะเพี้ยนข้ามวันตาม timezone)
const dateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// =========================================================================
// 📅 ปฏิทินประวัติ — วันไหนมีภารกิจจะมีพื้นสี accent (เข้มตามจำนวน) + จุด
// จิ้มวันเพื่อกรองตาราง จิ้มซ้ำเพื่อล้าง เลื่อนดูเดือนก่อนหน้าได้
// =========================================================================
function HistoryCalendar({ activityByDay, selectedDate, onSelect, isDark, isHacker, isDragon, isSakura }: {
  activityByDay: Record<string, number>;
  selectedDate: string | null;
  onSelect: (key: string | null) => void;
  isDark: boolean; isHacker: boolean; isDragon: boolean; isSakura: boolean;
}) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const y = viewDate.getFullYear(), m = viewDate.getMonth();
  const startDow = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const monthLabel = viewDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
  const todayKey = dateKey(today);
  const maxCount = Math.max(1, ...Object.values(activityByDay));

  const accentHex = isHacker ? (isDragon ? '#ef4444' : '#22c55e') : isDark ? '#facc15' : isSakura ? '#ec4899' : '#f97316';
  const navBtn = `btn-squishy size-9 rounded-xl border-2 flex items-center justify-center transition-colors ${isHacker ? 'bg-[#111] border-green-800 text-green-500 hover:border-green-500' : isDark ? 'bg-[#2D223B] border-[#4B3965] text-yellow-400 hover:border-yellow-400' : 'bg-white border-orange-100 text-orange-500 hover:border-orange-300'}`;
  const selectedCls = isHacker ? 'bg-green-500 text-[#0a0a0a] border-green-300 shadow-md scale-105' : isDark ? 'bg-yellow-400 text-[#1E1B2E] border-yellow-200 shadow-md scale-105' : 'bg-orange-500 text-white border-white shadow-md scale-105';
  const inkCls = isHacker ? 'text-green-400' : isDark ? 'text-white/90' : 'text-orange-950';
  const mutedCls = isHacker ? 'text-green-900' : isDark ? 'text-white/25' : 'text-orange-200';

  return (
    <div className="w-full">
      {/* หัวปฏิทิน: เดือน + ปุ่มเลื่อน */}
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-sm font-black uppercase tracking-widest flex items-center gap-2 transition-colors ${isHacker ? 'text-green-500' : isDark ? 'text-yellow-400' : 'text-orange-600'}`}>
          <CalendarDays size={18} strokeWidth={3} /> {monthLabel}
        </h3>
        <div className="flex gap-2">
          <button onClick={() => setViewDate(new Date(y, m - 1, 1))} className={navBtn} aria-label="เดือนก่อนหน้า"><ChevronLeft size={18} strokeWidth={3} /></button>
          <button onClick={() => setViewDate(new Date(y, m + 1, 1))} className={navBtn} aria-label="เดือนถัดไป"><ChevronRight size={18} strokeWidth={3} /></button>
        </div>
      </div>

      {/* หัวตาราง วันในสัปดาห์ */}
      <div className="grid grid-cols-7 gap-1.5 mb-1.5">
        {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(d => (
          <div key={d} className={`text-center text-[10px] font-black uppercase py-1 ${isHacker ? 'text-green-700' : isDark ? 'text-white/40' : 'text-orange-300'}`}>{d}</div>
        ))}
      </div>

      {/* ช่องวัน */}
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: startDow }).map((_, i) => <div key={`b${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const key = dateKey(new Date(y, m, day));
          const count = activityByDay[key] || 0;
          const isSelected = selectedDate === key;
          const isToday = key === todayKey;
          // พื้นเข้มตามสัดส่วนจำนวนภารกิจของวันนั้น
          const tint = count > 0 ? { backgroundColor: `${accentHex}${Math.round((0.14 + 0.3 * (count / maxCount)) * 255).toString(16).padStart(2, '0')}` } : undefined;

          return (
            <button
              key={key}
              onClick={() => onSelect(isSelected ? null : key)}
              title={count > 0 ? `${count} ภารกิจ` : 'ไม่มีภารกิจ'}
              className={`relative aspect-square rounded-xl border-2 text-xs font-black flex flex-col items-center justify-center transition-all btn-squishy
                ${isSelected ? selectedCls : `border-transparent ${count > 0 ? inkCls : mutedCls} ${isHacker ? 'hover:border-green-700' : isDark ? 'hover:border-[#4B3965]' : 'hover:border-orange-200'}`}
                ${isToday && !isSelected ? (isHacker ? 'border-green-600' : isDark ? 'border-yellow-500/70' : 'border-orange-400') : ''}`}
              style={isSelected ? undefined : tint}
            >
              {day}
              {count > 0 && !isSelected && <span className="absolute bottom-1 size-1.5 rounded-full" style={{ backgroundColor: accentHex }} />}
            </button>
          );
        })}
      </div>

      {/* แถบสถานะตัวกรองวัน */}
      {selectedDate ? (
        <button
          onClick={() => onSelect(null)}
          className={`mt-4 w-full flex items-center justify-between gap-2 px-4 py-3 rounded-2xl border-2 text-xs font-black transition-colors btn-squishy ${isHacker ? 'bg-green-900/20 border-green-700 text-green-400 hover:border-green-500' : isDark ? 'bg-yellow-400/10 border-yellow-500/50 text-yellow-300 hover:border-yellow-400' : 'bg-orange-50 border-orange-200 text-orange-600 hover:border-orange-400'}`}
        >
          <span>📅 {new Date(selectedDate + 'T00:00:00').toLocaleDateString('th-TH', { dateStyle: 'long' })} · {activityByDay[selectedDate] || 0} ภารกิจ</span>
          <X size={16} strokeWidth={3} />
        </button>
      ) : (
        <p className={`mt-4 text-center text-[10px] font-black uppercase tracking-widest ${isHacker ? 'text-green-800' : isDark ? 'text-white/30' : 'text-orange-300'}`}>
          จิ้มวันที่มีจุดเพื่อดูประวัติของวันนั้น
        </p>
      )}
    </div>
  );
}

export default function HistoryPage() {
  const router = useRouter();

  // 🌟 ระบบ Theme
  const { theme: activeTheme, resolvedTheme } = useTheme();
  const currentTheme = activeTheme === 'system' ? resolvedTheme : activeTheme;
  const isDark = currentTheme === 'dark';
  const isHacker = currentTheme === 'hacker' || currentTheme === 'dragon'; const isDragon = currentTheme === 'dragon';

  // 🌟 Auth & State
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'linux' | 'windows'>('all');
  const [selectedLog, setSelectedLog] = useState<any>(null);
  // วันที่เลือกจากปฏิทิน (YYYY-MM-DD) — null = แสดงทุกวัน
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // 🛡️ กัน hydration mismatch: สีปฏิทิน/เกรดคำนวณจาก useTheme() ใน JS
  // ตอน SSR server ไม่รู้ธีม → รอ mount ฝั่ง client ก่อนค่อย render ของจริง
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        // ดึงประวัติทั้งหมด (endpoint /stats ตัดเหลือ 5 รายการล่าสุด ทำให้วันเก่าๆ หาย)
        const res = await apiFetch('/api/user/history');

        if (res.status === 401 || res.status === 403) {
          clearUserState();
          router.push('/login');
          return;
        }

        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setLogs(data.data);
        }
      } catch (err) {
        console.error("Failed to load history", err);
      } finally {
        setTimeout(() => setLoading(false), 600);
      }
    };

    fetchHistory();
  }, [router]);

  // 🌟 นับจำนวนภารกิจต่อวัน (สำหรับปฏิทิน)
  const activityByDay = useMemo(() => {
    const map: Record<string, number> = {};
    logs.forEach(log => {
      const key = dateKey(new Date(log.createdAt));
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [logs]);

  // 🌟 กรองข้อมูลตาม OS + วันที่เลือกจากปฏิทิน
  const filteredLogs = logs.filter(log => {
    if (filter !== 'all' && log.os !== filter) return false;
    if (selectedDate && dateKey(new Date(log.createdAt)) !== selectedDate) return false;
    return true;
  });

  // EXP ที่ได้ในรอบนั้น — เผื่อชื่อ field หลายแบบจาก backend, ไม่มีข้อมูลคืน null
  const getLogExp = (log: any): number | null => {
    const v = log.earnedExp ?? log.exp ?? log.expEarned ?? log.rewardExp;
    return typeof v === 'number' ? v : null;
  };

  const getAccColorClass = (acc: number) => {
    if (acc < 80) return 'text-rose-500 bg-rose-100 dark:bg-rose-500/20 hacker:bg-rose-900/20 border-2 border-white dark:border-rose-500/30 hacker:border-rose-900/50';
    if (acc < 95) return 'text-amber-500 bg-amber-100 dark:bg-amber-500/20 hacker:bg-amber-900/20 border-2 border-white dark:border-amber-500/30 hacker:border-amber-900/50';
    return 'text-green-500 bg-green-100 dark:bg-green-500/20 hacker:bg-green-900/20 border-2 border-white dark:border-green-500/30 hacker:border-green-900/50';
  };

  // 🌟 ฟังก์ชันคำนวณเกรด รองรับ 3 ธีม
  const getMissionGrade = (acc: number, os: string) => {
    const isLnx = os === 'linux';
    const mainClr = isHacker ? 'text-green-500' : isDark ? (isLnx ? 'text-yellow-400' : 'text-blue-400') : (isLnx ? 'text-orange-500' : 'text-blue-500');

    let border = '';
    if (isHacker) border = 'border-4 border-green-800 bg-green-900/20 shadow-sm';
    else if (isDark) border = isLnx ? 'border-4 border-yellow-400/30 bg-yellow-400/10 shadow-sm' : 'border-4 border-blue-400/30 bg-blue-500/20 shadow-sm';
    else border = isLnx ? 'border-4 border-white bg-orange-100 shadow-sm' : 'border-4 border-white bg-blue-100 shadow-sm';

    if (acc >= 98) return { rank: 'S', color: mainClr, border, stars: 5, label: 'Perfect' };
    if (acc >= 90) return { rank: 'A', color: isHacker ? 'text-green-400' : 'text-green-500 dark:text-green-400', border: isHacker ? 'border-4 border-green-700 bg-green-900/20 shadow-sm' : 'border-4 border-white dark:border-green-400/30 bg-green-100 dark:bg-green-400/10 shadow-sm', stars: 4, label: 'Great' };
    if (acc >= 75) return { rank: 'B', color: isHacker ? 'text-green-600' : 'text-amber-500 dark:text-amber-400', border: isHacker ? 'border-4 border-green-900 bg-green-900/10 shadow-sm' : 'border-4 border-white dark:border-amber-400/30 bg-amber-100 dark:bg-amber-400/10 shadow-sm', stars: 3, label: 'Good' };
    if (acc >= 50) return { rank: 'C', color: isHacker ? 'text-green-700' : 'text-orange-400 dark:text-orange-400', border: isHacker ? 'border-4 border-green-900/50 bg-black shadow-sm' : 'border-4 border-white dark:border-orange-400/30 bg-orange-100 dark:bg-orange-400/10 shadow-sm', stars: 2, label: 'Pass' };
    return { rank: 'D', color: isHacker ? 'text-red-700' : 'text-rose-500 dark:text-rose-400', border: isHacker ? 'border-4 border-red-900/50 bg-black shadow-sm' : 'border-4 border-white dark:border-rose-400/30 bg-rose-100 dark:bg-rose-400/10 shadow-sm', stars: 1, label: 'Poor' };
  };

  // ⏳ ยังไม่ mount = ยังไม่รู้ธีมจริง → โชว์พื้นเปล่าธีมกลางไปก่อน กัน hydration mismatch
  if (!mounted) {
    return <div className="bg-background min-h-screen" />;
  }

  return (
    <div className="bg-background font-sans min-h-screen flex flex-col overflow-x-hidden text-foreground selection:bg-orange-500/20 dark:selection:bg-yellow-400/20 hacker:selection:bg-green-500/20 relative transition-colors duration-500">

      {/* 🌟 Background Effects & Styles 🌟 */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(2deg); }
        }
        .float-element { animation: float 6s ease-in-out infinite; }
        .float-delayed { animation: float 7s ease-in-out infinite 1.5s; }
        
        .glass-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(16px);
          border: 4px solid white;
          border-radius: 32px;
          transition: all 0.3s ease;
          box-shadow: 0 10px 30px rgba(249, 115, 22, 0.15);
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
          transition: transform 0.1s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.1s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s, color 0.2s, border-color 0.2s;
        }
        .btn-squishy:hover { transform: translateY(-2px); }
        .btn-squishy:active { transform: translateY(6px); box-shadow: 0 0 0 transparent !important; }

        .btn-pressed {
          transform: translateY(4px);
          box-shadow: 0 0 0 transparent !important;
        }

        .cute-header {
          text-shadow: 2px 2px 0px rgba(255, 255, 255, 1), -1px -1px 0px rgba(255, 255, 255, 1), 1px -1px 0px rgba(255, 255, 255, 1), -1px 1px 0px rgba(255, 255, 255, 1);
          letter-spacing: -0.02em;
        }

        .dark .cute-header { text-shadow: 2px 2px 0px rgba(0, 0, 0, 0.3); }
        .hacker .cute-header { text-shadow: 2px 2px 0px rgba(0, 0, 0, 0.8); }

        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(249,115,22,0.2); border-radius: 4px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(250,204,21,0.2); }
        .hacker .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(34,197,94,0.2); }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(249,115,22,0.4); }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(250,204,21,0.4); }
        .hacker .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(34,197,94,0.4); }
      `}</style>

      {/* 🎈 Background Blobs 🎈 */}
      <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-400 dark:bg-yellow-500 hacker:bg-green-600 rounded-full blur-[100px] opacity-20 dark:opacity-10 hacker:opacity-10 float-element pointer-events-none z-0 transition-colors" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-amber-400 dark:bg-yellow-600 hacker:bg-green-700 rounded-full blur-[100px] opacity-20 dark:opacity-10 hacker:opacity-10 float-delayed pointer-events-none z-0 transition-colors" style={{ animationDelay: '1.5s' }} />

      <AnimatePresence>
        {loading && <HackerLoadingScreen />}
      </AnimatePresence>

      <div className="relative z-40 shrink-0">
        <Navbar theme="linux" />
      </div>

      {/* พื้นที่ Content หลัก */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col gap-6 md:gap-8 relative z-10">

        {/* 🌟 Header & Back Button 🌟 */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-2">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-4xl md:text-6xl font-black text-orange-950 dark:text-white hacker:text-white tracking-tighter uppercase drop-shadow-sm flex items-center gap-4 cute-header transition-colors">
              <HistoryIcon className="text-orange-500 dark:text-yellow-400 hacker:text-green-500" size={48} strokeWidth={3} />
              History
            </h1>
          </motion.div>

          {/* 🌟 Filter Tabs 🌟 */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/80 dark:bg-[#1E1B2E]/80 hacker:bg-[#0a0a0a]/80 p-2 rounded-[24px] border-4 border-white dark:border-[#382E54] hacker:border-green-800 flex shadow-sm overflow-x-auto max-w-full backdrop-blur-md gap-3 transition-colors">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap btn-squishy border-4 
                ${filter === 'all'
                  ? 'btn-pressed bg-orange-100 dark:bg-yellow-400 hacker:bg-green-500 text-orange-700 dark:text-[#1E1B2E] hacker:text-[#0a0a0a] border-orange-300 dark:border-yellow-600 hacker:border-green-400'
                  : 'bg-white dark:bg-[#2D223B] hacker:bg-[#111] border-orange-200 dark:border-[#4B3965] hacker:border-[#166534] shadow-[0_4px_0_#fed7aa] dark:shadow-[0_4px_0_#1E1B2E] hacker:shadow-[0_4px_0_#064e3b] text-orange-400 dark:text-white/60 hacker:text-green-600/60 hover:bg-orange-50 dark:hover:bg-[#382E54] hacker:hover:bg-[#1a1a1a]'}`}
            >
              <ListFilter size={18} strokeWidth={3} /> All
            </button>
            <button
              onClick={() => setFilter('linux')}
              className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap btn-squishy border-4 
                ${filter === 'linux'
                  ? 'btn-pressed bg-orange-500 dark:bg-yellow-400 hacker:bg-green-500 text-white dark:text-[#1E1B2E] hacker:text-[#0a0a0a] border-orange-600 dark:border-yellow-600 hacker:border-green-400'
                  : 'bg-white dark:bg-[#2D223B] hacker:bg-[#111] border-orange-200 dark:border-[#4B3965] hacker:border-[#166534] shadow-[0_4px_0_#fed7aa] dark:shadow-[0_4px_0_#1E1B2E] hacker:shadow-[0_4px_0_#064e3b] text-orange-400 dark:text-white/60 hacker:text-green-600/60 hover:bg-orange-50 dark:hover:bg-[#382E54] hacker:hover:bg-[#1a1a1a]'}`}
            >
              <Terminal size={18} strokeWidth={3} /> Linux
            </button>
            <button
              onClick={() => setFilter('windows')}
              className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap btn-squishy border-4 
                ${filter === 'windows'
                  ? 'btn-pressed bg-blue-500 dark:bg-blue-400 hacker:bg-green-500 text-white dark:text-[#1E1B2E] hacker:text-[#0a0a0a] border-blue-600 dark:border-blue-600 hacker:border-green-400'
                  : 'bg-white dark:bg-[#2D223B] hacker:bg-[#111] border-orange-200 dark:border-[#4B3965] hacker:border-[#166534] shadow-[0_4px_0_#fed7aa] dark:shadow-[0_4px_0_#1E1B2E] hacker:shadow-[0_4px_0_#064e3b] text-orange-400 dark:text-white/60 hacker:text-green-600/60 hover:bg-orange-50 dark:hover:bg-[#382E54] hacker:hover:bg-[#1a1a1a]'}`}
            >
              <Monitor size={18} strokeWidth={3} /> Windows
            </button>
          </motion.div>
        </div>

        {/* 🌟 Calendar + Data Table 🌟 */}
        <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-6 md:gap-8 items-start w-full">

          {/* 📅 ปฏิทินเลือกดูประวัติรายวัน */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card p-4 md:p-6 shadow-sm w-full max-w-md mx-auto xl:max-w-none xl:mx-0 xl:sticky xl:top-24"
          >
            <HistoryCalendar
              activityByDay={activityByDay}
              selectedDate={selectedDate}
              onSelect={setSelectedDate}
              isDark={isDark}
              isHacker={isHacker}
              isDragon={isDragon}
              isSakura={currentTheme === 'sakura'}
            />
          </motion.div>

          {/* 🌟 Data Table / Log List 🌟 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full glass-card overflow-hidden shadow-sm relative"
          >
            <div className="overflow-x-auto w-full custom-scrollbar min-h-[500px]">
              <table className="w-full text-left text-sm whitespace-nowrap min-w-[600px]">
                <thead className="bg-orange-100 dark:bg-white/5 hacker:bg-white/5 text-orange-600 dark:text-yellow-400/70 hacker:text-green-500/70 font-black text-[11px] uppercase tracking-widest border-b-4 border-white dark:border-[#382E54] hacker:border-green-800 transition-colors">
                  <tr>
                    <th className="px-5 py-5 w-[32%] min-w-[200px]">Operation Target</th>
                    <th className="px-3 py-5 text-center">Level</th>
                    <th className="px-3 py-5 text-center">EXP</th>
                    <th className="px-3 py-5 text-center">WPM</th>
                    <th className="px-3 py-5 text-center">Precision</th>
                    <th className="px-5 py-5 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y-4 divide-white dark:divide-[#382E54] hacker:divide-[#166534] transition-colors">

                  <AnimatePresence mode="popLayout">
                    {filteredLogs.length > 0 ? (
                      filteredLogs.map((log: any, i: number) => {
                        const isLinux = log.os === 'linux';
                        const themeColor = isHacker ? 'text-green-500' : isLinux ? 'text-orange-500 dark:text-yellow-400' : 'text-blue-500 dark:text-blue-400';
                        const bgIcon = isHacker ? 'bg-green-900/20 border-green-800' : isLinux ? 'bg-orange-100 dark:bg-yellow-400/10 border-white dark:border-transparent' : 'bg-blue-100 dark:bg-blue-500/20 border-white dark:border-transparent';
                        const IconComponent = isLinux ? Terminal : Monitor;

                        return (
                          <motion.tr
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2, delay: i * 0.05 }}
                            onClick={() => setSelectedLog(log)}
                            className="group hover:bg-white/60 dark:hover:bg-white/5 hacker:hover:bg-[#111] transition-colors cursor-pointer relative overflow-hidden"
                          >
                            <td className="px-5 py-4 relative whitespace-normal">
                              <div className={`absolute left-0 top-0 bottom-0 w-2 ${isHacker ? 'bg-green-500' : isLinux ? 'bg-orange-500 dark:bg-yellow-400' : 'bg-blue-500 dark:bg-blue-400'} opacity-0 group-hover:opacity-100 transition-opacity`}></div>

                              <div className="flex items-center gap-3 pl-1">
                                <div className={`w-11 h-11 shrink-0 rounded-[16px] flex items-center justify-center border-4 ${themeColor} ${bgIcon} group-hover:scale-110 transition-transform shadow-sm bg-white dark:bg-[#382E54] hacker:bg-[#0a0a0a]`}>
                                  <IconComponent size={20} strokeWidth={3} />
                                </div>
                                <div className="flex flex-col whitespace-normal">
                                  <span className={`font-black text-orange-950 dark:text-white hacker:text-white text-sm uppercase tracking-wider leading-tight mb-0.5 group-hover:${themeColor} transition-colors`}>
                                    {isLinux ? 'Linux CLI' : 'Windows CMD'}
                                  </span>
                                  <span className={`text-[10px] font-black ${themeColor} uppercase tracking-wider leading-relaxed break-words line-clamp-1`}>
                                    {log.description || '[ Training Mission ]'}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-4 text-center">
                              <div className="inline-flex items-center justify-center bg-white dark:bg-[#382E54] hacker:bg-[#111] border-2 border-orange-100 dark:border-[#4B3965] hacker:border-[#166534] rounded-xl px-3 py-1.5 text-xs font-black text-orange-600 dark:text-yellow-400 hacker:text-green-500 group-hover:border-orange-300 dark:group-hover:border-yellow-500 hacker:group-hover:border-green-400 transition-colors shadow-sm">
                                LVL {log.level}
                              </div>
                            </td>
                            <td className="px-3 py-4 text-center">
                              {getLogExp(log) !== null ? (
                                <span className="inline-flex items-center gap-1 font-black px-3 py-1.5 rounded-xl text-xs tracking-wider text-yellow-600 dark:text-yellow-400 hacker:text-green-400 bg-yellow-100 dark:bg-yellow-500/20 hacker:bg-green-900/20 border-2 border-white dark:border-yellow-500/30 hacker:border-green-900/50 shadow-sm transition-colors">
                                  <Zap size={14} strokeWidth={3} className="fill-current" /> +{getLogExp(log)}
                                </span>
                              ) : (
                                <span className="text-orange-300 dark:text-white/30 hacker:text-green-800 font-black text-xs">—</span>
                              )}
                            </td>
                            <td className="px-3 py-4 text-center">
                              <span className="font-black text-orange-600 dark:text-yellow-400 hacker:text-green-500 text-xl cute-header transition-colors">{log.wpm}</span>
                            </td>
                            <td className="px-3 py-4 text-center">
                              <span className={`font-black px-3 py-1.5 rounded-xl text-xs tracking-wider ${getAccColorClass(log.accuracy)} shadow-sm transition-colors`}>
                                {log.accuracy}%
                              </span>
                            </td>
                            <td
                              className="px-5 py-4 text-right text-orange-400 dark:text-white/50 hacker:text-white/50 text-xs font-black uppercase tracking-wider group-hover:text-orange-600 dark:group-hover:text-yellow-400 hacker:group-hover:text-green-400 transition-colors"
                              title={new Date(log.createdAt).toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'medium' })}
                            >
                              {new Date(log.createdAt).toLocaleString('en-GB', {
                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                              })}
                            </td>
                          </motion.tr>
                        );
                      })
                    ) : (
                      <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <td colSpan={6} className="px-6 py-32 text-center align-middle">
                          <div className="flex flex-col items-center justify-center gap-4 text-orange-400 dark:text-white/50 hacker:text-green-600/50 font-black w-full max-w-lg mx-auto uppercase tracking-widest transition-colors">
                            <Database size={64} strokeWidth={2} className="opacity-40 mb-2 animate-bounce" />
                            <p className="text-sm whitespace-normal">
                              {selectedDate ? 'ไม่มีภารกิจในวันที่เลือก' : 'ยังไม่มีประวัติการทำภารกิจในระบบนี้'}
                            </p>
                            <button
                              onClick={() => selectedDate ? setSelectedDate(null) : router.push('/campaignpage')}
                              className="mt-4 px-8 py-4 bg-orange-500 dark:bg-yellow-400 hacker:bg-green-500 border-4 border-white dark:border-yellow-500 hacker:border-green-600 rounded-[24px] text-white dark:text-[#1E1B2E] hacker:text-[#0a0a0a] font-black tracking-widest text-xs uppercase shadow-[0_6px_0_#c2410c] dark:shadow-[0_6px_0_#ca8a04] hacker:shadow-[0_6px_0_#14532d] btn-squishy hover:bg-orange-400 dark:hover:bg-yellow-300 hacker:hover:bg-green-400"
                            >
                              {selectedDate ? 'ดูทุกวัน' : 'Initiate New Mission'}
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>

                </tbody>
              </table>
            </div>
          </motion.div>

        </div>

      </main>

      {/* 🌟 Footer 🌟 */}
      <footer className="py-8 text-center text-orange-400 dark:text-white/30 hacker:text-green-600/50 font-black text-[10px] uppercase tracking-widest relative z-10 border-t-4 border-white dark:border-[#382E54] hacker:border-[#166534] bg-white/60 dark:bg-[#1E1B2E]/70 hacker:bg-[#0a0a0a]/80 backdrop-blur-md transition-colors">
        © 2026 KeyRush
      </footer>

      {/* ========================================================================================= */}
      {/* 🌟 HISTORY DETAILS OVERLAY (POP-UP) 🌟 */}
      {/* ========================================================================================= */}
      <AnimatePresence>
        {selectedLog && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-orange-950/40 dark:bg-black/60 hacker:bg-black/80 backdrop-blur-md overflow-y-auto transition-colors"
            onClick={() => setSelectedLog(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="bg-white dark:bg-[#1E1B2E] hacker:bg-[#0a0a0a] border-4 border-white dark:border-[#382E54] hacker:border-[#166534] w-full max-w-4xl max-h-[94vh] rounded-[40px] overflow-y-auto shadow-2xl relative my-auto cursor-default flex flex-col md:flex-row transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const isLinux = selectedLog.os === 'linux';
                const themeColorClass = isHacker ? 'text-green-500' : isLinux ? 'text-orange-500 dark:text-yellow-400' : 'text-blue-500 dark:text-blue-400';
                const themeBgClass = isHacker ? 'bg-[#111]' : isLinux ? 'bg-orange-50 dark:bg-[#2D223B]' : 'bg-blue-50 dark:bg-[#1e293b]';
                const grade = getMissionGrade(selectedLog.accuracy, selectedLog.os);

                return (
                  <>
                    {/* Left Column: Rank */}
                    <div className={`w-full md:w-5/12 ${themeBgClass} p-6 md:p-8 flex flex-col items-center justify-center border-b-4 md:border-b-0 md:border-r-4 border-white dark:border-[#382E54] hacker:border-[#166534] relative overflow-hidden transition-colors`}>
                      <h2 className="text-orange-400 dark:text-white/50 hacker:text-green-600 font-black tracking-widest text-[10px] mb-2 uppercase transition-colors">Historical Record</h2>
                      <h1 className="text-2xl md:text-3xl font-black text-orange-950 dark:text-white hacker:text-white mb-5 tracking-tighter text-center cute-header transition-colors">
                        LEVEL {selectedLog.level} <br />
                        <span className={`${themeColorClass} text-xl`}>{selectedLog.os.toUpperCase()}</span>
                      </h1>

                      <div className="relative group">
                        <div className={`w-36 h-36 md:w-40 md:h-40 rounded-full flex items-center justify-center relative z-10 ${grade.border}`}>
                          <span className={`text-7xl md:text-8xl font-black italic select-none cute-header ${grade.color}`}>{grade.rank}</span>
                          <div className="absolute -bottom-4 bg-white dark:bg-[#1E1B2E] hacker:bg-[#0a0a0a] border-4 border-white dark:border-[#382E54] hacker:border-[#166534] px-5 py-2 rounded-[20px] flex gap-1 shadow-sm transition-colors">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={18} strokeWidth={3} className={i < grade.stars ? (isHacker ? 'fill-green-500 text-green-500 drop-shadow-sm' : 'fill-yellow-400 text-yellow-400 drop-shadow-sm') : 'fill-slate-100 dark:fill-white/5 hacker:fill-white/5 text-slate-200 dark:text-white/10 hacker:text-white/10'} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className={`mt-7 text-sm font-black uppercase tracking-widest text-center transition-colors ${selectedLog.accuracy === 100 ? `${themeColorClass} animate-pulse` : 'text-orange-500 dark:text-white/70 hacker:text-white/70'}`}>
                        {selectedLog.accuracy === 100 ? 'Flawless Execution! ✨' : `${grade.label} Performance`}
                      </p>
                    </div>

                    {/* Right Column: Stats & Details */}
                    <div className="w-full md:w-7/12 p-5 md:p-7 flex flex-col justify-between bg-white dark:bg-[#1E1B2E] hacker:bg-[#0a0a0a] relative transition-colors">
                      {/* Mission Log Details */}
                      <div className="mb-4 p-4 rounded-[24px] border-4 border-white dark:border-[#4B3965] hacker:border-[#166534] bg-orange-50 dark:bg-black/20 hacker:bg-[#111] shadow-sm relative overflow-hidden transition-colors">
                        <h4 className={`text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2 ${themeColorClass}`}>
                          <FileText size={18} strokeWidth={3} /> Mission Log Detail
                        </h4>
                        <div className="bg-white dark:bg-[#382E54] hacker:bg-[#0a0a0a] rounded-[16px] px-5 py-2.5 border-2 border-white dark:border-transparent hacker:border-[#166534] mb-3 shadow-sm flex items-center gap-3 transition-colors">
                          <Clock size={18} strokeWidth={3} className="text-orange-400 dark:text-yellow-500 hacker:text-green-500" />
                          <span className="text-orange-950 dark:text-white hacker:text-white font-black text-xs uppercase tracking-widest mt-0.5 transition-colors">
                            {new Date(selectedLog.createdAt).toLocaleString('en-GB', {
                              dateStyle: 'full', timeStyle: 'medium'
                            })}
                          </span>
                        </div>
                        <p className="text-orange-800 dark:text-white/80 hacker:text-white/80 text-sm leading-relaxed border-l-4 pl-4 border-orange-300 dark:border-yellow-500 hacker:border-green-600 font-bold transition-colors">
                          <span className={themeColorClass}>&gt;</span> {selectedLog.description || 'Target operation completed securely.'}
                        </p>
                      </div>

                      {/* สถิติการเล่นในรอบนั้น */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        {getLogExp(selectedLog) !== null && (
                          <div className="col-span-2 bg-white dark:bg-[#382E54] hacker:bg-[#111] border-4 border-orange-100 dark:border-[#4B3965] hacker:border-[#166534] p-4 rounded-[24px] flex items-center justify-between shadow-sm transition-colors">
                            <div className="flex items-center gap-3">
                              <div className={`w-11 h-11 rounded-[14px] flex items-center justify-center border-2 shadow-sm transition-colors ${isHacker ? 'bg-green-600 text-[#0a0a0a] border-green-500' : 'bg-yellow-400 text-white dark:text-[#1E1B2E] border-white dark:border-yellow-300'}`}>
                                <Zap size={22} strokeWidth={3} className="fill-current" />
                              </div>
                              <p className="text-orange-400 dark:text-white/50 hacker:text-green-600 text-[10px] font-black uppercase tracking-widest transition-colors">EXP Gained</p>
                            </div>
                            <p className="text-orange-600 dark:text-yellow-400 hacker:text-green-500 text-3xl font-black cute-header transition-colors">+{getLogExp(selectedLog)} <span className="text-sm text-orange-400 dark:text-yellow-600 hacker:text-green-700 font-black">EXP</span></p>
                          </div>
                        )}
                        <div className="bg-white dark:bg-[#382E54] hacker:bg-[#111] border-4 border-orange-100 dark:border-[#4B3965] hacker:border-[#166534] p-4 rounded-[24px] flex flex-col gap-1 shadow-sm transition-colors">
                          <p className="text-orange-400 dark:text-white/50 hacker:text-green-600 text-[10px] font-black uppercase tracking-widest transition-colors">Typing Speed</p>
                          <p className="text-orange-600 dark:text-yellow-400 hacker:text-green-500 text-3xl font-black cute-header transition-colors">{selectedLog.wpm} <span className="text-sm text-orange-400 dark:text-yellow-600 hacker:text-green-700 font-black">WPM</span></p>
                        </div>

                        <div className="bg-white dark:bg-[#382E54] hacker:bg-[#111] border-4 border-orange-100 dark:border-[#4B3965] hacker:border-[#166534] p-4 rounded-[24px] flex flex-col gap-1 shadow-sm transition-colors">
                          <p className="text-orange-400 dark:text-white/50 hacker:text-green-600 text-[10px] font-black uppercase tracking-widest transition-colors">Accuracy</p>
                          <p className="text-orange-600 dark:text-yellow-400 hacker:text-green-500 text-3xl font-black cute-header transition-colors">{selectedLog.accuracy}<span className="text-sm text-orange-400 dark:text-yellow-600 hacker:text-green-700 font-black">%</span></p>
                        </div>
                      </div>

                      {/* ปุ่มกดปิด (3D Button) */}
                      <div className="mt-auto">
                        <button
                          onClick={() => setSelectedLog(null)}
                          className={`w-full py-3.5 font-black uppercase tracking-widest text-sm rounded-[24px] flex items-center justify-center gap-2 transition-all border-4 btn-squishy
                            ${isHacker
                              ? 'bg-green-500 border-green-400 text-[#0a0a0a] shadow-[0_6px_0_#14532d] hover:bg-green-400'
                              : isLinux
                                ? 'bg-orange-500 dark:bg-yellow-400 border-white dark:border-yellow-500 text-white dark:text-[#1E1B2E] shadow-[0_6px_0_#c2410c] dark:shadow-[0_6px_0_#ca8a04] hover:bg-orange-400 dark:hover:bg-yellow-300'
                                : 'bg-blue-500 dark:bg-blue-400 border-white dark:border-blue-500 text-white dark:text-[#1E1B2E] shadow-[0_6px_0_#1d4ed8] dark:shadow-[0_6px_0_#2563eb] hover:bg-blue-400 dark:hover:bg-blue-300'}`}
                        >
                          <X size={20} strokeWidth={3} /> Close
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}