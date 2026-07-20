"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { TerminalHandle } from '@/components/TerminalBox';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { PageSkeleton, sk, skCard } from '@/components/skeleton';
import { ChevronLeft, Terminal as TerminalIcon, Star, Volume2, VolumeX, LayoutDashboard, Map, LogOut, BookOpen, ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react';

// 🌟 Import Components 
import VirtualFileSystemPanel from '@/components/VirtualFileSystemPanel';
import MissionClearedModal from '@/components/MissionClearedModal';
import TerminalControls from '@/components/TerminalControls';
import { apiFetch, clearUserState, logout } from '@/lib/api';
import { simulateCommand } from '@/lib/commandSim';
import type { ActiveEffect } from '@/components/VirtualFileSystemPanel';

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
  const isDark = currentTheme === 'dark' || currentTheme === 'amethyst'; const isAmethyst = currentTheme === 'amethyst';
  const isHacker = currentTheme === 'hacker' || currentTheme === 'dragon'; const isDragon = currentTheme === 'dragon';

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

  // -- ระบบ "ดูเฉลย" (มีบทลงโทษ EXP เหลือ 20% ถาวร ต้อง confirm ก่อนยิง /reveal) --
  const [solution, setSolution] = useState<string | null>(null);
  const [showRevealConfirm, setShowRevealConfirm] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  // EXP ที่ได้จริงรอบนี้จาก PUT /progress (โดนหักถ้าด่านนี้เคยดูเฉลย)
  const [earnedExp, setEarnedExp] = useState<number | null>(null);
  // 🪙 เหรียญที่ได้รอบนี้ (server แจ้งกลับตอนเซฟ)
  const [earnedCoins, setEarnedCoins] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isErrorAnim, setIsErrorAnim] = useState(false);

  // -- Virtual File System States --
  const [currentPath, setCurrentPath] = useState("~");
  const [fileSystem, setFileSystem] = useState<VirtualFile[]>([]);
  // เอฟเฟกต์ให้ panel ขวาเล่นตามคำสั่งล่าสุด (id ใหม่ทุกครั้งเพื่อ retrigger)
  const [activeEffect, setActiveEffect] = useState<ActiveEffect | null>(null);
  // จำรายการไฟล์ของแต่ละ path — cd ไปมาแล้วของไม่หาย/ไม่ถูกสลับเป็นไฟล์ปลอม
  const fsMapRef = useRef<Record<string, VirtualFile[]>>({ '~': [] });

  // -- Server-authoritative anti-cheat tokens --
  // sessionToken: ได้ตอนโหลดโจทย์ ต้องแนบตอน verify | clearanceToken: ได้ตอน verify ผ่าน ต้องแนบตอนเซฟ
  const sessionTokenRef = useRef<string | null>(null);
  const clearanceTokenRef = useRef<string | null>(null);
  // เพิ่มค่าเพื่อบังคับโหลดโจทย์ใหม่ (กรณีเซสชันด่านหมดอายุ)
  const [missionReload, setMissionReload] = useState(0);

  const terminalRef = useRef<TerminalHandle>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // -- Performance Metrics --
  // ใช้ "เวลาพิมพ์จริง" สะสมจากช่องว่างระหว่างคีย์ (cap 3 วิ) — เปลี่ยนแท็บ/หยุดคิดไม่ทำ WPM พัง
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

  // 🌟 ให้ terminal เปลี่ยนชุดสีตามธีมเว็บอัตโนมัติ (ผู้เล่นยังปรับเองต่อได้ผ่านแผงสี)
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
  const currentExp = targetOs === 'windows' ? (userData?.windowsExp || 0) : (userData?.linuxExp || 0);
  const isReplaying = currentLevel < maxLevel;
  const missionReward = missionData?.rewardExp || 100;

  useEffect(() => {
    const initializeGame = async () => {
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

          // 🎫 เก็บ sessionToken ประจำด่าน (backend ใหม่ส่งมา — ต้องแนบตอน verify)
          sessionTokenRef.current = result.sessionToken || result.data.sessionToken || null;
          clearanceTokenRef.current = null;

          // ✅ จุดแก้หลักที่ 1: ระบบจำลองไฟล์ (Virtual File System)
          // ไฟล์ตั้งต้นชุดเล็ก — พอให้มีของเล่นกับคำสั่งโดยไม่ดันความสูงจอ
          let initialFiles: VirtualFile[] = [
            { name: 'documents', type: 'folder' },
            { name: 'config.json', type: 'file' },
            { name: 'server.log', type: 'file' }
          ];
          fsMapRef.current = { '~': initialFiles };
          setFileSystem(initialFiles);
        } else { setIsAllCleared(true); }
      } catch (error) { console.error("Error fetching mission:", error); }
    };
    fetchMission();
  }, [currentLevel, targetOs, isInitializing, missionReload]);

  // 🌟 นับ WPM/Accuracy เฉพาะคีย์ที่ "เข้า terminal จริง" (ส่งมาจาก TerminalBox.onKey)
  // — คีย์พิเศษ (F1-F12, Home, Delete ฯลฯ) และการพิมพ์นอก terminal ไม่ถูกนับอีกต่อไป
  const handleMetricKey = (type: 'char' | 'backspace') => {
    if (isInitializing || isPassed || showNextLevel || isAllCleared) return;

    // สะสมเวลาพิมพ์จริง: ช่องว่างระหว่างคีย์เกิน 3 วิ (พัก/เปลี่ยนแท็บ) นับแค่ 3 วิ
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

  // ✅ จุดแก้หลักที่ 2: เปลี่ยนเป็น async function เพื่อเตรียมยิง API 
  const handleCommand = async (rawCommand: string) => {
    if (!missionData || !rawCommand.trim() || isPassed) return;
    playSFX('enter');
    if (rawCommand.trim().toLowerCase() === 'reset') { handleResetGame(); return; }

    const normalizedInput = rawCommand.trim().replace(/\s+/g, ' ');

    // 🧠 จำลองผลคำสั่งผ่าน engine กลาง (lib/commandSim.ts) — ครอบคลุมคำสั่งที่เกมสอนทั้งหมด
    const sim = simulateCommand(normalizedInput, {
      os: targetOs,
      username: terminalUsername,
      currentPath,
      fileSystem,
    });

    const newPath = sim.newPath || currentPath;
    const isValidSystemCommand = sim.valid;

    if (sim.clearScreen) terminalRef.current?.reset(currentPath);
    if (sim.newPath && sim.newPath !== currentPath) {
      // cd: เซฟไฟล์ห้องเดิมไว้ แล้วโหลดไฟล์ของห้องปลายทาง (ห้องใหม่ = ว่างเปล่า)
      fsMapRef.current[currentPath] = fileSystem;
      setCurrentPath(sim.newPath);
      setFileSystem(fsMapRef.current[sim.newPath] ?? []);
    } else if (sim.newFileSystem) {
      setFileSystem(sim.newFileSystem);
      fsMapRef.current[currentPath] = sim.newFileSystem;
    }
    if (sim.effect) setActiveEffect({ id: Date.now(), effect: sim.effect });

    // แสดงผลลัพธ์ — แบบทยอยพิมพ์ทีละบรรทัด (ping/tracert/ssh ฯลฯ) หรือพิมพ์ทีเดียว
    if (sim.outputLines && sim.outputLines.length > 0) {
      const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));
      for (let i = 0; i < sim.outputLines.length; i++) {
        terminalRef.current?.writeLine(i === 0 ? `\r\n${sim.outputLines[i]}` : sim.outputLines[i]);
        if (i < sim.outputLines.length - 1) await sleep(sim.streamDelayMs || 250);
      }
    } else if (sim.output) {
      terminalRef.current?.writeLine(`\r\n${sim.output}`);
    }

    // =======================================================
    // ✅ จุดแก้หลักที่ 3: ระบบเซฟกันโกง (Server-side Validation)
    // ส่งข้อมูลที่ผู้เล่นพิมพ์ไปให้ Backend ตรวจแทนการเช็คที่หน้าบ้าน
    // =======================================================
    try {
      // POST ต้องแนบ X-CSRF-Token — apiFetch จัดการให้ | sessionToken = หลักฐานว่าโหลดโจทย์จริง
      const verifyRes = await apiFetch('/api/mission/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          os: targetOs,
          level: currentLevel,
          userCommand: normalizedInput,
          sessionToken: sessionTokenRef.current
        })
      });
      const verifyData = await verifyRes.json();

      // 400 = เซสชันด่านหมดอายุ → โหลดโจทย์ใหม่เพื่อรับ sessionToken ใหม่
      if (verifyRes.status === 400) {
        terminalRef.current?.writeLine(`\r\n\x1b[33m[SYSTEM] ${verifyData?.message || 'เซสชันด่านหมดอายุ'} — กำลังโหลดโจทย์ใหม่ พิมพ์คำตอบอีกครั้งได้เลย\x1b[0m`);
        setMissionReload(k => k + 1);
      // 403/401 = โดนระบบกันโกง/เซสชันมีปัญหา ไม่ใช่ตอบผิด — ต้องบอกผู้เล่นตรงๆ ไม่ใช่เงียบ
      } else if (verifyRes.status === 403 || verifyRes.status === 401) {
        terminalRef.current?.writeLine(`\r\n\x1b[31m[SYSTEM] ${verifyData?.message || `ตรวจคำตอบไม่สำเร็จ (${verifyRes.status}) — ลองรีเฟรชหรือเข้าสู่ระบบใหม่`}\x1b[0m`);
        setIsErrorAnim(true); setTimeout(() => setIsErrorAnim(false), 400);
      // ถ้า Backend ยืนยันว่า "คำสั่งถูกต้อง"
      } else if (verifyData.success && verifyData.isCorrect) {
        setIsPassed(true); setTimeout(() => playSFX('success'), 300);
        setRevealedCommand(verifyData.correctAnswer || normalizedInput);
        // 🎫 clearanceToken = หลักฐานผ่านด่าน ต้องแนบตอนเซฟ ไม่งั้นโดน 403
        clearanceTokenRef.current = verifyData.clearanceToken || null;

        apiFetch('/api/user/progress', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ os: targetOs, level: currentLevel, wpm: wpm, accuracy: accuracy, clearanceToken: clearanceTokenRef.current })
        })
          .then(async res => {
            const result = await res.json();
            // 403 = ไม่มี/หลักฐานผ่านด่านไม่ถูกต้อง — เซฟไม่เข้า ต้องบอกผู้เล่น
            if (res.status === 403 || !result.success) {
              terminalRef.current?.writeLine(`\r\n\x1b[31m[SYSTEM] เซฟความคืบหน้าไม่สำเร็จ: ${result?.message || `(${res.status})`}\x1b[0m`);
              return;
            }
            if (result.data) {
              setUserData(result.data);
              const newActiveLevel = targetOs === 'windows' ? result.data.windowsLevel : result.data.linuxLevel;
              setMaxLevel(newActiveLevel);
            }
            // EXP ที่ได้จริงรอบนี้ (โดนหักเหลือ 20% ถ้าด่านนี้เคยดูเฉลย)
            if (typeof result.earnedExp === 'number') {
              setEarnedExp(result.earnedExp);
            }
            if (typeof result.earnedCoins === 'number') {
              setEarnedCoins(result.earnedCoins);
            }
          })
          .catch(err => console.error("Save progress error:", err));
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

    // เคลียร์บรรทัดใหม่ (ยกเว้น clear/cls ที่ reset วาด prompt ให้แล้ว)
    if (!sim.clearScreen) { terminalRef.current?.writeLine(''); terminalRef.current?.prompt(newPath); }
  };

  const resetMetrics = () => { setIsPassed(false); setShowProceedButton(false); setShowNextLevel(false); setShowHint(false); setRevealedCommand(null); setSolution(null); setShowRevealConfirm(false); setEarnedExp(null); setEarnedCoins(null); clearanceTokenRef.current = null; activeTimeMsRef.current = 0; lastKeyTsRef.current = null; totalTypingKeysRef.current = 0; errorsRef.current = 0; setWpm(0); setAccuracy(100); window.history.replaceState(null, '', '/campaignplay'); };

  // ยิง /reveal เฉพาะหลังผู้เล่นกดยืนยันใน dialog เท่านั้น — แค่เรียก endpoint นี้
  // server จะจดถาวรทันทีว่าด่านนี้ใช้เฉลย (EXP เหลือ 20%)
  const handleConfirmReveal = async () => {
    setIsRevealing(true);
    try {
      const res = await apiFetch('/api/mission/reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ os: targetOs, level: currentLevel })
      });
      const data = await res.json();
      if (data.success && data.expectedCommand) {
        setSolution(data.expectedCommand);
        setShowRevealConfirm(false);
      } else {
        terminalRef.current?.writeLine(`\r\n\x1b[31m[SYSTEM] ขอเฉลยไม่สำเร็จ: ${data?.message || 'ลองใหม่อีกครั้ง'}\x1b[0m`);
        setShowRevealConfirm(false);
      }
    } catch (err) {
      console.error("Reveal error:", err);
    } finally {
      setIsRevealing(false);
    }
  };
  const handleNextLevel = () => { setCurrentLevel(prev => prev + 1); resetMetrics(); terminalRef.current?.reset("~"); setCurrentPath("~"); };
  const handleReplayLevel = () => { resetMetrics(); terminalRef.current?.reset(currentPath); };
  const handleResetGame = () => { setCurrentLevel(1); setCurrentPath("~"); setFileSystem([]); fsMapRef.current = { '~': [] }; setIsAllCleared(false); resetMetrics(); terminalRef.current?.reset("~"); };

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

  const wpmTextHex = isHacker ? (isDragon ? '#ef4444' : '#22c55e') : isDark ? '#ffffff' : '#431407';
  const highlightHex = isHacker ? (isDragon ? '#f87171' : '#4ade80') : isDark ? (isLinux ? (isAmethyst ? '#c084fc' : '#facc15') : '#60a5fa') : currentTheme === 'sky' ? '#0ea5e9' : currentTheme === 'mint' ? '#10b981' : (isLinux ? '#f97316' : '#3b82f6');

  if (isInitializing) return (
    <PageSkeleton maxW="max-w-[1800px]">
      {/* ── Mission Banner: ซ้าย Level+ชื่อด่าน+กล่องโจทย์ / ขวา WPM+ACC ── */}
      <div className="glass-card p-6 md:p-8 mb-6 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="flex-1 w-full xl:w-auto xl:pr-6">
          <div className="flex items-center gap-4 mb-4">
            <div className={`${sk} rounded-[12px] h-8 w-24 shrink-0`} />
            <div className={`${sk} rounded-2xl h-9 md:h-11 w-56 md:w-80 max-w-full`} />
          </div>
          {/* กล่องโจทย์ (border-4 rounded-[20px]) */}
          <div className={`${skCard} rounded-[20px] px-5 py-4 flex items-start gap-3`}>
            <div className={`${sk} rounded-full h-6 w-16 shrink-0`} />
            <div className="flex-1 flex flex-col gap-2.5 min-w-0">
              <div className={`${sk} rounded-full h-4 w-full`} />
              <div className={`${sk} rounded-full h-4 w-3/5`} />
            </div>
          </div>
        </div>
        {/* กล่อง WPM / ACC */}
        <div className="flex gap-4 w-full xl:w-auto shrink-0 mt-4 xl:mt-0">
          <div className={`${skCard} rounded-[24px] px-8 py-4 w-full xl:w-auto flex items-center justify-around xl:justify-center gap-8`}>
            {[0, 1].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className={`${sk} rounded-full h-2.5 w-10`} />
                <div className={`${sk} rounded-xl h-8 w-14`} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ตัวเกม: Terminal (7 ส่วน) + แผงไฟล์จำลอง (5 ส่วน) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
        <div className={`${skCard} lg:col-span-7 rounded-[32px] overflow-hidden flex flex-col`}>
          {/* แถบควบคุมด้านบน: จุด 3 สี + ชื่อ + ปุ่มตั้งค่า */}
          <div className="flex items-center gap-3 px-5 py-4 border-b-4 border-orange-50 dark:border-[#382E54] hacker:border-[#166534] transition-colors">
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => <div key={i} className={`${sk} size-4 rounded-full`} />)}
            </div>
            <div className={`${sk} rounded-full h-3.5 w-32 ml-2`} />
            <div className="flex-1" />
            {[0, 1, 2].map((i) => <div key={i} className={`${sk} rounded-xl size-8 shrink-0`} />)}
          </div>
          {/* จอ terminal */}
          <div className="flex-1 p-5 md:p-6 flex flex-col gap-3.5">
            {['92%', '64%', '78%', '45%', '85%', '38%'].map((w, i) => (
              <div key={i} className={`${sk} rounded-full h-4`} style={{ width: w, opacity: 1 - i * 0.1 }} />
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* กล่องระบบไฟล์ */}
          <div className={`${skCard} rounded-[32px] p-5 flex-1 flex flex-col gap-4`}>
            <div className={`${sk} rounded-full h-4 w-36`} />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3" style={{ opacity: 1 - i * 0.12 }}>
                <div className={`${sk} rounded-lg size-7 shrink-0`} />
                <div className={`${sk} rounded-full h-3.5`} style={{ width: `${65 - i * 7}%` }} />
              </div>
            ))}
          </div>
          {/* กล่องคำใบ้ */}
          <div className={`${skCard} rounded-[32px] p-5 flex flex-col gap-3`}>
            <div className={`${sk} rounded-full h-3.5 w-24`} />
            <div className={`${sk} rounded-2xl h-11 w-full`} />
          </div>
        </div>
      </div>
    </PageSkeleton>
  );

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
        <Link href="/campaignpage" className="glow-hover flex items-center gap-3 text-orange-950 dark:text-white hacker:text-green-500 transition-all cursor-pointer group hover:text-orange-500 dark:hover:text-yellow-400 hacker:hover:text-green-400">
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
              <TerminalBox ref={terminalRef} initialPath={currentPath} onCommand={handleCommand} onMetricKey={handleMetricKey} isMuted={isMuted} themeName={terminalColor} fontSize={terminalSize} bgColor={terminalBg} />
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
            solution={solution}
            onRevealClick={() => setShowRevealConfirm(true)}
            activeEffect={activeEffect}
          />
        </div>
      </main>

      {/* ⚠️ Dialog ยืนยันก่อนดูเฉลย — ห้ามยิง /reveal ก่อนผู้เล่นกดยืนยัน (บทลงโทษถาวร) */}
      <AnimatePresence>
        {showRevealConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={`w-full max-w-md border-4 rounded-[32px] p-8 text-center shadow-2xl ${isHacker ? 'bg-[#0a0a0a] border-[#166534]' : isDark ? 'bg-[#1E1B2E] border-[#382E54]' : 'bg-white border-white'}`}
            >
              <div className={`mx-auto mb-5 size-16 rounded-[20px] border-4 flex items-center justify-center ${isHacker ? 'bg-[#111] border-rose-900 text-rose-500' : isDark ? 'bg-rose-500/10 border-rose-500/40 text-rose-400' : 'bg-rose-50 border-white text-rose-500 shadow-sm'}`}>
                <AlertTriangle size={32} strokeWidth={3} />
              </div>
              <h3 className={`text-2xl font-black mb-3 cute-header ${isHacker ? 'text-white' : isDark ? 'text-white' : 'text-orange-950'}`}>ดูเฉลยด่านนี้?</h3>
              <p className={`text-sm font-bold leading-relaxed mb-8 ${isHacker ? 'text-green-400' : isDark ? 'text-white/70' : 'text-orange-800'}`}>
                ดูเฉลยด่านนี้จะได้รับ EXP แค่ <span className="text-rose-500 font-black">20% อย่างถาวร</span> (ปิดเกมมาเล่นใหม่ก็ยังโดนหัก) ยืนยันไหม?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRevealConfirm(false)}
                  disabled={isRevealing}
                  className={`flex-1 py-4 border-4 text-xs uppercase font-black tracking-widest rounded-[20px] transition-colors btn-squishy shadow-sm ${isHacker ? 'bg-[#0a0a0a] border-green-900 text-green-600 hover:text-green-400 hover:border-green-700' : isDark ? 'bg-[#2D223B] border-[#4B3965] text-white/50 hover:text-white hover:bg-[#382E54]' : 'bg-white border-orange-100 text-orange-400 hover:text-orange-600 hover:bg-orange-50'}`}
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleConfirmReveal}
                  disabled={isRevealing}
                  className={`flex-1 py-4 border-4 text-xs uppercase font-black tracking-widest rounded-[20px] transition-colors btn-squishy shadow-sm text-white ${isRevealing ? 'opacity-60 cursor-wait' : ''} ${isHacker ? 'bg-rose-700 border-rose-600 hover:bg-rose-600' : isDark ? 'bg-rose-600 border-rose-500 hover:bg-rose-500' : 'bg-rose-500 border-white hover:bg-rose-400'}`}
                >
                  {isRevealing ? 'กำลังขอเฉลย...' : 'ยืนยันดูเฉลย'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
          earnedExp={earnedExp}
          earnedCoins={earnedCoins}
          wpm={wpm}
          handleNextLevel={handleNextLevel}
          handleReplayLevel={handleReplayLevel}
        />
      )}

    </div>
  );
}