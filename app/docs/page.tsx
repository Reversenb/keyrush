"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import HackerLoadingScreen from '@/components/HackerLoadingScreen';
import {
  Rocket, Terminal, Monitor, Medal, HelpCircle, BookOpen,
  Target, Trophy, Zap
} from 'lucide-react';

// 🌟 ข้อมูลเมนูด้านซ้าย (ปรับสีให้รองรับ Dark และ Hacker Mode)
const DOC_TABS = [
  { id: 'getting-started', label: 'Getting Started', icon: <Rocket size={20} strokeWidth={3} />, color: 'text-orange-500 dark:text-yellow-400 hacker:text-green-500' },
  { id: 'linux-cheat-sheet', label: 'Linux Commands', icon: <Terminal size={20} strokeWidth={3} />, color: 'text-orange-600 dark:text-orange-400 hacker:text-green-500' },
  { id: 'windows-cheat-sheet', label: 'Windows CMD', icon: <Monitor size={20} strokeWidth={3} />, color: 'text-blue-500 dark:text-blue-400 hacker:text-green-500' },
  { id: 'clearance-levels', label: 'Clearance Levels', icon: <Medal size={20} strokeWidth={3} />, color: 'text-pink-500 dark:text-pink-400 hacker:text-green-500' },
  { id: 'faq', label: 'FAQ', icon: <HelpCircle size={20} strokeWidth={3} />, color: 'text-yellow-500 dark:text-yellow-400 hacker:text-green-500' },
];

export default function DatabankPage() {
  const [activeTab, setActiveTab] = useState('getting-started');

  // 🌟 State สำหรับเก็บข้อมูลภารกิจทั้งหมดที่ดึงมาจาก Database
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🌟 ดึงข้อมูลคำสั่ง (Missions) จาก Database
    const fetchMissions = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/missions/all`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setMissions(data.data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch missions for docs", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMissions();
  }, []);

  if (loading) return <HackerLoadingScreen />;

  // แยกโจทย์ของแต่ละ OS ออกจากกัน
  const linuxMissions = missions.filter(m => m.os === 'linux');
  const windowsMissions = missions.filter(m => m.os === 'windows');

  return (
    <div className="min-h-screen bg-background text-foreground font-sans font-black flex flex-col selection:bg-orange-500/20 dark:selection:bg-yellow-400/20 hacker:selection:bg-green-500/20 relative overflow-hidden transition-colors duration-500">
      <Navbar theme="linux" />

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(2deg); }
        }
        .float-element { animation: float 6s ease-in-out infinite; }
        .float-delayed { animation: float 7s ease-in-out infinite 1.5s; }
        
        .glass-card {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(16px);
          border: 4px solid white;
          border-radius: 40px;
          box-shadow: 0 10px 30px rgba(249, 115, 22, 0.1);
          transition: all 0.3s ease;
        }

        .dark .glass-card {
          background: rgba(45, 34, 59, 0.7); 
          border-color: #382E54;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }

        .hacker .glass-card {
          background: rgba(10, 10, 10, 0.85); 
          border-color: #166534; 
          box-shadow: 0 10px 30px rgba(34, 197, 94, 0.15);
        }
        
        .btn-squishy {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-squishy:hover { transform: scale(1.05) translateY(-2px); }
        .btn-squishy:active { transform: scale(0.95) translateY(0); box-shadow: none !important; }

        .cute-header {
          text-shadow: 2px 2px 0px rgba(255, 255, 255, 1), 
                       -1px -1px 0px rgba(255, 255, 255, 1), 
                       1px -1px 0px rgba(255, 255, 255, 1), 
                       -1px 1px 0px rgba(255, 255, 255, 1);
          letter-spacing: -0.02em;
        }

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

      {/* 🎈 Background Blobs เปลี่ยนสีตามธีม 🎈 */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-400 dark:bg-yellow-500 hacker:bg-green-600 rounded-full blur-[100px] opacity-20 dark:opacity-10 hacker:opacity-10 float-element pointer-events-none z-0 transition-colors duration-500" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-amber-400 dark:bg-yellow-600 hacker:bg-green-700 rounded-full blur-[100px] opacity-20 dark:opacity-10 hacker:opacity-10 float-delayed pointer-events-none z-0 transition-colors duration-500" style={{ animationDelay: '1.5s' }} />

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 relative z-10 flex flex-col md:flex-row gap-8 pt-8 md:pt-12 pb-20">

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

        <section className="flex-1 glass-card p-6 md:p-10 min-h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {activeTab === 'getting-started' && <GettingStartedContent />}
              {activeTab === 'linux-cheat-sheet' && <LinuxContent missions={linuxMissions} />}
              {activeTab === 'windows-cheat-sheet' && <WindowsContent missions={windowsMissions} />}
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
// 🌟 Content Components (เนื้อหาแต่ละหน้า)
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
        <p className="bg-orange-100 dark:bg-[#2D223B] hacker:bg-[#111] p-5 rounded-[20px] border-4 border-white dark:border-[#4B3965] hacker:border-green-800 shadow-sm inline-block transition-colors">
          💡 คุณสามารถเริ่มต้นฝึกฝนได้โดยไปที่เมนู <strong>Dashboard</strong> เลือกสายปฏิบัติการที่ต้องการ และเริ่มภารกิจแรกของคุณได้ทันที!
        </p>
      </div>
    </div>
  );
}

// 🌟 Component สำหรับโชว์คำสั่ง Linux จากฐานข้อมูล
function LinuxContent({ missions }: { missions: any[] }) {
  return (
    <div className="space-y-6 flex flex-col h-full">
      <div>
        <h2 className="text-3xl font-black text-orange-950 dark:text-white hacker:text-white flex items-center gap-3 mb-3 border-b-4 border-white dark:border-[#382E54] hacker:border-green-800 pb-6 cute-header transition-colors">
          <Terminal className="text-orange-600 dark:text-yellow-400 hacker:text-green-500 transition-colors" size={32} strokeWidth={3} />
          Linux Databank
        </h2>
        <p className="text-orange-600 dark:text-white/50 hacker:text-green-600 text-sm font-bold mt-4 uppercase tracking-widest transition-colors">รวบรวมคำสั่งพื้นฐานจากการปฏิบัติการบนเซิร์ฟเวอร์ Unix/Linux (อัปเดตจาก Database อัตโนมัติ)</p>
      </div>

      <div className="overflow-auto flex-1 custom-scrollbar pr-2 border-4 border-white dark:border-[#382E54] hacker:border-green-800 rounded-[24px] bg-white/50 dark:bg-[#1E1B2E]/50 hacker:bg-[#0a0a0a]/50 shadow-sm transition-colors">
        <table className="w-full text-left text-sm">
          <thead className="bg-orange-100 dark:bg-[#2D223B] hacker:bg-[#111] text-orange-600 dark:text-yellow-400 hacker:text-green-500 font-black text-xs uppercase tracking-widest sticky top-0 z-10 transition-colors">
            <tr>
              <th className="px-6 py-5 text-center w-16 border-b-4 border-white dark:border-[#382E54] hacker:border-green-800">Level</th>
              <th className="px-6 py-5 border-b-4 border-white dark:border-[#382E54] hacker:border-green-800">Command <span className="text-[10px] text-orange-400/80 dark:text-white/40 hacker:text-green-600/60 lowercase tracking-normal ml-1 font-bold">(Hover to Decrypt)</span></th>
              <th className="px-6 py-5 border-b-4 border-white dark:border-[#382E54] hacker:border-green-800">Operation Details</th>
            </tr>
          </thead>
          <tbody className="divide-y-4 divide-white dark:divide-[#382E54] hacker:divide-green-800 transition-colors">
            {missions.length > 0 ? (
              missions.map((m, i) => (
                <tr key={i} className="hover:bg-white dark:hover:bg-white/5 hacker:hover:bg-green-900/10 transition-colors group">
                  <td className="px-6 py-5 font-black text-orange-400 dark:text-white/50 hacker:text-green-600 text-center group-hover:text-orange-600 dark:group-hover:text-yellow-400 hacker:group-hover:text-green-400 transition-colors text-base">{m.level}</td>
                  <td className="px-6 py-5 font-mono text-orange-600 dark:text-yellow-400 hacker:text-green-500 font-black whitespace-nowrap bg-orange-50 dark:bg-[#1E1B2E] hacker:bg-[#0a0a0a] border-x-4 border-white dark:border-[#382E54] hacker:border-green-800 transition-colors">
                    {/* 🌟 ลูกเล่นเซนเซอร์ (Blur) ตรงนี้! */}
                    <span className="blur-[6px] hover:blur-none transition-all duration-300 cursor-crosshair select-none block w-fit">
                      {m.expectedCommand}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="font-black text-orange-950 dark:text-white hacker:text-white block mb-1 text-base transition-colors">{m.title}</span>
                    <span className="text-orange-800 dark:text-white/70 hacker:text-white/70 text-xs font-bold leading-relaxed transition-colors">{m.description}</span>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={3} className="text-center py-12 text-orange-400 dark:text-white/50 hacker:text-green-600 font-black uppercase tracking-widest transition-colors">No Linux commands registered in database.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 🌟 Component สำหรับโชว์คำสั่ง Windows จากฐานข้อมูล
function WindowsContent({ missions }: { missions: any[] }) {
  return (
    <div className="space-y-6 flex flex-col h-full">
      <div>
        <h2 className="text-3xl font-black text-orange-950 dark:text-white hacker:text-white flex items-center gap-3 mb-3 border-b-4 border-white dark:border-[#382E54] hacker:border-green-800 pb-6 cute-header transition-colors">
          <Monitor className="text-blue-500 dark:text-blue-400 hacker:text-green-500 transition-colors" size={32} strokeWidth={3} />
          Windows CMD Databank
        </h2>
        <p className="text-blue-500 dark:text-white/50 hacker:text-green-600 text-sm font-bold mt-4 uppercase tracking-widest transition-colors">รวบรวมคำสั่งพื้นฐานสำหรับการดูแลระบบ Windows Command Prompt (อัปเดตจาก Database อัตโนมัติ)</p>
      </div>

      <div className="overflow-auto flex-1 custom-scrollbar pr-2 border-4 border-white dark:border-[#382E54] hacker:border-green-800 rounded-[24px] bg-white/50 dark:bg-[#1E1B2E]/50 hacker:bg-[#0a0a0a]/50 shadow-sm transition-colors">
        <table className="w-full text-left text-sm">
          <thead className="bg-blue-100 dark:bg-[#2D223B] hacker:bg-[#111] text-blue-600 dark:text-blue-400 hacker:text-green-500 font-black text-xs uppercase tracking-widest sticky top-0 z-10 transition-colors">
            <tr>
              <th className="px-6 py-5 text-center w-16 border-b-4 border-white dark:border-[#382E54] hacker:border-green-800">Level</th>
              <th className="px-6 py-5 border-b-4 border-white dark:border-[#382E54] hacker:border-green-800">Command <span className="text-[10px] text-blue-400/80 dark:text-white/40 hacker:text-green-600/60 lowercase tracking-normal ml-1 font-bold">(Hover to Decrypt)</span></th>
              <th className="px-6 py-5 border-b-4 border-white dark:border-[#382E54] hacker:border-green-800">Operation Details</th>
            </tr>
          </thead>
          <tbody className="divide-y-4 divide-white dark:divide-[#382E54] hacker:divide-green-800 transition-colors">
            {missions.length > 0 ? (
              missions.map((m, i) => (
                <tr key={i} className="hover:bg-white dark:hover:bg-white/5 hacker:hover:bg-green-900/10 transition-colors group">
                  <td className="px-6 py-5 font-black text-blue-400 dark:text-white/50 hacker:text-green-600 text-center group-hover:text-blue-600 dark:group-hover:text-blue-400 hacker:group-hover:text-green-400 transition-colors text-base">{m.level}</td>
                  <td className="px-6 py-5 font-mono text-blue-600 dark:text-blue-400 hacker:text-green-500 font-black whitespace-nowrap bg-blue-50 dark:bg-[#1E1B2E] hacker:bg-[#0a0a0a] border-x-4 border-white dark:border-[#382E54] hacker:border-green-800 transition-colors">
                    {/* 🌟 ลูกเล่นเซนเซอร์ (Blur) ตรงนี้! */}
                    <span className="blur-[6px] hover:blur-none transition-all duration-300 cursor-crosshair select-none block w-fit">
                      {m.expectedCommand}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="font-black text-orange-950 dark:text-white hacker:text-white block mb-1 text-base transition-colors">{m.title}</span>
                    <span className="text-orange-800 dark:text-white/70 hacker:text-white/70 text-xs font-bold leading-relaxed transition-colors">{m.description}</span>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={3} className="text-center py-12 text-blue-400 dark:text-white/50 hacker:text-green-600 font-black uppercase tracking-widest transition-colors">No Windows commands registered in database.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ClearanceContent() {
  // สร้างฟังก์ชันช่วยเลือกสี Rank ตาม Theme
  const getRankThemeColors = (id: number) => {
    // โหมด Hacker: เขียวล้วนทั้งหมด
    const baseHackerColor = 'text-green-400 border-green-900 bg-[#0a0a0a]';
    // โหมด Dark: สีจัดจ้าน
    const darkMap: any = {
      1: 'dark:text-slate-300 dark:border-[#382E54] dark:bg-[#2D223B]',
      2: 'dark:text-green-400 dark:border-[#382E54] dark:bg-[#2D223B]',
      3: 'dark:text-yellow-400 dark:border-[#382E54] dark:bg-[#2D223B]',
      4: 'dark:text-blue-400 dark:border-[#382E54] dark:bg-[#2D223B]',
      5: 'dark:text-purple-400 dark:border-[#382E54] dark:bg-[#2D223B]',
      6: 'dark:text-pink-400 dark:border-[#382E54] dark:bg-[#2D223B]',
      7: 'dark:text-rose-400 dark:border-[#382E54] dark:bg-[#2D223B]',
    };
    // โหมด Cute (Light): สีพาสเทล
    const lightMap: any = {
      1: 'text-slate-500 border-slate-100 bg-white',
      2: 'text-green-500 border-green-100 bg-white',
      3: 'text-amber-500 border-amber-100 bg-white',
      4: 'text-blue-500 border-blue-100 bg-white',
      5: 'text-purple-500 border-purple-100 bg-white',
      6: 'text-pink-500 border-pink-100 bg-white',
      7: 'text-rose-500 border-rose-100 bg-white',
    };

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