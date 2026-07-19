import { ImageResponse } from 'next/og';

// 🖼️ รูป Banner ตอนแชร์ลิงก์ — เรนเดอร์สดเป็น PNG จากโค้ด (คมชัดกว่าไฟล์ JPG)
// หน้าตาล้อ hero ของหน้าแรก (app/page.tsx) ธีม Cute แต่จัดทุกอย่างไว้กึ่งกลาง
export const runtime = 'edge';
export const alt = 'KeyRush — ฝึกพิมพ์คำสั่ง Terminal';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// ตัวอักษรทั้งหมดที่ใช้ในรูป — ส่งให้ Google Fonts ตัด subset เฉพาะที่ใช้จริง (โหลดไวมาก)
const USED_TEXT =
  'KeyRush>_ระบบฝึกพิมพ์คำสั่งMasterthCommandLineLinux&Windowsในระบบจำลองสนุกปลอดภัยเก่งขึ้นชัวร์เริ่มเลย!บทรีน ';

// โหลดฟอนต์ Prompt (รองรับไทย) — ต้องเป็น ttf/otf เท่านั้น Satori อ่าน woff2 ไม่ได้
async function loadPrompt(weight: number): Promise<ArrayBuffer | null> {
  try {
    const url = `https://fonts.googleapis.com/css2?family=Prompt:wght@${weight}&text=${encodeURIComponent(USED_TEXT)}`;
    const css = await (await fetch(url)).text();
    const src = css.match(/src:\s*url\((.+?)\)\s*format\('(?:opentype|truetype)'\)/);
    if (!src) return null;
    return await (await fetch(src[1])).arrayBuffer();
  } catch {
    return null; // โหลดฟอนต์ไม่ได้ก็ยังเรนเดอร์รูปออก ดีกว่าพัง 500
  }
}

export default async function OgImage() {
  const [bold, regular] = await Promise.all([loadPrompt(700), loadPrompt(400)]);

  const fonts = [
    ...(bold ? [{ name: 'Prompt', data: bold, weight: 700 as const, style: 'normal' as const }] : []),
    ...(regular ? [{ name: 'Prompt', data: regular, weight: 400 as const, style: 'normal' as const }] : []),
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fff7ed',
          // ดวงแสงนุ่มๆ มุมจอ ล้อ background blobs ของหน้าแรก
          // ⚠️ ต้องไล่ไปหาสีเดิมที่ alpha 0 (ไม่ใช้ transparent) ไม่งั้นจะไล่ผ่านดำโปร่ง เกิดฝ้าเทาขุ่น
          backgroundImage:
            'radial-gradient(circle at 88% 8%, rgba(251,146,60,0.35), rgba(251,146,60,0) 45%), radial-gradient(circle at 8% 92%, rgba(251,191,36,0.32), rgba(251,191,36,0) 48%), radial-gradient(circle at 15% 12%, rgba(253,186,116,0.25), rgba(253,186,116,0) 38%)',
          fontFamily: 'Prompt',
          padding: 56,
        }}
      >
        {/* โลโก้ KeyRush (กล่องส้มเอียง + ชื่อ) เหมือนหัวเว็บ */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 26 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 66,
              height: 66,
              borderRadius: 20,
              backgroundColor: '#f97316',
              border: '3px solid #ffffff',
              transform: 'rotate(-6deg)',
              color: '#ffffff',
              fontSize: 34,
              fontWeight: 700,
            }}
          >
            &gt;_
          </div>
          <div style={{ display: 'flex', fontSize: 46, fontWeight: 700, color: '#ea580c' }}>KeyRush</div>
        </div>

        {/* ป้ายเล็ก "ระบบฝึกพิมพ์คำสั่ง" */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 30px',
            borderRadius: 999,
            backgroundColor: '#ffffff',
            color: '#f97316',
            fontSize: 26,
            fontWeight: 700,
            boxShadow: '0 4px 0 #ffedd5',
            marginBottom: 28,
          }}
        >
          <div style={{ display: 'flex', width: 14, height: 14, borderRadius: 14, backgroundColor: '#f97316' }} />
          ระบบฝึกพิมพ์คำสั่ง
        </div>

        {/* หัวข้อหลัก 2 บรรทัด (ขาวขอบเงาแบบ cute-header) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            fontSize: 92,
            fontWeight: 700,
            lineHeight: 1.12,
            letterSpacing: -2,
            textShadow: '3px 3px 0px #ffffff',
          }}
        >
          <div style={{ display: 'flex', color: '#431407' }}>Master the</div>
          <div style={{ display: 'flex', color: '#f97316' }}>Command Line</div>
        </div>

        {/* คำโปรย */}
        <div
          style={{
            display: 'flex',
            marginTop: 22,
            fontSize: 27,
            fontWeight: 400,
            color: '#9a3412',
            textAlign: 'center',
          }}
        >
          ฝึกพิมพ์คำสั่ง Linux &amp; Windows ในระบบจำลอง สนุก ปลอดภัย เก่งขึ้นชัวร์
        </div>

        {/* ปุ่ม 3D แบบเดียวกับหน้าแรก */}
        <div style={{ display: 'flex', gap: 22, marginTop: 40 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '20px 44px',
              borderRadius: 30,
              backgroundColor: '#f97316',
              border: '4px solid #ffffff',
              boxShadow: '0 8px 0 #c2410c',
              color: '#ffffff',
              fontSize: 29,
              fontWeight: 700,
            }}
          >
            เริ่มฝึกพิมพ์เลย!
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '20px 44px',
              borderRadius: 30,
              backgroundColor: '#ffffff',
              border: '4px solid #fed7aa',
              boxShadow: '0 8px 0 #fed7aa',
              color: '#ea580c',
              fontSize: 29,
              fontWeight: 700,
            }}
          >
            บทเรียน
          </div>
        </div>
      </div>
    ),
    { ...size, ...(fonts.length > 0 ? { fonts } : {}) }
  );
}
