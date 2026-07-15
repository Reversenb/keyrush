import React, { useState } from 'react';
import { Palette, ChevronDown, ChevronUp } from 'lucide-react';
import { useTheme } from 'next-themes';

interface TerminalControlsProps {
    terminalUsername: string;
    targetOs: 'linux' | 'windows';
    terminalSize: number;
    setTerminalSize: (size: number) => void;
    terminalColor: string;
    setTerminalColor: (color: string) => void;
    terminalBg: string;
    setTerminalBg: (bg: string) => void;
}

// 🌟 คอลเลกชันสี
const ALL_TEXT_COLORS = [
    { name: 'orange', code: 'bg-orange-500' },
    { name: 'green', code: 'bg-green-400' },
    { name: 'blue', code: 'bg-blue-500' },
    { name: 'pink', code: 'bg-pink-400' },
    { name: 'retro', code: 'bg-lime-400' },
    { name: 'purple', code: 'bg-purple-500' },
    { name: 'red', code: 'bg-red-500' },
    { name: 'yellow', code: 'bg-yellow-400' },
    { name: 'cyan', code: 'bg-cyan-400' },
    { name: 'white', code: 'bg-white' },
];

const ALL_BG_COLORS = [
    { name: 'Dark', code: '#050505', bgClass: 'bg-[#050505]' },
    { name: 'KeyRush Purple', code: '#1E1B2E', bgClass: 'bg-[#1E1B2E]' },
    { name: 'Navy', code: '#0f172a', bgClass: 'bg-slate-900' },
    { name: 'Forest', code: '#064e3b', bgClass: 'bg-emerald-900' },
    { name: 'Plum', code: '#4c1d95', bgClass: 'bg-violet-900' },
    { name: 'Mocha', code: '#3e2723', bgClass: 'bg-stone-900' },
    { name: 'Midnight', code: '#172554', bgClass: 'bg-blue-950' },
    { name: 'white', code: '#ffffff', bgClass: 'bg-white' }
];

export default function TerminalControls({
    terminalUsername,
    targetOs,
    terminalSize,
    setTerminalSize,
    terminalColor,
    setTerminalColor,
    terminalBg,
    setTerminalBg
}: TerminalControlsProps) {

    // 🌟 Theme State
    const { theme: activeTheme, resolvedTheme } = useTheme();
    const currentTheme = activeTheme === 'system' ? resolvedTheme : activeTheme;
    const isDark = currentTheme === 'dark';
    const isHacker = currentTheme === 'hacker';

    // 🌟 State สำหรับเปิด/ปิด แผงสีแบบเต็ม
    const [showAllColors, setShowAllColors] = useState(false);

    return (
        <div className={`flex flex-col xl:flex-row items-start xl:items-center justify-between px-6 py-4 border-b-4 gap-3 transition-all duration-500 ${isHacker ? 'bg-[#111] border-[#166534]' : isDark ? 'bg-[#2D223B] border-[#382E54]' : 'bg-orange-100 border-white'}`}>

            {/* 🌟 ฝั่งซ้าย: โลโก้หน้าต่าง และ ชื่อผู้ใช้ */}
            <div className="flex items-center gap-4 w-full xl:w-auto shrink-0">
                <div className="flex gap-2">
                    <div className="size-4 rounded-full bg-rose-400 border border-white shadow-sm"></div>
                    <div className="size-4 rounded-full bg-amber-400 border border-white shadow-sm"></div>
                    <div className="size-4 rounded-full bg-green-400 border border-white shadow-sm"></div>
                </div>
                <div className={`text-xs font-black tracking-widest uppercase truncate transition-colors duration-500 ${isHacker ? 'text-green-600' : isDark ? 'text-white/50' : 'text-orange-950/50'}`}>
                    {terminalUsername}@{targetOs}
                </div>
            </div>

            {/* 🌟 ฝั่งขวา: พาเลทเปลี่ยนสีและฟอนต์ */}
            <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 custom-scrollbar ${showAllColors ? 'flex-wrap' : ''}`}>

                {/* แถบเลื่อน (Slider) ปรับฟอนต์ (คงกรอบขาวไว้ตามสั่งบอส!) */}
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-[16px] border-2 border-white shadow-sm shrink-0">
                    <span className="text-[10px] text-orange-400 font-black">Aa</span>
                    <input
                        type="range" min="10" max="24" value={terminalSize}
                        onChange={(e) => setTerminalSize(Number(e.target.value))}
                        className="w-16 md:w-20 accent-orange-500 h-1.5 bg-orange-100 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-[10px] text-orange-950 font-black w-4">{terminalSize}</span>
                </div>

                {/* ปุ่มเปลี่ยนสี Text / Glow (คงกรอบขาวไว้ตามสั่งบอส!) */}
                <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-[16px] border-2 border-white shadow-sm shrink-0 transition-all">
                    <span className="text-[9px] font-black uppercase text-orange-300 ml-1 mr-0.5">Text</span>
                    {(showAllColors ? ALL_TEXT_COLORS : ALL_TEXT_COLORS.slice(0, 5)).map((color) => (
                        <button
                            key={color.name}
                            onClick={() => setTerminalColor(color.name)}
                            className={`size-5 rounded-full ${color.code} border-2 transition-all ${terminalColor === color.name ? 'border-orange-950 scale-110 shadow-sm' : 'border-transparent hover:scale-110'}`}
                            title={`Text Color: ${color.name}`}
                        />
                    ))}
                </div>

                {/* ปุ่มเปลี่ยนสี Background (คงกรอบขาวไว้ตามสั่งบอส!) */}
                <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-[16px] border-2 border-white shadow-sm shrink-0 transition-all">
                    <span className="text-[9px] font-black uppercase text-orange-300 ml-1 mr-0.5">BG</span>
                    {(showAllColors ? ALL_BG_COLORS : ALL_BG_COLORS.slice(0, 4)).map((bg) => (
                        <button
                            key={bg.name}
                            onClick={() => setTerminalBg(bg.code)}
                            className={`size-5 rounded-full ${bg.bgClass} border-2 transition-all ${terminalBg === bg.code ? 'border-orange-400 scale-110 shadow-sm' : 'border-slate-300 hover:scale-110'}`}
                            title={`Background: ${bg.name}`}
                        />
                    ))}
                </div>

                {/* 🌟 ปุ่มเปิด/ปิด สีทั้งหมด (คงกรอบขาวไว้ตามสั่งบอส!) 🌟 */}
                <button
                    onClick={() => setShowAllColors(!showAllColors)}
                    className="flex items-center gap-1 bg-white hover:bg-orange-50 text-orange-400 hover:text-orange-600 px-2 py-1.5 rounded-[16px] border-2 border-white shadow-sm shrink-0 transition-colors font-black text-[10px] uppercase tracking-widest btn-squishy"
                >
                    <Palette size={14} strokeWidth={3} />
                    {showAllColors ? <ChevronUp size={14} strokeWidth={3} /> : <ChevronDown size={14} strokeWidth={3} />}
                </button>

            </div>
        </div>
    );
}