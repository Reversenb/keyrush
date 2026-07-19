"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, Zap, Clock, Trophy, Loader2, Play, AlertCircle, XCircle, Keyboard, Monitor, TerminalSquare, Brain, Sparkles } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { apiFetch, clearUserState } from '@/lib/api';
import CoinIcon from '@/components/CoinIcon';

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
    const [activeCommands, setActiveCommands] = useState<CommandMission[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [input, setInput] = useState('');

    // ✨ นับข้อฝั่ง client (ไว้โชว์เฉยๆ — ของจริง server นับเองใน rolling token)
    const [clearedCount, setClearedCount] = useState(0);

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
    const [score, setScore] = useState(0); // เอาไว้โชว์ EXP เป็นตัวเลขหลอกตาเฉยๆ ของจริง Backend คิดเอง
    const [combo, setCombo] = useState(0);
    const [maxCombo, setMaxCombo] = useState(0);

    // 📏 วัด WPM/Accuracy จริงจากทุก keystroke (ใช้ ref เพื่อไม่ trigger render ทุกปุ่มที่กด)
    const keystrokesRef = useRef({ typed: 0, correct: 0 });
    const [finalWpm, setFinalWpm] = useState(0);
    const [finalAccuracy, setFinalAccuracy] = useState(0);
    // 🪙 เหรียญที่ได้รอบนี้ (server แจ้งกลับตอน submit)
    const [finalCoins, setFinalCoins] = useState<number | null>(null);

    // 🎫 Rolling token: server นับข้อที่ถูกเองทุกคำตอบ — เก็บใบล่าสุดไว้ใน ref
    // และต่อคิวรายงานคำตอบให้ยิงเรียงลำดับ (token ใบใหม่ต้องมาจากใบก่อนหน้าเสมอ)
    const playTokenRef = useRef<string>('');
    const answerChainRef = useRef<Promise<void>>(Promise.resolve());

    // 📨 รายงานคำตอบให้ server ตรวจ/นับแต้ม แล้วเก็บตั๋วใบใหม่ (fire-and-forget แบบเข้าคิว)
    const reportAnswer = (answer: string) => {
        if (!answer) return;
        answerChainRef.current = answerChainRef.current.then(async () => {
            if (!playTokenRef.current) return;
            try {
                const res = await apiFetch('/api/survival/answer', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: playTokenRef.current, answer })
                });
                const data = await res.json();
                if (data.success && data.token) {
                    playTokenRef.current = data.token;
                } else if (!data.success) {
                    console.error('❌ Server ปฏิเสธคำตอบ:', data.message);
                }
            } catch (error) {
                console.error('❌ ส่งคำตอบให้ server ไม่สำเร็จ:', error);
            }
        });
    };

    const inputRef = useRef<HTMLInputElement>(null);

    // 🛡️ ตรวจสอบการ Login ผ่าน cookie (ยิง endpoint ที่ต้อง auth — cookie แนบไปเองผ่าน proxy)
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await apiFetch('/api/user/stats', {}, { redirectOn401: false });
                if (res.status === 401 || res.status === 403) {
                    clearUserState();
                    router.push('/login');
                    return;
                }
                setIsAuthChecking(false);
                setGameState('idle');
            } catch {
                clearUserState();
                router.push('/login');
            }
        };
        checkAuth();
    }, [router]);

    // 🚀 API: ดึงโจทย์และรับตั๋วตอนกด "ลุยเลย!"
    const startGame = async () => {
        setGameState('loading');
        try {
            // ส่ง OS ไปขอโจทย์และตั๋วจาก Backend (ผ่าน proxy same-origin — cookie auth แนบไปเอง)
            const res = await apiFetch(`/api/survival/start?os=${selectedOS}`);
            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.message || 'ไม่สามารถเชื่อมต่อฐานข้อมูลโจทย์ได้');
            }

            if (data.data?.length > 0) {
                // ⚠️ ใช้ลำดับโจทย์ตามที่ server ส่งมาเป๊ะๆ (server สลับด้วย seed แล้ว
                // และตรวจคำตอบตามลำดับเดียวกัน — client ห้ามสลับเอง)
                setActiveCommands(data.data);

                // 🎟️ เก็บ rolling token — จะถูกแลกใบใหม่ทุกครั้งที่ส่งคำตอบ
                playTokenRef.current = data.token;
                answerChainRef.current = Promise.resolve();

                // ตั้งค่าเริ่มเกม
                setGameState('playing');
                setPhase('memorize');
                setTimeLeft(DURATION);
                setMaxTime(DURATION);
                setSurvivedTime(0);
                setScore(0);
                setClearedCount(0); // เริ่มต้นที่ 0 ข้อ
                setCombo(0);
                setMaxCombo(0);
                setInput('');
                setFlash(null);
                setCurrentIndex(0);
                keystrokesRef.current = { typed: 0, correct: 0 };
                setFinalWpm(0);
                setFinalAccuracy(0);
                setFinalCoins(null);
            } else {
                throw new Error('ไม่พบข้อมูลคำสั่งในระบบ');
            }
        } catch (error: any) {
            setErrorMessage(error.message || 'ระบบขัดข้อง กรุณาลองใหม่อีกครั้ง');
            setGameState('error');
        }
    };

    // ⚖️ API: ส่งคะแนนให้ Backend ตรวจเมื่อหมดเวลา
    const submitScore = async (finalMaxCombo: number, wpm: number, accuracy: number) => {
        try {
            // ⏳ รอให้คำตอบที่ค้างคิวรายงานเสร็จก่อน — ตั๋วใบสุดท้ายถึงจะมีแต้มครบ
            await answerChainRef.current;

            if (!playTokenRef.current) {
                console.error("❌ ไม่พบตั๋วเกม ระบบยกเลิกการส่งคะแนน");
                return;
            }

            // ยิงผ่าน proxy same-origin — apiFetch แนบ cookie + X-CSRF-Token ให้อัตโนมัติ
            // จำนวนข้อที่ถูกไม่ต้องส่ง เพราะ server นับเองไว้ในตั๋วแล้ว
            const res = await apiFetch('/api/survival/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: playTokenRef.current,
                    maxCombo: finalMaxCombo,
                    wpm,
                    accuracy
                })
            });

            const data = await res.json();

            // 🌟 เพิ่มการแจ้งเตือนตรงนี้ เพื่อให้เรารู้ว่า Backend ตอบอะไรกลับมา!
            if (data.success) {
                console.log("✅ บันทึกคะแนนสำเร็จ! ได้รับ EXP:", data.earnedExp);
                // 🔄 อัปเดตจอสรุปผลด้วยค่าที่ server บันทึกจริง — จะได้ตรงกับหน้า History เป๊ะ
                if (typeof data.wpm === 'number') setFinalWpm(data.wpm);
                if (typeof data.accuracy === 'number') setFinalAccuracy(data.accuracy);
                if (typeof data.earnedExp === 'number') setScore(data.earnedExp);
                if (typeof data.earnedCoins === 'number') setFinalCoins(data.earnedCoins);
            } else {
                console.error("❌ Backend ปฏิเสธการบันทึก:", data.message);
                alert("บันทึกคะแนนไม่สำเร็จ: " + data.message);
            }

        } catch (error) {
            console.error('❌ Failed to submit:', error);
            alert("ระบบขัดข้อง ไม่สามารถส่งคะแนนได้");
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
            // 📏 คำนวณ WPM/Accuracy จริงจาก keystroke ที่นับไว้ระหว่างเล่น
            const { typed, correct } = keystrokesRef.current;
            const minutes = Math.max(1, survivedTime) / 60;
            const wpm = Math.min(400, Math.round((correct / 5) / minutes));
            const accuracy = typed > 0 ? Math.round((correct / typed) * 100) : 0;
            setFinalWpm(wpm);
            setFinalAccuracy(accuracy);
            // ส่งสถิติที่วัดจริงไปปิดเกม (จำนวนข้อที่ถูก server นับเองในตั๋วแล้ว)
            submitScore(maxCombo, wpm, accuracy);
        }
        return () => clearInterval(timer);
    }, [gameState, phase, timeLeft, clearedCount, maxCombo, survivedTime]);

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

    // 🛑 ยกเลิกและรีเซ็ตระบบ
    const handleCancel = () => {
        setGameState('idle');
        setPhase('memorize');
        setTimeLeft(DURATION);
        setScore(0);
        setCombo(0);
        setMaxCombo(0);
        setInput('');
        playTokenRef.current = ''; // ล้างตั๋วทิ้ง
        answerChainRef.current = Promise.resolve();
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

            // 📨 รายงานคำตอบให้ server นับแต้ม (ทั้งถูกและผิด — server ใช้คุม accuracy ด้วย)
            reportAnswer(input.trim());

            if (input.trim() === expected) {
                setFlash('success');
                // 🌟 โชว์คะแนน EXP หน้าบ้าน (ข้อละ 5)
                setScore((prev) => prev + 5);
                // 🌟 บันทึกว่าพิมพ์ถูกเพิ่ม 1 ข้อ (ส่งให้ Backend คิดตังค์จริง)
                setClearedCount((prev) => prev + 1);

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
                        <Keyboard size={14} /> เลือกสีแป้นพิมพ์เรืองแสง
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

    // 🛡️ Loading Screen (Auth Check)
    if (isAuthChecking) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-screen flex flex-col items-center justify-center bg-background"
            >
                <Loader2 size={48} className="animate-spin text-orange-500 dark:text-yellow-400 hacker:text-green-500 mb-4" />
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
        <div className="h-screen flex flex-col overflow-hidden transition-colors duration-300 bg-background text-foreground relative">
            {/* 🎈 Background Blobs ให้เข้ากับธีมหน้าอื่นๆ */}
            <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-400 dark:bg-yellow-500 hacker:bg-green-600 rounded-full blur-[100px] opacity-20 dark:opacity-10 hacker:opacity-10 pointer-events-none z-0 transition-colors" />
            <div className="fixed bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-amber-400 dark:bg-yellow-600 hacker:bg-green-700 rounded-full blur-[100px] opacity-20 dark:opacity-10 hacker:opacity-10 pointer-events-none z-0 transition-colors" />
            <Navbar />

            <main className="flex-1 min-h-0 flex flex-col items-center justify-center p-3 md:p-6 lg:p-8 relative z-10 w-full">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="w-full max-w-5xl flex flex-col gap-4 h-full"
                >

                    {/* 📊 Game HUD */}
                    <header className="shrink-0 bg-white/90 dark:bg-[#1E1B2E]/85 hacker:bg-[#0a0a0a]/90 backdrop-blur-md p-3 md:p-5 rounded-[1.5rem] md:rounded-[2rem] border-4 border-white dark:border-[#382E54] hacker:border-green-800 shadow-sm flex flex-col gap-3 md:gap-4 transition-colors">
                        <div className="flex justify-between items-center gap-2 px-0 md:px-2">
                            <div className="flex items-center gap-2 md:gap-5 min-w-0">
                                {/* 🛑 ปุ่มยกเลิกด้านบน */}
                                {gameState === 'playing' && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleCancel(); }}
                                        className="flex items-center justify-center w-10 h-10 md:w-14 md:h-14 shrink-0 rounded-xl md:rounded-2xl bg-rose-100 text-rose-500 hover:bg-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:hover:bg-rose-500/40 hacker:bg-red-900/20 hacker:text-red-500 font-bold transition-all border-b-4 border-rose-200 hover:border-rose-300 dark:border-rose-500/30 hacker:border-red-900/50 active:border-b-0 active:translate-y-[4px]"
                                        title="ออกจากเกม"
                                    >
                                        <XCircle className="w-5 h-5 md:w-7 md:h-7" />
                                    </button>
                                )}

                                {/* Timer */}
                                <div className={`flex items-center justify-center w-10 h-10 md:w-14 md:h-14 shrink-0 rounded-xl md:rounded-2xl ${isDanger ? 'bg-rose-100 text-rose-500 dark:bg-rose-500/20 hacker:bg-red-900/30 hacker:text-red-500' : 'bg-orange-100 text-orange-500 dark:bg-yellow-400/15 dark:text-yellow-400 hacker:bg-green-900/20 hacker:text-green-500'}`}>
                                    <Clock className={`w-5 h-5 md:w-7 md:h-7 ${isDanger ? 'animate-pulse' : ''}`} />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[10px] md:text-sm font-bold opacity-50 hacker:text-green-600 whitespace-nowrap">เวลาเอาชีวิตรอด</span>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-2xl md:text-4xl font-black tracking-tight ${isDanger ? 'text-rose-500 hacker:text-red-500' : ''}`}>
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

                            <div className="flex items-center gap-3 md:gap-10 shrink-0">
                                <div className="text-right">
                                    <p className="text-[10px] md:text-sm font-bold opacity-50 hacker:text-green-600">EXP</p>
                                    <motion.p key={score} initial={{ scale: 1.1, color: 'var(--color-primary)' }} animate={{ scale: 1, color: 'inherit' }} className="text-xl md:text-3xl font-black tracking-tight hacker:text-green-400">
                                        {score}
                                    </motion.p>
                                </div>
                                <div className={`text-right ${combo >= 5 ? 'text-amber-500 hacker:text-yellow-400' : 'text-orange-500 dark:text-yellow-400 hacker:text-green-600'}`}>
                                    <p className="text-[10px] md:text-sm font-bold opacity-50 hacker:text-green-600">คอมโบ</p>
                                    <motion.p key={combo} initial={{ scale: 1.2 }} animate={{ scale: 1 }} className="text-xl md:text-3xl font-black tracking-tight flex items-center justify-end gap-1">
                                        x{combo} <Zap className={`w-4 h-4 md:w-6 md:h-6 ${combo >= 5 ? "animate-bounce" : ""}`} />
                                    </motion.p>
                                </div>
                            </div>
                        </div>

                        <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 hacker:bg-green-900/30 rounded-full overflow-hidden">
                            <motion.div
                                className={`h-full rounded-full ${isDanger ? 'bg-rose-500 hacker:bg-red-500' : 'bg-orange-400 dark:bg-yellow-400 hacker:bg-green-500'}`}
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
                            ${flash === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 hacker:bg-green-900/30 border-4 border-emerald-300 dark:border-emerald-500/40 hacker:border-green-400'
                                : flash === 'error' ? 'bg-rose-50 dark:bg-rose-900/20 hacker:bg-red-900/20 border-4 border-rose-300 dark:border-rose-500/40 hacker:border-red-500'
                                    : 'bg-white dark:bg-[#1E1B2E] hacker:bg-[#0a0a0a] border-4 border-white dark:border-[#382E54] hacker:border-green-800 shadow-sm'}
                        `}
                    >

                        {/* 🌟 Idle Screen: เลือก OS */}
                        {gameState === 'idle' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.4, delay: 0.2 }}
                                className="w-full h-full overflow-y-auto p-4 md:p-10"
                            >
                                <div className="text-center w-full max-w-2xl mx-auto min-h-full flex flex-col items-center justify-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 md:w-24 md:h-24 rounded-[1.5rem] md:rounded-[2rem] border-4 border-white dark:border-[#382E54] hacker:border-green-800 bg-orange-100 text-orange-500 dark:bg-yellow-400/10 dark:text-yellow-400 hacker:bg-green-900/20 hacker:text-green-500 mb-4 md:mb-6 shadow-sm transition-colors">
                                    <Gamepad2 className="w-9 h-9 md:w-11 md:h-11" />
                                </div>
                                <h1 className="text-2xl sm:text-3xl md:text-5xl font-black mb-2 md:mb-3 tracking-tighter uppercase text-orange-950 dark:text-white hacker:text-white transition-colors">
                                    โหมดเอาชีวิตรอด <span className="text-orange-500 dark:text-yellow-400 hacker:text-green-500">60s</span>
                                </h1>
                                <p className="text-sm md:text-lg mb-4 md:mb-6 font-bold text-orange-400 dark:text-white/50 hacker:text-green-600 transition-colors">
                                    เลือกฐานข้อมูลเอกสารของระบบปฏิบัติการที่ต้องการทดสอบก่อนเริ่มลุย!
                                </p>

                                {/* 🏷️ กติกาแบบย่อ */}
                                <div className="flex flex-wrap justify-center gap-2 mb-6 md:mb-8">
                                    {[
                                        { icon: <Clock size={14} strokeWidth={3} />, label: 'เริ่มที่ 60 วินาที' },
                                        { icon: <Zap size={14} strokeWidth={3} />, label: 'ตอบถูก +2 วิ / ผิด -3 วิ' },
                                        { icon: <Trophy size={14} strokeWidth={3} />, label: 'ตอบถูกรับ 5 EXP ต่อข้อ' },
                                    ].map((chip, i) => (
                                        <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-2xl text-[10px] md:text-xs font-black border-2 bg-white border-orange-100 text-orange-500 dark:bg-[#2D223B] dark:border-[#4B3965] dark:text-yellow-400 hacker:bg-[#111] hacker:border-green-900 hacker:text-green-500 shadow-sm transition-colors">
                                            {chip.icon} {chip.label}
                                        </span>
                                    ))}
                                </div>

                                {/* 🌟 3D Squishy Buttons */}
                                <div className="grid grid-cols-2 gap-3 md:gap-6 w-full mb-6 md:mb-8">
                                    <button
                                        onClick={() => setSelectedOS('linux')}
                                        className={`flex flex-col items-center justify-center gap-2 md:gap-3 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] font-black text-base md:text-xl uppercase tracking-wider transition-all outline-none border-4
                                            ${selectedOS === 'linux'
                                                ? 'bg-orange-500 border-white text-white shadow-[0_8px_0_#c2410c] -translate-y-2 dark:bg-yellow-400 dark:border-yellow-200 dark:text-[#1E1B2E] dark:shadow-[0_8px_0_#ca8a04] hacker:bg-green-500 hacker:border-green-300 hacker:text-[#0a0a0a] hacker:shadow-[0_8px_0_#14532d]'
                                                : 'bg-white border-orange-100 text-orange-300 shadow-[0_8px_0_#fed7aa] hover:-translate-y-1 hover:text-orange-400 dark:bg-[#2D223B] dark:border-[#4B3965] dark:text-white/40 dark:shadow-[0_8px_0_#1E1B2E] dark:hover:text-yellow-400 hacker:bg-[#0a0a0a] hacker:border-green-900 hacker:text-green-800 hacker:shadow-[0_8px_0_#052e16] hacker:hover:text-green-500'
                                            } active:translate-y-[4px] active:shadow-none
                                        `}
                                    >
                                        <TerminalSquare className="w-8 h-8 md:w-10 md:h-10" />
                                        LINUX
                                    </button>

                                    <button
                                        onClick={() => setSelectedOS('windows')}
                                        className={`flex flex-col items-center justify-center gap-2 md:gap-3 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] font-black text-base md:text-xl uppercase tracking-wider transition-all outline-none border-4
                                            ${selectedOS === 'windows'
                                                ? 'bg-blue-500 border-white text-white shadow-[0_8px_0_#1d4ed8] -translate-y-2 dark:bg-blue-400 dark:border-blue-200 dark:text-[#1E1B2E] dark:shadow-[0_8px_0_#2563eb] hacker:bg-green-500 hacker:border-green-300 hacker:text-[#0a0a0a] hacker:shadow-[0_8px_0_#14532d]'
                                                : 'bg-white border-orange-100 text-orange-300 shadow-[0_8px_0_#fed7aa] hover:-translate-y-1 hover:text-blue-400 dark:bg-[#2D223B] dark:border-[#4B3965] dark:text-white/40 dark:shadow-[0_8px_0_#1E1B2E] dark:hover:text-blue-300 hacker:bg-[#0a0a0a] hacker:border-green-900 hacker:text-green-800 hacker:shadow-[0_8px_0_#052e16] hacker:hover:text-green-500'
                                            } active:translate-y-[4px] active:shadow-none
                                        `}
                                    >
                                        <Monitor className="w-8 h-8 md:w-10 md:h-10" />
                                        WINDOWS
                                    </button>
                                </div>

                                <button
                                    onClick={startGame}
                                    className="w-full flex items-center justify-center gap-2 py-4 md:py-5 rounded-2xl font-black text-xl md:text-2xl uppercase tracking-widest transition-all border-4 border-white dark:border-yellow-300 hacker:border-green-400 bg-orange-500 hover:bg-orange-400 text-white shadow-[0_8px_0_#c2410c] dark:bg-yellow-400 dark:hover:bg-yellow-300 dark:text-[#1E1B2E] dark:shadow-[0_8px_0_#ca8a04] hacker:bg-green-500 hacker:hover:bg-green-400 hacker:text-[#0a0a0a] hacker:shadow-[0_8px_0_#14532d] active:translate-y-[6px] active:shadow-none"
                                >
                                    <Play size={24} fill="currentColor" /> ลุยเลย!
                                </button>
                                </div>
                            </motion.div>
                        )}

                        {/* 🧠 เฟสบังคับอ่านโจทย์ (2 วินาที) */}
                        {gameState === 'playing' && phase === 'memorize' && activeCommands.length > 0 && (
                            <div className="w-full h-full flex flex-col items-center justify-center p-4 md:p-10 overflow-y-auto">
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 1.1, opacity: 0 }}
                                    className="flex flex-col items-center justify-center text-center w-full my-auto"
                                >
                                    <div className="inline-flex items-center justify-center w-14 h-14 md:w-20 md:h-20 rounded-full bg-amber-100 dark:bg-amber-500/20 hacker:bg-green-900/30 text-amber-500 hacker:text-green-500 mb-4 md:mb-6">
                                        <Brain className="w-7 h-7 md:w-10 md:h-10 animate-pulse" />
                                    </div>
                                    <p className="text-base md:text-xl font-bold text-amber-500 dark:text-amber-400 hacker:text-green-500 mb-3 md:mb-4 tracking-wide">เตรียมจำคำสั่งให้ดี!</p>
                                    <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-slate-800 dark:text-white hacker:text-green-400 leading-snug px-2 md:px-4 break-words max-w-4xl">
                                        "{activeCommands[currentIndex].description}"
                                    </h2>

                                    <div className="w-48 md:w-64 h-2 bg-slate-200 dark:bg-slate-800 hacker:bg-green-900/30 rounded-full mt-6 md:mt-10 overflow-hidden">
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
                                <div className="absolute top-3 right-3 md:top-4 md:right-6 z-20">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowKeyboard(!showKeyboard); }}
                                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold transition-all border-b-4 active:border-b-0 active:translate-y-[4px] text-sm
                                            ${showKeyboard
                                                ? 'bg-orange-100 text-orange-600 border-orange-200 dark:bg-yellow-400/15 dark:text-yellow-400 dark:border-yellow-500/30 hacker:bg-green-900/30 hacker:text-green-400 hacker:border-green-900/50'
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
                                        // 📏 นับเฉพาะตัวอักษรที่เพิ่มขึ้น (backspace ไม่นับเป็น keystroke)
                                        if (val.length > input.length) {
                                            for (let i = input.length; i < val.length; i++) {
                                                keystrokesRef.current.typed += 1;
                                                if (val[i] === expected[i]) keystrokesRef.current.correct += 1;
                                            }
                                        }
                                        setInput(val);
                                    }}
                                    onKeyDown={handleInputCheck}
                                    className="absolute opacity-0 pointer-events-none -z-10"
                                    autoComplete="off" spellCheck="false"
                                />

                                <div className="flex-1 overflow-y-auto flex flex-col items-center justify-start pt-5 md:pt-12 px-3 md:px-10 pb-4 md:pb-6 w-full">
                                    <div className="w-full max-w-4xl text-center md:text-left flex flex-col items-center md:items-start shrink-0">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 md:px-4 md:py-1.5 bg-orange-100 dark:bg-yellow-400/15 hacker:bg-green-900/30 text-orange-600 dark:text-yellow-300 hacker:text-green-400 rounded-xl text-xs md:text-sm font-bold mb-3 md:mb-4 mt-8 md:mt-0">
                                            <Sparkles size={16} /> ภารกิจ ({selectedOS.toUpperCase()})
                                        </div>
                                        <p className="text-base md:text-xl lg:text-2xl font-medium text-slate-600 dark:text-slate-300 hacker:text-green-500 mb-4 md:mb-8 w-full leading-relaxed break-words">
                                            {activeCommands[currentIndex].description}
                                        </p>
                                    </div>

                                    <div className="font-mono text-xl sm:text-2xl md:text-5xl lg:text-6xl flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-4 bg-slate-100 dark:bg-slate-950 hacker:bg-black p-4 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border-2 border-slate-200 dark:border-white/5 hacker:border-green-900/60 overflow-hidden shadow-inner w-full max-w-4xl shrink-0">
                                        <span className="text-orange-400 dark:text-yellow-500 hacker:text-green-600 font-bold opacity-50 shrink-0">$&gt;</span>

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
                                                            <span className="absolute left-0 -bottom-1 w-full h-[6px] bg-orange-400 dark:bg-yellow-400 hacker:bg-green-500 animate-pulse rounded-full" />
                                                        )}
                                                    </span>
                                                );
                                            })}

                                            {input.length >= (activeCommands[currentIndex]?.expectedCommand?.length || 0) && (
                                                <span className="relative inline-block w-6 md:w-8 ml-1">
                                                    <span className="absolute left-0 -bottom-1 w-full h-[6px] bg-orange-400 dark:bg-yellow-400 hacker:bg-green-500 animate-pulse rounded-full" />
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                </div>

                                {renderVirtualKeyboard()}

                            </div>
                        )}

                        {/* Screens อื่นๆ (Loading, Error, GameOver) */}
                        {gameState === 'loading' && (
                            <div className="flex flex-col items-center justify-center w-full h-full p-6 md:p-10 opacity-60">
                                <Loader2 size={56} className="animate-spin mb-4 text-orange-500 dark:text-yellow-400 hacker:text-green-500" />
                                <p className="font-bold text-lg hacker:text-green-500">กำลังโหลดคำสั่ง...</p>
                            </div>
                        )}

                        {gameState === 'error' && (
                            <div className="flex flex-col items-center justify-center w-full h-full p-6 md:p-10 text-rose-500 hacker:text-red-500">
                                <AlertCircle size={72} className="mb-4" />
                                <p className="font-bold text-lg mb-6 text-center">{errorMessage}</p>
                                <button onClick={startGame} className="px-8 py-3 bg-rose-100 text-rose-600 hacker:bg-red-900/30 hacker:text-red-500 rounded-2xl font-bold hover:bg-rose-200 hacker:hover:bg-red-900/50 transition-colors">
                                    ลองใหม่อีกครั้ง
                                </button>
                            </div>
                        )}

                        {gameState === 'gameover' && (
                            <div className="w-full h-full overflow-y-auto p-4 md:p-10 flex flex-col">
                                <motion.div
                                    initial={{ scale: 0.95, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="text-center w-full max-w-md mx-auto flex flex-col items-center my-auto"
                                >
                                    <div className="w-16 h-16 md:w-24 md:h-24 flex items-center justify-center rounded-[1.5rem] md:rounded-[2rem] bg-amber-100 dark:bg-amber-500/20 hacker:bg-green-900/30 mb-4 md:mb-6">
                                        <Trophy className="w-9 h-9 md:w-14 md:h-14 text-amber-500 hacker:text-green-500" />
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-black mb-2 md:mb-3 hacker:text-green-400">หมดเวลา!</h2>
                                    <p className="text-base md:text-lg font-medium mb-6 md:mb-8 text-slate-500 dark:text-slate-400 hacker:text-green-600">
                                        เก่งมาก! คุณรอดชีวิตไปได้ <span className="text-orange-500 dark:text-yellow-400 hacker:text-green-500 font-bold">{survivedTime}</span> วินาที
                                    </p>

                                    {/* 🪙 แจ้งเหรียญที่ได้รอบนี้ */}
                                    {finalCoins !== null && finalCoins > 0 && (
                                        <div className="mb-4 md:mb-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border-2 font-black text-sm md:text-base shadow-sm bg-amber-100 border-white text-amber-600 dark:bg-yellow-400/15 dark:border-yellow-500/30 dark:text-yellow-300 hacker:bg-green-900/30 hacker:border-green-800 hacker:text-green-400">
                                            <CoinIcon size={18} /> ได้รับ +{finalCoins.toLocaleString()} เหรียญ
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-3 md:gap-4 w-full mb-6 md:mb-10">
                                        <div className="bg-slate-100 dark:bg-slate-800 hacker:bg-green-900/10 hacker:border hacker:border-green-900/50 p-4 md:p-6 rounded-2xl md:rounded-3xl">
                                            <p className="text-xs md:text-sm font-bold opacity-50 hacker:text-green-600 mb-1">EXP ที่ได้รับ</p>
                                            <p className="text-3xl md:text-5xl font-black text-orange-500 dark:text-yellow-400 hacker:text-green-400">{score}</p>
                                        </div>
                                        <div className="bg-slate-100 dark:bg-slate-800 hacker:bg-green-900/10 hacker:border hacker:border-green-900/50 p-4 md:p-6 rounded-2xl md:rounded-3xl">
                                            <p className="text-xs md:text-sm font-bold opacity-50 hacker:text-green-600 mb-1">คอมโบสูงสุด</p>
                                            <p className="text-3xl md:text-5xl font-black text-amber-500 hacker:text-green-500">x{maxCombo}</p>
                                        </div>
                                        <div className="bg-slate-100 dark:bg-slate-800 hacker:bg-green-900/10 hacker:border hacker:border-green-900/50 p-4 md:p-6 rounded-2xl md:rounded-3xl">
                                            <p className="text-xs md:text-sm font-bold opacity-50 hacker:text-green-600 mb-1">ความเร็วพิมพ์</p>
                                            <p className="text-3xl md:text-5xl font-black text-orange-500 dark:text-yellow-400 hacker:text-green-400">{finalWpm}<span className="text-sm md:text-base font-black opacity-50 ml-1">WPM</span></p>
                                        </div>
                                        <div className="bg-slate-100 dark:bg-slate-800 hacker:bg-green-900/10 hacker:border hacker:border-green-900/50 p-4 md:p-6 rounded-2xl md:rounded-3xl">
                                            <p className="text-xs md:text-sm font-bold opacity-50 hacker:text-green-600 mb-1">ความแม่นยำ</p>
                                            <p className="text-3xl md:text-5xl font-black text-emerald-500 dark:text-emerald-400 hacker:text-green-400">{finalAccuracy}<span className="text-sm md:text-base font-black opacity-50 ml-1">%</span></p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={startGame}
                                        className="w-full flex items-center justify-center gap-2 py-5 bg-orange-500 hover:bg-orange-400 dark:bg-yellow-400 dark:hover:bg-yellow-300 hacker:bg-green-500 hacker:hover:bg-green-400 text-white dark:text-[#1E1B2E] hacker:text-black rounded-2xl font-black text-xl uppercase tracking-widest transition-all border-4 border-white dark:border-yellow-300 hacker:border-green-400 shadow-[0_8px_0_#c2410c] dark:shadow-[0_8px_0_#ca8a04] hacker:shadow-[0_8px_0_#14532d] active:translate-y-[6px] active:shadow-none"
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