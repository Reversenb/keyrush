"use client";

// =========================================================================
// 💪 TRAINING MODE — สนามซ้อมอิสระ
// หน้าตา/บรรยากาศเดียวกับ Campaign ทุกอย่าง แต่ "ไม่มีโจทย์"
// พิมพ์คำสั่งเล่นได้อิสระ เห็นผลจำลองใน Virtual File System + สถิติ WPM/ACC สดๆ
// ไม่มีการตรวจคำตอบ ไม่ได้/ไม่เสีย EXP และไม่บันทึกประวัติ
// =========================================================================

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { TerminalHandle } from '@/components/TerminalBox';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { PageSkeleton, SkelTerminal, sk } from '@/components/skeleton';
import { ChevronLeft, Terminal as TerminalIcon, Volume2, VolumeX, Dumbbell, RotateCcw, Monitor } from 'lucide-react';

import VirtualFileSystemPanel from '@/components/VirtualFileSystemPanel';
import TerminalControls from '@/components/TerminalControls';
import { apiFetch, clearUserState } from '@/lib/api';
import { simulateCommand } from '@/lib/commandSim';
import type { ActiveEffect } from '@/components/VirtualFileSystemPanel';

const TerminalBox = dynamic(() => import('@/components/TerminalBox'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center text-orange-500 dark:text-yellow-500 hacker:text-green-500 bg-orange-950 dark:bg-black hacker:bg-[#050505]">
      <TerminalIcon className="animate-spin mb-4" size={40} strokeWidth={2} />
      <div className="animate-pulse font-black uppercase tracking-widest text-sm">BOOTING TERMINAL...</div>
    </div>
  )
}) as React.ComponentType<any>;

interface VirtualFile {
  name: string;
  type: 'folder' | 'file';
}

// คำสั่งแนะนำให้ลองพิมพ์เล่น (สลับตาม OS)
const SUGGESTED_COMMANDS: Record<'linux' | 'windows', string[]> = {
  linux: ['ls', 'cd documents', 'mkdir secret', 'touch note.txt', 'cat config.json', 'clear'],
  windows: ['dir', 'cd documents', 'mkdir secret', 'type config.json', 'ipconfig', 'cls'],
};

export default function TrainingPage() {
  const router = useRouter();

  // -- Theme State --
  const { theme: activeTheme, resolvedTheme } = useTheme();
  const currentTheme = activeTheme === 'system' ? resolvedTheme : activeTheme;
  const isDark = currentTheme === 'dark';
  const isHacker = currentTheme === 'hacker' || currentTheme === 'dragon'; const isDragon = currentTheme === 'dragon';

  // -- User & Session States --
  const [isInitializing, setIsInitializing] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [targetOs, setTargetOs] = useState<'linux' | 'windows'>('linux');
  const [isMuted, setIsMuted] = useState(false);

  // -- Virtual File System States --
  const [currentPath, setCurrentPath] = useState("~");
  const [fileSystem, setFileSystem] = useState<VirtualFile[]>([]);
  const [activeEffect, setActiveEffect] = useState<ActiveEffect | null>(null);
  const fsMapRef = useRef<Record<string, VirtualFile[]>>({ '~': [] });
  // hint section ถูกซ่อนในโหมดนี้ แต่ panel ยังต้องการ state คู่นี้อยู่
  const [showHint, setShowHint] = useState(false);

  const terminalRef = useRef<TerminalHandle>(null);

  // -- Performance Metrics (สูตรเดียวกับ Campaign: นับเฉพาะเวลาพิมพ์จริง) --
  const activeTimeMsRef = useRef(0);
  const lastKeyTsRef = useRef<number | null>(null);
  const totalTypingKeysRef = useRef(0);
  const errorsRef = useRef(0);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);

  // -- Terminal Style States --
  const [terminalColor, setTerminalColor] = useState('orange');
  const [terminalSize, setTerminalSize] = useState(15);
  const [terminalBg, setTerminalBg] = useState('#050505');

  // 🌟 ให้ terminal เปลี่ยนชุดสีตามธีมเว็บอัตโนมัติ
  useEffect(() => {
    if (!currentTheme) return;
    if (currentTheme === 'dragon') { setTerminalColor('red'); setTerminalBg('#140303'); }
    else if (currentTheme === 'sakura') { setTerminalColor('pink'); setTerminalBg('#1a0f16'); }
    else if (currentTheme === 'sky') { setTerminalColor('cyan'); setTerminalBg('#081620'); }
    else if (currentTheme === 'mint') { setTerminalColor('green'); setTerminalBg('#04140d'); }
    else if (isHacker) { setTerminalColor('retro'); setTerminalBg('#050505'); }
    else if (isDark) { setTerminalColor('yellow'); setTerminalBg('#1E1B2E'); }
    else { setTerminalColor('orange'); setTerminalBg('#050505'); }
  }, [currentTheme, isDark, isHacker]);

  const terminalUsername = userData?.displayName?.replace(/\s+/g, '_') || userData?.username?.split('@')[0] || 'student';

  // ไฟล์ตั้งต้นชุดเดียวกับ Campaign — มีของให้เล่นกับคำสั่งทันที
  const seedFileSystem = () => {
    const initialFiles: VirtualFile[] = [
      { name: 'documents', type: 'folder' },
      { name: 'config.json', type: 'file' },
      { name: 'server.log', type: 'file' }
    ];
    fsMapRef.current = { '~': initialFiles };
    setFileSystem(initialFiles);
    setCurrentPath("~");
  };

  useEffect(() => {
    const initialize = async () => {
      // ⚠️ หน้า leaderboard เขียน 'combined' ลง key เดียวกันได้ — ต้อง validate ไม่ใช่ cast เฉยๆ
      const saved = localStorage.getItem('keyrush_target_os');
      const os: 'linux' | 'windows' = saved === 'windows' ? 'windows' : 'linux';
      setTargetOs(os);

      try {
        // cookie ถูกแนบไปเอง — ถ้า 401 apiFetch จะพาไปหน้า login ให้
        const res = await apiFetch('/api/user/progress');
        if (res.status === 401) return;
        const data = await res.json();
        if (data.success && data.data) {
          setUserData(data.data);
        } else {
          clearUserState();
          router.push('/login'); return;
        }
      } catch (err) { console.error("Profile sync failed", err); }

      const savedMuted = localStorage.getItem('keyrush_muted');
      if (savedMuted) setIsMuted(savedMuted === 'true');
      seedFileSystem();
      setTimeout(() => setIsInitializing(false), 800);
    };
    initialize();
  }, [router]);

  // 🌟 นับ WPM/Accuracy เฉพาะคีย์ที่เข้า terminal จริง (สูตรเดียวกับ Campaign)
  const handleMetricKey = (type: 'char' | 'backspace') => {
    if (isInitializing) return;

    const now = Date.now();
    if (lastKeyTsRef.current !== null) activeTimeMsRef.current += Math.min(now - lastKeyTsRef.current, 3000);
    lastKeyTsRef.current = now;

    if (type === 'backspace') errorsRef.current += 1; else totalTypingKeysRef.current += 1;

    if (totalTypingKeysRef.current > 0) {
      const timeMinutes = Math.max(1000, activeTimeMsRef.current) / 60000;
      setWpm(Math.max(0, Math.round((totalTypingKeysRef.current / 5) / timeMinutes)));
      setAccuracy(Math.min(100, Math.max(0, Math.round(((totalTypingKeysRef.current - errorsRef.current) / totalTypingKeysRef.current) * 100))));
    }
  };

  const toggleMute = () => { const newState = !isMuted; setIsMuted(newState); localStorage.setItem('keyrush_muted', String(newState)); };
  const playSFX = (type: 'enter' | 'success' | 'error') => { if (isMuted) return; const audio = new Audio(`/sounds/${type}.mp3`); audio.volume = type === 'enter' ? 0.3 : 0.6; audio.play().catch(() => { }); };

  // รีเซ็ตสนามซ้อม: ไฟล์กลับชุดตั้งต้น + สถิติเป็นศูนย์
  const handleResetPractice = () => {
    seedFileSystem();
    activeTimeMsRef.current = 0; lastKeyTsRef.current = null;
    totalTypingKeysRef.current = 0; errorsRef.current = 0;
    setWpm(0); setAccuracy(100);
    terminalRef.current?.reset("~");
  };

  // สลับ OS ที่ใช้จำลองคำสั่ง — รีเซ็ตสนามใหม่ให้สอดคล้อง
  const handleSwitchOs = (os: 'linux' | 'windows') => {
    if (os === targetOs) return;
    setTargetOs(os);
    localStorage.setItem('keyrush_target_os', os);
    handleResetPractice();
  };

  // 💪 หัวใจของโหมดฝึก: จำลองผลคำสั่งอย่างเดียว ไม่มีการตรวจคำตอบ/เซฟ
  const handleCommand = async (rawCommand: string) => {
    if (!rawCommand.trim()) return;
    playSFX('enter');
    if (rawCommand.trim().toLowerCase() === 'reset') { handleResetPractice(); return; }

    const normalizedInput = rawCommand.trim().replace(/\s+/g, ' ');

    const sim = simulateCommand(normalizedInput, {
      os: targetOs,
      username: terminalUsername,
      currentPath,
      fileSystem,
    });

    const newPath = sim.newPath || currentPath;

    if (sim.clearScreen) terminalRef.current?.reset(currentPath);
    if (sim.newPath && sim.newPath !== currentPath) {
      fsMapRef.current[currentPath] = fileSystem;
      setCurrentPath(sim.newPath);
      setFileSystem(fsMapRef.current[sim.newPath] ?? []);
    } else if (sim.newFileSystem) {
      setFileSystem(sim.newFileSystem);
      fsMapRef.current[currentPath] = sim.newFileSystem;
    }
    if (sim.effect) setActiveEffect({ id: Date.now(), effect: sim.effect });

    if (sim.outputLines && sim.outputLines.length > 0) {
      const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));
      for (let i = 0; i < sim.outputLines.length; i++) {
        terminalRef.current?.writeLine(i === 0 ? `\r\n${sim.outputLines[i]}` : sim.outputLines[i]);
        if (i < sim.outputLines.length - 1) await sleep(sim.streamDelayMs || 250);
      }
    } else if (sim.output) {
      terminalRef.current?.writeLine(`\r\n${sim.output}`);
    }

    if (!sim.valid) setTimeout(() => playSFX('error'), 100);

    if (!sim.clearScreen) { terminalRef.current?.writeLine(''); terminalRef.current?.prompt(newPath); }
  };

  // 🌟 Dynamic Colors (ชุดเดียวกับ Campaign) 🌟
  const isLinux = targetOs === 'linux';
  const themeText = isHacker ? 'text-green-500' : isDark ? (isLinux ? 'text-yellow-400' : 'text-blue-400') : (isLinux ? 'text-orange-500' : 'text-blue-500');
  const themeBg = isHacker ? 'bg-green-600' : isDark ? (isLinux ? 'bg-yellow-400' : 'bg-blue-500') : (isLinux ? 'bg-orange-500' : 'bg-blue-500');

  const wpmTextHex = isHacker ? (isDragon ? '#ef4444' : '#22c55e') : isDark ? '#ffffff' : '#431407';
  const highlightHex = isHacker ? (isDragon ? '#f87171' : '#4ade80') : isDark ? (isLinux ? '#facc15' : '#60a5fa') : currentTheme === 'sky' ? '#0ea5e9' : currentTheme === 'mint' ? '#10b981' : (isLinux ? '#f97316' : '#3b82f6');

  if (isInitializing) return (
    <PageSkeleton maxW="max-w-5xl">
      <SkelTerminal />
      {/* ชิปคำสั่งแนะนำ */}
      <div className="flex flex-wrap justify-center gap-2 md:gap-3 mt-5 md:mt-6">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className={`${sk} rounded-2xl h-9 w-20 md:w-28`} style={{ opacity: 1 - i * 0.12 }} />)}
      </div>
    </PageSkeleton>
  );

  const avatarUrl = userData?.avatar?.startsWith('data:') ? userData.avatar : `https://api.dicebear.com/7.x/bottts/svg?seed=${userData?.avatar || 'Felix'}`;

  return (
    <div className={`bg-background text-foreground font-sans min-h-screen flex flex-col relative transition-colors duration-500 ${isHacker ? 'selection:bg-green-500/20' : isDark ? (isLinux ? 'selection:bg-yellow-400/20' : 'selection:bg-blue-500/20') : (isLinux ? 'selection:bg-orange-500/20' : 'selection:bg-blue-500/20')}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@400;500;700;900&display=swap');
        .font-prompt { font-family: 'Prompt', sans-serif; }

        .glass-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(16px); border: 4px solid white; border-radius: 32px; transition: all 0.3s ease; }
        .dark .glass-card { background: rgba(45, 34, 59, 0.7); border-color: #382E54; }
        .hacker .glass-card { background: rgba(10, 10, 10, 0.85); border-color: #166534; box-shadow: 0 10px 30px rgba(34, 197, 94, 0.15); }

        .btn-squishy { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .btn-squishy:hover { transform: scale(1.05) translateY(-2px); }
        .btn-squishy:active { transform: scale(0.95) translateY(0); box-shadow: none !important; }

        .cute-header { text-shadow: 2px 2px 0px rgba(255, 255, 255, 1), -1px -1px 0px rgba(255, 255, 255, 1), 1px -1px 0px rgba(255, 255, 255, 1), -1px 1px 0px rgba(255, 255, 255, 1); letter-spacing: -0.02em; }
        .dark .cute-header { text-shadow: 2px 2px 0px rgba(0, 0, 0, 0.3); }
        .hacker .cute-header { text-shadow: 2px 2px 0px rgba(0, 0, 0, 0.8); }
      `}</style>

      {/* 🎈 Background Blobs 🎈 */}
      <div className={`fixed top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[200px] opacity-20 hacker:opacity-10 pointer-events-none z-0 transition-colors duration-1000 ${isHacker ? 'bg-green-600' : isDark ? (isLinux ? 'bg-yellow-500' : 'bg-blue-600') : (isLinux ? 'bg-orange-400' : 'bg-blue-400')}`}></div>
      <div className={`fixed bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full blur-[200px] opacity-20 hacker:opacity-10 pointer-events-none z-0 transition-colors duration-1000 ${isHacker ? 'bg-green-700' : isDark ? (isLinux ? 'bg-yellow-600' : 'bg-cyan-600') : (isLinux ? 'bg-amber-400' : 'bg-cyan-400')}`}></div>

      {/* Header */}
      <header className="flex items-center justify-between border-b-4 border-white dark:border-[#382E54] hacker:border-[#166534] px-6 py-4 bg-white/80 dark:bg-[#1E1B2E]/80 hacker:bg-[#0a0a0a]/90 backdrop-blur-md relative z-40 shadow-sm transition-colors duration-500">
        <Link href="/map" className="flex items-center gap-3 text-orange-950 dark:text-white hacker:text-green-500 transition-colors cursor-pointer group hover:text-orange-500 dark:hover:text-yellow-400 hacker:hover:text-green-400">
          <ChevronLeft size={24} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform text-orange-400 dark:text-yellow-500 hacker:text-green-600" />
          <div className={`size-10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform bg-white dark:bg-[#2D223B] hacker:bg-[#111] border-2 border-orange-100 dark:border-[#4B3965] hacker:border-[#166534] shadow-sm ${themeText}`}>
            <Dumbbell size={20} strokeWidth={3} />
          </div>
          <h2 className="text-2xl font-black tracking-tight cute-header">KeyRush</h2>
        </Link>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 bg-white dark:bg-[#2D223B] hacker:bg-[#111] px-5 py-2.5 rounded-[20px] border-4 border-white dark:border-[#382E54] hacker:border-[#166534] shadow-sm transition-colors">
            <Dumbbell size={18} strokeWidth={3} className={themeText} />
            <span className="font-black text-xs uppercase tracking-widest text-orange-950 dark:text-white hacker:text-green-400">Training Mode · Free Practice</span>
          </div>
          <button onClick={toggleMute} className={`p-3 rounded-[16px] bg-white dark:bg-[#2D223B] hacker:bg-[#111] hover:bg-orange-50 dark:hover:bg-[#382E54] hacker:hover:bg-[#1a1a1a] border-4 border-white dark:border-[#382E54] hacker:border-[#166534] transition-colors shadow-sm btn-squishy ${isMuted ? 'text-orange-300 dark:text-white/30 hacker:text-green-800' : themeText}`}>
            {isMuted ? <VolumeX size={20} strokeWidth={3} /> : <Volume2 size={20} strokeWidth={3} />}
          </button>
          <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-[20px] size-12 bg-white dark:bg-[#1E1B2E] hacker:bg-[#0a0a0a] border-4 border-white dark:border-[#382E54] hacker:border-[#166534] shadow-sm" style={{ backgroundImage: `url("${avatarUrl}")` }} />
        </div>
      </header>

      <main className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 max-w-[1800px] mx-auto w-full gap-6 relative z-10">

        {/* ========================================= */}
        {/* 💪 TRAINING BANNER (แทนที่กล่องโจทย์ของ Campaign) 💪 */}
        {/* ========================================= */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 glass-card p-6 md:p-8 shadow-sm transition-colors duration-500">

          {/* ฝั่งซ้าย: คำอธิบายโหมด + คำสั่งแนะนำ */}
          <div className="flex-1 w-full xl:w-auto pr-0 xl:pr-6">
            <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-4">
              <span className={`px-4 py-1.5 rounded-[12px] text-xs font-black text-white dark:text-[#1E1B2E] hacker:text-[#0a0a0a] uppercase tracking-widest border-2 border-white dark:border-transparent hacker:border-transparent shadow-sm ${themeBg}`}>
                Free Practice
              </span>
              <h1 className="text-2xl md:text-4xl font-black text-orange-950 dark:text-white hacker:text-white tracking-tight cute-header transition-colors">
                สนามซ้อมอิสระ
              </h1>

              {/* สลับ OS ที่ใช้จำลอง */}
              <div className="flex gap-2 ml-auto">
                <button onClick={() => handleSwitchOs('linux')} className={`btn-squishy flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest border-4 transition-colors ${isLinux ? `${themeBg} text-white dark:text-[#1E1B2E] hacker:text-[#0a0a0a] border-white dark:border-transparent hacker:border-transparent shadow-sm` : 'bg-white dark:bg-[#2D223B] hacker:bg-[#111] border-orange-100 dark:border-[#4B3965] hacker:border-[#166534] text-orange-400 dark:text-white/40 hacker:text-green-700'}`}>
                  <TerminalIcon size={14} strokeWidth={3} /> Linux
                </button>
                <button onClick={() => handleSwitchOs('windows')} className={`btn-squishy flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest border-4 transition-colors ${!isLinux ? `${themeBg} text-white dark:text-[#1E1B2E] hacker:text-[#0a0a0a] border-white dark:border-transparent hacker:border-transparent shadow-sm` : 'bg-white dark:bg-[#2D223B] hacker:bg-[#111] border-orange-100 dark:border-[#4B3965] hacker:border-[#166534] text-orange-400 dark:text-white/40 hacker:text-green-700'}`}>
                  <Monitor size={14} strokeWidth={3} /> Windows
                </button>
              </div>
            </div>

            <p className="text-sm md:text-base font-bold font-prompt text-orange-800 dark:text-white/70 hacker:text-green-500 mb-3 transition-colors">
              ไม่มีโจทย์ ไม่มีเวลาจับ พิมพ์คำสั่งอะไรก็ได้แล้วดูผลจำลองที่แผงด้านขวาได้เลย ✨ ลองพิมพ์:
            </p>
            <div className="flex flex-wrap gap-2">
              {(SUGGESTED_COMMANDS[targetOs] ?? SUGGESTED_COMMANDS.linux).map((cmd) => (
                <code key={cmd} className="px-3 py-1.5 rounded-xl text-xs font-black font-mono border-2 shadow-sm transition-colors bg-white border-orange-100 text-orange-500 dark:bg-[#2D223B] dark:border-[#4B3965] dark:text-yellow-400 hacker:bg-[#111] hacker:border-green-900 hacker:text-green-500">
                  {cmd}
                </code>
              ))}
            </div>
          </div>

          {/* ฝั่งขวา: กล่อง WPM/ACC + ปุ่มรีเซ็ต */}
          <div className="flex gap-4 w-full xl:w-auto shrink-0 mt-4 xl:mt-0 items-center">
            <div className="flex w-full xl:w-auto items-center justify-around xl:justify-center gap-8 bg-white dark:bg-[#1E1B2E] hacker:bg-[#0a0a0a] px-8 py-4 rounded-[24px] border-4 border-white dark:border-[#382E54] hacker:border-[#166534] shadow-sm transition-colors">
              <div className="flex flex-col items-center xl:border-r-4 border-orange-100 dark:border-[#382E54] hacker:border-[#166534] xl:pr-8 transition-colors">
                <span className={`text-[10px] uppercase tracking-widest font-black ${isHacker ? 'text-green-600' : isDark ? 'text-white/50' : 'text-orange-400'}`}>WPM</span>
                <motion.span key={wpm} initial={{ scale: 1.2, color: highlightHex }} animate={{ scale: 1, color: wpmTextHex }} className={`text-3xl font-black w-14 text-center cute-header ${isHacker ? 'text-green-500' : isDark ? 'text-white' : 'text-orange-950'}`}>{wpm}</motion.span>
              </div>
              <div className="flex flex-col items-center">
                <span className={`text-[10px] uppercase tracking-widest font-black ${isHacker ? 'text-green-600' : isDark ? 'text-white/50' : 'text-orange-400'}`}>ACC</span>
                <motion.span key={accuracy} initial={{ scale: 1.2 }} animate={{ scale: 1 }} className={`text-3xl font-black w-16 text-center cute-header ${accuracy < 80 ? (isHacker ? 'text-rose-600' : 'text-rose-500') : accuracy < 95 ? (isHacker ? 'text-yellow-600' : 'text-amber-500') : themeText}`}>{accuracy}%</motion.span>
              </div>
            </div>
            <button onClick={handleResetPractice} title="รีเซ็ตสนามซ้อม (หรือพิมพ์ reset)" className={`btn-squishy p-4 rounded-[20px] border-4 shadow-sm transition-colors bg-white dark:bg-[#1E1B2E] hacker:bg-[#0a0a0a] border-white dark:border-[#382E54] hacker:border-[#166534] ${themeText} hover:bg-orange-50 dark:hover:bg-[#2D223B] hacker:hover:bg-[#111]`}>
              <RotateCcw size={24} strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* Terminal + Virtual File System (ชุดเดียวกับ Campaign) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
          <div className="lg:col-span-7 flex flex-col rounded-[32px] overflow-hidden border-4 border-white dark:border-[#382E54] hacker:border-[#166534] shadow-sm bg-white dark:bg-[#1E1B2E] hacker:bg-[#0a0a0a] relative transition-colors">

            <TerminalControls
              terminalUsername={terminalUsername}
              targetOs={targetOs}
              terminalSize={terminalSize}
              setTerminalSize={setTerminalSize}
              terminalColor={terminalColor}
              setTerminalColor={setTerminalColor}
              terminalBg={terminalBg}
              setTerminalBg={setTerminalBg}
            />

            <div className="flex-1 relative overflow-hidden p-2 transition-colors duration-300" style={{ backgroundColor: terminalBg }}>
              <TerminalBox ref={terminalRef} initialPath={currentPath} onCommand={handleCommand} onMetricKey={handleMetricKey} isMuted={isMuted} themeName={terminalColor} fontSize={terminalSize} bgColor={terminalBg} />
            </div>
          </div>

          <VirtualFileSystemPanel
            targetOs={targetOs}
            themeText={themeText}
            themeBg={themeBg}
            terminalUsername={terminalUsername}
            currentPath={currentPath}
            fileSystem={fileSystem}
            showHint={showHint}
            setShowHint={setShowHint}
            missionData={null}
            activeEffect={activeEffect}
            hideHintSection
          />
        </div>
      </main>
    </div>
  );
}
