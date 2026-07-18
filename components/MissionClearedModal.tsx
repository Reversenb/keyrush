"use client";

import { motion } from 'framer-motion';
import { Star, BookOpen, Zap, Terminal as TerminalIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import CoinIcon from '@/components/CoinIcon';

interface MissionClearedModalProps {
    targetOs: 'linux' | 'windows';
    grade: { rank: string; color: string; border: string; stars: number; label: string };
    accuracy: number;
    missionData: any;
    // เฉลยจาก /api/mission/verify (มีค่าเฉพาะตอนตอบถูก) — โจทย์ไม่ส่ง expectedCommand มาแล้ว
    revealedCommand?: string | null;
    themeText: string;
    currentExp: number;
    isReplaying: boolean;
    missionReward: number;
    // EXP ที่ได้จริงจาก PUT /progress (โดนหักเหลือ 20% ถ้าด่านนี้เคยดูเฉลย) — null ถ้า backend ไม่ส่งมา
    earnedExp?: number | null;
    // 🪙 เหรียญที่ได้รอบนี้ — null/0 = ไม่ได้ (เช่นรอบเล่นซ้ำ)
    earnedCoins?: number | null;
    wpm: number;
    handleNextLevel: () => void;
    handleReplayLevel: () => void;
}

export default function MissionClearedModal({
    targetOs, grade, accuracy, missionData, revealedCommand, themeText, currentExp, isReplaying, missionReward, earnedExp, earnedCoins, wpm, handleNextLevel, handleReplayLevel
}: MissionClearedModalProps) {
    const router = useRouter();

    // แต้มที่แสดง: ใช้ค่าจริงจาก backend ก่อน ถ้าไม่มีค่อย fallback ตรรกะเดิม
    const displayExp = typeof earnedExp === 'number' ? earnedExp : (isReplaying ? 0 : missionReward);
    // โดนหักจากการดูเฉลย = ได้ไม่เต็ม missionReward ทั้งที่ไม่ใช่รอบเล่นซ้ำ
    const isPenalized = typeof earnedExp === 'number' && !isReplaying && earnedExp < missionReward;

    // 🌟 Theme State
    const { theme: activeTheme, resolvedTheme } = useTheme();
    const currentTheme = activeTheme === 'system' ? resolvedTheme : activeTheme;
    const isDark = currentTheme === 'dark';
    const isHacker = currentTheme === 'hacker' || currentTheme === 'dragon'; const isDragon = currentTheme === 'dragon';

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto transition-colors ${isHacker ? 'bg-black/80' : isDark ? 'bg-black/60' : 'bg-orange-950/40'}`}>
            <div className={`border-4 w-full max-w-4xl max-h-[94vh] rounded-[40px] overflow-y-auto shadow-2xl relative animate-in zoom-in-95 duration-500 ease-out my-auto flex flex-col md:flex-row transition-colors ${isHacker ? 'bg-[#0a0a0a] border-[#166534]' : isDark ? 'bg-[#1E1B2E] border-[#382E54]' : 'bg-white border-white'}`}>

                {/* Left Column: Rank */}
                <div className={`w-full md:w-5/12 p-6 md:p-8 flex flex-col items-center justify-center border-b-4 md:border-b-0 md:border-r-4 relative overflow-hidden transition-colors
                    ${isHacker ? 'bg-[#111] border-[#166534]' : isDark ? (targetOs === 'linux' ? 'bg-[#2D223B] border-[#382E54]' : 'bg-[#1e293b] border-[#382E54]') : (targetOs === 'linux' ? 'bg-orange-50 border-white' : 'bg-blue-50 border-white')}
                `}>
                    <h2 className={`font-black tracking-widest text-[10px] mb-2 uppercase transition-colors ${isHacker ? 'text-green-600' : isDark ? 'text-white/50' : 'text-orange-400'}`}>System Status</h2>
                    <h1 className={`text-3xl md:text-4xl font-black mb-5 tracking-tighter cute-header transition-colors ${isHacker ? 'text-white' : isDark ? 'text-white' : 'text-orange-950'}`}>CLEARED</h1>
                    <div className="relative group">
                        <div className={`w-36 h-36 md:w-40 md:h-40 rounded-full flex items-center justify-center relative z-10 ${grade.border}`}>
                            <span className={`text-7xl md:text-8xl font-black italic select-none cute-header ${grade.color}`}>{grade.rank}</span>
                            <div className={`absolute -bottom-4 border-4 px-5 py-2 rounded-[20px] flex gap-1 shadow-sm transition-colors ${isHacker ? 'bg-[#0a0a0a] border-[#166534]' : isDark ? 'bg-[#1E1B2E] border-[#382E54]' : 'bg-white border-white'}`}>
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={18} strokeWidth={3} className={i < grade.stars ? (isHacker ? 'fill-green-500 text-green-500 drop-shadow-sm' : 'fill-yellow-400 text-yellow-400 drop-shadow-sm') : (isHacker ? 'fill-white/5 text-white/10' : isDark ? 'fill-white/5 text-white/10' : 'fill-slate-100 text-slate-200')} />
                                ))}
                            </div>
                        </div>
                    </div>
                    <p className={`mt-7 text-sm font-black uppercase tracking-widest text-center transition-colors ${accuracy === 100 ? `${themeText} animate-pulse` : (isHacker ? 'text-green-700' : isDark ? 'text-white/70' : 'text-orange-500')}`}>
                        {accuracy === 100 ? 'Flawless Execution! ✨' : `${grade.label} Performance`}
                    </p>
                </div>

                {/* Right Column: Stats & Intel */}
                <div className={`w-full md:w-7/12 p-5 md:p-7 flex flex-col justify-between relative transition-colors ${isHacker ? 'bg-[#0a0a0a]' : isDark ? 'bg-[#1E1B2E]' : 'bg-white'}`}>

                    <div className={`mb-4 p-4 rounded-[24px] border-4 shadow-sm relative overflow-hidden transition-colors ${isHacker ? 'bg-[#111] border-[#166534]' : isDark ? 'bg-black/20 border-[#4B3965]' : 'bg-orange-50 border-white'}`}>
                        <h4 className={`text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2 ${themeText}`}>
                            <BookOpen size={18} strokeWidth={3} /> Command Intel
                        </h4>
                        <div className={`rounded-[16px] px-5 py-2.5 border-2 mb-3 shadow-sm inline-block transition-colors ${isHacker ? 'bg-[#0a0a0a] border-[#166534]' : isDark ? 'bg-[#382E54] border-transparent' : 'bg-white border-white'}`}>
                            <code className={`font-black text-lg ${isHacker ? 'text-green-500' : isDark ? 'text-yellow-400' : 'text-orange-600'}`}>{revealedCommand || missionData?.title || 'Unknown Command'}</code>
                        </div>
                        <p className={`text-sm leading-relaxed border-l-4 pl-4 font-bold transition-colors ${isHacker ? 'text-green-400 border-green-600' : isDark ? 'text-white/80 border-yellow-500' : 'text-orange-800 border-orange-300'}`}>
                            <span className={themeText}>&gt;</span> {missionData?.description}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className={`col-span-2 border-4 p-4 rounded-[24px] flex items-center justify-between shadow-sm transition-colors ${isHacker ? 'bg-[#111] border-[#166534]' : isDark ? 'bg-[#382E54] border-[#4B3965]' : 'bg-white border-orange-100'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center border-2 shadow-sm transition-colors ${isHacker ? 'bg-green-600 text-[#0a0a0a] border-green-500' : isDark ? (targetOs === 'linux' ? 'bg-yellow-400 text-[#1E1B2E] border-yellow-300' : 'bg-blue-500 text-white border-blue-400') : (targetOs === 'linux' ? 'bg-orange-500 text-white border-white' : 'bg-blue-500 text-white border-white')}`}>
                                    <Zap size={24} strokeWidth={3} className="fill-current" />
                                </div>
                                <div>
                                    <p className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isHacker ? 'text-green-600' : isDark ? 'text-white/50' : 'text-orange-400'}`}>Total EXP</p>
                                    <p className={`text-3xl font-black tracking-tight cute-header transition-colors ${isHacker ? 'text-white' : isDark ? 'text-white' : 'text-orange-950'}`}>{currentExp.toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="text-right flex flex-col items-end">
                                <span className={`text-2xl font-black cute-header transition-colors ${isPenalized ? 'text-rose-500' : isReplaying ? (isHacker ? 'text-green-800' : isDark ? 'text-white/30' : 'text-orange-300') : themeText}`}>+{displayExp} EXP</span>
                                {typeof earnedCoins === 'number' && earnedCoins > 0 && (
                                    <span className={`text-sm font-black mt-1 flex items-center gap-1.5 transition-colors ${isHacker ? 'text-green-400' : isDark ? 'text-yellow-300' : 'text-amber-500'}`}>
                                        <CoinIcon size={16} /> +{earnedCoins} เหรียญ
                                    </span>
                                )}
                                {isPenalized && <span className={`text-[9px] font-black uppercase tracking-widest mt-1 px-3 py-1 rounded-[8px] shadow-sm transition-colors ${isHacker ? 'bg-rose-900 text-rose-400' : isDark ? 'bg-rose-900/60 text-rose-300' : 'bg-rose-400 text-white'}`}>ใช้เฉลย -80%</span>}
                                {isReplaying && <span className={`text-[9px] font-black uppercase tracking-widest mt-1 px-3 py-1 rounded-[8px] shadow-sm transition-colors ${isHacker ? 'bg-green-900 text-green-400' : isDark ? 'bg-[#4B3965] text-white' : 'bg-orange-300 text-white'}`}>Practice Mode</span>}
                            </div>
                        </div>

                        <div className={`border-4 p-4 rounded-[24px] flex flex-col gap-1 shadow-sm transition-colors ${isHacker ? 'bg-[#111] border-[#166534]' : isDark ? 'bg-[#382E54] border-[#4B3965]' : 'bg-white border-orange-100'}`}>
                            <p className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isHacker ? 'text-green-600' : isDark ? 'text-white/50' : 'text-orange-400'}`}>Speed</p>
                            <p className={`text-3xl font-black cute-header transition-colors ${isHacker ? 'text-green-500' : isDark ? 'text-yellow-400' : 'text-orange-600'}`}>{wpm} <span className={`text-sm font-black transition-colors ${isHacker ? 'text-green-700' : isDark ? 'text-yellow-600' : 'text-orange-400'}`}>WPM</span></p>
                        </div>

                        <div className={`border-4 p-4 rounded-[24px] flex flex-col gap-1 shadow-sm transition-colors ${isHacker ? 'bg-[#111] border-[#166534]' : isDark ? 'bg-[#382E54] border-[#4B3965]' : 'bg-white border-orange-100'}`}>
                            <p className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isHacker ? 'text-green-600' : isDark ? 'text-white/50' : 'text-orange-400'}`}>Accuracy</p>
                            <p className={`text-3xl font-black cute-header transition-colors ${isHacker ? 'text-green-500' : isDark ? 'text-yellow-400' : 'text-orange-600'}`}>{accuracy}<span className={`text-sm font-black transition-colors ${isHacker ? 'text-green-700' : isDark ? 'text-yellow-600' : 'text-orange-400'}`}>%</span></p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 mt-auto">
                        <button
                            onClick={handleNextLevel}
                            className={`w-full py-3.5 font-black uppercase tracking-widest text-sm rounded-[24px] flex items-center justify-center gap-2 transition-all border-4 btn-squishy
                                ${isHacker
                                    ? 'bg-green-600 text-[#0a0a0a] border-green-500 shadow-[0_6px_0_#14532d] hover:bg-green-500'
                                    : isDark
                                        ? (targetOs === 'linux' ? 'bg-yellow-400 text-[#1E1B2E] border-yellow-300 shadow-[0_6px_0_#ca8a04] hover:bg-yellow-300' : 'bg-blue-500 text-white border-blue-400 shadow-[0_6px_0_#1d4ed8] hover:bg-blue-400')
                                        : (targetOs === 'linux' ? 'bg-orange-500 text-white border-white shadow-[0_6px_0_rgba(249,115,22,0.2)] hover:bg-orange-400' : 'bg-blue-500 text-white border-white shadow-[0_6px_0_rgba(59,130,246,0.2)] hover:bg-blue-400')
                                }`}
                        >
                            <TerminalIcon size={20} strokeWidth={3} /> Next
                        </button>
                        <div className="flex gap-3">
                            <button
                                onClick={handleReplayLevel}
                                className={`flex-1 py-3 border-4 text-xs uppercase font-black tracking-widest rounded-[20px] transition-colors btn-squishy shadow-sm
                                    ${isHacker
                                        ? 'bg-[#0a0a0a] border-green-900 text-green-600 hover:text-green-400 hover:border-green-700'
                                        : isDark
                                            ? 'bg-[#2D223B] border-[#4B3965] text-white/50 hover:text-white hover:bg-[#382E54]'
                                            : 'bg-white border-white text-orange-400 hover:text-orange-600 hover:bg-orange-50'
                                    }`}
                            >
                                Retry
                            </button>
                            <button
                                onClick={() => router.push('/campaignpage')}
                                className={`flex-1 py-3 border-4 text-xs uppercase font-black tracking-widest rounded-[20px] transition-colors btn-squishy shadow-sm
                                    ${isHacker
                                        ? 'bg-[#0a0a0a] border-green-900 text-green-600 hover:text-green-400 hover:border-green-700'
                                        : isDark
                                            ? 'bg-[#2D223B] border-[#4B3965] text-white/50 hover:text-white hover:bg-[#382E54]'
                                            : 'bg-white border-white text-orange-400 hover:text-orange-600 hover:bg-orange-50'
                                    }`}
                            >
                                Map
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}