"use client";

// =========================================================================
// 🖼️ Mini Preview: ภาพจำลองหน้าจอจริงของแต่ละโหมด (ดูได้โดยไม่ต้องกดเข้าไปเล่น)
// ใช้ร่วมกันทั้งหน้า /map และหน้า Docs (แท็บ Game Modes) — แก้ที่นี่ที่เดียว
// รองรับ 3 ธีมด้วย tailwind variant ล้วนๆ (ไม่มี JS คำนวณสี → ไม่มีปัญหา hydration)
// =========================================================================

// 🗺️ Campaign: ย่อส่วนหน้าเล่นจริง — แถบโจทย์ + WPM/ACC + terminal
export function CampaignPreview() {
    return (
        <div className="mt-5 rounded-[20px] overflow-hidden border-4 border-orange-100 dark:border-[#4B3965] hacker:border-green-900 shadow-inner bg-orange-50/60 dark:bg-[#1E1B2E] hacker:bg-[#0a0a0a] select-none pointer-events-none transition-colors">

            {/* 🎯 แถบโจทย์แบบเดียวกับหน้าเล่นจริง */}
            <div className="flex items-center gap-2 px-3.5 py-2.5">
                <span className="shrink-0 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest text-white dark:text-[#1E1B2E] hacker:text-[#0a0a0a] bg-orange-500 dark:bg-yellow-400 hacker:bg-green-600 shadow-sm">
                    Level 4
                </span>
                <div className="relative flex-1 min-w-0 flex items-center gap-1.5 bg-white dark:bg-[#2D223B] hacker:bg-[#111] pl-3 pr-2 py-1.5 rounded-xl border-2 border-orange-200 dark:border-yellow-400/40 hacker:border-green-700 overflow-hidden">
                    <span className="absolute left-0 top-0 w-1 h-full bg-orange-500 dark:bg-yellow-400 hacker:bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-black text-orange-500 dark:text-yellow-400 hacker:text-green-500 shrink-0">โจทย์ :</span>
                    <span className="text-[10px] font-bold truncate text-orange-950 dark:text-white/90 hacker:text-green-400">แสดงรายการไฟล์ทั้งหมดแบบละเอียด</span>
                </div>
                <div className="hidden sm:flex shrink-0 items-center gap-2 bg-white dark:bg-[#2D223B] hacker:bg-[#111] px-2.5 py-1.5 rounded-xl border-2 border-orange-100 dark:border-[#4B3965] hacker:border-green-900">
                    <span className="text-[9px] font-black"><span className="text-orange-400 dark:text-white/40 hacker:text-green-700">WPM</span> <span className="text-orange-950 dark:text-white hacker:text-green-400">55</span></span>
                    <span className="text-[9px] font-black"><span className="text-orange-400 dark:text-white/40 hacker:text-green-700">ACC</span> <span className="text-emerald-500 dark:text-emerald-400 hacker:text-green-400">96%</span></span>
                </div>
                <span className="shrink-0 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-orange-100 text-orange-500 dark:bg-white/10 dark:text-slate-300 hacker:bg-green-900/30 hacker:text-green-500">Preview</span>
            </div>

            {/* 💻 หน้าต่าง terminal (ธีม cute เป็นพื้นขาวโทนส้ม / dark-hacker เป็นพื้นเข้ม) */}
            <div className="mx-3.5 mb-3.5 rounded-xl overflow-hidden border-2 border-orange-100 dark:border-white/10 hacker:border-green-900/60 bg-white dark:bg-slate-950 hacker:bg-black transition-colors">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 dark:bg-slate-900 hacker:bg-[#0a0a0a] border-b-2 border-orange-100 dark:border-white/10 hacker:border-green-900/50 transition-colors">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="ml-1.5 text-[8px] font-black uppercase tracking-widest text-orange-400 dark:text-slate-500 hacker:text-green-800">student@keyrush</span>
                </div>
                <div className="p-3 font-mono text-[10px] md:text-[11px] space-y-1.5">
                    <p className="flex items-center gap-1.5">
                        <span className="text-orange-500 dark:text-sky-400 hacker:text-green-500 font-bold">student@keyrush:~$</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">ls -la</span>
                        <span className="w-1.5 h-3.5 bg-emerald-500 dark:bg-emerald-400 hacker:bg-green-500 animate-pulse rounded-sm" />
                    </p>
                    <p className="text-emerald-600 dark:text-emerald-400 hacker:text-green-400 font-bold">=== [ SYSTEM ACCESS GRANTED: MISSION ACCOMPLISHED ] ===</p>
                </div>
            </div>
        </div>
    );
}

// ⚡ Survival: HUD จับเวลา + เฟสจำ/พิมพ์จำลอง
export function SurvivalPreview() {
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

// 💪 Training: ย่อส่วนหน้าซ้อมจริง — Free Practice + สลับ OS + terminal คู่แผงไฟล์จำลอง
export function TrainingPreview() {
    return (
        <div className="mt-5 rounded-[20px] overflow-hidden border-4 border-orange-100 dark:border-[#4B3965] hacker:border-green-900 shadow-inner bg-orange-50/60 dark:bg-[#1E1B2E] hacker:bg-[#0a0a0a] select-none pointer-events-none transition-colors">

            {/* แถบบน: Free Practice + สวิตช์ OS + สถิติสด */}
            <div className="flex items-center gap-2 px-3.5 py-2.5 flex-wrap">
                <span className="shrink-0 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest text-white dark:text-[#1E1B2E] hacker:text-[#0a0a0a] bg-orange-500 dark:bg-yellow-400 hacker:bg-green-600 shadow-sm">
                    Free Practice
                </span>
                {/* สวิตช์ OS แบบหน้าจริง */}
                <div className="flex items-center gap-1">
                    <span className="px-2 py-1 rounded-lg text-[9px] font-black uppercase text-white dark:text-[#1E1B2E] hacker:text-[#0a0a0a] bg-orange-500 dark:bg-yellow-400 hacker:bg-green-600">Linux</span>
                    <span className="px-2 py-1 rounded-lg text-[9px] font-black uppercase bg-white dark:bg-[#2D223B] hacker:bg-[#111] text-orange-300 dark:text-white/30 hacker:text-green-800 border border-orange-100 dark:border-[#4B3965] hacker:border-green-900">Windows</span>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <span className="text-[9px] font-black bg-white dark:bg-[#2D223B] hacker:bg-[#111] px-2 py-1 rounded-lg border border-orange-100 dark:border-[#4B3965] hacker:border-green-900"><span className="text-orange-400 dark:text-white/40 hacker:text-green-700">WPM</span> <span className="text-orange-950 dark:text-white hacker:text-green-400">62</span> · <span className="text-orange-400 dark:text-white/40 hacker:text-green-700">ACC</span> <span className="text-emerald-500 dark:text-emerald-400 hacker:text-green-400">97%</span></span>
                    <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-orange-100 text-orange-500 dark:bg-white/10 dark:text-slate-300 hacker:bg-green-900/30 hacker:text-green-500">Preview</span>
                </div>
            </div>

            {/* พื้นที่เล่น: terminal ซ้าย + แผงไฟล์จำลองขวา (เลย์เอาต์เดียวกับหน้าจริง) */}
            <div className="mx-3.5 mb-3.5 grid grid-cols-5 gap-2">
                {/* terminal — พิมพ์อะไรก็ได้ ไม่มีโจทย์ (ธีม cute เป็นพื้นขาวโทนส้ม) */}
                <div className="col-span-3 rounded-xl overflow-hidden border-2 border-orange-100 dark:border-white/10 hacker:border-green-900/60 bg-white dark:bg-slate-950 hacker:bg-black p-3 font-mono text-[10px] md:text-[11px] space-y-1.5 transition-colors">
                    <p className="text-orange-300 dark:text-slate-500 hacker:text-green-800"># พิมพ์คำสั่งอะไรก็ได้เลย ✨</p>
                    <p className="flex items-center gap-1.5">
                        <span className="text-orange-500 dark:text-sky-400 hacker:text-green-500 font-bold">student@keyrush:~$</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">mkdir secret</span>
                        <span className="w-1.5 h-3.5 bg-emerald-500 dark:bg-emerald-400 hacker:bg-green-500 animate-pulse rounded-sm" />
                    </p>
                </div>
                {/* แผงไฟล์จำลอง — โฟลเดอร์ใหม่เด้งเข้ามา */}
                <div className="col-span-2 rounded-xl border-2 border-orange-100 dark:border-[#4B3965] hacker:border-green-900/60 bg-white dark:bg-[#2D223B] hacker:bg-[#111] p-2.5 space-y-1.5">
                    <p className="text-[8px] font-black uppercase tracking-widest text-orange-400 dark:text-white/40 hacker:text-green-700">~ File System</p>
                    <p className="text-[10px] font-bold text-orange-950 dark:text-white/80 hacker:text-green-500">📁 documents</p>
                    <p className="text-[10px] font-black text-emerald-500 dark:text-emerald-400 hacker:text-green-400 animate-pulse">📁 secret ← ใหม่!</p>
                    <p className="text-[10px] font-bold text-orange-950 dark:text-white/80 hacker:text-green-500">📄 config.json</p>
                </div>
            </div>

            <p className="px-4 pb-3 text-[10px] font-black uppercase tracking-widest text-orange-300 dark:text-white/30 hacker:text-green-800">ไม่มีโจทย์ · ไม่มีเวลาจับ · พิมพ์เล่นได้อิสระ</p>
        </div>
    );
}

// 🏆 Arena (ล็อกอยู่): ภาพ VS จางๆ ให้รู้ว่ากำลังมา
export function ArenaPreview() {
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
export default function ModePreview({ id }: { id: string }) {
    if (id === 'campaign') return <CampaignPreview />;
    if (id === 'survival') return <SurvivalPreview />;
    if (id === 'training') return <TrainingPreview />;
    if (id === 'arena') return <ArenaPreview />;
    return null;
}
