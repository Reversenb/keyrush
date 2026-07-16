"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import Navbar from '@/components/Navbar';
import HackerLoadingScreen from '@/components/HackerLoadingScreen';
import {
  AlertTriangle, ArrowLeft, Star, Calendar,
  Terminal, Monitor, Trophy, Medal, MessageSquare
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

// 🌟 ข้อมูลแรงค์กลาง — แก้ที่ lib/ranks.ts ที่เดียว
import { RANKS } from '@/lib/ranks';

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = decodeURIComponent(params.username as string);

  // 🌟 Theme State
  const { theme: activeTheme, resolvedTheme } = useTheme();
  const currentTheme = activeTheme === 'system' ? resolvedTheme : activeTheme;
  const isDark = currentTheme === 'dark';
  const isHacker = currentTheme === 'hacker';

  const [profileData, setProfileData] = useState<any>(null);
  const [ranks, setRanks] = useState({ linux: 0, windows: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // เช็คสถานะ login ด้วยการยิง endpoint ที่ต้อง auth (401 → apiFetch พาไปหน้า login ให้)
    apiFetch('/api/user/progress').catch((e) => console.error("Auth check failed", e));

    const fetchPublicProfile = async () => {
      try {
        const res = await apiFetch(`/api/user/profile/public/${encodeURIComponent(username)}`);

        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          setError("API ERROR: ไม่สามารถดึงข้อมูลได้ (Backend ไม่ตอบสนองแบบ JSON)");
          setLoading(false);
          return;
        }

        const data = await res.json();

        if (data.success && data.data) {
          setProfileData(data.data);

          try {
            const [lnxRes, winRes] = await Promise.all([
              apiFetch('/api/leaderboard/linux'),
              apiFetch('/api/leaderboard/windows')
            ]);
            const lnxData = await lnxRes.json();
            const winData = await winRes.json();

            let lRank = 0;
            let wRank = 0;

            if (lnxData.success) {
              const idx = lnxData.data.findIndex((u: any) => u.id === data.data.id);
              if (idx !== -1) lRank = idx + 1;
            }
            if (winData.success) {
              const idx = winData.data.findIndex((u: any) => u.id === data.data.id);
              if (idx !== -1) wRank = idx + 1;
            }

            setRanks({ linux: lRank, windows: wRank });
          } catch (rankErr) {
            console.error("ไม่สามารถดึงข้อมูลอันดับได้", rankErr);
          }

        } else {
          setError("OPERATIVE NOT FOUND: ไม่พบข้อมูลสายลับรหัสนี้ในระบบ");
        }
      } catch (err) {
        console.error("Fetch profile error:", err);
        setError("CONNECTION FAILED: ไม่สามารถเชื่อมต่อฐานข้อมูลได้");
      } finally {
        setTimeout(() => setLoading(false), 800);
      }
    };

    if (username) fetchPublicProfile();
  }, [username, router]);

  const getAvatarUrl = (avatarStr?: string) => {
    if (!avatarStr) return 'https://api.dicebear.com/7.x/bottts/svg?seed=Felix&radius=50';
    return avatarStr.startsWith('data:') ? avatarStr : `https://api.dicebear.com/7.x/bottts/svg?seed=${avatarStr}&radius=50`;
  };

  // 🌟 ฟังก์ชันคำนวณยศจากค่า EXP 🌟
  const getRankByExp = (exp: number) => {
    let current = RANKS[0];
    for (let i = 0; i < RANKS.length; i++) {
      if (exp >= RANKS[i].minExp) {
        current = RANKS[i];
      }
    }
    return current;
  };

  // 🌟 ฟังก์ชันหา Theme Color ของ Rank ปัจจุบัน 🌟
  const getRankTheme = (rank: typeof RANKS[0]) => {
    // 1. โหมด Hacker (ย้อมสีเขียวทั้งหมด)
    if (isHacker) {
      return { title: rank.title, titleColor: "text-green-500", style: "text-green-400 bg-green-900/30 border-[#166534]" };
    }
    // 2. โหมด Dark (สีจัดจ้าน ตัดพื้นหลังเข้ม)
    if (isDark) {
      const darkMap: Record<number, any> = {
        1: { titleColor: "text-slate-300", style: "text-slate-300 border-[#382E54] bg-[#2D223B]" },
        2: { titleColor: "text-green-400", style: "text-green-400 border-[#382E54] bg-green-900/30" },
        3: { titleColor: "text-yellow-400", style: "text-yellow-400 border-[#382E54] bg-yellow-900/30" },
        4: { titleColor: "text-blue-400", style: "text-blue-400 border-[#382E54] bg-blue-900/30" },
        5: { titleColor: "text-purple-400", style: "text-purple-400 border-[#382E54] bg-purple-900/30" },
        6: { titleColor: "text-pink-400", style: "text-pink-400 border-[#382E54] bg-pink-900/30" },
        7: { titleColor: "text-rose-400", style: "text-rose-400 border-[#382E54] bg-rose-900/30 font-black" },
      };
      return { title: rank.title, ...darkMap[rank.id] };
    }
    // 3. โหมดสว่างปกติ (Cute / Pastel)
    const lightMap: Record<number, any> = {
      1: { titleColor: "text-slate-500", style: "text-slate-600 border-white bg-slate-100" },
      2: { titleColor: "text-green-500", style: "text-green-600 border-white bg-green-100" },
      3: { titleColor: "text-amber-500", style: "text-amber-600 border-white bg-amber-100" },
      4: { titleColor: "text-blue-500", style: "text-blue-600 border-white bg-blue-100" },
      5: { titleColor: "text-purple-500", style: "text-purple-600 border-white bg-purple-100" },
      6: { titleColor: "text-pink-500", style: "text-pink-600 border-white bg-pink-100" },
      7: { titleColor: "text-rose-500 font-black", style: "text-rose-600 border-white bg-rose-100 font-black" },
    };
    return { title: rank.title, ...lightMap[rank.id] };
  };

  if (loading) return <HackerLoadingScreen />;

  if (error || !profileData) {
    return (
      <div className={`min-h-screen flex flex-col font-sans relative overflow-hidden transition-colors duration-500 ${isHacker ? 'bg-[#050505]' : isDark ? 'bg-[#1a1423]' : 'bg-orange-50'}`}>
        <Navbar theme="linux" />
        <div className="flex-1 flex flex-col items-center justify-center text-center z-10 p-6">
          <AlertTriangle size={80} strokeWidth={2.5} className="text-rose-500 mb-6 animate-bounce" />
          <h1 className={`text-3xl md:text-4xl font-black mb-4 tracking-widest ${isHacker ? 'text-white' : isDark ? 'text-white' : 'text-orange-950'}`}>{error || "404 NOT FOUND"}</h1>
          <button onClick={() => router.push('/leaderboard')} className={`mt-6 px-8 py-4 border-4 rounded-[20px] shadow-sm transition-all font-black tracking-widest uppercase ${isHacker ? 'bg-[#111] text-green-500 border-green-800 hover:border-green-500' : isDark ? 'bg-[#2D223B] text-yellow-400 border-[#382E54] hover:border-yellow-400' : 'bg-white text-orange-600 border-white hover:border-orange-300'}`}>
            Return to Leaderboard
          </button>
        </div>
      </div>
    );
  }

  const linuxLvl = profileData.linuxLevel || 1;
  const winLvl = profileData.windowsLevel || 1;
  const linuxExp = profileData.linuxExp || 0;
  const winExp = profileData.windowsExp || 0;
  const totalExp = linuxExp + winExp;

  // 🌟 คำนวณ Rank จาก EXP 🌟
  const mainRank = getRankByExp(totalExp);
  const linuxRank = getRankByExp(linuxExp);
  const winRank = getRankByExp(winExp);

  // 🌟 ดึง Theme ของ Rank 🌟
  const mainRankTheme = getRankTheme(mainRank);
  const linuxRankTheme = getRankTheme(linuxRank);
  const winRankTheme = getRankTheme(winRank);

  return (
    <div className={`min-h-screen font-sans font-black flex flex-col relative overflow-hidden transition-colors duration-500 ${isHacker ? 'bg-[#050505] text-green-500 selection:bg-green-500/20' : isDark ? 'bg-[#1a1423] text-white selection:bg-yellow-400/20' : 'bg-orange-50 text-orange-950 selection:bg-orange-500/20'}`}>

      <div className="shrink-0 relative z-50">
        <Navbar theme="linux" />
      </div>

      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-15px) rotate(2deg); } }
        .float-element { animation: float 6s ease-in-out infinite; }
        
        .glass-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(16px); border: 4px solid white; border-radius: 40px; box-shadow: 0 10px 30px rgba(249, 115, 22, 0.1); transition: all 0.3s ease; }
        .dark .glass-card { background: rgba(45, 34, 59, 0.7); border-color: #382E54; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2); }
        .hacker .glass-card { background: rgba(10, 10, 10, 0.85); border-color: #166534; box-shadow: 0 10px 30px rgba(34, 197, 94, 0.15); }

        .cute-header { text-shadow: 2px 2px 0px rgba(255, 255, 255, 1), -1px -1px 0px rgba(255, 255, 255, 1), 1px -1px 0px rgba(255, 255, 255, 1), -1px 1px 0px rgba(255, 255, 255, 1); letter-spacing: -0.02em; }
        .dark .cute-header { text-shadow: 2px 2px 0px rgba(0, 0, 0, 0.3); }
        .hacker .cute-header { text-shadow: 2px 2px 0px rgba(0, 0, 0, 0.8); }
      `}</style>

      {/* 🎈 Background Blobs 🎈 */}
      <div className={`absolute top-[10%] left-1/2 -translate-x-1/2 w-[600px] h-[300px] blur-[150px] rounded-full pointer-events-none z-0 float-element transition-colors duration-1000 ${isHacker ? 'bg-green-600 opacity-10' : isDark ? 'bg-yellow-500 opacity-10' : 'bg-orange-400 opacity-20'}`}></div>

      <main className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8 relative z-10 flex flex-col items-center pt-8 md:pt-12 pb-20">

        {/* ========================================================================= */}
        {/* 🌟 Profile Identity Card (กล่องบนสุด) */}
        {/* ========================================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5, type: 'spring' }}
          className="w-full glass-card p-8 md:p-10 shadow-md relative overflow-hidden flex flex-col md:flex-row items-center gap-8 mb-8"
        >
          {/* ขีดเส้นสีด้านบนของกล่อง */}
          <div className={`absolute top-0 left-0 w-full h-2 opacity-90 transition-colors duration-500 ${isHacker ? 'bg-green-500' : isDark ? 'bg-gradient-to-r from-yellow-400 to-amber-500' : 'bg-gradient-to-r from-orange-400 to-amber-400'}`}></div>

          <div className="relative">
            <div className={`w-32 h-32 md:w-40 md:h-40 rounded-[32px] border-8 p-1 overflow-hidden flex items-center justify-center flex-shrink-0 z-10 relative transition-colors duration-500 ${isHacker ? 'bg-[#0a0a0a] border-[#166534] shadow-[0_0_20px_rgba(34,197,94,0.2)]' : isDark ? 'bg-[#1E1B2E] border-[#382E54] shadow-[0_0_20px_rgba(250,204,21,0.1)]' : 'bg-white border-orange-100 shadow-[0_0_20px_rgba(249,115,22,0.2)]'}`}>
              <img src={getAvatarUrl(profileData.avatar)} alt="Avatar" className="w-full h-full object-cover rounded-[20px]" />
            </div>
          </div>

          <div className="flex-1 text-center md:text-left w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-center md:justify-start gap-3 mb-2 md:mb-4">
              <h1 className={`text-4xl md:text-5xl font-black tracking-tighter drop-shadow-sm cute-header transition-colors duration-500 ${isHacker ? 'text-green-500' : isDark ? 'text-white' : 'text-orange-950'}`}>
                {profileData.displayName || profileData.username.split('@')[0]}
              </h1>
              <span className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-[12px] border-4 inline-block w-max mx-auto md:mx-0 shadow-sm transition-colors duration-500 ${mainRankTheme.style}`}>
                {mainRankTheme.title}
              </span>
            </div>

            {/* ไบโอ (Bio) */}
            {profileData.bio ? (
              <div className={`mt-2 mb-6 relative flex items-start justify-center md:justify-start gap-3 max-w-xl mx-auto md:mx-0 p-5 rounded-[24px] border-4 shadow-sm transition-colors duration-500 ${isHacker ? 'bg-[#111]/80 border-[#166534]' : isDark ? 'bg-[#2D223B]/80 border-[#382E54]' : 'bg-white/80 border-white'}`}>
                <MessageSquare size={20} strokeWidth={3} className={`mt-0.5 shrink-0 transition-colors ${isHacker ? 'text-green-600' : isDark ? 'text-yellow-500' : 'text-orange-300'}`} />
                <p className={`text-sm md:text-base font-bold break-words leading-relaxed text-left transition-colors ${isHacker ? 'text-green-400' : isDark ? 'text-white/80' : 'text-orange-900'}`}>
                  {profileData.bio}
                </p>
              </div>
            ) : (
              <div className={`mt-2 mb-6 relative flex items-center justify-center md:justify-start gap-2 max-w-xl mx-auto md:mx-0 opacity-40 transition-colors ${isHacker ? 'text-green-600' : isDark ? 'text-white' : 'text-orange-950'}`}>
                <MessageSquare size={18} strokeWidth={3} />
                <p className="text-sm font-bold uppercase tracking-widest">No intelligence intel set.</p>
              </div>
            )}

            {/* กล่อง Stat สรุป */}
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <div className={`border-4 shadow-sm px-5 py-3 rounded-[20px] flex items-center gap-3 transition-colors group ${isHacker ? 'bg-[#111] border-[#166534] hover:border-green-600' : isDark ? 'bg-[#2D223B] border-[#382E54] hover:border-yellow-500' : 'bg-white border-white hover:border-orange-200'}`}>
                <Star size={24} strokeWidth={3} className={`group-hover:scale-110 transition-transform ${isHacker ? 'text-green-500' : isDark ? 'text-yellow-400' : 'text-amber-400'}`} />
                <div className="flex flex-col text-left">
                  <span className={`text-[9px] uppercase font-black tracking-widest leading-tight transition-colors ${isHacker ? 'text-green-700' : isDark ? 'text-white/50' : 'text-orange-400'}`}>Total EXP</span>
                  <span className={`text-xl font-black leading-none mt-0.5 transition-colors ${isHacker ? 'text-green-400' : isDark ? 'text-white' : 'text-orange-950'}`}>{totalExp.toLocaleString()}</span>
                </div>
              </div>

              <div className={`border-4 shadow-sm px-5 py-3 rounded-[20px] flex items-center gap-3 transition-colors group ${isHacker ? 'bg-[#111] border-[#166534] hover:border-green-600' : isDark ? 'bg-[#2D223B] border-[#382E54] hover:border-blue-400' : 'bg-white border-white hover:border-orange-200'}`}>
                <Calendar size={24} strokeWidth={3} className={`group-hover:scale-110 transition-transform ${isHacker ? 'text-green-600' : isDark ? 'text-blue-400' : 'text-blue-500'}`} />
                <div className="flex flex-col text-left">
                  <span className={`text-[9px] uppercase font-black tracking-widest leading-tight transition-colors ${isHacker ? 'text-green-700' : isDark ? 'text-white/50' : 'text-orange-400'}`}>Joined Since</span>
                  <span className={`text-sm font-black leading-none mt-1 transition-colors ${isHacker ? 'text-green-400' : isDark ? 'text-white' : 'text-orange-950'}`}>
                    {new Date(profileData.createdAt).toLocaleDateString('en-GB')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ========================================================================= */}
        {/* 🌟 Skill Tree / OS Progress (ฝั่งซ้าย Linux ฝั่งขวา Windows) */}
        {/* ========================================================================= */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* 🌟 Linux Stats */}
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="glass-card p-8 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className={`absolute top-0 right-0 p-4 transition-opacity ${isHacker ? 'opacity-[0.02] text-green-500 group-hover:opacity-10' : isDark ? 'opacity-5 text-yellow-500 group-hover:opacity-10' : 'opacity-5 text-orange-950 group-hover:opacity-10'}`}>
              <Terminal size={120} strokeWidth={2} />
            </div>
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center border-4 shadow-sm group-hover:scale-110 transition-transform duration-500 ${isHacker ? 'bg-[#0a0a0a] border-[#166534]' : isDark ? 'bg-[#1E1B2E] border-[#382E54]' : 'bg-orange-100 border-white'}`}>
                  <Terminal size={24} strokeWidth={3} className={isHacker ? 'text-green-500' : isDark ? 'text-yellow-400' : 'text-orange-500'} />
                </div>
                <div>
                  <h3 className={`font-black text-xl cute-header transition-colors ${isHacker ? 'text-green-500' : isDark ? 'text-white' : 'text-orange-950'}`}>LINUX PATH</h3>
                  <p className={`text-[10px] font-black tracking-widest uppercase transition-colors ${isHacker ? 'text-green-700' : isDark ? 'text-yellow-500' : 'text-orange-500'}`}>SERVER OPERATION</p>
                </div>
              </div>

              {/* Leaderboard Rank Position */}
              <div className="text-right flex flex-col items-end">
                <p className={`text-[10px] font-black uppercase tracking-widest mb-1 transition-colors ${isHacker ? 'text-green-700' : isDark ? 'text-white/50' : 'text-orange-400'}`}>Level</p>
                <p className={`text-4xl font-black leading-none cute-header transition-colors ${isHacker ? 'text-green-400' : isDark ? 'text-yellow-400' : 'text-orange-600'}`}>{linuxLvl}</p>
                {ranks.linux > 0 ? (
                  <div className={`mt-3 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-[12px] border-2 shadow-sm transition-colors
                    ${isHacker
                      ? 'text-green-500 bg-green-900/30 border-[#166534]'
                      : isDark
                        ? (ranks.linux <= 3 ? 'text-yellow-400 bg-yellow-400/20 border-[#382E54]' : 'text-white bg-[#1E1B2E] border-[#382E54]')
                        : (ranks.linux <= 3 ? 'text-yellow-600 bg-yellow-100 border-white' : 'text-orange-600 bg-orange-100 border-white')}
                  `}>
                    {ranks.linux <= 3 ? <Medal size={14} strokeWidth={3} /> : <Trophy size={14} strokeWidth={3} />}
                    RANK #{ranks.linux}
                  </div>
                ) : (
                  <div className={`mt-3 inline-flex items-center gap-1 text-[10px] font-black uppercase shadow-sm px-3 py-1.5 rounded-[12px] border-2 transition-colors ${isHacker ? 'text-green-800 bg-[#111] border-[#166534]' : isDark ? 'text-white/30 bg-[#1E1B2E] border-[#382E54]' : 'text-slate-400 bg-white border-slate-200'}`}>
                    UNRANKED
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 relative z-10">
              <div>
                <div className="flex justify-between text-xs font-black mb-2 items-end">
                  <span className={`uppercase tracking-widest text-[9px] transition-colors ${isHacker ? 'text-green-700' : isDark ? 'text-white/50' : 'text-orange-400'}`}>Current Title</span>
                  <span className={`${linuxRankTheme.titleColor} text-sm uppercase tracking-wider transition-colors`}>{linuxRankTheme.title}</span>
                </div>
                <div className={`w-full h-3 rounded-full border-4 overflow-hidden shadow-inner transition-colors ${isHacker ? 'bg-[#0a0a0a] border-[#166534]' : isDark ? 'bg-[#1E1B2E] border-[#382E54]' : 'bg-white border-white'}`}>
                  <div className={`h-full w-[100%] rounded-full transition-colors ${isHacker ? 'bg-green-500' : isDark ? 'bg-yellow-400' : 'bg-orange-500'}`}></div>
                </div>
              </div>
              <div className={`p-5 rounded-[24px] border-4 flex justify-between items-center shadow-sm transition-colors ${isHacker ? 'bg-[#111] border-[#166534]' : isDark ? 'bg-[#2D223B] border-[#382E54]' : 'bg-white border-orange-50'}`}>
                <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isHacker ? 'text-green-600' : isDark ? 'text-white/50' : 'text-orange-400'}`}>Accumulated EXP</span>
                <span className={`text-xl font-black cute-header transition-colors ${isHacker ? 'text-green-400' : isDark ? 'text-yellow-400' : 'text-orange-500'}`}>{linuxExp.toLocaleString()}</span>
              </div>
            </div>
          </motion.div>

          {/* 🌟 Windows Stats */}
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="glass-card p-8 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className={`absolute top-0 right-0 p-4 transition-opacity ${isHacker ? 'opacity-[0.02] text-green-500 group-hover:opacity-10' : isDark ? 'opacity-5 text-blue-500 group-hover:opacity-10' : 'opacity-5 text-orange-950 group-hover:opacity-10'}`}>
              <Monitor size={120} strokeWidth={2} />
            </div>
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center border-4 shadow-sm group-hover:scale-110 transition-transform duration-500 ${isHacker ? 'bg-[#0a0a0a] border-[#166534]' : isDark ? 'bg-[#1E1B2E] border-[#382E54]' : 'bg-blue-100 border-white'}`}>
                  <Monitor size={24} strokeWidth={3} className={isHacker ? 'text-green-500' : isDark ? 'text-blue-400' : 'text-blue-500'} />
                </div>
                <div>
                  <h3 className={`font-black text-xl cute-header transition-colors ${isHacker ? 'text-green-500' : isDark ? 'text-white' : 'text-orange-950'}`}>WINDOWS PATH</h3>
                  <p className={`text-[10px] font-black tracking-widest uppercase transition-colors ${isHacker ? 'text-green-700' : isDark ? 'text-blue-500' : 'text-blue-500'}`}>SYSTEM ADMIN</p>
                </div>
              </div>

              {/* Leaderboard Rank Position */}
              <div className="text-right flex flex-col items-end">
                <p className={`text-[10px] font-black uppercase tracking-widest mb-1 transition-colors ${isHacker ? 'text-green-700' : isDark ? 'text-white/50' : 'text-orange-400'}`}>Level</p>
                <p className={`text-4xl font-black leading-none cute-header transition-colors ${isHacker ? 'text-green-400' : isDark ? 'text-blue-400' : 'text-blue-500'}`}>{winLvl}</p>
                {ranks.windows > 0 ? (
                  <div className={`mt-3 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-[12px] border-2 shadow-sm transition-colors
                    ${isHacker
                      ? 'text-green-500 bg-green-900/30 border-[#166534]'
                      : isDark
                        ? (ranks.windows <= 3 ? 'text-yellow-400 bg-yellow-400/20 border-[#382E54]' : 'text-white bg-[#1E1B2E] border-[#382E54]')
                        : (ranks.windows <= 3 ? 'text-yellow-600 bg-yellow-100 border-white' : 'text-blue-600 bg-blue-100 border-white')}
                  `}>
                    {ranks.windows <= 3 ? <Medal size={14} strokeWidth={3} /> : <Trophy size={14} strokeWidth={3} />}
                    RANK #{ranks.windows}
                  </div>
                ) : (
                  <div className={`mt-3 inline-flex items-center gap-1 text-[10px] font-black uppercase shadow-sm px-3 py-1.5 rounded-[12px] border-2 transition-colors ${isHacker ? 'text-green-800 bg-[#111] border-[#166534]' : isDark ? 'text-white/30 bg-[#1E1B2E] border-[#382E54]' : 'text-slate-400 bg-white border-slate-200'}`}>
                    UNRANKED
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 relative z-10">
              <div>
                <div className="flex justify-between text-xs font-black mb-2 items-end">
                  <span className={`uppercase tracking-widest text-[9px] transition-colors ${isHacker ? 'text-green-700' : isDark ? 'text-white/50' : 'text-orange-400'}`}>Current Title</span>
                  <span className={`${winRankTheme.titleColor} text-sm uppercase tracking-wider transition-colors`}>{winRankTheme.title}</span>
                </div>
                <div className={`w-full h-3 rounded-full border-4 overflow-hidden shadow-inner transition-colors ${isHacker ? 'bg-[#0a0a0a] border-[#166534]' : isDark ? 'bg-[#1E1B2E] border-[#382E54]' : 'bg-white border-white'}`}>
                  <div className={`h-full w-[100%] rounded-full transition-colors ${isHacker ? 'bg-green-500' : isDark ? 'bg-blue-400' : 'bg-blue-500'}`}></div>
                </div>
              </div>
              <div className={`p-5 rounded-[24px] border-4 flex justify-between items-center shadow-sm transition-colors ${isHacker ? 'bg-[#111] border-[#166534]' : isDark ? 'bg-[#2D223B] border-[#382E54]' : 'bg-white border-blue-50'}`}>
                <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isHacker ? 'text-green-600' : isDark ? 'text-white/50' : 'text-orange-400'}`}>Accumulated EXP</span>
                <span className={`text-xl font-black cute-header transition-colors ${isHacker ? 'text-green-400' : isDark ? 'text-blue-400' : 'text-blue-500'}`}>{winExp.toLocaleString()}</span>
              </div>
            </div>
          </motion.div>

        </div>

        {/* ========================================================================= */}
        {/* 🌟 Operative Terminal Logs */}
        {/* ========================================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full mt-8 glass-card p-8 relative overflow-hidden shadow-sm"
        >
          <h3 className={`font-black text-sm uppercase tracking-widest mb-6 flex items-center gap-2 border-b-4 pb-4 cute-header transition-colors ${isHacker ? 'text-green-500 border-[#166534]' : isDark ? 'text-yellow-400 border-[#382E54]' : 'text-orange-500 border-white'}`}>
            <Terminal size={20} strokeWidth={3} />
            Operative Activity Logs
          </h3>
          <div className={`space-y-4 font-bold text-[11px] md:text-sm leading-relaxed p-6 rounded-[24px] border-4 shadow-inner transition-colors duration-500 ${isHacker ? 'bg-[#050505] border-[#166534] text-green-700' : isDark ? 'bg-[#1E1B2E] border-[#382E54] text-white/60' : 'bg-white/60 border-white text-orange-800'}`}>

            <p className="flex items-start gap-2">
              <span className={`font-black mt-0.5 ${isHacker ? 'text-green-500' : isDark ? 'text-blue-400' : 'text-blue-500'}`}>&gt;</span>
              <span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] border transition-colors ${isHacker ? 'bg-green-900/30 text-green-500 border-green-800' : isDark ? 'bg-blue-900/30 text-blue-400 border-[#382E54]' : 'text-orange-500 bg-orange-100 border-white'}`}>[{new Date(profileData.createdAt).toLocaleDateString('en-GB')}]</span>
                {" "}System initialized. Operative <span className={`font-black ${isHacker ? 'text-green-400' : isDark ? 'text-white' : 'text-orange-950'}`}>'{profileData.displayName || profileData.username.split('@')[0]}'</span> registered in the central database.
              </span>
            </p>

            <p className="flex items-start gap-2">
              <span className={`font-black mt-0.5 ${isHacker ? 'text-green-500' : isDark ? 'text-blue-400' : 'text-blue-500'}`}>&gt;</span>
              <span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] border transition-colors ${isHacker ? 'bg-green-900/50 text-green-400 border-green-800' : isDark ? 'bg-green-900/30 text-green-400 border-[#382E54]' : 'text-green-500 bg-green-100 border-white'}`}>[SYSTEM]</span>
                {" "}Identity verified successfully. Encryption keys generated.
              </span>
            </p>

            {ranks.linux > 0 && ranks.linux <= 3 && (
              <p className="flex items-start gap-2">
                <span className={`font-black mt-0.5 ${isHacker ? 'text-green-500' : isDark ? 'text-blue-400' : 'text-blue-500'}`}>&gt;</span>
                <span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] border transition-colors ${isHacker ? 'bg-yellow-900/50 text-yellow-500 border-yellow-800' : isDark ? 'bg-yellow-900/30 text-yellow-400 border-[#382E54]' : 'text-yellow-600 bg-yellow-100 border-white'}`}>[ELITE STATUS]</span>
                  {" "}Operative currently holds <span className={`font-black ${isHacker ? 'text-green-400' : isDark ? 'text-white' : 'text-orange-950'}`}>Rank #{ranks.linux}</span> in the Linux global division.
                </span>
              </p>
            )}
            {ranks.windows > 0 && ranks.windows <= 3 && (
              <p className="flex items-start gap-2">
                <span className={`font-black mt-0.5 ${isHacker ? 'text-green-500' : isDark ? 'text-blue-400' : 'text-blue-500'}`}>&gt;</span>
                <span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] border transition-colors ${isHacker ? 'bg-yellow-900/50 text-yellow-500 border-yellow-800' : isDark ? 'bg-yellow-900/30 text-yellow-400 border-[#382E54]' : 'text-yellow-600 bg-yellow-100 border-white'}`}>[ELITE STATUS]</span>
                  {" "}Operative currently holds <span className={`font-black ${isHacker ? 'text-green-400' : isDark ? 'text-white' : 'text-orange-950'}`}>Rank #{ranks.windows}</span> in the Windows global division.
                </span>
              </p>
            )}

            {totalExp > 0 && (
              <p className="flex items-start gap-2">
                <span className={`font-black mt-0.5 ${isHacker ? 'text-green-500' : isDark ? 'text-blue-400' : 'text-blue-500'}`}>&gt;</span>
                <span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] border transition-colors ${isHacker ? 'bg-purple-900/50 text-purple-400 border-purple-800' : isDark ? 'bg-purple-900/30 text-purple-400 border-[#382E54]' : 'text-purple-500 bg-purple-100 border-white'}`}>[ACHIEVEMENT]</span>
                  {" "}Operative has accumulated a total of <span className={`font-black ${isHacker ? 'text-green-400' : isDark ? 'text-white' : 'text-orange-950'}`}>{totalExp.toLocaleString()} EXP</span> across all operational paths.
                </span>
              </p>
            )}
            <p className="flex items-start gap-2">
              <span className={`font-black mt-0.5 ${isHacker ? 'text-green-500' : isDark ? 'text-blue-400' : 'text-blue-500'}`}>&gt;</span>
              <span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] border transition-colors ${isHacker ? 'bg-[#111] text-green-600 border-[#166534]' : isDark ? 'bg-white/10 text-white/50 border-[#382E54]' : 'text-slate-500 bg-slate-100 border-white'}`}>[{new Date().toLocaleDateString('en-GB')}]</span>
                {" "}Profile accessed by external observer. Connection secure.
              </span>
            </p>
            <div className={`flex items-center gap-2 mt-6 font-black text-sm transition-colors ${isHacker ? 'text-green-500' : isDark ? 'text-yellow-400' : 'text-orange-500'}`}>
              <span>root@keyrush:~$</span>
              <span className={`w-3 h-5 animate-pulse rounded-sm transition-colors ${isHacker ? 'bg-green-500' : isDark ? 'bg-yellow-400' : 'bg-orange-500'}`}></span>
            </div>
          </div>
        </motion.div>

      </main>

      <footer className={`py-8 text-center font-black text-[10px] uppercase tracking-widest relative z-30 mt-auto border-t-4 backdrop-blur-md transition-colors duration-500 ${isHacker ? 'bg-[#0a0a0a]/80 text-green-700 border-[#166534]' : isDark ? 'bg-[#1E1B2E]/80 text-white/30 border-[#382E54]' : 'bg-white/40 text-orange-400 border-white'}`}>
        © 2026 KeyRush
      </footer>

    </div>
  );
}