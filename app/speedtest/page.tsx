// "use client";

// import { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import Link from 'next/link';

// // =========================================================================
// // 🌟 ฐานข้อมูลโจทย์จาก CSV (ปรับคำในวงเล็บให้เป็นคำสมมติเพื่อให้พิมพ์เล่นได้จริง)
// // =========================================================================
// const GAME_MODULES = {
//   linux_basic: [
//     { cmd: "pwd", desc: "ดูพาธ (Path) ของโฟลเดอร์ปัจจุบันที่กำลังทำงานอยู่" },
//     { cmd: "ls", desc: "แสดงรายชื่อไฟล์และโฟลเดอร์ในไดเรกทอรีปัจจุบัน" },
//     { cmd: "cd documents", desc: "เปลี่ยนเข้าไปในโฟลเดอร์ที่ระบุ" },
//     { cmd: "cd ..", desc: "ถอยกลับออกมา 1 โฟลเดอร์" },
//     { cmd: "mkdir project", desc: "สร้างโฟลเดอร์ใหม่ (Make Directory)" },
//     { cmd: "touch index.html", desc: "สร้างไฟล์เปล่าใหม่ขึ้นมา" },
//     { cmd: "rm old_file.txt", desc: "ลบไฟล์" },
//     { cmd: "cp src dest", desc: "คัดลอกไฟล์ (Copy)" },
//     { cmd: "mv old.txt new.txt", desc: "ย้ายไฟล์ (Move) หรือใช้เปลี่ยนชื่อไฟล์" },
//     { cmd: "cat log.txt", desc: "อ่านและแสดงเนื้อหาในไฟล์ข้อความออกมาบนหน้าจอ" },
//     { cmd: "clear", desc: "ล้างหน้าจอ Terminal ให้สะอาด" }
//   ]
// };

// export default function PlayPage() {
//   const router = useRouter();
//   const [user, setUser] = useState<any>(null);

//   // State ของระบบเกม
//   const [currentLevel, setCurrentLevel] = useState(0);
//   const [typedText, setTypedText] = useState('');
  
//   // สถิติและตัวจับเวลา
//   const [startTime, setStartTime] = useState<number | null>(null);
//   const [mistakes, setMistakes] = useState(0);
//   const [totalKeystrokes, setTotalKeystrokes] = useState(0);
//   const [wpm, setWpm] = useState(0);
//   const [isFinished, setIsFinished] = useState(false);
//   const [hasError, setHasError] = useState(false); 
//   const [isSuccess, setIsSuccess] = useState(false); // สำหรับอนิเมชันพิมพ์ถูก

//   const currentModule = GAME_MODULES.linux_basic;
//   const targetCommand = currentModule[currentLevel]?.cmd || "";
//   const targetDesc = currentModule[currentLevel]?.desc || "";

//   useEffect(() => {
//     const savedUser = localStorage.getItem('keyrush_user');
//     if (savedUser) {
//       setUser(JSON.parse(savedUser));
//     }
//   }, []);

//   // 🌟 โหลดระบบเสียง
//   const playSuccessSound = () => {
//     const audio = new Audio('/sounds/success.mp3');
//     audio.volume = 0.5;
//     audio.play().catch(() => {});
//   };

//   const playErrorSound = () => {
//     const audio = new Audio('/sounds/error.mp3');
//     audio.volume = 0.3;
//     audio.play().catch(() => {});
//   };

//   // 🌟 ระบบจับเวลาแบบ Real-time เพื่อคำนวณ WPM
//   useEffect(() => {
//     if (startTime && !isFinished) {
//       const interval = setInterval(() => {
//         const timeElapsed = (Date.now() - startTime) / 60000;
//         const wordsTyped = totalKeystrokes / 5;
//         setWpm(Math.round(wordsTyped / timeElapsed));
//       }, 1000);
//       return () => clearInterval(interval);
//     }
//   }, [startTime, totalKeystrokes, isFinished]);

//   // 🌟 Engine ตรวจจับการพิมพ์
//   useEffect(() => {
//     if (isFinished) return;

//     const handleKeyDown = (e: KeyboardEvent) => {
//       if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab', 'Enter'].includes(e.key)) return;
//       if (!startTime) setStartTime(Date.now());
//       setTotalKeystrokes(prev => prev + 1);

//       if (e.key === 'Backspace') {
//         setTypedText(prev => prev.slice(0, -1));
//         setHasError(false);
//         return;
//       }
//       if (e.key === ' ') e.preventDefault();

//       const nextChar = e.key;
//       const expectedChar = targetCommand[typedText.length];

//       if (nextChar === expectedChar) {
//         setHasError(false);
//         const newText = typedText + nextChar;
//         setTypedText(newText);

//         if (newText === targetCommand) {
//           playSuccessSound();
//           setIsSuccess(true);
          
//           if (currentLevel + 1 < currentModule.length) {
//             setTimeout(() => {
//               setCurrentLevel(prev => prev + 1);
//               setTypedText('');
//               setIsSuccess(false);
//             }, 400);
//           } else {
//             setIsFinished(true);
//           }
//         }
//       } else {
//         if (typedText.length < targetCommand.length) {
//           playErrorSound();
//           setMistakes(prev => prev + 1);
//           setHasError(true);
//           setTimeout(() => setHasError(false), 300);
//         }
//       }
//     };

//     window.addEventListener('keydown', handleKeyDown);
//     return () => window.removeEventListener('keydown', handleKeyDown);
//   }, [typedText, targetCommand, currentLevel, isFinished, startTime, currentModule.length]);

//   const accuracy = totalKeystrokes > 0 ? Math.max(0, Math.round(((totalKeystrokes - mistakes) / totalKeystrokes) * 100)) : 100;

//   // Render ตัวอักษร
//   const renderCommand = () => {
//     return targetCommand.split('').map((char, index) => {
//       let colorClass = "text-slate-600"; 
//       let bgClass = "";
      
//       if (index < typedText.length) {
//         colorClass = "text-[#0df259] drop-shadow-[0_0_5px_rgba(13,242,89,0.8)]";
//       } else if (index === typedText.length) {
//         colorClass = hasError ? "text-red-500 bg-red-500/20 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" : "text-white bg-white/20";
//         bgClass = "border-b-4 border-white animate-pulse";
//       }

//       return (
//         <span key={index} className={`${colorClass} ${bgClass} transition-colors duration-75 px-[2px] pb-1 mx-[1px] rounded-sm inline-block`}>
//           {char === ' ' ? '\u00A0' : char}
//         </span>
//       );
//     });
//   };

//   return (
//     <div className="flex h-screen bg-[#0c160c] font-mono text-slate-100 overflow-hidden selection:bg-[#0df259]/30">
      
//       {/* =======================================================================
//           ⬅️ ฝั่งซ้าย: Graphic / Status / Measuring Box
//       ======================================================================= */}
//       <div className="w-[45%] lg:w-[40%] flex flex-col relative border-r border-[#28392e] bg-[#102216] shadow-2xl z-20">
        
//         {/* Background Grid */}
//         <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#0df259 1px, transparent 1px), linear-gradient(90deg, #0df259 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

//         {/* Header (Back to Map) */}
//         <div className="p-6 relative z-10 flex justify-between items-center">
//           <Link href="/campaign" className="flex items-center gap-2 text-slate-400 hover:text-[#0df259] transition-colors bg-black/30 px-4 py-2 rounded-lg border border-[#28392e]">
//             <span className="material-symbols-outlined text-lg">arrow_back</span>
//             <span className="text-xs font-bold uppercase tracking-widest font-display">Abort</span>
//           </Link>
//           <div className="text-[10px] text-[#0df259] font-bold tracking-widest uppercase border border-[#0df259]/30 px-3 py-1 rounded-full bg-[#0df259]/10">
//             Linux Basics
//           </div>
//         </div>

//         {/* Graphic & Animation Area */}
//         <div className="flex-1 flex flex-col items-center justify-center p-8 relative z-10">
          
//           {/* Avatar Animation */}
//           <div className="relative mb-10">
//             <div className={`absolute inset-0 bg-[#0df259] blur-[50px] rounded-full transition-opacity duration-300 ${isSuccess ? 'opacity-40 scale-150' : 'opacity-10 scale-100'} ${hasError ? 'bg-red-500 opacity-40' : ''}`}></div>
//             <div 
//               className={`size-32 md:size-40 rounded-full border-4 shadow-2xl bg-[#0c0c0c] flex items-center justify-center z-10 relative transition-all duration-300 ${
//                 hasError ? 'border-red-500 translate-x-[-10px] scale-95' : 
//                 isSuccess ? 'border-[#0df259] translate-y-[-15px] scale-110' : 'border-[#28392e]'
//               }`}
//               style={{ backgroundImage: `url(${user?.avatar?.startsWith('data:') ? user.avatar : `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.avatar || 'Felix'}`})`, backgroundSize: 'cover' }}
//             >
//               {!user?.avatar && <span className="material-symbols-outlined text-6xl text-slate-600">smart_toy</span>}
//             </div>
//             {/* Feedback Icon */}
//             {isSuccess && <span className="absolute -top-4 -right-4 material-symbols-outlined text-[#0df259] text-5xl drop-shadow-[0_0_10px_#0df259] animate-bounce z-20">check_circle</span>}
//             {hasError && <span className="absolute -top-4 -right-4 material-symbols-outlined text-red-500 text-5xl drop-shadow-[0_0_10px_red] animate-ping z-20">warning</span>}
//           </div>

//           {/* Mission Objective */}
//           <div className="w-full bg-[#0a0f0c] border border-[#28392e] rounded-2xl p-6 text-center shadow-inner relative overflow-hidden">
//             <div className={`absolute top-0 left-0 w-full h-1 transition-colors duration-300 ${hasError ? 'bg-red-500' : isSuccess ? 'bg-[#0df259]' : 'bg-[#28392e]'}`}></div>
//             <p className="text-[#0df259] text-[10px] font-bold uppercase tracking-widest mb-3 font-display">Target Objective</p>
//             <h2 className={`text-xl md:text-2xl font-bold font-display leading-relaxed transition-colors duration-300 ${hasError ? 'text-red-300' : 'text-white'}`}>
//               {targetDesc}
//             </h2>
//           </div>
//         </div>

//         {/* Measuring / Metrics Box */}
//         <div className="p-6 md:p-8 bg-[#0a0f0c] border-t border-[#28392e] relative z-10 flex flex-col gap-6">
//           <div className="flex justify-between items-center w-full">
//             <div className="flex flex-col">
//               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Speed</span>
//               <div className="flex items-baseline gap-1">
//                 <span className="text-3xl font-black text-white">{wpm}</span>
//                 <span className="text-xs text-slate-500">WPM</span>
//               </div>
//             </div>
            
//             <div className="h-10 w-px bg-[#28392e]"></div>
            
//             <div className="flex flex-col items-end">
//               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Accuracy</span>
//               <div className="flex items-baseline gap-1">
//                 <span className={`text-3xl font-black ${accuracy < 80 ? 'text-red-400' : accuracy < 95 ? 'text-yellow-400' : 'text-[#0df259]'}`}>{accuracy}</span>
//                 <span className="text-xs text-slate-500">%</span>
//               </div>
//             </div>
//           </div>

//           <div>
//             <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
//               <span>Progress</span>
//               <span className="text-[#0df259]">{currentLevel} / {currentModule.length}</span>
//             </div>
//             <div className="w-full h-2 bg-[#1a2c20] rounded-full overflow-hidden">
//               <div className="h-full bg-[#0df259] transition-all duration-500 shadow-[0_0_10px_#0df259]" style={{ width: `${(currentLevel / currentModule.length) * 100}%` }}></div>
//             </div>
//           </div>
//         </div>

//       </div>

//       {/* =======================================================================
//           ➡️ ฝั่งขวา: Terminal Box (พื้นที่พิมพ์คำสั่ง)
//       ======================================================================= */}
//       <div className="flex-1 bg-[#050806] flex flex-col relative z-10">
        
//         {isFinished ? (
//           /* หน้าจอสรุปผลเมื่อเล่นจบด่าน */
//           <div className="flex-1 flex items-center justify-center p-10 animate-in fade-in zoom-in duration-500">
//             <div className="max-w-md w-full bg-[#0a0f0c] border border-[#0df259]/30 rounded-3xl p-10 text-center shadow-[0_0_50px_rgba(13,242,89,0.1)] relative overflow-hidden">
//               <div className="absolute top-0 left-0 w-full h-2 bg-[#0df259]"></div>
//               <div className="size-24 bg-[#0df259]/10 text-[#0df259] rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-[#0df259] shadow-[0_0_30px_rgba(13,242,89,0.3)]">
//                 <span className="material-symbols-outlined text-5xl">military_tech</span>
//               </div>
//               <h2 className="text-3xl font-black text-white font-display uppercase tracking-tight mb-2">Mission Cleared</h2>
//               <p className="text-slate-400 mb-8 font-display text-sm">System successfully updated. Excellent work, Operative.</p>
              
//               <div className="grid grid-cols-2 gap-4 mb-8">
//                 <div className="bg-black/50 p-4 rounded-xl border border-[#28392e]">
//                   <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Final WPM</p>
//                   <p className="text-3xl font-black text-white">{wpm}</p>
//                 </div>
//                 <div className="bg-black/50 p-4 rounded-xl border border-[#28392e]">
//                   <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Accuracy</p>
//                   <p className="text-3xl font-black text-[#0df259]">{accuracy}%</p>
//                 </div>
//               </div>

//               <div className="flex flex-col gap-3">
//                 <button onClick={() => router.push('/campaign')} className="w-full py-4 bg-[#0df259] text-black rounded-xl font-black hover:bg-[#0be050] transition-all uppercase tracking-widest shadow-[0_0_15px_rgba(13,242,89,0.3)] font-display hover:scale-105 active:scale-95">
//                   Continue to Map
//                 </button>
//                 <button onClick={() => { setCurrentLevel(0); setTypedText(''); setStartTime(null); setMistakes(0); setTotalKeystrokes(0); setIsFinished(false); }} className="w-full py-3 text-slate-400 hover:text-white transition-colors uppercase tracking-widest font-display text-xs font-bold">
//                   Retry Mission
//                 </button>
//               </div>
//             </div>
//           </div>
//         ) : (
//           /* หน้าจอ Terminal สำหรับพิมพ์ */
//           <div className="flex-1 flex flex-col p-8 md:p-16 relative">
            
//             {/* Terminal Header */}
//             <div className="bg-[#101a14] border border-[#28392e] rounded-t-xl px-4 py-3 flex items-center justify-between shadow-lg relative z-20">
//               <div className="flex gap-2">
//                 <div className="size-3.5 rounded-full bg-red-500/80"></div>
//                 <div className="size-3.5 rounded-full bg-yellow-500/80"></div>
//                 <div className="size-3.5 rounded-full bg-green-500/80 shadow-[0_0_5px_#22c55e]"></div>
//               </div>
//               <span className="text-xs text-slate-500 font-mono">root@keyrush: ~/training</span>
//               <div className="w-10"></div>
//             </div>
            
//             {/* Terminal Body */}
//             <div className={`flex-1 bg-[#0a0e0c] border border-t-0 border-[#28392e] rounded-b-xl p-8 shadow-2xl overflow-hidden relative transition-transform duration-75 ${hasError ? 'translate-x-2' : ''}`}>
              
//               {/* Scanline Effect */}
//               <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] pointer-events-none z-10 opacity-20"></div>

//               <div className="relative z-20 text-3xl md:text-5xl lg:text-6xl font-mono leading-relaxed mt-4 break-words">
//                 <span className="text-[#0df259] mr-4 opacity-50 select-none">$&gt;</span>
//                 <span className="relative">
//                   {renderCommand()}
                  
//                   {/* เอฟเฟกต์กระพริบแดงตอนพิมพ์ผิด (เฉพาะจุดที่พิมพ์) */}
//                   {hasError && (
//                     <div className="absolute -inset-4 bg-red-500/10 rounded-xl animate-pulse pointer-events-none blur-md"></div>
//                   )}
//                 </span>
//               </div>
              
//               {/* Instruction Hint */}
//               <div className="absolute bottom-8 left-8 text-slate-600 text-sm animate-pulse flex items-center gap-2">
//                 <span className="material-symbols-outlined text-lg">keyboard</span>
//                 Type the command above to execute
//               </div>
//             </div>
//           </div>
//         )}

//       </div>
//     </div>
//   );
// }







"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// =========================================================================
// 🌟 ฐานข้อมูลโจทย์คำสั่ง (แบ่ง Linux และ Windows ชัดเจน)
// =========================================================================
const GAME_MODULES = {
  linux: [
    { cmd: "pwd", desc: "ดูพาธ (Path) ของโฟลเดอร์ปัจจุบันที่กำลังทำงานอยู่" },
    { cmd: "ls", desc: "แสดงรายชื่อไฟล์และโฟลเดอร์ในไดเรกทอรีปัจจุบัน" },
    { cmd: "cd documents", desc: "เปลี่ยนเข้าไปในโฟลเดอร์ที่ระบุ" },
    { cmd: "cd ..", desc: "ถอยกลับออกมา 1 โฟลเดอร์" },
    { cmd: "mkdir project", desc: "สร้างโฟลเดอร์ใหม่ (Make Directory)" },
    { cmd: "touch index.html", desc: "สร้างไฟล์เปล่าใหม่ขึ้นมา" },
    { cmd: "rm old_file.txt", desc: "ลบไฟล์" },
    { cmd: "cp src dest", desc: "คัดลอกไฟล์ (Copy)" },
    { cmd: "mv old.txt new.txt", desc: "ย้ายไฟล์ (Move) หรือใช้เปลี่ยนชื่อไฟล์" },
    { cmd: "cat log.txt", desc: "อ่านและแสดงเนื้อหาในไฟล์ข้อความออกมาบนหน้าจอ" },
    { cmd: "clear", desc: "ล้างหน้าจอ Terminal ให้สะอาด" },
    { cmd: 'grep "error" server.log', desc: "ค้นหาคำหรือข้อความที่ต้องการเฉพาะเจาะจงในไฟล์" },
    { cmd: 'find / -name "config"', desc: "ค้นหาตำแหน่งของไฟล์ในระบบ" },
    { cmd: "chmod 777 script.sh", desc: "เปลี่ยนสิทธิ์การเข้าถึงไฟล์" },
    { cmd: "chown root app.js", desc: "เปลี่ยนเจ้าของไฟล์ (Change Owner)" },
    { cmd: "tar -czvf backup.tar.gz data", desc: "บีบอัดไฟล์และโฟลเดอร์ (คล้ายการทำ .zip)" },
    { cmd: "nano config.json", desc: "เปิดโปรแกรมแก้ไขข้อความ (Text Editor) แบบง่าย" },
    { cmd: "htop", desc: "ดูการทำงานของ CPU, RAM และโปรเซสแบบเรียลไทม์" },
    { cmd: "ps aux", desc: "แสดงรายการโปรเซส (Process) ทั้งหมดที่กำลังทำงาน" },
    { cmd: "kill 1234", desc: "บังคับปิดโปรเซสตามรหัส Process ID" },
    { cmd: "wget http://domain.com/file", desc: "ดาวน์โหลดไฟล์จากอินเทอร์เน็ตผ่านลิงก์" },
    { cmd: "history", desc: "ดูประวัติคำสั่งทั้งหมดที่เคยพิมพ์ไปก่อนหน้านี้" }
  ],
  windows: [
    { cmd: "dir", desc: "แสดงรายชื่อไฟล์และโฟลเดอร์ (เทียบเท่า ls ใน Linux)" },
    { cmd: "cd Documents", desc: "เปลี่ยนเข้าไปในโฟลเดอร์ที่ระบุ" },
    { cmd: "md NewFolder", desc: "สร้างโฟลเดอร์ใหม่ (ย่อมาจาก Make Directory)" },
    { cmd: "rd OldFolder", desc: "ลบโฟลเดอร์ (ย่อมาจาก Remove Directory)" },
    { cmd: "del junk.txt", desc: "ลบไฟล์" },
    { cmd: "copy a.txt b.txt", desc: "คัดลอกไฟล์" },
    { cmd: "move a.txt b.txt", desc: "ย้ายไฟล์" },
    { cmd: "type readme.txt", desc: "แสดงเนื้อหาในไฟล์ (เทียบเท่า cat ใน Linux)" },
    { cmd: "cls", desc: "ล้างหน้าจอ (เทียบเท่า clear ใน Linux)" },
    { cmd: "ipconfig", desc: "ดูหมายเลข IP Address ของเครื่อง" },
    { cmd: "ping google.com", desc: "ทดสอบการเชื่อมต่อเครือข่ายไปยังเป้าหมาย" },
    { cmd: "tasklist", desc: "ดูรายการโปรแกรมที่กำลังทำงานอยู่ (เทียบเท่า ps ใน Linux)" }
  ]
};

export default function PlayPage() {
  const router = useRouter();
  
  // State ของระบบเกม
  const [os, setOs] = useState<'linux' | 'windows'>('linux');
  const [currentLevel, setCurrentLevel] = useState(0);
  const [typedText, setTypedText] = useState('');
  
  // สถิติและตัวจับเวลา
  const [startTime, setStartTime] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [hasError, setHasError] = useState(false); // สำหรับทำเอฟเฟกต์จอแดง/สั่น

  const currentModule = GAME_MODULES[os];
  const targetCommand = currentModule[currentLevel]?.cmd || "";
  const targetDesc = currentModule[currentLevel]?.desc || "";

  // 🌟 โหลดระบบเสียง
  const playSuccessSound = () => {
    const audio = new Audio('/sounds/success.mp3');
    audio.volume = 0.5;
    audio.play().catch(e => console.log("Audio play failed:", e));
  };

  const playErrorSound = () => {
    const audio = new Audio('/sounds/error.mp3');
    audio.volume = 0.3;
    audio.play().catch(e => console.log("Audio play failed:", e));
  };

  // 🌟 ระบบจับเวลาแบบ Real-time เพื่อคำนวณ WPM
  useEffect(() => {
    if (startTime && !isFinished) {
      const interval = setInterval(() => {
        const timeElapsed = (Date.now() - startTime) / 60000; // นาที
        const wordsTyped = totalKeystrokes / 5;
        setWpm(Math.round(wordsTyped / timeElapsed));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [startTime, totalKeystrokes, isFinished]);

  // 🌟 Engine ตรวจจับการพิมพ์ (Keyboard Listener)
  useEffect(() => {
    if (isFinished) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // ป้องกันปุ่มที่ไม่ได้ใช้พิมพ์
      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab', 'Enter'].includes(e.key)) return;

      // เริ่มจับเวลาเมื่อพิมพ์ตัวแรก
      if (!startTime) setStartTime(Date.now());
      setTotalKeystrokes(prev => prev + 1);

      // จัดการ Backspace
      if (e.key === 'Backspace') {
        setTypedText(prev => prev.slice(0, -1));
        setHasError(false);
        return;
      }

      // ป้องกันการทำงานปกติของ Spacebar (เช่น เลื่อนหน้าจอลง)
      if (e.key === ' ') e.preventDefault();

      const nextChar = e.key;
      const expectedChar = targetCommand[typedText.length];

      if (nextChar === expectedChar) {
        // พิมพ์ถูก
        setHasError(false);
        const newText = typedText + nextChar;
        setTypedText(newText);

        // เช็คว่าพิมพ์จบคำสั่งหรือยัง
        if (newText === targetCommand) {
          playSuccessSound();
          if (currentLevel + 1 < currentModule.length) {
            // ไปข้อต่อไป
            setTimeout(() => {
              setCurrentLevel(prev => prev + 1);
              setTypedText('');
            }, 300);
          } else {
            // จบด่าน!
            setIsFinished(true);
          }
        }
      } else {
        // พิมพ์ผิด!
        if (typedText.length < targetCommand.length) {
          playErrorSound();
          setMistakes(prev => prev + 1);
          setHasError(true);
          // เอฟเฟกต์จอแดงจะหายไปเองใน 300ms
          setTimeout(() => setHasError(false), 300);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [typedText, targetCommand, currentLevel, isFinished, startTime, currentModule.length]);

  // คำนวณความแม่นยำ
  const accuracy = totalKeystrokes > 0 ? Math.max(0, Math.round(((totalKeystrokes - mistakes) / totalKeystrokes) * 100)) : 100;

  // 🌟 ฟังก์ชันเรนเดอร์ตัวอักษรสีตามสถานะการพิมพ์
  const renderCommand = () => {
    return targetCommand.split('').map((char, index) => {
      let colorClass = "text-slate-500"; // ยังไม่ได้พิมพ์
      let bgClass = "";
      
      if (index < typedText.length) {
        colorClass = "text-[#0df259] drop-shadow-[0_0_5px_rgba(13,242,89,0.8)]"; // พิมพ์ถูก
      } else if (index === typedText.length) {
        colorClass = hasError ? "text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" : "text-white";
        bgClass = hasError ? "bg-red-500/20" : "bg-white/10 border-b-2 border-white animate-pulse"; // Cursor
      }

      return (
        <span key={index} className={`${colorClass} ${bgClass} transition-colors duration-100 px-[1px] rounded-sm`}>
          {char === ' ' ? '\u00A0' : char}
        </span>
      );
    });
  };

  return (
    <div className="min-h-screen bg-background-dark text-slate-100 font-mono flex flex-col selection:bg-primary/30 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[url('https://cdn.pixabay.com/photo/2021/11/20/06/07/grid-6810967_1280.png')] opacity-[0.02] bg-cover bg-fixed pointer-events-none"></div>
      <div className={`absolute top-0 left-0 w-full h-full pointer-events-none transition-colors duration-300 ${hasError ? 'bg-red-500/5' : 'bg-transparent'}`}></div>

      {/* Header Bar */}
      <header className="flex items-center justify-between px-6 py-4 bg-black/40 border-b border-[#28392e] backdrop-blur-md relative z-10">
        <Link href="/campaign" className="flex items-center gap-2 text-slate-400 hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-xl">arrow_back</span>
          <span className="font-display font-bold text-sm tracking-wider uppercase hidden sm:inline">Abort Mission</span>
        </Link>

        {/* OS Selector (สำหรับทดสอบ) */}
        <div className="flex bg-[#1a2c20] rounded-lg p-1 border border-[#28392e]">
          <button 
            onClick={() => { setOs('linux'); setCurrentLevel(0); setTypedText(''); setStartTime(null); setMistakes(0); setTotalKeystrokes(0); setIsFinished(false); }}
            className={`px-4 py-1 rounded-md text-xs font-bold uppercase tracking-widest transition-all ${os === 'linux' ? 'bg-[#0df259] text-black shadow-[0_0_10px_rgba(13,242,89,0.3)]' : 'text-slate-400 hover:text-white'}`}
          >
            Linux
          </button>
          <button 
            onClick={() => { setOs('windows'); setCurrentLevel(0); setTypedText(''); setStartTime(null); setMistakes(0); setTotalKeystrokes(0); setIsFinished(false); }}
            className={`px-4 py-1 rounded-md text-xs font-bold uppercase tracking-widest transition-all ${os === 'windows' ? 'bg-[#00a4ef] text-black shadow-[0_0_10px_rgba(0,164,239,0.3)]' : 'text-slate-400 hover:text-white'}`}
          >
            Windows
          </button>
        </div>

        {/* Stats */}
        <div className="flex gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-display font-bold">WPM</span>
            <span className="text-xl font-black text-white">{wpm}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-display font-bold">Accuracy</span>
            <span className={`text-xl font-black ${accuracy < 80 ? 'text-red-400' : accuracy < 95 ? 'text-yellow-400' : 'text-[#0df259]'}`}>
              {accuracy}%
            </span>
          </div>
        </div>
      </header>

      {/* Main Terminal Engine */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        
        {!isFinished ? (
          <div className={`w-full max-w-4xl flex flex-col gap-8 transition-transform duration-75 ${hasError ? 'translate-x-2' : ''}`}>
            
            {/* Progress Bar */}
            <div className="w-full flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Progress</span>
              <span className="text-xs font-bold text-[#0df259] uppercase tracking-widest">{currentLevel + 1} / {currentModule.length}</span>
            </div>
            <div className="w-full h-1 bg-[#1a2c20] rounded-full overflow-hidden">
              <div className="h-full bg-[#0df259] transition-all duration-300 shadow-[0_0_10px_#0df259]" style={{ width: `${((currentLevel) / currentModule.length) * 100}%` }}></div>
            </div>

            {/* Mission Briefing */}
            <div className="bg-[#162e1e] border border-[#0df259]/30 p-6 rounded-2xl shadow-[0_0_30px_rgba(13,242,89,0.05)] relative overflow-hidden text-center mt-6">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#0df259]"></div>
              <p className="text-[10px] font-bold text-[#0df259] uppercase tracking-widest mb-2 font-display">Current Objective</p>
              <h2 className="text-2xl md:text-3xl font-display font-bold text-white leading-tight">
                {targetDesc}
              </h2>
            </div>

            {/* Terminal Input Box */}
            <div className="bg-[#0a0f0c] border border-[#28392e] rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] mt-4">
              <div className="bg-[#101a14] border-b border-[#28392e] px-4 py-2 flex items-center gap-2">
                <div className="size-3 rounded-full bg-red-500/50"></div>
                <div className="size-3 rounded-full bg-yellow-500/50"></div>
                <div className="size-3 rounded-full bg-green-500/50"></div>
                <span className="ml-2 text-xs text-slate-500">root@keyrush: ~/{os}-training</span>
              </div>
              
              <div className="p-8 md:p-12 text-2xl md:text-5xl font-mono leading-relaxed min-h-[200px] flex items-center tracking-wide overflow-x-auto whitespace-nowrap custom-scrollbar">
                <span className={`${os === 'linux' ? 'text-[#0df259]' : 'text-[#00a4ef]'} mr-4 shrink-0 opacity-50 select-none`}>$</span>
                <div className="relative">
                  {renderCommand()}
                  
                  {/* เอฟเฟกต์กระพริบเตือนตอนพิมพ์ผิด */}
                  {hasError && (
                    <div className="absolute -inset-2 bg-red-500/10 rounded-lg animate-pulse pointer-events-none blur-sm"></div>
                  )}
                </div>
              </div>
            </div>
            
            <p className="text-center text-slate-500 text-sm mt-4 animate-pulse">
              Start typing to begin...
            </p>

          </div>
        ) : (
          
          /* 🌟 หน้าจอสรุปผล (Result Screen) 🌟 */
          <div className="w-full max-w-2xl bg-[#162e1e] border border-[#0df259] rounded-3xl p-10 text-center shadow-[0_0_50px_rgba(13,242,89,0.2)] animate-in zoom-in duration-500">
            <div className="size-24 bg-[#0df259]/20 text-[#0df259] rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-[#0df259] shadow-[0_0_30px_rgba(13,242,89,0.5)]">
              <span className="material-symbols-outlined text-5xl">task_alt</span>
            </div>
            <h2 className="text-4xl font-black text-white font-display uppercase tracking-tight mb-2">Module Cleared!</h2>
            <p className="text-slate-400 mb-8 font-display">You've successfully completed the {os.toUpperCase()} Basics training.</p>
            
            <div className="grid grid-cols-2 gap-4 mb-10">
              <div className="bg-[#0a0f0c] p-6 rounded-2xl border border-[#28392e]">
                <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Typing Speed</p>
                <p className="text-4xl font-black text-white">{wpm} <span className="text-sm text-slate-500 font-normal">WPM</span></p>
              </div>
              <div className="bg-[#0a0f0c] p-6 rounded-2xl border border-[#28392e]">
                <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Accuracy</p>
                <p className={`text-4xl font-black ${accuracy < 80 ? 'text-red-400' : accuracy < 95 ? 'text-yellow-400' : 'text-[#0df259]'}`}>{accuracy}%</p>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => { setCurrentLevel(0); setTypedText(''); setStartTime(null); setMistakes(0); setTotalKeystrokes(0); setIsFinished(false); }}
                className="flex-1 py-4 bg-transparent border border-slate-600 text-slate-300 rounded-xl font-bold hover:bg-slate-800 hover:text-white transition-all uppercase tracking-widest font-display"
              >
                Retry Mission
              </button>
              <button 
                onClick={() => router.push('/campaign')}
                className="flex-1 py-4 bg-[#0df259] text-black rounded-xl font-black hover:bg-[#0be050] transition-all uppercase tracking-widest shadow-[0_0_20px_rgba(13,242,89,0.4)] hover:scale-105 active:scale-95 font-display"
              >
                Continue
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}