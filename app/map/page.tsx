"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import Navbar from '@/components/Navbar';
import { apiFetch } from '@/lib/api';

import {
    Map as MapIcon, Lock, Play, Zap, Trophy,
    Terminal, ShieldCheck, Flag, Dumbbell
} from 'lucide-react';


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
        desc: 'เอาชีวิตรอดจากการพิมพ์คำสั่งให้เร็วและแม่นยำที่สุดก่อนที่เวลาจะหมดลง',
        icon: Zap,
        isLocked: false, 
        link: '/survival', 
        colorTheme: 'blue',
    },
    {
        id: 'training',
        title: 'Training Mode',
        subtitle: 'Sector 03',
        desc: 'สนามซ้อมส่วนตัวของสายลับ ฝึกพิมพ์คำสั่งแบบไร้แรงกดดัน ไม่มีเวลาจับ พร้อมสถิติ WPM สดๆ ให้เห็นพัฒนาการ (เร็วๆ นี้)',
        icon: Dumbbell,
        isLocked: true,
        link: '#',
        colorTheme: 'emerald',
    },
    {
        id: 'arena',
        title: 'Hacker Arena',
        subtitle: 'Sector 04',
        desc: 'ประลองความเร็วในการพิมพ์กับสายลับคนอื่นๆ บนกระดานผู้นำระดับโลก ใครจะไวกว่ากัน? (เร็วๆ นี้)',
        icon: Trophy,
        isLocked: true,
        link: '#',
        colorTheme: 'slate',
    }
];

// =========================================================================
// 🖼️ Mini Preview: ภาพจำลองหน้าจอจริงของแต่ละโหมด (ดูได้โดยไม่ต้องกดเข้าไปเล่น)
// =========================================================================

// 🗺️ Campaign: หน้าต่าง Terminal จำลอง — โจทย์ + พิมพ์คำสั่ง + ผ่านด่าน
function CampaignPreview() {
    return (
        <div className="mt-5 rounded-[20px] overflow-hidden border-4 border-orange-100 dark:border-[#4B3965] hacker:border-green-900 shadow-inner bg-white dark:bg-slate-900 hacker:bg-black select-none pointer-events-none transition-colors">
            {/* แถบหัวหน้าต่าง */}
            <div className="flex items-center gap-1.5 px-4 py-2.5 bg-orange-50 dark:bg-slate-800 hacker:bg-[#0a0a0a] border-b-2 border-orange-100 dark:border-white/10 hacker:border-green-900/50 transition-colors">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="ml-2 text-[9px] font-black uppercase tracking-widest text-orange-400 dark:text-slate-400 hacker:text-green-700">keyrush — mission terminal</span>
                <span className="ml-auto text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-orange-100 text-orange-500 dark:bg-white/10 dark:text-slate-300 hacker:bg-green-900/30 hacker:text-green-500">Preview</span>
            </div>
            {/* เนื้อใน terminal */}
            <div className="p-4 font-mono text-[11px] md:text-xs space-y-2">
                <p className="text-orange-900/60 dark:text-slate-400 hacker:text-green-700"># MISSION 04 — แสดงรายการไฟล์ทั้งหมดแบบละเอียด</p>
                <p className="text-amber-500 dark:text-amber-400/90 hacker:text-green-600">💡 Hint: ใช้ option เพื่อโชว์ไฟล์ที่ซ่อนอยู่ด้วย</p>
                <p className="flex items-center gap-2">
                    <span className="text-orange-500 dark:text-sky-400 hacker:text-green-500 font-bold">user@keyrush:~$</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">ls -la</span>
                    <span className="w-2 h-4 bg-emerald-500 dark:bg-emerald-400 hacker:bg-green-500 animate-pulse rounded-sm" />
                </p>
                <div className="flex items-center gap-2 pt-1">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-600 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/40 hacker:bg-green-900/40 hacker:text-green-400 hacker:border-green-700 font-black text-[10px] border transition-colors">
                        ✔ MISSION CLEARED
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-yellow-100 text-yellow-600 border-yellow-300 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/40 hacker:bg-green-900/40 hacker:text-green-500 hacker:border-green-700 font-black text-[10px] border transition-colors">
                        +100 EXP
                    </span>
                </div>
            </div>
        </div>
    );
}

// ⚡ Survival: HUD จับเวลา + เฟสจำ/พิมพ์จำลอง
function SurvivalPreview() {
    const cmd = 'pwd';
    const typed = 2; // จำนวนตัวอักษรที่ "พิมพ์แล้ว" ใน mockup
    return (
        <div className="mt-5 rounded-[20px] overflow-hidden border-4 border-orange-100 dark:border-[#4B3965] hacker:border-green-900 shadow-inner bg-white dark:bg-[#1E1B2E] hacker:bg-[#0a0a0a] select-none pointer-events-none transition-colors">
            {/* HUD บน: เวลา + คอมโบ */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b-2 border-orange-100 dark:border-[#382E54] hacker:border-green-900/60">
                <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-orange-500 dark:text-yellow-400 hacker:text-green-500">⏱ 42</span>
                    <span className="text-[10px] font-black text-emerald-500 animate-bounce">+2</span>
                </div>
                <span className="ml-auto text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-orange-100 dark:bg-white/10 hacker:bg-green-900/30 text-orange-400 dark:text-slate-300 hacker:text-green-500 mr-2">Preview</span>
                <span className="text-sm font-black text-amber-500 hacker:text-yellow-400">คอมโบ x5 ⚡</span>
            </div>
            {/* แถบเวลา */}
            <div className="mx-4 mt-3 h-2 rounded-full bg-slate-100 dark:bg-slate-800 hacker:bg-green-900/30 overflow-hidden">
                <div className="h-full w-2/3 rounded-full bg-orange-400 dark:bg-yellow-400 hacker:bg-green-500 animate-pulse" />
            </div>
            {/* โจทย์ + ช่องพิมพ์ */}
            <div className="p-4 space-y-2.5">
                <p className="text-[11px] md:text-xs font-bold text-slate-500 dark:text-slate-300 hacker:text-green-600">
                    🧠 จำให้ดี: "แสดงตำแหน่งไดเรกทอรีปัจจุบัน"
                </p>
                <div className="font-mono text-xl md:text-2xl font-black flex items-center gap-2 bg-slate-100 dark:bg-slate-950 hacker:bg-black px-4 py-2.5 rounded-xl border-2 border-slate-200 dark:border-white/5 hacker:border-green-900/60">
                    <span className="text-orange-400 dark:text-yellow-500 hacker:text-green-600 opacity-60">$&gt;</span>
                    <span>
                        {cmd.split('').map((ch, i) => (
                            <span key={i} className={`relative inline-block ${i < typed ? 'text-emerald-500 dark:text-emerald-400 hacker:text-green-400' : 'text-slate-300 dark:text-slate-700 hacker:text-green-900'}`}>
                                {ch}
                                {i === typed && <span className="absolute left-0 -bottom-0.5 w-full h-[3px] bg-orange-400 dark:bg-yellow-400 hacker:bg-green-500 animate-pulse rounded-full" />}
                            </span>
                        ))}
                    </span>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30 hacker:text-green-800">ถูก +2 วิ · ผิด -3 วิ · ข้อละ 5 EXP</p>
            </div>
        </div>
    );
}

// 💪 Training: สนามซ้อมอิสระ — พิมพ์เรื่อยๆ ไม่มีเวลาจับ พร้อมสถิติสด
function TrainingPreview() {
    const cmd = 'chmod +x run.sh';
    const typed = 9;
    return (
        <div className="mt-5 rounded-[20px] overflow-hidden border-4 border-orange-100 dark:border-[#4B3965] hacker:border-green-900 shadow-inner bg-white dark:bg-[#1E1B2E] hacker:bg-[#0a0a0a] select-none pointer-events-none transition-colors">
            {/* HUD บน: ไม่มีเวลาจับ + สถิติสด */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b-2 border-orange-100 dark:border-[#382E54] hacker:border-green-900/60">
                <span className="text-sm font-black text-orange-500 dark:text-yellow-400 hacker:text-green-500">⏱ ∞ <span className="text-[9px] uppercase tracking-widest opacity-60">Free Practice</span></span>
                <span className="ml-auto text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-orange-100 dark:bg-white/10 hacker:bg-green-900/30 text-orange-400 dark:text-slate-300 hacker:text-green-500 mr-2">Preview</span>
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 hacker:bg-green-900/40 hacker:text-green-400">WPM 62</span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400 hacker:bg-green-900/40 hacker:text-green-500">ACC 97%</span>
                </div>
            </div>
            {/* แถวพิมพ์ฝึกซ้อม */}
            <div className="p-4 space-y-2.5">
                <p className="text-[11px] md:text-xs font-bold text-slate-500 dark:text-slate-300 hacker:text-green-600">
                    💪 ซ้อมหมวด: Permissions — "ทำให้สคริปต์รันได้"
                </p>
                <div className="font-mono text-lg md:text-xl font-black flex items-center gap-2 bg-slate-100 dark:bg-slate-950 hacker:bg-black px-4 py-2.5 rounded-xl border-2 border-slate-200 dark:border-white/5 hacker:border-green-900/60">
                    <span className="text-orange-400 dark:text-yellow-500 hacker:text-green-600 opacity-60">$&gt;</span>
                    <span>
                        {cmd.split('').map((ch, i) => (
                            <span key={i} className={`relative inline-block whitespace-pre ${i < typed ? 'text-emerald-500 dark:text-emerald-400 hacker:text-green-400' : 'text-slate-300 dark:text-slate-700 hacker:text-green-900'}`}>
                                {ch}
                                {i === typed && <span className="absolute left-0 -bottom-0.5 w-full h-[3px] bg-orange-400 dark:bg-yellow-400 hacker:bg-green-500 animate-pulse rounded-full" />}
                            </span>
                        ))}
                    </span>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30 hacker:text-green-800">ไม่มีเวลากดดัน · ไม่มีหักคะแนน · ฝึกได้ไม่จำกัด</p>
            </div>
        </div>
    );
}

// 🏆 Arena (ล็อกอยู่): ภาพ VS จางๆ ให้รู้ว่ากำลังมา
function ArenaPreview() {
    return (
        <div className="mt-5 rounded-[20px] overflow-hidden border-4 border-slate-200 dark:border-[#4B3965] hacker:border-green-900/50 shadow-inner bg-slate-50 dark:bg-[#1E1B2E] hacker:bg-[#0a0a0a] select-none pointer-events-none relative transition-colors">
            <div className="p-5 flex items-center justify-center gap-4 opacity-50 blur-[1px]">
                <div className="flex flex-col items-center gap-1.5">
                    <div className="w-10 h-10 rounded-full bg-orange-200 dark:bg-yellow-400/30 hacker:bg-green-900/50 border-2 border-white dark:border-[#4B3965] hacker:border-green-800 flex items-center justify-center text-sm">🕵️</div>
                    <div className="w-16 h-1.5 rounded-full bg-orange-400 dark:bg-yellow-400 hacker:bg-green-500" />
                    <span className="text-[9px] font-black uppercase text-slate-500 dark:text-white/40 hacker:text-green-700">You</span>
                </div>
                <span className="text-xl font-black text-slate-400 dark:text-white/30 hacker:text-green-700">VS</span>
                <div className="flex flex-col items-center gap-1.5">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-white/10 hacker:bg-green-900/30 border-2 border-white dark:border-[#4B3965] hacker:border-green-800 flex items-center justify-center text-sm">❓</div>
                    <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-white/20 hacker:bg-green-900" />
                    <span className="text-[9px] font-black uppercase text-slate-500 dark:text-white/40 hacker:text-green-700">Rival</span>
                </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="px-3 py-1 rounded-xl bg-slate-800/80 text-white text-[10px] font-black uppercase tracking-widest">🔒 Coming Soon</span>
            </div>
        </div>
    );
}

// เลือก preview ตามโหมด
function ModePreview({ id }: { id: string }) {
    if (id === 'campaign') return <CampaignPreview />;
    if (id === 'survival') return <SurvivalPreview />;
    if (id === 'training') return <TrainingPreview />;
    if (id === 'arena') return <ArenaPreview />;
    return null;
}

export default function ModeSelectionMapPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false);

    const { resolvedTheme } = useTheme();

    useEffect(() => {
        setIsMounted(true);
        // เช็คสถานะ login ด้วยการยิง endpoint ที่ต้อง auth (401 → apiFetch พาไปหน้า login ให้)
        const checkAuth = async () => {
            try {
                await apiFetch('/api/user/progress');
            } catch (e) {
                console.error("Auth check failed", e);
            }
            setTimeout(() => setLoading(false), 600);
        };
        checkAuth();
    }, [router]);

  
    const fadeInUp = {
        hidden: { opacity: 0, y: 40 },
        visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 20 } }
    };
    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
    };

    if (!isMounted) return <div className="min-h-screen bg-background"></div>;


    return (
        <div className="min-h-screen bg-background font-sans flex flex-col selection:bg-orange-500/20 dark:selection:bg-yellow-400/20 hacker:selection:bg-green-500/20 relative overflow-hidden text-foreground transition-colors duration-500">

          
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@400;500;700;900&display=swap');
        .font-prompt { font-family: 'Prompt', sans-serif; }

        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(1deg); }
        }
        .float-element { animation: float 6s ease-in-out infinite; }
        
        .glass-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(16px);
          border: 4px solid white;
          border-radius: 40px;
          box-shadow: 0 10px 30px rgba(249, 115, 22, 0.1);
          transition: all 0.3s ease;
        }

        /* 🌟 สีกล่องการ์ดโหมดมืด */
        .dark .glass-card {
          background: rgba(45, 34, 59, 0.7); 
          border-color: #382E54;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }

        /* 🌟 สีกล่องการ์ดโหมด Hacker */
        .hacker .glass-card {
          background: rgba(10, 10, 10, 0.85); 
          border-color: #166534; /* เขียวเข้ม */
          box-shadow: 0 10px 30px rgba(34, 197, 94, 0.15);
        }
        
        /* 🌟 ระบบปุ่ม 3D สวิทช์คีย์บอร์ด 🌟 */
        .btn-squishy {
          transition: transform 0.1s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.1s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s, border-color 0.2s;
        }
        .btn-squishy:hover { transform: translateY(-2px); }
        .btn-squishy:active { transform: translateY(6px); box-shadow: 0 0 0 transparent !important; }

        .cute-header {
          text-shadow: 2px 2px 0px rgba(255, 255, 255, 1), 
                       -1px -1px 0px rgba(255, 255, 255, 1), 
                       1px -1px 0px rgba(255, 255, 255, 1), 
                       -1px 1px 0px rgba(255, 255, 255, 1);
          letter-spacing: -0.02em;
        }

        .dark .cute-header { text-shadow: 2px 2px 0px rgba(0, 0, 0, 0.3); }
        .hacker .cute-header { text-shadow: 2px 2px 0px rgba(0, 0, 0, 0.8); }
      `}</style>

            {/* 🎈 Background Blobs เปลี่ยนสีตามโหมด 🎈 */}
            <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-400 dark:bg-yellow-500 hacker:bg-green-600 rounded-full blur-[120px] opacity-30 dark:opacity-10 hacker:opacity-10 float-element pointer-events-none z-0 transition-colors duration-500" />
            <div className="fixed bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-amber-400 dark:bg-yellow-600 hacker:bg-green-700 rounded-full blur-[120px] opacity-20 dark:opacity-10 hacker:opacity-10 pointer-events-none z-0 transition-colors duration-500" style={{ animationDelay: '2s' }} />

            <div className="shrink-0 relative z-50">
                <Navbar theme="linux" />
            </div>

            <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-12 relative z-10 flex flex-col">

                {/* หัวกระดาษ (Header) */}
                <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="text-center mb-16">
                    <div className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full bg-white dark:bg-[#2D223B] hacker:bg-[#0a0a0a] border-4 border-white dark:border-[#4B3965] hacker:border-[#166534] text-orange-500 dark:text-yellow-400 hacker:text-green-500 text-sm font-black mb-6 shadow-sm font-prompt transition-colors">
                        <Flag size={18} strokeWidth={3} />
                        เลือกเส้นทางภารกิจของคุณ
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black text-orange-950 dark:text-white hacker:text-white mb-4 cute-header transition-colors">
                        OPERATIONAL <span className="text-orange-500 dark:text-yellow-400 hacker:text-green-500">MAP</span>
                    </h1>
                    <p className="text-orange-600 dark:text-white/60 hacker:text-white/60 font-bold text-lg md:text-xl font-prompt max-w-2xl mx-auto tracking-wide transition-colors">
                        เส้นทางการเรียนรู้และฝึกฝนของสายลับ KeyRush เลือกโหมดที่ต้องการแล้วไปลุยกันเลย!
                    </p>

                    {/* 🚀 ปุ่มกระโดดไปยังโหมดที่ต้องการ (ไม่ต้องเลื่อนหา) */}
                    <div className="flex flex-wrap justify-center gap-2 md:gap-3 mt-8">
                        {MAP_MODES.map((mode) => (
                            <button
                                key={mode.id}
                                onClick={() => document.getElementById(`mode-${mode.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                                className={`btn-squishy inline-flex items-center gap-2 px-4 md:px-5 py-2.5 rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest border-4 font-prompt transition-colors
                                    ${mode.isLocked
                                        ? 'bg-slate-100 dark:bg-[#2D223B] hacker:bg-[#111] border-white dark:border-[#4B3965] hacker:border-[#333] text-slate-400 dark:text-white/40 hacker:text-white/40 shadow-[0_4px_0_#e2e8f0] dark:shadow-[0_4px_0_#1E1B2E] hacker:shadow-[0_4px_0_#000]'
                                        : 'bg-white dark:bg-[#2D223B] hacker:bg-[#0a0a0a] border-orange-200 dark:border-[#4B3965] hacker:border-green-800 text-orange-500 dark:text-yellow-400 hacker:text-green-500 shadow-[0_4px_0_#fed7aa] dark:shadow-[0_4px_0_#1E1B2E] hacker:shadow-[0_4px_0_#14532d] hover:bg-orange-50 dark:hover:bg-[#382E54] hacker:hover:bg-[#111]'}`}
                            >
                                {mode.isLocked ? <Lock size={16} strokeWidth={3} /> : <mode.icon size={16} strokeWidth={3} />}
                                {mode.title}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* 🌟 เส้นทาง Map (Timeline Layout) 🌟 */}
                <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="relative w-full pb-20">

                    {/* เส้นประเชื่อมต่อ (Dashed Line) สลับสีตามโหมด */}
                    <div className="absolute left-[50px] md:left-1/2 top-10 bottom-10 w-2 border-l-8 border-dashed border-orange-500/60 dark:border-yellow-500/30 hacker:border-green-600/40 md:-translate-x-1/2 z-0 transition-colors"></div>

                    {MAP_MODES.map((mode, index) => {
                        const isEven = index % 2 === 0;
                        const isLocked = mode.isLocked;

                        return (
                            <motion.div key={mode.id} id={`mode-${mode.id}`} variants={fadeInUp} className={`relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12 w-full mb-16 scroll-mt-24 ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}`}>

                                {/* 🌟 พื้นที่ฝั่งเนื้อหา (Card) */}
                                <div className="w-full md:w-1/2 flex flex-col items-center md:items-start pl-24 md:pl-0">
                                    <div className={`glass-card p-6 md:p-8 w-full max-w-lg ${isLocked ? 'opacity-70 dark:opacity-60 hacker:opacity-50 grayscale-[50%] dark:grayscale-[30%] hacker:grayscale-[40%]' : 'hover:-translate-y-2 border-orange-200 dark:border-yellow-500/30 hacker:border-green-600/50 shadow-md'} relative overflow-hidden group transition-all`}>

                                        {/* Badge Sector */}
                                        <div className={`inline-block px-4 py-1.5 rounded-xl font-black text-xs uppercase tracking-widest border-2 shadow-sm mb-4 transition-colors
                                            ${isLocked
                                                ? 'bg-slate-200 dark:bg-[#2D223B] hacker:bg-[#111] text-slate-500 dark:text-white/50 hacker:text-white/40 border-white dark:border-[#4B3965] hacker:border-[#333]'
                                                : 'bg-orange-500 dark:bg-yellow-400 hacker:bg-green-600 text-white dark:text-[#1E1B2E] hacker:text-[#0a0a0a] border-white dark:border-transparent hacker:border-transparent'}
                                        `}>
                                            {mode.subtitle}
                                        </div>

                                        <h3 className={`text-3xl font-black cute-header mb-3 transition-colors ${isLocked ? 'text-slate-600 dark:text-white/40 hacker:text-white/40' : 'text-orange-950 dark:text-white hacker:text-white'}`}>
                                            {mode.title}
                                        </h3>

                                        <p className={`font-prompt font-bold text-base leading-relaxed transition-colors ${isLocked ? 'text-slate-500 dark:text-white/30 hacker:text-white/30' : 'text-orange-800 dark:text-white/70 hacker:text-white/70'}`}>
                                            {mode.desc}
                                        </p>

                                        {/* 🖼️ ภาพจำลองหน้าจอของโหมดนี้ */}
                                        <ModePreview id={mode.id} />

                                        {/* ปุ่ม Action (ทุกปุ่มเป็น 3D Shadow) */}
                                        <div className="mt-8">
                                            {isLocked ? (
                                                <div className="btn-squishy cursor-not-allowed inline-flex items-center gap-2 px-6 py-3.5 bg-slate-100 dark:bg-[#2D223B] hacker:bg-[#111] border-4 border-white dark:border-[#4B3965] hacker:border-[#333] text-slate-400 dark:text-white/40 hacker:text-white/40 font-black rounded-[24px] uppercase tracking-widest text-sm shadow-[0_6px_0_#e2e8f0] dark:shadow-[0_6px_0_#1E1B2E] hacker:shadow-[0_6px_0_#000] font-prompt transition-colors">
                                                    <Lock size={18} strokeWidth={3} />
                                                    ยังไม่ปลดล็อค
                                                </div>
                                            ) : (
                                                <Link href={mode.link} className="btn-squishy inline-flex items-center gap-2 px-8 py-4 bg-orange-500 dark:bg-yellow-400 hacker:bg-green-600 border-4 border-white dark:border-yellow-500 hacker:border-green-500 text-white dark:text-[#1E1B2E] hacker:text-[#0a0a0a] font-black rounded-[24px] uppercase tracking-widest shadow-[0_8px_0_#c2410c] dark:shadow-[0_8px_0_#ca8a04] hacker:shadow-[0_8px_0_#14532d] hover:bg-orange-400 dark:hover:bg-yellow-300 hacker:hover:bg-green-500 font-prompt text-sm md:text-base transition-colors">
                                                    <Play size={20} fill="currentColor" />
                                                    เข้าสู่ภารกิจ
                                                </Link>
                                            )}
                                        </div>

                                    </div>
                                </div>

                                {/* 🌟 พื้นที่ฝั่งไอคอน (Node บนเส้นประ) */}
                                <div className="absolute left-[26px] md:relative md:left-auto md:w-auto flex justify-center shrink-0">
                                    <div className={`w-24 h-24 md:w-28 md:h-28 rounded-full border-8 border-white dark:border-[#382E54] hacker:border-[#166534] flex items-center justify-center z-10 shadow-lg transition-all duration-500
                                        ${isLocked
                                            ? 'bg-slate-100 dark:bg-[#1E1B2E] hacker:bg-[#111] text-slate-400 dark:text-white/30 hacker:text-white/30'
                                            : 'bg-orange-100 dark:bg-[#2D223B] hacker:bg-[#0a0a0a] text-orange-500 dark:text-yellow-400 hacker:text-green-500 group-hover:scale-110 shadow-[0_0_30px_rgba(249,115,22,0.4)] dark:shadow-[0_0_30px_rgba(250,204,21,0.2)] hacker:shadow-[0_0_30px_rgba(34,197,94,0.3)]'}
                                    `}>
                                        {isLocked ? (
                                            <Lock size={40} strokeWidth={2.5} />
                                        ) : (
                                            <mode.icon size={48} strokeWidth={2.5} className="animate-bounce" style={{ animationDuration: '3s' }} />
                                        )}
                                    </div>
                                </div>

                                {/* 🌟 พื้นที่ว่างอีกฝั่งเพื่อดัน Layout (เฉพาะ Desktop) */}
                                <div className="hidden md:block w-full md:w-1/2"></div>

                            </motion.div>
                        );
                    })}
                </motion.div>

            </main>

            {/* Footer */}
            <footer className="py-8 text-center text-orange-400 dark:text-white/30 hacker:text-green-600/60 font-black text-[10px] uppercase tracking-widest relative z-30 bg-white/40 dark:bg-[#1E1B2E]/70 hacker:bg-[#0a0a0a]/80 mt-auto border-t-4 border-white dark:border-[#382E54] hacker:border-green-900 backdrop-blur-md transition-colors duration-500">
                © 2026 KeyRush
            </footer>

        </div>
    );
}