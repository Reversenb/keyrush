"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Folder } from 'lucide-react';

// 1. สร้าง Props รับข้อมูลโฟลเดอร์ที่เป็น Array ของ String
interface GraphicBoxProps {
  folders: string[];
}

export default function GraphicBox({ folders }: GraphicBoxProps) {
  return (
    <div className="w-full h-full min-h-[500px] bg-white dark:bg-[#1E1B2E] hacker:bg-[#0a0a0a] border-4 border-white dark:border-[#382E54] hacker:border-[#166534] shadow-sm rounded-[32px] p-6 md:p-8 flex flex-col relative overflow-hidden transition-colors duration-500">

      {/* 🌸 สไตล์สำหรับ Cute Header 🌸 */}
      <style>{`
        .cute-header {
          text-shadow: 2px 2px 0px rgba(255, 255, 255, 1), -1px -1px 0px rgba(255, 255, 255, 1), 1px -1px 0px rgba(255, 255, 255, 1), -1px 1px 0px rgba(255, 255, 255, 1);
          letter-spacing: -0.02em;
        }
        .dark .cute-header { text-shadow: 2px 2px 0px rgba(0, 0, 0, 0.4); }
        .hacker .cute-header { text-shadow: 2px 2px 0px rgba(0, 0, 0, 0.8); }

        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(249,115,22,0.2); border-radius: 4px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(250,204,21,0.2); }
        .hacker .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(34,197,94,0.2); }
      `}</style>

      {/* 🌟 Header Section 🌟 */}
      <div className="mb-6 z-10 flex flex-col gap-3">
        <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
          <h2 className="text-2xl md:text-3xl font-black text-orange-950 dark:text-white hacker:text-green-500 cute-header transition-colors">
            ภารกิจ: สร้างโฟลเดอร์ใหม่
          </h2>
          <span className="bg-blue-100 dark:bg-blue-500/20 hacker:bg-[#111] text-blue-600 dark:text-blue-400 hacker:text-green-600 border-2 border-white dark:border-transparent hacker:border-green-800 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm transition-colors">
            Level 1
          </span>
        </div>
        <p className="text-orange-800 dark:text-white/70 hacker:text-green-600/70 font-bold text-sm transition-colors">
          ลองพิมพ์คำสั่ง <code className="bg-orange-100 dark:bg-yellow-400/10 hacker:bg-[#111] px-3 py-1 rounded-[12px] border-2 border-white dark:border-transparent hacker:border-green-800 text-orange-600 dark:text-yellow-400 hacker:text-green-400 font-black shadow-sm mx-1 transition-colors">mkdir folderA</code> ดูสิ
        </p>
      </div>

      {/* 🌟 Content Area 🌟 */}
      <div className="flex-1 bg-orange-50 dark:bg-[#2D223B]/50 hacker:bg-[#111] rounded-[24px] border-4 border-dashed border-orange-200 dark:border-[#4B3965] hacker:border-green-800 p-6 relative z-10 transition-colors duration-500 overflow-y-auto custom-scrollbar">

        {/* 2. เงื่อนไขการแสดงผล: ถ้าไม่มีโฟลเดอร์เลย ให้แสดงข้อความรอรับคำสั่ง */}
        {folders.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-orange-400 dark:text-white/30 hacker:text-green-800 font-black uppercase tracking-widest text-sm animate-pulse transition-colors">
              รอรับคำสั่งจาก Terminal...
            </p>
          </div>
        ) : (
          /* 3. ถ้ามีโฟลเดอร์ ให้นำมาวนลูป (map) แสดงรูปโฟลเดอร์พร้อมแอนิเมชัน */
          <div className="flex gap-6 flex-wrap content-start h-full">
            <AnimatePresence>
              {folders.map((folderName, index) => (
                <motion.div
                  key={`${folderName}-${index}`}
                  initial={{ scale: 0, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0, opacity: 0, filter: 'blur(10px)' }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="flex flex-col items-center group cursor-pointer p-4 border-4 border-transparent rounded-[24px] hover:bg-white dark:hover:bg-[#382E54] hacker:hover:bg-[#166534]/30 hover:border-orange-100 dark:hover:border-transparent hacker:hover:border-green-700 transition-all aspect-square justify-center"
                >
                  <Folder
                    size={48}
                    strokeWidth={2}
                    className="text-amber-400 dark:text-yellow-400 hacker:text-green-500 fill-amber-100 dark:fill-yellow-600/30 hacker:fill-green-900/50 group-hover:scale-110 transition-transform duration-300 drop-shadow-sm"
                  />
                  <span className="text-[11px] font-black text-orange-950 dark:text-white hacker:text-green-500 truncate w-full max-w-[100px] text-center mt-3 bg-white dark:bg-[#1E1B2E] hacker:bg-[#0a0a0a] px-2 py-1 rounded-lg border-2 border-orange-50 dark:border-[#382E54] hacker:border-green-800 shadow-sm transition-colors">
                    {folderName}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

    </div>
  );
}