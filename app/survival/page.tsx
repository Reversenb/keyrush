"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, Zap, Clock, Trophy, Loader2, Play, AlertCircle, XCircle, Keyboard, Monitor, TerminalSquare, Brain, Sparkles } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

interface CommandMission {
    id: string;
    expectedCommand: string;
    description: string;
    os?: string;
}

type KbColor = 'blue' | 'green' | 'purple' | 'rose' | 'orange' | 'yellow' | 'cyan' | 'pink' | 'teal' | 'indigo';

export default function Page() {
    const { theme: activeTheme, resolvedTheme } = useTheme();
    const router = useRouter();

    // 🛡️ Auth State
    const [isAuthChecking, setIsAuthChecking] = useState(true);

    // 🎮 Game State
    const [gameState, setGameState] = useState<'idle' | 'loading' | 'error' | 'playing' | 'gameover'>('idle');
    const [phase, setPhase] = useState<'memorize' | 'type'>('memorize');
    const [errorMessage, setErrorMessage] = useState('');
    const [allCommands, setAllCommands] = useState<CommandMission[]>([]);
    const [activeCommands, setActiveCommands] = useState<CommandMission[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [input, setInput] = useState('');

    // ✨ Visual & Settings State
    const [flash, setFlash] = useState<'success' | 'error' | null>(null);
    const [addedTime, setAddedTime] = useState<number | null>(null);
    const [showKeyboard, setShowKeyboard] = useState<boolean>(true);
    const [kbColor, setKbColor] = useState<KbColor>('blue');
    const [selectedOS, setSelectedOS] = useState<'windows' | 'linux'>('linux');

    // ⏱️ Timer & Stats
    const DURATION = 60; // บังคับ 60 วิ
    const [timeLeft, setTimeLeft] = useState(DURATION);
    const [maxTime, setMaxTime] = useState(DURATION);
    const [survivedTime, setSurvivedTime] = useState(0);
    const [score, setScore] = useState(0);
    const [combo, setCombo] = useState(0);
    const [maxCombo, setMaxCombo] = useState(0);

    const inputRef = useRef<HTMLInputElement>(null);

    // 🛡️ ตรวจสอบการ Login
    useEffect(() => {
        const token = localStorage.getItem('keyrush_token');
        if (!token) {
            router.push('/login');
        } else {
            setIsAuthChecking(false);
            fetchCommands();
        }
    }, [router]);

    // 📡 โหลดข้อมูล API
    const fetchCommands = async () => {
        setGameState('loading');
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';
            const res = await fetch(`${apiUrl}/api/survival/commands`);
            const rawText = await res.text();

            if (!res.ok) throw new Error(`Server Error ${res.status}: ไม่สามารถเชื่อมต่อฐานข้อมูลโจทย์ได้`);

            const data = JSON.parse(rawText);
            if (data.success && data.data?.length > 0) {
                setAllCommands(data.data);
                setGameState('idle');
            } else {
                throw new Error(data.message || 'ไม่พบข้อมูลคำสั่งในระบบ');
            }
        } catch (error: any) {
            setErrorMessage(error.message || 'ระบบขัดข้อง กรุณาลองใหม่อีกครั้ง');
            setGameState('error');
        }
    };

    const submitScore = async (finalScore: number, finalMaxCombo: number, finalTime: number) => {
        try {
            const token = localStorage.getItem('keyrush_token');
            if (!token) return;
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/survival/score`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ score: finalScore, maxCombo: finalMaxCombo, survivedTime: finalTime, os: selectedOS })
            });
        } catch (error) {
            console.error('Failed to submit:', error);
        }
    };

    // ⏱️ ระบบนับเวลา
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (gameState === 'playing' && phase === 'type' && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
                setSurvivedTime((prev) => prev + 1);
            }, 1000);
        } else if (timeLeft <= 0 && gameState === 'playing') {
            setGameState('gameover');
            submitScore(score, maxCombo, survivedTime);
        }
        return () => clearInterval(timer);
    }, [gameState, phase, timeLeft, score, maxCombo, survivedTime]);

    // 🧠 ระบบ "จำก่อนพิมพ์"
    useEffect(() => {
        let timeout: NodeJS.Timeout;
        if (gameState === 'playing' && phase === 'memorize') {
            timeout = setTimeout(() => {
                setPhase('type');
                setTimeout(() => inputRef.current?.focus(), 50);
            }, 2000);
        }
        return () => clearTimeout(timeout);
    }, [gameState, phase, currentIndex]);

    // 🚀 เริ่มเกม
    const startGame = () => {
        const filtered = allCommands.filter(c => c.os?.toLowerCase() === selectedOS);
        const playCmds = filtered.length > 0 ? filtered : allCommands;
        const shuffled = [...playCmds].sort(() => 0.5 - Math.random());

        setActiveCommands(shuffled);
        setGameState('playing');
        setPhase('memorize');
        setTimeLeft(DURATION);
        setMaxTime(DURATION);
        setSurvivedTime(0);
        setScore(0);
        setCombo(0);
        setMaxCombo(0);
        setInput('');
        setFlash(null);
        setCurrentIndex(0);
    };

    // 🛑 ยกเลิกและรีเซ็ตระบบ
    const handleCancel = () => {
        setGameState('idle');
        setPhase('memorize');
        setTimeLeft(DURATION);
        setScore(0);
        setCombo(0);
        setMaxCombo(0);
        setInput('');
    };

    // ⌨️ เช็คคำตอบ
    const handleInputCheck = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (phase !== 'type') {
            e.preventDefault();
            return;
        }

        if (e.key === 'Enter') {
            e.preventDefault();
            const expected = activeCommands[currentIndex]?.expectedCommand;

            if (input.trim() === expected) {
                setFlash('success');
                setScore((prev) => prev + (10 * (combo + 1)));
                setCombo((prev) => {
                    const newC = prev + 1;
                    setMaxCombo((max) => Math.max(max, newC));
                    return newC;
                });

                setTimeLeft((prev) => {
                    const newTime = prev + 2;
                    setMaxTime((m) => Math.max(m, newTime));
                    return newTime;
                });

                setAddedTime(2);
                setInput('');

                setCurrentIndex((prev) => (prev + 1) % activeCommands.length);
                setPhase('memorize');

                setTimeout(() => { setFlash(null); setAddedTime(null); }, 300);
            } else {
                setFlash('error');
                setCombo(0);
                setTimeLeft((prev) => Math.max(0, prev - 3));
                setInput('');
                setTimeout(() => setFlash(null), 400);
            }
        }
    };

    const isDanger = timeLeft <= 10 && gameState === 'playing';
    const progressPercentage = Math.max(0, Math.min(100, (timeLeft / maxTime) * 100));

    // 🎨 Custom Keyboard Palette
    const kbColorStyles: Record<KbColor, string> = {
        blue: "bg-sky-400 dark:bg-sky-500 hacker:bg-sky-500 text-white hacker:text-black border-b-4 border-sky-600 dark:border-sky-700 hacker:border-sky-600 shadow-[0_0_15px_rgba(56,189,248,0.4)] hacker:shadow-[0_0_15px_rgba(56,189,248,0.8)]",
        green: "bg-emerald-400 dark:bg-emerald-500 hacker:bg-emerald-500 text-white hacker:text-black border-b-4 border-emerald-600 dark:border-emerald-700 hacker:border-emerald-600 shadow-[0_0_15px_rgba(52,211,153,0.4)] hacker:shadow-[0_0_15px_rgba(52,211,153,0.8)]",
        purple: "bg-violet-400 dark:bg-violet-500 hacker:bg-violet-500 text-white hacker:text-black border-b-4 border-violet-600 dark:border-violet-700 hacker:border-violet-600 shadow-[0_0_15px_rgba(139,92,246,0.4)] hacker:shadow-[0_0_15px_rgba(139,92,246,0.8)]",
        rose: "bg-rose-400 dark:bg-rose-500 hacker:bg-rose-500 text-white hacker:text-black border-b-4 border-rose-600 dark:border-rose-700 hacker:border-rose-600 shadow-[0_0_15px_rgba(244,63,94,0.4)] hacker:shadow-[0_0_15px_rgba(244,63,94,0.8)]",
        orange: "bg-amber-400 dark:bg-amber-500 hacker:bg-amber-500 text-white hacker:text-black border-b-4 border-amber-600 dark:border-amber-700 hacker:border-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.4)] hacker:shadow-[0_0_15px_rgba(245,158,11,0.8)]",
        yellow: "bg-yellow-400 dark:bg-yellow-500 hacker:bg-yellow-500 text-slate-900 hacker:text-black border-b-4 border-yellow-600 dark:border-yellow-700 hacker:border-yellow-600 shadow-[0_0_15px_rgba(250,204,21,0.4)] hacker:shadow-[0_0_15px_rgba(250,204,21,0.8)]",
        cyan: "bg-cyan-400 dark:bg-cyan-500 hacker:bg-cyan-500 text-slate-900 hacker:text-black border-b-4 border-cyan-600 dark:border-cyan-700 hacker:border-cyan-600 shadow-[0_0_15px_rgba(34,211,238,0.4)] hacker:shadow-[0_0_15px_rgba(34,211,238,0.8)]",
        pink: "bg-pink-400 dark:bg-pink-500 hacker:bg-pink-500 text-white hacker:text-black border-b-4 border-pink-600 dark:border-pink-700 hacker:border-pink-600 shadow-[0_0_15px_rgba(244,114,182,0.4)] hacker:shadow-[0_0_15px_rgba(244,114,182,0.8)]",
        teal: "bg-teal-400 dark:bg-teal-500 hacker:bg-teal-500 text-white hacker:text-black border-b-4 border-teal-600 dark:border-teal-700 hacker:border-teal-600 shadow-[0_0_15px_rgba(45,212,191,0.4)] hacker:shadow-[0_0_15px_rgba(45,212,191,0.8)]",
        indigo: "bg-indigo-400 dark:bg-indigo-500 hacker:bg-indigo-500 text-white hacker:text-black border-b-4 border-indigo-600 dark:border-indigo-700 hacker:border-indigo-600 shadow-[0_0_15px_rgba(99,102,241,0.4)] hacker:shadow-[0_0_15px_rgba(99,102,241,0.8)]"
    };

    const getCircleColorClass = (c: KbColor) => {
        const classes: Record<KbColor, string> = {
            blue: 'bg-sky-400', green: 'bg-emerald-400', purple: 'bg-violet-400',
            rose: 'bg-rose-400', orange: 'bg-amber-400', yellow: 'bg-yellow-400',
            cyan: 'bg-cyan-400', pink: 'bg-pink-400', teal: 'bg-teal-400', indigo: 'bg-indigo-400'
        };
        return classes[c];
    };

    const renderVirtualKeyboard = () => {
        if (!showKeyboard || gameState !== 'playing') return null;

        const currentExpectedCommand = activeCommands[currentIndex]?.expectedCommand || "";
        const expectedChar = (phase === 'type' && input.length < currentExpectedCommand.length)
            ? currentExpectedCommand[input.length]
            : null;

        const keyboardLayout = [
            ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
            ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']'],
            ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"],
            ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'],
            ['space']
        ];

        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="shrink-0 flex flex-col gap-1 items-center w-full select-none pb-4 pt-3 px-2 bg-slate-50/50 dark:bg-slate-900/50 hacker:bg-[#050505] border-t-2 border-slate-100 dark:border-slate-800 hacker:border-green-900/50"
            >
                <div className="flex flex-col md:flex-row justify-between items-center w-full max-w-3xl px-2 mb-2 gap-2">
                    <span className="text-[10px] md:text-xs font-bold text-slate-400 dark:text-slate-500 hacker:text-green-600 flex items-center gap-1">
                        <Keyboard size={14} /> เลือกสีแป้นพิมพ์
                    </span>
                    <div className="flex flex-wrap justify-center gap-1.5 bg-white/50 dark:bg-slate-800/50 hacker:bg-green-900/20 p-1.5 rounded-full border border-slate-200 dark:border-slate-700 hacker:border-green-900/50">
                        {(Object.keys(kbColorStyles) as KbColor[]).map((c) => (
                            <button
                                key={c}
                                onClick={(e) => { e.stopPropagation(); setKbColor(c); }}
                                className={`w-4 h-4 md:w-5 md:h-5 rounded-full transition-transform border-2
                                    ${kbColor === c ? 'scale-125 border-white dark:border-slate-900 hacker:border-black shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}
                                    ${getCircleColorClass(c)}
                                `}
                            />
                        ))}
                    </div>
                </div>

                {keyboardLayout.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex justify-center gap-1 md:gap-1.5 w-full max-w-3xl">
                        {row.map((key) => {
                            const isExpected = expectedChar && ((key === 'space' && expectedChar === ' ') || (key === expectedChar.toLowerCase()));
                            const isSpaceBar = key === 'space';

                            const normalStyle = "bg-white dark:bg-slate-800 hacker:bg-[#0a0a0a] text-slate-500 dark:text-slate-400 hacker:text-green-700 border-b-[3px] border-slate-200 dark:border-slate-900 hacker:border-green-900/60";
                            const activeStyle = `${kbColorStyles[kbColor]} -translate-y-1`;

                            return (
                                <div
                                    key={key}
                                    className={`flex items-center justify-center rounded-lg md:rounded-xl font-bold uppercase transition-all duration-200
                                        ${isSpaceBar ? 'w-24 md:w-48 h-8 md:h-10 text-[10px] md:text-xs' : 'w-6 h-8 md:w-9 md:h-10 text-[10px] md:text-sm'}
                                        ${isExpected ? activeStyle : normalStyle}
                                    `}
                                >
                                    {isSpaceBar ? 'SPACE' : key}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </motion.div>
        );
    };

    // 🛡️ หากกำลังตรวจสอบสิทธิ์ ให้แสดงหน้าโหลด (พร้อมแอนิเมชันเปิดตัว)
    if (isAuthChecking) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 hacker:bg-[#050505]"
            >
                <Loader2 size={48} className="animate-spin text-sky-500 hacker:text-green-500 mb-4" />
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="font-bold text-slate-500 dark:text-slate-400 hacker:text-green-600"
                >
                    กำลังตรวจสอบสิทธิ์การเข้าถึง...
                </motion.p>
            </motion.div>
        );
    }

    return (
        <div className={`h-screen flex flex-col overflow-hidden transition-colors duration-300
            bg-sky-50/50 dark:bg-slate-950 hacker:bg-[#050505]
            text-slate-700 dark:text-slate-100 hacker:text-green-500
        `}>
            <Navbar />

            <main className="flex-1 min-h-0 flex flex-col items-center justify-center p-3 md:p-6 lg:p-8 relative z-10 w-full">
                {/* 🌟 เพิ่มแอนิเมชัน Fade + Slide Up ให้กับทั้งหน้าจอเกม */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="w-full max-w-5xl flex flex-col gap-4 h-full"
                >

                    {/* 📊 Game HUD */}
                    <header className="shrink-0 bg-white dark:bg-slate-900 hacker:bg-[#0a0a0a] p-4 md:p-5 rounded-[2rem] border border-slate-200 dark:border-slate-800 hacker:border-green-900 shadow-sm flex flex-col gap-4">
                        <div className="flex justify-between items-center px-2">
                            <div className="flex items-center gap-3 md:gap-5">
                                {/* 🛑 ปุ่มยกเลิกด้านบน */}
                                {gameState === 'playing' && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleCancel(); }}
                                        className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-rose-100 text-rose-500 hover:bg-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:hover:bg-rose-500/40 hacker:bg-red-900/20 hacker:text-red-500 font-bold transition-all border-b-4 border-rose-200 hover:border-rose-300 dark:border-rose-500/30 hacker:border-red-900/50 active:border-b-0 active:translate-y-[4px]"
                                        title="ออกจากเกม"
                                    >
                                        <XCircle size={28} />
                                    </button>
                                )}

                                {/* Timer */}
                                <div className={`flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-2xl ${isDanger ? 'bg-rose-100 text-rose-500 dark:bg-rose-500/20 hacker:bg-red-900/30 hacker:text-red-500' : 'bg-sky-100 text-sky-500 dark:bg-sky-500/20 hacker:bg-green-900/20 hacker:text-green-500'}`}>
                                    <Clock size={28} className={isDanger ? 'animate-pulse' : ''} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs md:text-sm font-bold opacity-50 hacker:text-green-600">เวลาเอาชีวิตรอด</span>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-3xl md:text-4xl font-black tracking-tight ${isDanger ? 'text-rose-500 hacker:text-red-500' : ''}`}>
                                            {timeLeft}
                                        </span>
                                        <AnimatePresence>
                                            {addedTime && (
                                                <motion.span
                                                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                                                    animate={{ opacity: 1, y: -2, scale: 1 }}
                                                    exit={{ opacity: 0, y: -15 }}
                                                    className="text-base md:text-lg font-bold text-emerald-500 hacker:text-green-400"
                                                >
                                                    +{addedTime}
                                                </motion.span>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 md:gap-10">
                                <div className="text-right">
                                    <p className="text-xs md:text-sm font-bold opacity-50 hacker:text-green-600">คะแนน</p>
                                    <motion.p key={score} initial={{ scale: 1.1, color: '#38bdf8' }} animate={{ scale: 1, color: 'inherit' }} className="text-2xl md:text-3xl font-black tracking-tight hacker:text-green-400">
                                        {score}
                                    </motion.p>
                                </div>
                                <div className={`text-right ${combo >= 5 ? 'text-amber-500 hacker:text-yellow-400' : 'text-sky-500 hacker:text-green-600'}`}>
                                    <p className="text-xs md:text-sm font-bold opacity-50 hacker:text-green-600">คอมโบ</p>
                                    <motion.p key={combo} initial={{ scale: 1.2 }} animate={{ scale: 1 }} className="text-2xl md:text-3xl font-black tracking-tight flex items-center justify-end gap-1">
                                        x{combo} <Zap size={24} className={combo >= 5 ? "animate-bounce" : ""} />
                                    </motion.p>
                                </div>
                            </div>
                        </div>

                        <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 hacker:bg-green-900/30 rounded-full overflow-hidden">
                            <motion.div
                                className={`h-full rounded-full ${isDanger ? 'bg-rose-500 hacker:bg-red-500' : 'bg-sky-400 dark:bg-sky-500 hacker:bg-green-500'}`}
                                initial={{ width: '100%' }}
                                animate={{ width: `${progressPercentage}%` }}
                                transition={{ duration: 1, ease: 'linear' }}
                            />
                        </div>
                    </header>

                    {/* 💻 Play Area */}
                    <motion.div
                        onClick={() => gameState === 'playing' && inputRef.current?.focus()}
                        animate={flash === 'error' ? { x: [-5, 5, -5, 5, 0] } : {}}
                        transition={{ duration: 0.2 }}
                        className={`relative rounded-[2.5rem] flex-1 min-h-0 flex flex-col cursor-text transition-colors duration-200 overflow-hidden
                            ${flash === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 hacker:bg-green-900/30 border-2 border-emerald-300 hacker:border-green-400'
                                : flash === 'error' ? 'bg-rose-50 dark:bg-rose-900/20 hacker:bg-red-900/20 border-2 border-rose-300 hacker:border-red-500'
                                    : 'bg-white dark:bg-slate-900 hacker:bg-[#0a0a0a] border-2 border-slate-200 dark:border-slate-800 hacker:border-green-900 shadow-sm'}
                        `}
                    >

                        {/* 🌟 Idle Screen: เลือก OS พร้อมแอนิเมชันเปิดตัวเด้งๆ */}
                        {gameState === 'idle' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.4, delay: 0.2 }}
                                className="text-center w-full max-w-xl mx-auto flex flex-col items-center justify-center h-full p-6 md:p-10"
                            >
                                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-sky-100 dark:bg-sky-500/10 hacker:bg-green-900/20 mb-6 text-sky-500 hacker:text-green-500">
                                    <Gamepad2 size={48} />
                                </div>
                                <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight hacker:text-green-500">โหมดเอาชีวิตรอด <span className="text-sky-500 hacker:text-green-400">60s</span></h1>
                                <p className="text-lg mb-8 font-medium text-slate-500 dark:text-slate-400 hacker:text-green-700">
                                    เลือกระบบปฏิบัติการที่ต้องการทดสอบก่อนเริ่มลุย!
                                </p>

                                <div className="grid grid-cols-2 gap-4 w-full mb-8">
                                    <button
                                        onClick={() => setSelectedOS('linux')}
                                        className={`flex flex-col items-center gap-3 p-5 md:p-6 rounded-[2rem] font-bold text-lg md:text-xl border-4 transition-all outline-none
                                            ${selectedOS === 'linux'
                                                ? 'border-emerald-500 bg-emerald-50 text-emerald-600 dark:border-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400 hacker:border-green-500 hacker:bg-green-900/40 hacker:text-green-400 scale-105 shadow-md hacker:shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                                                : 'border-slate-200 text-slate-400 hover:border-emerald-300 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 hacker:border-green-900/50 hacker:text-green-700 hacker:hover:border-green-600 hacker:hover:bg-green-900/10'
                                            }
                                        `}
                                    >
                                        <TerminalSquare size={36} className={selectedOS === 'linux' ? 'text-emerald-500 hacker:text-green-400' : ''} />
                                        Linux
                                    </button>
                                    <button
                                        onClick={() => setSelectedOS('windows')}
                                        className={`flex flex-col items-center gap-3 p-5 md:p-6 rounded-[2rem] font-bold text-lg md:text-xl border-4 transition-all outline-none
                                            ${selectedOS === 'windows'
                                                ? 'border-blue-500 bg-blue-50 text-blue-600 dark:border-blue-500 dark:bg-blue-500/10 dark:text-blue-400 hacker:border-blue-500 hacker:bg-blue-900/40 hacker:text-blue-400 scale-105 shadow-md hacker:shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                                                : 'border-slate-200 text-slate-400 hover:border-blue-300 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 hacker:border-green-900/50 hacker:text-green-700 hacker:hover:border-blue-800 hacker:hover:bg-blue-900/10'
                                            }
                                        `}
                                    >
                                        <Monitor size={36} className={selectedOS === 'windows' ? 'text-blue-500 hacker:text-blue-400' : ''} />
                                        Windows
                                    </button>
                                </div>

                                <button
                                    onClick={startGame}
                                    className="w-full flex items-center justify-center gap-2 py-5 bg-sky-500 hover:bg-sky-400 dark:bg-sky-600 dark:hover:bg-sky-500 hacker:bg-green-700 hacker:hover:bg-green-600 text-white hacker:text-black rounded-2xl font-black text-2xl transition-all border-b-8 border-sky-700 dark:border-sky-800 hacker:border-green-900 active:border-b-0 active:translate-y-[8px]"
                                >
                                    <Play size={24} fill="currentColor" /> ลุยเลย!
                                </button>
                            </motion.div>
                        )}

                        {/* 🧠 เฟสบังคับอ่านโจทย์ (2 วินาที) */}
                        {gameState === 'playing' && phase === 'memorize' && activeCommands.length > 0 && (
                            <div className="w-full h-full flex flex-col items-center justify-center p-6 md:p-10">
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 1.1, opacity: 0 }}
                                    className="flex flex-col items-center justify-center text-center w-full"
                                >
                                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-500/20 hacker:bg-green-900/30 text-amber-500 hacker:text-green-500 mb-6">
                                        <Brain size={40} className="animate-pulse" />
                                    </div>
                                    <p className="text-lg md:text-xl font-bold text-amber-500 dark:text-amber-400 hacker:text-green-500 mb-4 tracking-wide">เตรียมจำคำสั่งให้ดี!</p>
                                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-800 dark:text-white hacker:text-green-400 leading-snug px-4 break-words max-w-4xl">
                                        "{activeCommands[currentIndex].description}"
                                    </h2>

                                    {/* หลอดเวลาหด 2 วิ */}
                                    <div className="w-64 h-2 bg-slate-200 dark:bg-slate-800 hacker:bg-green-900/30 rounded-full mt-10 overflow-hidden">
                                        <motion.div
                                            initial={{ width: '100%' }}
                                            animate={{ width: '0%' }}
                                            transition={{ duration: 2, ease: 'linear' }}
                                            className="h-full bg-amber-400 hacker:bg-green-500"
                                        />
                                    </div>
                                </motion.div>
                            </div>
                        )}

                        {/* ⌨️ เฟสให้พิมพ์ */}
                        {gameState === 'playing' && phase === 'type' && activeCommands.length > 0 && (
                            <div className="flex flex-col w-full h-full relative">

                                <div className="absolute top-4 right-6 z-20">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowKeyboard(!showKeyboard); }}
                                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold transition-all border-b-4 active:border-b-0 active:translate-y-[4px] text-sm
                                            ${showKeyboard
                                                ? 'bg-sky-100 text-sky-600 border-sky-200 dark:bg-sky-500/20 dark:text-sky-400 dark:border-sky-500/30 hacker:bg-green-900/30 hacker:text-green-400 hacker:border-green-900/50'
                                                : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-950 hacker:bg-green-900/10 hacker:text-green-700 hacker:border-green-900/30'}`}
                                    >
                                        <Keyboard size={18} />
                                        <span className="hidden md:inline">แป้นพิมพ์</span>
                                    </button>
                                </div>

                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={(e) => {
                                        const expected = activeCommands[currentIndex]?.expectedCommand || "";
                                        let val = e.target.value;
                                        if (val.length > expected.length) val = val.slice(0, expected.length);
                                        setInput(val);
                                    }}
                                    onKeyDown={handleInputCheck}
                                    className="absolute opacity-0 pointer-events-none -z-10"
                                    autoComplete="off" spellCheck="false"
                                />

                                {/* 🌟 Scrollable Container สำหรับโจทย์และโค้ด */}
                                <div className="flex-1 overflow-y-auto flex flex-col items-center justify-start pt-8 md:pt-12 px-6 md:px-10 pb-6 w-full">
                                    <div className="w-full max-w-4xl text-center md:text-left flex flex-col items-center md:items-start shrink-0">
                                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-sky-100 dark:bg-sky-500/20 hacker:bg-green-900/30 text-sky-600 dark:text-sky-300 hacker:text-green-400 rounded-xl text-sm font-bold mb-4 mt-8 md:mt-0">
                                            <Sparkles size={16} /> ภารกิจ ({selectedOS.toUpperCase()})
                                        </div>
                                        <p className="text-lg md:text-xl lg:text-2xl font-medium text-slate-600 dark:text-slate-300 hacker:text-green-500 mb-6 md:mb-8 w-full leading-relaxed break-words">
                                            {activeCommands[currentIndex].description}
                                        </p>
                                    </div>

                                    {/* Terminal Area */}
                                    <div className="font-mono text-3xl md:text-5xl lg:text-6xl flex flex-wrap items-center justify-center md:justify-start gap-4 bg-slate-100 dark:bg-slate-950 hacker:bg-black p-6 md:p-8 rounded-[2rem] border-2 border-slate-200 dark:border-white/5 hacker:border-green-900/60 overflow-hidden shadow-inner w-full max-w-4xl shrink-0">
                                        <span className="text-sky-400 hacker:text-green-600 font-bold opacity-50 shrink-0">$&gt;</span>

                                        <span className="flex-1 font-semibold break-words relative">
                                            {activeCommands[currentIndex].expectedCommand.split('').map((char: string, i: number) => {
                                                let color = 'text-slate-300 dark:text-slate-700 hacker:text-green-900';
                                                let isWrongSpace = false;

                                                if (i < input.length) {
                                                    if (input[i] === char) {
                                                        color = 'text-emerald-500 dark:text-emerald-400 hacker:text-green-400';
                                                    } else {
                                                        color = 'text-rose-500 dark:text-rose-400 bg-rose-100 dark:bg-rose-500/20 hacker:bg-red-900/50 hacker:text-red-400 rounded-xl';
                                                        if (char === ' ') isWrongSpace = true;
                                                    }
                                                }

                                                const isCurrentChar = i === input.length;

                                                return (
                                                    <span key={i} className={`relative inline-block whitespace-pre ${color}`}>
                                                        {isWrongSpace ? '_' : char}
                                                        {isCurrentChar && (
                                                            <span className="absolute left-0 -bottom-1 w-full h-[6px] bg-sky-400 dark:bg-sky-500 hacker:bg-green-500 animate-pulse rounded-full" />
                                                        )}
                                                    </span>
                                                );
                                            })}

                                            {input.length >= (activeCommands[currentIndex]?.expectedCommand?.length || 0) && (
                                                <span className="relative inline-block w-6 md:w-8 ml-1">
                                                    <span className="absolute left-0 -bottom-1 w-full h-[6px] bg-sky-400 dark:bg-sky-500 hacker:bg-green-500 animate-pulse rounded-full" />
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                </div>

                                {/* 🌟 Fixed Keyboard Container */}
                                {renderVirtualKeyboard()}

                            </div>
                        )}

                        {/* Screens อื่นๆ (Loading, Error, GameOver) */}
                        {gameState === 'loading' && (
                            <div className="flex flex-col items-center justify-center w-full h-full p-6 md:p-10 opacity-60">
                                <Loader2 size={56} className="animate-spin mb-4 text-sky-500 hacker:text-green-500 dark:text-white" />
                                <p className="font-bold text-lg hacker:text-green-500">กำลังโหลดคำสั่ง...</p>
                            </div>
                        )}

                        {gameState === 'error' && (
                            <div className="flex flex-col items-center justify-center w-full h-full p-6 md:p-10 text-rose-500 hacker:text-red-500">
                                <AlertCircle size={72} className="mb-4" />
                                <p className="font-bold text-lg mb-6 text-center">{errorMessage}</p>
                                <button onClick={fetchCommands} className="px-8 py-3 bg-rose-100 text-rose-600 hacker:bg-red-900/30 hacker:text-red-500 rounded-2xl font-bold hover:bg-rose-200 hacker:hover:bg-red-900/50 transition-colors">
                                    ลองใหม่อีกครั้ง
                                </button>
                            </div>
                        )}

                        {gameState === 'gameover' && (
                            <div className="w-full h-full flex flex-col items-center justify-center p-6 md:p-10">
                                <motion.div
                                    initial={{ scale: 0.95, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="text-center w-full max-w-md mx-auto flex flex-col items-center"
                                >
                                    <div className="w-24 h-24 flex items-center justify-center rounded-[2rem] bg-amber-100 dark:bg-amber-500/20 hacker:bg-green-900/30 mb-6">
                                        <Trophy size={56} className="text-amber-500 hacker:text-green-500" />
                                    </div>
                                    <h2 className="text-4xl font-black mb-3 hacker:text-green-400">หมดเวลา!</h2>
                                    <p className="text-lg font-medium mb-8 text-slate-500 dark:text-slate-400 hacker:text-green-600">
                                        เก่งมาก! คุณรอดชีวิตไปได้ <span className="text-sky-500 hacker:text-green-500 font-bold">{survivedTime}</span> วินาที
                                    </p>

                                    <div className="grid grid-cols-2 gap-4 w-full mb-10">
                                        <div className="bg-slate-100 dark:bg-slate-800 hacker:bg-green-900/10 hacker:border hacker:border-green-900/50 p-6 rounded-3xl">
                                            <p className="text-sm font-bold opacity-50 hacker:text-green-600 mb-1">คะแนนรวม</p>
                                            <p className="text-5xl font-black text-sky-500 hacker:text-green-400">{score}</p>
                                        </div>
                                        <div className="bg-slate-100 dark:bg-slate-800 hacker:bg-green-900/10 hacker:border hacker:border-green-900/50 p-6 rounded-3xl">
                                            <p className="text-sm font-bold opacity-50 hacker:text-green-600 mb-1">คอมโบ</p>
                                            <p className="text-5xl font-black text-amber-500 hacker:text-green-500">x{maxCombo}</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={startGame}
                                        className="w-full flex items-center justify-center gap-2 py-5 bg-sky-500 hover:bg-sky-400 dark:bg-sky-600 dark:hover:bg-sky-500 hacker:bg-green-700 hacker:hover:bg-green-600 text-white hacker:text-black rounded-2xl font-black text-xl transition-all border-b-6 border-sky-700 dark:border-sky-800 hacker:border-green-900 active:border-b-0 active:translate-y-[6px]"
                                    >
                                        เล่นอีกครั้ง
                                    </button>
                                </motion.div>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            </main>
        </div>
    );
}