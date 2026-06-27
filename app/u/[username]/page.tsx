"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import HackerLoadingScreen from '@/components/HackerLoadingScreen';
import {
  AlertTriangle, ArrowLeft, Star, Calendar,
  Terminal, Monitor, Trophy, Medal, MessageSquare
} from 'lucide-react';

// =========================================================================
// 🌟 ข้อมูล Ranks (อิงจากหน้า Dashboard/Ranks เพื่อให้ตรงกัน 100%)
// =========================================================================
const RANKS = [
  { id: 1, title: "Script Kiddie", minExp: 0, style: "text-slate-500 border-slate-200 bg-slate-100" },
  { id: 2, title: "Cyber Novice", minExp: 200, style: "text-green-500 border-green-200 bg-green-100" },
  { id: 3, title: "Net Runner", minExp: 500, style: "text-yellow-600 border-yellow-200 bg-yellow-100" },
  { id: 4, title: "System Admin", minExp: 1000, style: "text-blue-500 border-blue-200 bg-blue-100" },
  { id: 5, title: "Elite Operative", minExp: 2000, style: "text-purple-500 border-purple-200 bg-purple-100" },
  { id: 6, title: "Phantom Architect", minExp: 3500, style: "text-pink-500 border-pink-200 bg-pink-100" },
  { id: 7, title: "Root Master", minExp: 5000, style: "text-rose-500 border-rose-200 bg-rose-100" },
];

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  // ถอดรหัส URL เผื่อชื่อมีเว้นวรรค
  const username = decodeURIComponent(params.username as string);

  const [profileData, setProfileData] = useState<any>(null);
  const [ranks, setRanks] = useState({ linux: 0, windows: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 🌟 เพิ่มระบบ Authentication Check
    const token = localStorage.getItem('keyrush_token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchPublicProfile = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/profile/${encodeURIComponent(username)}`);

        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          console.error("🚨 Backend ไม่ได้ส่ง JSON กลับมา!");
          setError("API ERROR: ไม่สามารถดึงข้อมูลได้ (Backend ไม่ตอบสนองแบบ JSON)");
          setLoading(false);
          return;
        }

        const data = await res.json();

        if (data.success && data.data) {
          setProfileData(data.data);

          // แอบไปดึงข้อมูลจาก Leaderboard มาเทียบหาอันดับ
          try {
            const [lnxRes, winRes] = await Promise.all([
              fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/leaderboard/linux`),
              fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/leaderboard/windows`)
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
    return avatarStr.startsWith('data:')
      ? avatarStr
      : `https://api.dicebear.com/7.x/bottts/svg?seed=${avatarStr}&radius=50`;
  };

  const getRankDetails = (level: number) => {
    if (level <= 3) return { title: "Script Kiddie", color: "text-slate-400" };
    if (level <= 6) return { title: "Junior Hacker", color: "text-orange-500 drop-shadow-sm" };
    if (level <= 9) return { title: "SysAdmin", color: "text-blue-500 drop-shadow-sm" };
    return { title: "Root Master", color: "text-rose-500 drop-shadow-sm font-black" };
  };

  if (loading) return <HackerLoadingScreen />;

  if (error || !profileData) {
    return (
      <div className="min-h-screen bg-orange-50 flex flex-col font-sans relative overflow-hidden">
        <Navbar theme="linux" />
        <div className="flex-1 flex flex-col items-center justify-center text-center z-10 p-6">
          <AlertTriangle size={80} strokeWidth={2.5} className="text-rose-500 mb-6 animate-bounce" />
          <h1 className="text-3xl md:text-4xl font-black text-orange-950 mb-4 tracking-widest">{error || "404 NOT FOUND"}</h1>
          <button onClick={() => router.push('/leaderboard')} className="mt-6 px-8 py-4 bg-white border-4 border-white text-orange-600 rounded-[20px] shadow-sm hover:border-orange-300 transition-all font-black tracking-widest uppercase">
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

  const linuxRank = getRankDetails(linuxLvl);
  const winRank = getRankDetails(winLvl);
  const totalExp = linuxExp + winExp;

  // 🌟 คำนวณหาแรงค์ปัจจุบันจาก totalExp 🌟
  let currentRank = RANKS[0];
  for (let i = 0; i < RANKS.length; i++) {
    if (totalExp >= RANKS[i].minExp) {
      currentRank = RANKS[i];
    }
  }

  return (
    <div className="min-h-screen bg-orange-50 text-orange-950 font-sans font-black flex flex-col selection:bg-orange-500/20 relative overflow-hidden">

      <div className="shrink-0 relative z-50">
        <Navbar theme="linux" />
      </div>

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
          border-radius: 40px;
          box-shadow: 0 10px 30px rgba(249, 115, 22, 0.1);
          transition: all 0.3s ease;
        }

        .cute-header {
          text-shadow: 2px 2px 0px rgba(255, 255, 255, 1), 
                       -1px -1px 0px rgba(255, 255, 255, 1), 
                       1px -1px 0px rgba(255, 255, 255, 1), 
                       -1px 1px 0px rgba(255, 255, 255, 1);
          letter-spacing: -0.02em;
        }
      `}</style>

      {/* 🎈 Background Blobs สีส้ม 🎈 */}
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-orange-400 blur-[150px] rounded-full pointer-events-none z-0 opacity-20 float-element"></div>

      <main className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8 relative z-10 flex flex-col items-center pt-8 md:pt-12 pb-20">

        {/* ========================================================================= */}
        {/* 🌟 Profile Identity Card (กล่องบนสุด) */}
        {/* ========================================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="w-full glass-card p-8 md:p-10 shadow-md relative overflow-hidden flex flex-col md:flex-row items-center gap-8 mb-8"
        >
          {/* ขีดเส้นสีด้านบนของกล่อง */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-amber-400 opacity-90"></div>

          {/* อวาตาร์ (ลบป้าย Admin ออกแล้ว) */}
          <div className="relative">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-[32px] bg-white border-8 p-1 overflow-hidden flex items-center justify-center flex-shrink-0 z-10 relative border-orange-100 shadow-[0_0_20px_rgba(249,115,22,0.2)]">
              <img src={getAvatarUrl(profileData.avatar)} alt="Avatar" className="w-full h-full object-cover rounded-[20px]" />
            </div>
          </div>

          <div className="flex-1 text-center md:text-left w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-center md:justify-start gap-3 mb-2 md:mb-4">
              <h1 className="text-4xl md:text-5xl font-black text-orange-950 tracking-tighter drop-shadow-sm cute-header">
                {profileData.displayName || profileData.username.split('@')[0]}
              </h1>
              {/* 🌟 แสดงชื่อแรงค์และสี ตามระดับเลเวลผู้เล่น 🌟 */}
              <span className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-[12px] border-4 inline-block w-max mx-auto md:mx-0 shadow-sm ${currentRank.style}`}>
                {currentRank.title}
              </span>
            </div>

            {/* ไบโอ (Bio) */}
            {profileData.bio ? (
              <div className="mt-2 mb-6 relative flex items-start justify-center md:justify-start gap-3 max-w-xl mx-auto md:mx-0 bg-white/80 p-5 rounded-[24px] border-4 border-white shadow-sm">
                <MessageSquare size={20} strokeWidth={3} className="text-orange-300 mt-0.5 shrink-0" />
                <p className="text-sm md:text-base text-orange-900 font-bold break-words leading-relaxed text-left">
                  {profileData.bio}
                </p>
              </div>
            ) : (
              <div className="mt-2 mb-6 relative flex items-center justify-center md:justify-start gap-2 max-w-xl mx-auto md:mx-0 opacity-40">
                <MessageSquare size={18} strokeWidth={3} className="text-orange-950/40" />
                <p className="text-sm text-orange-950/40 font-bold uppercase tracking-widest">No intelligence intel set.</p>
              </div>
            )}

            {/* กล่อง Stat สรุป */}
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <div className="bg-white border-4 border-white shadow-sm px-5 py-3 rounded-[20px] flex items-center gap-3 hover:border-orange-200 transition-colors group">
                <Star size={24} strokeWidth={3} className="text-amber-400 group-hover:scale-110 transition-transform" />
                <div className="flex flex-col text-left">
                  <span className="text-[9px] text-orange-400 uppercase font-black tracking-widest leading-tight">Total EXP</span>
                  <span className="text-xl font-black text-orange-950 leading-none mt-0.5">{totalExp.toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-white border-4 border-white shadow-sm px-5 py-3 rounded-[20px] flex items-center gap-3 hover:border-orange-200 transition-colors group">
                <Calendar size={24} strokeWidth={3} className="text-blue-500 group-hover:scale-110 transition-transform" />
                <div className="flex flex-col text-left">
                  <span className="text-[9px] text-orange-400 uppercase font-black tracking-widest leading-tight">Joined Since</span>
                  <span className="text-sm font-black text-orange-950 leading-none mt-1">
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
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Terminal size={120} strokeWidth={2} />
            </div>
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-[20px] bg-orange-100 flex items-center justify-center border-4 border-white shadow-sm group-hover:scale-110 transition-transform">
                  <Terminal size={24} strokeWidth={3} className="text-orange-500" />
                </div>
                <div>
                  <h3 className="text-orange-950 font-black text-xl cute-header">LINUX PATH</h3>
                  <p className="text-[10px] text-orange-500 font-black tracking-widest uppercase">SERVER OPERATION</p>
                </div>
              </div>

              {/* Leaderboard Rank Position */}
              <div className="text-right flex flex-col items-end">
                <p className="text-[10px] text-orange-400 font-black uppercase tracking-widest mb-1">Level</p>
                <p className="text-4xl font-black text-orange-600 leading-none cute-header">{linuxLvl}</p>
                {ranks.linux > 0 ? (
                  <div className={`mt-3 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-[12px] border-2 shadow-sm
                    ${ranks.linux <= 3 ? 'text-yellow-600 bg-yellow-100 border-white' : 'text-orange-600 bg-orange-100 border-white'}
                  `}>
                    {ranks.linux <= 3 ? <Medal size={14} strokeWidth={3} /> : <Trophy size={14} strokeWidth={3} />}
                    RANK #{ranks.linux}
                  </div>
                ) : (
                  <div className="mt-3 inline-flex items-center gap-1 text-[10px] font-black text-slate-400 bg-white px-3 py-1.5 rounded-[12px] border-2 border-slate-200 uppercase shadow-sm">
                    UNRANKED
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 relative z-10">
              <div>
                <div className="flex justify-between text-xs font-black mb-2 items-end">
                  <span className="text-orange-400 uppercase tracking-widest text-[9px]">Current Title</span>
                  <span className={`${linuxRank.color} text-sm uppercase tracking-wider`}>{linuxRank.title}</span>
                </div>
                <div className="w-full h-3 bg-white rounded-full border-4 border-white overflow-hidden shadow-inner">
                  <div className="h-full bg-orange-500 w-[100%] rounded-full"></div>
                </div>
              </div>
              <div className="bg-white p-5 rounded-[24px] border-4 border-orange-50 flex justify-between items-center shadow-sm">
                <span className="text-[10px] text-orange-400 font-black uppercase tracking-widest">Accumulated EXP</span>
                <span className="text-xl font-black text-orange-500 cute-header">{linuxExp.toLocaleString()}</span>
              </div>
            </div>
          </motion.div>

          {/* 🌟 Windows Stats */}
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="glass-card p-8 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Monitor size={120} strokeWidth={2} />
            </div>
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-[20px] bg-blue-100 flex items-center justify-center border-4 border-white shadow-sm group-hover:scale-110 transition-transform">
                  <Monitor size={24} strokeWidth={3} className="text-blue-500" />
                </div>
                <div>
                  <h3 className="text-orange-950 font-black text-xl cute-header">WINDOWS PATH</h3>
                  <p className="text-[10px] text-blue-500 font-black tracking-widest uppercase">SYSTEM ADMIN</p>
                </div>
              </div>

              {/* Leaderboard Rank Position */}
              <div className="text-right flex flex-col items-end">
                <p className="text-[10px] text-orange-400 font-black uppercase tracking-widest mb-1">Level</p>
                <p className="text-4xl font-black text-blue-500 leading-none cute-header">{winLvl}</p>
                {ranks.windows > 0 ? (
                  <div className={`mt-3 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-[12px] border-2 shadow-sm
                    ${ranks.windows <= 3 ? 'text-yellow-600 bg-yellow-100 border-white' : 'text-blue-600 bg-blue-100 border-white'}
                  `}>
                    {ranks.windows <= 3 ? <Medal size={14} strokeWidth={3} /> : <Trophy size={14} strokeWidth={3} />}
                    RANK #{ranks.windows}
                  </div>
                ) : (
                  <div className="mt-3 inline-flex items-center gap-1 text-[10px] font-black text-slate-400 bg-white px-3 py-1.5 rounded-[12px] border-2 border-slate-200 uppercase shadow-sm">
                    UNRANKED
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 relative z-10">
              <div>
                <div className="flex justify-between text-xs font-black mb-2 items-end">
                  <span className="text-orange-400 uppercase tracking-widest text-[9px]">Current Title</span>
                  <span className={`${winRank.color} text-sm uppercase tracking-wider`}>{winRank.title}</span>
                </div>
                <div className="w-full h-3 bg-white rounded-full border-4 border-white overflow-hidden shadow-inner">
                  <div className="h-full bg-blue-500 w-[100%] rounded-full"></div>
                </div>
              </div>
              <div className="bg-white p-5 rounded-[24px] border-4 border-blue-50 flex justify-between items-center shadow-sm">
                <span className="text-[10px] text-orange-400 font-black uppercase tracking-widest">Accumulated EXP</span>
                <span className="text-xl font-black text-blue-500 cute-header">{winExp.toLocaleString()}</span>
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
          <h3 className="text-orange-500 font-black text-sm uppercase tracking-widest mb-6 flex items-center gap-2 border-b-4 border-white pb-4 cute-header">
            <Terminal size={20} strokeWidth={3} />
            Operative Activity Logs
          </h3>
          <div className="space-y-4 font-bold text-[11px] md:text-sm text-orange-800 leading-relaxed bg-white/60 p-6 rounded-[24px] border-4 border-white shadow-inner">
            <p className="flex items-start gap-2">
              <span className="text-blue-500 font-black mt-0.5">&gt;</span>
              <span>
                <span className="text-orange-500 bg-orange-100 px-2 py-0.5 rounded-md text-[10px] border border-white">[{new Date(profileData.createdAt).toLocaleDateString('en-GB')}]</span>
                {" "}System initialized. Operative <span className="text-orange-950 font-black">'{profileData.displayName || profileData.username.split('@')[0]}'</span> registered in the central database.
              </span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-blue-500 font-black mt-0.5">&gt;</span>
              <span>
                <span className="text-green-500 bg-green-100 px-2 py-0.5 rounded-md text-[10px] border border-white">[SYSTEM]</span>
                {" "}Identity verified successfully. Encryption keys generated.
              </span>
            </p>

            {ranks.linux > 0 && ranks.linux <= 3 && (
              <p className="flex items-start gap-2">
                <span className="text-blue-500 font-black mt-0.5">&gt;</span>
                <span>
                  <span className="text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-md text-[10px] border border-white">[ELITE STATUS]</span>
                  {" "}Operative currently holds <span className="text-orange-950 font-black">Rank #{ranks.linux}</span> in the Linux global division.
                </span>
              </p>
            )}
            {ranks.windows > 0 && ranks.windows <= 3 && (
              <p className="flex items-start gap-2">
                <span className="text-blue-500 font-black mt-0.5">&gt;</span>
                <span>
                  <span className="text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-md text-[10px] border border-white">[ELITE STATUS]</span>
                  {" "}Operative currently holds <span className="text-orange-950 font-black">Rank #{ranks.windows}</span> in the Windows global division.
                </span>
              </p>
            )}

            {totalExp > 0 && (
              <p className="flex items-start gap-2">
                <span className="text-blue-500 font-black mt-0.5">&gt;</span>
                <span>
                  <span className="text-purple-500 bg-purple-100 px-2 py-0.5 rounded-md text-[10px] border border-white">[ACHIEVEMENT]</span>
                  {" "}Operative has accumulated a total of <span className="text-orange-950 font-black">{totalExp.toLocaleString()} EXP</span> across all operational paths.
                </span>
              </p>
            )}
            <p className="flex items-start gap-2">
              <span className="text-blue-500 font-black mt-0.5">&gt;</span>
              <span>
                <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md text-[10px] border border-white">[{new Date().toLocaleDateString('en-GB')}]</span>
                {" "}Profile accessed by external observer. Connection secure.
              </span>
            </p>
            <div className="flex items-center gap-2 mt-6 text-orange-500 font-black text-sm">
              <span>root@keyrush:~$</span>
              <span className="w-3 h-5 bg-orange-500 animate-pulse rounded-sm"></span>
            </div>
          </div>
        </motion.div>

      </main>

      <footer className="py-8 text-center text-orange-400 font-black text-[10px] uppercase tracking-widest relative z-30 bg-white/40 mt-auto border-t-4 border-white backdrop-blur-md">
        © 2026 KeyRush Operations // NETWORK SECURED 💖
      </footer>

    </div>
  );
}