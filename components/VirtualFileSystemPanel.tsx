import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { ChevronLeft, Monitor, Folder, Lightbulb, Eye, FileCode2, FileJson, FileText, File as FileIcon, Wifi, Search, Lock, Cpu, Skull, Package, PackageOpen, Info, Activity, Copy as CopyIcon, MoveRight } from 'lucide-react';
import type { SimEffect } from '@/lib/commandSim';

interface VirtualFile {
    name: string;
    type: 'folder' | 'file';
}

export interface ActiveEffect {
    id: number;
    effect: SimEffect;
}

// ไอคอนประจำหมวดเอฟเฟกต์ (ใช้ทั้งใน chip และอนิเมชันกลางจอ)
const EFFECT_ICONS: Record<SimEffect['kind'], any> = {
    pulse: Activity, copy: CopyIcon, move: MoveRight, archive: Package,
    permission: Lock, scan: Search, network: Wifi, process: Cpu, sysinfo: Info,
};

interface VirtualFileSystemPanelProps {
    targetOs: 'linux' | 'windows';
    themeText: string;
    themeBg: string;
    terminalUsername: string;
    currentPath: string;
    fileSystem: VirtualFile[];
    showHint: boolean;
    setShowHint: (show: boolean) => void;
    missionData: any;
    // เฉลยจาก /api/mission/reveal (มีค่าหลังผู้เล่นยืนยันยอมโดนหัก EXP แล้วเท่านั้น)
    solution?: string | null;
    // เปิด dialog ยืนยันดูเฉลย (ตัว dialog อยู่ที่หน้าเล่น)
    onRevealClick?: () => void;
    // เอฟเฟกต์จาก command simulation (id ใหม่ = เล่นซ้ำได้แม้ kind เดิม)
    activeEffect?: ActiveEffect | null;
    // โหมดฝึกซ้อม (Training) ไม่มีโจทย์ → ซ่อนกล่องคำใบ้/เฉลยทั้งแถบ
    hideHintSection?: boolean;
}

export default function VirtualFileSystemPanel({
    targetOs, themeText, themeBg, terminalUsername, currentPath, fileSystem, showHint, setShowHint, missionData, solution, onRevealClick, activeEffect, hideHintSection
}: VirtualFileSystemPanelProps) {

    // 🌟 ดึงค่า Theme เพื่อเปลี่ยนสีสันต่างๆ ให้เข้ากับโหมด
    const { theme: activeTheme, resolvedTheme } = useTheme();
    const currentTheme = activeTheme === 'system' ? resolvedTheme : activeTheme;
    const isDark = currentTheme === 'dark';
    const isHacker = currentTheme === 'hacker' || currentTheme === 'dragon'; const isDragon = currentTheme === 'dragon';

    // 🎬 เอฟเฟกต์ที่กำลังเล่น — โชว์ ~2.4 วิแล้วหายเอง
    const [fx, setFx] = useState<ActiveEffect | null>(null);
    useEffect(() => {
        if (!activeEffect) return;
        setFx(activeEffect);
        const t = setTimeout(() => setFx(null), 2400);
        return () => clearTimeout(t);
    }, [activeEffect?.id]);

    const fxKind = fx?.effect.kind;
    const fxTargets: string[] = (fx?.effect.kind === 'permission' || fx?.effect.kind === 'scan') ? fx.effect.targets : [];
    const accentHex = isHacker ? (isDragon ? '#ef4444' : '#22c55e') : isDark ? '#facc15' : (targetOs === 'linux' ? '#f97316' : '#3b82f6');
    const FxIcon = fxKind ? EFFECT_ICONS[fxKind] : Activity;

    const getFileStyle = (fileName: string) => {
        const name = fileName.toLowerCase();

        // โหมด Hacker ให้ไฟล์มีโทนสีเขียว
        if (isHacker) {
            if (name.endsWith('.js') || name.endsWith('.ts')) return { icon: <FileCode2 size={40} strokeWidth={2} />, color: 'text-green-400' };
            if (name.endsWith('.html')) return { icon: <FileCode2 size={40} strokeWidth={2} />, color: 'text-green-500' };
            if (name.endsWith('.css')) return { icon: <FileCode2 size={40} strokeWidth={2} />, color: 'text-green-300' };
            if (name.endsWith('.json')) return { icon: <FileJson size={40} strokeWidth={2} />, color: 'text-green-400' };
            if (name.endsWith('.md') || name.endsWith('.txt') || name.endsWith('.log')) return { icon: <FileText size={40} strokeWidth={2} />, color: 'text-green-600' };
            return { icon: <FileIcon size={40} strokeWidth={2} />, color: 'text-green-700' };
        }

        if (name.endsWith('.js') || name.endsWith('.ts')) return { icon: <FileCode2 size={40} strokeWidth={2} />, color: 'text-yellow-500' };
        if (name.endsWith('.html')) return { icon: <FileCode2 size={40} strokeWidth={2} />, color: 'text-orange-500' };
        if (name.endsWith('.css')) return { icon: <FileCode2 size={40} strokeWidth={2} />, color: 'text-blue-500' };
        if (name.endsWith('.json')) return { icon: <FileJson size={40} strokeWidth={2} />, color: 'text-green-500' };
        if (name.endsWith('.md') || name.endsWith('.txt') || name.endsWith('.log')) return { icon: <FileText size={40} strokeWidth={2} />, color: 'text-orange-800 dark:text-orange-400' };
        return { icon: <FileIcon size={40} strokeWidth={2} />, color: 'text-orange-400' };
    };

    return (
        <div className="lg:col-span-5 flex flex-col gap-6">
            <div className={`flex-1 flex flex-col rounded-[32px] overflow-hidden border-4 shadow-sm relative transition-colors duration-500 ${isHacker ? 'bg-[#0a0a0a] border-[#166534]' : isDark ? 'bg-[#1E1B2E] border-[#382E54]' : 'bg-white border-white'}`}>

                {/* ✨ Breadcrumb โฟลเดอร์ปัจจุบันพร้อมอนิเมชัน ✨ */}
                <div className={`flex items-center gap-4 px-6 py-4 border-b-4 transition-colors duration-500 ${isHacker ? 'bg-[#111] border-[#166534]' : isDark ? 'bg-[#2D223B] border-[#382E54]' : 'bg-orange-50 border-white'}`}>
                    <div className={`flex gap-2 ${isHacker ? 'text-green-600' : isDark ? 'text-white/50' : 'text-orange-300'}`}>
                        <ChevronLeft size={20} strokeWidth={3} />
                    </div>
                    <div className={`flex-1 rounded-[16px] px-4 py-2.5 text-sm font-black flex items-center gap-2 border-2 overflow-hidden whitespace-nowrap shadow-sm transition-colors duration-500 ${isHacker ? 'bg-[#0a0a0a] text-green-500 border-[#166534]' : isDark ? 'bg-[#1E1B2E] text-white border-[#4B3965]' : 'bg-white text-orange-950 border-orange-100'}`}>
                        <Monitor size={18} strokeWidth={3} className={themeText} />
                        <span className={isHacker ? 'text-green-800' : isDark ? 'text-white/30' : 'text-orange-300'}>/</span>
                        <span className={themeText}>{terminalUsername}</span>
                        <AnimatePresence mode="popLayout">
                            {currentPath !== '~' && currentPath.replace('~/', '').split('/').filter(Boolean).map((folderName, index) => (
                                <motion.span key={`${index}-${folderName}`} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.8 }} className="flex items-center gap-2">
                                    <span className={isHacker ? 'text-green-800' : isDark ? 'text-white/30' : 'text-orange-300'}>/</span>
                                    <span className={isHacker ? 'text-green-400' : isDark ? 'text-white' : 'text-orange-950'}>{folderName}</span>
                                </motion.span>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                {/* ✨ พื้นที่แสดงไฟล์ — ล็อกความสูงด้วย absolute inset ให้เลื่อนในตัวเอง
                    (ไฟล์เยอะแค่ไหนก็ไม่ดันความสูงหน้า / ปุ่ม Next ไม่เลื่อนหนี) ✨ */}
                <div className="flex-1 relative min-h-[300px]">
                <div className={`absolute inset-0 p-8 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto content-start custom-scrollbar transition-colors duration-500 ${isHacker ? 'bg-[#0a0a0a]' : isDark ? 'bg-[#1E1B2E]/50' : 'bg-white/50'}`}>
                    <div className="flex flex-col items-center justify-center p-3 opacity-50 border-4 border-transparent">
                        <Folder size={48} strokeWidth={2} className={isHacker ? 'text-green-600 fill-green-900' : isDark ? 'text-yellow-500 fill-yellow-900' : 'text-amber-400 fill-amber-100'} />
                        <span className={`text-[11px] mt-3 font-black uppercase tracking-widest ${isHacker ? 'text-green-600' : isDark ? 'text-yellow-500' : 'text-orange-400'}`}>System</span>
                    </div>

                    <AnimatePresence>
                        {fileSystem.map((file) => {
                            const isFolder = file.type === 'folder';
                            const style = isFolder
                                ? { icon: <Folder size={48} strokeWidth={2} className={isHacker ? 'text-green-500 fill-green-900/50' : isDark ? 'text-yellow-400 fill-yellow-600/30' : 'text-amber-400 fill-amber-100'} />, color: isHacker ? 'text-green-500' : isDark ? 'text-yellow-400' : 'text-amber-400' }
                                : getFileStyle(file.name);

                            const boxShadowColor = isHacker ? "rgba(34,197,94,0.3)" : targetOs === 'linux' ? "rgba(249,115,22,0.3)" : "rgba(59,130,246,0.3)";

                            return (
                                <motion.div
                                    key={file.name}
                                    initial={{ scale: 0, opacity: 0, y: 20 }}
                                    animate={{ scale: 1, opacity: 1, y: 0, boxShadow: ["0px 0px 0px rgba(0,0,0,0)", `0px 0px 20px ${boxShadowColor}`, "0px 0px 0px rgba(0,0,0,0)"] }}
                                    transition={{ type: "spring", stiffness: 400, damping: 25, boxShadow: { duration: 1.5 } }}
                                    exit={{ scale: 0, opacity: 0, filter: 'blur(10px)' }}
                                    className={`group flex flex-col items-center justify-center p-4 border-4 border-transparent rounded-[24px] transition-all aspect-square relative cursor-default ${isHacker ? 'hover:bg-[#111] hover:border-green-800' : isDark ? 'hover:bg-[#2D223B] hover:border-[#4B3965]' : 'hover:bg-orange-50 hover:border-white'}`}
                                >
                                    <span className={`group-hover:scale-110 transition-transform duration-300 drop-shadow-sm ${style.color}`}>{style.icon}</span>
                                    <span className={`text-[11px] font-black truncate w-full text-center mt-3 px-2 py-1 rounded-lg border-2 shadow-sm transition-colors duration-500 ${isHacker ? 'bg-[#0a0a0a] text-green-500 border-green-800' : isDark ? 'bg-[#1E1B2E] text-white border-[#382E54]' : 'bg-white text-orange-950 border-orange-50'}`}>
                                        {file.name}
                                    </span>

                                    {/* 🔒/🔍 ป้ายบนไฟล์เป้าหมายของเอฟเฟกต์ permission/scan */}
                                    <AnimatePresence>
                                        {fxTargets.includes(file.name) && (
                                            <motion.div
                                                initial={{ scale: 0, opacity: 0, y: 6 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0, opacity: 0 }}
                                                transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                                                className="absolute -top-1 -right-1 z-20 size-8 rounded-xl flex items-center justify-center text-white shadow-md border-2 border-white/70"
                                                style={{ backgroundColor: fxKind === 'permission' ? '#e11d48' : accentHex }}
                                            >
                                                {fxKind === 'permission' ? <Lock size={16} strokeWidth={3} /> : <Search size={16} strokeWidth={3} />}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    {fxTargets.includes(file.name) && (
                                        <div className="absolute inset-0 rounded-[24px] border-4 animate-pulse pointer-events-none" style={{ borderColor: fxKind === 'permission' ? '#e11d48' : accentHex }} />
                                    )}
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>

                    {/* ============================================================ */}
                    {/* 🎬 เอฟเฟกต์ประจำหมวดคำสั่ง (ซ้อนบนพื้นที่ไฟล์ ~2.4 วิ) 🎬 */}
                    {/* ============================================================ */}
                    <AnimatePresence>
                        {fx && (
                            <motion.div
                                key={fx.id}
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center overflow-hidden"
                            >
                                {/* ป้ายชื่อคำสั่งด้านบน (ทุกเอฟเฟกต์) */}
                                <motion.div
                                    initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                                    className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest text-white shadow-lg"
                                    style={{ backgroundColor: fxKind === 'permission' || fx.effect.kind === 'process' && fx.effect.mode === 'kill' ? '#e11d48' : accentHex, borderColor: 'rgba(255,255,255,0.6)' }}
                                >
                                    <FxIcon size={14} strokeWidth={3} /> {fx.effect.label}
                                </motion.div>

                                {/* 🌐 NETWORK: คลื่นเรดาร์กระจายจากไอคอน */}
                                {fxKind === 'network' && (
                                    <div className="relative flex items-center justify-center">
                                        {[0, 1, 2].map(i => (
                                            <motion.span
                                                key={i}
                                                className="absolute rounded-full border-4"
                                                style={{ borderColor: accentHex }}
                                                initial={{ width: 40, height: 40, opacity: 0.9 }}
                                                animate={{ width: 220, height: 220, opacity: 0 }}
                                                transition={{ duration: 1.6, delay: i * 0.45, repeat: Infinity, ease: 'easeOut' }}
                                            />
                                        ))}
                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}
                                            className="size-16 rounded-3xl flex items-center justify-center text-white shadow-xl border-4 border-white/60" style={{ backgroundColor: accentHex }}>
                                            <Wifi size={30} strokeWidth={3} />
                                        </motion.div>
                                    </div>
                                )}

                                {/* 🔍 SCAN: แถบสแกนกวาดผ่านจอ */}
                                {fxKind === 'scan' && (
                                    <motion.div
                                        className="absolute top-0 bottom-0 w-24 pointer-events-none"
                                        style={{ background: `linear-gradient(90deg, transparent, ${accentHex}55, transparent)`, boxShadow: `0 0 30px ${accentHex}44` }}
                                        initial={{ left: '-20%' }} animate={{ left: '110%' }}
                                        transition={{ duration: 1.1, repeat: 1, ease: 'easeInOut' }}
                                    />
                                )}

                                {/* 🧠 PROCESS LIST: การ์ดรายชื่อโปรเซสสไลด์ขึ้น */}
                                {fx.effect.kind === 'process' && fx.effect.mode === 'list' && (
                                    <motion.div
                                        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
                                        className={`absolute bottom-3 left-3 right-3 rounded-2xl border-4 p-4 font-mono text-[11px] shadow-xl ${isHacker ? 'bg-[#050505]/95 border-green-700 text-green-400' : isDark ? 'bg-[#14121f]/95 border-[#4B3965] text-white/90' : 'bg-white/95 border-orange-200 text-orange-950'}`}
                                    >
                                        {[['982', 'node server.js', '38%'], ['1337', 'keyrushd', '12%'], ['214', 'sshd', '2%']].map(([pid, name, cpu], i) => (
                                            <motion.div key={pid} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.12 }} className="flex justify-between py-0.5">
                                                <span><span style={{ color: accentHex }} className="font-black">{pid}</span>  {name}</span>
                                                <span className="opacity-60">{cpu}</span>
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                )}

                                {/* 💀 PROCESS KILL: ไอคอนระเบิด */}
                                {fx.effect.kind === 'process' && fx.effect.mode === 'kill' && (
                                    <motion.div
                                        initial={{ scale: 0.4, opacity: 0, rotate: -12 }}
                                        animate={{ scale: [0.4, 1.25, 1], opacity: [0, 1, 1], rotate: 0 }}
                                        transition={{ duration: 0.55 }}
                                        className="size-20 rounded-3xl bg-rose-600 border-4 border-white/60 flex items-center justify-center text-white shadow-xl"
                                    >
                                        <Skull size={40} strokeWidth={2.5} />
                                    </motion.div>
                                )}

                                {/* 📦 ARCHIVE: กล่องบีบอัด/แตกไฟล์ */}
                                {fx.effect.kind === 'archive' && (
                                    <motion.div
                                        initial={{ scale: 0, rotate: -8 }}
                                        animate={{ scale: [0, 1.15, 1], rotate: 0 }}
                                        transition={{ duration: 0.6, type: 'spring', stiffness: 260 }}
                                        className="size-20 rounded-3xl flex items-center justify-center text-white shadow-xl border-4 border-white/60"
                                        style={{ backgroundColor: accentHex }}
                                    >
                                        {fx.effect.mode === 'pack' ? <Package size={40} strokeWidth={2.5} /> : <PackageOpen size={40} strokeWidth={2.5} />}
                                    </motion.div>
                                )}

                                {/* ℹ️ SYSINFO: การ์ดข้อมูลเด้งขึ้นมุมล่าง */}
                                {fxKind === 'sysinfo' && (
                                    <motion.div
                                        initial={{ y: 40, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0 }}
                                        className={`absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-3 rounded-2xl border-4 shadow-xl font-black text-xs uppercase tracking-widest ${isHacker ? 'bg-[#050505]/95 border-green-700 text-green-400' : isDark ? 'bg-[#14121f]/95 border-[#4B3965] text-white' : 'bg-white/95 border-orange-200 text-orange-950'}`}
                                    >
                                        <Info size={18} strokeWidth={3} style={{ color: accentHex }} />
                                        System data retrieved
                                    </motion.div>
                                )}

                                {/* ⚡ PULSE / COPY / MOVE / PERMISSION(ไม่มีไฟล์เป้าหมาย): ขอบจอวูบสี accent */}
                                {(fxKind === 'pulse' || fxKind === 'copy' || fxKind === 'move' || (fxKind === 'permission' && fxTargets.length === 0)) && (
                                    <motion.div
                                        className="absolute inset-0 rounded-[20px] border-4 pointer-events-none"
                                        style={{ borderColor: fxKind === 'permission' ? '#e11d48' : accentHex }}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: [0, 1, 0, 1, 0] }}
                                        transition={{ duration: 1.6 }}
                                    />
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* 🌟 Hint Section (ซ่อนในโหมดฝึกซ้อม) 🌟 */}
            {!hideHintSection && (
            <div className={`w-full border-4 rounded-[32px] p-6 flex items-center gap-5 relative overflow-hidden shadow-sm transition-colors duration-500 ${isHacker ? 'bg-[#0a0a0a] border-[#166534]' : isDark ? 'bg-[#1E1B2E] border-[#382E54]' : 'bg-white border-white'}`}>
                {showHint && <div className={`absolute top-0 left-0 w-2 h-full ${themeBg}`}></div>}
                <button
                    onClick={() => setShowHint(true)}
                    disabled={showHint}
                    className={`flex-shrink-0 size-14 rounded-[20px] border-4 flex items-center justify-center transition-all duration-300 btn-squishy 
            ${showHint
                            ? (isHacker ? `bg-[#111] ${themeText} border-green-800 shadow-sm` : isDark ? `bg-[#2D223B] ${themeText} border-[#4B3965] shadow-sm` : `bg-orange-50 ${themeText} border-white shadow-sm`)
                            : (isHacker ? 'bg-[#0a0a0a] text-green-700 border-green-900 hover:border-green-600 hover:text-green-400 animate-pulse' : isDark ? 'bg-[#1E1B2E] text-white/30 border-[#382E54] hover:border-yellow-500/50 hover:text-yellow-400 animate-pulse' : 'bg-white text-orange-300 border-orange-100 hover:border-orange-300 hover:text-amber-400 animate-pulse')
                        }`}
                >
                    <Lightbulb size={28} strokeWidth={3} className={showHint ? 'fill-current' : ''} />
                </button>

                {/* 👁️ ปุ่มดูเฉลย (มีบทลงโทษ EXP — กดแล้วไปเปิด dialog ยืนยันก่อน) */}
                <button
                    onClick={() => { if (!solution) onRevealClick?.(); }}
                    disabled={!!solution}
                    title={solution ? 'ดูเฉลยแล้ว' : 'ดูเฉลย (EXP เหลือ 20%)'}
                    className={`flex-shrink-0 size-14 rounded-[20px] border-4 flex items-center justify-center transition-all duration-300 btn-squishy
            ${solution
                            ? (isHacker ? 'bg-[#111] text-rose-500 border-rose-900 shadow-sm' : isDark ? 'bg-[#2D223B] text-rose-400 border-rose-900/60 shadow-sm' : 'bg-rose-50 text-rose-500 border-white shadow-sm')
                            : (isHacker ? 'bg-[#0a0a0a] text-green-800 border-green-900 hover:border-rose-700 hover:text-rose-500' : isDark ? 'bg-[#1E1B2E] text-white/30 border-[#382E54] hover:border-rose-500/50 hover:text-rose-400' : 'bg-white text-orange-300 border-orange-100 hover:border-rose-300 hover:text-rose-400')
                        }`}
                >
                    <Eye size={28} strokeWidth={3} />
                </button>

                <div className="flex-1 overflow-hidden">
                    <h3 className={`text-xs font-black uppercase tracking-widest mb-1.5 transition-colors duration-500 ${isHacker ? 'text-green-600' : isDark ? 'text-white/50' : 'text-orange-400'}`}>
                        {solution ? 'เฉลยด่านนี้ (EXP เหลือ 20%)' : 'ขอคำใบ้ หรือดูเฉลย'}
                    </h3>
                    {solution ? (
                        <p className={`text-sm font-bold animate-in fade-in slide-in-from-left-4 flex flex-wrap items-center gap-2 transition-colors duration-500 ${isHacker ? 'text-green-400' : isDark ? 'text-white' : 'text-orange-950'}`}>
                            <span className="font-black text-lg text-rose-500">&gt;</span> พิมพ์คำสั่ง
                            <code className={`px-3 py-1 rounded-[12px] border-2 font-black shadow-sm transition-colors duration-500 ${isHacker ? 'bg-[#111] border-rose-900 text-rose-400' : isDark ? 'bg-[#2D223B] border-rose-900/60 text-rose-400' : 'bg-rose-50 border-white text-rose-500'}`}>
                                {solution}
                            </code>
                            <span className={isHacker ? 'text-green-600' : isDark ? 'text-white/60' : 'text-orange-600'}>แล้วกด Enter</span>
                        </p>
                    ) : showHint ? (
                        // backend ไม่ส่ง expectedCommand มาแล้ว (กันโกง) — คำใบ้ใช้ hint text ของด่านล้วนๆ
                        <p className={`text-sm font-bold animate-in fade-in slide-in-from-left-4 flex flex-wrap items-center gap-2 transition-colors duration-500 ${isHacker ? 'text-green-400' : isDark ? 'text-white' : 'text-orange-950'}`}>
                            <span className={`font-black text-lg ${themeText}`}>&gt;</span>
                            <span className={`px-3 py-1 rounded-[12px] border-2 font-black shadow-sm transition-colors duration-500 ${isHacker ? 'bg-[#111] border-green-800 text-green-500' : isDark ? 'bg-[#2D223B] border-[#4B3965] text-yellow-400' : 'bg-orange-100 border-white text-orange-600'}`}>
                                {missionData?.hint || 'ด่านนี้ไม่มีคำใบ้ ลองสังเกตจากโจทย์ดูนะ'}
                            </span>
                        </p>
                    ) : (
                        <p
                            onClick={() => setShowHint(true)}
                            className={`text-sm font-black cursor-pointer transition-colors uppercase tracking-widest ${isHacker ? 'text-green-800 hover:text-green-500' : isDark ? 'text-white/30 hover:text-yellow-400' : 'text-orange-950/40 hover:text-orange-500'}`}
                        >
                            Need a hint? <span className={`underline underline-offset-4 ${isHacker ? 'decoration-green-700' : isDark ? 'decoration-white/30' : 'decoration-orange-300'}`}>Decrypt Intel</span>
                        </p>
                    )}
                </div>
            </div>
            )}
        </div>
    );
}