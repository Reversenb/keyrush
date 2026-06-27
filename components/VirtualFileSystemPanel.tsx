import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { ChevronLeft, Monitor, Folder, Lightbulb, FileCode2, FileJson, FileText, File as FileIcon } from 'lucide-react';

interface VirtualFile {
    name: string;
    type: 'folder' | 'file';
}

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
}

export default function VirtualFileSystemPanel({
    targetOs, themeText, themeBg, terminalUsername, currentPath, fileSystem, showHint, setShowHint, missionData
}: VirtualFileSystemPanelProps) {

    // 🌟 ดึงค่า Theme เพื่อเปลี่ยนสีสันต่างๆ ให้เข้ากับโหมด
    const { theme: activeTheme, resolvedTheme } = useTheme();
    const currentTheme = activeTheme === 'system' ? resolvedTheme : activeTheme;
    const isDark = currentTheme === 'dark';
    const isHacker = currentTheme === 'hacker';

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

                {/* ✨ พื้นที่แสดงไฟล์ ✨ */}
                <div className={`flex-1 p-8 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto content-start relative custom-scrollbar transition-colors duration-500 ${isHacker ? 'bg-[#0a0a0a]' : isDark ? 'bg-[#1E1B2E]/50' : 'bg-white/50'}`}>
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
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>

            {/* 🌟 Hint Section 🌟 */}
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
                <div className="flex-1 overflow-hidden">
                    <h3 className={`text-xs font-black uppercase tracking-widest mb-1.5 transition-colors duration-500 ${isHacker ? 'text-green-600' : isDark ? 'text-white/50' : 'text-orange-400'}`}>กดที่นี่เพื่อขอคำใบ้</h3>
                    {showHint ? (
                        <p className={`text-sm font-bold animate-in fade-in slide-in-from-left-4 flex flex-wrap items-center gap-2 transition-colors duration-500 ${isHacker ? 'text-green-400' : isDark ? 'text-white' : 'text-orange-950'}`}>
                            <span className={`font-black text-lg ${themeText}`}>&gt;</span> เริ่มต้นด้วยคำสั่ง
                            <code className={`px-3 py-1 rounded-[12px] border-2 font-black shadow-sm transition-colors duration-500 ${isHacker ? 'bg-[#111] border-green-800 text-green-500' : isDark ? 'bg-[#2D223B] border-[#4B3965] text-yellow-400' : 'bg-orange-100 border-white text-orange-600'}`}>
                                {((missionData?.expectedCommand || '')).split(' ')[0] || '...'}
                            </code>
                            <span className={isHacker ? 'text-green-600' : isDark ? 'text-white/60' : 'text-orange-600'}>{missionData?.hint ? `(${missionData.hint})` : ''}</span>
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
        </div>
    );
}