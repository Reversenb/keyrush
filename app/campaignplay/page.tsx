"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { TerminalHandle } from '@/components/TerminalBox';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import HackerLoadingScreen from '@/components/HackerLoadingScreen';
import { ChevronLeft, Terminal as TerminalIcon, Star, Volume2, VolumeX, LayoutDashboard, Map, LogOut, BookOpen, ArrowRight, ShieldCheck } from 'lucide-react';

// 🌟 Import Components 
import VirtualFileSystemPanel from '@/components/VirtualFileSystemPanel';
import MissionClearedModal from '@/components/MissionClearedModal';
import TerminalControls from '@/components/TerminalControls';
import { apiFetch, clearUserState, logout } from '@/lib/api';

// =========================================================================
const TerminalBox = dynamic(() => import('@/components/TerminalBox'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center text-orange-500 dark:text-yellow-500 hacker:text-green-500 bg-orange-950 dark:bg-black hacker:bg-[#050505]">
      <TerminalIcon className="animate-spin mb-4" size={40} strokeWidth={2} />
      <div className="animate-pulse font-black uppercase tracking-widest text-sm">BOOTING TERMINAL...</div>
    </div>
  )
}) as React.ComponentType<any>;

interface Mission {
  id: string;
  level: number;
  title: string;
  description: string;
  expectedCommand?: string; // ✅ ปรับเป็น Optional เพราะระบบใหม่ Backend จะไม่ส่งเฉลยมาให้แล้ว
  hint?: string;
  rewardExp?: number;
}

interface VirtualFile {
  name: string;
  type: 'folder' | 'file';
}

export default function GamePage() {
  const router = useRouter();

  // -- Theme State --
  const { theme: activeTheme, resolvedTheme } = useTheme();
  const currentTheme = activeTheme === 'system' ? resolvedTheme : activeTheme;
  const isDark = currentTheme === 'dark';
  const isHacker = currentTheme === 'hacker';

  // -- User & Session States --
  const [isInitializing, setIsInitializing] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [maxLevel, setMaxLevel] = useState(1);
  const [targetOs, setTargetOs] = useState<'linux' | 'windows'>('linux');
  const [missionData, setMissionData] = useState<Mission | null>(null);

  // -- Game Logic States --
  const [isPassed, setIsPassed] = useState(false);
  const [showProceedButton, setShowProceedButton] = useState(false);
  const [showNextLevel, setShowNextLevel] = useState(false);
  const [isAllCleared, setIsAllCleared] = useState(false);
  const [showHint, setShowHint] = useState(false);
  // เฉลยที่ backend เปิดให้หลัง verify ผ่านเท่านั้น (โจทย์ไม่ส่ง expectedCommand มาแล้ว)
  const [revealedCommand, setRevealedCommand] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isErrorAnim, setIsErrorAnim] = useState(false);

  // -- Virtual File System States --
  const [currentPath, setCurrentPath] = useState("~");
  const [fileSystem, setFileSystem] = useState<VirtualFile[]>([]);

  const terminalRef = useRef<TerminalHandle>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // -- Performance Metrics --
  const startTimeRef = useRef<number | null>(null);
  const totalTypingKeysRef = useRef(0);
  const errorsRef = useRef(0);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);

  // -- Terminal Style States --
  const [terminalColor, setTerminalColor] = useState('orange');
  const [terminalSize, setTerminalSize] = useState(15);
  const [terminalBg, setTerminalBg] = useState('#050505');

  const terminalUsername = userData?.displayName?.replace(/\s+/g, '_') || userData?.username?.split('@')[0] || 'student';
  const currentExp = targetOs === 'windows' ? (userData?.windowsExp || 0) : (userData?.linuxExp || 0);
  const isReplaying = currentLevel < maxLevel;
  const missionReward = missionData?.rewardExp || 100;

  useEffect(() => {
    const initializeGame = async () => {
      const os = (localStorage.getItem('keyrush_target_os') as 'linux' | 'windows') || 'linux';
      setTargetOs(os);

      try {
        // cookie ถูกแนบไปเอง — ถ้า 401 apiFetch จะพาไปหน้า login ให้
        const res = await apiFetch('/api/user/progress');
        if (res.status === 401) return;
        const data = await res.json();
        if (data.success && data.data) {
          setUserData(data.data);
          const activeLevel = os === 'windows' ? data.data.windowsLevel : data.data.linuxLevel;
          setMaxLevel(activeLevel || 1);

          const urlParams = new URLSearchParams(window.location.search);
          const requestedLevel = parseInt(urlParams.get('level') || '0', 10);
          setCurrentLevel(requestedLevel > 0 && requestedLevel <= (activeLevel || 1) ? requestedLevel : activeLevel || 1);
        } else {
          clearUserState();
          router.push('/login'); return;
        }
      } catch (err) { console.error("Cloud Save Sync failed", err); }

      const savedMuted = localStorage.getItem('keyrush_muted');
      if (savedMuted) setIsMuted(savedMuted === 'true');
      setTimeout(() => setIsInitializing(false), 800);
    };
    initializeGame();
  }, [router]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isInitializing) return;
    const fetchMission = async () => {
      setMissionData(null);
      try {
        const response = await apiFetch(`/api/mission/${targetOs}/${currentLevel}`);
        if (!response.ok && response.status === 404) { setIsAllCleared(true); return; }
        const result = await response.json();
        if (result.success && result.data) {
          setMissionData(result.data); setIsAllCleared(false); setCurrentPath("~");

          // ✅ จุดแก้หลักที่ 1: ระบบจำลองไฟล์ (Virtual File System)
          // เสกไฟล์พื้นฐานเตรียมไว้ครอบคลุมทุกคำสั่ง ไม่ต้องดึงข้อมูลจากเฉลย (ป้องกันบั๊กหน้าบ้านพัง)
          let initialFiles: VirtualFile[] = [
            { name: 'project_src', type: 'folder' },
            { name: 'config.json', type: 'file' },
            { name: 'readme.md', type: 'file' },
            { name: 'app.ts', type: 'file' },
            { name: 'target_file.txt', type: 'file' },
            { name: 'old_file.txt', type: 'file' },
            { name: 'server.log', type: 'file' }
          ];
          setFileSystem(initialFiles);
        } else { setIsAllCleared(true); }
      } catch (error) { console.error("Error fetching mission:", error); }
    };
    fetchMission();
  }, [currentLevel, targetOs, isInitializing]);

  useEffect(() => {
    if (isInitializing || isPassed || showNextLevel || isAllCleared) return;
    const handleKey = (e: KeyboardEvent) => {
      const ignoredKeys = ['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab', 'Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'];
      if (e.ctrlKey || e.altKey || e.metaKey || ignoredKeys.includes(e.key)) return;
      if (!startTimeRef.current && e.key !== 'Backspace') startTimeRef.current = Date.now();
      if (e.key === 'Backspace') errorsRef.current += 1; else totalTypingKeysRef.current += 1;

      if (startTimeRef.current) {
        const timeMs = Math.max(1000, Date.now() - startTimeRef.current);
        const timeMinutes = timeMs / 60000;
        setWpm(Math.max(0, Math.round((totalTypingKeysRef.current / 5) / timeMinutes)));
        if (totalTypingKeysRef.current > 0) setAccuracy(Math.min(100, Math.max(0, Math.round(((totalTypingKeysRef.current - errorsRef.current) / totalTypingKeysRef.current) * 100))));
      }
    };
    window.addEventListener('keydown', handleKey, { capture: true });
    return () => window.removeEventListener('keydown', handleKey, { capture: true });
  }, [isInitializing, isPassed, showNextLevel, isAllCleared]);

  const toggleMute = () => { const newState = !isMuted; setIsMuted(newState); localStorage.setItem('keyrush_muted', String(newState)); };
  const playSFX = (type: 'enter' | 'success' | 'error') => { if (isMuted) return; const audio = new Audio(`/sounds/${type}.mp3`); audio.volume = type === 'enter' ? 0.3 : 0.6; audio.play().catch(() => { }); };

  // ✅ จุดแก้หลักที่ 2: เปลี่ยนเป็น async function เพื่อเตรียมยิง API 
  const handleCommand = async (rawCommand: string) => {
    if (!missionData || !rawCommand.trim() || isPassed) return;
    playSFX('enter');
    if (rawCommand.trim().toLowerCase() === 'reset') { handleResetGame(); return; }

    const normalizedInput = rawCommand.trim().replace(/\s+/g, ' ');
    const cmdParts = normalizedInput.split(' '); const action = cmdParts[0].toLowerCase();
    const targets = cmdParts.slice(1).filter(t => !t.startsWith('-') && !t.includes('>'));
    let newPath = currentPath; let isValidSystemCommand = true; let terminalOutput = '';

    // การตอบสนองหลอกๆ ฝั่งหน้าจอ Terminal
    switch (action) {
      case 'clear': case 'cls': terminalRef.current?.reset(currentPath); break;
      case 'pwd': terminalOutput = currentPath === '~' ? `/home/${terminalUsername}` : `/home/${terminalUsername}/${currentPath.replace('~/', '')}`; break;
      case 'ls': case 'dir': case 'll':
        if (fileSystem.length === 0) terminalOutput = '(empty directory)';
        else {
          const isDetailed = cmdParts.includes('-la') || cmdParts.includes('-l') || action === 'll' || cmdParts.includes('-al');
          terminalOutput = isDetailed ? fileSystem.map(f => {
            const perms = f.type === 'folder' ? 'drwxr-xr-x' : '-rw-r--r--';
            const size = f.type === 'folder' ? '4096' : Math.floor(Math.random() * 50000 + 100).toString();
            const date = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
            return `${perms} 1 ${terminalUsername} staff ${size.padStart(5)} ${date} ${f.type === 'folder' ? `\x1b[1;34m${f.name}\x1b[0m` : f.name}`;
          }).join('\r\n') : fileSystem.map(f => f.type === 'folder' ? `\x1b[1;34m${f.name}\x1b[0m` : f.name).join('  ');
        } break;
      case 'cd':
        const cdTarget = targets[0];
        if (!cdTarget || cdTarget === '~') newPath = '~';
        else if (cdTarget === '..') newPath = currentPath === '~' ? '~' : currentPath.split('/').slice(0, -1).join('/') || '~';
        else if (cdTarget === '/') newPath = '/';
        else newPath = currentPath === '~' ? `~/${cdTarget}` : currentPath.endsWith('/') ? `${currentPath}${cdTarget}` : `${currentPath}/${cdTarget}`;
        setCurrentPath(newPath);
        if (cdTarget && cdTarget !== '..' && cdTarget !== '~' && cdTarget !== '.') setFileSystem([{ name: 'hidden_core.sys', type: 'file' }, { name: 'logs', type: 'folder' }]);
        else if (cdTarget === '..') setFileSystem([{ name: 'previous_folder', type: 'folder' }, { name: 'sys.log', type: 'file' }]);
        else if (cdTarget === '~') setFileSystem([{ name: 'documents', type: 'folder' }]);
        break;
      case 'mkdir': case 'md':
        if (targets.length > 0) setFileSystem(prev => [...prev, ...targets.filter(t => !prev.some(p => p.name === t)).map(t => ({ name: t, type: 'folder' as const }))]);
        else { terminalOutput = `\x1b[31m${action}: missing operand\x1b[0m`; isValidSystemCommand = false; } break;
      case 'touch':
        if (targets.length > 0) setFileSystem(prev => [...prev, ...targets.filter(t => !prev.some(p => p.name === t)).map(t => ({ name: t, type: 'file' as const }))]);
        else { terminalOutput = `\x1b[31mtouch: missing file operand\x1b[0m`; isValidSystemCommand = false; } break;
      case 'rm': case 'del': case 'rd': case 'rmdir':
        if (targets.length > 0) setFileSystem(prev => prev.filter(f => !targets.includes(f.name)));
        else { terminalOutput = `\x1b[31m${action}: missing operand\x1b[0m`; isValidSystemCommand = false; } break;
      case 'cat': case 'type':
        if (targets[0] && fileSystem.some(f => f.name === targets[0])) terminalOutput = `[Content of ${targets[0]}]\r\n{"status": "success"}`;
        else { terminalOutput = `\x1b[31m${action}: missing operand\x1b[0m`; isValidSystemCommand = false; } break;
      case 'whoami': terminalOutput = terminalUsername; break;
      default: terminalOutput = `\x1b[31m${targetOs === 'linux' ? 'bash' : 'cmd'}: ${action}: command not found\x1b[0m`; isValidSystemCommand = false; break;
    }

    if (action !== 'clear' && action !== 'cls' && terminalOutput) terminalRef.current?.writeLine(`\r\n${terminalOutput}`);

    // =======================================================
    // ✅ จุดแก้หลักที่ 3: ระบบเซฟกันโกง (Server-side Validation)
    // ส่งข้อมูลที่ผู้เล่นพิมพ์ไปให้ Backend ตรวจแทนการเช็คที่หน้าบ้าน
    // =======================================================
    try {
      // POST ต้องแนบ X-CSRF-Token — apiFetch จัดการให้
      const verifyRes = await apiFetch('/api/mission/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          os: targetOs,
          level: currentLevel,
          userCommand: normalizedInput
        })
      });
      const verifyData = await verifyRes.json();

      // 403/401 = ปัญหา session/CSRF ไม่ใช่ตอบผิด — ต้องบอกผู้เล่นตรงๆ ไม่ใช่เงียบ
      if (verifyRes.status === 403 || verifyRes.status === 401) {
        terminalRef.current?.writeLine(`\r\n\x1b[31m[SYSTEM] ตรวจคำตอบไม่สำเร็จ (${verifyRes.status}): ${verifyData?.message || 'เซสชันมีปัญหา'} — ลองรีเฟรชหรือเข้าสู่ระบบใหม่\x1b[0m`);
      // ถ้า Backend ยืนยันว่า "คำสั่งถูกต้อง"
      } else if (verifyData.success && verifyData.isCorrect) {
        setIsPassed(true); setTimeout(() => playSFX('success'), 300);
        setRevealedCommand(verifyData.correctAnswer || normalizedInput);

        apiFetch('/api/user/progress', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ os: targetOs, level: currentLevel, wpm: wpm, accuracy: accuracy })
        })
          .then(res => res.json())
          .then(result => {
            if (result.success && result.data) {
              setUserData(result.data);
              const newActiveLevel = targetOs === 'windows' ? result.data.windowsLevel : result.data.linuxLevel;
              setMaxLevel(newActiveLevel);
            }
          });
        terminalRef.current?.writeLine(`\r\n\x1b[1;32m=== [ SYSTEM ACCESS GRANTED: MISSION ACCOMPLISHED ] ===\x1b[0m`);
        setTimeout(() => setShowProceedButton(true), 1200);
      } else {
        // ถ้า Backend บอกว่า "ผิด"
        if (normalizedInput.length > 0) errorsRef.current += Math.max(1, Math.floor(normalizedInput.length / 2));
        if (!isValidSystemCommand) setTimeout(() => playSFX('error'), 100);
        setIsErrorAnim(true); setTimeout(() => setIsErrorAnim(false), 400);
      }
    } catch (err) {
      console.error("Verification error:", err);
    }

    // เคลียร์บรรทัดใหม่
    if (action !== 'clear' && action !== 'cls') { terminalRef.current?.writeLine(''); terminalRef.current?.prompt(newPath); }
  };

  const resetMetrics = () => { setIsPassed(false); setShowProceedButton(false); setShowNextLevel(false); setShowHint(false); setRevealedCommand(null); startTimeRef.current = null; totalTypingKeysRef.current = 0; errorsRef.current = 0; setWpm(0); setAccuracy(100); window.history.replaceState(null, '', '/campaignplay'); };
  const handleNextLevel = () => { setCurrentLevel(prev => prev + 1); resetMetrics(); terminalRef.current?.reset("~"); setCurrentPath("~"); };
  const handleReplayLevel = () => { resetMetrics(); terminalRef.current?.reset(currentPath); };
  const handleResetGame = () => { setCurrentLevel(1); setCurrentPath("~"); setFileSystem([]); setIsAllCleared(false); resetMetrics(); terminalRef.current?.reset("~"); };

  const getMissionGrade = (acc: number) => {
    const isLnx = targetOs === 'linux';
    const border = isHacker ? 'border-4 border-green-800 bg-[#111] shadow-sm' : isDark ? (isLnx ? 'border-4 border-yellow-400/30 bg-[#2D223B] shadow-sm' : 'border-4 border-blue-400/30 bg-[#1E293B] shadow-sm') : (isLnx ? 'border-4 border-white bg-orange-100 shadow-sm' : 'border-4 border-white bg-blue-100 shadow-sm');

    if (acc >= 98) return { rank: 'S', color: isHacker ? 'text-green-400' : isDark ? (isLnx ? 'text-yellow-400' : 'text-blue-400') : (isLnx ? 'text-orange-500' : 'text-blue-500'), border, stars: 5, label: 'Perfect' };
    if (acc >= 90) return { rank: 'A', color: isHacker ? 'text-green-500' : 'text-green-500', border: isHacker ? 'border-4 border-green-800 bg-green-900/20 shadow-sm' : isDark ? 'border-4 border-green-400/30 bg-green-400/10 shadow-sm' : 'border-4 border-white bg-green-100 shadow-sm', stars: 4, label: 'Great' };
    if (acc >= 75) return { rank: 'B', color: isHacker ? 'text-green-600' : 'text-amber-500', border: isHacker ? 'border-4 border-green-900 bg-[#111] shadow-sm' : isDark ? 'border-4 border-amber-400/30 bg-amber-400/10 shadow-sm' : 'border-4 border-white bg-amber-100 shadow-sm', stars: 3, label: 'Good' };
    if (acc >= 50) return { rank: 'C', color: isHacker ? 'text-yellow-600' : 'text-orange-400', border: isHacker ? 'border-4 border-yellow-900/50 bg-[#111] shadow-sm' : isDark ? 'border-4 border-orange-400/30 bg-orange-400/10 shadow-sm' : 'border-4 border-white bg-orange-50 shadow-sm', stars: 2, label: 'Pass' };
    return { rank: 'D', color: isHacker ? 'text-rose-600' : 'text-rose-500', border: isHacker ? 'border-4 border-rose-900/50 bg-[#111] shadow-sm' : isDark ? 'border-4 border-rose-400/30 bg-rose-400/10 shadow-sm' : 'border-4 border-white bg-rose-100 shadow-sm', stars: 1, label: 'Poor' };
  };

  const handleLogout = async () => { setIsDropdownOpen(false); handleResetGame(); await logout(); router.push('/login'); };

  // 🌟 Dynamic Colors 🌟
  const isLinux = targetOs === 'linux';
  const themeText = isHacker ? 'text-green-500' : isDark ? (isLinux ? 'text-yellow-400' : 'text-blue-400') : (isLinux ? 'text-orange-500' : 'text-blue-500');
  const themeBg = isHacker ? 'bg-green-600' : isDark ? (isLinux ? 'bg-yellow-400' : 'bg-blue-500') : (isLinux ? 'bg-orange-500' : 'bg-blue-500');
  const themeBorder = isHacker ? 'border-green-600' : isDark ? (isLinux ? 'border-yellow-400' : 'border-blue-400') : (isLinux ? 'border-orange-500' : 'border-blue-500');

  const wpmTextHex = isHacker ? '#22c55e' : isDark ? '#ffffff' : '#431407';
  const highlightHex = isHacker ? '#4ade80' : isDark ? (isLinux ? '#facc15' : '#60a5fa') : (isLinux ? '#f97316' : '#3b82f6');

  if (isInitializing) return <HackerLoadingScreen />;

  // 🌟 หน้าจอถ้าเคลียร์ทุกด่านแล้ว (หรือถ้า Database ไม่มีข้อมูลด่านนั้นๆ)
  if (isAllCleared) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden font-sans transition-colors duration-500">
        <div className={`absolute w-[600px] h-[600px] rounded-full blur-[150px] pointer-events-none transition-colors duration-500 ${isHacker ? 'bg-green-600/20' : isDark ? (isLinux ? 'bg-yellow-500/20' : 'bg-blue-500/20') : (isLinux ? 'bg-orange-400/40' : 'bg-blue-400/40')}`}></div>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="z-10 text-center flex flex-col items-center">
          <ShieldCheck className={`mb-6 drop-shadow-sm transition-colors duration-500 ${themeText}`} size={120} strokeWidth={2.5} />
          <h1 className={`text-5xl font-black mb-4 tracking-tighter cute-header transition-colors duration-500 ${isHacker ? 'text-green-500' : isDark ? 'text-white' : 'text-orange-950'}`}>ALL SYSTEMS CLEARED</h1>
          <p className={`font-bold mb-8 max-w-lg transition-colors duration-500 ${isHacker ? 'text-green-400' : isDark ? 'text-white/70' : 'text-orange-600'}`}>คุณเคลียร์ภารกิจทั้งหมดในสาย {targetOs.toUpperCase()} แล้ว! หรือยังไม่มีการสร้างด่านใหม่ในระบบ</p>
          <Link href="/campaignpage" className={`px-10 py-5 font-black uppercase tracking-widest rounded-[24px] transition-all border-4 btn-squishy shadow-sm ${isHacker ? 'bg-[#0a0a0a] text-green-500 border-green-500 hover:bg-green-900/30' : isDark ? `${themeBg} text-[#1E1B2E] border-transparent hover:opacity-90` : `${themeBg} text-white border-white hover:opacity-90`}`}>Return to Campaign</Link>
        </motion.div>
      </div>
    );
  }

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
      <div className={`fixed top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[200px] opacity-20 hacker:opacity-10 pointer-events-none z-0 transition-colors duration-1000 ${isHacker ? 'bg-green-600' : isDark ? (isLinux ? 'bg-yellow-500' : 'bg-blue-600') : (isLinux ? 'bg-orange-400' : 'bg-blue-400')}`}></div>
      <div className={`fixed bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full blur-[200px] opacity-20 hacker:opacity-10 pointer-events-none z-0 transition-colors duration-1000 ${isHacker ? 'bg-green-700' : isDark ? (isLinux ? 'bg-yellow-600' : 'bg-cyan-600') : (isLinux ? 'bg-amber-400' : 'bg-cyan-400')}`} style={{ animationDelay: '1.5s' }}></div>

      <header className="flex items-center justify-between border-b-4 border-white dark:border-[#382E54] hacker:border-[#166534] px-6 py-4 bg-white/80 dark:bg-[#1E1B2E]/80 hacker:bg-[#0a0a0a]/90 backdrop-blur-md relative z-40 shadow-sm transition-colors duration-500">
        <Link href="/campaignpage" className="flex items-center gap-3 text-orange-950 dark:text-white hacker:text-green-500 transition-colors cursor-pointer group hover:text-orange-500 dark:hover:text-yellow-400 hacker:hover:text-green-400">
          <ChevronLeft size={24} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform text-orange-400 dark:text-yellow-500 hacker:text-green-600" />
          <div className={`size-10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform bg-white dark:bg-[#2D223B] hacker:bg-[#111] border-2 border-orange-100 dark:border-[#4B3965] hacker:border-[#166534] shadow-sm ${themeText}`}>
            <TerminalIcon size={20} strokeWidth={3} />
          </div>
          <h2 className="text-2xl font-black tracking-tight cute-header">KeyRush</h2>
        </Link>

        <div className="flex items-center gap-5">
          <div className="hidden md:flex items-center gap-3 bg-white dark:bg-[#2D223B] hacker:bg-[#111] px-5 py-2.5 rounded-[20px] border-4 border-white dark:border-[#382E54] hacker:border-[#166534] shadow-sm transition-colors">
            <Star size={20} strokeWidth={3} className="text-amber-400 dark:text-yellow-400 hacker:text-green-500 fill-amber-400 dark:fill-yellow-400 hacker:fill-green-900" />
            <span className="font-black text-sm text-orange-950 dark:text-white hacker:text-green-400">{currentExp.toLocaleString()} EXP</span>
          </div>
          <button onClick={toggleMute} className={`p-3 rounded-[16px] bg-white dark:bg-[#2D223B] hacker:bg-[#111] hover:bg-orange-50 dark:hover:bg-[#382E54] hacker:hover:bg-[#1a1a1a] border-4 border-white dark:border-[#382E54] hacker:border-[#166534] transition-colors shadow-sm btn-squishy ${isMuted ? 'text-orange-300 dark:text-white/30 hacker:text-green-800' : themeText}`}>
            {isMuted ? <VolumeX size={20} strokeWidth={3} /> : <Volume2 size={20} strokeWidth={3} />}
          </button>

          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="bg-center bg-no-repeat aspect-square bg-cover rounded-[20px] size-12 bg-white dark:bg-[#1E1B2E] hacker:bg-[#0a0a0a] border-4 border-white dark:border-[#382E54] hacker:border-[#166534] cursor-pointer hover:scale-105 transition-transform shadow-sm btn-squishy" style={{ backgroundImage: `url("${avatarUrl}")` }} />
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -10 }} className="absolute right-0 mt-4 w-64 bg-white/95 dark:bg-[#1E1B2E]/95 hacker:bg-[#0a0a0a]/95 backdrop-blur-2xl border-4 border-white dark:border-[#382E54] hacker:border-[#166534] rounded-[32px] shadow-xl overflow-hidden z-50 origin-top-right p-2 transition-colors">
                  <div className="px-5 py-4 border-b-4 border-white dark:border-[#382E54] hacker:border-[#166534] bg-orange-50/80 dark:bg-[#2D223B]/80 hacker:bg-[#111]/80 rounded-[24px] mb-2 transition-colors">
                    <p className="text-orange-950 dark:text-white hacker:text-green-500 font-black tracking-tight truncate text-base cute-header">{userData?.displayName || userData?.username?.split('@')[0]}</p>
                    <p className="text-[11px] text-orange-950/50 dark:text-white/50 hacker:text-green-700 font-bold truncate mt-0.5">{userData?.username}</p>
                  </div>
                  <div className="p-1 flex flex-col gap-1">
                    <Link href="/dashboard" className="w-full text-left px-5 py-3.5 text-sm font-black text-orange-950/70 dark:text-white/70 hacker:text-green-600/70 hover:bg-orange-50 dark:hover:bg-[#382E54] hacker:hover:bg-[#111] hover:text-orange-600 dark:hover:text-yellow-400 hacker:hover:text-green-400 rounded-[20px] transition-colors flex items-center gap-3 group"><LayoutDashboard size={18} strokeWidth={3} className="group-hover:scale-110 transition-transform" /> Dashboard</Link>
                    <Link href="/campaignpage" className="w-full text-left px-5 py-3.5 text-sm font-black text-orange-950/70 dark:text-white/70 hacker:text-green-600/70 hover:bg-orange-50 dark:hover:bg-[#382E54] hacker:hover:bg-[#111] hover:text-orange-600 dark:hover:text-yellow-400 hacker:hover:text-green-400 rounded-[20px] transition-colors flex items-center gap-3 group"><Map size={18} strokeWidth={3} className="group-hover:scale-110 transition-transform" /> Campaign Map</Link>
                    <div className="h-1 bg-orange-100/50 dark:bg-white/5 hacker:bg-[#166534]/30 my-1 rounded-full w-full transition-colors"></div>
                    <button onClick={handleLogout} className="w-full text-left px-5 py-3.5 text-sm font-black text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-[#382E54] hacker:hover:bg-[#111] rounded-[20px] transition-colors flex items-center gap-3 group"><LogOut size={18} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" /> Sign Out</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 max-w-[1800px] mx-auto w-full gap-6 relative z-10">

        {/* ========================================= */}
        {/* 🌟 MISSION BANNER (ส่วนที่ปรับโจทย์ให้เด่น) 🌟 */}
        {/* ========================================= */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 glass-card p-6 md:p-8 shadow-sm transition-colors duration-500">

          {/* ฝั่งซ้าย: กล่องแสดงโจทย์ภารกิจ */}
          <div className="flex-1 w-full xl:w-auto pr-0 xl:pr-6">
            <div className="flex items-center gap-4 mb-4">
              <span className={`px-4 py-1.5 rounded-[12px] text-xs font-black text-white dark:text-[#1E1B2E] hacker:text-[#0a0a0a] uppercase tracking-widest border-2 border-white dark:border-transparent hacker:border-transparent shadow-sm ${themeBg}`}>
                Level {missionData?.level || currentLevel}
              </span>
              <h1 className="text-3xl md:text-4xl font-black text-orange-950 dark:text-white hacker:text-white tracking-tight cute-header transition-colors">
                {missionData?.title || "Initializing Objective..."}
              </h1>
            </div>

            <div className={`relative flex items-start gap-3 bg-white dark:bg-[#1E1B2E] hacker:bg-[#0a0a0a] px-5 py-4 rounded-[20px] border-4 ${themeBorder} shadow-sm group inline-flex w-full md:w-auto transition-colors`}>
              <div className={`absolute top-0 left-0 w-2 h-full ${themeBg} animate-pulse rounded-l-[14px]`}></div>
              <span className={`font-black text-xl md:text-xl ml-2 mt-0.5 font-prompt whitespace-nowrap ${themeText}`}>
                โจทย์ :
              </span>
              <p className="text-orange-950 dark:text-white/90 hacker:text-green-400 font-bold text-lg md:text-xl leading-relaxed tracking-wide font-prompt drop-shadow-sm transition-colors">
                {missionData?.description || "Awaiting data..."}
              </p>
            </div>
          </div>

          {/* ฝั่งขวา: กล่องแสดง WPM และ ACC */}
          <div className="flex gap-4 w-full xl:w-auto shrink-0 mt-4 xl:mt-0">
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
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
          <motion.div animate={isErrorAnim ? { x: [-10, 10, -10, 10, 0] } : {}} transition={{ duration: 0.4 }} className={`lg:col-span-7 flex flex-col rounded-[32px] overflow-hidden border-4 border-white dark:border-[#382E54] hacker:border-[#166534] shadow-sm bg-white dark:bg-[#1E1B2E] hacker:bg-[#0a0a0a] relative transition-colors ${isPassed ? `ring-4 ring-inset ${isHacker ? 'ring-green-500' : isDark ? (isLinux ? 'ring-yellow-400' : 'ring-blue-400') : (isLinux ? 'ring-orange-500' : 'ring-blue-500')} shadow-md` : ''}`}>

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
              <TerminalBox ref={terminalRef} initialPath={currentPath} onCommand={handleCommand} isMuted={isMuted} themeName={terminalColor} fontSize={terminalSize} bgColor={terminalBg} />
              <AnimatePresence>
                {isPassed && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`absolute inset-0 z-20 mix-blend-overlay pointer-events-none ${isHacker ? 'bg-green-500/20' : isDark ? (isLinux ? 'bg-yellow-400/20' : 'bg-blue-400/20') : (isLinux ? 'bg-orange-500/20' : 'bg-blue-500/20')}`} />}
              </AnimatePresence>
              {isPassed && <div className="absolute inset-0 z-30 cursor-not-allowed"></div>}
              <AnimatePresence>
                {showProceedButton && (
                  <motion.div initial={{ opacity: 0, y: 30, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40">
                    <button onClick={() => { setShowProceedButton(false); setShowNextLevel(true); }} className={`px-8 py-4 rounded-[24px] font-black uppercase tracking-widest text-white dark:text-[#1E1B2E] hacker:text-[#0a0a0a] shadow-xl transition-all btn-squishy flex items-center gap-3 border-4 border-white dark:border-transparent hacker:border-transparent ${themeBg} ${isHacker ? 'hover:bg-green-500' : isDark ? (isLinux ? 'hover:bg-yellow-300' : 'hover:bg-blue-400') : (isLinux ? 'hover:bg-orange-400' : 'hover:bg-blue-400')}`}>
                      <BookOpen size={20} strokeWidth={3} /> NEXT STAGE <ArrowRight size={20} strokeWidth={3} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          <VirtualFileSystemPanel
            targetOs={targetOs}
            themeText={themeText}
            themeBg={themeBg}
            terminalUsername={terminalUsername}
            currentPath={currentPath}
            fileSystem={fileSystem}
            showHint={showHint}
            setShowHint={setShowHint}
            missionData={missionData}
          />
        </div>
      </main>

      {showNextLevel && (
        <MissionClearedModal
          targetOs={targetOs}
          grade={getMissionGrade(accuracy)}
          accuracy={accuracy}
          missionData={missionData}
          revealedCommand={revealedCommand}
          themeText={themeText}
          currentExp={currentExp}
          isReplaying={isReplaying}
          missionReward={missionReward}
          wpm={wpm}
          handleNextLevel={handleNextLevel}
          handleReplayLevel={handleReplayLevel}
        />
      )}

    </div>
  );
}