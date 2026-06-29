"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import Navbar from '@/components/Navbar';
import HackerLoadingScreen from '@/components/HackerLoadingScreen';
import {
  Rocket, Terminal, Monitor, Medal, HelpCircle, BookOpen,
  Target, Trophy, ChevronRight
} from 'lucide-react';

// 🌟 ข้อมูลเมนูด้านซ้าย
const DOC_TABS = [
  { id: 'getting-started', label: 'Getting Started', icon: <Rocket size={20} strokeWidth={3} />, color: 'text-orange-500 dark:text-yellow-400 hacker:text-green-500' },
  { id: 'linux-cheat-sheet', label: 'Linux Commands', icon: <Terminal size={20} strokeWidth={3} />, color: 'text-orange-600 dark:text-orange-400 hacker:text-green-500' },
  { id: 'windows-cheat-sheet', label: 'Windows CMD', icon: <Monitor size={20} strokeWidth={3} />, color: 'text-blue-500 dark:text-blue-400 hacker:text-green-500' },
  { id: 'clearance-levels', label: 'Clearance Levels', icon: <Medal size={20} strokeWidth={3} />, color: 'text-pink-500 dark:text-pink-400 hacker:text-green-500' },
  { id: 'faq', label: 'FAQ', icon: <HelpCircle size={20} strokeWidth={3} />, color: 'text-yellow-500 dark:text-yellow-400 hacker:text-green-500' },
];

export default function DatabankPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('getting-started');

  // 🌟 States
  const [linuxDocs, setLinuxDocs] = useState<any[]>([]);
  const [windowsDocs, setWindowsDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('keyrush_token');
    if (!token) {
      router.push('/login');
      return;
    }

    // 🌟 ดึงข้อมูล Docs (Linux & Windows) ไปพร้อมๆ กัน
    const fetchDatabankData = async () => {
      try {
        const [linuxDocsRes, windowsDocsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/docs/linux`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/docs/windows`)
        ]);

        // 🛡️ ระบบป้องกันเว็บพัง! ถ้าอันไหนไม่โอเค ให้โชว์ Error ใน Console
        if (!linuxDocsRes.ok) console.error("🚨 Linux Docs API Error:", await linuxDocsRes.text());
        if (!windowsDocsRes.ok) console.error("🚨 Windows Docs API Error:", await windowsDocsRes.text());

        // แปลงเป็น JSON เฉพาะตัวที่ผ่าน (res.ok = true)
        const linuxDocsData = linuxDocsRes.ok ? await linuxDocsRes.json() : { success: false, data: [] };
        const windowsDocsData = windowsDocsRes.ok ? await windowsDocsRes.json() : { success: false, data: [] };

        if (linuxDocsData.success) setLinuxDocs(linuxDocsData.data);
        if (windowsDocsData.success) setWindowsDocs(windowsDocsData.data);

      } catch (error) {
        console.error("Failed to fetch Databank data", error);
      } finally {
        setTimeout(() => setLoading(false), 500);
      }
    };

    fetchDatabankData();
  }, [router]);

  if (loading) return <HackerLoadingScreen />;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans font-black flex flex-col selection:bg-orange-500/20 dark:selection:bg-yellow-400/20 hacker:selection:bg-green-500/20 relative overflow-hidden transition-colors duration-500">
      <Navbar theme="linux" />

      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-15px) rotate(2deg); } }
        .float-element { animation: float 6s ease-in-out infinite; }
        .float-delayed { animation: float 7s ease-in-out infinite 1.5s; }
        
        .glass-card { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(16px); border: 4px solid white; border-radius: 40px; box-shadow: 0 10px 30px rgba(249, 115, 22, 0.1); transition: all 0.3s ease; }
        .dark .glass-card { background: rgba(45, 34, 59, 0.7); border-color: #382E54; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2); }
        .hacker .glass-card { background: rgba(10, 10, 10, 0.85); border-color: #166534; box-shadow: 0 10px 30px rgba(34, 197, 94, 0.15); }
        
        .btn-squishy { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .btn-squishy:hover { transform: scale(1.05) translateY(-2px); }
        .btn-squishy:active { transform: scale(0.95) translateY(0); box-shadow: none !important; }

        .cute-header { text-shadow: 2px 2px 0px rgba(255, 255, 255, 1), -1px -1px 0px rgba(255, 255, 255, 1), 1px -1px 0px rgba(255, 255, 255, 1), -1px 1px 0px rgba(255, 255, 255, 1); letter-spacing: -0.02em; }
        .dark .cute-header { text-shadow: 2px 2px 0px rgba(0, 0, 0, 0.3); }
        .hacker .cute-header { text-shadow: 2px 2px 0px rgba(0, 0, 0, 0.8); }

        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(249,115,22,0.3); border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(250,204,21,0.3); }
        .hacker .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(34,197,94,0.3); }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(249,115,22,0.6); }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(250,204,21,0.6); }
        .hacker .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(34,197,94,0.6); }
      `}</style>

      {/* 🎈 Background Blobs 🎈 */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-400 dark:bg-yellow-500 hacker:bg-green-600 rounded-full blur-[100px] opacity-20 dark:opacity-10 hacker:opacity-10 float-element pointer-events-none z-0 transition-colors duration-500" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-amber-400 dark:bg-yellow-600 hacker:bg-green-700 rounded-full blur-[100px] opacity-20 dark:opacity-10 hacker:opacity-10 float-delayed pointer-events-none z-0 transition-colors duration-500" style={{ animationDelay: '1.5s' }} />

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 relative z-10 flex flex-col md:flex-row gap-8 pt-8 md:pt-12 pb-20">

        {/* Sidebar */}
        <aside className="w-full md:w-72 flex-shrink-0">
          <div className="mb-6 px-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 bg-white dark:bg-[#1E1B2E] hacker:bg-[#0a0a0a] border-4 border-white dark:border-[#382E54] hacker:border-[#166534] rounded-[16px] shadow-sm btn-squishy transition-colors">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 dark:bg-yellow-400 hacker:bg-green-500 animate-pulse transition-colors"></span>
              <span className="text-orange-500 dark:text-yellow-400 hacker:text-green-500 font-black text-[11px] uppercase tracking-widest transition-colors">Global Databank</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-orange-950 dark:text-white hacker:text-white tracking-tighter drop-shadow-sm cute-header leading-none transition-colors">
              Command <span className="text-orange-500 dark:text-yellow-400 hacker:text-green-500 block transition-colors">Center</span>
            </h1>
            <p className="text-[11px] text-orange-600 dark:text-white/50 hacker:text-green-600 font-black mt-3 uppercase tracking-widest transition-colors">KeyRush Official Docs 📚</p>
          </div>

          <nav className="flex flex-row md:flex-col gap-3 overflow-x-auto md:overflow-visible pb-4 md:pb-0 custom-scrollbar mt-6">
            {DOC_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-5 py-4 rounded-[20px] font-black text-sm text-left transition-all duration-300 flex-shrink-0 md:flex-shrink-0 border-4 btn-squishy ${activeTab === tab.id
                  ? 'bg-white dark:bg-[#1E1B2E] hacker:bg-[#0a0a0a] border-white dark:border-[#4B3965] hacker:border-green-600 text-orange-950 dark:text-white hacker:text-white shadow-sm scale-[1.02]'
                  : 'bg-white/40 dark:bg-white/5 hacker:bg-white/5 border-transparent text-orange-950/60 dark:text-white/50 hacker:text-white/50 hover:bg-white/80 dark:hover:bg-white/10 hacker:hover:bg-[#111] hover:text-orange-950 dark:hover:text-white hacker:hover:text-green-400 hover:border-white dark:hover:border-[#382E54] hacker:hover:border-green-800'
                  }`}
              >
                <span className={`${tab.color} ${activeTab === tab.id ? 'scale-110 transition-transform' : ''}`}>
                  {tab.icon}
                </span>
                <span className="whitespace-nowrap tracking-wider">{tab.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Content Area */}
        <section className="flex-1 glass-card p-6 md:p-10 min-h-[500px] overflow-hidden flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="h-full flex flex-col"
            >
              {activeTab === 'getting-started' && <GettingStartedContent />}
              {activeTab === 'linux-cheat-sheet' && <LinuxContent docs={linuxDocs} />}
              {activeTab === 'windows-cheat-sheet' && <WindowsContent docs={windowsDocs} />}
              {activeTab === 'clearance-levels' && <ClearanceContent />}
              {activeTab === 'faq' && <FaqContent />}
            </motion.div>
          </AnimatePresence>
        </section>

      </main>
    </div>
  );
}

// =========================================================================
// 🌟 Content Components
// =========================================================================

function GettingStartedContent() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-black text-orange-950 dark:text-white hacker:text-white flex items-center gap-3 mb-6 border-b-4 border-white dark:border-[#382E54] hacker:border-green-800 pb-6 cute-header transition-colors">
        <Rocket className="text-orange-500 dark:text-yellow-400 hacker:text-green-500 transition-colors" size={32} strokeWidth={3} />
        Introduction to KeyRush
      </h2>
      <div className="text-orange-800 dark:text-white/70 hacker:text-white/70 space-y-6 leading-relaxed text-sm md:text-base font-bold transition-colors">
        <p>
          ยินดีต้อนรับสู่ <strong className="text-orange-600 dark:text-yellow-400 hacker:text-green-500 font-black">KeyRush</strong> แพลตฟอร์มฝึกฝนทักษะการใช้งาน Command Line Interface (CLI) สำหรับสายลับไซเบอร์ ระบบนี้ถูกออกแบบมาเพื่อพัฒนาความเร็วและความแม่นยำในการพิมพ์คำสั่งทั้งระบบปฏิบัติการ <span className="text-orange-600 dark:text-orange-400 hacker:text-green-400 font-black">Linux</span> และ <span className="text-blue-500 dark:text-blue-400 hacker:text-blue-400 font-black">Windows</span>
        </p>
        <div className="bg-white/80 dark:bg-[#1E1B2E]/80 hacker:bg-[#0a0a0a]/80 border-4 border-white dark:border-[#382E54] hacker:border-green-800 rounded-[24px] p-6 md:p-8 my-6 shadow-sm transition-colors">
          <h3 className="text-orange-950 dark:text-white hacker:text-white font-black text-lg mb-4 flex items-center gap-2 transition-colors">
            <Target className="text-orange-500 dark:text-yellow-400 hacker:text-green-500 transition-colors" strokeWidth={3} /> เป้าหมายหลัก (Objective)
          </h3>
          <ul className="space-y-4 ml-2 text-orange-800 dark:text-white/70 hacker:text-white/70 font-bold transition-colors">
            <li className="flex items-start gap-3">
              <span className="text-orange-400 dark:text-yellow-500 hacker:text-green-500 mt-1 transition-colors">✨</span> พิมพ์คำสั่งที่ถูกต้องตามโจทย์ให้เร็วที่สุด
            </li>
            <li className="flex items-start gap-3">
              <span className="text-orange-400 dark:text-yellow-500 hacker:text-green-500 mt-1 transition-colors">✨</span> เก็บสะสม <strong className="text-orange-600 dark:text-yellow-400 hacker:text-green-500 font-black mx-1 transition-colors">EXP</strong> เพื่อเลื่อนระดับ (Clearance Levels)
            </li>
            <li className="flex items-start gap-3">
              <span className="text-orange-400 dark:text-yellow-500 hacker:text-green-500 mt-1 transition-colors">✨</span> ไต่อันดับใน <strong className="text-yellow-500 dark:text-yellow-400 hacker:text-green-500 font-black mx-1 transition-colors">Global Rankings</strong> แข่งขันกับผู้เล่นคนอื่นๆ
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// 🌟 Component: LINUX CONTENT (เฉพาะ Docs)
function LinuxContent({ docs }: { docs: any[] }) {
  const { theme: activeTheme, resolvedTheme } = useTheme();
  const currentTheme = activeTheme === 'system' ? resolvedTheme : activeTheme;
  const isDark = currentTheme === 'dark';
  const isHacker = currentTheme === 'hacker';

  // จัดกลุ่ม Docs ตามหมวดหมู่
  const groupedDocs = docs.reduce((acc, doc) => {
    if (!acc[doc.category]) acc[doc.category] = [];
    acc[doc.category].push(doc);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-8 flex flex-col h-full overflow-y-auto custom-scrollbar pr-2">
      <div>
        <h2 className="text-3xl font-black text-orange-950 dark:text-white hacker:text-white flex items-center gap-3 mb-3 border-b-4 border-white dark:border-[#382E54] hacker:border-green-800 pb-6 cute-header transition-colors">
          <Terminal className="text-orange-600 dark:text-yellow-400 hacker:text-green-500 transition-colors" size={32} strokeWidth={3} />
          Linux Databank
        </h2>
        <p className="text-orange-600 dark:text-white/50 hacker:text-green-600 text-sm font-bold mt-4 uppercase tracking-widest transition-colors">
          รวบรวมคำสั่งพื้นฐานและการปฏิบัติการบนเซิร์ฟเวอร์ Unix/Linux
        </p>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-black flex items-center gap-2 uppercase tracking-widest text-orange-950 dark:text-white hacker:text-white">
          <BookOpen className="text-orange-500 dark:text-yellow-400 hacker:text-green-500" size={24} strokeWidth={3} /> Command Library
        </h3>

        {Object.keys(groupedDocs).length > 0 ? (
          <div className="space-y-6">
            {Object.keys(groupedDocs).map((category, idx) => (
              <div key={idx} className={`p-6 rounded-[24px] border-4 shadow-sm ${isHacker ? 'bg-[#0a0a0a] border-green-900/50' : isDark ? 'bg-[#1E1B2E] border-[#382E54]' : 'bg-orange-50/50 border-white'}`}>
                <h4 className={`text-sm font-black uppercase tracking-widest mb-4 border-b-4 pb-2 inline-block ${isHacker ? 'border-[#166534] text-green-500' : isDark ? 'border-[#4B3965] text-yellow-400' : 'border-orange-200 text-orange-800'}`}>
                  {category}
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {groupedDocs[category].map((doc: any) => (
                    <div key={doc.id} className={`p-4 rounded-[16px] border-2 shadow-sm transition-all ${isHacker ? 'bg-[#111] border-[#166534]' : isDark ? 'bg-[#2D223B] border-white/10' : 'bg-white border-orange-100'}`}>
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 rounded-[8px] text-xs font-black font-prompt border-2 ${isHacker ? 'bg-green-900/40 text-green-400 border-green-600' : isDark ? 'bg-black/30 text-yellow-400 border-[#4B3965]' : 'bg-orange-100 text-orange-600 border-orange-200'}`}>
                          {doc.command}
                        </span>
                      </div>
                      <p className={`text-xs font-bold leading-relaxed mb-3 ${isHacker ? 'text-green-600' : isDark ? 'text-white/60' : 'text-orange-900/70'}`}>
                        {doc.description}
                      </p>
                      {doc.example && (
                        <div className={`p-2 rounded-[12px] text-[10px] font-bold font-prompt flex items-center gap-2 border-2 ${isHacker ? 'bg-black text-green-500 border-[#166534]' : isDark ? 'bg-black/50 text-white border-black/20' : 'bg-orange-50 text-orange-800 border-orange-200/50'}`}>
                          <ChevronRight size={12} strokeWidth={3} className="shrink-0" />
                          {doc.example}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-sm font-black uppercase tracking-widest opacity-50">No library records found.</div>
        )}
      </div>
    </div>
  );
}

// 🌟 Component: WINDOWS CONTENT (เฉพาะ Docs)
function WindowsContent({ docs }: { docs: any[] }) {
  const { theme: activeTheme, resolvedTheme } = useTheme();
  const currentTheme = activeTheme === 'system' ? resolvedTheme : activeTheme;
  const isDark = currentTheme === 'dark';
  const isHacker = currentTheme === 'hacker';

  // จัดกลุ่ม Docs ตามหมวดหมู่
  const groupedDocs = docs.reduce((acc, doc) => {
    if (!acc[doc.category]) acc[doc.category] = [];
    acc[doc.category].push(doc);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-8 flex flex-col h-full overflow-y-auto custom-scrollbar pr-2">
      <div>
        <h2 className="text-3xl font-black text-orange-950 dark:text-white hacker:text-white flex items-center gap-3 mb-3 border-b-4 border-white dark:border-[#382E54] hacker:border-green-800 pb-6 cute-header transition-colors">
          <Monitor className="text-blue-500 dark:text-blue-400 hacker:text-green-500 transition-colors" size={32} strokeWidth={3} />
          Windows CMD Databank
        </h2>
        <p className="text-blue-500 dark:text-white/50 hacker:text-green-600 text-sm font-bold mt-4 uppercase tracking-widest transition-colors">
          รวบรวมคำสั่งพื้นฐานสำหรับการดูแลระบบ Windows Command Prompt
        </p>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-black flex items-center gap-2 uppercase tracking-widest text-orange-950 dark:text-white hacker:text-white">
          <BookOpen className="text-blue-500 dark:text-blue-400 hacker:text-green-500" size={24} strokeWidth={3} /> Command Library
        </h3>

        {Object.keys(groupedDocs).length > 0 ? (
          <div className="space-y-6">
            {Object.keys(groupedDocs).map((category, idx) => (
              <div key={idx} className={`p-6 rounded-[24px] border-4 shadow-sm ${isHacker ? 'bg-[#0a0a0a] border-green-900/50' : isDark ? 'bg-[#1E1B2E] border-[#382E54]' : 'bg-blue-50/50 border-white'}`}>
                <h4 className={`text-sm font-black uppercase tracking-widest mb-4 border-b-4 pb-2 inline-block ${isHacker ? 'border-[#166534] text-green-500' : isDark ? 'border-[#4B3965] text-blue-400' : 'border-blue-200 text-blue-800'}`}>
                  {category}
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {groupedDocs[category].map((doc: any) => (
                    <div key={doc.id} className={`p-4 rounded-[16px] border-2 shadow-sm transition-all ${isHacker ? 'bg-[#111] border-[#166534]' : isDark ? 'bg-[#2D223B] border-white/10' : 'bg-white border-blue-100'}`}>
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 rounded-[8px] text-xs font-black font-prompt border-2 ${isHacker ? 'bg-green-900/40 text-green-400 border-green-600' : isDark ? 'bg-black/30 text-blue-400 border-[#4B3965]' : 'bg-blue-100 text-blue-600 border-blue-200'}`}>
                          {doc.command}
                        </span>
                      </div>
                      <p className={`text-xs font-bold leading-relaxed mb-3 ${isHacker ? 'text-green-600' : isDark ? 'text-white/60' : 'text-orange-900/70'}`}>
                        {doc.description}
                      </p>
                      {doc.example && (
                        <div className={`p-2 rounded-[12px] text-[10px] font-bold font-prompt flex items-center gap-2 border-2 ${isHacker ? 'bg-black text-green-500 border-[#166534]' : isDark ? 'bg-black/50 text-white border-black/20' : 'bg-blue-50 text-blue-800 border-blue-200/50'}`}>
                          <ChevronRight size={12} strokeWidth={3} className="shrink-0" />
                          {doc.example}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-sm font-black uppercase tracking-widest opacity-50">No library records found.</div>
        )}
      </div>
    </div>
  );
}

function ClearanceContent() {
  const getRankThemeColors = (id: number) => {
    const baseHackerColor = 'text-green-400 border-green-900 bg-[#0a0a0a]';
    const darkMap: any = { 1: 'dark:text-slate-300 dark:border-[#382E54] dark:bg-[#2D223B]', 2: 'dark:text-green-400 dark:border-[#382E54] dark:bg-[#2D223B]', 3: 'dark:text-yellow-400 dark:border-[#382E54] dark:bg-[#2D223B]', 4: 'dark:text-blue-400 dark:border-[#382E54] dark:bg-[#2D223B]', 5: 'dark:text-purple-400 dark:border-[#382E54] dark:bg-[#2D223B]', 6: 'dark:text-pink-400 dark:border-[#382E54] dark:bg-[#2D223B]', 7: 'dark:text-rose-400 dark:border-[#382E54] dark:bg-[#2D223B]', };
    const lightMap: any = { 1: 'text-slate-500 border-slate-100 bg-white', 2: 'text-green-500 border-green-100 bg-white', 3: 'text-amber-500 border-amber-100 bg-white', 4: 'text-blue-500 border-blue-100 bg-white', 5: 'text-purple-500 border-purple-100 bg-white', 6: 'text-pink-500 border-pink-100 bg-white', 7: 'text-rose-500 border-rose-100 bg-white', };
    return `${lightMap[id]} ${darkMap[id]} hacker:${baseHackerColor.replace(/ /g, ' hacker:')}`;
  };

  const getRankDotColor = (id: number) => {
    const lightMap: any = { 1: 'bg-slate-400', 2: 'bg-green-400', 3: 'bg-amber-400', 4: 'bg-blue-400', 5: 'bg-purple-400', 6: 'bg-pink-400', 7: 'bg-rose-500' };
    const darkMap: any = { 1: 'dark:bg-slate-300', 2: 'dark:bg-green-400', 3: 'dark:bg-yellow-400', 4: 'dark:bg-blue-400', 5: 'dark:bg-purple-400', 6: 'dark:bg-pink-400', 7: 'dark:bg-rose-400' };
    return `${lightMap[id]} ${darkMap[id]} hacker:bg-green-500`;
  };

  const ranksData = [
    { id: 1, title: "Script Kiddie", req: "0+ EXP" },
    { id: 2, title: "Cyber Novice", req: "200+ EXP" },
    { id: 3, title: "Net Runner", req: "500+ EXP" },
    { id: 4, title: "System Admin", req: "1,000+ EXP" },
    { id: 5, title: "Elite Operative", req: "2,000+ EXP" },
    { id: 6, title: "Phantom Architect", req: "3,500+ EXP" },
    { id: 7, title: "Root Master", req: "5,000+ EXP" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-black text-orange-950 dark:text-white hacker:text-white flex items-center gap-3 mb-6 border-b-4 border-white dark:border-[#382E54] hacker:border-green-800 pb-6 cute-header transition-colors">
        <Medal className="text-pink-500 dark:text-pink-400 hacker:text-green-500 transition-colors" size={32} strokeWidth={3} />
        Clearance Levels
      </h2>
      <div className="text-orange-800 dark:text-white/70 hacker:text-white/70 space-y-4 text-sm leading-relaxed font-bold transition-colors">
        <p>ในระบบ KeyRush สายลับไซเบอร์ทุกคนจะถูกจัดระดับตามประสบการณ์ (EXP) ที่สะสมได้จากการทำภารกิจ ยิ่งคุณสะสมคะแนนได้มาก ยศของคุณในฐานข้อมูลก็จะสูงขึ้น</p>

        <div className="bg-white/80 dark:bg-[#1E1B2E]/80 hacker:bg-[#0a0a0a]/80 border-4 border-white dark:border-[#382E54] hacker:border-green-800 rounded-[24px] p-6 md:p-8 mt-6 shadow-sm transition-colors">
          <h3 className="text-orange-950 dark:text-white hacker:text-white font-black mb-6 uppercase tracking-widest flex items-center gap-2 transition-colors">
            <Trophy className="text-yellow-500 dark:text-yellow-400 hacker:text-green-500 transition-colors" strokeWidth={3} /> Tier List
          </h3>
          <ul className="space-y-5">
            {ranksData.map((rank) => (
              <li key={rank.id} className={`flex items-center gap-4 p-3 rounded-[16px] border-2 shadow-sm transition-colors ${getRankThemeColors(rank.id)}`}>
                <span className={`w-4 h-4 rounded-full border-2 border-white dark:border-transparent hacker:border-transparent shadow-sm ${getRankDotColor(rank.id)} transition-colors`}></span>
                <div className="flex-1">
                  <strong className="font-black">{rank.title}</strong>
                  <span className="text-[10px] opacity-70 ml-2 uppercase tracking-widest">({rank.req})</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function FaqContent() {
  const faqs = [
    { q: "สามารถเปลี่ยนชื่อ Display Name และภาพ Avatar ได้กี่ครั้ง?", a: "ผู้เล่นสามารถเปลี่ยนข้อมูลโปรไฟล์ส่วนตัวได้ไม่จำกัดจำนวนครั้ง โดยไปที่เมนู Profile" },
    { q: "ค่า WPM และ Accuracy คิดจากอะไร?", a: "WPM (Words Per Minute) คำนวณจากความเร็วในการพิมพ์คำสั่งที่ถูกต้อง ส่วน Accuracy คำนวณจากความแม่นยำ โดยหักลบเปอร์เซ็นต์ทุกครั้งที่คุณพิมพ์ผิด" },
    { q: "คะแนนในแท็บ 'Total' ของ Leaderboard คิดอย่างไร?", a: "คำนวณจาก EXP รวมกันทั้งสายการฝึก Linux และ Windows" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-black text-orange-950 dark:text-white hacker:text-white flex items-center gap-3 mb-6 border-b-4 border-white dark:border-[#382E54] hacker:border-green-800 pb-6 cute-header transition-colors">
        <HelpCircle className="text-yellow-500 dark:text-yellow-400 hacker:text-green-500 transition-colors" size={32} strokeWidth={3} />
        Frequently Asked Questions
      </h2>

      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <div key={i} className="bg-white/80 dark:bg-[#1E1B2E]/80 hacker:bg-[#0a0a0a]/80 border-4 border-white dark:border-[#382E54] hacker:border-green-800 rounded-[24px] p-6 hover:border-yellow-300 dark:hover:border-yellow-500 hacker:hover:border-green-400 transition-colors shadow-sm">
            <h3 className="text-orange-950 dark:text-white hacker:text-white font-black mb-3 flex items-start gap-3 text-base transition-colors">
              <span className="text-yellow-500 dark:text-yellow-400 hacker:text-green-500 font-black bg-yellow-100 dark:bg-yellow-400/20 hacker:bg-green-900/30 px-2 py-0.5 rounded-lg border-2 border-white dark:border-transparent hacker:border-transparent transition-colors">Q:</span> {faq.q}
            </h3>
            <p className="text-orange-800 dark:text-white/70 hacker:text-white/70 text-sm font-bold leading-relaxed flex items-start gap-3 transition-colors">
              <span className="text-orange-500 dark:text-orange-400 hacker:text-green-400 font-black bg-orange-100 dark:bg-orange-400/20 hacker:bg-green-900/20 px-2 py-0.5 rounded-lg border-2 border-white dark:border-transparent hacker:border-transparent transition-colors">A:</span> {faq.a}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}