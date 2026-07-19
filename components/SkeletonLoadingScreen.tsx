"use client";

// 💀 Skeleton Loading Screen — โครงหน้าจำลองระหว่างรอข้อมูล (ใช้แทน HackerLoadingScreen ทุกหน้า)
// - เป็น overlay เต็มจอ ใช้ได้ทั้งแบบ `{loading && <SkeletonLoadingScreen />}` และ `if (loading) return <SkeletonLoadingScreen />`
// - สีอิงคลาสส้ม → ธีม sakura/dragon จะ map สีให้เองผ่าน CSS variable overrides ใน globals.css

// ชิ้นส่วนสีเทาๆ กระพริบ (pulse) — สีปรับตามธีมอัตโนมัติ
const skel = 'animate-pulse rounded-full bg-orange-100 dark:bg-white/10 hacker:bg-green-900/40 transition-colors';
const skelBox = 'animate-pulse bg-orange-100 dark:bg-white/10 hacker:bg-green-900/40 transition-colors';
const card = 'bg-white/70 dark:bg-[#1E1B2E]/70 hacker:bg-[#0a0a0a]/70 border-4 border-white dark:border-[#382E54] hacker:border-[#166534] transition-colors';

export default function SkeletonLoadingScreen() {
  return (
    <div className="fixed inset-0 z-[100] bg-background overflow-hidden transition-colors duration-500" aria-hidden>
      <div className="w-full h-full flex flex-col items-center px-4 md:px-8">

        {/* แถบ Navbar จำลอง */}
        <div className="w-full max-w-6xl mt-4">
          <div className={`${card} rounded-[24px] h-14 md:h-16 px-4 md:px-6 flex items-center gap-3`}>
            <div className={`${skelBox} w-9 h-9 md:w-10 md:h-10 rounded-2xl shrink-0`} />
            <div className={`${skel} h-3.5 w-24 md:w-28`} />
            <div className="flex-1" />
            <div className={`${skel} hidden md:block h-3 w-16`} />
            <div className={`${skel} hidden md:block h-3 w-16`} />
            <div className={`${skel} hidden md:block h-3 w-16`} />
            <div className={`${skelBox} w-9 h-9 md:w-10 md:h-10 rounded-full shrink-0`} />
          </div>
        </div>

        {/* หัวข้อหน้า */}
        <div className="w-full max-w-5xl mt-8 md:mt-10 flex flex-col items-center gap-3">
          <div className={`${skel} h-5 w-32 md:w-40`} />
          <div className={`${skel} h-8 md:h-10 w-56 md:w-72`} />
        </div>

        {/* แถวการ์ดสถิติ */}
        <div className="w-full max-w-5xl mt-8 md:mt-10 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`${card} rounded-[24px] p-4 md:p-5 flex flex-col gap-3`}>
              <div className={`${skelBox} w-10 h-10 md:w-11 md:h-11 rounded-2xl`} />
              <div className={`${skel} h-3 w-2/3`} />
              <div className={`${skel} h-5 w-1/2`} />
            </div>
          ))}
        </div>

        {/* กล่องเนื้อหาหลัก — แถวรายการไล่จางลง */}
        <div className={`${card} w-full max-w-5xl mt-4 md:mt-6 rounded-[28px] overflow-hidden flex-1 mb-6 max-h-[46vh]`}>
          <div className="px-5 md:px-8 py-4 md:py-5 border-b-4 border-orange-50 dark:border-[#382E54] hacker:border-[#166534] transition-colors">
            <div className={`${skel} h-3.5 w-36 md:w-44`} />
          </div>
          <div className="px-5 md:px-8 py-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 md:gap-4 py-3.5 md:py-4" style={{ opacity: 1 - i * 0.14 }}>
                <div className={`${skelBox} w-9 h-9 md:w-10 md:h-10 rounded-xl shrink-0`} />
                <div className="flex-1 flex flex-col gap-2">
                  <div className={`${skel} h-3`} style={{ width: `${58 - i * 5}%` }} />
                  <div className={`${skel} h-2`} style={{ width: `${32 - i * 3}%` }} />
                </div>
                <div className={`${skel} h-4 w-14 md:w-20 shrink-0`} />
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
