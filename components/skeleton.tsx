"use client";

// 💀 ชุดชิ้นส่วน Skeleton Loading กลาง — แต่ละหน้าหยิบไปประกอบเป็นโครงของตัวเอง (แนวเดียวกับหน้า leaderboard)
// - ใช้แต่คลาส Tailwind variant (dark:/hacker:) ไม่แตะ useTheme → ปลอดภัยจาก hydration mismatch
// - โทนส้มจะถูก map เป็นชมพู (sakura) / แดง (dragon) เองผ่าน CSS variable overrides ใน globals.css

import Navbar from './Navbar';

// แท่ง/กล่องกระพริบ
export const sk = 'animate-pulse bg-orange-100 dark:bg-white/10 hacker:bg-green-900/40 transition-colors';
// กรอบการ์ดจางๆ ตามธีม
export const skCard = 'bg-white/70 dark:bg-[#1E1B2E]/70 hacker:bg-[#0a0a0a]/70 border-4 border-white dark:border-[#382E54] hacker:border-[#166534] transition-colors';

// โครงหน้าเต็ม: พื้นหลัง + Navbar จริง + คอนเทนเนอร์กลาง — เนื้อในส่งเป็น children
export function PageSkeleton({ children, maxW = 'max-w-6xl', navbar = true }: { children: React.ReactNode; maxW?: string; navbar?: boolean }) {
  return (
    <div className="min-h-screen w-full bg-background transition-colors duration-500">
      {navbar && <div className="relative z-50"><Navbar theme="linux" /></div>}
      <div className={`w-full ${maxW} mx-auto px-3 sm:px-4 md:px-8 pt-5 md:pt-8 pb-16 animate-in fade-in duration-300`} aria-hidden>
        {children}
      </div>
    </div>
  );
}

// หัวข้อหน้าแบบกลางจอ (ป้ายเล็ก + ชื่อใหญ่)
export function SkelHeader() {
  return (
    <div className="flex flex-col items-center gap-3 mb-6 md:mb-8">
      <div className={`${sk} rounded-full h-6 w-32 md:w-40`} />
      <div className={`${sk} rounded-2xl h-8 md:h-11 w-52 md:w-80`} />
    </div>
  );
}

// แถวการ์ดสถิติ
export function SkelStatCards({ n = 4, cols = 'grid-cols-2 md:grid-cols-4' }: { n?: number; cols?: string }) {
  return (
    <div className={`grid ${cols} gap-3 md:gap-4 mb-4 md:mb-6`}>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className={`${skCard} rounded-[24px] p-4 md:p-5 flex flex-col gap-3`}>
          <div className={`${sk} rounded-2xl w-10 h-10 md:w-11 md:h-11`} />
          <div className={`${sk} rounded-full h-3 w-2/3`} />
          <div className={`${sk} rounded-full h-5 w-1/2`} />
        </div>
      ))}
    </div>
  );
}

// ตารางรายชื่อ/รายการแนวนอน — แถวไล่จางลง
export function SkelListRows({ n = 6, header = true }: { n?: number; header?: boolean }) {
  return (
    <div className={`${skCard} rounded-[28px] overflow-hidden`}>
      {header && (
        <div className="px-4 md:px-8 py-4 md:py-5 border-b-4 border-orange-50 dark:border-[#382E54] hacker:border-[#166534] transition-colors">
          <div className={`${sk} rounded-full h-3.5 w-36 md:w-44`} />
        </div>
      )}
      <div className="px-4 md:px-8 py-2">
        {Array.from({ length: n }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 md:gap-4 py-3.5 md:py-4" style={{ opacity: 1 - i * (0.75 / n) }}>
            <div className={`${sk} rounded-xl w-9 h-9 md:w-10 md:h-10 shrink-0`} />
            <div className="flex-1 flex flex-col gap-2">
              <div className={`${sk} rounded-full h-3`} style={{ width: `${58 - i * 4}%` }} />
              <div className={`${sk} rounded-full h-2`} style={{ width: `${32 - i * 2}%` }} />
            </div>
            <div className={`${sk} rounded-full h-4 w-14 md:w-20 shrink-0`} />
          </div>
        ))}
      </div>
    </div>
  );
}

// กริดการ์ดสินค้า/ภารกิจ
export function SkelGridCards({ n = 6, cols = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' }: { n?: number; cols?: string }) {
  return (
    <div className={`grid ${cols} gap-3 md:gap-5`}>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className={`${skCard} rounded-[24px] p-4 md:p-5 flex flex-col gap-3`} style={{ opacity: 1 - i * (0.6 / n) }}>
          <div className={`${sk} rounded-2xl w-full h-24 md:h-28`} />
          <div className={`${sk} rounded-full h-4 w-3/4`} />
          <div className={`${sk} rounded-full h-3 w-1/2`} />
          <div className={`${sk} rounded-xl h-9 w-full mt-1`} />
        </div>
      ))}
    </div>
  );
}

// กล่อง Terminal เล่นเกม (HUD บน + จอคำสั่ง + ช่องพิมพ์)
export function SkelTerminal() {
  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className={`${sk} rounded-2xl h-10 w-28 md:w-36`} />
        <div className="flex gap-2">
          <div className={`${sk} rounded-2xl h-10 w-16 md:w-24`} />
          <div className={`${sk} rounded-2xl h-10 w-16 md:w-24`} />
        </div>
      </div>
      <div className={`${skCard} rounded-[28px] p-5 md:p-8 flex flex-col gap-4`}>
        <div className="flex gap-2 mb-2">
          <div className={`${sk} rounded-full w-3 h-3`} />
          <div className={`${sk} rounded-full w-3 h-3`} />
          <div className={`${sk} rounded-full w-3 h-3`} />
        </div>
        <div className={`${sk} rounded-full h-4 w-11/12`} />
        <div className={`${sk} rounded-full h-4 w-2/3`} />
        <div className={`${sk} rounded-full h-4 w-3/4`} />
        <div className={`${sk} rounded-full h-4 w-1/2`} />
      </div>
      <div className={`${skCard} rounded-[24px] h-14 md:h-16`} />
    </div>
  );
}

// ปฏิทิน (หน้า History)
export function SkelCalendar() {
  return (
    <div className={`${skCard} rounded-[28px] p-4 md:p-6`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`${sk} rounded-full h-4 w-28`} />
        <div className="flex gap-2">
          <div className={`${sk} rounded-xl w-9 h-9`} />
          <div className={`${sk} rounded-xl w-9 h-9`} />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className={`${sk} rounded-xl aspect-square`} style={{ opacity: 0.35 + ((i * 7) % 10) / 18 }} />
        ))}
      </div>
    </div>
  );
}
